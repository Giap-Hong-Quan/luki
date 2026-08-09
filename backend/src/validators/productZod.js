import { z } from "zod";

// Schema validate cho từng Size của biến thể
const sizeOptionZod = z.object({
    size: z.string({ required_error: "Kích cỡ là bắt buộc" }).trim().min(1, "Kích cỡ không được để trống"),
    stock: z.number().min(0, "Số lượng tồn kho không được nhỏ hơn 0").default(0)
});

// Schema validate cho biến thể Màu sắc
const colorVariantZod = z.object({
    color: z.string({ required_error: "Tên màu sắc là bắt buộc" }).trim().min(1, "Tên màu sắc không được để trống"),
    image: z.string().trim().optional().nullable(),
    sku: z.string().trim().optional(),
    sizes: z.array(sizeOptionZod).optional().default([])
});

// Schema validate SEO
const seoZod = z.object({
    metaTitle: z.string().trim().max(70, "Meta title tối đa 70 ký tự").optional(),
    metaDescription: z.string().trim().max(160, "Meta description tối đa 160 ký tự").optional(),
    metaKeywords: z.array(z.string().trim()).optional()
});

// Schema Validate Tạo Sản Phẩm (Admin / Staff)
export const createProductZod = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Tên sản phẩm là bắt buộc" })
            .trim()
            .min(1, "Tên sản phẩm không được để trống"),
        description: z.string().trim().optional(),
        attributes: z.array(z.object({
            name: z.string().trim(),
            value: z.string().trim()
        })).optional().default([]),
        size_chart: z.string().trim().optional().nullable(),
        // original_price: z
        //     .number({ required_error: "Giá gốc là bắt buộc" })
        //     .min(0, "Giá gốc không được nhỏ hơn 0"),
        price: z
            .number({ required_error: "Giá bán là bắt buộc" })
            .min(0, "Giá bán không được nhỏ hơn 0"),
        category: z
            .string({ required_error: "ID danh mục là bắt buộc" })
            .min(1, "ID danh mục không được để trống"),
        collections: z.array(z.string().trim()).optional().default([]),
        thumbnail: z.string().trim().optional().nullable(),
        images: z.array(z.string().trim()).optional().default([]),
        // stock: z.number().min(0, "Tổng tồn kho không được nhỏ hơn 0").optional().default(0),
        variants: z.array(colorVariantZod).optional().default([]),
        isFeatured: z.boolean().optional().default(false),
        isActive: z.boolean().optional(),
        seo: seoZod.optional()
    })
});

// Schema Validate Cập Nhật Sản Phẩm
export const updateProductZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID sản phẩm là bắt buộc")
    }),
    body: z.object({
        name: z.string().trim().min(1, "Tên sản phẩm không được để trống").optional(),
        sku: z.string().trim().min(1, "Mã SKU không được để trống").optional(),
        description: z.string().trim().optional(),
        attributes: z.array(z.object({
            name: z.string().trim(),
            value: z.string().trim()
        })).optional(),
        size_chart: z.string().trim().optional().nullable(),
        original_price: z.number().min(0, "Giá gốc không được nhỏ hơn 0").optional(),
        price: z.number().min(0, "Giá bán không được nhỏ hơn 0").optional(),
        category: z.string().min(1, "ID danh mục không được để trống").optional(),
        collections: z.array(z.string().trim()).optional(),
        thumbnail: z.string().trim().optional().nullable(),
        images: z.array(z.string().trim()).optional(),
        stock: z.number().min(0, "Tổng tồn kho không được nhỏ hơn 0").optional(),
        variants: z.array(colorVariantZod).optional(),
        isFeatured: z.boolean().optional(),
        isActive: z.boolean().optional(),
        seo: seoZod.optional()
    })
});

// Helper ép kiểu boolean cho Query URL ("true"/"false" -> boolean)
const parseBooleanQuery = z.enum(["true", "false"]).transform((val) => val === "true").optional();

// Schema Validate Query Lấy Danh Sách Sản Phẩm (Public / Admin)
export const getProductsQueryZod = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1, "Trang phải lớn hơn 0").default(1),
        sizePage: z.coerce.number().int().min(0, "Số lượng sản phẩm mỗi trang không được nhỏ hơn 0").max(100, "Số lượng tối đa 100").default(10),
        search: z.string().trim().optional(),
        category: z.string().trim().optional(),
        collection: z.string().trim().optional(),
        minPrice: z.coerce.number().min(0, "Giá tối thiểu không được âm").optional(),
        maxPrice: z.coerce.number().min(0, "Giá tối đa không được âm").optional(),
        isFeatured: parseBooleanQuery,
        isActive: parseBooleanQuery,
        isDeleted: parseBooleanQuery
    })
});

// Schema Validate ID Parameter
export const productIdParamZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID sản phẩm là bắt buộc")
    })
});

// Schema Validate Slug Parameter
export const productSlugParamZod = z.object({
    params: z.object({
        slug: z.string().min(1, "Slug sản phẩm là bắt buộc")
    })
});


