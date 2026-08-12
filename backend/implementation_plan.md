# Kế Hoạch Triển Khai: Order, Payment, Shipping (ViettelPost) & Coupon

Đọc source BE hiện tại (Cart/Product/Auth) để bám đúng convention đang dùng: controller xử lý logic trực tiếp (trừ phần gọi API bên thứ 3 sẽ tách service riêng), `ApiError` + `success()` cho response, `validate(zodSchema)` middleware, `verifyToken` / `authorizeRoles`, Zod validator dạng `z.object({ body: ... })`, Swagger JSDoc ngay trong router. Chưa có model Order/Payment/Shipment/Coupon nào trong repo — đây là toàn bộ phần mới.

---

## 1. Model — có sửa so với bản nháp trước

### 1.1 `Order.js`
Giữ nguyên phần lớn bản trước, sửa các điểm sau:

- `shippingInfo` chỉ giữ **snapshot rút gọn** (carrier, trackingCode, status, shippingFee, codAmount, estimatedDeliveryDate) để load nhanh danh sách đơn — dữ liệu đầy đủ + lịch sử nằm ở collection `Shipment` riêng (lý do: đơn có thể giao thất bại → tạo lại vận đơn khác, nếu nhúng thẳng sẽ mất lịch sử vận đơn cũ).
- Thêm `paymentDueAt` (Date) — hạn thanh toán online, phục vụ cron tự hủy đơn không thanh toán.
- `timeline` sub-schema thêm field `type: "ORDER" | "PAYMENT" | "SHIPPING"` để phân biệt nguồn gốc sự kiện.
- `paymentInfo.status` enum: `PENDING | PAID | FAILED | REFUNDED` (giữ nguyên).

### 1.2 `Shipment.js` (MỚI — tách ra khỏi Order, đối xứng với PaymentTransaction)
```
order (ref Order, index)
carrier: VIETTELPOST | GHN | GHTK | INTERNAL
trackingCode
status: PENDING | CONFIRMED | PICKING | SHIPPING | DELIVERED | FAILED | RETURNED | CANCELLED
carrierStatusRaw        // status gốc ViettelPost, phục vụ debug
shippingFee
codAmount                // BẮT BUỘC vì có COD — số tiền ViettelPost cần thu hộ
weight, dimensions {length, width, height}
estimatedDeliveryDate, deliveredAt
failedReason
attemptNumber            // lần giao thứ mấy (retry sau giao thất bại)
rawCreateResponse        // response tạo đơn gốc từ ViettelPost
timestamps
```

### 1.3 `ShipmentLog.js` (MỚI)
Lưu lịch sử mỗi lần webhook ViettelPost báo trạng thái — phục vụ đối soát/khiếu nại, tách khỏi `Order.timeline` (vốn chỉ nên chứa mốc lớn hiển thị cho khách):
```
shipment (ref Shipment, index)
status, message, rawPayload (Mixed)
createdAt
```

### 1.4 `PaymentTransaction.js` — sửa 3 điểm
- `transactionCode`: bỏ `required: true` cứng — với COD tự sinh mã nội bộ dạng `COD-{orderCode}` ở tầng service trước khi save, để không vi phạm `unique`.
- `status` enum thêm `REFUNDED` (đồng bộ với `Order.paymentInfo.status`, bản trước bị lệch).
- Thêm `gatewayEventId` (String, index, sparse) — id sự kiện gốc bên gateway trả về (khác `transactionCode` vốn có thể là nội dung chuyển khoản), dùng để chống xử lý webhook trùng lặp (idempotency).

### 1.5 `Coupon.js`
Giữ nguyên schema. Lưu ý xử lý ở tầng service: tăng `usedCount` bằng `findOneAndUpdate` với điều kiện `usedCount < usageLimit` trong 1 query atomic, không đọc-rồi-ghi 2 bước (tránh race condition khi nhiều request cùng lúc).

---

