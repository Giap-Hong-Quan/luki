# Luồng Đầy Đủ: Thêm Giỏ Hàng → Mua Hàng → Thanh Toán → Giao Hàng

Sơ đồ tổng quan trước, chi tiết từng bước ở dưới.

```
[Thêm giỏ hàng] → [Chọn item + Checkout] → [Tạo Order] ─┬─ COD ──────────────► [Admin tạo Shipment]
                                                          └─ SePay/Momo/VNPay → [Webhook thanh toán] → [Tạo Shipment]
                                                                                                              │
                                                                                                              ▼
                                                                          [Webhook ViettelPost cập nhật trạng thái]
                                                                                                              │
                                                                                                              ▼
                                                                                          [Khách xác nhận đã nhận hàng]
```

---

## Bước 0 — Thêm sản phẩm vào giỏ hàng

- **Trigger:** khách bấm "Thêm vào giỏ" ở trang sản phẩm.
- **API:** `POST /cart/add` *(đã có sẵn)*
- **Data gửi:** `productId, color, size, quantity`
- **Model đọc:** `Product` (check `checkProductVariantStock` — còn hàng không, lấy giá/ảnh/SKU hiện tại)
- **Model ghi:** `Cart` (upsert item, snapshot tên/giá/ảnh tại thời điểm thêm)
- **Lưu ý:** đây **CHƯA trừ tồn kho thật** — chỉ là bước "để ý", tồn kho chỉ thật sự bị giữ chỗ ở Bước 3.

## Bước 1 — Khách tick chọn sản phẩm muốn mua trong giỏ

- **API:** `GET /cart` (hiển thị), `PUT /cart/toggle-select` (tick chọn) *(đã có sẵn)*
- **Model đọc/ghi:** `Cart` (field `isSelected` của từng item)

## Bước 2 — Trang Checkout: chọn địa chỉ, xem phí ship, nhập coupon

Đây là 3 lệnh gọi song song/nối tiếp, **chưa tạo Order**, chỉ để hiển thị thông tin cho khách xác nhận trước khi đặt.

| Việc | API | Data gửi | Data trả về | Model |
|---|---|---|---|---|
| Chọn Tỉnh/Huyện/Xã người nhận | `GET /shipping/provinces`, `/shipping/districts/:provinceId`, `/shipping/wards/:districtId` | provinceId/districtId | danh sách địa danh + id chuẩn ViettelPost | không ghi DB (proxy hoặc cache) |
| Tính phí ship tạm tính | `POST /shipping/calculate-fee` | `toProvinceId, toDistrictId, toWardId, weight` (tính từ tổng cân nặng các item đã chọn) | `shippingFee` ước tính | không ghi DB, chỉ gọi `viettelPostService.calculateFee()` |
| Kiểm tra mã giảm giá | `POST /coupon/validate` | `code, userId, itemsSubtotal` (= `Cart.selectedTotalPrice`) | hợp lệ hay không + số tiền giảm dự kiến | đọc `Coupon` (check `minOrderValue`, `usageLimit`, `userLimit`, ngày hiệu lực) — **chưa tăng `usedCount`** ở bước này, chỉ tăng khi đặt hàng thành công thật (tránh trường hợp validate xong nhưng không đặt) |

## Bước 3 — Khách bấm "Đặt hàng" → tạo Order thật

