/** Ánh xạ trạng thái → màu, dùng thống nhất toàn hệ thống. */
import type {
  BookingSource,
  HkStatus,
  ReservationStatus,
  RoomDisplayStatus,
  TicketPriority,
  TicketStatus,
} from "@hotel/shared";
import type { BadgeVariant } from "@/components/ui/badge";

/** Lớp nền/viền/chữ cho mỗi trạng thái phòng (Tailwind tokens trong globals.css). */
export const ROOM_STATUS_STYLE: Record<RoomDisplayStatus, { dot: string; card: string; text: string }> = {
  vacant_clean: { dot: "bg-st-vacant-clean", card: "border-st-vacant-clean/50 bg-st-vacant-clean/8", text: "text-st-vacant-clean" },
  vacant_dirty: { dot: "bg-st-vacant-dirty", card: "border-st-vacant-dirty/60 bg-st-vacant-dirty/10", text: "text-st-vacant-dirty" },
  occupied: { dot: "bg-st-occupied", card: "border-st-occupied/60 bg-st-occupied/10", text: "text-st-occupied" },
  reserved: { dot: "bg-st-reserved", card: "border-st-reserved/60 bg-st-reserved/10", text: "text-st-reserved" },
  cleaning: { dot: "bg-st-cleaning", card: "border-st-cleaning/60 bg-st-cleaning/10", text: "text-st-cleaning" },
  maintenance: { dot: "bg-st-maintenance", card: "border-st-maintenance/60 bg-st-maintenance/12 [background-image:repeating-linear-gradient(135deg,transparent_0_8px,color-mix(in_oklch,var(--st-maintenance),transparent_88%)_8px_16px)]", text: "text-st-maintenance" },
};

export const RESERVATION_STATUS_VARIANT: Record<ReservationStatus, BadgeVariant> = {
  tentative: "warning",
  confirmed: "info",
  checked_in: "success",
  checked_out: "muted",
  cancelled: "danger",
  no_show: "danger",
};

export const HK_STATUS_VARIANT: Record<HkStatus, BadgeVariant> = {
  dirty: "warning",
  cleaning: "info",
  clean: "success",
  inspected: "default",
};

export const TICKET_PRIORITY_VARIANT: Record<TicketPriority, BadgeVariant> = {
  low: "muted",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export const TICKET_STATUS_VARIANT: Record<TicketStatus, BadgeVariant> = {
  open: "warning",
  in_progress: "info",
  done: "success",
};

/** Màu nguồn đặt — dùng cho thanh booking trên lịch và biểu đồ. */
export const SOURCE_COLOR: Record<BookingSource, string> = {
  booking_com: "var(--chart-1)",
  agoda: "var(--chart-5)",
  website: "var(--chart-2)",
  walk_in: "var(--chart-3)",
  phone: "var(--chart-6)",
  traveloka: "var(--chart-4)",
  expedia: "oklch(0.62 0.13 95)",
  corporate: "oklch(0.5 0.06 260)",
};