## 2. Service layer mới (external integration — tách khỏi controller)

Cart hiện để controller tự xử lý (service rỗng) vì logic đơn giản. Phần tích hợp bên thứ 3 phức tạp hơn nhiều (auth token, retry, ký webhook) nên bắt buộc tách service riêng:

- `services/viettelPostService.js` — `getToken()` (cache token, tự refresh khi hết hạn), `calculateFee()`, `createShipmentOrder()`, `getShipmentStatus()`, `cancelShipmentOrder()`, `getProvinces()/getDistricts()/getWards()`.
- `services/payment/sepayService.js` — verify chữ ký HMAC webhook, parse nội dung chuyển khoản để lấy `orderCode`.
- `services/payment/momoService.js` — tạo request thanh toán, verify signature IPN.
- `services/payment/vnpayService.js` — tạo URL thanh toán, verify secure hash return/IPN.
- `services/orderService.js` — `createOrderFromCart()` (validate tồn kho, trừ tồn kho, snapshot items, áp coupon, tính financials), `cancelOrder()`, `updateOrderStatus()`.
- `services/shipmentService.js` — `createShipmentForOrder()`, `handleViettelPostWebhook()` (map carrier status → status nội bộ, ghi `ShipmentLog`, đồng bộ ngược `Order.shippingInfo` + `orderStatus`).
- `services/couponService.js` — `validateCoupon()`, `applyCouponAtomic()`.

## 3. Config/.env cần thêm
`VIETTELPOST_USERNAME`, `VIETTELPOST_PASSWORD`, `VIETTELPOST_BASE_URL`, `SEPAY_WEBHOOK_SECRET`, `MOMO_PARTNER_CODE`/`ACCESS_KEY`/`SECRET_KEY`, `VNPAY_TMN_CODE`/`HASH_SECRET`/`URL`. Cần thêm package `axios` (chưa có trong `package.json`).

---

## 4. API endpoints (theo đúng convention router/controller/validator hiện tại)

### 4.1 `orderRouter.js` — user
| Method | Path | Việc gì |
|---|---|---|
| POST | `/order/checkout` | Tạo đơn từ các item đã chọn trong cart + địa chỉ + coupon + payment method |
| GET | `/order` | Danh sách đơn của user (phân trang, filter status) |
| GET | `/order/:orderCode` | Chi tiết 1 đơn |
| PUT | `/order/:orderCode/cancel` | Hủy đơn (chỉ khi `PENDING`/`PROCESSING`) |
| PUT | `/order/:orderCode/confirm-received` | Khách xác nhận đã nhận hàng → `COMPLETED` |

### 4.2 `orderRouter.js` — admin (`authorizeRoles("admin")`)
| Method | Path | Việc gì |
|---|---|---|
| GET | `/admin/order` | Danh sách toàn bộ, search/filter |
| PUT | `/admin/order/:orderCode/status` | Cập nhật trạng thái thủ công + note |
| POST | `/admin/order/:orderCode/create-shipment` | Tạo vận đơn ViettelPost thật |

### 4.3 `shippingRouter.js`
| Method | Path | Việc gì |
|---|---|---|
| GET | `/shipping/provinces` | Proxy danh sách tỉnh ViettelPost (cache DB/memory) |
| GET | `/shipping/districts/:provinceId` | Danh sách huyện |
| GET | `/shipping/wards/:districtId` | Danh sách xã |
| POST | `/shipping/calculate-fee` | Tính phí ship trước khi đặt (hiện ở trang checkout) |
| POST | `/webhooks/viettelpost` | Callback trạng thái vận đơn (public, verify theo secret/IP nếu có) |

