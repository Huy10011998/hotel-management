import {
  BarChart3,
  BedDouble,
  BrushCleaning,
  CalendarRange,
  ClipboardList,
  ConciergeBell,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  Tags,
  UtensilsCrossed,
  Users,
  Wrench,
  Receipt,
  Layers,
} from "lucide-react";
import type { Permission } from "@hotel/shared";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm?: Permission;
  shortcut?: string;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Vận hành",
    items: [
      { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, perm: "dashboard.view" },
      { href: "/room-rack", label: "Sơ đồ phòng", icon: LayoutGrid, shortcut: "Alt+R" },
      { href: "/calendar", label: "Lịch đặt phòng", icon: CalendarRange, shortcut: "Alt+L" },
      { href: "/reservations", label: "Đặt phòng", icon: ClipboardList, perm: "reservation.manage" },
      { href: "/front-desk/check-in", label: "Check-in", icon: LogIn, perm: "frontdesk.checkin" },
      { href: "/front-desk/check-out", label: "Check-out", icon: LogOut, perm: "frontdesk.checkin" },
      { href: "/housekeeping", label: "Buồng phòng", icon: BrushCleaning, perm: "housekeeping.manage" },
      { href: "/maintenance", label: "Bảo trì", icon: Wrench, perm: "maintenance.manage" },
    ],
  },
  {
    label: "Khách hàng",
    items: [{ href: "/guests", label: "Khách hàng", icon: Users, perm: "guest.manage" }],
  },
  {
    label: "Tài chính",
    items: [
      { href: "/billing/folios", label: "Folio", icon: Receipt, perm: "billing.manage" },
      { href: "/billing/invoices", label: "Hóa đơn", icon: FileText, perm: "billing.manage" },
      { href: "/billing/payments", label: "Thanh toán", icon: CreditCard, perm: "billing.manage" },
      { href: "/reports", label: "Báo cáo", icon: BarChart3, perm: "report.view" },
    ],
  },
  {
    label: "Quản trị",
    items: [
      { href: "/rooms", label: "Phòng", icon: BedDouble, perm: "room.manage" },
      { href: "/room-types", label: "Loại phòng", icon: Layers, perm: "room.manage" },
      { href: "/rates", label: "Giá phòng", icon: Tags, perm: "rate.manage" },
      { href: "/services", label: "Dịch vụ", icon: UtensilsCrossed, perm: "room.manage" },
      { href: "/staff", label: "Nhân viên & quyền", icon: ShieldCheck, perm: "staff.manage" },
      { href: "/settings", label: "Cài đặt", icon: Settings, perm: "settings.manage" },
    ],
  },
];

export const NEW_BOOKING_ICON = ConciergeBell;
