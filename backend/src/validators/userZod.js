import { z } from "zod";
import { membershipTiers } from "../Constants/index.js";

const addressSchema = z.object({
    receiverName: z.string().trim().optional(),
    receiverPhone: z.string().trim().optional(),
    province: z.string().trim().optional(),
    district: z.string().trim().optional(),
    ward: z.string().trim().optional(),
    detail: z.string().trim().optional(),
    isDefault: z.boolean().optional()
});

// Schema Validate Tạo Người dùng (Admin)
export const createUserZod = z.object({
    body: z.object({
        full_name: z
            .string({ required_error: "Họ và tên là bắt buộc" })
            .trim()
            .min(1, "Họ và tên không được để trống"),
        email: z
            .string({ required_error: "Email là bắt buộc" })
            .trim()
            .toLowerCase()
            .email("Email không đúng định dạng"),
        password: z
            .string({ required_error: "Mật khẩu là bắt buộc" })
            .min(6, "Mật khẩu phải chứa ít nhất 6 ký tự"),
        phone: z
            .string()
            .trim()
            .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không đúng định dạng Việt Nam")
            .optional()
            .nullable(),
        avatar: z
            .string()
            .trim()
            .optional()
            .nullable(),
        membership_tier: z
            .enum(membershipTiers, {
                errorMap: () => ({ message: "Hạng thành viên không hợp lệ" })
            })
            .optional(),
        role: z.string().optional(),
        accumulated_points: z.number().min(0, "Điểm tích lũy không được nhỏ hơn 0").optional(),
        isActive: z.boolean().optional(),
        addresses: z.array(addressSchema).optional()
    })
});

// Schema Validate Cập nhật Người dùng (Admin)
export const updateUserZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID người dùng là bắt buộc")
    }),
    body: z.object({
        full_name: z.string().trim().min(1, "Họ và tên không được để trống").optional(),
        email: z.string().trim().toLowerCase().email("Email không đúng định dạng").optional(),
        phone: z
            .string()
            .trim()
            .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không đúng định dạng Việt Nam")
            .optional()
            .nullable(),
        avatar: z
            .string()
            .trim()
            .optional()
            .nullable(),
        membership_tier: z
            .enum(membershipTiers, {
                errorMap: () => ({ message: "Hạng thành viên không hợp lệ" })
            })
            .optional(),
        role: z.string().optional(),
        accumulated_points: z.number().min(0, "Điểm tích lũy không được nhỏ hơn 0").optional(),
        isActive: z.boolean().optional(),
        addresses: z.array(addressSchema).optional()
    })
});

// Schema Validate Params ID
export const userIdParamZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID người dùng là bắt buộc")
    })
});
