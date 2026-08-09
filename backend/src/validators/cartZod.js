import { z } from "zod";

export const addToCartZod = z.object({
    body: z.object({
        productId: z
            .string({ required_error: "ID sản phẩm là bắt buộc" })
            .min(1, "ID sản phẩm không được để trống"),
        color: z
            .string({ required_error: "Màu sắc là bắt buộc" })
            .trim()
            .min(1, "Màu sắc không được để trống"),
        size: z
            .string({ required_error: "Kích cỡ là bắt buộc" })
            .trim()
            .min(1, "Kích cỡ không được để trống"),
        quantity: z
            .number({ required_error: "Số lượng là bắt buộc" })
            .int("Số lượng phải là số nguyên")
            .min(1, "Số lượng phải lớn hơn hoặc bằng 1")
            .default(1)
    })
});

export const updateCartItemQuantityZod = z.object({
    body: z.object({
        itemId: z.string().optional(),
        productId: z.string().optional(),
        color: z.string().trim().optional(),
        size: z.string().trim().optional(),
        quantity: z
            .number({ required_error: "Số lượng là bắt buộc" })
            .int("Số lượng phải là số nguyên")
            .min(1, "Số lượng phải lớn hơn hoặc bằng 1")
    }).refine(data => Boolean(data.itemId || (data.productId && data.color && data.size)), {
        message: "Phải cung cấp itemId hoặc đầy đủ thông tin (productId, color, size)"
    })
});

export const toggleSelectItemZod = z.object({
    body: z.object({
        itemId: z.string().optional(),
        productId: z.string().optional(),
        color: z.string().trim().optional(),
        size: z.string().trim().optional(),
        isSelected: z.boolean().optional(),
        selectAll: z.boolean().optional()
    })
});

export const removeCartItemZod = z.object({
    body: z.object({
        itemId: z.string().optional(),
        productId: z.string().optional(),
        color: z.string().trim().optional(),
        size: z.string().trim().optional()
    }).refine(data => Boolean(data.itemId || (data.productId && data.color && data.size)), {
        message: "Phải cung cấp itemId hoặc đầy đủ thông tin (productId, color, size)"
    })
});
