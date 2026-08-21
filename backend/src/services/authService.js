import User from "../models/User.js";
import Verification from "../models/Verification.js";
import { sendEmailResend } from "./resendEmail.js";

//  gửi OTP
export const sendOtpService  = async(email)=>{
    const exitUser = await User.findOne({email});
    if(!exitUser){
        throw new Error("Email không tồn tại");
    }
    if(exitUser.isOTPEmail ===true){
        throw new Error("Email đã được xác minh");
    }
    await Verification.deleteMany(
        {
            email,
            type:"verify_email",
            used: false,
        }
    )
    const generateOtp = () =>
        Math.floor(100000 + Math.random() * 900000).toString();

    const otp = generateOtp();
    await Verification.create({
        email,
        code: otp,
        type: "verify_email",
        expiresAt: new Date(Date.now() + 120 * 1000),
    });
    await sendEmailResend({
        to: email,
        subject: "🔒 Mã xác minh OTP - SPEED FASHION",
        html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác minh email - SPEED FASHION</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 30px; text-align: center;">
              <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 3px; font-family: Arial, sans-serif; text-transform: uppercase;">
                SPEED <span style="color: #f59e0b;">FASHION</span>
              </span>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
                High Streetwear & Elegance
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; text-align: center;">
                Xác Minh Tài Khoản Đăng Ký
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569; text-align: center;">
                Chào mừng bạn đến với <strong>SPEED FASHION</strong>! Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực đăng ký tài khoản.
              </p>

              <!-- OTP Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Mã OTP Xác Nhận
                </span>
                <span style="font-size: 38px; font-weight: 900; color: #0f172a; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; font-variant-numeric: tabular-nums;">
                  ${otp}
                </span>
              </div>

              <!-- Timer Info -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                      ⏱️ Mã OTP có hiệu lực trong <strong>120 giây (2 phút)</strong>
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">
                  🔒 <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã OTP này cho bất kỳ ai. Nhân viên SPEED FASHION sẽ không bao giờ hỏi mã xác nhận của bạn.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                Cần hỗ trợ? Đội ngũ hỗ trợ luôn sẵn sàng 24/7.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2026 SPEED FASHION Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
    });
    return { message: "OTP đã được gửi về email",}
}
// Xác thực OTP
export const verifyOtpService = async(email,otp)=>{
        if (!email || !otp) {
            throw new Error("Thiếu email hoặc otp ")
    }
    //check email ton tia
    const exitUser = await User.findOne({email});
    if(!exitUser){
        throw new Error("Email không tồn tại ")
    }
    //check xac minh  chuwa
     if(exitUser.isOTPEmail ===true){
        throw new Error("Email đã được xác minh");
    }
    //tim otp hop le
    const verification =await Verification.findOne(
        {
            email,
            code:otp,
            type:"verify_email",
            used:false,
        }
    )
    if(!verification){
        throw new Error("OTP không tồn tại hoặc chưa gửi hoặc không đúng ")
    }
    
    //cehk heet han
    if(verification.expiresAt< new Date()){
        throw new Error("OTP đã hết hạn")
    }
    //check otp da dung chua
    verification.used = true;
    await verification.save();
    exitUser.isOTPEmail = true;
    exitUser.isActive = true;
    await exitUser.save();
    return {
         message: "Xác minh email thành công",
  };
}

// 3. Gửi OTP Khôi phục mật khẩu (Forgot Password)
export const forgotPasswordService = async (email) => {
    const existUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!existUser) {
        throw new Error("Email không tồn tại trong hệ thống");
    }

    await Verification.deleteMany({
        email: email.toLowerCase().trim(),
        type: "forgot_password",
        used: false,
    });

    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
    const otp = generateOtp();

    await Verification.create({
        email: email.toLowerCase().trim(),
        code: otp,
        type: "forgot_password",
        expiresAt: new Date(Date.now() + 120 * 1000),
    });

    await sendEmailResend({
        to: email,
        subject: "🔑 Mã OTP khôi phục mật khẩu - SPEED FASHION",
        html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Khôi phục mật khẩu - SPEED FASHION</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 32px 30px; text-align: center;">
              <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 3px; font-family: Arial, sans-serif; text-transform: uppercase;">
                SPEED <span style="color: #f59e0b;">FASHION</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; text-align: center;">
                Yêu Cầu Khôi Phục Mật Khẩu
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569; text-align: center;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>. Vui lòng nhập mã OTP dưới đây để hoàn tất:
              </p>
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Mã OTP Đặt Lại Mật Khẩu
                </span>
                <span style="font-size: 38px; font-weight: 900; color: #0f172a; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">
                  ${otp}
                </span>
              </div>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #b45309; text-align: center; font-weight: 600;">
                ⏱️ Mã OTP có hiệu lực trong 120 giây (2 phút).
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                  🔒 Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với hỗ trợ.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2026 SPEED FASHION Store. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
    });

    return { message: "Mã OTP khôi phục mật khẩu đã được gửi về email" };
};
