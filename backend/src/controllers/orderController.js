import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ApiError from "../exceptions/ApiError.js";
import * as orderService from "../services/orderService.js";
import { calculateFee } from "../services/viettelPostService.js";
import { success } from "../utils/success.js";

/**
 * 1. Tạo đơn hàng từ giỏ hàng (Checkout) - dùng chung cho MỌI phương thức thanh toán.
 * Nếu COD: xong luôn, không cần bước nào tiếp theo.
 * Nếu SEPAY/MOMO/VNPAY: FE nhận orderCode trả về rồi gọi tiếp POST /payment/:orderCode/create
 * để lấy QR/link thanh toán (API đó nằm ở paymentController, chưa làm trong Phase 1 này).
 */
// export const checkoutController = async (req, res, next) => {
//     try {
//         const userId = req.user._id;
//         const order = await orderService.createOrderFromCart(userId, req.body);

//         const message =
//             order.paymentInfo.method === "COD"
//                 ? "Đặt hàng thành công"
//                 : "Tạo đơn hàng thành công, vui lòng tiến hành thanh toán";

//         success(res, order, message, 201);
//     } catch (error) {
//         next(error);
//     }
// };

export const checkoutController = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user.id
        const {shippingAddress,paymentMethod, couponCode,note} = req.body;
        // lấy card từ id người dùng
        const cart = await Cart.findOne({ user: userId })
        if (!cart || cart.items.length === 0) {
            throw new ApiError(404, "Giỏ hàng của bạn đang trống");
        }
        const selectedItems = cart?.items?.filter(item => item.isSelected)
        if (!selectedItems || selectedItems.length === 0) {
            throw new ApiError(400, "Vui lòng chọn ít nhất 1 sản phẩm");
        }
        let totalWeight = 0; 
        // kiểm tra xem sản phẩm còn hàng không 
        for( const item of selectedItems){
             const product = await Product.findById(item.product).session(session);
            if (!product || product.isActive === false || product.deletedAt) {
                throw new ApiError(404, `Sản phẩm '${item.name}' không còn tồn tại hoặc đã ngừng kinh doanh`);
            }
            if (product.variants && product.variants.length > 0) {
                const colorVar = product.variants.find(
                    (v) => v.color.trim().toLowerCase() === item.color.trim().toLowerCase()
                );
                if (!colorVar) throw new ApiError(400, `Phân loại màu '${item.color}' không còn tồn tại`);

                const sizeOpt = colorVar.sizes.find(
                    (s) => s.size.trim().toLowerCase() === item.size.trim().toLowerCase()
                );
                if (!sizeOpt) throw new ApiError(400, `Kích cỡ '${item.size}' không còn tồn tại`);
                if (sizeOpt.stock < item.quantity) {
                    throw new ApiError(400, `Sản phẩm '${item.name}' (${item.color}/${item.size}) không đủ tồn kho`);
                }
                
                sizeOpt.stock -= item.quantity;
            } else {
                if (product.stock < item.quantity) {
                    throw new ApiError(400, `Sản phẩm '${item.name}' không đủ tồn kho`);
                }
                product.stock -= item.quantity;
            }
            totalWeight += (product.weight || 300) * item.quantity;
             product.sold += item.quantity;
            await product.save({ session });    

        }
        // map dữ liệu cho item order
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
         const codAmount = paymentMethod === "COD" ? itemsSubtotal : 0;
         //Tính phí ship
         const shippingFee = await calculateFee(
            {
                provinceId: shippingAddress.provinceId,
                wardId: shippingAddress.wardId,
                weight: totalWeight,
                productPrice: itemsSubtotal,
                codAmount
            }
         )
        // Lọc lấy phí ship tương ứng với gói cước khách chọn
        const selectedOption = shippingFee?.find(opt => opt.serviceCode === (req.body.shippingService || "VTK")) || shippingFee?.[0];
        const finalShippingFee = selectedOption?.fee || 50000;

        const finalAmount = itemsSubtotal + finalShippingFee;

        // Tạo đơn hàng mới trong DB
        const [newOrder] = await Order.create(
            [
                {
                    user: userId,
                    items: orderItems,
                    shippingAddress: {
                        receiverName: shippingAddress.receiverName,
                        receiverPhone: shippingAddress.receiverPhone,
                        province: shippingAddress.province,
                        district: shippingAddress.district,
                        ward: shippingAddress.ward,
                        detailAddress: shippingAddress.detailAddress,
                        provinceId: shippingAddress.provinceId || null,
                        wardId: shippingAddress.wardId || null,
                        note: shippingAddress.note || null
                    },
                    shippingInfo: {
                        carrier: "VIETTELPOST",
                        shippingFee: finalShippingFee,
                        weight: totalWeight
                    },
                    paymentInfo: {
                        method: paymentMethod || "COD",
                        status: "PENDING"
                    },
                    financials: {
                        itemsSubtotal,
                        shippingFee: finalShippingFee,
                        discountAmount: 0,
                        finalAmount
                    },
                    orderStatus: "PENDING",
                    timeline: [
                        {
                            type: "ORDER",
                            status: "PENDING",
                            updatedBy: userId,
                            note: "Khách hàng tạo đơn hàng thành công"
                        }
                    ],
                    note: note || ""
                }
            ],
            { session }
        );

        // Xóa các món đã chọn khỏi giỏ hàng
        cart.items = cart.items.filter((item) => !item.isSelected);
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        const message =
            paymentMethod === "COD"
                ? "Đặt hàng thành công"
                : "Tạo đơn hàng thành công, vui lòng tiến hành thanh toán";

        return success(res, newOrder, message, 201);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

/**
 * 2. Lấy danh sách đơn hàng của user hiện tại (phân trang, filter theo trạng thái)
 */
export const getMyOrdersController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const result = await orderService.getMyOrders(userId, req.query);
        success(res, result, "Lấy danh sách đơn hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 3. Lấy chi tiết 1 đơn hàng theo orderCode
 */
export const getOrderDetailController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { orderCode } = req.params;
        const order = await orderService.getOrderDetail(userId, orderCode);
        success(res, order, "Lấy chi tiết đơn hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 4. Hủy đơn hàng (chỉ khi đang PENDING hoặc PROCESSING)
 */
export const cancelOrderController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { orderCode } = req.params;
        const { reason } = req.body;
        const order = await orderService.cancelOrder(userId, orderCode, reason);
        success(res, order, "Hủy đơn hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};
