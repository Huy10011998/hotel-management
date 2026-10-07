/**
 * Kiểu dữ liệu khớp với các collection MongoDB (xem docs/PLAN.md).
 * - Tiền: số nguyên VND.
 * - Ngày lưu trú: chuỗi "YYYY-MM-DD" (ngày khách sạn, không có giờ).
 * - Thời điểm: ISO string.
 */
import type {
  BookingSource,
  ChargeCategory,
  HkStatus,
  IdType,
  MealPlan,
  PaymentMethod,
  Permission,
  ReservationStatus,
  StaffRole,
  TicketPriority,
  TicketStatus,
} from "./enums";

export type ID = string;
export type DateOnly = string; // YYYY-MM-DD
export type ISODateTime = string;

export interface Hotel {
  name: string;
  legalName: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  stars: number;
  checkInTime: string; // "14:00"
  checkOutTime: string; // "12:00"
  currency: "VND";
  vatPercent: number;
  serviceFeePercent: number;
  bank: { bin: string; bankName: string; accountNo: string; accountName: string };
}

export interface RoomType {
  id: ID;
  code: string;
  name: string;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  areaM2: number;
  baseRate: number;
  extraAdultFee: number;
  amenities: string[];
  description: string;
}

export interface Room {
  id: ID;
  number: string;
  floor: number;
  roomTypeId: ID;
  hkStatus: HkStatus;
  hkAssigneeId?: ID;
  outOfOrder: boolean;
  note?: string;
}

export interface Company {
  id: ID;
  name: string;
  taxCode: string;
  address: string;
  contact: string;
}

export interface Guest {
  id: ID;
  fullName: string;
  gender: "male" | "female" | "other";
  dob?: DateOnly;
  phone: string;
  email?: string;
  idType: IdType;
  idNumber: string;
  nationality: string;
  address?: string;
  companyId?: ID;
  vip: boolean;
  blacklisted: boolean;
  tags: string[];
  notes?: string;
  createdAt: ISODateTime;
}

export interface ReservationEvent {
  at: ISODateTime;
  by: string;
  action: string;
}

export interface Reservation {
  id: ID;
  code: string;
  guestId: ID;
  roomTypeId: ID;
  /** null khi chưa gán phòng. */
  roomId: ID | null;
  checkIn: DateOnly;
  checkOut: DateOnly;
  adults: number;
  children: number;
  source: BookingSource;
  status: ReservationStatus;
  ratePlanId: ID;
  ratePerNight: number;
  deposit: number;
  note?: string;
  createdAt: ISODateTime;
  history: ReservationEvent[];
}

/** Một đêm phòng đã giữ — collection có unique index {roomId, date} để chống đặt trùng. */
export interface RoomNight {
  roomId: ID;
  date: DateOnly;
  reservationId: ID;
}

export interface FolioCharge {
  id: ID;
  date: DateOnly;
  category: ChargeCategory;
  description: string;
  qty: number;
  unitPrice: number;
  /** Âm nếu là giảm giá. */
  amount: number;
  serviceId?: ID;
}

export interface FolioPayment {
  id: ID;
  at: ISODateTime;
  method: PaymentMethod;
  amount: number;
  note?: string;
  by: string;
}

export interface Folio {
  id: ID;
  reservationId: ID;
  charges: FolioCharge[];
  payments: FolioPayment[];
  status: "open" | "closed";
}

export interface Invoice {
  id: ID;
  number: string;
  reservationId: ID;
  issuedAt: ISODateTime;
  buyerName: string;
  buyerTaxCode?: string;
  subtotal: number;
  serviceFee: number;
  vat: number;
  total: number;
}

export interface Service {
  id: ID;
  name: string;
  category: ChargeCategory;
  price: number;
  unit: string;
  active: boolean;
}

export interface RatePlan {
  id: ID;
  code: string;
  name: string;
  mealPlan: MealPlan;
  /** % điều chỉnh so với giá cơ bản của loại phòng. */
  adjustPercent: number;
  refundable: boolean;
  active: boolean;
}

/** Quy tắc giá theo mùa / ngày lễ / cuối tuần. */
export interface RateRule {
  id: ID;
  name: string;
  from?: DateOnly;
  to?: DateOnly;
  /** 0 = CN … 6 = T7. Rỗng = mọi ngày. */
  weekdays: number[];
  adjustPercent: number;
  roomTypeIds: ID[]; // rỗng = mọi loại phòng
  active: boolean;
}

export interface Staff {
  id: ID;
  fullName: string;
  role: StaffRole;
  phone: string;
  email: string;
  active: boolean;
  twoFactor: boolean;
}

export type RolePermissions = Record<StaffRole, Permission[]>;

export interface MaintenanceTicket {
  id: ID;
  code: string;
  roomId: ID;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  blocksRoom: boolean;
  reportedBy: string;
  assigneeId?: ID;
  createdAt: ISODateTime;
  resolvedAt?: ISODateTime;
}

export interface Shift {
  id: ID;
  staffId: ID;
  openedAt: ISODateTime;
  closedAt?: ISODateTime;
  openingCash: number;
  closingCash?: number;
}

export interface AuditLog {
  id: ID;
  at: ISODateTime;
  by: string;
  action: string;
  target: string;
}
