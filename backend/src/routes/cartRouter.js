import express from "express";
import {
    getCartController,
    addToCartController,
    updateCartItemQuantityController,
    toggleSelectItemController,
    removeCartItemController,
    clearCartController
} from "../controllers/cartController.js";
import { validate } from "../middlewares/validate.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
    addToCartZod,
    updateCartItemQuantityZod,
    toggleSelectItemZod,
    removeCartItemZod
} from "../validators/cartZod.js";

const cartRouter = express.Router();

// Tất cả các route giỏ hàng đều yêu cầu đăng nhập
cartRouter.use(verifyToken);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Lấy thông tin giỏ hàng của người dùng hiện tại
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
cartRouter.get("/", getCartController);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - color
 *               - size
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "65f1a2b3c4d5e6f7a8b9c0d1"
 *               color:
 *                 type: string
 *                 example: "Màu Đen"
 *               size:
 *                 type: string
 *                 example: "M"
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Thêm vào giỏ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tồn kho không đủ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
cartRouter.post("/add", validate(addToCartZod), addToCartController);

/**
 * @swagger
 * /cart/update-quantity:
 *   put:
 *     summary: Cập nhật số lượng của sản phẩm trong giỏ
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: ID của phần tử trong mảng items (tùy chọn)
 *               productId:
 *                 type: string
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Cập nhật số lượng thành công
 *       400:
 *         description: Tồn kho không đủ
 *       404:
 *         description: Sản phẩm không có trong giỏ
 *       500:
 *         description: Lỗi hệ thống
 */
cartRouter.put("/update-quantity", validate(updateCartItemQuantityZod), updateCartItemQuantityController);

/**
 * @swagger
 * /cart/toggle-select:
 *   put:
 *     summary: Tích chọn / Bỏ tích chọn sản phẩm để chuẩn bị mua hàng (Checkbox)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectAll:
 *                 type: boolean
 *                 description: Chọn tất cả hoặc bỏ chọn tất cả
 *                 example: true
 *               itemId:
 *                 type: string
 *               productId:
 *                 type: string
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *               isSelected:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái tích chọn thành công
 *       404:
 *         description: Giỏ hàng trống hoặc không tìm thấy món hàng
 *       500:
 *         description: Lỗi hệ thống
 */
cartRouter.put("/toggle-select", validate(toggleSelectItemZod), toggleSelectItemController);

/**
 * @swagger
 * /cart/remove:
 *   delete:
 *     summary: Xóa 1 sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *               productId:
 *                 type: string
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xóa sản phẩm khỏi giỏ thành công
 *       404:
 *         description: Sản phẩm không có trong giỏ
 *       500:
 *         description: Lỗi hệ thống
 */
cartRouter.delete("/remove", validate(removeCartItemZod), removeCartItemController);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Làm trống giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã làm trống giỏ hàng
 *       500:
 *         description: Lỗi hệ thống
 */
cartRouter.delete("/clear", clearCartController);

export default cartRouter;
