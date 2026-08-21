import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-10 bg-page transition-colors duration-300">
      {/* ================= CỘT TRÁI (6 PHẦN - 60%): Chỉ để Background ================= */}
      <div className="hidden lg:block lg:col-span-6 bg-zinc-950 relative overflow-hidden">
        {/* Chỗ để bạn tự thiết kế banner / hình ảnh sau */}
      </div>

      {/* ================= CỘT PHẢI (4 PHẦN - 40%): Chứa Form ================= */}
      <div className="col-span-1 lg:col-span-4 min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-y-auto bg-page transition-colors duration-300">
        <div className="w-full max-w-[440px] mx-auto py-6">
          {children}
        </div>
      </div>
    </div>
  );
}