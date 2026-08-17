
import CarouselImage from '../../components/auth/CarouselImage'


import { Link } from 'react-router-dom'
import Formsignup from '../../components/auth/Formsignup'
import OTP from '../../components/auth/OTP'
import SignupSuccess from '../../components/auth/SignupSuccess'
import { useState } from 'react'
import Step from '../../components/auth/Step'


const SingupPage = () => {
const [current,setCurrent]=useState<number>(0)

  return (
    <div className="w-full h-full ">
       <div className="flex w-full ">
            <div className=" w-1/3">
                <CarouselImage/>
            </div>
            <div className=" w-2/3 flex items-center flex-col pt-16">
                <div className="text-center flex flex-col gap-4 mb-4">
                    <h1 className="text-5xl font-bold">HOAN</h1>
                    <p className="text-2xl font-bold " >Welcome to HOAN</p>
                    <p className=" mb-5">Đăng kí ngay để có trải nghiệm mua sắm tuyệt vời với chúng mình.</p>
                    <Step current={current} />
                </div>
                <div className="w-[50%] text-center">
                  { current===0 && <Formsignup onNext ={()=>setCurrent(1)} /> }
                  {current===1&& <OTP onNext ={()=>setCurrent(2)} /> }
                {current===2 && <SignupSuccess/>}
                    <p className="mt-8 text-center">Bạn có tài khoản? <Link to='/signin' className="text-blue-700 underline">Đăng nhập ngay</Link></p>
                </div>
            </div>
       </div>
       {/* footer*/}
        <div className="px-16 py-10">
          <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-bold">HOAN</h1>
                  <p>Đông Hưng Thuận,Quận 12 ,TP Hồ Chí Minh</p>
                  <p><strong>Email:</strong>giaphongquan2407@gmail.com</p>
                  <p><strong>Hotline CSKH:</strong>0335906807</p>
                  <p><strong>Hotline Tư vấn:</strong>0335906807</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-bold text-base">Về HOAN</p>
                <p>Giới thiệu</p>
                <p>Tuyển dụng và việc làm </p>
                <p>Blog</p>
                <p>FAQ</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-bold text-base">Chính sách khách hàng</p>
                <p>Chính sách khách hàng</p>
                <p>Chính sách bảo mật </p>
                <p>Chính sách Menbership</p>
                <p>Chính sách quốc tế</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-bold text-base">Hệ thống chánh</p>
                <p>HOAN Bình Đinh</p>
                <p>HOAN Bạc Liêu</p>
                <p>HOAN Thủ Đức</p>
                <p>HOAN Hà Nội</p>
              </div>
          </div>
        </div>
    </div>
  )
}

export default SingupPage