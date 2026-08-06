import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    full_name: z
      .string({ required_error: "Họ tên không được để trống" })
      .trim()
      .min(1, "Họ tên không được để trống")
      .min(2, "Họ tên phải từ 2 ký tự trở lên"),
    email: z
      .string({ required_error: "Email không được để trống" })
      .trim()
      .toLowerCase()
      .email("Email không đúng định dạng"),
    password: z
      .string({ required_error: "Mật khẩu không được để trống" })
      .min(1, "Mật khẩu không được để trống")
      .min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email không được để trống" })
      .trim()
      .toLowerCase()
      .email("Email không đúng định dạng"),
    password: z
      .string({ required_error: "Mật khẩu không được để trống" })
      .min(1, "Mật khẩu không được để trống"),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email không được để trống" })
      .trim()
      .toLowerCase()
      .email("Email không đúng định dạng"),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email không được để trống" })
      .trim()
      .toLowerCase()
      .email("Email không đúng định dạng"),
    otp: z
      .string({ required_error: "Mã OTP không được để trống" })
      .trim()
      .min(1, "Mã OTP không được để trống"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email không được để trống" })
      .trim()
      .toLowerCase()
      .email("Email không đúng định dạng"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email không được để trống" })
      .trim()
      .toLowerCase()
      .email("Email không đúng định dạng"),
    otp: z
      .string({ required_error: "Mã OTP không được để trống" })
      .trim()
      .min(1, "Mã OTP không được để trống"),
    newPassword: z
      .string({ required_error: "Mật khẩu mới không được để trống" })
      .min(6, "Mật khẩu mới phải ít nhất 6 ký tự"),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({ required_error: "Mật khẩu cũ không được để trống" })
      .min(1, "Mật khẩu cũ không được để trống"),
    newPassword: z
      .string({ required_error: "Mật khẩu mới không được để trống" })
      .min(6, "Mật khẩu mới phải ít nhất 6 ký tự"),
  }),
});
