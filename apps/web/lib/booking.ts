/**
 * Logic thuần cho website đặt phòng của khách (booking engine).
 * BE sau này dùng lại: tham số tìm phòng, gói giá công khai, chính sách hủy, tổng tiền.
 */
import type { Folio, Guest, Hotel, RatePlan, RateRule, Reservation, RoomType } from "@hotel/shared";
import { nightlyRate, taxBreakdown, todayStr } from "@/lib/selectors";
import { dayjs, nightsBetween, normalizeVN, toDateOnly } from "@/lib/utils";

/** Người thao tác ghi vào lịch sử booking / nhật ký khi khách tự đặt. */
export const WEB_ACTOR = "Website (khách tự đặt)";
export const MAX_NIGHTS = 30;
export const BOOKING_WINDOW_DAYS = 365;
export const MAX_ADULTS = 8;
export const MAX_CHILDREN = 6;
/** Gói giá có điều kiện hoàn hủy: miễn phí hủy đến hết ngày (nhận phòng − N ngày). */
export const FREE_CANCEL_DAYS = 2;
/** Gói giá không bán công khai — chỉ hiện khi khách nhập đúng mã (mã gói giá). */
const PRIVATE_RATE_CODES = ["CORP"];

export interface StayParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  promo: string;
}

export function defaultStay(): StayParams {
  const ci = dayjs().add(1, "day");
  return { checkIn: toDateOnly(ci), checkOut: toDateOnly(ci.add(2, "day")), adults: 2, children: 0, promo: "" };
}

