// src/middlewares/validate.js
import ApiError from "../exceptions/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;

        next();
    } catch (error) {
        // Lấy thông điệp lỗi đầu tiên từ Zod
        const firstErrorMessage = error.issues?.[0]?.message || "Dữ liệu không hợp lệ";
        // Đẩy lỗi sang cho errorHandle middleware xử lý
        next(new ApiError(400, firstErrorMessage));
    }
};
