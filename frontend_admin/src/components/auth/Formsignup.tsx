import { Eye, EyeOff, Lock, User } from 'lucide-react';
import React, { useState } from 'react'
type FormSignUpProps ={
  onNext :()=>void 
}
const Formsignup = ({onNext}:FormSignUpProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <>
          <form className="w-full space-y-5">
                    {/* ho ten */}
                     <div className="flex flex-col items-start  gap-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <User size={18} />
                        </span>
                        <input 
                        type="text" 
                        placeholder="Nhập họ và tên"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-gray-300 text-sm"
                        />
                    </div>
                    </div>

                    {/* Email/Phone Field */}
                    <div className="flex flex-col items-start  gap-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <User size={18} />
                        </span>
                        <input 
                        type="text" 
                        placeholder="Nhập email của bạn"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-gray-300 text-sm"
                        />
                    </div>
                    </div>

                    {/* Password Field */}
                    <div className="flex flex-col items-start gap-2">
                    <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <Lock size={18} />
                        </span>
                        <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu của bạn"
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-gray-300 text-sm"
                        />
                 
                        <span onClick={()=>setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer">
                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </span>
                    </div>
                    </div>
                    {/* confrom pass */}
                     <div className="flex flex-col items-start  gap-2">
                    <label className="text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <User size={18} />
                        </span>
                        <input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu của bạn"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-gray-300 text-sm"
                        />
                        <span onClick={()=>setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer">
                            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </span>
                    </div>
                    </div>
                    {/* Submit Button */}
                    <button onClick={onNext}  className="w-full py-4 bg-[#f5f5f5] text-[#d9d9d9] font-bold rounded-2xl hover:bg-black hover:text-white transition-colors mt-4">
                    Đăng ký
                    </button>
                    </form>    
    </>
  )
}

export default Formsignup