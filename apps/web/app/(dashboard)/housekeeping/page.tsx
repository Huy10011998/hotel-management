"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Crown, LogIn, TriangleAlert, User, Wrench } from "lucide-react";
import { HK_STATUSES, HK_STATUS_LABEL, type HkStatus, type Room } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { TicketDialog } from "@/components/hotel/ticket-dialog";
import { useStore } from "@/lib/store";
import { arrivalReservation, inHouseReservation, todayStr } from "@/lib/selectors";
import { cn, initials } from "@/lib/utils";

const COL_STYLE: Record<HkStatus, string> = {
  dirty: "border-t-st-vacant-dirty",
  cleaning: "border-t-st-cleaning",
  clean: "border-t-st-vacant-clean",
  inspected: "border-t-primary",
};

export default function HousekeepingPage() {
  const { rooms, reservations, staff, guests, roomTypes, setHkStatus, assignHousekeeper } = useStore();
  const today = todayStr();
  const [who, setWho] = React.useState("all");
  const [floor, setFloor] = React.useState("all");
  const [ticketRoom, setTicketRoom] = React.useState<string | null>(null);
  const [mobileCol, setMobileCol] = React.useState<HkStatus>("dirty");
  const housekeepers = staff.filter((s) => s.role === "housekeeper" && s.active);

  const list = rooms.filter((r) => !r.outOfOrder && (who === "all" || (who === "none" ? !r.hkAssigneeId : r.hkAssigneeId === who)) && (floor === "all" || r.floor === Number(floor)));
  const priority = (r: Room) => (arrivalReservation(r, reservations, today) ? 0 : reservations.some((x) => x.roomId === r.id && x.status === "checked_out" && x.checkOut === today) ? 1 : inHouseReservation(r, reservations) ? 3 : 2);

  const move = (r: Room, dir: 1 | -1) => {
    const idx = HK_STATUSES.indexOf(r.hkStatus) + dir;
    if (idx < 0 || idx >= HK_STATUSES.length) return;
    setHkStatus(r.id, HK_STATUSES[idx]);
    toast.success(`Phòng ${r.number}: ${HK_STATUS_LABEL[HK_STATUSES[idx]]}`);
  };

  return (
    <>
      <PageHeader title="Buồng phòng" description="Phân công & cập nhật trạng thái dọn phòng. Ưu tiên phòng có khách đến hôm nay." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {housekeepers.map((h) => {
          const mine = rooms.filter((r) => r.hkAssigneeId === h.id && (r.hkStatus === "dirty" || r.hkStatus === "cleaning"));
          return (
            <Card key={h.id} className="flex items-center gap-3 p-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{initials(h.fullName)}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{h.fullName}</p>
                <p className="text-xs text-muted-foreground">{mine.length} phòng chờ dọn</p>
              </div>
            </Card>
          );
        })}
        <Card className="flex items-center gap-3 p-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-warning/15 text-warning"><TriangleAlert className="size-4" /></span>
          <div><p className="text-sm font-medium">Chưa phân công</p><p className="text-xs text-muted-foreground">{rooms.filter((r) => !r.hkAssigneeId && !r.outOfOrder && r.hkStatus === "dirty").length} phòng bẩn</p></div>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={who} onChange={(e) => setWho(e.target.value)} className="sm:w-52" aria-label="Nhân viên">
          <option value="all">Tất cả nhân viên</option>
          <option value="none">Chưa phân công</option>
          {housekeepers.map((h) => <option key={h.id} value={h.id}>{h.fullName}</option>)}
        </Select>
        <Select value={floor} onChange={(e) => setFloor(e.target.value)} className="sm:w-36" aria-label="Tầng">
          <option value="all">Tất cả tầng</option>
          {[...new Set(rooms.map((r) => r.floor))].sort().map((f) => <option key={f} value={f}>Tầng {f}</option>)}
        </Select>
      </div>

      {/* Mobile: chọn cột */}
      <div className="mb-3 grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 md:hidden">
        {HK_STATUSES.map((s) => (
          <button key={s} onClick={() => setMobileCol(s)} className={cn("rounded-md px-1 py-1 text-[11px] font-medium leading-tight", mobileCol === s ? "bg-card shadow-sm" : "text-muted-foreground")}>
            {HK_STATUS_LABEL[s]}
            <span className="block tabular">{list.filter((r) => r.hkStatus === s).length}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {HK_STATUSES.map((s) => {
          const col = list.filter((r) => r.hkStatus === s).sort((a, b) => priority(a) - priority(b) || a.number.localeCompare(b.number));
          return (
            <div key={s} className={cn("flex-col rounded-xl border border-t-4 bg-muted/30", COL_STYLE[s], mobileCol === s ? "flex" : "hidden md:flex")}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="font-semibold">{HK_STATUS_LABEL[s]}</p>
                <Badge variant="secondary">{col.length}</Badge>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto px-2 pb-2">
                {col.map((r) => {
                  const stay = inHouseReservation(r, reservations);
                  const arrival = arrivalReservation(r, reservations, today);
                  const g = guests.find((x) => x.id === (stay ?? arrival)?.guestId);
                  return (
                    <Card key={r.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="tabular text-lg font-bold leading-none">{r.number}</p>
                          <p className="text-xs text-muted-foreground">{roomTypes.find((t) => t.id === r.roomTypeId)?.code} · Tầng {r.floor}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {arrival && <Badge variant="danger"><LogIn className="size-3" /> Khách đến</Badge>}
                          {stay && <Badge variant="info">Có khách</Badge>}
                          {!stay && !arrival && <Badge variant="muted">Trống</Badge>}
                        </div>
                      </div>
                      {g && <p className="mt-1.5 flex items-center gap-1 truncate text-xs">{g.vip && <Crown className="size-3 text-warning" />}{g.fullName}</p>}
                      <div className="mt-2 flex items-center gap-1.5">
                        <User className="size-3.5 shrink-0 text-muted-foreground" />
                        <select value={r.hkAssigneeId ?? ""} onChange={(e) => assignHousekeeper(r.id, e.target.value || undefined)} className="h-7 min-w-0 flex-1 rounded-md border border-input bg-card px-1.5 text-xs" aria-label={`Phân công phòng ${r.number}`}>
                          <option value="">Chưa phân công</option>
                          {housekeepers.map((h) => <option key={h.id} value={h.id}>{h.fullName}</option>)}
                        </select>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button size="icon-sm" variant="outline" disabled={s === "dirty"} onClick={() => move(r, -1)} aria-label="Lùi trạng thái"><ChevronLeft /></Button>
                        {s !== "inspected" && (
                          <Button size="sm" className="h-8 flex-1" onClick={() => move(r, 1)}>
                            {s === "dirty" ? "Bắt đầu dọn" : s === "cleaning" ? "Dọn xong" : "Kiểm tra đạt"} <ChevronRight />
                          </Button>
                        )}
                        {s === "inspected" && <span className="flex-1 text-center text-xs text-success">Sẵn sàng bán</span>}
                        <Button size="icon-sm" variant="ghost" onClick={() => setTicketRoom(r.id)} aria-label="Báo hỏng"><Wrench /></Button>
                      </div>
                    </Card>
                  );
                })}
                {col.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Trống</p>}
              </div>
            </div>
          );
        })}
      </div>
      <TicketDialog open={!!ticketRoom} onOpenChange={(v) => !v && setTicketRoom(null)} roomId={ticketRoom ?? undefined} />
    </>
  );
}
