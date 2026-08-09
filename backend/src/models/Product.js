import mongoose from "mongoose";
import removeVietnameseTones from "../utils/removeVietnameseTones.js";
import slugifyModel from "../utils/slugifyModel.js";

// Sub-schema cho thông tin Kích cỡ & Tồn kho của từng Size
const SizeOptionSchema = new mongoose.Schema(
    {
        size: { type: String, trim: true, required: true },     // Ví dụ: "S", "M", "L", "XL", "XXL"
        stock: { type: Number, default: 0, min: 0 }             // Số lượng tồn kho riêng cho size này
    },
    { _id: true }
);

// Sub-schema cho Biến thể màu sắc sản phẩm thời trang (Màu sắc -> chứa danh sách Size)
const ColorVariantSchema = new mongoose.Schema(
    {
        color: { type: String, trim: true, required: true },    // Ví dụ: "Màu Đen", "Màu Trắng", "Xanh Navy"
        image: { type: String, default: null },                 // URL hình ảnh riêng đại diện cho màu sắc này (giống Shopee)
        sku: { type: String, trim: true, uppercase: true, default: "" }, // Mã SKU riêng đại diện cho biến thể màu này (VD: DXCVMD-2302-CREAM)
        sizes: [SizeOptionSchema]                               // Danh sách các Size & Tồn kho thuộc màu sắc này
    },
    { _id: true }
);

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        noAccentName: { // Dùng cho tìm kiếm không dấu
            type: String,
            index: true
        },
        slug: { // URL SEO thân thiện
            type: String,
            unique: true,
            lowercase: true,
            index: true
        },
        sku: { // Mã sản phẩm độc nhất (Barcode/SKU)
            type: String,
            unique: true,
            trim: true,
            uppercase: true,
            required: true
        },
        description: { // Mô tả chi tiết sản phẩm / chất liệu / hướng dẫn bảo quản
            type: String,
            trim: true,
            default: ""
        },
        attributes: [ // Các thông số thuộc tính thời trang (Chất liệu, Phong cách, Kiểu dáng, Mẫu họa tiết...)
            {
                name: { type: String, trim: true },  // "CHẤT LIỆU", "PHONG CÁCH", "KIỂU", "MẪU"
                value: { type: String, trim: true } // "Cotton", "Năng động, cá tính", "Chân váy A", "Trơn"
            }
        ],
        size_chart: { // URL hình ảnh Hướng dẫn chọn size (Bảng quy đổi kích cỡ)
            type: String,
            default: null
        },
        original_price: { // Giá gốc / Giá niêm yết (không bắt buộc)
            type: Number,
            default: null,
            min: 0
        },
        price: { // Giá bán thực tế (Giá sau giảm)
            type: Number,
            required: true,
            min: 0
        },
        category: { // Phân loại danh mục chính
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        collections: [ // Thuộc các bộ sưu tập nào (nếu có)
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Collection"
            }
        ],
        thumbnail: { // Ảnh đại diện chính của sản phẩm
            type: String,
            default: null
        },
        images: [ // Danh sách bộ sưu tập ảnh chi tiết của sản phẩm
            {
                type: String
            }
        ],
        stock: { // Tổng số lượng tồn kho của sản phẩm
            type: Number,
            default: 0,
            min: 0
        },
        sold: { // Tổng số lượng sản phẩm đã bán
            type: Number,
            default: 0,
            min: 0
        },
        variants: [ColorVariantSchema], // Biến thể phân cấp: Màu sắc -> Danh sách Size & Tồn kho riêng
        ratings: { // Điểm đánh giá trung bình & lượt đánh giá
            average: { type: Number, default: 5, min: 1, max: 5 },
            count: { type: Number, default: 0 }
        },
        isFeatured: { // Sản phẩm nổi bật (HOT / Best Seller)
            type: Boolean,
            default: false
        },
        seo: { // Tối ưu SEO cho sản phẩm
            metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
            metaDescription: { type: String, trim: true, maxlength: 160, default: "" },
            metaKeywords: [{ type: String, trim: true }]
        },
        isActive: { // Trạng thái ẩn / hiện sản phẩm
            type: Boolean,
            default: true
        },
        deletedAt: { // Xóa mềm (Thùng rác)
            type: Date,
            default: null
        },
        createdBy: { // ID của Admin / Staff khởi tạo sản phẩm
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true, versionKey: false }
);

// Middleware pre-save: Tự động tính noAccentName và slug
ProductSchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.noAccentName = removeVietnameseTones(this.name);
        this.slug = slugifyModel(this.name);
    }
});

// Middleware pre-findOneAndUpdate: Tự động cập nhật noAccentName và slug khi đổi name
ProductSchema.pre("findOneAndUpdate", async function () {
    const update = this.getUpdate();
    if (!update) return;

    const data = update.$set || update;
    if (data.name) {
        data.noAccentName = removeVietnameseTones(data.name);
        data.slug = slugifyModel(data.name);
    }
});

export default mongoose.model("Product", ProductSchema);
