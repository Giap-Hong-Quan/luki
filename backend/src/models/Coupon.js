import mongoose from "mongoose";

/**
 * Model Coupon - Mã giảm giá / voucher.
 *
 * Lưu ý QUAN TRỌNG khi code service dùng model này (không thuộc phần schema):
 * tăng `usedCount` phải dùng `findOneAndUpdate` với điều kiện `usedCount < usageLimit`
 * trong CÙNG MỘT query atomic (VD: Coupon.findOneAndUpdate({ _id, usedCount: { $lt: usageLimit } },
 * { $inc: { usedCount: 1 } })), KHÔNG được đọc-rồi-ghi 2 bước riêng biệt - nếu không, 2 request
 * gửi lên cùng lúc có thể cùng vượt qua bước kiểm tra rồi cùng tăng, khiến mã bị dùng vượt hạn mức.
 */
const CouponSchema = new mongoose.Schema(
    {
        code: { // Mã giảm giá khách nhập lúc checkout (VD: "SUMMER2026", "WELCOME50")
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            index: true
        },
        title: { // Tiêu đề khuyến mãi hiển thị cho khách (VD: "Giảm 50k cho đơn từ 200k")
            type: String,
            required: true,
            trim: true
        },
        description: { // Mô tả chi tiết điều kiện áp dụng
            type: String,
            trim: true,
            default: ""
        },
        discountType: { // PERCENTAGE (giảm theo %) hoặc FIXED_AMOUNT (giảm số tiền cố định)
            type: String,
            enum: ["PERCENTAGE", "FIXED_AMOUNT"],
            default: "FIXED_AMOUNT"
        },
        discountValue: { // Giá trị giảm (% nếu discountType=PERCENTAGE, hoặc số tiền VND nếu FIXED_AMOUNT)
            type: Number,
            required: true,
            min: 0
        },
        maxDiscountAmount: { // Số tiền giảm TỐI ĐA - chỉ có ý nghĩa khi discountType=PERCENTAGE (chặn giảm quá nhiều với đơn giá trị lớn)
            type: Number,
            default: null,
            min: 0
        },
        minOrderValue: { // Giá trị đơn hàng tối thiểu để được áp mã (tính trên itemsSubtotal, trước khi giảm)
            type: Number,
            default: 0,
            min: 0
        },
        usageLimit: { // Tổng số lượt sử dụng tối đa của mã trên TOÀN HỆ THỐNG (null = không giới hạn)
            type: Number,
            default: null,
            min: 1
        },
        usedCount: { // Số lượt đã được áp dụng thành công - PHẢI update atomic, xem lưu ý ở đầu file
            type: Number,
            default: 0,
            min: 0
        },
        userLimit: { // Số lần tối đa MỖI user được dùng mã này (kiểm tra bằng cách đếm Order có coupon.couponId này + user tương ứng)
            type: Number,
            default: 1,
            min: 1
        },
        startDate: { // Thời gian bắt đầu hiệu lực
            type: Date,
            default: Date.now
        },
        endDate: { // Thời gian hết hạn (null = không giới hạn thời gian)
            type: Date,
            default: null
        },
        isActive: { // Admin bật/tắt mã thủ công (độc lập với startDate/endDate)
            type: Boolean,
            default: true
        },
        deletedAt: { // Xóa mềm - không xóa cứng để giữ lịch sử coupon đã áp trong các Order cũ
            type: Date,
            default: null
        },
        createdBy: { // Admin khởi tạo mã, phục vụ audit
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("Coupon", CouponSchema);
