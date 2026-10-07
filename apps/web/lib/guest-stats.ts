import type { Folio, Hotel, Reservation } from "@hotel/shared";
import { folioTotals } from "@/lib/selectors";
import { nightsBetween } from "@/lib/utils";

export interface GuestStats {
  stays: number;
  nights: number;
  spent: number;
  lastStay?: string;
}

/** Thống kê lưu trú theo khách — BE sẽ dùng aggregation pipeline tương ứng. */
export function guestStatsMap(reservations: Reservation[], folios: Folio[], hotel: Hotel) {
  const folioByRes = new Map(folios.map((f) => [f.reservationId, f]));
  const map = new Map<string, GuestStats>();
  for (const r of reservations) {
    if (r.status !== "checked_out" && r.status !== "checked_in") continue;
    const s = map.get(r.guestId) ?? { stays: 0, nights: 0, spent: 0 };
    s.stays++;
    s.nights += nightsBetween(r.checkIn, r.checkOut);
    s.spent += folioTotals(folioByRes.get(r.id), hotel).total;
    if (!s.lastStay || r.checkIn > s.lastStay) s.lastStay = r.checkIn;
    map.set(r.guestId, s);
  }
  return map;
}
