import express from "express";
import {
    createUserController,
    updateUserController,
    getUserByIdController,
    activeUserController,
    deleteUserByIdController,
    restoreUserController,
    forceDeleteUserController,
    getAllUserController
} from "../controllers/userController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { createUserZod, updateUserZod } from "../validators/userZod.js";

const userRouter = express.Router();

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Tạo mới tài khoản người dùng (Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 example: "nguyenvana@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               membership_tier:
 *                 type: string
 *                 example: "newbie"
 *               avatar:
 *                 type: string
 *                 example: "https://res.cloudinary.com/demo/image/upload/v12345/avatar.jpg"
 *               role:
 *                 type: string
 *                 description: ObjectId của Role (Admin, User, Staff)
 *                 example: "67a8aecbf19fc340b0062caf"
 *     responses:
 *       201:
 *         description: Tạo tài khoản người dùng thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       409:
 *         description: Email đã tồn tại
 */
userRouter.post("/", validate(createUserZod), verifyToken, authorizeRoles("admin"), createUserController);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng (Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               membership_tier:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: ObjectId của Role mới
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật người dùng thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRouter.put("/:id", validate(updateUserZod), verifyToken, authorizeRoles("admin"), updateUserController);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Lấy chi tiết người dùng theo ID (Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin người dùng thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRouter.get("/:id", verifyToken, authorizeRoles("admin"), getUserByIdController);

/**
 * @swagger
 * /user/{id}/active:
 *   put:
 *     summary: Bật/tắt trạng thái người dùng (Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRouter.put("/:id/active", verifyToken, authorizeRoles("admin"), activeUserController);

/**
 * @swagger
 * /user/{id}/delete:
 *   put:
 *     summary: Xóa người dùng (Soft Delete - Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRouter.put("/:id/delete", verifyToken, authorizeRoles("admin"), deleteUserByIdController);

/**
 * @swagger
 * /user/{id}/restore:
 *   put:
 *     summary: Khôi phục người dùng đã xóa mềm (Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Khôi phục tài khoản thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRouter.put("/:id/restore", verifyToken, authorizeRoles("admin"), restoreUserController);

/**
 * @swagger
 * /user/{id}/force:
 *   delete:
 *     summary: Xóa vĩnh viễn người dùng (Hard Delete - Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa vĩnh viễn người dùng thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRouter.delete("/:id/force", verifyToken, authorizeRoles("admin"), forceDeleteUserController);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Lấy danh sách người dùng (Phân trang, Tìm kiếm, Lọc status, Tier, From/To Date, Thùng rác)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: sizePage
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo Họ tên, Email, Số điện thoại
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: active hoặc inactive
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *         description: Hạng thành viên (newbie, bronze, silver, gold, platinum, diamond, black-diamond)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: true để lấy danh sách Thùng rác
 *       - in: query
 *         name: isAll
 *         schema:
 *           type: boolean
 *           default: false
 *         description: true để lấy toàn bộ danh sách không phân trang
 *     responses:
 *       200:
 *         description: Lấy danh sách người dùng thành công
 *       500:
 *         description: Lỗi hệ thống
 */
userRouter.get("/", verifyToken, authorizeRoles("admin"), getAllUserController);

export default userRouter;