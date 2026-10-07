/**
 * Hàm tính toán thuần (không side effect) — sau này BE NestJS dùng logic tương tự.
 */
import type {
  Folio,
  Hotel,
  RatePlan,
  RateRule,
  Reservation,
  Room,
  RoomDisplayStatus,
  RoomType,
} from "@hotel/shared";
import { dayjs, toDateOnly } from "@/lib/utils";

export const ACTIVE_STATUSES: Reservation["status"][] = ["tentative", "confirmed", "checked_in"];

export function todayStr() {
  return toDateOnly(dayjs());
}

/** Booking đang ở trong phòng (đã check-in, chưa check-out). */
export function inHouseReservation(room: Room, reservations: Reservation[]) {
  return reservations.find((r) => r.roomId === room.id && r.status === "checked_in");
}

/** Booking đã gán phòng, đến hôm nay, chưa check-in. */
export function arrivalReservation(room: Room, reservations: Reservation[], today = todayStr()) {
  return reservations.find(
    (r) => r.roomId === room.id && r.checkIn === today && (r.status === "confirmed" || r.status === "tentative"),
  );
}

export function roomDisplayStatus(room: Room, reservations: Reservation[], today = todayStr()): RoomDisplayStatus {
  if (room.outOfOrder) return "maintenance";
  if (inHouseReservation(room, reservations)) return "occupied";
  if (arrivalReservation(room, reservations, today)) return "reserved";
  if (room.hkStatus === "cleaning") return "cleaning";
  if (room.hkStatus === "dirty") return "vacant_dirty";
  return "vacant_clean";
}

/** Hai khoảng [aIn, aOut) và [bIn, bOut) có giao nhau không (ngày trả phòng không tính đêm). */
export function overlaps(aIn: string, aOut: string, bIn: string, bOut: string) {
  return aIn < bOut && bIn < aOut;
}

/**
 * Tìm booking xung đột với phòng trong khoảng ngày — mô phỏng unique index {roomId, date}
 * trên collection `room_nights` ở MongoDB.
 */
export function findConflict(
  reservations: Reservation[],
  roomId: string,
  checkIn: string,
  checkOut: string,
  ignoreId?: string,
) {
  return reservations.find(
    (r) =>
      r.id !== ignoreId &&
      r.roomId === roomId &&
      ACTIVE_STATUSES.includes(r.status) &&
      overlaps(r.checkIn, r.checkOut, checkIn, checkOut),
  );
}

export function availableRooms(
  rooms: Room[],
  reservations: Reservation[],
  checkIn: string,
  checkOut: string,
  roomTypeId?: string,
  ignoreId?: string,
) {
  return rooms.filter(
    (room) =>
      !room.outOfOrder &&
      (!roomTypeId || room.roomTypeId === roomTypeId) &&
      !findConflict(reservations, room.id, checkIn, checkOut, ignoreId),
  );
}

/**
 * Số phòng còn bán được của một loại phòng trong khoảng ngày (lấy đêm ít phòng trống nhất).
 * Khác `availableRooms`: tính cả booking chưa gán phòng (roomId null) để không bán vượt —
 * dùng cho website đặt phòng, nơi booking chỉ giữ loại phòng, lễ tân gán phòng sau.
 */
export function roomTypeAvailability(
  roomTypeId: string,
  rooms: Room[],
  reservations: Reservation[],
  checkIn: string,
  checkOut: string,
) {
  const sellable = new Set(rooms.filter((r) => r.roomTypeId === roomTypeId && !r.outOfOrder).map((r) => r.id));
  const holding = reservations.filter(
    (r) =>
      ACTIVE_STATUSES.includes(r.status) &&
      overlaps(r.checkIn, r.checkOut, checkIn, checkOut) &&
      (r.roomId ? sellable.has(r.roomId) : r.roomTypeId === roomTypeId),
  );
  let min = sellable.size;
  for (let d = dayjs(checkIn); d.isBefore(dayjs(checkOut)); d = d.add(1, "day")) {
    const date = toDateOnly(d);
    const used = holding.filter((r) => r.checkIn <= date && r.checkOut > date).length;
    min = Math.min(min, sellable.size - used);
  }
  return Math.max(0, min);
}

/** Giá 1 đêm theo loại phòng + gói giá + quy tắc mùa/cuối tuần. */
export function nightlyRate(roomType: RoomType, ratePlan: RatePlan | undefined, date: string, rules: RateRule[]) {
  const d = dayjs(date);
  let pct = ratePlan?.adjustPercent ?? 0;
  for (const rule of rules) {
    if (!rule.active) continue;
    if (rule.roomTypeIds.length && !rule.roomTypeIds.includes(roomType.id)) continue;
    if (rule.from && date < rule.from) continue;
    if (rule.to && date > rule.to) continue;
    if (rule.weekdays.length && !rule.weekdays.includes(d.day())) continue;
    pct += rule.adjustPercent;
  }
  return Math.round((roomType.baseRate * (1 + pct / 100)) / 10_000) * 10_000;
}

export function stayQuote(
  roomType: RoomType,
  ratePlan: RatePlan | undefined,
  checkIn: string,
  checkOut: string,
  rules: RateRule[],
) {
  const nights: { date: string; rate: number }[] = [];
  for (let d = dayjs(checkIn); d.isBefore(dayjs(checkOut)); d = d.add(1, "day")) {
    const date = toDateOnly(d);
    nights.push({ date, rate: nightlyRate(roomType, ratePlan, date, rules) });
  }
  const total = nights.reduce((s, n) => s + n.rate, 0);
  return { nights, total, avg: nights.length ? Math.round(total / nights.length) : 0 };
}

export interface FolioTotals {
  subtotal: number;
  serviceFee: number;
  vat: number;
  total: number;
  paid: number;
  balance: number;
}

/** Phí dịch vụ + VAT tính trên (phát sinh + phí DV) — công thức chung cho folio và báo giá online. */
export function taxBreakdown(subtotal: number, hotel: Hotel) {
  const serviceFee = Math.round(subtotal * (hotel.serviceFeePercent / 100));
  const vat = Math.round((subtotal + serviceFee) * (hotel.vatPercent / 100));
  return { subtotal, serviceFee, vat, total: subtotal + serviceFee + vat };
}

export function folioTotals(folio: Folio | undefined, hotel: Hotel): FolioTotals {
  const { subtotal, serviceFee, vat, total } = taxBreakdown(folio?.charges.reduce((s, c) => s + c.amount, 0) ?? 0, hotel);
  const paid = folio?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  return { subtotal, serviceFee, vat, total, paid, balance: total - paid };
}

/** Tiền phòng thực thu theo ngày (từ charge category room) — dùng cho báo cáo doanh thu. */
export function revenueByDate(folios: Folio[]) {
  const map = new Map<string, { room: number; other: number }>();
  for (const f of folios) {
    for (const c of f.charges) {
      const cur = map.get(c.date) ?? { room: 0, other: 0 };
      if (c.category === "room") cur.room += c.amount;
      else cur.other += c.amount;
      map.set(c.date, cur);
    }
  }
  return map;
}

/** Số phòng có khách trong đêm `date` (tính cả booking tương lai đã xác nhận để ra công suất dự báo). */
export function occupiedOnNight(reservations: Reservation[], date: string) {
  return reservations.filter(
    (r) =>
      r.roomId &&
      ["confirmed", "checked_in", "checked_out", "tentative"].includes(r.status) &&
      r.checkIn <= date &&
      r.checkOut > date,
  ).length;
}
