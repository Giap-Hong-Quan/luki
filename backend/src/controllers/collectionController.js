import mongoose from "mongoose";
import Collection from "../models/Collection.js";
import ApiError from "../exceptions/ApiError.js";
import { success } from "../utils/success.js";

// 1. Tạo mới bộ sưu tập (Admin / Staff)
export const createCollectionController = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            throw new ApiError(400, "Tên bộ sưu tập là bắt buộc");
        }

        const nameTrim = name.trim();
        const existCollection = await Collection.findOne({
            name: { $regex: new RegExp(`^${nameTrim}$`, "i") }
        });

        if (existCollection) {
            throw new ApiError(409, "Tên bộ sưu tập đã tồn tại trong hệ thống");
        }

        const newCollection = await Collection.create({
            ...req.body,
            name: nameTrim,
            createdBy: req.user?._id || req.user?.id || null
        });

        return success(res, newCollection, "Tạo bộ sưu tập thành công", 201);
    } catch (error) {
        next(error);
    }
};

// 2. Cập nhật thứ tự sắp xếp bộ sưu tập hàng loạt (Reorder Drag & Drop)
export const reorderCollectionController = async (req, res, next) => {
    try {
        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            throw new ApiError(400, "Dữ liệu cập nhật thứ tự phải là một mảng danh sách bộ sưu tập");
        }

        const bulkOperations = items.map(item => {
            if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) {
                throw new ApiError(400, `ID '${item.id}' không đúng định dạng ObjectId`);
            }
            return {
                updateOne: {
                    filter: { _id: item.id },
                    update: { $set: { order: Number(item.order) || 0 } }
                }
            };
        });

        await Collection.bulkWrite(bulkOperations);

        return success(res, null, "Cập nhật thứ tự bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 3. Cập nhật thông tin bộ sưu tập (Admin / Staff)
export const updateCollectionController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID bộ sưu tập không đúng định dạng");
        }

        const existCollection = await Collection.findById(id);
        if (!existCollection) {
            throw new ApiError(404, "Bộ sưu tập không tồn tại");
        }

        if (name && name.trim() !== existCollection.name) {
            const nameConflict = await Collection.findOne({
                name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
                _id: { $ne: id }
            });
            if (nameConflict) {
                throw new ApiError(409, "Tên bộ sưu tập đã tồn tại trong hệ thống");
            }
        }

        const updateData = { ...req.body };
        if (updateData.name) updateData.name = updateData.name.trim();

        const updatedCollection = await Collection.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("products", "name price original_price thumbnail slug sku stock");

        return success(res, updatedCollection, "Cập nhật bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 4. Lấy chi tiết bộ sưu tập theo ID (Public)
export const getCollectionByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID bộ sưu tập không đúng định dạng");
        }

        const collection = await Collection.findById(id).populate("products", "name price original_price thumbnail slug sku stock");
        if (!collection) {
            throw new ApiError(404, "Bộ sưu tập không tồn tại");
        }

        return success(res, collection, `Lấy thông tin bộ sưu tập: ${collection.name}`, 200);
    } catch (error) {
        next(error);
    }
};

// 5. Lấy chi tiết bộ sưu tập theo Slug (SEO - Public)
export const getCollectionBySlugController = async (req, res, next) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            throw new ApiError(400, "Slug bộ sưu tập là bắt buộc");
        }

        const collection = await Collection.findOne({
            slug: slug.toLowerCase().trim(),
            deletedAt: null
        }).populate("products", "name price original_price thumbnail slug sku stock");

        if (!collection) {
            throw new ApiError(404, "Không tìm thấy bộ sưu tập");
        }

        return success(res, collection, `Lấy thông tin bộ sưu tập thành công`, 200);
    } catch (error) {
        next(error);
    }
};

