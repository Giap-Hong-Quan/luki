import express from "express";
import {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    getProductBySlugController,
    updateProductController,
    activeProductController,
    deleteProductController,
    restoreProductController,
    forceDeleteProductController
} from "../controllers/productController.js";
import { validate } from "../middlewares/validate.js";
import {
    createProductZod,
    updateProductZod,
    getProductsQueryZod,
    productIdParamZod,
    productSlugParamZod
} from "../validators/productZod.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const productRouter = express.Router();

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Tạo mới sản phẩm
 *     tags: [Product]
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
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Áo Hoodie Zip STORMSTU"
 *               original_price:
 *                 type: number
 *                 example: 200000
 *               price:
 *                 type: number
 *                 example: 139000
 *               category:
 *                 type: string
 *                 example: "67a8aecbf19fc340b0062caf"
 *               collections:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               description:
 *                 type: string
 *                 example: "Áo nỉ bông 2 lớp unisex form rộng."
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example: [
 *                   { "name": "CHẤT LIỆU", "value": "Cotton" },
 *                   { "name": "PHONG CÁCH", "value": "Năng động, cá tính" }
 *                 ]
 *               size_chart:
 *                 type: string
 *                 example: "https://example.com/size-chart.jpg"
 *               thumbnail:
 *                 type: string
 *                 example: "https://example.com/thumb.jpg"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/img1.jpg"]
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example: [
 *                   {
 *                     "color": "Màu Cream",
 *                     "image": "https://example.com/cream.jpg",
 *                     "sizes": [
 *                       { "size": "M", "stock": 10 },
 *                       { "size": "L", "stock": 15 }
 *                     ]
 *                   }
 *                 ]
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Danh mục hoặc Bộ sưu tập không tồn tại
 *       409:
 *         description: Tên sản phẩm hoặc mã SKU đã tồn tại
 */
productRouter.post("/", validate(createProductZod), verifyToken, authorizeRoles("admin", "staff"), createProductController);

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Lấy danh sách sản phẩm (Public / Phân trang, Tìm kiếm, Bộ lọc)
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: sizePage
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng sản phẩm mỗi trang (Truyền 0 để lấy toàn bộ)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên hoặc SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID danh mục sản phẩm cần lọc
 *       - in: query
 *         name: collection
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập sản phẩm cần lọc
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá bán tối thiểu
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá bán tối đa
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Lọc sản phẩm nổi bật (true/false)
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 *       500:
 *         description: Lỗi hệ thống
 */
productRouter.get("/", validate(getProductsQueryZod), getAllProductsController);

/**
 * @swagger
 * /product/slug/{slug}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo Slug (Public / SEO)
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của sản phẩm (VD ao-hoodie-zip-stormstu)
 *     responses:
 *       200:
 *         description: Lấy chi tiết sản phẩm thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 */
productRouter.get("/slug/:slug", validate(productSlugParamZod), getProductBySlugController);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần lấy chi tiết
 *     responses:
 *       200:
 *         description: Lấy chi tiết sản phẩm thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 */
productRouter.get("/:id", validate(productIdParamZod), getProductByIdController);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm (Admin / Staff)
 *     tags: [Product]
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
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 */
productRouter.put("/:id", validate(updateProductZod), verifyToken, authorizeRoles("admin", "staff"), updateProductController);

/**
 * @swagger
 * /product/{id}/status:
 *   patch:
 *     summary: Bật / Tắt trạng thái ẩn hiện sản phẩm (Admin / Staff)
 *     tags: [Product]
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
 *         description: Cập nhật trạng thái sản phẩm thành công
 */
productRouter.patch("/:id/status", validate(productIdParamZod), verifyToken, authorizeRoles("admin", "staff"), activeProductController);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Xóa mềm sản phẩm (Admin / Staff)
 *     tags: [Product]
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
 *         description: Xóa mềm sản phẩm thành công
 */
productRouter.delete("/:id", validate(productIdParamZod), verifyToken, authorizeRoles("admin", "staff"), deleteProductController);

/**
 * @swagger
 * /product/{id}/restore:
 *   put:
 *     summary: Khôi phục sản phẩm từ thùng rác (Admin / Staff)
 *     tags: [Product]
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
 *         description: Khôi phục sản phẩm thành công
 */
productRouter.put("/:id/restore", validate(productIdParamZod), verifyToken, authorizeRoles("admin", "staff"), restoreProductController);

/**
 * @swagger
 * /product/{id}/force:
 *   delete:
 *     summary: Xóa vĩnh viễn sản phẩm khỏi Database (Admin)
 *     tags: [Product]
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
 *         description: Xóa vĩnh viễn sản phẩm thành công
 */
productRouter.delete("/:id/force", validate(productIdParamZod), verifyToken, authorizeRoles("admin"), forceDeleteProductController);

export default productRouter;