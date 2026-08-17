import { EyeOff, Lock, User } from 'lucide-react'

const Formsignin = () => {
  return (
    <>
         <form className="w-full space-y-5">
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
                      type="password" 
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-gray-300 text-sm"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer">
                      <EyeOff size={18} />
                    </span>
                  </div>
                </div>

                {/* Remember & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm font-medium">Nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="text-sm font-medium underline">Quên mật khẩu</a>
                </div>

                {/* Submit Button */}
                <button className="w-full py-4 bg-[#f5f5f5] text-[#d9d9d9] font-bold rounded-2xl hover:bg-black hover:text-white transition-colors mt-4">
                  Đăng nhập
                </button>
                </form>
    </>
  )
}

export default Formsignin