function clampInt(v: string | null, min: number, max: number, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Đọc tham số tìm phòng từ URL; trả về lỗi nếu ngày không hợp lệ (vẫn kèm giá trị đã sửa). */
export function parseStay(params: URLSearchParams): StayParams & { error?: string } {
  const def = defaultStay();
  const today = todayStr();
  const lastDay = toDateOnly(dayjs().add(BOOKING_WINDOW_DAYS, "day"));
  const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayjs(s).isValid();
  let checkIn = params.get("checkIn");
  let checkOut = params.get("checkOut");
  let error: string | undefined;
  if (!isDate(checkIn) || !isDate(checkOut)) {
    if (checkIn || checkOut) error = "Ngày lưu trú không hợp lệ — đã chọn lại ngày gợi ý.";
    checkIn = def.checkIn;
    checkOut = def.checkOut;
  } else if (checkIn < today) {
    error = "Ngày nhận phòng đã qua — vui lòng chọn lại.";
    checkIn = today;
    checkOut = toDateOnly(dayjs(today).add(1, "day"));
  } else if (checkOut <= checkIn) {
    error = "Ngày trả phòng phải sau ngày nhận phòng.";
    checkOut = toDateOnly(dayjs(checkIn).add(1, "day"));
  } else if (nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
    error = `Đặt trực tuyến tối đa ${MAX_NIGHTS} đêm — lưu trú dài ngày vui lòng liên hệ khách sạn.`;
    checkOut = toDateOnly(dayjs(checkIn).add(MAX_NIGHTS, "day"));
  } else if (checkIn > lastDay) {
    error = `Chỉ nhận đặt phòng trước tối đa ${BOOKING_WINDOW_DAYS} ngày.`;
  }
  return {
    checkIn,
    checkOut,
    adults: clampInt(params.get("adults"), 1, MAX_ADULTS, def.adults),
    children: clampInt(params.get("children"), 0, MAX_CHILDREN, def.children),
    promo: (params.get("promo") ?? "").trim().toUpperCase(),
    error,
  };
}

export function stayQuery(stay: StayParams, extra: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams({ checkIn: stay.checkIn, checkOut: stay.checkOut, adults: String(stay.adults), children: String(stay.children) });
  if (stay.promo) q.set("promo", stay.promo);
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  return q.toString();
}

export function fitsOccupancy(rt: RoomType, adults: number, children: number) {
  return adults <= rt.maxAdults && children <= rt.maxChildren;
}

export function isPublicRatePlan(rp: RatePlan) {
  return rp.active && !PRIVATE_RATE_CODES.includes(rp.code);
}

/** Gói giá bán trên website: gói công khai + gói riêng khớp mã ưu đãi. */
export function webRatePlans(ratePlans: RatePlan[], promo: string) {
  return ratePlans.filter((rp) => isPublicRatePlan(rp) || (rp.active && !!promo && rp.code.toUpperCase() === promo));
}

export function promoMatches(ratePlans: RatePlan[], promo: string) {
  return !!promo && ratePlans.some((rp) => rp.active && !isPublicRatePlan(rp) && rp.code.toUpperCase() === promo);
}

/** Giá "từ … /đêm" để quảng bá: thấp nhất trong `days` đêm tới trên các gói công khai (chưa gồm thuế phí). */
export function fromPrice(rt: RoomType, ratePlans: RatePlan[], rules: RateRule[], days = 30) {
  const plans = webRatePlans(ratePlans, "");
  let min = Infinity;
  for (let i = 0; i < days; i++) {
    const date = toDateOnly(dayjs().add(i, "day"));
    for (const rp of plans) min = Math.min(min, nightlyRate(rt, rp, date, rules));
  }
  return Number.isFinite(min) ? min : rt.baseRate;
}

/** Ngày cuối được hủy miễn phí (YYYY-MM-DD), null nếu gói không hoàn hủy. */
export function freeCancelUntil(rp: RatePlan | undefined, checkIn: string) {
  if (!rp?.refundable) return null;
  return toDateOnly(dayjs(checkIn).subtract(FREE_CANCEL_DAYS, "day"));
}

/** Chính sách hủy tại thời điểm `today`: còn được hủy miễn phí không, phí nếu hủy. */
export function cancellationInfo(rp: RatePlan | undefined, checkIn: string, firstNight: number, today = todayStr()) {
  const until = freeCancelUntil(rp, checkIn);
  if (!until) return { free: false, until: null, fee: null as number | null, text: "Không hoàn tiền khi hủy, thay đổi hoặc không đến." };
  if (today <= until) return { free: true, until, fee: 0, text: `Miễn phí hủy đến hết ngày ${dayjs(until).format("DD/MM/YYYY")}.` };
  return { free: false, until, fee: firstNight, text: "Đã quá hạn hủy miễn phí — phí hủy bằng tiền phòng đêm đầu tiên." };
}

/** Tổng tiền dự kiến của một booking online: tiền phòng + dịch vụ đặt kèm, cộng phí DV và VAT. */
export function bookingTotals(r: Reservation, folio: Folio | undefined, hotel: Hotel) {
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const room = r.ratePerNight * nights;
  // Tiền phòng chỉ được ghi vào folio khi Night Audit chạy — chỉ cộng các phát sinh khác.
  const extras = folio?.charges.filter((c) => c.category !== "room").reduce((s, c) => s + c.amount, 0) ?? 0;
  const t = taxBreakdown(room + extras, hotel);
  const paid = folio?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  return { ...t, nights, room, extras, paid, due: Math.max(0, t.total - paid) };
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+84") ? `0${digits.slice(3)}` : digits;
}

export function slugify(s: string) {
  return normalizeVN(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tra cứu đơn: khớp mã đặt phòng + email hoặc số điện thoại của khách — API: POST /public/bookings/lookup. */
export function findBookingFor(reservations: Reservation[], guests: Guest[], code: string, contact: string) {
  const r = reservations.find((x) => x.code === code.trim().toUpperCase());
  const g = r && guests.find((x) => x.id === r.guestId);
  if (!r || !g) return null;
  const c = contact.trim().toLowerCase();
  const ok = (!!g.email && g.email.toLowerCase() === c) || (normalizePhone(c).length >= 9 && normalizePhone(c) === normalizePhone(g.phone));
  return ok ? r : null;
}

/* Xác minh người xem đơn: chỉ người vừa đặt hoặc đã tra cứu đúng email/SĐT mới xem được chi tiết. */
const VERIFIED_KEY = "hotel-web-verified";

function readVerified(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(VERIFIED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function markVerified(code: string) {
  try {
    sessionStorage.setItem(VERIFIED_KEY, JSON.stringify([...new Set([...readVerified(), code.toUpperCase()])]));
  } catch {}
}

export function isVerified(code: string) {
  return readVerified().includes(code.toUpperCase());
}

/** File lịch .ics để khách thêm kỳ nghỉ vào Google Calendar / Outlook / Lịch iPhone. */
export function buildICS({ code, hotel, roomName, checkIn, checkOut }: { code: string; hotel: Hotel; roomName: string; checkIn: string; checkOut: string }) {
  const stamp = (d: string, time: string) => `${d.replaceAll("-", "")}T${time.replace(":", "")}00`;
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hotel PMS//Booking//VI",
    "BEGIN:VEVENT",
    `UID:${code}@${hotel.website}`,
    `DTSTAMP:${dayjs().format("YYYYMMDDTHHmmss")}`,
    `DTSTART;TZID=Asia/Ho_Chi_Minh:${stamp(checkIn, hotel.checkInTime)}`,
    `DTEND;TZID=Asia/Ho_Chi_Minh:${stamp(checkOut, hotel.checkOutTime)}`,
    `SUMMARY:${esc(`Lưu trú tại ${hotel.name} (${code})`)}`,
    `LOCATION:${esc(hotel.address)}`,
    `DESCRIPTION:${esc(`Mã đặt phòng ${code} · ${roomName} · Hotline ${hotel.phone}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
