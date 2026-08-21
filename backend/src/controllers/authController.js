import User from "../models/User.js";
import Verification from "../models/Verification.js";
import { 
    sendOtpService, 
    verifyOtpService,
    forgotPasswordService
} from "../services/authService.js";
import { accessToken, refreshToken, verifyRefreshToken } from "../utils/jwt.js";
import Role from "../models/Role.js";
import ApiError from "../exceptions/ApiError.js";
import { success } from "../utils/success.js";
import { comparePassword, hashPassword } from "../utils/password.js";

// đăng ký
export const signupController = async (req, res, next) => {
    try {
        const { full_name, email, password } = req.body;
        const existedUser = await User.findOne({ email: email });
        if (existedUser) {
            throw new ApiError(409, "Email đã tồn tại!");
        }
        const userRole = await Role.findOne({ name: "user" }).select("name _id");
        if (!userRole) {
            throw new ApiError(404, "Role 'user' không tồn tại");
        }
        const hashedPassword = await hashPassword(password);
        const signup = await User.create({
            full_name: full_name,
            email: email,
            password: hashedPassword,
            role: userRole._id,
            isOTPEmail: false
        });
      try {
            await sendOtpService(email.toLowerCase().trim());
        } catch (otpError) {
            await User.findByIdAndDelete(signup._id); // Rollback xóa user
            throw new ApiError(500, otpError.message || "Gửi email OTP thất bại, vui lòng thử lại!");
        }
        return success(res, signup, "Đăng ký thành công.Vui lòng kiểm tra email để nhận mã OTP!", 201);
    } catch (error) {
        next(error);
    }
};
// đăng nhập
export const signinController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const exitUser = await User.findOne({ email: email }).select("+password").populate("role");
        if (!exitUser) {
            throw new ApiError(400, "Email không chính xác");
        }
        if (exitUser.isActive === false) { 
            throw new ApiError(403, "Tài khoản của bạn đã bị khóa hoặc bị vô hiệu hóa");
        }
        if (exitUser.isOTPEmail === false) { 
            throw new ApiError(400, "Tài khoản chưa được xác minh OTP");
        }
        const isMatch = await comparePassword(password, exitUser.password);
        if (!isMatch) {
            throw new ApiError(400, "Mật khẩu không chính xác");
        }
        const newAccessToken = accessToken(
            {
                id: exitUser._id,
                date: new Date(),
                role: exitUser.role.name
            }
        );
        const newRefreshToken = refreshToken({
            id: exitUser._id,
            date: new Date(),
            role: exitUser.role.name
        });
        // Lưu Refresh Token vào HTTP-only Cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });

        await User.findByIdAndUpdate(exitUser._id, { isOnline: true, lastLogin: new Date(), provider: 'local', provider_id: null });
        return success(res, { accessToken: newAccessToken }, "Đăng nhập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// refresh token
export const refreshTokenController = async (req, res, next) => {
    try {
        const tokenFromCookie = req.cookies?.refreshToken;
        const tokenFromBody = req.body?.refreshToken;
        const token = tokenFromCookie || tokenFromBody;
        if (!token) {
            throw new ApiError(401, "Không tìm thấy Refresh Token");
        }
        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (err) {
            throw new ApiError(403, "Refresh Token không hợp lệ hoặc đã hết hạn");
        }
        const user = await User.findById(decoded.id).populate("role");
        if (!user) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }
        if (user.isActive === false) {
            throw new ApiError(403, "Tài khoản của bạn đã bị khóa hoặc bị vô hiệu hóa");
        }
        const newAccessToken = accessToken({
            id: user._id,
            date: new Date(),
            role: user.role.name
        });

        return success(res, { accessToken: newAccessToken }, "Làm mới token thành công", 200);
    } catch (error) {
        next(error);
    }
};

// đăng xuất
export const logoutController = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (userId) {
            await User.findByIdAndUpdate(userId, { isOnline: false });
        } else if (req.cookies?.refreshToken) {
            try {
                const decoded = verifyRefreshToken(req.cookies.refreshToken);
                if (decoded?.id) {
                    await User.findByIdAndUpdate(decoded.id, { isOnline: false });
                }
            } catch (err) {
                // Giảm thiểu lỗi khi logout
            }
        }
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        return success(res, null, "Đăng xuất thành công", 200);
    } catch (error) {
        next(error);
    }
};
// gửi otp
export const sendOtpController =async (req,res,next)=>{
    try {
        const {email}=req.body;
        if(!email){
            return res.status(400).json({ message: "Thiếu email" });
        }
        const result =await sendOtpService(email);
        return success(res,result, "Gửi OTP thành công",201);
    } catch (error) {
        next(error);
    }
}
// verifyOtp
export const verifyOtpController =async (req,res,next)=>{
    try {
        const { email, otp } = req.body;
        const result =await verifyOtpService( email, otp );
        return success(res,result, "Xác thực OTP thành công",201)
    } catch (error) {
        next(error);
    }
}

//get profile
export const getProfileController = async (req, res) => {
    try {
        return res.status(200).json({message:"Get user thành công",profile:req.user})
    } catch (error) {
        return res.status(400).json({message:error.message||"Lỗi hệ thống !"})
    }
}

// 8. Gửi OTP khôi phục mật khẩu (Forgot Password)
export const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordService(email);
        return success(res, result, "Gửi mã OTP khôi phục mật khẩu thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 9. Đặt lại mật khẩu mới bằng OTP (Reset Password)
export const resetPasswordController = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const existUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (!existUser) {
            throw new ApiError(404, "Email không tồn tại trong hệ thống");
        }

        const verification = await Verification.findOne({
            email: email.toLowerCase().trim(),
            code: otp,
            type: "forgot_password",
            used: false,
        });

        if (!verification) {
            throw new ApiError(400, "Mã OTP không đúng hoặc không tồn tại");
        }

        if (verification.expiresAt < new Date()) {
            throw new ApiError(400, "Mã OTP đã hết hạn");
        }

        const hashedPassword = await hashPassword(newPassword);
        await User.findByIdAndUpdate(existUser._id, { password: hashedPassword });

        verification.used = true;
        await verification.save();

        return success(res, null, "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại", 200);
    } catch (error) {
        next(error);
    }
};

// 10. Đổi mật khẩu cho User đang đăng nhập (Change Password)
export const changePasswordController = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId).select("+password");
        if (!user) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }

        const isMatch = comparePassword(oldPassword, user.password);
        if (!isMatch) {
            throw new ApiError(400, "Mật khẩu cũ không chính xác");
        }

        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();

        return success(res, null, "Đổi mật khẩu thành công", 200);
    } catch (error) {
        next(error);
    }
};