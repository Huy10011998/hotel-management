"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarPlus,
  CircleCheck,
  CircleX,
  Clock,
  Copy,
  CreditCard,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { BOOKING_SOURCE_LABEL, RESERVATION_STATUS_LABEL, type Reservation } from "@hotel/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/hotel/empty-state";
import { VietQR } from "@/components/hotel/vietqr";
import { BookingLookupForm } from "@/components/site/booking-lookup";
import { SiteContainer } from "@/components/site/site-shell";
import { BookingSteps, StaySummary } from "@/components/site/site-ui";
import { useStore } from "@/lib/store";
import { bookingTotals, buildICS, cancellationInfo, isVerified } from "@/lib/booking";
import { cn, dayjs, formatDateTime, formatVND } from "@/lib/utils";

export default function BookingPage() {
  return (
    <React.Suspense>
      <Booking />
    </React.Suspense>
  );
}

function Booking() {
  const { code: raw } = useParams<{ code: string }>();
  const code = decodeURIComponent(raw).toUpperCase();
  const [verified, setVerified] = React.useState(() => isVerified(code));
  const reservation = useStore((s) => s.reservations.find((r) => r.code === code));

  if (!verified) {
    return (
      <SiteContainer className="flex justify-center py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Xác minh đặt phòng</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Để bảo vệ thông tin cá nhân, vui lòng nhập email hoặc số điện thoại đã dùng khi đặt phòng.</p>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <BookingLookupForm initialCode={code} onFound={(c) => c === code && setVerified(true)} />
          </div>
        </div>
      </SiteContainer>
    );
  }
  if (!reservation) {
    return (
      <SiteContainer className="py-16">
        <EmptyState title="Không tìm thấy đặt phòng" description={`Mã ${code} không tồn tại.`} action={<Link href="/tra-cuu" className={buttonVariants()}>Tra cứu lại</Link>} />
      </SiteContainer>
    );
  }
  return <BookingDetail r={reservation} />;
}

