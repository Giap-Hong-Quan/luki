
// VÒNG ĐỜI ĐƠN HÀNG (Order Lifecycle Status)
export const ORDER_STATUS = {
  PENDING: "PENDING",       // Mới tạo, chờ thanh toán hoặc chờ xác nhận
  PROCESSING: "PROCESSING", // Đã xác nhận, đang đóng gói / chuẩn bị hàng
  SHIPPING: "SHIPPING",     // Đã giao cho đơn vị vận chuyển, đang giao
  DELIVERED: "DELIVERED",   // Vận chuyển giao thành công
  COMPLETED: "COMPLETED",   // Khách xác nhận đã nhận hàng / đơn khép lại hoàn toàn
  CANCELLED: "CANCELLED",   // Bị hủy (khách hủy hoặc hệ thống tự hủy do quá hạn)
  RETURNED: "RETURNED",     // Đã trả hàng / hoàn tiền
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// TRẠNG THÁI THANH TOÁN (Payment Status)
export const PAYMENT_STATUS = {
  PENDING: "PENDING",   // Chưa thanh toán / Chờ thanh toán
  PAID: "PAID",         // Đã thanh toán thành công
  FAILED: "FAILED",     // Thanh toán thất bại
  REFUNDED: "REFUNDED", // Đã hoàn tiền cho khách
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// PHƯƠNG THỨC THANH TOÁN (Payment Methods)
export const PAYMENT_METHOD = {
  COD: "COD",       // Thanh toán khi nhận hàng (Cash On Delivery)
  SEPAY: "SEPAY",   // Chuyển khoản QR ngân hàng tự động (SePay)
  MOMO: "MOMO",     // Ví điện tử MoMo
  VNPAY: "VNPAY",   // Cổng thanh toán VNPay
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// TRẠNG THÁI VẬN CHUYỂN (Shipping / Carrier Status)
export const SHIPPING_STATUS = {
  PENDING: "PENDING",       // Chờ tiếp nhận
  CONFIRMED: "CONFIRMED",   // Đã xác nhận vận chuyển
  PICKING: "PICKING",       // Shipper đang đi lấy hàng từ kho
  SHIPPING: "SHIPPING",     // Đang trên đường giao đến khách
  DELIVERED: "DELIVERED",   // Giao hàng thành công
  FAILED: "FAILED",         // Giao hàng thất bại
  RETURNED: "RETURNED",     // Chuyển hoàn về kho
  CANCELLED: "CANCELLED",   // Hủy vận đơn
} as const;

export type ShippingStatus = (typeof SHIPPING_STATUS)[keyof typeof SHIPPING_STATUS];

// ĐƠN VỊ VẬN CHUYỂN (Carriers)
export const SHIPPING_CARRIER = {
  VIETTELPOST: "VIETTELPOST", // Viettel Post
  GHN: "GHN",                 // Giao Hàng Nhanh
  GHTK: "GHTK",               // Giao Hàng Tiết Kiệm
  INTERNAL: "INTERNAL",       // Tự giao nội bộ
} as const;

export type ShippingCarrier = (typeof SHIPPING_CARRIER)[keyof typeof SHIPPING_CARRIER];

// LOẠI SỰ KIỆN TIMELINE (Audit Log)
export const ORDER_TIMELINE_TYPE = {
  ORDER: "ORDER",
  PAYMENT: "PAYMENT",
  SHIPPING: "SHIPPING",
} as const;

export type OrderTimelineType = (typeof ORDER_TIMELINE_TYPE)[keyof typeof ORDER_TIMELINE_TYPE];

// Nhãn tiếng Việt cho trạng thái đơn hàng
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: "Chờ xác nhận",
  [ORDER_STATUS.PROCESSING]: "Đang xử lý",
  [ORDER_STATUS.SHIPPING]: "Đang giao hàng",
  [ORDER_STATUS.DELIVERED]: "Đã giao hàng",
  [ORDER_STATUS.COMPLETED]: "Hoàn thành",
  [ORDER_STATUS.CANCELLED]: "Đã hủy",
  [ORDER_STATUS.RETURNED]: "Đã trả hàng",
};

// Màu sắc và kiểu dáng Tailwind cho từng trạng thái đơn hàng
export const ORDER_STATUS_BADGES: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  [ORDER_STATUS.PENDING]: {
    label: "Chờ xác nhận",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  [ORDER_STATUS.PROCESSING]: {
    label: "Đang xử lý",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  [ORDER_STATUS.SHIPPING]: {
    label: "Đang giao",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  [ORDER_STATUS.DELIVERED]: {
    label: "Đã giao hàng",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
  },
  [ORDER_STATUS.COMPLETED]: {
    label: "Hoàn thành",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Đã hủy",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
  [ORDER_STATUS.RETURNED]: {
    label: "Đã hoàn trả",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
};

// Nhãn tiếng Việt cho phương thức thanh toán
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PAYMENT_METHOD.COD]: "Thanh toán khi nhận hàng (COD)",
  [PAYMENT_METHOD.SEPAY]: "Chuyển khoản QR ngân hàng",
  [PAYMENT_METHOD.MOMO]: "Ví điện tử MoMo",
  [PAYMENT_METHOD.VNPAY]: "Cổng thanh toán VNPay",
};

// Nhãn tiếng Việt cho trạng thái thanh toán
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: "Chưa thanh toán",
  [PAYMENT_STATUS.PAID]: "Đã thanh toán",
  [PAYMENT_STATUS.FAILED]: "Thanh toán thất bại",
  [PAYMENT_STATUS.REFUNDED]: "Đã hoàn tiền",
};

// Nhãn tiếng Việt cho đơn vị vận chuyển
export const SHIPPING_CARRIER_LABELS: Record<ShippingCarrier, string> = {
  [SHIPPING_CARRIER.VIETTELPOST]: "Viettel Post",
  [SHIPPING_CARRIER.GHN]: "Giao Hàng Nhanh",
  [SHIPPING_CARRIER.GHTK]: "Giao Hàng Tiết Kiệm",
  [SHIPPING_CARRIER.INTERNAL]: "Giao hàng nội bộ",
};