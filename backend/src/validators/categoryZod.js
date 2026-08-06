import { z } from "zod";

export const createCategoryZod = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Tên danh mục là bắt buộc" })
            .trim()
            .min(1, "Tên danh mục không được để trống"),
        parent: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        order: z.number().int().min(0).optional(),
        seo: z
            .object({
                metaTitle: z.string().max(70, "Meta title tối đa 70 ký tự").optional(),
                metaDescription: z.string().max(160, "Meta description tối đa 160 ký tự").optional(),
                metaKeywords: z.array(z.string()).optional()
            })
            .optional()
    })
});

export const updateCategoryZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID danh mục không hợp lệ")
    }),
    body: z.object({
        name: z.string().trim().min(1, "Tên danh mục không được để trống").optional(),
        parent: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        order: z.number().int().min(0).optional(),
        seo: z
            .object({
                metaTitle: z.string().max(70, "Meta title tối đa 70 ký tự").optional(),
                metaDescription: z.string().max(160, "Meta description tối đa 160 ký tự").optional(),
                metaKeywords: z.array(z.string()).optional()
            })
            .optional(),
        isActive: z.boolean().optional()
    })
});

export const categoryIdParamZod = z.object({
    params: z.object({
        id: z.string().min(1, "ID danh mục là bắt buộc")
    })
});