import ApiError from "../exceptions/ApiError.js";
import Product from "../models/Product.js";

/**
 * Helper kiểm tra tồn kho & thông tin sản phẩm/biến thể (Màu sắc, Kích cỡ, SKU, Ảnh, Giá)
 */
export const checkProductVariantStock = (product, color, size, requestedQty) => {
    if (!product || product.isActive === false || (product.deletedAt && product.deletedAt !== null)) {
        throw new ApiError(404, "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh");
    }

    let availableStock = product.stock;
    let variantSku = product.sku;
    let variantImage = product.thumbnail;

    if (product.variants && product.variants.length > 0) {
        const colorVar = product.variants.find(
            (v) => v.color && v.color.trim().toLowerCase() === color.trim().toLowerCase()
        );
        if (!colorVar) {
            throw new ApiError(400, `Phân loại màu '${color}' không tồn tại cho sản phẩm này`);
        }

        const sizeOpt = colorVar.sizes?.find(
            (s) => s.size && s.size.trim().toLowerCase() === size.trim().toLowerCase()
        );
        if (!sizeOpt) {
            throw new ApiError(400, `Kích cỡ '${size}' không tồn tại cho màu '${color}'`);
        }

        availableStock = sizeOpt.stock;
        variantSku = colorVar.sku || `${product.sku}-${sizeOpt.size.toUpperCase()}`;
        variantImage = colorVar.image || product.thumbnail;
    }

    if (requestedQty > availableStock) {
        throw new ApiError(
            400,
            `Số lượng đặt mua (${requestedQty}) vượt quá số lượng tồn kho khả dụng (${availableStock})`
        );
    }

    return {
        name: product.name,
        price: product.price,
        sku: variantSku,
        thumbnail: variantImage,
        availableStock
    };
};

/**
 * Trừ tồn kho THẬT khi đơn hàng được tạo (khác `checkProductVariantStock` ở trên - hàm đó
 * chỉ KIỂM TRA, hàm này thực sự trừ số lượng trong DB). Nhận thêm `session` để nằm chung
 * transaction với việc tạo Order - nếu bước nào sau đó lỗi thì tồn kho vừa trừ sẽ tự rollback.
 */
export const decreaseProductStock = async (productId, color, size, quantity, session) => {
    const product = await Product.findById(productId).session(session);
    if (!product || product.isActive === false || (product.deletedAt && product.deletedAt !== null)) {
        throw new ApiError(404, "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh");
    }

    if (product.variants && product.variants.length > 0) {
        const colorVar = product.variants.find(
            (v) => v.color && v.color.trim().toLowerCase() === color.trim().toLowerCase()
        );
        if (!colorVar) {
            throw new ApiError(400, `Phân loại màu '${color}' không tồn tại cho sản phẩm '${product.name}'`);
        }

        const sizeOpt = colorVar.sizes?.find(
            (s) => s.size && s.size.trim().toLowerCase() === size.trim().toLowerCase()
        );
        if (!sizeOpt) {
            throw new ApiError(400, `Kích cỡ '${size}' không tồn tại cho màu '${color}'`);
        }

        if (sizeOpt.stock < quantity) {
            throw new ApiError(400, `Sản phẩm '${product.name}' (${color}/${size}) không đủ tồn kho`);
        }
        sizeOpt.stock -= quantity;
    } else {
        if (product.stock < quantity) {
            throw new ApiError(400, `Sản phẩm '${product.name}' không đủ tồn kho`);
        }
        product.stock -= quantity;
    }

    product.sold += quantity;
    await product.save({ session });
};

/**
 * Hoàn lại tồn kho khi đơn hàng bị hủy (ngược lại với `decreaseProductStock` ở trên).
 * Không dùng session vì thường được gọi độc lập (lúc hủy đơn, hoặc từ cron job), không nằm
 * trong transaction tạo đơn ban đầu.
 */
export const restoreProductStock = async (productId, color, size, quantity) => {
    const product = await Product.findById(productId);
    if (!product) return; // Sản phẩm có thể đã bị xóa hẳn, bỏ qua không hoàn kho được nữa

    if (product.variants && product.variants.length > 0) {
        const colorVar = product.variants.find(
            (v) => v.color && v.color.trim().toLowerCase() === color.trim().toLowerCase()
        );
        const sizeOpt = colorVar?.sizes?.find(
            (s) => s.size && s.size.trim().toLowerCase() === size.trim().toLowerCase()
        );
        if (sizeOpt) sizeOpt.stock += quantity;
    } else {
        product.stock += quantity;
    }

    product.sold = Math.max(0, product.sold - quantity);
    await product.save();
};
