
import CarouselImage from "../../components/auth/CarouselImage"
import { Link, useNavigate } from "react-router-dom"
import Formsignin from "../../components/auth/Formsignin"
import { loginWithGoogle } from "../../service/auth"


const SigninPage = () => {
  const navigate=useNavigate()
  const handleLoginGG=async ()=>{
    try {
      const data= await loginWithGoogle();
      console.log("Access Token:", data.data.token);
      if(data){
        navigate("/");
      }
    } catch (error) {
       console.error(error);
    }
  }
  return (
    // container
    <div className="w-full h-full ">
        {/* top */}
        <div className="flex w-full ">
            {/* left */}
            <div className=" w-1/3">
              <CarouselImage/>
            </div>
            {/* right */}
            <div className=" w-2/3 flex items-center flex-col pt-16">
              <div className="text-center flex flex-col gap-4">
                <h1 className="text-5xl font-bold">HOAN</h1>
                <p className="text-2xl font-bold" >Welcome to HOAN</p>
                <p className=" mb-5">Đăng nhập ngay để có trải nghiệm mua sắm tuyệt vời cùng chúng tôi.</p>
                {/* login fb gg */}
                <div className="flex flex-col gap-7">
                  <p className="font-bold">Đăng nhập nhanh với</p>
                  <div className="flex items-center justify-center gap-16">
                    <button onClick={()=>handleLoginGG()} className="w-12 h-12">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png" alt="FB" />
                    </button>
                    <button className="w-12 h-12">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png" alt="GG" />
                    </button>
                  </div>
                  <p className="font-bold">Hoặc</p>
                </div>
                {/* login form */}
                <div className="w-full">
               <Formsignin/>
                </div>
              </div>
              <p className="mt-8">Bạn chưa có tài khoản? <Link to='/signup' className="text-blue-700 underline">Đăng ký ngay</Link></p>
            </div>
        </div>
        {/* bottom */}
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

export default SigninPage