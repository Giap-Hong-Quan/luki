import { z } from "zod";

const shippingAddressZod = z.object({
    receiverName: z.string({ required_error: "Tên người nhận là bắt buộc" }).trim().min(1),
    receiverPhone: z.string({ required_error: "SĐT người nhận là bắt buộc" }).trim().min(1),
    province: z.string({ required_error: "Tỉnh/Thành là bắt buộc" }).trim().min(1),
    district: z.string({ required_error: "Quận/Huyện là bắt buộc" }).trim().min(1),
    ward: z.string({ required_error: "Phường/Xã là bắt buộc" }).trim().min(1),
    detailAddress: z.string({ required_error: "Địa chỉ chi tiết là bắt buộc" }).trim().min(1),
    // 3 mã ID chuẩn ViettelPost - optional ở validator vì FE có thể chưa map được ngay,
    // nhưng thực tế BẮT BUỘC phải có trước khi gọi API tạo vận đơn thật ở Phase 2.
    provinceId: z.string().trim().optional(),
    districtId: z.string().trim().optional(),
    wardId: z.string().trim().optional(),
    note: z.string().trim().optional()
});

export const checkoutZod = z.object({
    body: z.object({
        shippingAddress: shippingAddressZod,
        paymentMethod: z.enum(["COD", "SEPAY", "MOMO", "VNPAY", "ESCROW"], {
            required_error: "Phương thức thanh toán là bắt buộc"
        }),
        couponCode: z.string().trim().optional(),
        note: z.string().trim().optional()
    })
});

export const cancelOrderZod = z.object({
    body: z.object({
        reason: z.string().trim().optional()
    })
});

// Ví dụ thực tế cho z.coerce.number() với query param (đã trao đổi trước đó):
// page/limit luôn là string trên URL, coerce.number() tự đổi sang number, ép sai định dạng
// (VD "abc") sẽ tự thành NaN và bị Zod reject ngay.
export const getMyOrdersZod = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(10),
        status: z
            .enum(["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED", "RETURNED"])
            .optional()
    })
});
