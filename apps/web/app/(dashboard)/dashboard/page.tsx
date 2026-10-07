"use client";

import * as React from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, BedDouble, BrushCleaning, DollarSign, LogIn, LogOut, Percent, TrendingUp, Wrench } from "lucide-react";
import { BOOKING_SOURCE_LABEL, ROOM_DISPLAY_STATUSES, type BookingSource, type RoomDisplayStatus } from "@hotel/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/hotel/kpi-card";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { RoomStatusLegend, ReservationStatusBadge } from "@/components/hotel/status-badges";
import { ChartTooltip, axisProps } from "@/components/charts/chart-tooltip";
import { useStore } from "@/lib/store";
import { occupiedOnNight, revenueByDate, roomDisplayStatus, todayStr } from "@/lib/selectors";
import { SOURCE_COLOR } from "@/lib/status";
import { cn, dayjs, formatVND, formatVNDShort, toDateOnly } from "@/lib/utils";

export default function DashboardPage() {
  const { rooms, reservations, folios, guests, roomTypes, tickets } = useStore();
  const today = todayStr();
  const guestById = React.useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const roomById = React.useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const stats = React.useMemo(() => {
    const sellable = rooms.filter((r) => !r.outOfOrder).length;
    const statusCounts = Object.fromEntries(ROOM_DISPLAY_STATUSES.map((s) => [s, 0])) as Record<RoomDisplayStatus, number>;
    rooms.forEach((r) => statusCounts[roomDisplayStatus(r, reservations, today)]++);
    const occupiedTonight = occupiedOnNight(reservations.filter((r) => r.status !== "checked_out" || r.checkOut > today), today);
    const occ = sellable ? (occupiedTonight / sellable) * 100 : 0;
    const yesterday = toDateOnly(dayjs(today).subtract(1, "day"));
    const occY = sellable ? (occupiedOnNight(reservations, yesterday) / sellable) * 100 : 0;

    const rev = revenueByDate(folios);
    const day = (d: string) => rev.get(d) ?? { room: 0, other: 0 };
    // Tiền phòng đêm nay chỉ được ghi khi Night Audit — cộng phần dự kiến của các phòng đang ở để KPI có ý nghĩa trong ngày.
    const postedTonight = new Set(folios.filter((f) => f.charges.some((c) => c.category === "room" && c.date === today)).map((f) => f.reservationId));
    const tonightForecast = reservations
      .filter((r) => r.status === "checked_in" && r.checkOut > today && !postedTonight.has(r.id))
      .reduce((s, r) => s + r.ratePerNight, 0);
    const revToday = day(today).room + day(today).other + tonightForecast;
    const revYesterday = day(yesterday).room + day(yesterday).other;

    const monthStart = dayjs(today).startOf("month");
    let mtdRoom = 0;
    let mtdOther = 0;
    let roomsSold = 0;
    let lastMtd = 0;
    const daysElapsed = dayjs(today).date();
    for (let i = 0; i < daysElapsed; i++) {
      const d = toDateOnly(monthStart.add(i, "day"));
      mtdRoom += day(d).room;
      mtdOther += day(d).other;
      roomsSold += occupiedOnNight(reservations.filter((r) => r.status === "checked_in" || r.status === "checked_out"), d);
      const ld = toDateOnly(monthStart.subtract(1, "month").add(i, "day"));
      lastMtd += day(ld).room + day(ld).other;
    }
    const adr = roomsSold ? mtdRoom / roomsSold : 0;
    const revpar = mtdRoom / (sellable * daysElapsed || 1);

    const arrivals = reservations.filter((r) => r.checkIn === today && ["confirmed", "tentative", "checked_in"].includes(r.status));
    const departures = reservations.filter((r) => r.checkOut === today && ["checked_in", "checked_out"].includes(r.status));
    const overdue = reservations.filter((r) => r.status === "checked_in" && r.checkOut < today);

    const revenue30 = Array.from({ length: 30 }, (_, i) => {
      const d = dayjs(today).subtract(29 - i, "day");
      const v = day(toDateOnly(d));
      return { date: d.format("DD/MM"), "Tiền phòng": v.room, "Dịch vụ": v.other };
    });

    const forecast = Array.from({ length: 14 }, (_, i) => {
      const d = dayjs(today).add(i, "day");
      const n = occupiedOnNight(reservations, toDateOnly(d));
      return { date: d.format("dd DD/MM"), "Công suất": Math.round((n / (sellable || 1)) * 100) };
    });

    const since = toDateOnly(dayjs(today).subtract(30, "day"));
    const sourceMap = new Map<BookingSource, number>();
    reservations
      .filter((r) => r.createdAt.slice(0, 10) >= since && r.status !== "cancelled")
      .forEach((r) => sourceMap.set(r.source, (sourceMap.get(r.source) ?? 0) + 1));
    const sources = [...sourceMap.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => ({ source: s, name: BOOKING_SOURCE_LABEL[s], value: n }));

    return {
      sellable, statusCounts, occupiedTonight, occ, occDelta: occ - occY, revToday,
      revDelta: revYesterday ? ((revToday - revYesterday) / revYesterday) * 100 : undefined,
      mtd: mtdRoom + mtdOther, mtdDelta: lastMtd ? ((mtdRoom + mtdOther - lastMtd) / lastMtd) * 100 : undefined,
      adr, revpar, arrivals, departures, overdue, revenue30, forecast, sources,
    };
  }, [rooms, reservations, folios, today]);

  const dirtyRooms = rooms.filter((r) => !r.outOfOrder && (r.hkStatus === "dirty" || r.hkStatus === "cleaning"));
  const openTickets = tickets.filter((t) => t.status !== "done");
  const totalSources = stats.sources.reduce((s, x) => s + x.value, 0);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={<span className="capitalize">{dayjs().format("dddd, DD [tháng] MM, YYYY")}</span>}
        actions={
          <>
            <Link href="/front-desk/check-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <LogIn /> Check-in
            </Link>
            <Link href="/front-desk/check-out" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <LogOut /> Check-out
            </Link>
          </>
        }
      />

      {stats.overdue.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 text-danger" />
          <span>
            <b>{stats.overdue.length} phòng</b> đã quá ngày trả phòng nhưng chưa check-out:{" "}
            {stats.overdue.map((r) => roomById.get(r.roomId ?? "")?.number).join(", ")}
          </span>
          <Link href="/front-desk/check-out" className="ml-auto font-medium text-danger hover:underline">
            Xử lý ngay
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Công suất đêm nay" value={`${stats.occ.toFixed(1).replace(".", ",")}%`} delta={stats.occDelta} sub={`${stats.occupiedTonight}/${stats.sellable} phòng · so với hôm qua`} icon={Percent} />
        <KpiCard label="Doanh thu hôm nay" value={formatVND(stats.revToday)} delta={stats.revDelta} sub="gồm tiền phòng đêm nay (dự kiến)" icon={DollarSign} tone="success" />
        <KpiCard label="Doanh thu tháng (MTD)" value={formatVNDShort(stats.mtd)} delta={stats.mtdDelta} sub="cùng kỳ tháng trước" icon={TrendingUp} tone="info" />
        <KpiCard label="ADR / RevPAR (tháng)" value={formatVNDShort(stats.adr)} sub={<>RevPAR <b className="text-foreground">{formatVNDShort(stats.revpar)}</b></>} icon={BedDouble} tone="warning" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Tình trạng phòng hiện tại</CardTitle>
            <CardDescription>{rooms.length} phòng · {rooms.length - stats.sellable} phòng bảo trì</CardDescription>
          </div>
          <Link href="/room-rack" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sơ đồ phòng <ArrowRight />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Phân bố trạng thái phòng">
            {ROOM_DISPLAY_STATUSES.map((s) => (
              <div key={s} style={{ width: `${(stats.statusCounts[s] / rooms.length) * 100}%`, background: `var(--st-${s.replace("_", "-")})` }} title={`${s}: ${stats.statusCounts[s]}`} />
            ))}
          </div>
          <RoomStatusLegend counts={stats.statusCounts} />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Doanh thu 30 ngày</CardTitle>
              <CardDescription>Theo ngày phát sinh, chưa gồm phí dịch vụ & VAT</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenue30} margin={{ left: -8, right: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
                <YAxis {...axisProps} tickFormatter={formatVNDShort} width={56} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="Tiền phòng" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Dịch vụ" stackId="a" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Nguồn đặt phòng</CardTitle>
              <CardDescription>Đặt mới trong 30 ngày · {totalSources} booking</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.sources} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="var(--card)">
                    {stats.sources.map((s) => (
                      <Cell key={s.source} fill={SOURCE_COLOR[s.source]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip money={false} suffix=" booking" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {stats.sources.map((s) => (
                <li key={s.source} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ background: SOURCE_COLOR[s.source] }} />
                  <span className="truncate">{s.name}</span>
                  <span className="tabular ml-auto text-muted-foreground">{Math.round((s.value / (totalSources || 1)) * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ArrivalDepartureCard
          title="Khách đến hôm nay"
          icon={LogIn}
          rows={stats.arrivals}
          doneStatus="checked_in"
          actionHref="/front-desk/check-in"
          actionLabel="Check-in"
          guestById={guestById}
          roomById={roomById}
          roomTypes={roomTypes}
        />
        <ArrivalDepartureCard
          title="Khách đi hôm nay"
          icon={LogOut}
          rows={stats.departures}
          doneStatus="checked_out"
          actionHref="/front-desk/check-out"
          actionLabel="Check-out"
          guestById={guestById}
          roomById={roomById}
          roomTypes={roomTypes}
        />
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dự báo công suất 14 ngày</CardTitle>
              <CardDescription>Gồm booking đã xác nhận & tạm giữ</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.forecast} margin={{ left: -20, right: 4 }}>
                <defs>
                  <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" {...axisProps} interval={2} />
                <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip money={false} suffix="%" />} />
                <Area type="monotone" dataKey="Công suất" stroke="var(--chart-1)" strokeWidth={2} fill="url(#occ)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BrushCleaning className="size-4" /> Phòng cần dọn
              </CardTitle>
              <CardDescription>{dirtyRooms.length} phòng bẩn / đang dọn</CardDescription>
            </div>
            <Link href="/housekeeping" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Buồng phòng <ArrowRight />
            </Link>
          </CardHeader>
          <CardContent>
            {dirtyRooms.length === 0 ? (
              <EmptyState title="Tất cả phòng đã sạch" className="py-6" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {dirtyRooms.map((r) => (
                  <span key={r.id} className={cn("tabular rounded-md border px-2.5 py-1 text-sm font-medium", r.hkStatus === "dirty" ? "border-st-vacant-dirty/50 bg-st-vacant-dirty/10" : "border-st-cleaning/50 bg-st-cleaning/10")}>
                    {r.number}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-4" /> Sự cố đang mở
              </CardTitle>
              <CardDescription>{openTickets.length} ticket bảo trì</CardDescription>
            </div>
            <Link href="/maintenance" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Bảo trì <ArrowRight />
            </Link>
          </CardHeader>
          <CardContent>
            {openTickets.length === 0 ? (
              <EmptyState title="Không có sự cố" className="py-6" />
            ) : (
              <ul className="divide-y text-sm">
                {openTickets.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2">
                    <span className="tabular w-12 font-semibold">{roomById.get(t.roomId)?.number}</span>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <Badge variant={t.priority === "urgent" ? "danger" : t.priority === "high" ? "warning" : "muted"}>{t.priority === "urgent" ? "Khẩn" : t.priority === "high" ? "Cao" : "Thường"}</Badge>
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

function ArrivalDepartureCard({
  title,
  icon: Icon,
  rows,
  doneStatus,
  actionHref,
  actionLabel,
  guestById,
  roomById,
  roomTypes,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: ReturnType<typeof useStore.getState>["reservations"];
  doneStatus: "checked_in" | "checked_out";
  actionHref: string;
  actionLabel: string;
  guestById: Map<string, { fullName: string; vip: boolean }>;
  roomById: Map<string, { number: string }>;
  roomTypes: { id: string; code: string }[];
}) {
  const done = rows.filter((r) => r.status === doneStatus).length;
  const pending = rows.filter((r) => r.status !== doneStatus);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-4" /> {title}
          </CardTitle>
          <CardDescription>
            Đã xong {done}/{rows.length}
          </CardDescription>
        </div>
        <Link href={actionHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {actionLabel} <ArrowRight />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success" style={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} />
        </div>
        {pending.length === 0 ? (
          <EmptyState title="Đã xử lý hết" className="py-6" />
        ) : (
          <ul className="max-h-60 divide-y overflow-y-auto text-sm">
            {pending.map((r) => {
              const g = guestById.get(r.guestId);
              return (
                <li key={r.id}>
                  <Link href={`/reservations/${r.id}`} className="flex items-center gap-3 py-2 hover:bg-muted/40">
                    <span className="tabular w-10 font-semibold">{r.roomId ? roomById.get(r.roomId)?.number : "—"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {g?.fullName} {g?.vip && <Badge variant="warning" className="ml-1">VIP</Badge>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.code} · {roomTypes.find((t) => t.id === r.roomTypeId)?.code}
                      </span>
                    </span>
                    <ReservationStatusBadge status={r.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

