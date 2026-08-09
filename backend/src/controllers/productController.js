import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Collection from "../models/Collection.js";
import ApiError from "../exceptions/ApiError.js";
import { success } from "../utils/success.js";
import { generateProductSku, generateVariantSku } from "../utils/generateSku.js";
import removeVietnameseTones from "../utils/removeVietnameseTones.js";

// Tạo mới sản phẩm (Admin / Staff)
export const createProductController = async (req, res, next) => {
    try {
        const { name, category, collections, variants } = req.body;
        //  Kiểm tra định dạng ID danh mục
        if (!category || !mongoose.Types.ObjectId.isValid(category)) {
            throw new ApiError(400, "ID danh mục không đúng định dạng");
        }
        //  Check tồn tại Danh mục
        const existCategory = await Category.findById(category);
        if (!existCategory) {
            throw new ApiError(404, "Danh mục không tồn tại trong hệ thống");
        }
        // Check tồn tại các Bộ sưu tập (nếu có truyền)
        if (collections && Array.isArray(collections) && collections.length > 0) {
            const validCollectionsCount = await Collection.countDocuments({
                _id: { $in: collections },
                deletedAt: null
            });
            if (validCollectionsCount !== collections.length) {
                throw new ApiError(404, "Một hoặc nhiều bộ sưu tập không tồn tại trong hệ thống");
            }
        }
        //  Tự động sinh mã SKU cho Sản phẩm chính
        const nameTrim = name.trim();
        const mainSku = generateProductSku(nameTrim);
        // Check trùng Tên sản phẩm hoặc trùng mã SKU chính
        const existProduct = await Product.findOne({
            $or: [
                { name: { $regex: `^${nameTrim}$`, $options: "i" } },
                { sku: mainSku }
            ]
        });

        if (existProduct) {
            if (existProduct.sku === mainSku) {
                throw new ApiError(409, `Mã SKU '${mainSku}' đã tồn tại trong hệ thống`);
            }
            throw new ApiError(409, `Tên sản phẩm '${nameTrim}' đã tồn tại trong hệ thống`);
        }
        // Tự động tính tổng tồn kho và sinh mã SKU cho từng biến thể màu sắc
        let totalStock = 0;
        let processedVariants = [];
        if (variants && Array.isArray(variants)) {
            processedVariants = variants.map(colorVar => {
                const colorSku = generateVariantSku(mainSku, colorVar.color);

                const sizes = Array.isArray(colorVar.sizes)
                    ? colorVar.sizes.map(sizeObj => {
                          const itemStock = Number(sizeObj.stock) || 0;
                          totalStock += itemStock;
                          return {
                              size: sizeObj.size,
                              stock: itemStock
                          };
                      })
                    : [];

                return {
                    ...colorVar,
                    sku: colorSku,
                    sizes
                };
            });
        }

        // Tạo mới sản phẩm
        const newProduct = await Product.create({
            ...req.body,
            name: nameTrim,
            sku: mainSku,
            stock: totalStock,
            variants: processedVariants,
            createdBy: req.user?._id || req.user?.id || null
        });
        // Tự động tăng productCount bên Category
        await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });
        return success(res, newProduct, "Tạo sản phẩm thành công", 201);
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách sản phẩm (Public / Phân trang, Tìm kiếm, Lọc)
export const getAllProductsController = async (req, res, next) => {
    try {
        const {
            page = 1,
            sizePage = 10,
            search,
            category,
            collection,
            minPrice,
            maxPrice,
            isFeatured,
            isActive,
            isDeleted
        } = req.query;

        const query = {};

        // Lọc theo trạng thái xóa mềm (Mặc định công khai: chỉ lấy sản phẩm chưa bị xóa)
        if (isDeleted === true) {
            query.deletedAt = { $ne: null };
        } else {
            query.deletedAt = null;
        }

        // Lọc theo trạng thái hoạt động (Mặc định công khai: chỉ lấy sản phẩm active)
        if (isActive === false) {
            query.isActive = false;
        } else {
            query.isActive = true;
        }

        // Lọc theo Danh mục
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            query.category = new mongoose.Types.ObjectId(category);
        }

        // Lọc theo Bộ sưu tập
        if (collection && mongoose.Types.ObjectId.isValid(collection)) {
            query.collections = new mongoose.Types.ObjectId(collection);
        }

        // Lọc sản phẩm nổi bật
        if (typeof isFeatured === "boolean") {
            query.isFeatured = isFeatured;
        }

        // Lọc theo Khoảng giá (minPrice - maxPrice)
        if (typeof minPrice === "number" || typeof maxPrice === "number") {
            query.price = {};
            if (typeof minPrice === "number") query.price.$gte = minPrice;
            if (typeof maxPrice === "number") query.price.$lte = maxPrice;
        }

        // Lọc tìm kiếm theo Tên (có dấu / không dấu) hoặc Mã SKU
        if (search && search.trim() !== "") {
            const searchTrim = search.trim();
            const cleanSearch = removeVietnameseTones(searchTrim);
            query.$or = [
                { name: { $regex: searchTrim, $options: "i" } },
                { noAccentName: { $regex: cleanSearch, $options: "i" } },
                { sku: { $regex: searchTrim, $options: "i" } }
            ];
        }

        // Mặc định luôn sắp xếp sản phẩm mới nhất lên đầu
        const sortOption = { createdAt: -1 };

        // Phân trang (Nếu sizePage = 0, Mongoose .limit(0) sẽ tự động lấy toàn bộ)
        const limit = sizePage;
        const skip = limit > 0 ? (page - 1) * limit : 0;

        const [products, count] = await Promise.all([
            Product.find(query)
                .populate("category", "name slug image")
                .populate("collections", "name slug image")
                .sort(sortOption)
                .collation({ locale: "vi", strength: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(query)
        ]);

        const result = {
            products,
            totalProduct: count,
            totalPage: limit > 0 ? Math.ceil(count / limit) : 1,
            currentPage: page,
            sizePage: limit
        };

        return success(res, result, "Lấy danh sách sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};

// Lấy chi tiết sản phẩm theo ID (Admin / Staff / Client)
export const getProductByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const product = await Product.findById(id)
            .populate("category", "name slug image")
            .populate("collections", "name slug image");

        if (!product) {
            throw new ApiError(404, "Sản phẩm không tồn tại");
        }

        return success(res, product, `Lấy chi tiết sản phẩm: ${product.name}`, 200);
    } catch (error) {
        next(error);
    }
};

// Lấy chi tiết sản phẩm theo Slug (Client / SEO)
export const getProductBySlugController = async (req, res, next) => {
    try {
        const { slug } = req.params;
        if (!slug || typeof slug !== "string") {
            throw new ApiError(400, "Slug sản phẩm không hợp lệ");
        }

        const product = await Product.findOne({ slug, deletedAt: null })
            .populate("category", "name slug image")
            .populate("collections", "name slug image");

        if (!product) {
            throw new ApiError(404, "Sản phẩm không tồn tại trong hệ thống");
        }

        return success(res, product, `Lấy chi tiết sản phẩm: ${product.name}`, 200);
    } catch (error) {
        next(error);
    }
};

// Cập nhật sản phẩm (Admin / Staff)
export const updateProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const existProduct = await Product.findById(id);
        if (!existProduct) {
            throw new ApiError(404, "Sản phẩm không tồn tại");
        }

        const { name, category, collections, variants } = req.body;

        // Check Danh mục mới (nếu đổi danh mục)
        if (category && category !== existProduct.category.toString()) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                throw new ApiError(400, "ID danh mục không đúng định dạng");
            }
            const existCategory = await Category.findById(category);
            if (!existCategory) {
                throw new ApiError(404, "Danh mục mới không tồn tại trong hệ thống");
            }
        }

        // Check Bộ sưu tập (nếu có truyền)
        if (collections && Array.isArray(collections) && collections.length > 0) {
            const validCollectionsCount = await Collection.countDocuments({
                _id: { $in: collections },
                deletedAt: null
            });
            if (validCollectionsCount !== collections.length) {
                throw new ApiError(404, "Một hoặc nhiều bộ sưu tập không tồn tại trong hệ thống");
            }
        }

        // Xử lý đổi tên sản phẩm & sinh lại SKU / SKU biến thể
        let updateData = { ...req.body };
        let mainSku = existProduct.sku;

        if (name && name.trim() !== existProduct.name) {
            const nameTrim = name.trim();
            mainSku = generateProductSku(nameTrim);

            const conflict = await Product.findOne({
                _id: { $ne: id },
                $or: [
                    { name: { $regex: `^${nameTrim}$`, $options: "i" } },
                    { sku: mainSku }
                ]
            });

            if (conflict) {
                if (conflict.sku === mainSku) {
                    throw new ApiError(409, `Mã SKU '${mainSku}' đã tồn tại trong hệ thống`);
                }
                throw new ApiError(409, `Tên sản phẩm '${nameTrim}' đã tồn tại trong hệ thống`);
            }

            updateData.name = nameTrim;
            updateData.sku = mainSku;
        }

        // Tự động tính lại tổng tồn kho và sinh mã SKU biến thể nếu cập nhật biến thể
        if (variants && Array.isArray(variants)) {
            let totalStock = 0;
            const processedVariants = variants.map(colorVar => {
                const colorSku = colorVar.sku || generateVariantSku(mainSku, colorVar.color);
                const sizes = Array.isArray(colorVar.sizes)
                    ? colorVar.sizes.map(sizeObj => {
                          const itemStock = Number(sizeObj.stock) || 0;
                          totalStock += itemStock;
                          return {
                              size: sizeObj.size,
                              stock: itemStock
                          };
                      })
                    : [];

                return {
                    ...colorVar,
                    sku: colorSku,
                    sizes
                };
            });

            updateData.variants = processedVariants;
            updateData.stock = totalStock;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("category", "name slug image").populate("collections", "name slug image");

        // Cập nhật productCount của Danh mục nếu đổi danh mục
        if (category && category !== existProduct.category.toString()) {
            await Category.findByIdAndUpdate(existProduct.category, { $inc: { productCount: -1 } });
            await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });
        }

        return success(res, updatedProduct, "Cập nhật sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};

// Bật / Tắt trạng thái hoạt động sản phẩm (Admin / Staff)
export const activeProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const existProduct = await Product.findById(id);
        if (!existProduct) {
            throw new ApiError(404, "Sản phẩm không tồn tại");
        }

        if (existProduct.deletedAt !== null) {
            throw new ApiError(409, "Không thể cập nhật trạng thái sản phẩm đã bị xóa");
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { isActive: !existProduct.isActive },
            { new: true }
        );

        return success(res, updatedProduct, "Cập nhật trạng thái sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};

// Xóa mềm sản phẩm (Admin / Staff)
export const deleteProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const existProduct = await Product.findById(id);
        if (!existProduct) {
            throw new ApiError(404, "Sản phẩm không tồn tại");
        }

        if (existProduct.deletedAt !== null) {
            throw new ApiError(409, "Sản phẩm đã được xóa từ trước");
        }

        const deletedProduct = await Product.findByIdAndUpdate(
            id,
            { isActive: false, deletedAt: new Date() },
            { new: true }
        );

        // Giảm productCount trong Danh mục
        await Category.findByIdAndUpdate(existProduct.category, { $inc: { productCount: -1 } });

        return success(res, deletedProduct, "Xóa sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};

// Khôi phục sản phẩm đã bị xóa (Admin / Staff)
export const restoreProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const existProduct = await Product.findById(id);
        if (!existProduct) {
            throw new ApiError(404, "Sản phẩm không tồn tại");
        }

        if (!existProduct.deletedAt) {
            throw new ApiError(409, "Sản phẩm này chưa bị xóa");
        }

        const restoredProduct = await Product.findByIdAndUpdate(
            id,
            { deletedAt: null, isActive: true },
            { new: true }
        );

        // Tăng lại productCount trong Danh mục
        await Category.findByIdAndUpdate(existProduct.category, { $inc: { productCount: 1 } });

        return success(res, restoredProduct, "Khôi phục sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};

// Xóa vĩnh viễn sản phẩm khỏi Database (Admin)
export const forceDeleteProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID sản phẩm không đúng định dạng");
        }

        const existProduct = await Product.findById(id);
        if (!existProduct) {
            throw new ApiError(404, "Sản phẩm không tồn tại");
        }

        // Nếu sản phẩm chưa bị xóa mềm thì giảm bớt count của Danh mục
        if (!existProduct.deletedAt) {
            await Category.findByIdAndUpdate(existProduct.category, { $inc: { productCount: -1 } });
        }

        await Product.findByIdAndDelete(id);

        return success(res, null, "Xóa vĩnh viễn sản phẩm thành công", 200);
    } catch (error) {
        next(error);
    }
};
