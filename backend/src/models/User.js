import mongoose from "mongoose"
const User= new mongoose.Schema(
    {
        full_name:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase: true,
            trim: true
        },
        phone: { 
            type: String,
             trim: true ,
             default:null
            },
        password:{
            type:String,
            select: false,
        },
        avatar :{
            type:String,
            default:null
        },
        provider:{
            type:String,
            enum:["local","facebook","google"],
            default:"local"
        },
        provider_id:{
            type:String,
            index:true,
            default:null
        },
        isOTPEmail:{
            type:Boolean,
            default:false
        },
        isActive:{
            type:Boolean,
            default:false
        },
        role:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Role",
        },
        lastLogin:{
            type:Date,
            default:null
        },
        deletedAt:{
            type:Date,
            default:null
        },
        createdBy: {
            type: String,
            enum: ["user","admin"],
            default: "user",
        },
        addresses:[
            {
                receiverName: String,
                receiverPhone: String,
                province: String,
                district: String,
                ward: String,
                detail: String,
                isDefault: { type: Boolean, default: false },
            }
        ],
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        accumulated_points: { type: Number, default: 0 },
        membership_tier: {
            type: String,
            enum: [
                "newbie",
                "bronze",
                "silver",
                "gold",
                "platinum",
                "diamond",
                "black-diamond"
            ],
            default: "newbie",
        },
    },
    {timestamps:true,versionKey:false}
)
export default mongoose.model("User",User);