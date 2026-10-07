# Kế hoạch: Website Quản Lý Khách Sạn (Hotel PMS)

## Context
Bạn cần một website quản lý khách sạn chuyên nghiệp: danh sách tính năng, chọn ngôn ngữ, DB, và dựng giao diện đầy đủ các màn hình.
Đã chốt: **Next.js + NestJS (TypeScript)**, **MongoDB**, phạm vi lần này là **Prototype UI đầy đủ màn hình với dữ liệu mẫu (mock)**, dự án mới tại **`~/hotel-management`** (tách hẳn khỏi qlts_app_2).

---

## 1. Danh sách tính năng

### A. Cốt lõi (MVP, bắt buộc)
| Module | Tính năng chính |
|---|---|
| **Dashboard** | Công suất phòng hôm nay (%), số khách đến/đi trong ngày, doanh thu ngày/tháng, ADR, RevPAR, phòng cần dọn, cảnh báo |
| **Sơ đồ phòng (Room Rack)** | Lưới phòng theo tầng, màu theo trạng thái: Trống sạch / Trống bẩn / Có khách / Đã đặt / Đang dọn / Bảo trì; click mở nhanh thao tác |
| **Lịch đặt phòng (Timeline/Gantt)** | Trục ngày × phòng, kéo-thả đổi phòng/đổi ngày, xem khoảng trống |
| **Đặt phòng (Reservation)** | Tạo/sửa/hủy booking, đặt nhiều phòng, đặt cọc, nguồn đặt (walk-in, điện thoại, Booking.com, Agoda…), trạng thái: Tạm giữ → Xác nhận → Check-in → Check-out / Hủy / No-show |
| **Check-in / Check-out** | Quét/nhập CCCD-Passport, gán phòng, giao chìa/thẻ, check-out: tổng hợp folio, thanh toán, trả phòng sớm/muộn |
| **Khách hàng (Guest/CRM)** | Hồ sơ khách, lịch sử lưu trú, khách VIP/blacklist, ghi chú sở thích, công ty/đoàn |
| **Quản lý phòng & loại phòng** | Loại phòng (Standard, Deluxe, Suite…), sức chứa, tiện nghi, ảnh, tầng, trạng thái |
| **Giá phòng (Rate)** | Giá theo loại phòng, theo mùa/ngày lễ/cuối tuần, giá theo giờ/qua đêm/theo ngày, gói (kèm ăn sáng), phụ thu người thêm |
| **Dịch vụ & Folio** | Minibar, giặt ủi, nhà hàng, đưa đón, spa — ghi vào folio phòng |
| **Hóa đơn & Thanh toán** | Tiền mặt, chuyển khoản (QR VietQR), thẻ; tách/gộp hóa đơn, đặt cọc, hoàn tiền; **xuất HĐĐT** (tích hợp sau) |
| **Buồng phòng (Housekeeping)** | Danh sách phòng cần dọn, phân công nhân viên, cập nhật trạng thái từ điện thoại, báo hỏng |
| **Bảo trì** | Ticket sự cố, khóa phòng bảo trì, lịch sử sửa chữa |
| **Nhân viên & Phân quyền** | Vai trò: Admin, Quản lý, Lễ tân, Buồng phòng, Kế toán; phân quyền theo chức năng (RBAC) |
| **Báo cáo** | Công suất, doanh thu theo ngày/nguồn/loại phòng, ca lễ tân (giao ca), công nợ, khách lưu trú; xuất Excel/PDF |
| **Cài đặt** | Thông tin khách sạn, thuế/phí dịch vụ, mẫu hóa đơn, giờ check-in/out chuẩn |