// 6. Bật / Tắt trạng thái hiển thị của bộ sưu tập (Active / Inactive)
export const activeCollectionController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID bộ sưu tập không đúng định dạng");
        }

        const existCollection = await Collection.findById(id);
        if (!existCollection) {
            throw new ApiError(404, "Bộ sưu tập không tồn tại");
        }

        if (existCollection.deletedAt !== null) {
            throw new ApiError(409, "Không thể thay đổi trạng thái bộ sưu tập đã bị xóa");
        }

        const updatedCollection = await Collection.findByIdAndUpdate(
            id,
            { isActive: !existCollection.isActive },
            { new: true }
        );

        return success(res, updatedCollection, "Cập nhật trạng thái bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 7. Xóa mềm bộ sưu tập (Soft Delete - Thùng rác)
export const deleteCollectionController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID bộ sưu tập không đúng định dạng");
        }

        const existCollection = await Collection.findById(id);
        if (!existCollection) {
            throw new ApiError(404, "Bộ sưu tập không tồn tại");
        }

        if (existCollection.deletedAt !== null) {
            throw new ApiError(409, "Bộ sưu tập này đã được xóa từ trước");
        }

        const deletedCollection = await Collection.findByIdAndUpdate(
            id,
            { isActive: false, deletedAt: new Date() },
            { new: true }
        );

        return success(res, deletedCollection, "Xóa bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 8. Khôi phục bộ sưu tập đã bị xóa mềm (Restore)
export const restoreCollectionController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID bộ sưu tập không đúng định dạng");
        }

        const collection = await Collection.findById(id);
        if (!collection) {
            throw new ApiError(404, "Bộ sưu tập không tồn tại");
        }

        if (!collection.deletedAt) {
            throw new ApiError(409, "Bộ sưu tập này chưa bị xóa");
        }

        const restoredCollection = await Collection.findByIdAndUpdate(
            id,
            { deletedAt: null, isActive: true },
            { new: true }
        );

        return success(res, restoredCollection, "Khôi phục bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách bộ sưu tập (Phân trang, Tìm kiếm, Thùng rác, Nổi bật, Bật/Tắt)
export const getAllCollectionController = async (req, res, next) => {
    try {
        const {
            page = 1,
            sizePage = 10,
            search,
            isActive,
            isFeatured,
            isDeleted
        } = req.query;

        const query = {};

        // 1. Lọc theo danh sách bị xóa (deletedAt)
        if (isDeleted === true) {
            query.deletedAt = { $ne: null };
        } else {
            query.deletedAt = null;
        }

        // 2. Lọc theo từ khóa tìm kiếm (Tên bộ sưu tập)
        if (search && search.trim() !== "") {
            const searchTrim = search.trim();
            query.$or = [
                { name: { $regex: searchTrim, $options: "i" } },
                { noAccentName: { $regex: searchTrim, $options: "i" } }
            ];
        }

        // 3. Lọc theo trạng thái ẩn/hiện (isActive)
        if (typeof isActive === "boolean") {
            query.isActive = isActive;
        }

        // 4. Lọc theo bộ sưu tập nổi bật (isFeatured)
        if (typeof isFeatured === "boolean") {
            query.isFeatured = isFeatured;
        }

        // Phân trang (Nếu sizePage = 0, Mongoose .limit(0) sẽ tự động lấy toàn bộ)
        const limit = sizePage;
        const skip = limit > 0 ? (page - 1) * limit : 0;

        const [collections, count] = await Promise.all([
            Collection.find(query)
                .sort({ order: 1, createdAt: -1 })
                .populate("products", "name price original_price thumbnail slug sku stock")
                .skip(skip)
                .limit(limit)
                .lean(),
            Collection.countDocuments(query)
        ]);

        const result = {
            collections,
            totalCollection: count,
            totalPage: limit > 0 ? Math.ceil(count / limit) : 1,
            currentPage: page,
            sizePage: limit
        };

        return success(res, result, "Lấy danh sách bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 10. Xóa vĩnh viễn bộ sưu tập (Hard Delete / Force Delete - Admin)
export const forceDeleteCollectionController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID bộ sưu tập không đúng định dạng");
        }

        const collection = await Collection.findById(id);
        if (!collection) {
            throw new ApiError(404, "Bộ sưu tập không tồn tại");
        }

        await Collection.findByIdAndDelete(id);

        return success(res, null, "Xóa vĩnh viễn bộ sưu tập thành công", 200);
    } catch (error) {
        next(error);
    }
};