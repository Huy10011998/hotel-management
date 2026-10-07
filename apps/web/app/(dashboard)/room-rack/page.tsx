"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, BrushCleaning, CalendarPlus, Crown, LogIn, LogOut, Search, Sparkles, Users, Wrench } from "lucide-react";
import { HK_STATUS_LABEL, ROOM_DISPLAY_STATUSES, ROOM_DISPLAY_STATUS_LABEL, type Reservation, type Room, type RoomDisplayStatus } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { RoomStatusLegend, RoomStatusBadge } from "@/components/hotel/status-badges";
import { ChangeRoomDialog } from "@/components/hotel/change-room-dialog";
import { useStore } from "@/lib/store";
import { arrivalReservation, folioTotals, inHouseReservation, roomDisplayStatus, todayStr } from "@/lib/selectors";
import { ROOM_STATUS_STYLE } from "@/lib/status";
import { cn, dayjs, formatDate, formatVND, nightsBetween } from "@/lib/utils";

export default function RoomRackPage() {
  return (
    <React.Suspense>
      <RoomRack />
    </React.Suspense>
  );
}

function RoomRack() {
  const params = useSearchParams();
  const { rooms, reservations, roomTypes } = useStore();
  const today = todayStr();
  const [status, setStatus] = React.useState<RoomDisplayStatus | null>(null);
  const [floor, setFloor] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [q, setQ] = React.useState(params.get("room") ?? "");

  const withStatus = React.useMemo(() => rooms.map((r) => ({ room: r, status: roomDisplayStatus(r, reservations, today) })), [rooms, reservations, today]);
  const counts = React.useMemo(() => {
    const c = Object.fromEntries(ROOM_DISPLAY_STATUSES.map((s) => [s, 0])) as Record<RoomDisplayStatus, number>;
    withStatus.forEach((x) => c[x.status]++);
    return c;
  }, [withStatus]);

  const filtered = withStatus.filter(
    (x) => (!status || x.status === status) && (floor === "all" || x.room.floor === Number(floor)) && (type === "all" || x.room.roomTypeId === type) && (!q || x.room.number.includes(q.trim())),
  );
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => b - a);

  return (
    <>
      <PageHeader title="Sơ đồ phòng" description="Trạng thái phòng theo thời gian thực. Bấm vào phòng để thao tác nhanh." />

      <Card className="mb-4 flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="relative sm:w-44">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Số phòng" className="pl-8" aria-label="Tìm số phòng" />
          </div>
          <Select value={floor} onChange={(e) => setFloor(e.target.value)} className="sm:w-36" aria-label="Lọc tầng">
            <option value="all">Tất cả tầng</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                Tầng {f}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-52" aria-label="Lọc loại phòng">
            <option value="all">Tất cả loại phòng</option>
            {roomTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <RoomStatusLegend counts={counts} active={status} onToggle={setStatus} />
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="Không có phòng phù hợp" description="Thử bỏ bớt bộ lọc." />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {floors.map((f) => {
            const list = filtered.filter((x) => x.room.floor === f);
            if (!list.length) return null;
            return (
              <section key={f}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Tầng {f} <span className="font-normal">· {list.length} phòng</span>
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
                  {list.map(({ room, status }) => (
                    <RoomCard key={room.id} room={room} status={status} highlight={!!q && room.number === q.trim()} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function RoomCard({ room, status, highlight }: { room: Room; status: RoomDisplayStatus; highlight?: boolean }) {
  const router = useRouter();
  const { reservations, guests, roomTypes, folios, hotel, staff, setHkStatus, setOutOfOrder } = useStore();
  const [changeFor, setChangeFor] = React.useState<Reservation | null>(null);
  const [open, setOpen] = React.useState(false);
  const today = todayStr();
  const rt = roomTypes.find((t) => t.id === room.roomTypeId)!;
  const stay = inHouseReservation(room, reservations);
  const arrival = arrivalReservation(room, reservations, today);
  const res = stay ?? arrival;
  const guest = res ? guests.find((g) => g.id === res.guestId) : undefined;
  const next = !res
    ? reservations
        .filter((r) => r.roomId === room.id && r.checkIn > today && (r.status === "confirmed" || r.status === "tentative"))
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0]
    : undefined;
  const totals = stay ? folioTotals(folios.find((f) => f.reservationId === stay.id), hotel) : null;
  const dueOut = stay && stay.checkOut <= today;
  const style = ROOM_STATUS_STYLE[status];
  const assignee = staff.find((s) => s.id === room.hkAssigneeId);

  const act = (fn: () => void, msg: string) => {
    fn();
    toast.success(msg);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "relative flex min-h-24 flex-col rounded-lg border-2 p-2.5 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              style.card,
              highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
            aria-label={`Phòng ${room.number}, ${ROOM_DISPLAY_STATUS_LABEL[status]}`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="tabular text-lg font-bold leading-none">{room.number}</span>
              <span className="rounded bg-card/80 px-1 text-[10px] font-semibold text-muted-foreground">{rt.code}</span>
            </div>
            <span className={cn("mt-1 text-[11px] font-medium", style.text)}>{ROOM_DISPLAY_STATUS_LABEL[status]}</span>
            {guest && (
              <span className="mt-auto flex items-center gap-1 truncate pt-1 text-xs font-medium">
                {guest.vip && <Crown className="size-3 shrink-0 text-warning" />}
                <span className="truncate">{guest.fullName}</span>
              </span>
            )}
            {stay && (
              <span className="text-[10px] text-muted-foreground">
                {dueOut ? <b className="text-danger">Trả phòng hôm nay</b> : `Đến ${dayjs(stay.checkOut).format("DD/MM")}`}
                {stay.status === "checked_in" && room.hkStatus === "dirty" && " · cần dọn"}
              </span>
            )}
            {!res && next && <span className="mt-auto pt-1 text-[10px] text-muted-foreground">Đặt tiếp: {dayjs(next.checkIn).format("DD/MM")}</span>}
            {status === "maintenance" && <Wrench className="absolute bottom-2 right-2 size-4 text-st-maintenance" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="border-b p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                Phòng {room.number} <span className="font-normal text-muted-foreground">· {rt.name}</span>
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <RoomStatusBadge status={status} />
              <span>Buồng: {HK_STATUS_LABEL[room.hkStatus]}{assignee && ` (${assignee.fullName})`}</span>
            </div>
            {room.outOfOrder && room.note && <p className="mt-1 text-xs text-danger">Bảo trì: {room.note}</p>}
          </div>
          {res && guest && (
            <div className="space-y-1 border-b p-3 text-sm">
              <Link href={`/guests/${guest.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                {guest.vip && <Crown className="size-3.5 text-warning" />} {guest.fullName}
              </Link>
              <p className="text-xs text-muted-foreground">
                <Link href={`/reservations/${res.id}`} className="text-primary hover:underline">{res.code}</Link> · {formatDate(res.checkIn)} → {formatDate(res.checkOut)} ({nightsBetween(res.checkIn, res.checkOut)} đêm)
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" /> {res.adults} NL{res.children ? `, ${res.children} TE` : ""} · {formatVND(res.ratePerNight)}/đêm
              </p>
              {totals && (
                <p className="text-xs">
                  Số dư folio: <b className={cn("tabular", totals.balance > 0 ? "text-danger" : "text-success")}>{formatVND(totals.balance)}</b>
                </p>
              )}
              {res.note && <p className="rounded bg-warning/12 px-2 py-1 text-xs">📝 {res.note}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {arrival && (
              <Button size="sm" onClick={() => router.push(`/front-desk/check-in?reservation=${arrival.id}`)}>
                <LogIn /> Check-in
              </Button>
            )}
            {stay && (
              <Button size="sm" variant={dueOut ? "default" : "outline"} onClick={() => router.push(`/front-desk/check-out?reservation=${stay.id}`)}>
                <LogOut /> Check-out
              </Button>
            )}
            {res && (
              <Button size="sm" variant="outline" onClick={() => { setOpen(false); setChangeFor(res); }}>
                <ArrowLeftRight /> Đổi phòng
              </Button>
            )}
            {!res && !room.outOfOrder && (
              <Button size="sm" variant="outline" onClick={() => router.push(`/reservations/new?room=${room.id}`)}>
                <CalendarPlus /> Đặt phòng
              </Button>
            )}
            {room.hkStatus !== "clean" && room.hkStatus !== "inspected" && (
              <Button size="sm" variant="outline" onClick={() => act(() => setHkStatus(room.id, "clean"), `Phòng ${room.number} đã sạch`)}>
                <Sparkles /> Đánh dấu sạch
              </Button>
            )}
            {(room.hkStatus === "clean" || room.hkStatus === "inspected") && (
              <Button size="sm" variant="outline" onClick={() => act(() => setHkStatus(room.id, "dirty"), `Phòng ${room.number} chuyển sang bẩn`)}>
                <BrushCleaning /> Đánh dấu bẩn
              </Button>
            )}
            {!stay && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(room.outOfOrder ? "text-success" : "text-muted-foreground")}
                onClick={() => act(() => setOutOfOrder(room.id, !room.outOfOrder, room.outOfOrder ? undefined : "Khóa từ sơ đồ phòng"), room.outOfOrder ? `Đã mở khóa phòng ${room.number}` : `Đã khóa phòng ${room.number}`)}
              >
                <Wrench /> {room.outOfOrder ? "Mở khóa phòng" : "Khóa bảo trì"}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {changeFor && <ChangeRoomDialog reservation={changeFor} open={!!changeFor} onOpenChange={(v) => !v && setChangeFor(null)} />}
    </>
  );
}
