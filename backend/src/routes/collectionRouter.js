import express from "express";
import {
    createCollectionController,
    reorderCollectionController,
    updateCollectionController,
    getCollectionByIdController,
    getCollectionBySlugController,
    activeCollectionController,
    deleteCollectionController,
    restoreCollectionController,
    getAllCollectionController,
    forceDeleteCollectionController
} from "../controllers/collectionController.js";
import { validate } from "../middlewares/validate.js";
import { createCollectionZod, updateCollectionZod, getCollectionsQueryZod } from "../validators/collectionZod.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const collectionRouter = express.Router();

/**
 * @swagger
 * /collection:
 *   post:
 *     summary: Tạo mới bộ sưu tập
 *     tags: [Collection]
 *     description: API dùng để tạo bộ sưu tập mới (Yêu cầu quyền admin hoặc staff). Tự động sinh `slug` và `noAccentName`.
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
 *                 example: "Bộ Sưu Tập Mùa Hè 2026"
 *               description:
 *                 type: string
 *                 example: "Những thiết kế thoáng mát, năng động đón hè."
 *               banner_url:
 *                 type: string
 *                 example: "https://example.com/banner.jpg"
 *               thumbnail_url:
 *                 type: string
 *                 example: "https://example.com/thumb.jpg"
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               order:
 *                 type: integer
 *                 example: 1
 *               isFeatured:
 *                 type: boolean
 *                 example: true
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                     example: "Bộ Sưu Tập Mùa Hè 2026 - Thời Trang Hot"
 *                   metaDescription:
 *                     type: string
 *                     example: "Khám phá phong cách thời trang hè độc đáo."
 *                   metaKeywords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["bst mua he", "thoi trang he"]
 *     responses:
 *       201:
 *         description: Tạo bộ sưu tập thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       409:
 *         description: Tên bộ sưu tập đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.post("/", validate(createCollectionZod), verifyToken, authorizeRoles("admin", "staff"), createCollectionController);

/**
 * @swagger
 * /collection/reorder:
 *   put:
 *     summary: Cập nhật thứ tự sắp xếp bộ sưu tập hàng loạt (Reorder Drag & Drop)
 *     tags: [Collection]
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
 *         description: Cập nhật thứ tự thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.put("/reorder", verifyToken, authorizeRoles("admin", "staff"), reorderCollectionController);

/**
 * @swagger
 * /collection/{id}:
 *   put:
 *     summary: Cập nhật thông tin bộ sưu tập
 *     tags: [Collection]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               banner_url:
 *                 type: string
 *               thumbnail_url:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               order:
 *                 type: integer
 *               isFeatured:
 *                 type: boolean
 *               seo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật bộ sưu tập thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       409:
 *         description: Tên bộ sưu tập đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.put("/:id", validate(updateCollectionZod), verifyToken, authorizeRoles("admin", "staff"), updateCollectionController);

/**
 * @swagger
 * /collection/{id}:
 *   get:
 *     summary: Lấy chi tiết bộ sưu tập theo ID
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       400:
 *         description: ObjectId không hợp lệ
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.get("/:id", getCollectionByIdController);

/**
 * @swagger
 * /collection/slug/{slug}:
 *   get:
 *     summary: Lấy thông tin bộ sưu tập theo slug (SEO)
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.get("/slug/:slug", getCollectionBySlugController);

/**
 * @swagger
 * /collection/{id}/active:
 *   put:
 *     summary: Bật/tắt trạng thái bộ sưu tập
 *     tags: [Collection]
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
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.put("/:id/active", verifyToken, authorizeRoles("admin", "staff"), activeCollectionController);

/**
 * @swagger
 * /collection/{id}/delete:
 *   put:
 *     summary: Xóa bộ sưu tập (soft delete)
 *     tags: [Collection]
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
 *         description: Xóa bộ sưu tập thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.put("/:id/delete", verifyToken, authorizeRoles("admin", "staff"), deleteCollectionController);

/**
 * @swagger
 * /collection/{id}/restore:
 *   put:
 *     summary: Khôi phục bộ sưu tập đã bị xóa
 *     tags: [Collection]
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
 *         description: Khôi phục bộ sưu tập thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.put("/:id/restore", verifyToken, authorizeRoles("admin", "staff"), restoreCollectionController);

/**
 * @swagger
 * /collection:
 *   get:
 *     summary: Lấy danh sách bộ sưu tập (Phân trang, Tìm kiếm, Nổi bật, Bật/Tắt, Thùng rác, Lấy toàn bộ)
 *     tags: [Collection]
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
 *         description: Từ khóa tìm kiếm theo tên bộ sưu tập
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: active hoặc inactive
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Lọc bộ sưu tập nổi bật
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.get("/", validate(getCollectionsQueryZod), getAllCollectionController);

/**
 * @swagger
 * /collection/{id}/force:
 *   delete:
 *     summary: Xóa vĩnh viễn bộ sưu tập (Hard Delete)
 *     tags: [Collection]
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
 *         description: Xóa vĩnh viễn bộ sưu tập thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu role admin)
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *       500:
 *         description: Lỗi hệ thống
 */
collectionRouter.delete("/:id/force", verifyToken, authorizeRoles("admin"), forceDeleteCollectionController);

export default collectionRouter;