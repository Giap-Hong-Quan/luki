import React from 'react'
import {  useNavigate } from 'react-router-dom'

const SignupSuccess = () => {
  const navigate = useNavigate();

  return (
    <>
     <p className='font-semibold text-2xl'>Đăng ký thành công!</p>
     <button onClick={()=>navigate('/signin')} className='w-[50%] py-4 bg-[#f5f5f5] text-[#d9d9d9] font-bold rounded-2xl bg-black text-white transition-colors mt-4'>Đăng nhập ngay</button>
    </>
  )
}

export default SignupSuccess