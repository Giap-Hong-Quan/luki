import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { LoginFormData } from "@/validators/auth.validator";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { SignupPayload } from "@/types/authType";
// đăng nhập
export const useLogin =()=> {
    const router = useRouter();
    return useMutation({
    mutationFn: (data: LoginFormData) => authService.signin(data),
    onSuccess: (res) => {
        // Xử lý thành công sau khi đăng nhập
        if (res?.data?.accessToken) {
            localStorage.setItem("accessToken", res.data.accessToken);
        }
        //  queryClient.invalidateQueries({ queryKey: AUTH_KEYS.profile() });
        toast.success(res?.message || "Đăng nhập thành công!");
        router.push("/");
    },
    onError: (error:any) => {
       toast.error(error?.message || "Đăng nhập thất bại, vui lòng thử lại!");
    },
})
}   

// đăng ký 
export const useRegister = () => {
    return useMutation({
        mutationFn: (data: SignupPayload) => authService.signup(data),
        onSuccess: (res: any) => {
            toast.success(res?.message || "Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Đăng ký thất bại, vui lòng thử lại!");
        },
    });
};

// Xác thực OTP
export const useVerifyOtp = () => {
    const router = useRouter();
    return useMutation({
        mutationFn: ({ email, otp }: { email: string; otp: string }) => 
            authService.verifyOtp(email, otp),
        onSuccess: (res: any) => {
            toast.success(res?.message || "Xác thực OTP thành công! Vui lòng đăng nhập.");
            router.push("/login");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Xác thực OTP thất bại, vui lòng thử lại!");
        },
    });
};

// Gửi lại mã OTP
export const useSendOtp = () => {
    return useMutation({
        mutationFn: (email: string) => authService.sendOtp(email),
        onSuccess: (res: any) => {
            toast.success(res?.message || "Mã OTP mới đã được gửi về email!");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Gửi mã OTP thất bại, vui lòng thử lại!");
        },
    });
};

