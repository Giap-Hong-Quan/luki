import { z } from "zod";

const seoSchema = z.object({
    metaTitle: z.string().trim().max(70, "Meta title tối đa 70 ký tự").optional(),
    metaDescription: z.string().trim().max(160, "Meta description tối đa 160 ký tự").optional(),
    metaKeywords: z.array(z.string().trim()).optional()
});

// Schema Validate Tạo Bộ Sưu Tập
export const createCollectionZod = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Tên bộ sưu tập là bắt buộc" })
            .trim()
            .min(1, "Tên bộ sưu tập không được để trống"),
        description: z.string().trim().optional(),
        banner_url: z.string().trim().nullable().optional(),
        thumbnail_url: z.string().trim().nullable().optional(),
        products: z.array(z.string().trim()).optional(),
        order: z.number().min(0, "Thứ tự sắp xếp phải lớn hơn hoặc bằng 0").optional(),
        isFeatured: z.boolean().optional(),
        seo: seoSchema.optional()
    })
});

// Schema Validate Cập Nhật Bộ Sưu Tập
export const updateCollectionZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID bộ sưu tập là bắt buộc")
    }),
    body: z.object({
        name: z.string().trim().min(1, "Tên bộ sưu tập không được để trống").optional(),
        description: z.string().trim().optional(),
        banner_url: z.string().trim().nullable().optional(),
        thumbnail_url: z.string().trim().nullable().optional(),
        products: z.array(z.string().trim()).optional(),
        order: z.number().min(0, "Thứ tự sắp xếp phải lớn hơn hoặc bằng 0").optional(),
        seo: seoSchema.optional(),
        isActive: z.boolean().optional()
    })
});

// Helper ép kiểu boolean cho Query URL ("true"/"false" -> boolean)
const parseBooleanQuery = z.enum(["true", "false"]).transform((val) => val === "true").optional();

// Schema Validate Query Lấy Danh Sách Bộ Sưu Tập (Public / Admin)
export const getCollectionsQueryZod = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1, "Trang phải lớn hơn 0").default(1),
        sizePage: z.coerce.number().int().min(0, "Số lượng bộ sưu tập mỗi trang không được nhỏ hơn 0").max(100, "Số lượng tối đa 100").default(10),
        search: z.string().trim().optional(),
        isFeatured: parseBooleanQuery,
        isActive: parseBooleanQuery,
        isDeleted: parseBooleanQuery
    })
});