### B. Gợi ý thêm để chuyên nghiệp hơn
- **Khai báo lưu trú** cho công an (xuất file theo mẫu / tích hợp ASM) — bắt buộc tại VN.
- **Channel Manager**: đồng bộ phòng trống/giá với Booking.com, Agoda, Traveloka, Expedia (qua đối tác như SiteMinder/STAAH) — tránh overbooking.
- **Booking Engine**: trang đặt phòng trực tiếp trên website khách sạn + thanh toán online (VNPay, MoMo, OnePay). *(Đã có prototype UI ở `app/(site)/` — thanh toán đang mô phỏng.)*
- **Quản lý ca & giao ca** lễ tân: tiền đầu ca/cuối ca, chênh lệch.
- **Night Audit** (chốt ngày): tự động ghi tiền phòng vào folio, chuyển no-show, khóa sổ.
- **Thông báo**: email/SMS/Zalo OA xác nhận đặt phòng, nhắc check-in, gửi hóa đơn.
- **Audit log**: ai sửa giá, hủy booking, giảm giá — chống gian lận.
- **Đa chi nhánh (multi-property)** nếu có chuỗi.
- **Đa ngôn ngữ (VI/EN)**, đa tiền tệ.
- **Khóa từ / thẻ phòng** tích hợp (VingCard, Hune…).
- **POS nhà hàng/bar** gắn vào folio phòng.
- **Revenue management**: gợi ý giá theo công suất.
- **Đánh giá khách** sau check-out.
- **PWA/mobile** cho buồng phòng.
- Bảo mật: 2FA, sao lưu tự động, mã hóa dữ liệu CCCD (tuân thủ **Nghị định 13/2023 về bảo vệ dữ liệu cá nhân**).

---

## 2. Công nghệ

| Lớp | Lựa chọn |
|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript**, Tailwind CSS v4, Radix UI (component kiểu shadcn tự viết), React Hook Form + Zod, Recharts, dayjs, zustand (store mock); thêm TanStack Query + next-intl khi nối API |
| Backend (giai đoạn sau) | **NestJS + TypeScript**, Mongoose, JWT + refresh token, RBAC guard, Swagger, BullMQ (job night audit, gửi mail) |
| Database | **MongoDB** (replica set / MongoDB Atlas) + **Redis** (cache, lock, queue) |
| Hạ tầng | Docker Compose, Nginx, CI GitHub Actions |
| Monorepo | npm workspaces: `apps/web`, `apps/api`, `packages/shared` (types + zod schema dùng chung FE/BE) |

### MongoDB — dùng được, với các lưu ý
- **Bắt buộc chạy replica set** (Atlas mặc định có) để dùng **multi-document transaction** khi tạo booking + cọc + folio.
- **Chống đặt trùng phòng**: MongoDB không có ràng buộc khoảng ngày như PostgreSQL → dùng collection `room_nights` với **unique index `{roomId, date}`**; mỗi đêm của booking insert 1 bản ghi trong transaction, trùng sẽ lỗi duplicate key → rollback.
- Tiền tệ lưu **số nguyên VND** (hoặc Decimal128), không dùng float.
- Báo cáo dùng aggregation pipeline; dữ liệu lớn thì thêm collection tổng hợp theo ngày (`daily_stats`) do night audit sinh ra.

### Collections chính (thiết kế sơ bộ)
`hotels`, `users`, `roles`, `room_types`, `rooms`, `rate_plans`, `rates` (theo ngày), `guests`, `companies`, `reservations` (embed `rooms[]`, `guests[]`), `room_nights` (unique roomId+date), `folios` (embed `charges[]`, `payments[]`), `invoices`, `services`, `housekeeping_tasks`, `maintenance_tickets`, `shifts`, `audit_logs`, `daily_stats`, `settings`.

---

## 3. Prototype UI (phạm vi lần này)

### Cấu trúc dự án `~/hotel-management`
```
apps/web/
  app/(auth)/login
  app/(dashboard)/layout.tsx        # Sidebar + Topbar
    dashboard/  room-rack/  calendar/
    reservations/ [list, new, [id]]
    front-desk/ [check-in, check-out]
    guests/ [list, [id]]
    rooms/ room-types/ rates/ services/
    billing/ [folios, invoices, payments]
    housekeeping/ maintenance/
    reports/ staff/ settings/
  components/ui/       # shadcn
  components/hotel/    # RoomCard, StatusBadge, BookingTimeline, FolioTable, KpiCard...
  lib/mock/            # dữ liệu mẫu: 5 tầng × ~40 phòng, 150 booking, khách, dịch vụ
  lib/types.ts         # type khớp với collections ở trên
packages/shared/       # zod schema + enum trạng thái (dùng lại cho NestJS sau)
```

