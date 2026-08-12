import Coupon from "../models/Coupon.js";
import ApiError from "../exceptions/ApiError.js";

/**
 * Kiểm tra mã giảm giá có hợp lệ để áp dụng hay không.
 * KHÔNG tăng usedCount ở đây - hàm này dùng cho cả API "xem trước" (/coupon/validate)
 * lẫn bước đầu của checkout, tăng usedCount thật chỉ nằm ở applyCouponAtomic() bên dưới.
 */
export const validateCoupon = async (code, itemsSubtotal) => {
    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), deletedAt: null });
    if (!coupon) throw new ApiError(404, "Mã giảm giá không tồn tại");
    if (!coupon.isActive) throw new ApiError(400, "Mã giảm giá đã ngừng hoạt động");

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
        throw new ApiError(400, "Mã giảm giá chưa tới thời gian áp dụng");
    }
    if (coupon.endDate && now > coupon.endDate) {
        throw new ApiError(400, "Mã giảm giá đã hết hạn");
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, "Mã giảm giá đã hết lượt sử dụng");
    }
    if (itemsSubtotal < coupon.minOrderValue) {
        throw new ApiError(
            400,
            `Đơn hàng cần tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}đ để dùng mã này`
        );
    }

    return coupon;
};

/**
 * Tính số tiền được giảm dựa trên coupon + tổng tiền hàng (itemsSubtotal)
 */
export const calculateDiscountAmount = (coupon, itemsSubtotal) => {
    if (!coupon) return 0;

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
        discount = Math.floor((itemsSubtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
        }
    } else {
        discount = coupon.discountValue;
    }

    return Math.min(discount, itemsSubtotal); // không cho giảm vượt quá tiền hàng
};

/**
 * Áp dụng mã giảm giá ATOMIC - tăng usedCount trong CÙNG 1 query để chống race condition
 * (2 request đặt hàng cùng lúc dùng chung 1 mã sắp hết lượt sẽ không cùng vượt qua được).
 * Chỉ gọi hàm này khi Order THẬT SỰ được tạo, không gọi ở bước validate xem trước.
 */
export const applyCouponAtomic = async (couponId, session) => {
    const updated = await Coupon.findOneAndUpdate(
        {
            _id: couponId,
            $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }]
        },
        { $inc: { usedCount: 1 } },
        { new: true, session }
    );

    if (!updated) {
        throw new ApiError(400, "Mã giảm giá vừa hết lượt sử dụng, vui lòng thử lại");
    }

    return updated;
};