function StatusHero({ r, due, email }: { r: Reservation; due: number; email?: string }) {
  const waiting = r.status === "tentative" && due > 0;
  const tone =
    r.status === "cancelled" || r.status === "no_show"
      ? { icon: CircleX, cls: "border-danger/30 bg-danger/8 text-danger", title: r.status === "cancelled" ? "Đặt phòng đã được hủy" : "Đặt phòng đã quá hạn (không đến)" }
      : waiting
        ? { icon: Clock, cls: "border-warning/40 bg-warning/10", title: "Đang chờ thanh toán" }
        : { icon: CircleCheck, cls: "border-success/30 bg-success/8 text-success", title: r.status === "checked_in" ? "Chúc bạn có kỳ nghỉ vui vẻ!" : r.status === "checked_out" ? "Cảm ơn bạn đã lưu trú" : "Đặt phòng đã được xác nhận" };
  const Icon = tone.icon;
  const copy = () => {
    navigator.clipboard?.writeText(r.code).then(() => toast.success("Đã sao chép mã đặt phòng"), () => {});
  };
  return (
    <div className={cn("rounded-xl border p-5", tone.cls)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 size-6 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{tone.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {waiting
                ? "Phòng của bạn đã được giữ. Hoàn tất thanh toán bên dưới để khách sạn xác nhận đặt phòng."
                : r.status === "confirmed" && email
                  ? `Thông tin đặt phòng đã được gửi tới ${email}.`
                  : `Trạng thái: ${RESERVATION_STATUS_LABEL[r.status]}`}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2 text-foreground">
          <p className="text-[11px] text-muted-foreground">Mã đặt phòng</p>
          <p className="flex items-center gap-2 font-mono text-lg font-bold tracking-wider">
            {r.code}
            <button type="button" onClick={copy} className="no-print text-muted-foreground hover:text-foreground" aria-label="Sao chép mã đặt phòng">
              <Copy className="size-4" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentPanel({ r, due, initialTab }: { r: Reservation; due: number; initialTab: "vietqr" | "gateway" }) {
  const pay = useStore((s) => s.payOnlineBooking);
  const [gateway, setGateway] = React.useState("vnpay");
  const [processing, setProcessing] = React.useState(false);

  const complete = (method: "bank_transfer" | "card") => {
    setProcessing(true);
    // Mô phỏng chờ ngân hàng / cổng thanh toán gọi callback về hệ thống
    setTimeout(() => {
      try {
        pay(r.code, method);
        toast.success("Thanh toán thành công — đặt phòng đã được xác nhận");
      } catch (err) {
        toast.error((err as Error).message);
      }
      setProcessing(false);
    }, 1200);
  };

  return (
    <section className="no-print rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Thanh toán</h2>
        <p className="text-sm">
          Số tiền: <span className="tabular text-lg font-bold text-primary">{formatVND(due)}</span>
        </p>
      </div>
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="vietqr"><QrCode /> VietQR</TabsTrigger>
          <TabsTrigger value="gateway"><CreditCard /> Thẻ / Ví</TabsTrigger>
        </TabsList>
        <TabsContent value="vietqr">
          <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
            <div className="mx-auto">
              <VietQR amount={due} description={r.code} />
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Mở ứng dụng ngân hàng hoặc ví hỗ trợ VietQR, chọn <b className="text-foreground">Quét mã QR</b>.</li>
              <li>Kiểm tra số tiền và nội dung chuyển khoản <b className="font-mono text-foreground">{r.code}</b> — vui lòng không sửa nội dung.</li>
              <li>Xác nhận chuyển khoản. Hệ thống tự xác nhận đặt phòng khi nhận được tiền (thường dưới 1 phút).</li>
              <li className="list-none pt-2">
                <Button onClick={() => complete("bank_transfer")} disabled={processing} variant="outline">
                  {processing ? <Loader2 className="animate-spin" /> : <CircleCheck />} Tôi đã chuyển khoản
                </Button>
                <p className="mt-1 text-xs">Bản demo: nút này mô phỏng ngân hàng báo có.</p>
              </li>
            </ol>
          </div>
        </TabsContent>
        <TabsContent value="gateway">
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Cổng thanh toán">
            {[
              ["vnpay", "VNPay", "ATM nội địa, QR ngân hàng"],
              ["card", "Thẻ quốc tế", "Visa, Mastercard, JCB"],
              ["momo", "Ví MoMo", "Thanh toán qua ứng dụng MoMo"],
            ].map(([key, label, hint]) => (
              <label key={key} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm", gateway === key && "border-primary bg-primary/5 ring-1 ring-primary")}>
                <input type="radio" name="gateway" className="mt-1 accent-[var(--primary)]" checked={gateway === key} onChange={() => setGateway(key)} />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          <Button size="lg" className="mt-4 w-full sm:w-auto" onClick={() => complete("card")} disabled={processing}>
            {processing ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Thanh toán {formatVND(due)}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Bản demo: mô phỏng chuyển tới cổng thanh toán và nhận kết quả thành công. Khách sạn không lưu thông tin thẻ.</p>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function BookingDetail({ r }: { r: Reservation }) {
  const params = useSearchParams();
  const { hotel, roomTypes, ratePlans, guests, folios, cancelOnlineBooking } = useStore();
  const rt = roomTypes.find((t) => t.id === r.roomTypeId)!;
  const rp = ratePlans.find((p) => p.id === r.ratePlanId);
  const guest = guests.find((g) => g.id === r.guestId);
  const folio = folios.find((f) => f.reservationId === r.id);
  const t = bookingTotals(r, folio, hotel);
  const policy = cancellationInfo(rp, r.checkIn, r.ratePerNight);
  const active = r.status === "tentative" || r.status === "confirmed";
  const canPay = active && t.due > 0 && r.source === "website";
  const [showPay, setShowPay] = React.useState(r.status === "tentative" || !!params.get("pay"));
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const refund = policy.free ? t.paid : policy.fee === null ? 0 : Math.max(0, t.paid - policy.fee);

  const lines = [
    { label: `Tiền phòng · ${t.nights} đêm`, amount: t.room },
    ...(folio?.charges.filter((c) => c.category !== "room").map((c) => ({ label: `${c.description.replace(" (đặt online)", "")} × ${c.qty}`, amount: c.amount })) ?? []),
  ];

  const downloadICS = () => {
    const blob = new Blob([buildICS({ code: r.code, hotel, roomName: rt.name, checkIn: r.checkIn, checkOut: r.checkOut })], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.code}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cancel = () => {
    try {
      cancelOnlineBooking(r.code);
      toast.success("Đã hủy đặt phòng");
      setCancelOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <SiteContainer className="py-6">
      <div className="no-print mb-5">
        <BookingSteps current={3} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <StatusHero r={r} due={t.due} email={guest?.email} />

          {canPay && (showPay ? (
            <PaymentPanel r={r} due={t.due} initialTab={params.get("pay") === "gateway" ? "gateway" : "vietqr"} />
          ) : (
            <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
              <span>Bạn chọn thanh toán tại khách sạn. Muốn trả trước để nhận phòng nhanh hơn?</span>
              <Button variant="outline" size="sm" onClick={() => setShowPay(true)}>Thanh toán trước online</Button>
            </div>
          ))}

          <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 font-semibold">Thông tin đặt phòng</h2>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Khách lưu trú", guest?.fullName],
                ["Liên hệ", [guest?.phone, guest?.email].filter(Boolean).join(" · ")],
                ["Hạng phòng", rt.name],
                ["Gói giá", rp?.name],
                ["Số khách", `${r.adults} người lớn${r.children ? `, ${r.children} trẻ em` : ""}`],
                ["Đặt lúc", `${formatDateTime(r.createdAt)} · ${BOOKING_SOURCE_LABEL[r.source]}`],
              ].map(([k, val]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{val || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="no-print mt-5 flex flex-wrap gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={downloadICS}><CalendarPlus /> Thêm vào lịch</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> In xác nhận</Button>
              <a href={`tel:${hotel.phone.replace(/\s/g, "")}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Phone /> Gọi khách sạn</a>
              {active && r.source === "website" && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive sm:ml-auto" onClick={() => setCancelOpen(true)}>
                  <CircleX /> Hủy đặt phòng
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 font-semibold">Chuẩn bị cho chuyến đi</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-primary" /> <span>Nhận phòng từ {hotel.checkInTime} ngày <b className="capitalize">{dayjs(r.checkIn).format("dddd, DD/MM/YYYY")}</b>; trả phòng trước {hotel.checkOutTime}.</span></li>
              <li className="flex gap-3"><IdCard className="mt-0.5 size-4 shrink-0 text-primary" /> Mang theo CCCD gắn chip (khách Việt Nam) hoặc hộ chiếu còn hạn (khách nước ngoài) để làm thủ tục và khai báo lưu trú.</li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {hotel.address} ·{" "}
                  <a className="no-print text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}`)}`}>
                    Chỉ đường
                  </a>
                </span>
              </li>
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <StaySummary
            hotel={hotel}
            roomType={rt}
            ratePlan={rp}
            checkIn={r.checkIn}
            checkOut={r.checkOut}
            adults={r.adults}
            childCount={r.children}
            lines={lines}
            totals={t}
            cancellation={active ? policy.text : undefined}
          >
            <div className="space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đã thanh toán</span>
                <span className="tabular text-success">{formatVND(t.paid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{active ? (r.status === "tentative" ? "Cần thanh toán" : "Thanh toán tại khách sạn") : "Còn lại"}</span>
                <span className="tabular">{formatVND(t.due)}</span>
              </div>
            </div>
          </StaySummary>
        </aside>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Hủy đặt phòng {r.code}?</DialogTitle>
            <DialogDescription>{policy.text}</DialogDescription>
          </DialogHeader>
          {t.paid > 0 && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              Số tiền hoàn lại dự kiến: <b className="tabular">{formatVND(refund)}</b>
              <span className="block text-xs text-muted-foreground">Hoàn về phương thức đã thanh toán trong 5–7 ngày làm việc.</span>
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Giữ đặt phòng</Button>
            <Button variant="destructive" onClick={cancel}>Xác nhận hủy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteContainer>
  );
}
