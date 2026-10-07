"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, Ban, CheckCircle2, LogIn, LogOut, Pencil, UserX } from "lucide-react";
import { BOOKING_SOURCE_LABEL, MEAL_PLAN_LABEL } from "@hotel/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { FolioPanel, PrintButton } from "@/components/hotel/folio-panel";
import { SelectedGuest } from "@/components/hotel/guest-picker";
import { ChangeRoomDialog } from "@/components/hotel/change-room-dialog";
import { ReservationStatusBadge, SourceBadge } from "@/components/hotel/status-badges";
import { useStore } from "@/lib/store";
import { todayStr } from "@/lib/selectors";
import { formatDate, formatDateTime, formatVND, nightsBetween } from "@/lib/utils";

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reservations, guests, rooms, roomTypes, ratePlans, updateReservation, cancelReservation, markNoShow } = useStore();
  const r = reservations.find((x) => x.id === id);
  const [dlg, setDlg] = React.useState<"room" | "cancel" | "edit" | null>(null);

  if (!r)
    return (
      <Card>
        <EmptyState title="Không tìm thấy đặt phòng" action={<Link href="/reservations" className={buttonVariants({ variant: "outline" })}>Về danh sách</Link>} />
      </Card>
    );

  const guest = guests.find((g) => g.id === r.guestId);
  const room = rooms.find((x) => x.id === r.roomId);
  const rt = roomTypes.find((t) => t.id === r.roomTypeId);
  const rp = ratePlans.find((p) => p.id === r.ratePlanId);
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const today = todayStr();
  const active = r.status === "confirmed" || r.status === "tentative";

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Đặt phòng", href: "/reservations" }, { label: r.code }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {r.code} <ReservationStatusBadge status={r.status} />
          </span>
        }
        description={`Tạo lúc ${formatDateTime(r.createdAt)}`}
        actions={
          <>
            {r.status === "tentative" && (
              <Button variant="outline" onClick={() => { updateReservation(r.id, { status: "confirmed" }, "Xác nhận đặt phòng"); toast.success("Đã xác nhận"); }}>
                <CheckCircle2 /> Xác nhận
              </Button>
            )}
            {active && r.checkIn <= today && (
              <Button onClick={() => router.push(`/front-desk/check-in?reservation=${r.id}`)}>
                <LogIn /> Check-in
              </Button>
            )}
            {r.status === "checked_in" && (
              <Button onClick={() => router.push(`/front-desk/check-out?reservation=${r.id}`)}>
                <LogOut /> Check-out
              </Button>
            )}
            {(active || r.status === "checked_in") && (
              <Button variant="outline" onClick={() => setDlg("room")}>
                <ArrowLeftRight /> {room ? "Đổi phòng" : "Gán phòng"}
              </Button>
            )}
            {active && (
              <>
                <Button variant="outline" onClick={() => setDlg("edit")}>
                  <Pencil /> Sửa
                </Button>
                {r.checkIn <= today && (
                  <Button variant="ghost" onClick={() => { markNoShow(r.id); toast("Đã đánh dấu No-show"); }}>
                    <UserX /> No-show
                  </Button>
                )}
                <Button variant="ghost" className="text-destructive" onClick={() => setDlg("cancel")}>
                  <Ban /> Hủy
                </Button>
              </>
            )}
            <PrintButton label="In phiếu" />
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lưu trú</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
                <Info label="Nhận phòng" value={formatDate(r.checkIn)} />
                <Info label="Trả phòng" value={formatDate(r.checkOut)} />
                <Info label="Số đêm" value={`${nights} đêm`} />
                <Info label="Số khách" value={`${r.adults} người lớn${r.children ? `, ${r.children} trẻ em` : ""}`} />
                <Info label="Loại phòng" value={rt?.name} />
                <Info label="Phòng" value={room ? `${room.number} (tầng ${room.floor})` : "Chưa gán"} />
                <Info label="Gói giá" value={rp ? `${rp.name} · ${MEAL_PLAN_LABEL[rp.mealPlan]}` : "—"} />
                <Info label="Nguồn" value={<SourceBadge source={r.source} />} />
                <Info label="Giá / đêm" value={formatVND(r.ratePerNight)} />
                <Info label="Tiền phòng dự kiến" value={formatVND(r.ratePerNight * nights)} />
                <Info label="Đã cọc" value={formatVND(r.deposit)} />
                <Info label="Hoàn hủy" value={rp?.refundable ? "Được hoàn" : "Không hoàn"} />
              </dl>
              {r.note && <p className="mt-4 rounded-md bg-warning/12 px-3 py-2 text-sm">📝 {r.note}</p>}
            </CardContent>
          </Card>
          <FolioPanel reservationId={r.id} />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Khách đặt phòng</CardTitle>
            </CardHeader>
            <CardContent>{guest ? <SelectedGuest guest={guest} /> : "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thao tác</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-4">
                {[...r.history].reverse().map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
                    <p className="font-medium">{h.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(h.at)} · {h.by}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <p className="px-1 text-xs text-muted-foreground">Kênh: {BOOKING_SOURCE_LABEL[r.source]}</p>
        </div>
      </div>

      {dlg === "room" && <ChangeRoomDialog reservation={r} open onOpenChange={(v) => !v && setDlg(null)} />}
      <CancelDialog open={dlg === "cancel"} onOpenChange={(v) => setDlg(v ? "cancel" : null)} onConfirm={(reason) => { cancelReservation(r.id, reason); toast.success("Đã hủy đặt phòng"); setDlg(null); }} refundable={rp?.refundable ?? true} />
      {dlg === "edit" && <EditDialog id={r.id} onClose={() => setDlg(null)} />}
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function CancelDialog({ open, onOpenChange, onConfirm, refundable }: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: (reason: string) => void; refundable: boolean }) {
  const [reason, setReason] = React.useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Hủy đặt phòng?</DialogTitle>
          <DialogDescription>{refundable ? "Gói giá cho phép hoàn cọc theo chính sách." : "Gói không hoàn hủy — tiền cọc sẽ không được hoàn."}</DialogDescription>
        </DialogHeader>
        <Field label="Lý do hủy" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Xác nhận hủy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { reservations, updateReservation } = useStore();
  const r = reservations.find((x) => x.id === id)!;
  const [checkIn, setCheckIn] = React.useState(r.checkIn);
  const [checkOut, setCheckOut] = React.useState(r.checkOut);
  const [adults, setAdults] = React.useState(r.adults);
  const [children, setChildren] = React.useState(r.children);
  const [note, setNote] = React.useState(r.note ?? "");
  const save = () => {
    if (checkOut <= checkIn) return toast.error("Ngày trả phòng phải sau ngày nhận phòng");
    try {
      updateReservation(id, { checkIn, checkOut, adults, children, note: note || undefined }, `Sửa đặt phòng: ${formatDate(checkIn)} → ${formatDate(checkOut)}, ${adults} NL`);
      toast.success("Đã cập nhật");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa đặt phòng {r.code}</DialogTitle>
          <DialogDescription>Hệ thống kiểm tra trùng phòng khi đổi ngày.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nhận phòng"><Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></Field>
          <Field label="Trả phòng"><Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} /></Field>
          <Field label="Người lớn"><Input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value))} /></Field>
          <Field label="Trẻ em"><Input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} /></Field>
          <Field label="Ghi chú" className="col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={save}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
