import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import ApiError from "../exceptions/ApiError.js";
import { decreaseProductStock, restoreProductStock } from "./productService.js";
import { validateCoupon, calculateDiscountAmount, applyCouponAtomic } from "./couponService.js";

/**
 * TODO (Phase 2): thay hàm tạm này bằng `viettelPostService.calculateFee()` gọi API thật.
 * Hiện tại trả về mức phí cố định để test được luồng checkout mà chưa cần tài khoản ViettelPost.
 */
// const estimateShippingFee = () => 30000;

/**
 * Tạo đơn hàng từ các item đã tích chọn (isSelected=true) trong giỏ hàng của user.
 * Đây là hàm lõi cho API POST /order/checkout - DÙNG CHUNG cho mọi phương thức thanh toán
 * (COD/SEPAY/MOMO/VNPAY). Khác nhau chỉ ở bước xử lý SAU KHI hàm này trả về (xem orderController).
 *
 * Dùng transaction (session) vì hàm này ghi vào NHIỀU collection cùng lúc (Product, Coupon, Order,
 * Cart) - nếu 1 bước lỗi giữa chừng (VD: tạo Order lỗi sau khi đã trừ tồn kho), toàn bộ phải
 * rollback để không bị lệch dữ liệu (trừ kho rồi nhưng không có đơn hàng tương ứng).
 */

//
 const estimateShippingFee =async () => {
    return 30000;
 }
export const createOrderFromCart = async (userId, payload) => {
    const { shippingAddress, couponCode, paymentMethod, note } = payload;

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
        throw new ApiError(404, "Giỏ hàng của bạn đang trống");
    }

    const selectedItems = cart.items.filter((item) => item.isSelected);
    if (selectedItems.length === 0) {
        throw new ApiError(400, "Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Check tồn kho lần cuối + trừ tồn kho thật cho từng item
        //    (giá/tồn kho có thể đã đổi từ lúc khách thêm vào giỏ tới giờ, nên phải check lại)
        for (const item of selectedItems) {
            await decreaseProductStock(item.product, item.color, item.size, item.quantity, session);
        }

        // 2. Snapshot danh sách item cho Order (chép nguyên từ Cart tại thời điểm đặt hàng)
        const orderItems = selectedItems.map((item) => ({
            product: item.product,
            name: item.name,
            color: item.color,
            size: item.size,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            thumbnail: item.thumbnail
        }));

        const itemsSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // 3. Tính phí ship (Phase 1: giá trị tạm - xem TODO ở đầu file)
        const shippingFee = estimateShippingFee();

        // 4. Áp coupon nếu có (validate trước, apply atomic sau khi chắc chắn sẽ tạo đơn)
        let coupon = null;
        let discountAmount = 0;
        if (couponCode) {
            coupon = await validateCoupon(couponCode, itemsSubtotal);
            discountAmount = calculateDiscountAmount(coupon, itemsSubtotal);
            await applyCouponAtomic(coupon._id, session);
        }

        const finalAmount = itemsSubtotal + shippingFee - discountAmount;

        // 5. Tạo Order - COD thì không có hạn thanh toán, online payment thì có 15 phút để thanh toán
        const [order] = await Order.create(
            [
                {
                    user: userId,
                    items: orderItems,
                    shippingAddress,
                    shippingInfo: { shippingFee },
                    paymentInfo: { method: paymentMethod, status: "PENDING" },
                    paymentDueAt: paymentMethod === "COD" ? null : new Date(Date.now() + 15 * 60 * 1000),
                    financials: { itemsSubtotal, shippingFee, discountAmount, finalAmount },
                    coupon: coupon ? { couponId: coupon._id, code: coupon.code, discountAmount } : undefined,
                    orderStatus: "PENDING",
                    note: note || "",
                    timeline: [{ type: "ORDER", status: "PENDING", note: "Đơn hàng được tạo" }]
                }
            ],
            { session }
        );

        // 6. Xóa các item vừa đặt khỏi giỏ hàng (chỉ xóa item đã chọn, giữ lại item chưa chọn)
        cart.items = cart.items.filter((item) => !item.isSelected);
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

/**
 * Lấy danh sách đơn hàng của user hiện tại (phân trang, filter theo trạng thái)
 */
export const getMyOrders = async (userId, { page = 1, limit = 10, status } = {}) => {
    const filter = { user: userId };
    if (status) filter.orderStatus = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Order.countDocuments(filter)
    ]);

    return { orders, total, page: Number(page), limit: Number(limit) };
};

/**
 * Lấy chi tiết 1 đơn hàng (kèm check quyền sở hữu - chỉ chủ đơn mới xem được)
 */
export const getOrderDetail = async (userId, orderCode) => {
    const order = await Order.findOne({ orderCode: orderCode.toUpperCase(), user: userId });
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");
    return order;
};

/**
 * Hủy đơn hàng - chỉ cho phép khi đơn còn PENDING hoặc PROCESSING (chưa bàn giao vận chuyển).
 * Phải hoàn lại tồn kho đã trừ lúc tạo đơn (bước 1 của createOrderFromCart).
 */
export const cancelOrder = async (userId, orderCode, reason) => {
    const order = await Order.findOne({ orderCode: orderCode.toUpperCase(), user: userId });
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");

    if (!["PENDING", "PROCESSING"].includes(order.orderStatus)) {
        throw new ApiError(400, "Đơn hàng này không thể hủy ở trạng thái hiện tại");
    }

    for (const item of order.items) {
        await restoreProductStock(item.product, item.color, item.size, item.quantity);
    }

    order.orderStatus = "CANCELLED";
    order.cancelReason = reason || "Khách hàng tự hủy đơn";
    order.timeline.push({
        type: "ORDER",
        status: "CANCELLED",
        updatedBy: userId,
        note: order.cancelReason
    });

    await order.save();
    return order;
};
