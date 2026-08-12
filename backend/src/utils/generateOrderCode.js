/**
 * Hàm sinh mã đơn hàng thân thiện, hiển thị cho khách (KHÁC với _id Mongo).
 * Định dạng: ORD{YYYYMMDD}-{4 ký tự random} -> VD: "ORD20260809-A1B2"
 * Gộp ngày tháng vào mã giúp admin nhìn mã là biết đơn đặt ngày nào mà không cần mở chi tiết.
 */
export const generateOrderCode = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${y}${m}${d}-${randomSuffix}`;
};
