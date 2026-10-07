/**
 * Zod schema cho các form/DTO — FE dùng validate form, BE dùng validate request.
 * Thông báo lỗi tiếng Việt.
 */
import { z } from "zod";
import { BOOKING_SOURCES, ID_TYPES, ONLINE_PAYMENT_OPTIONS, PAYMENT_METHODS, TICKET_PRIORITIES } from "./enums";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");
const phoneVN = z
  .string()
  .trim()
  .regex(/^(\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ");

export const guestSchema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ tên"),
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().optional(),
  phone: phoneVN,
  email: z.union([z.literal(""), z.email("Email không hợp lệ")]).optional(),
  idType: z.enum(ID_TYPES),
  idNumber: z.string().trim().min(6, "Nhập số giấy tờ"),
  nationality: z.string().trim().min(2, "Nhập quốc tịch"),
  address: z.string().optional(),
  vip: z.boolean(),
  notes: z.string().optional(),
});
export type GuestInput = z.infer<typeof guestSchema>;

export const reservationSchema = z
  .object({
    checkIn: dateOnly,
    checkOut: dateOnly,
    adults: z.number().int().min(1, "Ít nhất 1 người lớn"),
    children: z.number().int().min(0),
    roomTypeId: z.string().min(1, "Chọn loại phòng"),
    roomId: z.string().nullable(),
    ratePlanId: z.string().min(1, "Chọn gói giá"),
    source: z.enum(BOOKING_SOURCES),
    guestId: z.string().min(1, "Chọn hoặc tạo khách"),
    deposit: z.number().int().min(0, "Tiền cọc không hợp lệ"),
    depositMethod: z.enum(PAYMENT_METHODS),
    confirmed: z.boolean(),
    note: z.string().optional(),
  })
  .refine((v) => v.checkOut > v.checkIn, {
    path: ["checkOut"],
    message: "Ngày trả phòng phải sau ngày nhận phòng",
  });
export type ReservationInput = z.infer<typeof reservationSchema>;

export const paymentSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: z.number().int().positive("Số tiền phải lớn hơn 0"),
  note: z.string().optional(),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const ticketSchema = z.object({
  roomId: z.string().min(1, "Chọn phòng"),
  title: z.string().trim().min(3, "Nhập tiêu đề"),
  description: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES),
  blocksRoom: z.boolean(),
});
export type TicketInput = z.infer<typeof ticketSchema>;

/** Khách tự đặt phòng trên website — API: POST /public/bookings. */
export const onlineBookingSchema = z
  .object({
    checkIn: dateOnly,
    checkOut: dateOnly,
    adults: z.number().int().min(1, "Ít nhất 1 người lớn"),
    children: z.number().int().min(0),
    roomTypeId: z.string().min(1, "Chọn hạng phòng"),
    ratePlanId: z.string().min(1, "Chọn gói giá"),
    /** Mã ưu đãi — mở khóa gói giá riêng (vd. giá công ty). */
    promo: z.string().optional(),
    fullName: z.string().trim().min(2, "Nhập họ tên người đặt"),
    email: z.email("Email không hợp lệ"),
    // Cho phép số quốc tế (khách nước ngoài) — BE chuẩn hóa bỏ khoảng trắng, dấu chấm.
    phone: z.string().trim().regex(/^\+?[\d\s.-]{9,20}$/, "Số điện thoại không hợp lệ"),
    nationality: z.string().trim().min(2, "Nhập quốc tịch"),
    arrivalTime: z.string().optional(),
    requests: z.array(z.string()),
    note: z.string().max(500, "Tối đa 500 ký tự").optional(),
    /** serviceId → số lượng dịch vụ thêm. */
    addons: z.record(z.string(), z.number().int().min(0).max(10)),
    needInvoice: z.boolean(),
    companyName: z.string().optional(),
    taxCode: z.string().optional(),
    companyAddress: z.string().optional(),
    paymentOption: z.enum(ONLINE_PAYMENT_OPTIONS),
    agreeTerms: z.boolean().refine((v) => v, "Vui lòng đồng ý với điều khoản và chính sách bảo mật"),
    marketing: z.boolean(),
  })
  .refine((v) => v.checkOut > v.checkIn, {
    path: ["checkOut"],
    message: "Ngày trả phòng phải sau ngày nhận phòng",
  })
  .superRefine((v, ctx) => {
    if (!v.needInvoice) return;
    if (!v.companyName || v.companyName.trim().length < 2) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Nhập tên công ty" });
    if (!/^\d{10}(-\d{3})?$/.test(v.taxCode?.trim() ?? "")) ctx.addIssue({ code: "custom", path: ["taxCode"], message: "Mã số thuế gồm 10 hoặc 13 số" });
    if (!v.companyAddress || v.companyAddress.trim().length < 5) ctx.addIssue({ code: "custom", path: ["companyAddress"], message: "Nhập địa chỉ công ty" });
  });
export type OnlineBookingInput = z.infer<typeof onlineBookingSchema>;