### 4.4 `paymentRouter.js`
| Method | Path | Việc gì |
|---|---|---|
| POST | `/payment/:orderCode/create` | Tạo yêu cầu thanh toán theo method (trả QR SePay hoặc redirect URL Momo/VNPay) |
| GET | `/payment/:orderCode/status` | FE polling trạng thái khi đang chờ quét QR |
| POST | `/webhooks/sepay` | Callback SePay (verify HMAC) |
| POST | `/webhooks/momo` | IPN Momo (verify signature) |
| GET | `/payment/vnpay/return` | Return URL sau khi khách thanh toán VNPay |
| POST | `/webhooks/vnpay` | IPN VNPay (verify secure hash) |

### 4.5 `couponRouter.js`
| Method | Path | Việc gì |
|---|---|---|
| POST | `/coupon/validate` | Check mã hợp lệ trước khi áp (hạn, minOrderValue, usageLimit, userLimit) |
| POST/PUT/DELETE | `/admin/coupon` | CRUD (admin) |

Tất cả route webhook (`/webhooks/*`) **không** qua `verifyToken` (bên ngoài gọi vào), phải tự verify chữ ký/secret riêng ở tầng service.

---

## 5. Luồng nghiệp vụ tổng thể

1. FE gọi `POST /order/checkout`: cart items đã chọn + địa chỉ + coupon (tùy chọn) + payment method.
2. BE: validate & trừ tồn kho, gọi `viettelPostService.calculateFee()` lấy phí ship thật, áp coupon (atomic), tính `financials`, tạo `Order` (`orderStatus=PENDING`).
3. Method = **COD** → bỏ qua bước thanh toán, chuyển thẳng `orderStatus=PROCESSING`, có thể tạo `Shipment` ngay.
4. Method = **SEPAY/MOMO/VNPAY** → tạo `PaymentTransaction` (`PENDING`), gọi gateway lấy QR/URL, set `paymentDueAt` (+15 phút).
5. Webhook gateway báo về → verify chữ ký + idempotency (`gatewayEventId`) → `PaymentTransaction.status=SUCCESS` → `Order.paymentInfo.status=PAID` → trigger tạo `Shipment`.
6. Cron job quét `Order` quá `paymentDueAt` mà chưa `PAID` → tự hủy, hoàn tồn kho.
7. Tạo `Shipment` (tự động hoặc admin bấm tay) → lưu `trackingCode` → đồng bộ `Order.shippingInfo` (snapshot) → `orderStatus=SHIPPING`.
8. Webhook ViettelPost báo trạng thái → ghi `ShipmentLog` → cập nhật `Shipment.status`. Nếu `DELIVERED` **và** `paymentInfo.method=COD` → tự động set `PaymentTransaction.status=SUCCESS` + `Order.paymentInfo.status=PAID` (vì COD thu tiền lúc giao, không qua gateway) → `orderStatus=DELIVERED`.
9. Khách bấm "đã nhận hàng" → `orderStatus=COMPLETED`.

---

## 6. Thứ tự triển khai đề xuất

1. **Phase 1** — Model `Order`/`Shipment`/`ShipmentLog`/`PaymentTransaction`/`Coupon` + API checkout chỉ hỗ trợ COD (chưa gọi ViettelPost thật, mock trước để thông luồng).
2. **Phase 2** — Tích hợp ViettelPost thật: `calculateFee`, `createShipmentOrder`, webhook.
3. **Phase 3** — Tích hợp SePay (đơn giản nhất, chỉ cần 1 webhook).
4. **Phase 4** — Tích hợp Momo + VNPay (cần tạo request + verify signature phức tạp hơn).
5. **Phase 5** — Admin order management + cron tự hủy đơn quá hạn thanh toán.

## 7. Xác nhận trước khi code
Bạn muốn bắt đầu code từ Phase nào trước? Và với COD, mình xử lý theo hướng "khách xác nhận nhận hàng thì bấm nút trên web" hay "chờ webhook ViettelPost báo DELIVERED mới tự set thanh toán thành công" — chọn 1 trong 2 sẽ ảnh hưởng tới việc có bắt buộc phải xong Phase 2 (ViettelPost) trước khi làm COD hoàn chỉnh hay không.
