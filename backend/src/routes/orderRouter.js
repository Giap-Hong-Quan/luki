import express from "express";
import {
    checkoutController,
    getMyOrdersController,
    getOrderDetailController,
    cancelOrderController
} from "../controllers/orderController.js";
import { validate } from "../middlewares/validate.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { checkoutZod, cancelOrderZod, getMyOrdersZod } from "../validators/orderZod.js";

const orderRouter = express.Router();

// Tất cả route đơn hàng đều yêu cầu đăng nhập
orderRouter.use(verifyToken);

/**
 * @swagger
 * /order/checkout:
 *   post:
 *     summary: Tạo đơn hàng từ giỏ hàng (dùng chung cho mọi phương thức thanh toán)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - receiverName
 *                   - receiverPhone
 *                   - province
 *                   - district
 *                   - ward
 *                   - detailAddress
 *                 properties:
 *                   receiverName: { type: string, example: "Nguyễn Văn A" }
 *                   receiverPhone: { type: string, example: "0901234567" }
 *                   province: { type: string, example: "TP. Hồ Chí Minh" }
 *                   district: { type: string, example: "Quận 1" }
 *                   ward: { type: string, example: "Phường Bến Nghé" }
 *                   detailAddress: { type: string, example: "123 Nguyễn Huệ" }
 *                   provinceId: { type: string }
 *                   districtId: { type: string }
 *                   wardId: { type: string }
 *               paymentMethod:
 *                 type: string
 *                 enum: [COD, SEPAY, MOMO, VNPAY, ESCROW]
 *                 example: "COD"
 *               couponCode:
 *                 type: string
 *                 example: "SUMMER2026"
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *       400:
 *         description: Giỏ hàng trống, tồn kho không đủ, hoặc coupon không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Giỏ hàng trống
 *       500:
 *         description: Lỗi hệ thống
 */
orderRouter.post("/checkout", validate(checkoutZod), checkoutController);

/**
 * @swagger
 * /order:
 *   get:
 *     summary: Lấy danh sách đơn hàng của tôi
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PROCESSING, SHIPPING, DELIVERED, COMPLETED, CANCELLED, RETURNED] }
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
orderRouter.get("/", validate(getMyOrdersZod), getMyOrdersController);

/**
 * @swagger
 * /order/{orderCode}:
 *   get:
 *     summary: Lấy chi tiết 1 đơn hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn hàng thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi hệ thống
 */
orderRouter.get("/:orderCode", getOrderDetailController);

/**
 * @swagger
 * /order/{orderCode}/cancel:
 *   put:
 *     summary: Hủy đơn hàng (chỉ khi đơn đang PENDING hoặc PROCESSING)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Đổi ý không mua nữa" }
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *       400:
 *         description: Đơn hàng không thể hủy ở trạng thái hiện tại
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi hệ thống
 */
orderRouter.put("/:orderCode/cancel", validate(cancelOrderZod), cancelOrderController);

export default orderRouter;
