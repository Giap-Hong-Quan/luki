"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { loginSchema, LoginFormData } from "@/validators/auth.validator";
import { useLogin } from "@/hooks/auth/useAuth";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"otp" | "password">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
 
  const rememberMe = watch("rememberMe");  // follow state
  const loginMutation = useLogin();

  // Xử lý gửi form đăng nhập
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const res = await loginMutation.mutateAsync(data);
      if (res?.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }

      toast.success(res?.message || "Đăng nhập thành công!");
      router.push("/");
    } catch (error: any) {
      // Kiểm tra đơn giản qua thông báo lỗi chưa xác minh OTP
      if (
        error?.message?.includes("chưa được xác minh OTP") ||
        error?.message?.includes("chưa xác minh")
      ) {
        try {
          await authService.sendOtp(data.email);
        } catch (_) {}
        router.push(`/register?email=${encodeURIComponent(data.email)}&step=2`);
        return;
      }

      toast.error(error?.message || "Đăng nhập thất bại, vui lòng kiểm tra lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-card border border-line p-8 sm:p-10 shadow-box rounded-none transition-colors duration-200">
      {/* 1. Header / Logo Branding */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-primary uppercase">
            THE LUKI
          </h1>
        </Link>
        <p className="text-xs sm:text-sm text-secondary tracking-wide">
          Chào mừng bạn quay lại
        </p>
      </div>

      {/* 2. Đăng nhập nhanh với Social (Dạng nút vuông sắc nét) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Facebook Button */}
        <button
          type="button"
          className="h-11 px-4 border border-line bg-input hover:border-line-dark text-primary transition-colors flex items-center justify-center gap-2 text-xs font-semibold rounded-none"
        >
          <Image src="/fb.svg" alt="Facebook" width={20} height={20} className="w-5 h-5 object-contain" />
          <span>Facebook</span>
        </button>

        {/* Google Button */}
        <button
          type="button"
          className="h-11 px-4 border border-line bg-input hover:border-line-dark text-primary transition-colors flex items-center justify-center gap-2 text-xs font-semibold rounded-none"
        >
          <Image src="/gg.svg" alt="Google" width={20} height={20} className="w-5 h-5 object-contain" />
          <span>Google</span>
        </button>
      </div>

      {/* 3. Divider Hoặc */}
      <div className="relative flex items-center justify-center my-6">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-card px-3 text-xs text-muted uppercase tracking-widest transition-colors">
          Hoặc
        </span>
      </div>

      {/* 4. Tabs vuông cổ điển */}
      <div className="grid grid-cols-2 border-b border-line mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("otp")}
          className={`py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "otp"
              ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent"
              : "text-muted hover:text-primary"
          }`}
        >
          OTP
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "password"
              ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent"
              : "text-muted hover:text-primary"
          }`}
        >
          Mật khẩu
        </button>
      </div>

      {/* 5. Form Content */}
      {activeTab === "password" ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Field: Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
              placeholder="name@example.com"
              className={`w-full h-11 px-3.5 text-sm bg-input border hover:border-line-dark focus:border-line-focus text-primary outline-none rounded-none transition-colors placeholder:text-muted ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Field: Mật khẩu */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                placeholder="••••••••"
                className={`w-full h-11 pl-3.5 pr-10 text-sm bg-input border hover:border-line-dark focus:border-line-focus text-primary outline-none rounded-none transition-colors placeholder:text-muted ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted hover:text-primary transition-colors p-1"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Row Ghi nhớ & Quên mật khẩu */}
          <div className="flex items-center justify-between pt-1">
            <label
              htmlFor="rememberMe"
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 border flex items-center justify-center transition-colors rounded-none ${
                  rememberMe
                    ? "bg-accent border-accent"
                    : "border-line group-hover:border-line-dark bg-transparent"
                }`}
              >
                <Check
                  className={`w-3 h-3 text-accent-contrast stroke-[3] transition-opacity ${
                    rememberMe ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <span className="text-xs text-secondary font-medium group-hover:text-primary transition-colors">
                Ghi nhớ đăng nhập
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs text-secondary hover:text-primary hover:underline transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 h-12 bg-accent hover:opacity-90 text-accent-contrast font-bold text-xs uppercase tracking-[0.15em] transition-opacity rounded-none flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG XỬ LÝ...</span>
              </>
            ) : (
              <span>ĐĂNG NHẬP</span>
            )}
          </button>
        </form>
      ) : (
        /* Tab OTP */
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full h-11 px-3.5 text-sm bg-input border hover:border-line-dark focus:border-line-focus text-primary outline-none rounded-none placeholder:text-muted"
            />
          </div>

          <button
            type="button"
            className="w-full h-12 bg-accent hover:opacity-90 text-accent-contrast font-bold text-xs uppercase tracking-[0.15em] transition-opacity rounded-none"
            onClick={() => toast("Chức năng gửi OTP đang hoàn thiện!")}
          >
            GỬI MÃ OTP
          </button>
        </div>
      )}

      {/* 6. Footer Đăng ký ngay */}
      <div className="mt-8 text-center text-xs text-secondary tracking-wide">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="text-primary font-bold hover:underline ml-1"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