- **Trigger:** khách chọn phương thức thanh toán (COD/SePay/Momo/VNPay) rồi bấm xác nhận đặt hàng.
- **API:** `POST /order/checkout`
- **Data gửi:** danh sách item đã chọn (hoặc BE tự lấy `isSelected=true` từ `Cart`), `shippingAddress` đầy đủ (kèm `provinceId/districtId/wardId`), `couponCode` (tùy chọn), `paymentMethod`.
- **BE xử lý tuần tự (`orderService.createOrderFromCart`):**
  1. Đọc `Cart`, lấy các item `isSelected=true`.
  2. Với từng item: đọc lại `Product`, gọi `checkProductVariantStock` xác nhận tồn kho **còn đủ tại thời điểm đặt** (giá/tồn kho có thể đã đổi từ lúc thêm giỏ tới giờ).
  3. **Trừ tồn kho thật** trên `Product` (`$inc` giảm `stock` của đúng size/color) — đây mới là lúc tồn kho bị giữ chỗ thật, không phải lúc thêm giỏ.
  4. Gọi lại `viettelPostService.calculateFee()` để **chốt phí ship chính thức** ở BE (không tin số FE gửi lên từ Bước 2, vì có thể bị sửa).
  5. Nếu có coupon: `couponService.applyCouponAtomic()` — tăng `usedCount` + tính `discountAmount` thật.
  6. Tính `financials` (`itemsSubtotal, shippingFee, discountAmount, finalAmount`).
  7. Tạo document `Order` (`orderStatus=PENDING`, `paymentInfo.method`, `paymentInfo.status=PENDING`).
  8. Xóa các item vừa mua khỏi `Cart`.
  9. Ghi `Order.timeline.push({ type: "ORDER", status: "PENDING" })`.
- **Model bị ghi:** `Order` (create), `Product` (trừ stock), `Cart` (xóa item), `Coupon` (tăng usedCount nếu có).
- **Response:** trả về `order` (gồm `orderCode`, `financials`...) cho FE.

## Bước 4 — Rẽ nhánh theo phương thức thanh toán

### 4A. COD
Không gọi thêm API thanh toán nào. `paymentInfo.status` vẫn `PENDING` (chỉ chuyển `PAID` lúc giao hàng thành công — xem Bước 7). `orderStatus` có thể chuyển `PROCESSING` ngay, hoặc chờ admin duyệt tay (tùy bạn chọn ở câu hỏi trước). FE chuyển sang trang "Đặt hàng thành công".

### 4B. SEPAY / MOMO / VNPAY
- **API:** `POST /payment/:orderCode/create`
- **BE xử lý:**
  - Tạo `PaymentTransaction` (`status=PENDING`, `gateway`, `amount=Order.financials.finalAmount`).
  - Gọi bên thứ 3 tương ứng:
    - **SePay:** không cần gọi API tạo gì — chỉ generate ảnh QR VietQR với nội dung chuyển khoản = `orderCode` (dùng thư viện tạo QR chuẩn VietQR).
    - **Momo:** gọi API `createPayment` của Momo → nhận `payUrl`/deeplink.
    - **VNPay:** tự build URL thanh toán (ký hash) theo tài liệu VNPay.
  - Set `Order.paymentDueAt = now + 15 phút`.
- **Model bị ghi:** `PaymentTransaction` (create), `Order` (update `paymentDueAt`).
- **FE:** hiện QR (SePay/Momo) hoặc redirect (VNPay), đồng thời có thể `GET /payment/:orderCode/status` polling để tự cập nhật khi thanh toán xong.

## Bước 5 — Gateway gửi webhook báo đã nhận tiền *(chỉ áp dụng nhánh 4B)*

- **API:** `POST /webhooks/sepay` / `POST /webhooks/momo` / `POST /webhooks/vnpay` — **bên thứ 3 gọi vào BE**, không phải FE gọi.
- **BE xử lý:**
  1. Verify chữ ký (HMAC/secure hash tùy gateway).
  2. Check `gatewayEventId` đã xử lý chưa (chống webhook gửi trùng).
  3. Tìm `PaymentTransaction` tương ứng (theo `transactionCode`/nội dung chuyển khoản chứa `orderCode`).
  4. Update `PaymentTransaction.status=SUCCESS`, `paidAt=now`.
  5. Update `Order.paymentInfo.status=PAID`, `orderStatus=PROCESSING`.
  6. Ghi `Order.timeline.push({ type: "PAYMENT", status: "PAID" })`.
- **Model bị ghi:** `PaymentTransaction`, `Order`.

