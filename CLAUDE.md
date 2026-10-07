# CLAUDE.md

Hotel PMS (website quản lý khách sạn). Giai đoạn hiện tại: **prototype UI đầy đủ màn hình, dữ liệu mock** — chưa có backend.
Tài liệu: [README.md](README.md) (chạy dự án, cấu trúc), [docs/PLAN.md](docs/PLAN.md) (tính năng, công nghệ, lộ trình), [docs/DATABASE.md](docs/DATABASE.md) (thiết kế MongoDB).

Người dùng giao tiếp bằng tiếng Việt; giao diện, nhãn, thông báo lỗi, comment trong code đều viết tiếng Việt.

## Lệnh

```bash
npm install
npm run dev        # http://localhost:3000 (/ = web khách, /dashboard = quản trị)
npm run build
npm run lint
npm run typecheck  # web + @hotel/shared
```

Sau khi sửa code, chạy `typecheck` + `lint`; thay đổi lớn thì chạy thêm `build`.

## Quyết định đã chốt

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4 cho FE; **NestJS + Mongoose + MongoDB** cho BE (chưa làm); Redis + BullMQ cho cache / job.
- **Monorepo dùng npm workspaces** (máy không có pnpm): `apps/web`, `packages/shared`, sau này thêm `apps/api`.
- **UI component tự viết kiểu shadcn** trên Radix ở `apps/web/components/ui/` — không dùng shadcn CLI. Thêm component mới theo cùng phong cách (`cn()`, `cva`, token màu).
- **Màu dùng token** trong `app/globals.css` (`--primary`, `--st-*` cho trạng thái phòng, `--chart-*` cho biểu đồ), có bản light và dark. Không hard-code màu.
- **Ánh xạ trạng thái → màu/nhãn tập trung** ở `lib/status.ts` và `components/hotel/status-badges.tsx`; enum + nhãn tiếng Việt ở `packages/shared/src/enums.ts`.
- **Tiền là số nguyên VND**, hiển thị bằng `formatVND()`; ngày lưu trú là chuỗi `YYYY-MM-DD` (ngày khách sạn), hiển thị `DD/MM/YYYY`.
- **Folio:** tổng = phát sinh + phí dịch vụ (`hotel.serviceFeePercent`) + VAT tính trên (phát sinh + phí DV). Giảm giá là charge âm. Logic ở `folioTotals()`.
- **Chống trùng phòng:** FE mô phỏng bằng `findConflict()` trong `lib/selectors.ts`; BE sẽ dùng collection `room_nights` unique `{roomId, date}` trong transaction (xem docs/DATABASE.md).

## Website khách (booking engine)

- Nhóm route `app/(site)/` — slug tiếng Việt để không đụng route quản trị: `/` (trang chủ), `/phong-nghi`, `/phong-nghi/[slug]` (slug từ tên loại phòng), `/dat-phong` (chọn phòng + gói giá), `/dat-phong/thong-tin` (thông tin + thanh toán), `/don-dat-phong/[code]` (xác nhận / thanh toán / hủy), `/tra-cuu`, `/chinh-sach`. Quản trị vẫn ở `/dashboard`…, đăng nhập `/login`.
- Logic thuần ở `lib/booking.ts` (tham số tìm phòng trên URL, gói giá công khai/mã ưu đãi, chính sách hủy, `bookingTotals`); nội dung tĩnh (ảnh, mô tả, FAQ, dịch vụ đặt kèm) ở `lib/site-content.ts`; component ở `components/site/`. Ảnh ở `public/site/` (Unsplash).
- Booking online **không gán phòng** (`roomId: null`, nguồn `website`) — tồn phòng tính bằng `roomTypeAvailability()` (tính cả booking chưa gán phòng). Trả trước → `tentative` đến khi thanh toán; trả tại KS → `confirmed`. Lịch sử/nhật ký ghi người thao tác `WEB_ACTOR`.
- Gói giá có mã trong `PRIVATE_RATE_CODES` (CORP) chỉ hiện khi nhập đúng mã ưu đãi. Thanh toán VietQR / cổng VNPay–MoMo đang **mô phỏng** (nút demo gọi `payOnlineBooking`).
- Xem chi tiết đơn cần xác minh mã + email/SĐT (lưu trong sessionStorage của phiên).

## Kiến trúc dữ liệu mock

- `lib/store.ts` — zustand + persist (localStorage key `hotel-pms-demo`). **Mỗi action tương ứng một endpoint NestJS dự kiến**; khi làm BE, thay dần từng action bằng API call, giữ nguyên chữ ký nếu được.
- `lib/mock/seed.ts` — sinh dữ liệu có seed cố định, ngày tương đối theo hôm nay; store tự sinh lại khi `seededOn` khác hôm nay.
- Khách sạn: **Khách sạn Bạch Đàn, 14/64 Đặng Văn Bình, Phường Cao Lãnh, Tỉnh Đồng Tháp**. SĐT, email, MST, tài khoản ngân hàng, hạng sao, số phòng, giá đang là placeholder ghi `CẦN XÁC NHẬN` trong seed (chưa tìm thấy nguồn công khai). Không đưa đánh giá/điểm số tự soạn lên web khách — `REVIEWS`/`RATING` trong `lib/site-content.ts` chỉ chứa đánh giá thật.
- Đổi cấu trúc/thông tin seed thì tăng `version` của persist trong `lib/store.ts` để trình duyệt sinh lại dữ liệu.
- `lib/selectors.ts` — hàm thuần: trạng thái hiển thị phòng, giá theo đêm (gói giá + quy tắc mùa/lễ), folio, công suất.
- `components/layout/app-shell.tsx` chỉ render nội dung sau khi mount (tránh lệch SSR/localStorage) — trang trong `(dashboard)` là client component.
- Trang dùng `useSearchParams` phải bọc trong `<React.Suspense>` (yêu cầu của Next build).
- Selector zustand trả object mới phải bọc `useShallow`, nếu không sẽ re-render vô hạn.
- File `page.tsx` chỉ được export default — component dùng chung đặt trong `components/`.

## Kiểm thử thủ công

Đã kiểm thử bằng Chrome headless (puppeteer-core trỏ tới `/Applications/Google Chrome.app`, cài ở thư mục tạm, không thêm vào dự án): mở cả 24 route, luồng đặt phòng → check-in → dịch vụ → thu tiền → check-out → hóa đơn, kéo-thả lịch, mobile 375px không tràn ngang. Web khách: tìm phòng → đặt (trả tại KS / VietQR / cổng thanh toán) → xác nhận → tự hủy → tra cứu bằng SĐT, booking hiện bên `/reservations`.

## Việc tiếp theo

1. `apps/api` NestJS + MongoDB (replica set), dùng lại types/zod schema từ `@hotel/shared`.
2. Auth JWT + refresh token, RBAC guard theo `rolePermissions`, 2FA.
3. Night Audit (BullMQ), khai báo lưu trú, hóa đơn điện tử, Channel Manager, cổng thanh toán (VNPay/MoMo).
