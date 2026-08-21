import { z } from "zod";

// Schema đăng nhập bằng mật khẩu
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema đăng ký tài khoản (Bước 1: Nhập thông tin)
export const registerSchema = z
  .object({
    last_name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ"),
    first_name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên"),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .email("Email không đúng định dạng"),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Schema xác thực OTP (Bước 2)
export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(6, "Mã OTP gồm 6 chữ số")
    .max(6, "Mã OTP gồm 6 chữ số")
    .regex(/^\d+$/, "Mã OTP chỉ bao gồm chữ số"),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

