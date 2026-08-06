import mongoose from "mongoose";
import { success } from "../utils/success.js";
import Category from "../models/Category.js";
import ApiError from "../exceptions/ApiError.js";
import removeVietnameseTones from "../utils/removeVietnameseTones.js";

// 1. Tạo mới danh mục
export const createCategoryController = async (req, res, next) => {
    try {
        const { name, parent } = req.body;
        const existCategory = await Category.findOne({ name });
        if (existCategory) {
            throw new ApiError(409, "Danh mục đã tồn tại");
        }
        if (parent) {
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                throw new ApiError(400, "Id danh mục cha không đúng định dạng");
            }
            const existParent = await Category.findById(parent);
            if (!existParent) {
                throw new ApiError(404, "Danh mục cha không tồn tại");
            }
        }
        const category = await Category.create(req.body);
        success(res, category, "Tạo danh mục thành công", 201);
    } catch (error) {
        next(error);
    }
};

// 2. Cập nhật thứ tự sắp xếp danh mục hàng loạt (Reorder Drag & Drop)
export const reorderCategoryController = async (req, res, next) => {
    try {
        const list = Array.isArray(req.body) ? req.body : req.body?.orders;

        if (!Array.isArray(list) || list.length === 0) {
            throw new ApiError(400, "Dữ liệu danh sách sắp xếp (orders) không hợp lệ");
        }

        const bulkOperations = list.map((item) => {
            if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) {
                throw new ApiError(400, `Id danh mục ${item.id} không đúng định dạng`);
            }
            if (typeof item.order !== "number") {
                throw new ApiError(400, `Thứ tự (order) của ID ${item.id} phải là số`);
            }
            return {
                updateOne: {
                    filter: { _id: item.id },
                    update: { $set: { order: item.order } }
                }
            };
        });

        await Category.bulkWrite(bulkOperations);

        success(res, null, "Cập nhật thứ tự danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 3. Cập nhật thông tin danh mục
export const updateCategoryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Id danh mục không đúng định dạng");
        }

        const existCategory = await Category.findById(id);
        if (!existCategory) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        const { name, parent } = req.body;
        if (name && name !== existCategory.name) {
            const nameConflict = await Category.findOne({ name, _id: { $ne: id } });
            if (nameConflict) {
                throw new ApiError(409, "Tên danh mục đã tồn tại");
            }
        }

        if (parent) {
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                throw new ApiError(400, "Id danh mục cha không đúng định dạng");
            }
            if (parent === id) {
                throw new ApiError(400, "Danh mục cha không thể là chính nó");
            }
            const existParent = await Category.findById(parent);
            if (!existParent) {
                throw new ApiError(404, "Danh mục cha không tồn tại");
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        success(res, updatedCategory, "Cập nhật danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 4. Lấy chi tiết danh mục theo ID (Admin)
export const getCategoryByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Id danh mục không đúng định dạng");
        }

        const category = await Category.findById(id);
        if (!category) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        success(res, category, `Lấy chi tiết danh mục: ${category.name}`, 200);
    } catch (error) {
        next(error);
    }
};

// 5. Lấy chi tiết danh mục theo slug (Client / SEO)
export const getCategoryBySlugController = async (req, res, next) => {
    try {
        const { slug } = req.params;
        if (!slug || typeof slug !== "string") {
            throw new ApiError(400, "Slug danh mục không hợp lệ");
        }

        const category = await Category.findOne({ slug, deletedAt: null });
        if (!category) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        success(res, category, `Lấy chi tiết danh mục: ${category.name}`, 200);
    } catch (error) {
        next(error);
    }
};

