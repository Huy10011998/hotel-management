# Hotel PMS — Website Quản Lý Khách Sạn

Prototype giao diện đầy đủ cho hệ thống quản lý khách sạn (Property Management System): đặt phòng, lễ tân, buồng phòng, thu ngân, báo cáo, quản trị.
Dữ liệu là **dữ liệu mẫu** lưu trong trình duyệt — chưa có backend. Kế hoạch tổng thể ở [docs/PLAN.md](docs/PLAN.md), thiết kế DB ở [docs/DATABASE.md](docs/DATABASE.md).

## Chạy dự án

Yêu cầu Node.js ≥ 20.

```bash
npm install
npm run dev          # http://localhost:3000 — web đặt phòng cho khách; quản trị ở /dashboard
npm run build        # build production
npm run lint
npm run typecheck
```

Đăng nhập là màn hình mô phỏng — bấm **Đăng nhập** là vào. Dữ liệu mẫu tự sinh lại khi sang ngày mới; có thể khôi phục thủ công ở menu tài khoản hoặc **Cài đặt → Dữ liệu**.

## Cấu trúc

```
apps/web/                 Next.js 15 (App Router) + Tailwind v4
  app/(auth)/login        Đăng nhập
  app/(dashboard)/…       24 màn hình nghiệp vụ (xem bên dưới)
  app/(site)/…            Website khách: trang chủ, phòng, đặt phòng, tra cứu, chính sách
  components/site/        Header/footer web khách, chọn ngày có giá, thẻ phòng, tóm tắt giá
  components/ui/          Button, Card, Dialog, Tabs, Table… (Radix UI)
  components/hotel/       Component nghiệp vụ dùng chung: DataTable, FolioPanel,
                          GuestPicker, StatusBadge, VietQR, ChangeRoomDialog…
  lib/store.ts            Store zustand — mỗi action tương ứng 1 API NestJS dự kiến
  lib/selectors.ts        Tính giá, folio, trạng thái phòng, chống trùng phòng
  lib/booking.ts          Logic đặt phòng online: tìm phòng, gói giá, chính sách hủy, tổng tiền
  lib/site-content.ts     Nội dung web khách (ảnh, mô tả phòng, tiện ích, FAQ)
  lib/mock/seed.ts        Sinh dữ liệu mẫu — Khách sạn Bạch Đàn, Cao Lãnh (24 phòng, ~140 khách, booking ±6 tuần)
packages/shared/          Enum + nhãn tiếng Việt, kiểu dữ liệu, zod schema (dùng lại cho NestJS)
docs/                     Kế hoạch, thiết kế MongoDB
```

## Website khách (`/`)

Theo chuẩn booking engine của khách sạn: trang chủ (hero, tìm phòng, lợi ích đặt trực tiếp, phòng, tiện ích, đánh giá, vị trí, FAQ) · danh sách & chi tiết phòng (gallery, tiện nghi) · tìm phòng trống với lịch chọn ngày hiển thị giá thấp nhất từng đêm, gợi ý ngày khác khi hết phòng, mã ưu đãi (thử `CORP`) · chọn gói giá (ăn sáng, hoàn hủy / không hoàn hủy, tổng giá đã gồm thuế phí) · form thông tin khách, yêu cầu đặc biệt, dịch vụ đặt kèm, xuất hóa đơn công ty, đồng ý NĐ 13/2023 · thanh toán tại KS / VietQR / thẻ–ví (mô phỏng) · trang xác nhận: thêm vào lịch (.ics), in, tự hủy theo chính sách · tra cứu đơn bằng mã + email/SĐT.

Đơn đặt online xuất hiện ngay ở trang quản trị (nguồn **Website**, chưa gán phòng) vì dùng chung dữ liệu trong trình duyệt.

## Màn hình quản trị

| Nhóm | Màn hình |
|---|---|
| Vận hành | Tổng quan (KPI, doanh thu 30 ngày, nguồn đặt, dự báo công suất) · Sơ đồ phòng · Lịch đặt phòng (kéo-thả) · Đặt phòng (danh sách / tạo mới / chi tiết) · Check-in (wizard 4 bước) · Check-out · Buồng phòng (kanban) · Bảo trì |
| Khách hàng | Danh sách, hồ sơ khách (lịch sử lưu trú, chi tiêu, VIP / blacklist, sở thích) |
| Tài chính | Folio · Hóa đơn (mẫu in, VietQR) · Thanh toán · Báo cáo (doanh thu, công suất/ADR/RevPAR, nguồn đặt, loại phòng, giao ca, khai báo lưu trú, nhật ký) |
| Quản trị | Phòng · Loại phòng · Giá phòng (lịch giá, gói giá, quy tắc mùa/lễ) · Dịch vụ · Nhân viên & ma trận phân quyền · Cài đặt (thông tin KS, thuế phí, ngân hàng, tích hợp) |

Tiện ích chung: tìm nhanh `Ctrl/⌘ K`, phím tắt lễ tân (`Alt+N` đặt phòng, `Alt+R` sơ đồ, `Alt+L` lịch, `Alt+I` check-in, `Alt+O` check-out, `Shift+?` xem tất cả), sáng/tối, responsive, xuất Excel (CSV UTF-8), in hóa đơn / báo cáo.

## Bước tiếp theo

1. `apps/api` — NestJS + Mongoose: thay từng action trong `lib/store.ts` bằng endpoint tương ứng, dùng transaction + `room_nights` để chống trùng phòng.
2. Xác thực JWT + refresh token, RBAC guard theo `rolePermissions`, 2FA.
3. Night Audit (BullMQ), khai báo lưu trú, hóa đơn điện tử, Channel Manager, cổng thanh toán (thay phần mô phỏng trên web khách), gửi email xác nhận đặt phòng.
