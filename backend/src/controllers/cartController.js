import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import ApiError from "../exceptions/ApiError.js";
import { success } from "../utils/success.js";
import { checkProductVariantStock } from "../services/productService.js";

/**
 * 1. Lấy thông tin giỏ hàng của người dùng hiện tại
 */
export const getCartController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        success(res, cart, "Lấy thông tin giỏ hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 2. Thêm sản phẩm vào giỏ hàng
 */
export const addToCartController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { productId, color, size, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const product = await Product.findById(productId);
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Tìm sản phẩm trùng khớp trong giỏ hàng (cùng product ID, color, size)
        const existingItemIndex = cart.items.findIndex(
            (item) =>
                item.product.toString() === productId &&
                item.color.toLowerCase() === color.trim().toLowerCase() &&
                item.size.toLowerCase() === size.trim().toLowerCase()
        );

        const currentQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
        const totalTargetQty = currentQty + quantity;

        // Kiểm tra tồn kho sản phẩm/biến thể bằng helper từ productService
        const variantInfo = checkProductVariantStock(product, color, size, totalTargetQty);

        if (existingItemIndex > -1) {
            // Đã có trong giỏ -> Cộng dồn số lượng & cập nhật thông tin giá/ảnh mới nhất
            cart.items[existingItemIndex].quantity = totalTargetQty;
            cart.items[existingItemIndex].price = variantInfo.price;
            cart.items[existingItemIndex].name = variantInfo.name;
            cart.items[existingItemIndex].sku = variantInfo.sku;
            cart.items[existingItemIndex].thumbnail = variantInfo.thumbnail;
        } else {
            // Chưa có -> Thêm món mới vào giỏ hàng
            cart.items.push({
                product: productId,
                name: variantInfo.name,
                color: color.trim(),
                size: size.trim(),
                sku: variantInfo.sku,
                quantity,
                price: variantInfo.price,
                thumbnail: variantInfo.thumbnail,
                isSelected: true
            });
        }

        await cart.save();
        success(res, cart, "Thêm sản phẩm vào giỏ hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 3. Cập nhật số lượng của một món hàng trong giỏ
 */
export const updateCartItemQuantityController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { itemId, productId, color, size, quantity } = req.body;

        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            throw new ApiError(404, "Giỏ hàng của bạn đang trống");
        }

        let itemIndex = -1;
        if (itemId) {
            itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
        } else if (productId && color && size) {
            itemIndex = cart.items.findIndex(
                (item) =>
                    item.product.toString() === productId &&
                    item.color.toLowerCase() === color.trim().toLowerCase() &&
                    item.size.toLowerCase() === size.trim().toLowerCase()
            );
        }

        if (itemIndex === -1) {
            throw new ApiError(404, "Không tìm thấy sản phẩm trong giỏ hàng");
        }

        const targetItem = cart.items[itemIndex];
        const product = await Product.findById(targetItem.product);

        // Check tồn kho cho số lượng mới bằng helper từ productService
        const variantInfo = checkProductVariantStock(
            product,
            targetItem.color,
            targetItem.size,
            quantity
        );

        targetItem.quantity = quantity;
        targetItem.price = variantInfo.price;
        targetItem.name = variantInfo.name;
        targetItem.thumbnail = variantInfo.thumbnail;

        await cart.save();
        success(res, cart, "Cập nhật số lượng sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 4. Tích chọn / Bỏ tích chọn mua hàng (Checkbox)
 */
export const toggleSelectItemController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { selectAll, itemId, productId, color, size, isSelected } = req.body;

        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            throw new ApiError(404, "Giỏ hàng của bạn đang trống");
        }

        if (typeof selectAll === "boolean") {
            cart.items.forEach((item) => {
                item.isSelected = selectAll;
            });
        } else {
            let itemIndex = -1;
            if (itemId) {
                itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
            } else if (productId && color && size) {
                itemIndex = cart.items.findIndex(
                    (item) =>
                        item.product.toString() === productId &&
                        item.color.toLowerCase() === color.trim().toLowerCase() &&
                        item.size.toLowerCase() === size.trim().toLowerCase()
                );
            }

            if (itemIndex === -1) {
                throw new ApiError(404, "Không tìm thấy sản phẩm trong giỏ hàng");
            }

            const currentStatus = cart.items[itemIndex].isSelected;
            cart.items[itemIndex].isSelected =
                typeof isSelected === "boolean" ? isSelected : !currentStatus;
        }

        await cart.save();
        success(res, cart, "Cập nhật trạng thái chọn mua thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 5. Xóa 1 sản phẩm khỏi giỏ hàng
 */
export const removeCartItemController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { itemId, productId, color, size } = req.body;

        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            throw new ApiError(404, "Giỏ hàng của bạn đang trống");
        }

        const initialLength = cart.items.length;

        if (itemId) {
            cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
        } else if (productId && color && size) {
            cart.items = cart.items.filter(
                (item) =>
                    !(
                        item.product.toString() === productId &&
                        item.color.toLowerCase() === color.trim().toLowerCase() &&
                        item.size.toLowerCase() === size.trim().toLowerCase()
                    )
            );
        }

        if (cart.items.length === initialLength) {
            throw new ApiError(404, "Không tìm thấy sản phẩm cần xóa trong giỏ hàng");
        }

        await cart.save();
        success(res, cart, "Xóa sản phẩm khỏi giỏ hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};

/**
 * 6. Xóa sạch giỏ hàng (Clear Cart)
 */
export const clearCartController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        } else {
            cart.items = [];
            await cart.save();
        }

        success(res, cart, "Đã làm trống giỏ hàng thành công", 200);
    } catch (error) {
        next(error);
    }
};
