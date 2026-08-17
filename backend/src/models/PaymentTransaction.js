import mongoose from "mongoose";

/**
 * Model PaymentTransaction - Lịch sử TOÀN BỘ các lần thử thanh toán của 1 đơn hàng.
 *
 * Vì sao tách riêng khỏi Order.paymentInfo (vốn cũng có status/method)?
 * Order.paymentInfo chỉ là SNAPSHOT của lần thanh toán mới nhất/thành công, phục vụ hiển thị nhanh.
 * Trong khi 1 đơn có thể có NHIỀU lần thử (VD: quét QR SePay hết hạn, khách thử lại bằng VNPay) -
 * mỗi lần thử là 1 document riêng ở đây để không mất dữ liệu, phục vụ đối soát ngân hàng/ví.
 */
const PaymentTransactionSchema = new mongoose.Schema(
    {
        order: { // Đơn hàng cần thanh toán
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true
        },
        user: { // Khách hàng thực hiện thanh toán (denormalize để query lịch sử giao dịch theo user nhanh, không cần join qua Order)
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        gateway: { // Cổng thanh toán dùng cho lần thử này
            type: String,
            required: true,
            enum: ["SEPAY", "MOMO", "VNPAY", "COD"]
        },
        transactionCode: { // Mã giao dịch. Với SePay/Momo/VNPay: mã do gateway cấp.
                            // Với COD: KHÔNG có mã thật từ gateway, tầng service phải tự sinh
                            // dạng "COD-{orderCode}" trước khi save để không vi phạm unique index.
            type: String,
            trim: true,
            unique: true,
            sparse: true, // cho phép nhiều document cùng chưa có giá trị (null) mà không vi phạm ràng buộc unique
            index: true
        },
        gatewayEventId: { // ID sự kiện GỐC bên gateway trả về trong webhook (khác transactionCode - với SePay,
                           // transactionCode có thể chỉ là nội dung chuyển khoản, không đại diện riêng cho từng webhook).
                           // Dùng field này để chống xử lý trùng lặp khi gateway gửi lại webhook (idempotency).
            type: String,
            default: null,
            index: true,
            sparse: true
        },
        amount: { // Số tiền của lần giao dịch này (số THỰC TẾ ghi nhận, có thể khác financials.finalAmount nếu khách chuyển thiếu/thừa)
            type: Number,
            required: true,
            min: 0
        },
        status: { // Trạng thái của LẦN THỬ thanh toán này
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED", "EXPIRED", "REFUNDED"],
            default: "PENDING"
        },
        rawPayload: { // Toàn bộ dữ liệu thô webhook/IPN gốc - bắt buộc lưu để đối soát khi ngân hàng/khách khiếu nại
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        paidAt: { // Thời điểm ngân hàng/ví xác nhận tiền đã vào (khác createdAt - là lúc tạo yêu cầu thanh toán)
            type: Date,
            default: null
        }
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("PaymentTransaction", PaymentTransactionSchema);
