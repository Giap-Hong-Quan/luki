import removeVietnameseTones from "./removeVietnameseTones.js";

/**
 * Hàm hỗ trợ sinh mã SKU sản phẩm chính và biến thể tự động
 * Ví dụ Tên sản phẩm: "Chân váy Robin Skirt C16" -> "CVRSC16-8492"
 */
export const generateProductSku = (productName) => {
    if (!productName) return `PRD-${Date.now().toString().slice(-6)}`;
    // Bỏ dấu tiếng Việt và ký tự đặc biệt
    const cleanName = removeVietnameseTones(productName)
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();
    // Lấy các chữ cái đầu tiên của từng từ
    const words = cleanName.split(/\s+/);
    let prefix = "";
    if (words.length >= 2) {
        prefix = words.map(w => w[0]).join("").toUpperCase();
    } else {
        prefix = cleanName.slice(0, 6).toUpperCase();
    }
    // Thêm 4 số ngẫu nhiên để đảm bảo không bao giờ trùng
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
};

/**
 * Hàm sinh mã SKU cho biến thể màu sắc
 * Ví dụ: Product SKU = "CVRSC16-8492", Màu = "Màu Cream"
 * -> Output: "CVRSC16-8492-CREAM"
 */
export const generateVariantSku = (mainSku, colorName) => {
    const cleanColor = removeVietnameseTones(colorName || "")
        .replace(/mau\s+/gi, "") // Bỏ chữ "Mau " hoặc "Màu "
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

    return `${mainSku}-${cleanColor}`;
};
