import express from "express";
import { 
    signinController, 
    signupController, 
    sendOtpController, 
    verifyOtpController, 
    getProfileController,
    refreshTokenController,
    logoutController,
    forgotPasswordController,
    resetPasswordController,
    changePasswordController
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { 
    signupSchema, 
    signinSchema, 
    sendOtpSchema, 
    verifyOtpSchema, 
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema
} from "../validators/authZod.js";

const authRouter = express.Router();
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     description: Đăng ký tài khoản người dùng mới và tự động gửi mã OTP xác nhận về email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Đăng ký thành công, vui lòng kiểm tra email nhận OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng ký thành công.Vui lòng kiểm tra email để nhận mã OTP!"
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ (lỗi validate Zod)
 *       409:
 *         description: Email đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/signup", validate(signupSchema), signupController);
/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     description: Đăng nhập bằng email và mật khẩu. Trả về Access Token và lưu Refresh Token vào HTTP-only cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng nhập thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Email/Mật khẩu không chính xác hoặc tài khoản chưa xác minh OTP
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/signin", validate(signinSchema), signinController);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới Access Token
 *     tags: [Auth]
 *     description: Sử dụng Refresh Token (từ cookie hoặc body) để lấy Access Token mới.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh Token (nếu không truyền qua cookie)
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Làm mới token thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Không tìm thấy Refresh Token
 *       403:
 *         description: Refresh Token không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/refresh-token", validate(refreshTokenSchema), refreshTokenController);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     description: Đăng xuất tài khoản và xóa Refresh Token cookie.
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng xuất thành công"
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/logout", logoutController);
/**
 * @swagger
 * /auth/sendOtp:
 *   post:
 *     summary: Gửi mã OTP xác minh email
 *     tags: [Auth]
 *     description: Gửi mã OTP tới email người dùng.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@gmail.com"
 *     responses:
 *       201:
 *         description: Gửi mã OTP thành công
 *       400:
 *         description: Thiếu email hoặc gửi OTP thất bại
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/sendOtp", validate(sendOtpSchema), sendOtpController);
/**
 * @swagger
 * /auth/verifyOTp:
 *   post:
 *     summary: Xác minh mã OTP
 *     tags: [Auth]
 *     description: Kiểm tra mã OTP do người dùng nhập để kích hoạt/xác minh tài khoản.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@gmail.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Xác minh OTP thành công
 *       400:
 *         description: OTP không chính xác hoặc đã hết hạn
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/verifyOTp", validate(verifyOtpSchema), verifyOtpController);
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Lấy thông tin cá nhân
 *     tags: [Auth]
 *     description: Trả về thông tin của người dùng đang đăng nhập (yêu cầu Bearer Token).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get user thành công"
 *                 profile:
 *                   type: object
 *       401:
 *         description: Chưa xác thực (Token thiếu hoặc không hợp lệ)
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.get("/profile", verifyToken, getProfileController);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Gửi OTP khôi phục mật khẩu (Quên mật khẩu)
 *     tags: [Auth]
 *     description: Gửi mã OTP khôi phục mật khẩu về email của người dùng nếu tài khoản tồn tại.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@gmail.com"
 *     responses:
 *       200:
 *         description: Gửi mã OTP khôi phục mật khẩu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Email không tồn tại trong hệ thống
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordController);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu mới bằng OTP
 *     tags: [Auth]
 *     description: Nhập mã OTP nhận được qua email và mật khẩu mới để tiến hành khôi phục mật khẩu.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@gmail.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không đúng hoặc đã hết hạn
 *       404:
 *         description: Email không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu tài khoản (Đã đăng nhập)
 *     tags: [Auth]
 *     description: Yêu cầu người dùng đang đăng nhập (Bearer Token) nhập mật khẩu cũ và mật khẩu mới để đổi mật khẩu.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không chính xác
 *       401:
 *         description: Chưa đăng nhập hoặc Token hết hạn
 *       500:
 *         description: Lỗi hệ thống
 */
authRouter.put("/change-password", verifyToken, validate(changePasswordSchema), changePasswordController);

export default authRouter;