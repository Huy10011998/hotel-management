# Thiết kế cơ sở dữ liệu — MongoDB

Kiểu TypeScript của từng collection nằm ở `packages/shared/src/types.ts` (dùng chung FE/BE).
Quy ước:

- Tiền: **số nguyên VND** (`Int64`), không dùng float.
- Ngày lưu trú (`checkIn`, `checkOut`, `date` của phát sinh): chuỗi `"YYYY-MM-DD"` — là *ngày khách sạn*, không phụ thuộc múi giờ.
- Thời điểm (`createdAt`, `at`): `Date` (UTC).
- Mọi document có `hotelId` để hỗ trợ nhiều chi nhánh (prototype chưa thể hiện).

## Yêu cầu hạ tầng

- **Replica set** (MongoDB Atlas có sẵn) — bắt buộc để dùng **multi-document transaction**.
- **Redis** — cache sơ đồ phòng, khóa phân tán khi nhận booking từ Channel Manager, hàng đợi BullMQ.

## Collections & index

| Collection | Nội dung chính | Index |
|---|---|---|
| `hotels` | Thông tin KS, giờ chuẩn, VAT, phí DV, tài khoản ngân hàng | — |
| `users` | Nhân viên, vai trò, 2FA, hash mật khẩu (argon2) | `{email:1}` unique |
| `roles` | Ma trận quyền theo vai trò | `{hotelId:1, role:1}` unique |
| `room_types` | Hạng phòng, sức chứa, giá cơ bản, tiện nghi | `{hotelId:1, code:1}` unique |
| `rooms` | Số phòng, tầng, `hkStatus`, `outOfOrder`, người dọn | `{hotelId:1, number:1}` unique |
| `rate_plans` | Gói giá (BAR, NRF, CORP…), % điều chỉnh, bữa ăn | `{hotelId:1, code:1}` unique |
| `rate_rules` | Quy tắc mùa / lễ / cuối tuần | `{hotelId:1, from:1, to:1}` |
| `guests` | Hồ sơ khách, giấy tờ (mã hóa trường `idNumber`), VIP, blacklist | `{hotelId:1, phone:1}`, `{hotelId:1, idNumber:1}`, text index `fullName` |
| `companies` | Công ty / đoàn, MST | `{taxCode:1}` |
| `reservations` | Booking, trạng thái, nguồn, giá/đêm, cọc, `history[]` (embed) | `{hotelId:1, checkIn:1}`, `{hotelId:1, status:1, checkOut:1}`, `{code:1}` unique, `{guestId:1}` |
| **`room_nights`** | Mỗi đêm phòng đã giữ: `{roomId, date, reservationId}` | **`{roomId:1, date:1}` unique** |
| `folios` | `charges[]`, `payments[]` (embed), `status` | `{reservationId:1}` unique, `{status:1}` |
| `invoices` | Hóa đơn sau check-out, liên kết HĐĐT | `{number:1}` unique, `{issuedAt:-1}` |
| `services` | Danh mục dịch vụ & phụ thu | `{hotelId:1, category:1}` |
| `housekeeping_tasks` | Lịch sử dọn phòng (ai, lúc nào, bao lâu) | `{roomId:1, createdAt:-1}` |
| `maintenance_tickets` | Sự cố, mức ưu tiên, khóa phòng | `{status:1, priority:1}`, `{roomId:1}` |
| `shifts` | Ca lễ tân, tiền đầu/cuối ca | `{staffId:1, openedAt:-1}` |
| `audit_logs` | Nhật ký thao tác nhạy cảm | `{at:-1}`, TTL tùy chính sách lưu trữ |
| `daily_stats` | Số liệu chốt mỗi ngày do Night Audit sinh ra (công suất, ADR, RevPAR, doanh thu theo nhóm/nguồn) | `{hotelId:1, date:1}` unique |

## Chống đặt trùng phòng (overbooking)

MongoDB không có ràng buộc "khoảng ngày không giao nhau" như `EXCLUDE` của PostgreSQL. Giải pháp:

1. Collection `room_nights` với unique index `{roomId, date}`.
2. Khi tạo / đổi ngày / đổi phòng một booking, trong **một transaction**:
   - xóa các `room_nights` cũ của booking (nếu có),
   - `insertMany` một bản ghi cho **mỗi đêm** (`checkIn` ≤ date < `checkOut`),
   - ghi/ cập nhật `reservations` và `folios`.
3. Nếu một đêm đã bị giữ → lỗi `E11000 duplicate key` → transaction rollback → trả lỗi 409 “Phòng đã có đặt phòng trong khoảng ngày này”.
4. Booking chưa gán phòng: kiểm tra **tồn kho theo loại phòng** (số phòng sẵn có − số đêm đã giữ) trong cùng transaction.
5. Hủy / No-show / Check-out sớm: xóa các `room_nights` tương ứng để giải phóng phòng.

Prototype mô phỏng đúng logic này ở `apps/web/lib/selectors.ts` → `findConflict()`.

## Night Audit (job chạy mỗi đêm, BullMQ)

1. Ghi tiền phòng đêm nay vào folio của mọi booking `checked_in`.
2. Booking `confirmed` có `checkIn` = hôm nay chưa đến → chuyển `no_show` (theo cấu hình), giải phóng `room_nights`.
3. Phòng có khách → `hkStatus = dirty` cho ngày mới.
4. Tổng hợp `daily_stats`; khóa sổ ngày (không cho sửa phát sinh ngày cũ nếu không có quyền).
5. Chuyển "ngày làm việc" sang ngày kế tiếp.

## Báo cáo

- Báo cáo nhanh: aggregation pipeline trên `folios.charges` (`$unwind` + `$match date` + `$group category`).
- Báo cáo khoảng dài / dashboard: đọc `daily_stats` để tránh quét toàn bộ folio.
