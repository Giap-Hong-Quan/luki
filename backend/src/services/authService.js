import User from "../models/User.js";
import Role from"../models/Role.js"
import { comparePassword, hashPassword } from "../utils/password.js";
import { accessToken } from "../utils/jwt.js";
import Verification from "../models/Verification.js";
import { sendEmail } from "./senEmail.js";

// đăng nhập 
export const signinService =async (payload)=>{
    try {
        const {email,password}=payload;
        if(!email || !password){throw new Error("Chưa nhập đủ thông tin")};
        const exitUser= await User.findOne({email:email}).select("+password").populate("role");
        if(!exitUser){
            throw new Error("Email không chính xác");
        }
        if(exitUser.isOTPEmail === false){throw new Error("Tài khoản chưa đc xác minh otp")};
        const isMatch =await comparePassword(password,exitUser.password)
        if (!isMatch) {
        throw new Error("Email hoặc mật khẩu không chính xác");
            }
        const token = accessToken(
            {
                id:exitUser._id,
                date :new Date(),
                role:exitUser.role.name
            }
        )
         await User.findByIdAndUpdate(exitUser._id,{isActive:true,lastLogin:new Date(),provider:'local',provider_id:null})
        return token
    } catch (error) {
        console.error("lỗi",error)
        throw error;
    }
}
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
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await sendEmail({
        to: email,
        subject: "Xác minh đăng ký",
        html: `
  <!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
    .box { max-width: 500px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; }
    .otp { font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 6px; text-align: center; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Xác minh email</h2>
    <p>Chào bạn,</p>
    <p>Vui lòng nhập mã OTP bên dưới để xác minh email của bạn:</p>

    <div class="otp">${otp}</div>

    <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>
    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
  </div>
</body>
</html>
        `,
    })
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
    verification.used =true;
    await verification.save();
    exitUser.isOTPEmail=true
   await exitUser.save();
    return {
         message: "Xác minh email thành công",
  };
}
