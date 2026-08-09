import ApiError from "../exceptions/ApiError.js";

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
