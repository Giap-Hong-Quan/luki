import mongoose from "mongoose";

// Sub-schema đại diện cho từng món hàng / biến thể trong giỏ
const CartItemSchema = new mongoose.Schema(
    {
        product: { // ID sản phẩm gốc
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        name: { // Tên sản phẩm lưu vết (Lấy snapshot để render UI cực nhanh)
            type: String,
            trim: true,
            required: true
        },
        color: { // Phân loại Màu sắc (VD: "Màu Đen", "Màu Trắng")
            type: String,
            trim: true,
            required: true
        },
        size: { // Phân loại Kích cỡ (VD: "S", "M", "L", "XL")
            type: String,
            trim: true,
            required: true
        },
        sku: { // Mã SKU biến thể cụ thể để check tồn kho tức thì
            type: String,
            trim: true,
            uppercase: true,
            required: true
        },
        quantity: { // Số lượng đặt mua
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: { // Giá bán của 1 sản phẩm tại thời điểm cho vào giỏ
            type: Number,
            required: true,
            min: 0
        },
        thumbnail: { // URL ảnh đại diện biến thể màu sắc hoặc ảnh chính sản phẩm
            type: String,
            trim: true,
            default: null
        },
        isSelected: { // Trạng thái tích chọn mua (Checkbox giống Shopee/Tiktok Shop để sẵn sàng bấm Checkout)
            type: Boolean,
            default: true
        }
    },
    { _id: true }
);

// Schema chính cho Giỏ hàng chuẩn E-Commerce Pro
const CartSchema = new mongoose.Schema(
    {
        user: { // ID của khách hàng sở hữu giỏ hàng (yêu cầu bắt buộc đăng nhập)
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        items: [CartItemSchema], // Danh sách sản phẩm trong giỏ

        // --- CÁC TRƯỜNG THỐNG KÊ TỰ ĐỘNG ---
        totalItems: { // Tổng số lượng TẤT CẢ sản phẩm trong giỏ
            type: Number,
            default: 0,
            min: 0
        },
        totalPrice: { // Tổng giá trị TẤT CẢ sản phẩm trong giỏ
            type: Number,
            default: 0,
            min: 0
        },
        selectedItems: { // Tổng số lượng các sản phẩm ĐƯỢC TÍCH CHỌN mua (`isSelected = true`)
            type: Number,
            default: 0,
            min: 0
        },
        selectedTotalPrice: { // Tổng tiền của các sản phẩm ĐƯỢC TÍCH CHỌN mua (`isSelected = true`)
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true, versionKey: false }
);

// Hàm Helper tính toán các chỉ số thống kê giỏ hàng
const calculateCartTotals = (cartDoc) => {
    if (!cartDoc.items || cartDoc.items.length === 0) {
        cartDoc.totalItems = 0;
        cartDoc.totalPrice = 0;
        cartDoc.selectedItems = 0;
        cartDoc.selectedTotalPrice = 0;
        return;
    }

    let totalItems = 0;
    let totalPrice = 0;
    let selectedItems = 0;
    let selectedTotalPrice = 0;

    cartDoc.items.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const prc = Number(item.price) || 0;

        totalItems += qty;
        totalPrice += qty * prc;

        if (item.isSelected !== false) {
            selectedItems += qty;
            selectedTotalPrice += qty * prc;
        }
    });

    cartDoc.totalItems = totalItems;
    cartDoc.totalPrice = totalPrice;
    cartDoc.selectedItems = selectedItems;
    cartDoc.selectedTotalPrice = selectedTotalPrice;
};

// Middleware pre-save: Tự động tính toán lại trước khi lưu
CartSchema.pre("save", function () {
    calculateCartTotals(this);
});

// Middleware pre-findOneAndUpdate: Tự động tính toán lại khi dùng update
CartSchema.pre("findOneAndUpdate", function () {
    const update = this.getUpdate();
    if (!update) return;

    const data = update.$set || update;
    if (data.items && Array.isArray(data.items)) {
        const tempCart = { items: data.items };
        calculateCartTotals(tempCart);

        data.totalItems = tempCart.totalItems;
        data.totalPrice = tempCart.totalPrice;
        data.selectedItems = tempCart.selectedItems;
        data.selectedTotalPrice = tempCart.selectedTotalPrice;
    }
});

export default mongoose.model("Cart", CartSchema);
