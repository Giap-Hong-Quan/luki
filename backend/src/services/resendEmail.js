import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailResend = async ({ to, subject, html }) => {
    try {
        const { data, error } = await resend.emails.send({
            from:'noreply@giapquan.click', // Email mặc định của Resend dùng để test
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Lỗi gửi email Resend:", error);
            throw new Error(error.message || "Không thể gửi email xác thực");
        }

        return data;
    } catch (error) {
        console.error("Lỗi gửi email Resend:", error);
        throw new Error(error.message || "Không thể gửi email xác thực");
    }
};