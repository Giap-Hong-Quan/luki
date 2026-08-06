import mongoose from "mongoose";
import removeVietnameseTones from "../utils/removeVietnameseTones.js";
import slugifyModel from "../utils/slugifyModel.js";

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        noAccentName: { // dùng cho tìm kiếm không dấu
            type: String,
            index: true
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true
        },
        parent: { // null = category cấp 1 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null
        },
        image: { // URL ảnh đại diện danh mục hoặc icon
            type: String,
            default: null
        },
        order: { // sắp xếp thứ tự hiển thị trong cùng 1 cấp
            type: Number,
            default: 0
        },
        productCount: { // cập nhật số lượng sản phẩm khi thêm/xóa sản phẩm
            type: Number,
            default: 0
        },
        seo: { // seo-title trên thanh tab của trình duyệt, seo-description hiển thị trên google
            metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
            metaDescription: { type: String, trim: true, maxlength: 160, default: "" },
            metaKeywords: [{ type: String, trim: true }]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true, versionKey: false }
);

// Middleware pre-save: Chỉ tạo lại noAccentName và slug khi field name thực sự bị thay đổi
CategorySchema.pre("save", async function() {
    if (this.isModified("name")) {
        this.noAccentName = removeVietnameseTones(this.name);
        this.slug = slugifyModel(this.name);
    }
});

// Middleware pre-findOneAndUpdate: Tự động cập nhật noAccentName và slug nếu update name bằng findByIdAndUpdate/findOneAndUpdate
CategorySchema.pre("findOneAndUpdate", async function() {
    const update = this.getUpdate();
    if (update && update.name) {
        update.noAccentName = removeVietnameseTones(update.name);
        update.slug = slugifyModel(update.name);
    }
});

export default mongoose.model("Category", CategorySchema);