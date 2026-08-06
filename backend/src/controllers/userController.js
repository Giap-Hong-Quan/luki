import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import ApiError from "../exceptions/ApiError.js";
import { success } from "../utils/success.js";
import { hashPassword } from "../utils/password.js";

// 1. Tạo mới tài khoản người dùng (Admin tạo)
export const createUserController = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        const existUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existUser) {
            throw new ApiError(409, "Email đã tồn tại trong hệ thống");
        }
        const userRole = await Role.findById(role);
        if (!userRole) {
            throw new ApiError(404, "Role không tồn tại trong hệ thống");
        }
        const hashedPassword = await hashPassword(password);
        const newUser = await User.create({
            ...req.body,
            password: hashedPassword,
            createdBy: req.user.id,
            isOTPEmail: true,
            isActive: true,
            role: userRole._id
        });

        const result = newUser.toObject();
        delete result.password;

        success(res, result, "Tạo tài khoản người dùng thành công", 201);
    } catch (error) {
        next(error);
    }
};

// 2. Cập nhật thông tin người dùng (Admin)
export const updateUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID người dùng không đúng định dạng");
        }
        const existUser = await User.findById(id);
        if (!existUser) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }
        if (email) {
            const existEmailUser = await User.findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: id }
            });
            if (existEmailUser) {
                throw new ApiError(409, "Email đã tồn tại trong hệ thống");
            }
        }
        if (role) {
            if (!mongoose.Types.ObjectId.isValid(role)) {
                throw new ApiError(400, "ID Role không đúng định dạng");
            }
            const userRole = await Role.findById(role);
            if (!userRole) {
                throw new ApiError(404, "Role không tồn tại trong hệ thống");
            }
        }
        const updateData = { ...req.body };
        if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
        if (updateData.full_name) updateData.full_name = updateData.full_name.trim();

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password").populate("role", "name");

        return success(res, updatedUser, "Cập nhật thông tin người dùng thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 3. Lấy chi tiết người dùng theo ID
export const getUserByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID người dùng không đúng định dạng");
        }
        const user = await User.findById(id).select("-password").populate("role");
        if (!user) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }
        success(res, user, `Lấy thông tin người dùng: ${user.full_name}`, 200);
    } catch (error) {
        next(error);
    }
};

// 4. Bật / Tắt trạng thái hoạt động của người dùng (Active / Inactive)
export const activeUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID người dùng không đúng định dạng");
        }

        const existUser = await User.findById(id);
        if (!existUser) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }

        if (existUser.deletedAt !== null) {
            throw new ApiError(409, "Không thể thay đổi trạng thái tài khoản đã bị xóa");
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { isActive: !existUser.isActive },
            { new: true }
        ).select("-password");

        success(res, updatedUser, "Cập nhật trạng thái người dùng thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 5. Xóa mềm người dùng (Soft Delete)
export const deleteUserByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID người dùng không đúng định dạng");
        }

        const existUser = await User.findById(id);
        if (!existUser) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }

        if (existUser.deletedAt !== null) {
            throw new ApiError(409, "Người dùng này đã được xóa từ trước");
        }

        const deleteUser = await User.findByIdAndUpdate(
            id,
            { isActive: false, deletedAt: new Date() },
            { new: true }
        ).select("-password");

        success(res, deleteUser, "Xóa người dùng thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 6. Khôi phục người dùng đã bị xóa mềm (Restore)
export const restoreUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID người dùng không đúng định dạng");
        }

        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }

        if (!user.deletedAt) {
            throw new ApiError(409, "Tài khoản người dùng này chưa bị xóa");
        }

        const restoreUser = await User.findByIdAndUpdate(
            id,
            { deletedAt: null, isActive: true },
            { new: true }
        ).select("-password");

        success(res, restoreUser, "Khôi phục tài khoản người dùng thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 7. Xóa vĩnh viễn người dùng (Hard Delete / Force Delete)
export const forceDeleteUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "ID người dùng không đúng định dạng");
        }

        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, "Người dùng không tồn tại");
        }

        await User.findByIdAndDelete(id);

        success(res, null, "Xóa vĩnh viễn người dùng thành công", 200);
    } catch (error) {
        next(error);
    }
};

// 8. Lấy danh sách người dùng (Phân trang + Tìm kiếm + Lọc mở rộng: status, tier, fromDate, toDate, isDeleted, isAll)
export const getAllUserController = async (req, res, next) => {
    try {
        const {
            page = 1,
            sizePage = 10,
            search,
            status,
            tier,
            fromDate,
            toDate,
            isDeleted,
            isAll
        } = req.query;

        const query = {};

        // 1. Lọc theo danh sách bị xóa (deletedAt)
        if (isDeleted === "true" || isDeleted === true) {
            query.deletedAt = { $ne: null };
        } else {
            query.deletedAt = null;
        }

        // 2. Chỉ lọc lấy người dùng có role là "user"
        const roleUser = await Role.findOne({ name: "user" });
        if (roleUser) {
            query.role = roleUser._id;
        }

        // 3. Lọc theo từ khóa tìm kiếm (Tên, Email, Số điện thoại)
        if (search && typeof search === "string" && search.trim() !== "") {
            const searchTrim = search.trim();
            query.$or = [
                { full_name: { $regex: searchTrim, $options: "i" } },
                { email: { $regex: searchTrim, $options: "i" } },
                { phone: { $regex: searchTrim, $options: "i" } }
            ];
        }

        // 4. Lọc theo trạng thái hoạt động (active / inactive)
        if (status === "active" || status === "true" || status === true) {
            query.isActive = true;
        } else if (status === "inactive" || status === "false" || status === false) {
            query.isActive = false;
        }

        // 4.1 Lọc theo trạng thái online (true / false)
        if (req.query.isOnline === "true" || req.query.isOnline === true) {
            query.isOnline = true;
        } else if (req.query.isOnline === "false" || req.query.isOnline === false) {
            query.isOnline = false;
        }

        // 5. Lọc theo hạng thành viên (membership_tier)
        if (tier && typeof tier === "string" && tier.trim() !== "") {
            query.membership_tier = tier.trim();
        }

        // 6. Lọc theo khoảng thời gian tạo (fromDate -> toDate)
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        // Lấy toàn bộ không phân trang
        const fetchAll = isAll === "true" || isAll === true;

        if (fetchAll) {
            const users = await User.find(query)
                .sort({ createdAt: -1 })
                .select("-password")
                .populate("role", "name")
                .lean();

            return success(
                res,
                { users, totalUser: users.length },
                "Lấy toàn bộ danh sách người dùng thành công",
                200
            );
        }

        // Phân trang
        const currentPage = Math.max(1, parseInt(page) || 1);
        const limit = Math.max(1, parseInt(sizePage) || 10);
        const skip = (currentPage - 1) * limit;

        const [users, count] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .select("-password")
                .populate("role", "name")
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        const result = {
            users,
            totalUser: count,
            totalPage: Math.ceil(count / limit),
            currentPage,
            sizePage: limit
        };

        success(res, result, "Lấy danh sách người dùng thành công", 200);
    } catch (error) {
        next(error);
    }
};