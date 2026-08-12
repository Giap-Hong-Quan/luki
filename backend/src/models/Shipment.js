import mongoose from "mongoose";

/**
 * Model Shipment - Nguồn sự thật (source of truth) đầy đủ cho từng LẦN vận chuyển.
 *
 * Vì sao tách riêng khỏi Order thay vì nhúng thẳng (embedded, 1-1)?
 * 1 đơn hàng có thể phát sinh NHIỀU lần vận chuyển trong vòng đời của nó:
 *   - Giao lần 1 thất bại (khách không nghe máy) -> tạo lại vận đơn khác (trackingCode mới)
 *   - Khách đổi trả -> phát sinh 1 lượt vận chuyển ngược (khách gửi hàng về kho)
 * Nếu nhúng thẳng vào Order (1-1), mỗi lần tạo lại sẽ ghi đè, mất sạch lịch sử vận đơn cũ -
 * rất cần khi đối soát với ViettelPost hoặc xử lý khiếu nại của khách.
 * `Order.shippingInfo` chỉ là bản snapshot rút gọn của Shipment MỚI NHẤT, phục vụ hiển thị nhanh.
 */
const ShipmentSchema = new mongoose.Schema(
    {
        order: { // Đơn hàng mà lần vận chuyển này thuộc về (1 Order có thể có nhiều Shipment)
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true
        },
        carrier: { // Đơn vị vận chuyển thực hiện lần giao này
            type: String,
            enum: ["VIETTELPOST", "GHN", "GHTK", "INTERNAL"],
            required: true,
            default: "VIETTELPOST"
        },
        trackingCode: { type: String, trim: true, default: null, index: true }, // Mã vận đơn ViettelPost cấp cho LẦN giao này
        status: { // Trạng thái nội bộ đã được chuẩn hóa (map từ status riêng của từng carrier)
            type: String,
            enum: ["PENDING", "CONFIRMED", "PICKING", "SHIPPING", "DELIVERED", "FAILED", "RETURNED", "CANCELLED"],
            default: "PENDING",
            index: true
        },
        carrierStatusRaw: { type: String, default: null }, // Status GỐC carrier trả về (chưa map) - giữ lại để debug khi mapping sai
        shippingFee: { type: Number, default: 0, min: 0 }, // Cước phí trả về từ API tính cước
        codAmount: { type: Number, default: 0, min: 0 },   // Số tiền cần thu hộ - BẮT BUỘC đúng, sai là carrier thu nhầm tiền khách
        weight: { type: Number, default: 500, min: 0 },    // Trọng lượng (gram) dùng để tính cước
        dimensions: { // Kích thước - carrier dùng để tính "cân nặng quy đổi" với hàng cồng kềnh (dài x rộng x cao / hệ số)
            length: { type: Number, default: null, min: 0 }, // cm
            width: { type: Number, default: null, min: 0 },  // cm
            height: { type: Number, default: null, min: 0 }  // cm
        },
        estimatedDeliveryDate: { type: Date, default: null }, // Ngày dự kiến giao, carrier trả về lúc tạo đơn
        deliveredAt: { type: Date, default: null },           // Thời điểm thực tế giao thành công (lấy từ webhook)
        failedReason: { type: String, trim: true, default: null }, // Lý do giao thất bại (webhook trả về, VD: "Khách không nghe máy")
        attemptNumber: { type: Number, default: 1, min: 1 },  // Lần giao thứ mấy của đơn hàng (tăng dần nếu phải tạo lại vận đơn)
        rawCreateResponse: { type: mongoose.Schema.Types.Mixed, default: null } // Response GỐC lúc gọi API tạo đơn - cần khi tranh chấp/đối soát
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("Shipment", ShipmentSchema);
