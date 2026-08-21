import axiosClient from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/contants/api-endpoint";
import { SigninPayload, SignupPayload, LoginResponse,RegisterResponse } from "@/types/authType";
export const authService = {
  // Đăng nhập
  signin: (payload: SigninPayload): Promise<LoginResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.SIGNIN, payload);
  },

  // Đăng ký tài khoản
  signup: (payload: SignupPayload): Promise<RegisterResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.SIGNUP, payload);
  },

  // Đăng xuất
  logout: (): Promise<{ message?: string; success?: boolean }> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  // Lấy thông tin cá nhân hiện tại
  getProfile: (): Promise<any> => {
    return axiosClient.get(API_ENDPOINTS.AUTH.PROFILE);
  },

  // Gửi OTP xác minh
  sendOtp: (email: string): Promise<RegisterResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { email });
  },

  // Xác minh OTP
  verifyOtp: (email: string, otp: string): Promise<RegisterResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  },
};

export default authService;