// 6. Bật / Tắt trạng thái danh mục (Admin)
export const activeCategoryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Id danh mục không đúng định dạng");
        }

        const existCategory = await Category.findById(id);
        if (!existCategory) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        if (existCategory.deletedAt !== null) {
            throw new ApiError(409, "Không thể cập nhật trạng thái của danh mục đã bị xóa");
        }

        const active = await Category.findByIdAndUpdate(
            id,
            { isActive: !existCategory.isActive },
            { new: true }
        );

        success(res, active, "Cập nhật trạng thái danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 7. Xóa danh mục (Soft Delete)
export const deleteCategoryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Id danh mục không đúng định dạng");
        }

        const existCategory = await Category.findById(id);
        if (!existCategory) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        if (existCategory.deletedAt !== null) {
            throw new ApiError(409, "Danh mục đã được xóa từ trước");
        }

        const deleteCategory = await Category.findByIdAndUpdate(
            id,
            { isActive: false, deletedAt: new Date() },
            { new: true }
        );

        success(res, deleteCategory, "Xóa danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 8. Khôi phục danh mục đã xóa
export const restoreCategoryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Id danh mục không đúng định dạng");
        }

        const category = await Category.findById(id);
        if (!category) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        if (!category.deletedAt) {
            throw new ApiError(409, "Danh mục này chưa bị xóa");
        }

        const restoreCategory = await Category.findByIdAndUpdate(
            id,
            { deletedAt: null, isActive: true },
            { new: true }
        );

        success(res, restoreCategory, "Khôi phục danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 9. Lấy danh sách danh mục (Phân trang + Tìm kiếm + Lọc mở rộng: isAll, isDeleted, isActive, parent)
export const getAllCategoryController = async (req, res, next) => {
    try {
        const { page = 1, sizePage = 10, search, isAll, isDeleted, isActive, parent } = req.query;

        const query = {};

        // 1. Lọc theo trạng thái xóa mềm (Đã xóa vs Chưa xóa)
        if (isDeleted === "true" || isDeleted === true) {
            query.deletedAt = { $ne: null };
        } else {
            query.deletedAt = null;
        }
        // 2. Lọc theo trạng thái hoạt động (isActive)
        if (isActive === "true" || isActive === true) {
            query.isActive = true;
        } else if (isActive === "false" || isActive === false) {
            query.isActive = false;
        }
        // 3. Lọc theo danh mục cha (parent)
        if (parent === "null" || parent === "root") {
            query.parent = null;
        } else if (parent && mongoose.Types.ObjectId.isValid(parent)) {
            query.parent = new mongoose.Types.ObjectId(parent);
        }
        // 4. Lọc tìm kiếm theo tên có dấu và không dấu
        if (search && typeof search === "string" && search.trim() !== "") {
            const searchTrim = search.trim();
            const cleanSearch = removeVietnameseTones(searchTrim);
            query.$or = [
                { name: { $regex: searchTrim, $options: "i" } },
                { noAccentName: { $regex: cleanSearch, $options: "i" } }
            ];
        }
        // Trường hợp lấy toàn bộ (không phân trang - ví dụ Client render Menu Header/Sidebar)
        const fetchAll = isAll === "true" || isAll === true;
        if (fetchAll) {
            const categories = await Category.find(query)
                .sort({ order: 1, createdAt: -1 })
                .collation({ locale: "vi", strength: 1 })
                .lean();

            return success(
                res,
                { categories, totalCategory: categories.length },
                "Lấy toàn bộ danh sách danh mục thành công",
                200
            );
        }
        // Trường hợp có phân trang (cho trang quản trị Admin)
        const currentPage = Math.max(1, parseInt(page) || 1);
        const limit = Math.max(1, parseInt(sizePage) || 10);
        const skip = (currentPage - 1) * limit;
        const [categories, count] = await Promise.all([
            Category.find(query)
                .sort({ order: 1, createdAt: -1 })
                .collation({ locale: "vi", strength: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(query)
        ]);
        const result = {
            categories,
            totalCategory: count,
            totalPage: Math.ceil(count / limit),
            currentPage,
            sizePage: limit
        };
        success(res, result, "Lấy danh sách danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 10. Xóa vĩnh viễn danh mục (Hard Delete / Force Delete)
export const forceDeleteCategoryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Id danh mục không đúng định dạng");
        }

        const category = await Category.findById(id);
        if (!category) {
            throw new ApiError(404, "Danh mục không tồn tại");
        }

        // Kiểm tra xem danh mục này có danh mục con nào đang phụ thuộc hay không
        const hasChildren = await Category.exists({ parent: id });
        if (hasChildren) {
            throw new ApiError(400, "Không thể xóa vĩnh viễn danh mục đang chứa danh mục con");
        }

        await Category.findByIdAndDelete(id);

        success(res, null, "Xóa vĩnh viễn danh mục thành công", 200);
    } catch (error) {
        next(error);
    }
};