### Chuẩn giao diện
- Layout: **Sidebar thu gọn được** (nhóm: Vận hành / Khách hàng / Tài chính / Quản trị), Topbar có tìm kiếm nhanh (số phòng, tên khách, mã booking), chọn ngày làm việc, thông báo, tài khoản.
- **Màu trạng thái phòng thống nhất** toàn hệ thống (StatusBadge dùng chung) + chú thích (legend).
- Bảng: lọc, sắp xếp, phân trang, xuất Excel; form có validation tiếng Việt; định dạng tiền `1.250.000 ₫`, ngày `dd/MM/yyyy`.
- Light/Dark mode, responsive (Housekeeping tối ưu điện thoại), phím tắt cho lễ tân.
- Trạng thái rỗng / loading skeleton / lỗi cho mọi màn hình.

### Màn hình và thông tin hiển thị
1. **Đăng nhập** — chọn khách sạn/chi nhánh.
2. **Dashboard** — KPI cards (công suất, doanh thu, ADR, RevPAR), biểu đồ doanh thu 30 ngày, danh sách đến/đi hôm nay, phòng cần dọn.
3. **Room Rack** — lưới phòng theo tầng, lọc theo loại/trạng thái, popover: khách, ngày ở, số dư folio, nút Check-in/Check-out/Đổi phòng/Đánh dấu sạch.
4. **Lịch đặt phòng** — timeline 14/30 ngày, thanh booking màu theo nguồn, kéo-thả (mock).
5. **Đặt phòng** — danh sách + bộ lọc; form tạo: ngày, số khách, chọn loại/phòng trống, giá tự tính, khách (tìm hoặc tạo mới), cọc, nguồn, ghi chú; chi tiết booking với timeline lịch sử.
6. **Check-in** — wizard: tìm booking → thông tin khách/CCCD → gán phòng → thu cọc. **Check-out** — folio, phụ thu, giảm giá, thanh toán, in hóa đơn.
7. **Khách hàng** — danh sách, hồ sơ: lịch sử lưu trú, tổng chi tiêu, tag VIP.
8. **Phòng / Loại phòng / Giá / Dịch vụ** — CRUD, lịch giá theo ngày.
9. **Folio / Hóa đơn / Thanh toán** — chi tiết phát sinh, mẫu hóa đơn in, mã QR VietQR.
10. **Buồng phòng** — bảng kanban (Bẩn → Đang dọn → Sạch → Đã kiểm tra), phân công. **Bảo trì** — ticket.
11. **Báo cáo** — công suất, doanh thu theo nguồn/loại phòng, giao ca; biểu đồ + bảng + xuất file.
12. **Nhân viên & Phân quyền** — ma trận quyền theo vai trò. **Cài đặt** — thông tin KS, thuế, giờ chuẩn.

### Thứ tự thực hiện
1. Khởi tạo monorepo (npm workspaces), Next.js, Tailwind, shadcn/ui, `packages/shared` (enum + types).
2. Layout chung + StatusBadge/KpiCard/DataTable dùng chung + mock data.
3. Dashboard, Room Rack, Lịch đặt phòng.
4. Đặt phòng, Check-in/Check-out, Khách hàng.
5. Phòng/Giá/Dịch vụ, Billing.
6. Housekeeping, Bảo trì, Báo cáo, Nhân viên, Cài đặt, Login.
7. Rà soát responsive, dark mode, empty/loading states.

---

## Verification
- `npm install && npm run dev` → mở http://localhost:3000, đi qua toàn bộ menu, không màn hình nào lỗi.
- `npm run build`, `npm run lint`, `npm run typecheck` pass.
- Kiểm tra luồng mock: tạo booking → xuất hiện trên Lịch & Room Rack → Check-in → thêm dịch vụ vào folio → Check-out ra hóa đơn.
- Kiểm tra ở chiều rộng điện thoại (375px) và dark mode.

## Giai đoạn sau (ngoài phạm vi lần này)
NestJS API + MongoDB thật (transaction + `room_nights`), auth/RBAC, night audit, khai báo lưu trú, HĐĐT, channel manager, thanh toán online.
