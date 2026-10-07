"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { BOOKING_SOURCES, BOOKING_SOURCE_LABEL, RESERVATION_STATUS_LABEL, type Reservation } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { useStore } from "@/lib/store";
import { findConflict, todayStr } from "@/lib/selectors";
import { SOURCE_COLOR } from "@/lib/status";
import { cn, dayjs, formatDate, toDateOnly } from "@/lib/utils";

const ROOM_COL = 104;

export default function CalendarPage() {
  const router = useRouter();
  const { rooms, reservations, guests, roomTypes, moveReservation, updateReservation } = useStore();
  const today = todayStr();
  const [span, setSpan] = React.useState<"14" | "30">("14");
  const [start, setStart] = React.useState(() => toDateOnly(dayjs().subtract(2, "day")));
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [dragId, setDragId] = React.useState<string | null>(null);
  // Ref + dataTransfer để drop đọc được id ngay cả khi state chưa kịp render lại
  const dragRef = React.useRef<string | null>(null);
  const startDrag = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    dragRef.current = id;
    setDragId(id);
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragId(null);
  };
  const [hoverCell, setHoverCell] = React.useState<string | null>(null);

  const days = Number(span);
  const cellW = span === "14" ? 64 : 40;
  const dates = Array.from({ length: days }, (_, i) => dayjs(start).add(i, "day"));
  const end = toDateOnly(dayjs(start).add(days, "day"));
  const guestById = React.useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const visibleRooms = rooms.filter((r) => typeFilter === "all" || r.roomTypeId === typeFilter).sort((a, b) => a.roomTypeId.localeCompare(b.roomTypeId) || a.number.localeCompare(b.number));
  const groups = roomTypes.map((t) => ({ type: t, rooms: visibleRooms.filter((r) => r.roomTypeId === t.id) })).filter((g) => g.rooms.length);

  const bars = React.useMemo(
    () => reservations.filter((r) => r.roomId && !["cancelled", "no_show"].includes(r.status) && r.checkIn < end && r.checkOut > start),
    [reservations, start, end],
  );
  const unassigned = reservations.filter((r) => !r.roomId && ["confirmed", "tentative"].includes(r.status) && r.checkOut > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const occupancyByDay = dates.map((d) => {
    const ds = toDateOnly(d);
    return reservations.filter((r) => r.roomId && ["confirmed", "tentative", "checked_in", "checked_out"].includes(r.status) && r.checkIn <= ds && r.checkOut > ds).length;
  });

  const onDrop = (e: React.DragEvent, roomId: string, date: string) => {
    setHoverCell(null);
    const id = e.dataTransfer.getData("text/plain") || dragRef.current;
    endDrag();
    if (!id) return;
    const r = reservations.find((x) => x.id === id);
    if (!r) return;
    if (r.status === "checked_out") return toast.error("Không thể di chuyển booking đã trả phòng");
    const room = rooms.find((x) => x.id === roomId)!;
    if (room.outOfOrder) return toast.error(`Phòng ${room.number} đang bảo trì`);
    // Khách đang ở: chỉ đổi phòng, giữ nguyên ngày
    const newIn = r.status === "checked_in" ? r.checkIn : date;
    const nights = dayjs(r.checkOut).diff(dayjs(r.checkIn), "day");
    const newOut = toDateOnly(dayjs(newIn).add(nights, "day"));
    const c = findConflict(reservations, roomId, newIn, newOut, r.id);
    if (c) return toast.error(`Không thể chuyển: trùng với ${c.code} (${formatDate(c.checkIn)} → ${formatDate(c.checkOut)})`);
    try {
      if (r.roomId) moveReservation(r.id, roomId, newIn);
      else updateReservation(r.id, { roomId, roomTypeId: room.roomTypeId, checkIn: newIn, checkOut: newOut }, `Gán phòng ${room.number}`);
      toast.success(`${r.code} → phòng ${room.number}, ${dayjs(newIn).format("DD/MM")}–${dayjs(newOut).format("DD/MM")}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Lịch đặt phòng"
        description="Kéo-thả thanh booking để đổi phòng / đổi ngày. Bấm ô trống để tạo đặt phòng."
        actions={
          <>
            <Tabs value={span} onValueChange={(v) => setSpan(v as "14" | "30")}>
              <TabsList>
                <TabsTrigger value="14">14 ngày</TabsTrigger>
                <TabsTrigger value="30">30 ngày</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44" aria-label="Lọc loại phòng">
              <option value="all">Tất cả loại phòng</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setStart(toDateOnly(dayjs(start).subtract(7, "day")))} aria-label="Lùi 7 ngày">
                <ChevronLeft />
              </Button>
              <Button variant="outline" onClick={() => setStart(toDateOnly(dayjs().subtract(2, "day")))}>Hôm nay</Button>
              <Button variant="outline" size="icon" onClick={() => setStart(toDateOnly(dayjs(start).add(7, "day")))} aria-label="Tới 7 ngày">
                <ChevronRight />
              </Button>
            </div>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {BOOKING_SOURCES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: SOURCE_COLOR[s] }} /> {BOOKING_SOURCE_LABEL[s]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-4 rounded-sm border border-dashed border-foreground/50" /> Tạm giữ
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-4 rounded-sm bg-foreground/25" /> Đã trả phòng
        </span>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ width: ROOM_COL + days * cellW }} className="relative select-none text-xs">
              {/* Header ngày */}
              <div className="sticky top-0 z-20 flex border-b bg-card">
                <div className="sticky left-0 z-10 flex shrink-0 items-end border-r bg-card px-3 pb-1.5 font-medium text-muted-foreground" style={{ width: ROOM_COL }}>
                  Phòng
                </div>
                {dates.map((d, i) => {
                  const ds = toDateOnly(d);
                  const weekend = d.day() === 0 || d.day() === 6;
                  const pct = Math.round((occupancyByDay[i] / rooms.length) * 100);
                  return (
                    <div key={ds} className={cn("shrink-0 border-r py-1.5 text-center", weekend && "bg-muted/50", ds === today && "bg-primary/10")} style={{ width: cellW }}>
                      <div className={cn("capitalize text-muted-foreground", ds === today && "font-semibold text-primary")}>{d.format("dd")}</div>
                      <div className={cn("tabular font-semibold", ds === today && "text-primary")}>{d.format(span === "14" ? "DD/MM" : "DD")}</div>
                      <div className={cn("tabular text-[10px]", pct >= 85 ? "text-danger" : pct >= 60 ? "text-warning" : "text-muted-foreground")}>{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {groups.map((g) => (
                <React.Fragment key={g.type.id}>
                  <div className="flex border-b bg-muted/60">
                    <div className="sticky left-0 bg-muted/60 px-3 py-1 font-semibold" style={{ width: ROOM_COL + days * cellW }}>
                      {g.type.name} <span className="font-normal text-muted-foreground">· {g.rooms.length} phòng</span>
                    </div>
                  </div>
                  {g.rooms.map((room) => (
                    <div key={room.id} className="relative flex h-10 border-b">
                      <div className={cn("sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r bg-card px-3", room.outOfOrder && "text-muted-foreground")} style={{ width: ROOM_COL }}>
                        <span className="tabular font-semibold">{room.number}</span>
                        {room.outOfOrder && <span className="rounded bg-st-maintenance/20 px-1 text-[10px]">Bảo trì</span>}
                        {!room.outOfOrder && room.hkStatus === "dirty" && <span className="size-1.5 rounded-full bg-st-vacant-dirty" title="Phòng bẩn" />}
                      </div>
                      {dates.map((d) => {
                        const ds = toDateOnly(d);
                        const key = `${room.id}|${ds}`;
                        return (
                          <div
                            key={ds}
                            role="button"
                            tabIndex={-1}
                            aria-label={`Đặt phòng ${room.number} ngày ${formatDate(ds)}`}
                            onClick={() => !room.outOfOrder && ds >= today && router.push(`/reservations/new?room=${room.id}&checkIn=${ds}`)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setHoverCell(key);
                            }}
                            onDragLeave={() => setHoverCell((h) => (h === key ? null : h))}
                            onDrop={(e) => onDrop(e, room.id, ds)}
                            className={cn(
                              "shrink-0 border-r transition-colors",
                              (d.day() === 0 || d.day() === 6) && "bg-muted/30",
                              ds === today && "bg-primary/5",
                              room.outOfOrder && "bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--muted)_6px_12px)]",
                              !room.outOfOrder && ds >= today && "hover:bg-accent",
                              hoverCell === key && "bg-primary/20",
                            )}
                            style={{ width: cellW }}
                          />
                        );
                      })}
                      {bars
                        .filter((r) => r.roomId === room.id)
                        .map((r) => (
                          <BookingBar key={r.id} r={r} start={start} days={days} cellW={cellW} guestName={guestById.get(r.guestId)?.fullName ?? ""} onDragStart={(e) => startDrag(e, r.id)} onDragEnd={endDrag} dragging={dragId === r.id} />
                        ))}
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {/* Vạch hôm nay */}
              {today >= start && today < end && (
                <div className="pointer-events-none absolute bottom-0 top-0 z-[5] w-0.5 bg-primary/60" style={{ left: ROOM_COL + dayjs(today).diff(dayjs(start), "day") * cellW + cellW / 2 }} />
              )}
            </div>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4" /> Chưa gán phòng
              </CardTitle>
              <CardDescription>Kéo vào ô trên lịch để gán phòng</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {unassigned.length === 0 ? (
              <EmptyState title="Tất cả đã được gán phòng" className="py-6" />
            ) : (
              <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {unassigned.map((r) => (
                  <li
                    key={r.id}
                    draggable
                    onDragStart={(e) => startDrag(e, r.id)}
                    onDragEnd={endDrag}
                    className="flex cursor-grab items-center gap-2 rounded-lg border bg-card p-2 text-sm hover:bg-accent active:cursor-grabbing"
                  >
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: SOURCE_COLOR[r.source] }} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{guestById.get(r.guestId)?.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {roomTypes.find((t) => t.id === r.roomTypeId)?.code} · {dayjs(r.checkIn).format("DD/MM")} → {dayjs(r.checkOut).format("DD/MM")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BookingBar({
  r,
  start,
  days,
  cellW,
  guestName,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  r: Reservation;
  start: string;
  days: number;
  cellW: number;
  guestName: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const router = useRouter();
  // Thanh bắt đầu từ giữa ô ngày nhận phòng tới giữa ô ngày trả phòng (giờ nhận 14h / trả 12h).
  const startIdx = dayjs(r.checkIn).diff(dayjs(start), "day") + 0.5;
  const endIdx = dayjs(r.checkOut).diff(dayjs(start), "day") + 0.5;
  const left = Math.max(0, startIdx) * cellW;
  const right = Math.min(days, endIdx) * cellW;
  const width = right - left - 2;
  if (width <= 0) return null;
  const done = r.status === "checked_out";
  return (
    <div
      draggable={!done}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => router.push(`/reservations/${r.id}`)}
      title={`${r.code} · ${guestName}\n${formatDate(r.checkIn)} → ${formatDate(r.checkOut)}\n${RESERVATION_STATUS_LABEL[r.status]} · ${BOOKING_SOURCE_LABEL[r.source]}`}
      className={cn(
        "absolute top-1.5 z-[6] flex h-7 items-center overflow-hidden rounded-md px-2 text-[11px] font-medium text-white shadow-sm",
        done ? "cursor-pointer opacity-45 grayscale-[40%]" : "cursor-grab active:cursor-grabbing",
        r.status === "tentative" && "border-2 border-dashed border-white/70",
        r.status === "checked_in" && "ring-2 ring-inset ring-white/40",
        dragging && "opacity-40",
        startIdx < 0 && "rounded-l-none",
        endIdx > days && "rounded-r-none",
      )}
      style={{ left: ROOM_COL + left + 1, width, background: SOURCE_COLOR[r.source] }}
    >
      <span className="truncate">{guestName}</span>
    </div>
  );
}