## Bước 6 — Tạo vận đơn ViettelPost thật

- **Trigger:** admin bấm tay sau khi đóng gói xong, hoặc tự động trigger ngay sau Bước 5/4A (tùy quyết định vận hành).
- **API:** `POST /admin/order/:orderCode/create-shipment`
- **BE xử lý (`shipmentService.createShipmentForOrder`):**
  1. Gọi `viettelPostService.createShipmentOrder()` — data: `shippingAddress` từ `Order`, danh sách `items` để tính khối lượng, `codAmount` nếu method là COD.
  2. Tạo document `Shipment` (`carrier, trackingCode, status=CONFIRMED, shippingFee, codAmount, rawCreateResponse`).
  3. Đồng bộ `Order.shippingInfo` (trackingCode/status/shippingFee/codAmount), `orderStatus=SHIPPING`.
  4. Ghi `Order.timeline.push({ type: "SHIPPING", status: "CONFIRMED" })`.
- **Model bị ghi:** `Shipment` (create), `Order` (update).

## Bước 7 — ViettelPost báo trạng thái theo thời gian thực

- **API:** `POST /webhooks/viettelpost` — ViettelPost gọi vào mỗi khi đơn đổi trạng thái (lấy hàng, trung chuyển, giao thành công/thất bại).
- **BE xử lý:**
  1. Tìm `Shipment` theo `trackingCode`.
  2. Ghi `ShipmentLog` mới (KHÔNG ghi đè — mỗi lần webhook là 1 document log riêng).
  3. Update `Shipment.status` (map từ `carrierStatusRaw`), `deliveredAt` nếu `DELIVERED`.
  4. Đồng bộ `Order.shippingInfo.status`; nếu `DELIVERED` → `Order.orderStatus=DELIVERED`.
  5. **Nếu `paymentInfo.method=COD` và status=`DELIVERED`:** tự động tạo `PaymentTransaction` (`gateway=COD, status=SUCCESS`) + set `Order.paymentInfo.status=PAID` — vì COD thu tiền ngay lúc giao, không qua gateway nào cả.
  6. Nếu status=`FAILED`: tùy chính sách, có thể tự động gọi lại Bước 6 để tạo `Shipment` mới (`attemptNumber+1`).
- **Model bị ghi:** `ShipmentLog` (create), `Shipment` (update), `Order` (update), `PaymentTransaction` (create nếu COD vừa giao xong).

## Bước 8 — Khách xác nhận đã nhận hàng

- **API:** `PUT /order/:orderCode/confirm-received`
- **BE:** `Order.orderStatus=COMPLETED`, ghi timeline.
- **Model bị ghi:** `Order`.

## Bước phụ — Cron job hủy đơn quá hạn thanh toán

- Chạy định kỳ (VD mỗi 5 phút): query `Order` có `orderStatus=PENDING`, `paymentInfo.status=PENDING`, `paymentDueAt < now`.
- Set `orderStatus=CANCELLED`, hoàn lại tồn kho đã trừ ở Bước 3.3 (`$inc` cộng lại `Product.stock`), ghi timeline.
- **Model bị ghi:** `Order`, `Product`.

---

## Tổng kết nhanh: model nào bị chạm ở bước nào

| Model | Bị ghi ở bước |
|---|---|
| `Cart` | 0 (thêm), 1 (tick chọn), 3 (xóa item sau khi đặt) |
| `Product` | 3 (trừ tồn kho), cron (hoàn tồn kho nếu hủy) |
| `Order` | 3 (tạo), 4B (paymentDueAt), 5 (paid), 6 (shipping), 7 (delivered), 8 (completed), cron (cancelled) |
| `Coupon` | 3 (tăng usedCount) |
| `PaymentTransaction` | 4B (tạo), 5 (success), 7 (tạo nếu COD giao xong) |
| `Shipment` | 6 (tạo), 7 (update status) |
| `ShipmentLog` | 7 (mỗi lần webhook) |
