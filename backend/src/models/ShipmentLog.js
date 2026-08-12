import mongoose from "mongoose";

/**
 * Model ShipmentLog - Lưu TOÀN BỘ lịch sử mỗi lần carrier (ViettelPost) gửi webhook báo trạng thái.
 *
 * Vì sao tách khỏi Shipment.status (vốn chỉ lưu trạng thái HIỆN TẠI)?
 * ViettelPost có thể gửi webhook nhiều lần trong ngày (lấy hàng, đang trung chuyển, đang giao...).
 * Nếu chỉ overwrite Shipment.status thì mất hết lịch sử các bước trung gian - rất cần khi khách
 * khiếu nại kiểu "hàng để ở kho mấy ngày không ai xử lý" và cần tra lại đúng thời gian mỗi bước.
 */
const ShipmentLogSchema = new mongoose.Schema(
    {
        shipment: { // Lần vận chuyển (Shipment) mà log này thuộc về
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shipment",
            required: true,
            index: true
        },
        status: { type: String, required: true },         // Trạng thái tại thời điểm webhook này gửi về
        message: { type: String, trim: true, default: "" }, // Message carrier gửi kèm (mô tả bước xử lý)
        rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} }, // Nguyên văn payload webhook - dùng đối soát/debug khi có tranh chấp
        webhookEventId: { type: String, default: null, index: true, sparse: true } // ID sự kiện gốc (nếu carrier cung cấp) - chống xử lý trùng webhook (idempotency)
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("ShipmentLog", ShipmentLogSchema);
