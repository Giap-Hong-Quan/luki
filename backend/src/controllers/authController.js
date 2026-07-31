import User from "../models/User.js";
import { sendOtpService, signinService, verifyOtpService } from "../services/authService.js"
import admin from "firebase-admin"
import { accessToken } from "../utils/jwt.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Role from "../models/Role.js";
import ApiError from "../exceptions/ApiError.js";
import { success } from "../utils/success.js";
import { hashPassword } from "../utils/password.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));
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
        });

        return success(res, signup, "Đăng ký thành công", 201);
    } catch (error) {
        next(error);
    }
};
// dăng nhập
export const signinController=async (req,res,next)=>{
    try {
        const { email, password } = req.body;
        const exitUser = await User.findOne({ email: email }).select("+password").populate("role");
        if (!exitUser) {
            throw new ApiError(400, "Email không chính xác");
        }
        if (exitUser.isOTPEmail === false) { throw new ApiError(400, "Tài khoản chưa đc xác minh otp") };
        const isMatch = await comparePassword(password, exitUser.password)
        if (!isMatch) {
            throw new ApiError(400, "Email hoặc mật khẩu không chính xác");
        }
        const token = accessToken(
            {
                id: exitUser._id,
                date: new Date(),
                role: exitUser.role.name
            }
        )
        await User.findByIdAndUpdate(exitUser._id,{isActive:true,lastLogin:new Date(),provider:'local',provider_id:null})
       return success(res,token,"Đăng nhập thành công",201)
    } catch (error) {
        next(error);
    }
}
// gửi otp
export const sendOtpController =async (req,res)=>{
    try {
        const {email}=req.body;
        if(!email){
            return res.status(400).json({ message: "Thiếu email" });
        }
        const result =await sendOtpService(email);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({message:error.message||"Lỗi hệ thống"})
    }
}
// verifyOtp
export const verifyOtpController =async (req,res)=>{
    try {
        const { email, otp } = req.body;
        const result =await verifyOtpService( email, otp )
        return res.status(201).json(result)
    } catch (error) {
        return res.status(400).json({message:error.message||"Lỗi hệ thống"})
    }
}

// login gg 
//login gg 
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
export const loginGoogleController =async (req,res)=>{
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if(!token){return res.status(400).json({message:"token không tồn tại"})}
        const decoded = await admin.auth().verifyIdToken(token)
        const {email,name,picture,uid}=decoded;
        // Kiểm tra user trong database của bạn
        let exitUser = await User.findOne({ email }).populate("role");
        const roleId= await Role.findOne({name:"user"})
        if(!exitUser){
            await User.create(
                {
                    full_name:name,
                    email,
                    avatar:picture,
                    provider:"google",
                    provider_id:uid,
                    isOTPEmail:true,
                    isActive:true,
                    lastLogin :new Date(),
                    role:roleId
                }
            )
        }else{
            const update ={
                isActive: true,
                lastLogin: new Date(),
                isOTPEmail:true,
            }
            if(!exitUser.provider_id){
                update.provider="google",
                update.provider_id=uid
            }
            await User.findByIdAndUpdate(exitUser._id,update)
        }
        exitUser = await User.findOne({ email }).populate("role");
        const tokens = accessToken(
            {
                id:exitUser._id,
                date :new Date(),
                role:exitUser.role.name
            }
        ) 
        return res.status(201).json({message:"Login thành công",data:{token:tokens}})
    } catch (error) {
        return res.status(400).json({message:error.message||"Lỗi hệ thống"})
    }
}
//get profile\
//get by id
export const getProfileController =async(req,res)=>{
    try {
        return res.status(200).json({message:"Get user thành công",profile:req.user})
    } catch (error) {
        return res.status(400).json({message:error.message||"Lỗi hệ thống !"})
    }
}