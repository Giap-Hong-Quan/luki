import express from "express";
import {
    createCategoryController,
    reorderCategoryController,
    updateCategoryController,
    getCategoryByIdController,
    getCategoryBySlugController,
    activeCategoryController,
    deleteCategoryController,
    restoreCategoryController,
    getAllCategoryController,
    forceDeleteCategoryController
} from "../controllers/categoryController.js";
import { validate } from "../middlewares/validate.js";
import { createCategoryZod, updateCategoryZod, getCategoriesQueryZod } from "../validators/categoryZod.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const categoryRouter = express.Router();

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Category]
 *     description: API dùng để tạo danh mục mới (Yêu cầu quyền admin hoặc staff). Tự động sinh `slug` và `noAccentName`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Áo Thun Nam"
 *               parent:
 *                 type: string
 *                 nullable: true
 *                 description: ID của danh mục cha (nếu có)
 *                 example: "67a8aecbf19fc340b0062caf"
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: URL hình ảnh đại diện danh mục
 *                 example: "https://res.cloudinary.com/demo/image/upload/v12345/category.jpg"
 *               order:
 *                 type: integer
 *                 description: Thứ tự hiển thị trong cùng cấp
 *                 example: 1
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                     example: "Áo Thun Nam Cao Cấp - Thời Trang 2026"
 *                   metaDescription:
 *                     type: string
 *                     example: "Chuyên các dòng áo thun nam cao cấp, thoáng mát, chính hãng."
 *                   metaKeywords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["ao thun", "ao thun nam", "thoi trang nam"]
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ (Validate Zod thất bại)
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu role admin hoặc staff)
 *       404:
 *         description: Danh mục cha không tồn tại
 *       409:
 *         description: Tên danh mục đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.post("/", validate(createCategoryZod), verifyToken, authorizeRoles("admin", "staff"), createCategoryController);

/**
 * @swagger
 * /category/reorder:
 *   put:
 *     summary: Cập nhật thứ tự sắp xếp danh mục hàng loạt (Reorder Drag & Drop)
 *     tags: [Category]
 *     description: Cập nhật lại thứ tự (`order`) của nhiều danh mục cùng lúc (Yêu cầu quyền admin hoặc staff).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *                 - order
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "67a8aecbf19fc340b0062caf"
 *                 order:
 *                   type: integer
 *                   example: 1
 *     responses:
 *       200:
 *         description: Cập nhật thứ tự danh mục thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.put("/reorder", verifyToken, authorizeRoles("admin", "staff"), reorderCategoryController);

/**
 * @swagger
 * /category/{id}:
 *   put:
 *     summary: Cập nhật thông tin danh mục
 *     tags: [Category]
 *     description: Cập nhật thông tin của danh mục theo ID (Yêu cầu quyền admin hoặc staff).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent:
 *                 type: string
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *               order:
 *                 type: integer
 *               seo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy danh mục
 *       409:
 *         description: Tên danh mục đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.put("/:id", validate(updateCategoryZod), verifyToken, authorizeRoles("admin", "staff"), updateCategoryController);

/**
 * @swagger
 * /category/{id}:
 *   get:
 *     summary: Lấy thông tin danh mục theo ID
 *     tags: [Category]
 *     description: Trả về thông tin chi tiết của một danh mục dựa trên ObjectId.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId của danh mục
 *         example: "67a8b3d7d2b9c41d40fa1234"
 *     responses:
 *       200:
 *         description: Lấy danh mục thành công
 *       400:
 *         description: Id danh mục không đúng định dạng ObjectId
 *       404:
 *         description: Danh mục không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.get("/:id", getCategoryByIdController);

/**
 * @swagger
 * /category/slug/{slug}:
 *   get:
 *     summary: Lấy thông tin danh mục theo slug (SEO)
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Lấy danh mục thành công
 *       404:
 *         description: Không tìm thấy danh mục
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.get("/slug/:slug", getCategoryBySlugController);

/**
 * @swagger
 * /category/{id}/active:
 *   put:
 *     summary: Bật/tắt trạng thái danh mục
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy danh mục
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.put("/:id/active", verifyToken, authorizeRoles("admin", "staff"), activeCategoryController);

/**
 * @swagger
 * /category/{id}/delete:
 *   put:
 *     summary: Xóa danh mục (soft delete)
 *     tags: [Category]
 *     description: Đánh dấu danh mục là đã xóa bằng cách đặt isActive = false và deletedAt = thời gian hiện tại.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục cần xóa
 *     responses:
 *       200:
 *         description: Xóa danh mục thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy danh mục
 *       409:
 *         description: Danh mục đã được xóa trước đó
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.put("/:id/delete", verifyToken, authorizeRoles("admin", "staff"), deleteCategoryController);

/**
 * @swagger
 * /category/{id}/restore:
 *   put:
 *     summary: Khôi phục danh mục đã bị xóa
 *     tags: [Category]
 *     description: Khôi phục một danh mục đã bị soft delete (đã có deletedAt). Sau khi khôi phục, isActive sẽ được đặt thành true và deletedAt trở về null.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục cần khôi phục
 *     responses:
 *       200:
 *         description: Khôi phục danh mục thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy danh mục
 *       409:
 *         description: Danh mục chưa bị xóa — không thể khôi phục
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.put("/:id/restore", verifyToken, authorizeRoles("admin", "staff"), restoreCategoryController);

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Lấy danh sách danh mục (Hỗ trợ Phân trang, Tìm kiếm, Thùng rác, Bật/Tắt, Lấy toàn bộ)
 *     tags: [Category]
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
 *         description: Từ khóa tìm kiếm theo tên (có dấu hoặc không dấu)
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Đặt true để lấy danh sách danh mục trong Thùng rác (soft-deleted)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái true (đang bật) hoặc false (đang tắt)
 *       - in: query
 *         name: parent
 *         schema:
 *           type: string
 *         description: Lọc theo ObjectId danh mục cha (hoặc 'null' / 'root' để lấy danh mục cấp 1)
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.get("/", validate(getCategoriesQueryZod), getAllCategoryController);

/**
 * @swagger
 * /category/{id}/force:
 *   delete:
 *     summary: Xóa vĩnh viễn danh mục (Hard Delete)
 *     tags: [Category]
 *     description: Xóa hoàn toàn danh mục khỏi Database (Yêu cầu quyền admin). Không cho phép xóa nếu danh mục đang chứa danh mục con.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục cần xóa vĩnh viễn
 *     responses:
 *       200:
 *         description: Xóa vĩnh viễn danh mục thành công
 *       400:
 *         description: Danh mục đang chứa danh mục con — không thể xóa
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu role admin)
 *       404:
 *         description: Không tìm thấy danh mục
 *       500:
 *         description: Lỗi hệ thống
 */
categoryRouter.delete("/:id/force", verifyToken, authorizeRoles("admin"), forceDeleteCategoryController);

export default categoryRouter;
