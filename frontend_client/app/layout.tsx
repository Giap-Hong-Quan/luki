import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ThemePullCord from "@/components/common/ThemePullCord";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "THE LUKI - Fashion & Trendy Lifestyle",
  description: "Nền tảng mua sắm thời trang & phụ kiện cao cấp THE LUKI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ThemePullCord />

          <Toaster
            position="top-right"
            toastOptions={{ duration: 3000 }}
          />

          {children}
        </Providers>
      </body>
    </html>
  );
}