import User from "../models/User.js"
import Role from "../models/Role.js"
import { hashPassword } from "../utils/password.js";

//get all
export const getAllUserService =async(page=1,sizePage=10,filter={})=>{
  //Bước 1: lọc dữ liệu 
  const {search,status,tier,fromDate,toDate}=filter;
  const query ={deletedAt:null}
  if(search){
    query.$or=[   // tìm kiếm 1 trong 2 điều kiên fullname or email 
      {full_name:{$regex:search,$options:"i"}},     // $regex: chuỗi cần tìm kiếm , 
      {email:{$regex:search,$options:"i"}},                                              // $options: cài đặt cho regex  
                                                    // i là không phân biệt hoa thường 
                                                    // m là multi line
                                                    // g tìm toàn bộ 
    ]
  }
  if(status!==undefined){
    query.isActive = status === "active"?true:false;
  }
  if(tier){
    query.membership_tier = tier;
  }
  if(fromDate || toDate){
    query.createdAt = {}
    if(fromDate) query.createdAt.$gte = new Date(fromDate);  // lơn hơn bằng 
    if(toDate) query.createdAt.$lte = new Date(toDate);       // Bé hơn bằng 
  }
  
  // Bước 2 Lây dữ liệu theo lọc 
  //đảm bảo dữ liệu số nguyên dương 
  const currentPage = Math.max(1,parseInt(page));
  const limit = Math.max(1, parseInt(sizePage));
  //tim toán bỏ qua 
  const skipPage = (currentPage -1) * limit;
  //check role
  const roleUser = await Role.findOne({name:"user"});
  query.role = roleUser._id;   // lọc theo role 
  if(!roleUser){throw new Error("Role user không tồn tại")};
  const [allUser,count] = await Promise.all([
                          User.find(query)
                          .sort({createdAt:-1})
                          .select("-password")
                          .populate("role","name")
                          .skip(skipPage)
                          .limit(limit)
                          .lean(),
                          User.countDocuments(query)
  ])
    if(!allUser) throw new Error("Không lấy được tất cả user")
    return {
            users:allUser,
            totalUser:count,
            totalPage:Math.ceil(count / limit),
            currentPage: currentPage,
            sizePage:limit
          };
}
//delete 
export const deleteUserByIdService= async(userId)=>{
    const deleteUser = await User.findByIdAndUpdate(
      userId,
      {deletedAt:new Date()},
      {new:true}
    );
    if(!deleteUser) throw new Error ("Xóa không thành công")
    return deleteUser; // xóa thành công
}
// update
export const updateUserByIdService =async (userId ,payload)=>{
  const{full_name,email}=payload;
  if(!full_name||!email){throw new Error ("Vui lòng nhập đầy đủ thông tin")};
  const data={
    full_name,
    email
  }
  const updateUSer =await User.findByIdAndUpdate(userId,data,  { new: true } );
  if(!updateUSer){throw new Error ("Cập nhật thất bại")}
  return updateUSer;
}
// create usser ain damin
export const createUserService = async ({full_name,email,password})=>{
  if(!full_name||!email||!password){throw new Error ("Vui lòng nhập đầy đủ thông tin")};
  const exitUser= await User.findOne({email});
  if(exitUser){throw new Error("Email đã tồn tại")}
  const roleUser =await Role.findOne({name:"user"})
    if(!roleUser){throw new Error("Role user không tồn tại")};
  const createUser =await User.create(
    {
      full_name,
      email,
      password:await hashPassword(password),
      role:roleUser._id,
      createdBy:"admin",
      isOTPEmail: true,
    }
  )
  return createUser;
}