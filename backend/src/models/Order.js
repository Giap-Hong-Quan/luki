import mongoose from "mongoose";
import { generateOrderCode } from "../utils/generateOrderCode.js";

/**
 * Sub-schema: Snapshot từng sản phẩm trong đơn hàng.
 * Lý do phải "snapshot" (chép cứng dữ liệu) thay vì chỉ lưu ref tới Product:
 * nếu sau này Admin đổi giá/tên/ảnh sản phẩm, đơn hàng CŨ vẫn phải hiển thị đúng
 * thông tin tại THỜI ĐIỂM khách đặt hàng (hóa đơn không được tự đổi theo giá mới).
 */
const OrderItemSchema = new mongoose.Schema(
    {
        product: { // Ref tới Product gốc - dùng cho nút "Mua lại" và thống kê sản phẩm bán chạy
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        name: { type: String, trim: true, required: true },     // Tên sản phẩm tại thời điểm mua
        color: { type: String, trim: true, required: true },    // Phân loại màu đã chọn
        size: { type: String, trim: true, required: true },     // Phân loại size đã chọn
        sku: { type: String, trim: true, uppercase: true, required: true }, // Mã SKU biến thể cụ thể
        quantity: { type: Number, required: true, min: 1 },     // Số lượng mua
        price: { type: Number, required: true, min: 0 },        // Đơn giá TẠI THỜI ĐIỂM mua (không đổi dù giá SP sau này thay đổi)
        thumbnail: { type: String, trim: true, default: null }  // Ảnh đại diện tại thời điểm mua
    },
    { _id: true }
);

/**
 * Sub-schema: Nhật ký lịch sử thay đổi trạng thái (Audit log).
 * `type` giúp phân biệt sự kiện đến từ luồng nào (đơn hàng / thanh toán / vận chuyển)
 * để FE lọc hiển thị đúng tab timeline, tránh trộn lẫn 3 luồng khó đọc.
 */
const OrderTimelineSchema = new mongoose.Schema(
    {
        type: { // Nguồn gốc sự kiện: đổi trạng thái đơn / thanh toán / vận chuyển
            type: String,
            enum: ["ORDER", "PAYMENT", "SHIPPING"],
            default: "ORDER"
        },
        status: { type: String, required: true }, // Giá trị trạng thái mới tại thời điểm ghi log
        updatedBy: { // Ai gây ra thay đổi: null = hệ thống tự động (webhook/cron), có giá trị = admin/staff thao tác tay
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        note: { type: String, trim: true, default: "" }, // Ghi chú thêm (VD: lý do hủy, lý do giao thất bại)
        updatedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const OrderSchema = new mongoose.Schema(
    {
        orderCode: { // Mã đơn hàng thân thiện hiển thị cho khách (VD: ORD20260809-A1B2), KHÁC với _id Mongo
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            index: true,
            default: generateOrderCode
        },
        user: { // Khách hàng sở hữu đơn hàng
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        items: [OrderItemSchema], // Danh sách sản phẩm đã mua (snapshot, xem giải thích ở trên)

        // ============ ĐỊA CHỈ GIAO HÀNG (SNAPSHOT) ============
        // Snapshot tại thời điểm đặt, KHÔNG ref tới địa chỉ đã lưu của User, vì User có thể
        // sửa/xóa địa chỉ đó sau này nhưng đơn hàng cũ vẫn phải giữ đúng địa chỉ đã giao.
        shippingAddress: {
            receiverName: { type: String, trim: true, required: true },  // Tên người nhận (có thể khác chủ tài khoản)
            receiverPhone: { type: String, trim: true, required: true }, // SĐT người nhận - ViettelPost dùng để liên hệ khi giao
            province: { type: String, trim: true, required: true },      // Tên Tỉnh/Thành hiển thị cho khách
            district: { type: String, trim: true, required: true },      // Tên Quận/Huyện hiển thị cho khách
            ward: { type: String, trim: true, required: true },          // Tên Phường/Xã hiển thị cho khách
            detailAddress: { type: String, trim: true, required: true }, // Số nhà, tên đường
            provinceId: { type: String, trim: true, default: null }, // Mã Tỉnh chuẩn ViettelPost - BẮT BUỘC khi gọi API tạo đơn
            wardId: { type: String, trim: true, default: null },     // Mã Xã chuẩn ViettelPost
            note: { type: String, trim: true, default: null }        // Ghi chú giao hàng của khách (VD: "giao giờ hành chính")
        },

        // ============ VẬN CHUYỂN (SNAPSHOT RÚT GỌN) ============
        // Đây CHỈ là bản snapshot rút gọn để hiển thị nhanh danh sách đơn (list order)
        // mà không cần join sang collection Shipment. Nguồn sự thật đầy đủ + lịch sử nhiều
        // lần giao (retry khi thất bại) nằm ở model Shipment.js.
        shippingInfo: {
            carrier: { // Đơn vị vận chuyển đang phụ trách đơn này
                type: String,
                enum: ["VIETTELPOST", "GHN", "GHTK", "INTERNAL"],
                default: "VIETTELPOST"
            },
            trackingCode: { type: String, trim: true, default: null, index: true }, // Mã vận đơn hiện tại (lần giao gần nhất)
            status: { // Trạng thái vận chuyển hiện tại (đồng bộ ngược từ Shipment.status)
                type: String,
                enum: ["PENDING", "CONFIRMED", "PICKING", "SHIPPING", "DELIVERED", "FAILED", "RETURNED", "CANCELLED"],
                default: "PENDING"
            },
            shippingFee: { type: Number, default: 0, min: 0 }, // Cước phí (đồng bộ từ Shipment)
            codAmount: { type: Number, default: 0, min: 0 },   // Tiền thu hộ (đồng bộ từ Shipment) - hiển thị nhanh cho admin
            estimatedDeliveryDate: { type: Date, default: null } // Ngày dự kiến giao
        },

        // ============ THANH TOÁN ============
        paymentInfo: {
            method: { // Phương thức khách chọn lúc checkout
                type: String,
                enum: ["COD", "SEPAY", "MOMO", "VNPAY", "ESCROW"],
                required: true,
                default: "COD"
            },
            status: { // Trạng thái thanh toán - nguồn chi tiết đầy đủ nằm ở PaymentTransaction, đây là snapshot nhanh
                type: String,
                enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
                default: "PENDING"
            },
            transactionId: { type: String, trim: true, default: null }, // Mã giao dịch mới nhất/thành công
            paidAt: { type: Date, default: null } // Thời điểm xác nhận thanh toán thành công
        },
        paymentDueAt: { // Hạn chót thanh toán (VD: +15 phút sau khi tạo đơn) - cron dùng field này để tự hủy đơn quá hạn
            type: Date,
            default: null
        },

        // ============ TÀI CHÍNH ĐƠN HÀNG ============
        financials: {
            itemsSubtotal: { type: Number, required: true, min: 0 }, // Tổng tiền hàng (chưa gồm ship, chưa trừ giảm giá)
            shippingFee: { type: Number, default: 0, min: 0 },       // Phí vận chuyển (copy từ shippingInfo tại thời điểm chốt đơn)
            discountAmount: { type: Number, default: 0, min: 0 },    // Số tiền được giảm từ coupon
            finalAmount: { type: Number, required: true, min: 0 }    // = itemsSubtotal + shippingFee - discountAmount
        },

        // ============ COUPON ÁP DỤNG (SNAPSHOT) ============
        coupon: {
            couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null }, // Ref để thống kê
            code: { type: String, trim: true, uppercase: true, default: null }, // Snapshot mã, hiển thị lại dù coupon sau này bị xóa
            discountAmount: { type: Number, default: 0, min: 0 } // Số tiền giảm thực tế đã áp dụng (chốt cứng)
        },

        // ============ TRẠNG THÁI VÒNG ĐỜI ĐƠN HÀNG ============
        orderStatus: {
            type: String,
            enum: [
                "PENDING",    // Mới tạo, chờ thanh toán (nếu online) hoặc chờ xác nhận
                "PROCESSING", // Đã xác nhận / đang đóng gói, chuẩn bị bàn giao vận chuyển
                "SHIPPING",   // Đã tạo vận đơn, đang giao
                "DELIVERED",  // Vận chuyển xác nhận giao thành công
                "COMPLETED",  // Khách xác nhận đã nhận hàng / đơn khép lại hoàn toàn
                "CANCELLED",  // Bị hủy (khách hủy hoặc hệ thống tự hủy do quá hạn thanh toán)
                "RETURNED"    // Khách trả hàng / hoàn tiền
            ],
            default: "PENDING",
            index: true
        },

        timeline: [OrderTimelineSchema], // Nhật ký toàn bộ vòng đời đơn (ORDER/PAYMENT/SHIPPING)

        note: { type: String, trim: true, default: "" },        // Ghi chú của khách khi đặt hàng (khác note trong shippingAddress)
        cancelReason: { type: String, trim: true, default: null } // Lý do hủy đơn, hiển thị lại cho khách xem
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("Order", OrderSchema);
