/**
 * Enum + nhãn tiếng Việt dùng chung cho FE (Next.js) và BE (NestJS).
 * Giá trị lưu DB là key tiếng Anh; nhãn chỉ dùng hiển thị.
 */

/** Trạng thái buồng phòng (housekeeping) lưu trên document `rooms`. */
export const HK_STATUSES = ["dirty", "cleaning", "clean", "inspected"] as const;
export type HkStatus = (typeof HK_STATUSES)[number];
export const HK_STATUS_LABEL: Record<HkStatus, string> = {
  dirty: "Bẩn",
  cleaning: "Đang dọn",
  clean: "Sạch",
  inspected: "Đã kiểm tra",
};

/**
 * Trạng thái hiển thị của phòng — suy ra từ hkStatus + outOfOrder + booking,
 * không lưu DB. Dùng thống nhất cho Room Rack, Dashboard, legend.
 */
export const ROOM_DISPLAY_STATUSES = [
  "vacant_clean",
  "vacant_dirty",
  "occupied",
  "reserved",
  "cleaning",
  "maintenance",
] as const;
export type RoomDisplayStatus = (typeof ROOM_DISPLAY_STATUSES)[number];
export const ROOM_DISPLAY_STATUS_LABEL: Record<RoomDisplayStatus, string> = {
  vacant_clean: "Trống sạch",
  vacant_dirty: "Trống bẩn",
  occupied: "Có khách",
  reserved: "Đã đặt (đến hôm nay)",
  cleaning: "Đang dọn",
  maintenance: "Bảo trì",
};

export const RESERVATION_STATUSES = [
  "tentative",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  tentative: "Tạm giữ",
  confirmed: "Đã xác nhận",
  checked_in: "Đang ở",
  checked_out: "Đã trả phòng",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};

export const BOOKING_SOURCES = [
  "walk_in",
  "phone",
  "website",
  "booking_com",
  "agoda",
  "traveloka",
  "expedia",
  "corporate",
] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];
export const BOOKING_SOURCE_LABEL: Record<BookingSource, string> = {
  walk_in: "Khách vãng lai",
  phone: "Điện thoại",
  website: "Website",
  booking_com: "Booking.com",
  agoda: "Agoda",
  traveloka: "Traveloka",
  expedia: "Expedia",
  corporate: "Công ty / Đoàn",
};

export const PAYMENT_METHODS = ["cash", "bank_transfer", "card", "ota_prepaid"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  ota_prepaid: "OTA trả trước",
};

export const CHARGE_CATEGORIES = [
  "room",
  "minibar",
  "laundry",
  "restaurant",
  "transport",
  "spa",
  "surcharge",
  "other",
] as const;
export type ChargeCategory = (typeof CHARGE_CATEGORIES)[number];
export const CHARGE_CATEGORY_LABEL: Record<ChargeCategory, string> = {
  room: "Tiền phòng",
  minibar: "Minibar",
  laundry: "Giặt ủi",
  restaurant: "Nhà hàng",
  transport: "Đưa đón",
  spa: "Spa",
  surcharge: "Phụ thu",
  other: "Khác",
};

export const ID_TYPES = ["cccd", "passport"] as const;
export type IdType = (typeof ID_TYPES)[number];
export const ID_TYPE_LABEL: Record<IdType, string> = {
  cccd: "CCCD",
  passport: "Hộ chiếu",
};

export const STAFF_ROLES = ["admin", "manager", "receptionist", "housekeeper", "accountant"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Quản trị",
  manager: "Quản lý",
  receptionist: "Lễ tân",
  housekeeper: "Buồng phòng",
  accountant: "Kế toán",
};

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

export const TICKET_STATUSES = ["open", "in_progress", "done"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Mới",
  in_progress: "Đang xử lý",
  done: "Hoàn thành",
};

export const MEAL_PLANS = ["room_only", "breakfast", "half_board", "full_board"] as const;
export type MealPlan = (typeof MEAL_PLANS)[number];
export const MEAL_PLAN_LABEL: Record<MealPlan, string> = {
  room_only: "Chỉ phòng",
  breakfast: "Kèm ăn sáng",
  half_board: "Ăn sáng + tối",
  full_board: "Trọn gói 3 bữa",
};

/** Quyền theo chức năng (RBAC). */
export const PERMISSIONS = [
  "dashboard.view",
  "reservation.manage",
  "frontdesk.checkin",
  "guest.manage",
  "room.manage",
  "rate.manage",
  "billing.manage",
  "billing.discount",
  "housekeeping.manage",
  "maintenance.manage",
  "report.view",
  "staff.manage",
  "settings.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export const PERMISSION_LABEL: Record<Permission, string> = {
  "dashboard.view": "Xem tổng quan",
  "reservation.manage": "Quản lý đặt phòng",
  "frontdesk.checkin": "Check-in / Check-out",
  "guest.manage": "Quản lý khách hàng",
  "room.manage": "Quản lý phòng",
  "rate.manage": "Thiết lập giá",
  "billing.manage": "Thu ngân / Hóa đơn",
  "billing.discount": "Giảm giá / Hoàn tiền",
  "housekeeping.manage": "Buồng phòng",
  "maintenance.manage": "Bảo trì",
  "report.view": "Xem báo cáo",
  "staff.manage": "Nhân viên & phân quyền",
  "settings.manage": "Cài đặt hệ thống",
};

/** Hình thức thanh toán khi khách tự đặt trên website (booking engine). */
export const ONLINE_PAYMENT_OPTIONS = ["pay_at_hotel", "vietqr", "gateway"] as const;
export type OnlinePaymentOption = (typeof ONLINE_PAYMENT_OPTIONS)[number];
export const ONLINE_PAYMENT_OPTION_LABEL: Record<OnlinePaymentOption, string> = {
  pay_at_hotel: "Thanh toán tại khách sạn",
  vietqr: "Chuyển khoản VietQR",
  gateway: "Thẻ / Ví điện tử (VNPay, MoMo)",
};
