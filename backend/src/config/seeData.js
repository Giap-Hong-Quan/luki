import Role from "../models/Role.js"
export const seedData =async ()=>{
    try {
        const role =[
            {name:"user"},
            {name:"staff"},
            {name:"admin"}
        ]
            for(const i of role){
              const exitRole=await Role.findOne({name:i.name});
                if(!exitRole){
                   const create= await Role.create(i)
                   if(create){
                       console.log("Tạo role thành công")
                   }
                }
                else{
                    console.log("Role đã tồn tại,sẳn sàng làm tiếp")
                }
            }
        
    } catch (error) {
        console.error("Lỗi hệ thống seedata",error.message)
    }
}