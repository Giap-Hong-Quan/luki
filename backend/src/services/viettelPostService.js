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
    receiverProvinceId,
    receiverWardId,
    weight,
    productPrice,
    codAmount,
    orderService
}) => {
    const res = await axios.post(
        `${BASE_URL}/v2/order/getPrice`,
        {
            SENDER_PROVINCE: process.env.SENDER_PROVINCE,
            SENDER_WARD: process.env.SENDER_WARD,
            RECEIVER_PROVINCE: receiverProvinceId,
            RECEIVER_WARD: receiverWardId,
            PRODUCT_WEIGHT: weight,
            PRODUCT_PRICE: productPrice,
            MONEY_COLLECTION: codAmount,
            PRODUCT_TYPE: "HH",
            NATIONAL_TYPE: 1,
            ORDER_SERVICE: orderService
        },
        { headers: { Token: TOKEN } }
    );

    return res.data?.data; // TODO: xác nhận field chứa giá cước sau khi test Postman
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