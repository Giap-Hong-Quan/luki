import axios from "axios";

const BASE_URL = process.env.VIETTELPOST_BASE_URL;
const TOKEN = process.env.VIETTELPOST_TOKEN;

// Danh sách dịch vụ cho khách chọn - cố định 2 loại theo đúng ViettelPost cung cấp
const SHIPPING_SERVICES = [
    { code: "VCN", label: "Chuyển phát nhanh", description: "1 - 3 ngày, giao bằng đường hàng không/xe tải nhanh" },
    { code: "VTK", label: "Chuyển phát tiết kiệm", description: "3 - 7 ngày, giao bằng đường bộ, phù hợp hàng nặng/cồng kềnh" }
];

/**
 * Gọi API tính cước 1 LẦN cho 1 mã dịch vụ cụ thể
 */
const getPriceByService = async ({
    provinceId,
    wardId,
    weight,
    productPrice,
    codAmount,
    orderService
}) => {
    try {
        const baseUrl = process.env.VIETTELPOST_BASE_URL || "https://partnerdev.viettelpost.vn";
        const token = process.env.VIETTELPOST_TOKEN;

        const res = await axios.post(
            `${baseUrl}/v2/order/getPrice`,
            {
                SENDER_PROVINCE: Number(process.env.SENDER_PROVINCE || 44),
                SENDER_WARD: Number(process.env.SENDER_WARD || 49186),
                RECEIVER_PROVINCE: Number(provinceId),
                RECEIVER_WARD: Number(wardId),
                PRODUCT_WEIGHT: Number(weight || 300),
                PRODUCT_PRICE: Number(productPrice || 0),
                MONEY_COLLECTION: Number(codAmount || 0),
                PRODUCT_TYPE: "HH",
                NATIONAL_TYPE: 1,
                ORDER_SERVICE: orderService
            },
            { headers: { Token: token } }
        );

        if (res.data?.status !== 200 || !res.data?.data) {
            console.warn(`ViettelPost getPrice warning (${orderService}):`, res.data?.message || res.data);
        }
        return res.data?.data;
    } catch (error) {
        console.error(`ViettelPost getPrice error (${orderService}):`, error.response?.data || error.message);
        return null;
    }
};

/**
 * Tính cước cho CẢ 2 dịch vụ cùng lúc (song song bằng Promise.all, nhanh hơn gọi tuần tự),
 * trả về mảng để FE render radio button cho khách chọn "Nhanh" hay "Tiết kiệm".
 */
export const calculateFee = async (params) => {
    const results = await Promise.all(
        SHIPPING_SERVICES.map(async (service) => {
            const priceData = await getPriceByService({ ...params, orderService: service.code });
            return {
                serviceCode: service.code,
                label: service.label,
                description: service.description,
                fee: priceData?.MONEY_TOTAL // TODO: đổi đúng tên field theo response thật
            };
        })
    );

    return results;
};