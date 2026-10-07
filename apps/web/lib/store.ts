"use client";

/**
 * Store dữ liệu mẫu (thay cho API trong giai đoạn prototype).
 * Mỗi action tương ứng một endpoint NestJS dự kiến — xem comment "API:".
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  FolioCharge,
  FolioPayment,
  Guest,
  HkStatus,
  Hotel,
  MaintenanceTicket,
  OnlineBookingInput,
  Permission,
  RatePlan,
  RateRule,
  Reservation,
  Room,
  RoomType,
  Service,
  Staff,
  StaffRole,
  TicketStatus,
} from "@hotel/shared";
import { createSeed, type SeedData } from "@/lib/mock/seed";
import { findConflict, folioTotals, roomTypeAvailability, stayQuote, todayStr } from "@/lib/selectors";
import { bookingTotals, cancellationInfo, fitsOccupancy, normalizePhone, webRatePlans, WEB_ACTOR } from "@/lib/booking";
import { dayjs, toDateOnly, uid } from "@/lib/utils";
import { SPECIAL_REQUESTS } from "@/lib/site-content";

const CURRENT_USER = "Trần Quốc Huy";

export interface StoreState extends SeedData {
  seededOn: string;
  currentUser: string;

  // Đặt phòng — API: POST/PATCH /reservations
  createReservation: (input: Omit<Reservation, "id" | "code" | "createdAt" | "history">, depositMethod?: FolioPayment["method"]) => Reservation;
  updateReservation: (id: string, patch: Partial<Reservation>, action?: string, by?: string) => void;
  moveReservation: (id: string, roomId: string, checkIn: string) => void;
  cancelReservation: (id: string, reason: string) => void;
  markNoShow: (id: string) => void;

  // Lễ tân — API: POST /reservations/:id/check-in | check-out
  checkIn: (id: string, roomId: string, guestPatch?: Partial<Guest>) => void;
  checkOut: (id: string, buyer?: { name: string; taxCode?: string }) => string;

  // Folio — API: POST /folios/:id/charges | payments
  addCharge: (reservationId: string, charge: Omit<FolioCharge, "id">) => void;
  removeCharge: (reservationId: string, chargeId: string) => void;
  addPayment: (reservationId: string, payment: Omit<FolioPayment, "id" | "at" | "by">, by?: string) => void;

  // Website đặt phòng của khách — API: POST /public/bookings | /public/payments/callback | /public/bookings/:code/cancel
  createOnlineBooking: (input: OnlineBookingInput) => Reservation;
  payOnlineBooking: (code: string, method: Extract<FolioPayment["method"], "bank_transfer" | "card">) => void;
  cancelOnlineBooking: (code: string) => void;

  upsertGuest: (guest: Guest) => void;

  // Phòng / buồng phòng
  setHkStatus: (roomId: string, status: HkStatus) => void;
  assignHousekeeper: (roomId: string, staffId: string | undefined) => void;
  setOutOfOrder: (roomId: string, outOfOrder: boolean, note?: string) => void;
  upsertRoom: (room: Room) => void;
  upsertRoomType: (rt: RoomType) => void;

  upsertService: (s: Service) => void;
  upsertRatePlan: (rp: RatePlan) => void;
  upsertRateRule: (rr: RateRule) => void;
  removeRateRule: (id: string) => void;

  addTicket: (t: Omit<MaintenanceTicket, "id" | "code" | "createdAt" | "status" | "reportedBy">) => void;
  setTicketStatus: (id: string, status: TicketStatus) => void;

  upsertStaff: (s: Staff) => void;
  togglePermission: (role: StaffRole, perm: Permission) => void;
  updateHotel: (patch: Partial<Hotel>) => void;

  resetDemo: () => void;
}

function freshSeed() {
  return { ...createSeed(), seededOn: todayStr() };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const log = (action: string, target: string, by = CURRENT_USER) =>
        set((s) => ({
          auditLogs: [{ id: uid("al-"), at: new Date().toISOString(), by, action, target }, ...s.auditLogs].slice(0, 300),
        }));
      const event = (action: string, by = CURRENT_USER) => ({ at: new Date().toISOString(), by, action });
      const nextCode = () => `BK${dayjs().format("YY")}${String(get().reservations.length + 1).padStart(5, "0")}`;
      const ensureFolio = (reservationId: string) => {
        if (!get().folios.some((f) => f.reservationId === reservationId)) {
          set((s) => ({ folios: [...s.folios, { id: `fo-${reservationId}`, reservationId, charges: [], payments: [], status: "open" }] }));
        }
      };

      return {
        ...freshSeed(),
        currentUser: CURRENT_USER,

        createReservation: (input, depositMethod = "cash") => {
          const s = get();
          if (input.roomId) {
            const c = findConflict(s.reservations, input.roomId, input.checkIn, input.checkOut);
            if (c) throw new Error(`Phòng đã có đặt phòng ${c.code} trong khoảng ngày này`);
          }
          const r: Reservation = {
            ...input,
            id: uid("rs-"),
            code: nextCode(),
            createdAt: new Date().toISOString(),
            history: [event("Tạo đặt phòng"), ...(input.status === "confirmed" ? [event("Xác nhận đặt phòng")] : [])],
          };
          set((st) => ({ reservations: [...st.reservations, r] }));
          ensureFolio(r.id);
          if (r.deposit > 0) get().addPayment(r.id, { method: depositMethod, amount: r.deposit, note: "Đặt cọc" });
          log("Tạo đặt phòng", r.code);
          return r;
        },

        updateReservation: (id, patch, action = "Cập nhật đặt phòng", by = CURRENT_USER) => {
          const s = get();
          const cur = s.reservations.find((r) => r.id === id);
          if (!cur) return;
          const next = { ...cur, ...patch };
          if (next.roomId && (patch.roomId !== undefined || patch.checkIn || patch.checkOut)) {
            const c = findConflict(s.reservations, next.roomId, next.checkIn, next.checkOut, id);
            if (c) throw new Error(`Trùng với đặt phòng ${c.code}`);
          }
          next.history = [...cur.history, event(action, by)];
          set((st) => ({ reservations: st.reservations.map((r) => (r.id === id ? next : r)) }));
          log(action, cur.code, by);
        },

        moveReservation: (id, roomId, checkIn) => {
          const cur = get().reservations.find((r) => r.id === id);
          if (!cur) return;
          const nights = dayjs(cur.checkOut).diff(dayjs(cur.checkIn), "day");
          const room = get().rooms.find((r) => r.id === roomId);
          const checkOut = toDateOnly(dayjs(checkIn).add(nights, "day"));
          get().updateReservation(
            id,
            { roomId, roomTypeId: room?.roomTypeId ?? cur.roomTypeId, checkIn, checkOut },
            `Đổi sang phòng ${room?.number}, ${dayjs(checkIn).format("DD/MM")} → ${dayjs(checkOut).format("DD/MM")}`,
          );
        },

        cancelReservation: (id, reason) => get().updateReservation(id, { status: "cancelled" }, `Hủy đặt phòng: ${reason}`),
        markNoShow: (id) => get().updateReservation(id, { status: "no_show" }, "Đánh dấu không đến (No-show)"),

        checkIn: (id, roomId, guestPatch) => {
          const s = get();
          const r = s.reservations.find((x) => x.id === id);
          if (!r) return;
          const room = s.rooms.find((x) => x.id === roomId);
          if (!room) throw new Error("Không tìm thấy phòng");
          if (room.outOfOrder) throw new Error(`Phòng ${room.number} đang bảo trì`);
          const occupying = s.reservations.find((x) => x.roomId === roomId && x.status === "checked_in" && x.id !== id);
          if (occupying) throw new Error(`Phòng ${room.number} đang có khách`);
          if (guestPatch) {
            const g = s.guests.find((x) => x.id === r.guestId);
            if (g) get().upsertGuest({ ...g, ...guestPatch });
          }
          get().updateReservation(id, { roomId, roomTypeId: room.roomTypeId, status: "checked_in" }, `Check-in vào phòng ${room.number}`);
          ensureFolio(id);
          // Ghi tiền đêm đầu (thực tế do Night Audit ghi mỗi đêm)
          const rt = s.roomTypes.find((t) => t.id === room.roomTypeId)!;
          get().addCharge(id, { date: todayStr(), category: "room", description: `Tiền phòng ${room.number} — ${rt.name}`, qty: 1, unitPrice: r.ratePerNight, amount: r.ratePerNight });
        },

        checkOut: (id, buyer) => {
          const s = get();
          const r = s.reservations.find((x) => x.id === id);
          if (!r) return "";
          const guest = s.guests.find((g) => g.id === r.guestId);
          const folio = s.folios.find((f) => f.reservationId === id);
          const t = folioTotals(folio, s.hotel);
          if (t.balance > 0) throw new Error("Folio còn số dư chưa thanh toán");
          const number = `HD${dayjs().format("YYMM")}${String(s.invoices.length + 1).padStart(4, "0")}`;
          const invoiceId = uid("inv-");
          set((st) => ({
            invoices: [
              ...st.invoices,
              { id: invoiceId, number, reservationId: id, issuedAt: new Date().toISOString(), buyerName: buyer?.name || guest?.fullName || "", buyerTaxCode: buyer?.taxCode, subtotal: t.subtotal, serviceFee: t.serviceFee, vat: t.vat, total: t.total },
            ],
            folios: st.folios.map((f) => (f.reservationId === id ? { ...f, status: "closed" } : f)),
            rooms: st.rooms.map((rm) => (rm.id === r.roomId ? { ...rm, hkStatus: "dirty" } : rm)),
          }));
          // Trả phòng sớm: rút ngày trả về hôm nay để giải phóng các đêm còn lại
          const today = todayStr();
          const checkOut = today > r.checkIn && today < r.checkOut ? today : r.checkOut;
          get().updateReservation(id, { status: "checked_out", checkOut }, `Check-out, xuất hóa đơn ${number}`);
          return invoiceId;
        },

        addCharge: (reservationId, charge) => {
          ensureFolio(reservationId);
          set((s) => ({
            folios: s.folios.map((f) => (f.reservationId === reservationId ? { ...f, charges: [...f.charges, { ...charge, id: uid("c-") }] } : f)),
          }));
          if (charge.amount < 0) log(`Giảm giá ${Math.abs(charge.amount).toLocaleString("vi-VN")} ₫`, get().reservations.find((r) => r.id === reservationId)?.code ?? "");
        },

        removeCharge: (reservationId, chargeId) => {
          set((s) => ({
            folios: s.folios.map((f) => (f.reservationId === reservationId ? { ...f, charges: f.charges.filter((c) => c.id !== chargeId) } : f)),
          }));
          log("Xóa phát sinh folio", get().reservations.find((r) => r.id === reservationId)?.code ?? "");
        },

        addPayment: (reservationId, payment, by = CURRENT_USER) => {
          ensureFolio(reservationId);
          set((s) => ({
            folios: s.folios.map((f) =>
              f.reservationId === reservationId ? { ...f, payments: [...f.payments, { ...payment, id: uid("p-"), at: new Date().toISOString(), by }] } : f,
            ),
          }));
        },

        createOnlineBooking: (input) => {
          const s = get();
          const rt = s.roomTypes.find((t) => t.id === input.roomTypeId);
          const rp = webRatePlans(s.ratePlans, input.promo?.toUpperCase() ?? "").find((p) => p.id === input.ratePlanId);
          if (!rt || !rp) throw new Error("Hạng phòng hoặc gói giá không còn áp dụng — vui lòng chọn lại");
          if (!fitsOccupancy(rt, input.adults, input.children)) throw new Error(`${rt.name} tối đa ${rt.maxAdults} người lớn, ${rt.maxChildren} trẻ em`);
          if (input.paymentOption === "pay_at_hotel" && !rp.refundable) throw new Error("Gói không hoàn hủy cần thanh toán trước");
          // BE: kiểm tra tồn phòng + giữ chỗ trong cùng transaction
          if (roomTypeAvailability(rt.id, s.rooms, s.reservations, input.checkIn, input.checkOut) < 1)
            throw new Error(`Rất tiếc, ${rt.name} vừa hết phòng trong khoảng ngày bạn chọn`);

          // Gộp hồ sơ khách theo số điện thoại để giữ lịch sử lưu trú (CRM)
          const phone = normalizePhone(input.phone);
          const existing = s.guests.find((g) => normalizePhone(g.phone) === phone);
          const guest: Guest = existing
            ? { ...existing, email: existing.email || input.email }
            : {
                id: uid("g-"),
                fullName: input.fullName.trim(),
                gender: "other",
                phone,
                email: input.email,
                idType: input.nationality.trim() === "Việt Nam" ? "cccd" : "passport",
                idNumber: "", // bổ sung khi check-in
                nationality: input.nationality.trim(),
                vip: false,
                blacklisted: false,
                tags: input.marketing ? ["Nhận tin khuyến mãi"] : [],
                createdAt: new Date().toISOString(),
              };
          get().upsertGuest(guest);

          const quote = stayQuote(rt, rp, input.checkIn, input.checkOut, s.rateRules);
          const prepaid = input.paymentOption !== "pay_at_hotel";
          const reqLabels = input.requests.map((k) => SPECIAL_REQUESTS.find((x) => x.key === k)?.label ?? k);
          const note = [
            existing && existing.fullName !== input.fullName.trim() ? `Người đặt: ${input.fullName.trim()}` : "",
            input.arrivalTime ? `Giờ đến dự kiến: ${input.arrivalTime}` : "",
            reqLabels.length ? `Yêu cầu: ${reqLabels.join(", ")}` : "",
            input.note?.trim() ?? "",
            input.needInvoice ? `Xuất hóa đơn: ${input.companyName} — MST ${input.taxCode} — ${input.companyAddress}` : "",
            prepaid ? "Khách chọn thanh toán trước online" : "Thanh toán tại khách sạn",
          ].filter(Boolean).join(" · ");

          const r: Reservation = {
            id: uid("rs-"),
            code: nextCode(),
            guestId: guest.id,
            roomTypeId: rt.id,
            roomId: null, // lễ tân gán phòng sau
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            adults: input.adults,
            children: input.children,
            source: "website",
            status: prepaid ? "tentative" : "confirmed",
            ratePlanId: rp.id,
            ratePerNight: quote.avg,
            deposit: 0,
            note,
            createdAt: new Date().toISOString(),
            history: [
              event("Khách đặt phòng trên website", WEB_ACTOR),
              event(prepaid ? "Chờ thanh toán online" : "Xác nhận tự động — thanh toán tại khách sạn", WEB_ACTOR),
            ],
          };
          set((st) => ({ reservations: [...st.reservations, r] }));
          ensureFolio(r.id);
          for (const [serviceId, qty] of Object.entries(input.addons)) {
            const sv = s.services.find((x) => x.id === serviceId && x.active);
            if (!sv || qty < 1) continue;
            get().addCharge(r.id, { date: r.checkIn, category: sv.category, description: `${sv.name} (đặt online)`, qty, unitPrice: sv.price, amount: sv.price * qty, serviceId });
          }
          log("Đặt phòng online", r.code, WEB_ACTOR);
          return r;
        },

        payOnlineBooking: (code, method) => {
          const s = get();
          const r = s.reservations.find((x) => x.code === code);
          if (!r) throw new Error("Không tìm thấy đặt phòng");
          if (r.status !== "tentative" && r.status !== "confirmed") throw new Error("Đặt phòng không còn hiệu lực");
          const { due } = bookingTotals(r, s.folios.find((f) => f.reservationId === r.id), s.hotel);
          if (due <= 0) throw new Error("Đặt phòng đã được thanh toán đủ");
          const gateway = method === "card" ? "cổng VNPay/MoMo" : "chuyển khoản VietQR";
          get().addPayment(r.id, { method, amount: due, note: `Thanh toán online qua ${gateway}` }, WEB_ACTOR);
          get().updateReservation(r.id, { status: "confirmed" }, `Đã thanh toán online ${due.toLocaleString("vi-VN")} ₫ — xác nhận đặt phòng`, WEB_ACTOR);
        },

        cancelOnlineBooking: (code) => {
          const s = get();
          const r = s.reservations.find((x) => x.code === code);
          if (!r) throw new Error("Không tìm thấy đặt phòng");
          if (r.status !== "tentative" && r.status !== "confirmed") throw new Error("Chỉ hủy được đặt phòng chưa nhận phòng");
          const rp = s.ratePlans.find((p) => p.id === r.ratePlanId);
          const policy = cancellationInfo(rp, r.checkIn, r.ratePerNight);
          const { paid } = bookingTotals(r, s.folios.find((f) => f.reservationId === r.id), s.hotel);
          // Hoàn tiền do kế toán xử lý qua cổng thanh toán — ở đây chỉ ghi nhận số tiền cần hoàn.
          const refund = policy.free ? paid : policy.fee === null ? 0 : Math.max(0, paid - policy.fee);
          const detail = paid > 0 ? ` — cần hoàn ${refund.toLocaleString("vi-VN")} ₫` : "";
          get().updateReservation(r.id, { status: "cancelled" }, `Khách tự hủy trên website${detail}`, WEB_ACTOR);
        },

        upsertGuest: (guest) =>
          set((s) => ({
            guests: s.guests.some((g) => g.id === guest.id) ? s.guests.map((g) => (g.id === guest.id ? guest : g)) : [guest, ...s.guests],
          })),

        setHkStatus: (roomId, status) =>
          set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, hkStatus: status, hkAssigneeId: status === "inspected" ? undefined : r.hkAssigneeId } : r)) })),
        assignHousekeeper: (roomId, staffId) => set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, hkAssigneeId: staffId } : r)) })),
        setOutOfOrder: (roomId, outOfOrder, note) => {
          set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, outOfOrder, note: note ?? r.note } : r)) }));
          log(outOfOrder ? "Khóa phòng bảo trì" : "Mở khóa phòng", get().rooms.find((r) => r.id === roomId)?.number ?? "");
        },
        upsertRoom: (room) => set((s) => ({ rooms: s.rooms.some((r) => r.id === room.id) ? s.rooms.map((r) => (r.id === room.id ? room : r)) : [...s.rooms, room] })),
        upsertRoomType: (rt) => {
          const prev = get().roomTypes.find((t) => t.id === rt.id);
          set((s) => ({ roomTypes: prev ? s.roomTypes.map((t) => (t.id === rt.id ? rt : t)) : [...s.roomTypes, rt] }));
          if (prev && prev.baseRate !== rt.baseRate) log(`Sửa giá ${rt.name} ${prev.baseRate.toLocaleString("vi-VN")} → ${rt.baseRate.toLocaleString("vi-VN")}`, `Loại phòng ${rt.code}`);
        },

        upsertService: (sv) => set((s) => ({ services: s.services.some((x) => x.id === sv.id) ? s.services.map((x) => (x.id === sv.id ? sv : x)) : [...s.services, sv] })),
        upsertRatePlan: (rp) => set((s) => ({ ratePlans: s.ratePlans.some((x) => x.id === rp.id) ? s.ratePlans.map((x) => (x.id === rp.id ? rp : x)) : [...s.ratePlans, rp] })),
        upsertRateRule: (rr) => set((s) => ({ rateRules: s.rateRules.some((x) => x.id === rr.id) ? s.rateRules.map((x) => (x.id === rr.id ? rr : x)) : [...s.rateRules, rr] })),
        removeRateRule: (id) => set((s) => ({ rateRules: s.rateRules.filter((x) => x.id !== id) })),

        addTicket: (t) => {
          const s = get();
          const code = `MT-${String(44 + s.tickets.length).padStart(4, "0")}`;
          set((st) => ({ tickets: [{ ...t, id: uid("tk-"), code, createdAt: new Date().toISOString(), status: "open", reportedBy: CURRENT_USER }, ...st.tickets] }));
          if (t.blocksRoom) get().setOutOfOrder(t.roomId, true, t.title);
        },
        setTicketStatus: (id, status) => {
          const t = get().tickets.find((x) => x.id === id);
          set((s) => ({ tickets: s.tickets.map((x) => (x.id === id ? { ...x, status, resolvedAt: status === "done" ? new Date().toISOString() : undefined } : x)) }));
          if (t && status === "done" && t.blocksRoom) {
            const otherOpen = get().tickets.some((x) => x.id !== id && x.roomId === t.roomId && x.blocksRoom && x.status !== "done");
            if (!otherOpen) get().setOutOfOrder(t.roomId, false);
          }
        },

        upsertStaff: (st) => set((s) => ({ staff: s.staff.some((x) => x.id === st.id) ? s.staff.map((x) => (x.id === st.id ? st : x)) : [...s.staff, st] })),
        togglePermission: (role, perm) =>
          set((s) => {
            const cur = s.rolePermissions[role];
            return { rolePermissions: { ...s.rolePermissions, [role]: cur.includes(perm) ? cur.filter((p) => p !== perm) : [...cur, perm] } };
          }),
        updateHotel: (patch) => {
          set((s) => ({ hotel: { ...s.hotel, ...patch } }));
          log("Cập nhật cài đặt khách sạn", "Cài đặt");
        },

        resetDemo: () => set(freshSeed()),
      };
    },
    {
      name: "hotel-pms-demo",
      // Tăng version khi đổi cấu trúc / thông tin dữ liệu mẫu để trình duyệt sinh lại seed
      version: 2,
      migrate: () => ({}) as StoreState,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { currentUser, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
      // Dữ liệu mẫu tính theo ngày tương đối — sang ngày mới thì sinh lại cho khớp.
      merge: (persisted, current) => {
        const p = persisted as Partial<StoreState> | undefined;
        if (!p || p.seededOn !== todayStr()) return current;
        return { ...current, ...p };
      },
    },
  ),
);

export const useHotel = () => useStore((s) => s.hotel);
