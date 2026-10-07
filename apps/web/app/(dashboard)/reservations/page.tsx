"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { BOOKING_SOURCES, BOOKING_SOURCE_LABEL, RESERVATION_STATUSES, RESERVATION_STATUS_LABEL, type Reservation } from "@hotel/shared";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { ReservationStatusBadge, SourceBadge } from "@/components/hotel/status-badges";
import { useStore } from "@/lib/store";
import { folioTotals } from "@/lib/selectors";
import { formatDate, formatVND, nightsBetween } from "@/lib/utils";

export default function ReservationsPage() {
  return (
    <React.Suspense>
      <Reservations />
    </React.Suspense>
  );
}

function Reservations() {
  const router = useRouter();
  const params = useSearchParams();
  const { reservations, guests, rooms, roomTypes, folios, hotel } = useStore();
  const [status, setStatus] = React.useState(params.get("status") ?? "all");
  const [source, setSource] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [unassigned, setUnassigned] = React.useState(params.get("unassigned") === "1");

  const guestById = React.useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const roomById = React.useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const typeById = React.useMemo(() => new Map(roomTypes.map((t) => [t.id, t])), [roomTypes]);
  const folioByRes = React.useMemo(() => new Map(folios.map((f) => [f.reservationId, f])), [folios]);

  const data = reservations.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (source === "all" || r.source === source) &&
      (!from || r.checkIn >= from) &&
      (!to || r.checkIn <= to) &&
      (!unassigned || (!r.roomId && ["confirmed", "tentative"].includes(r.status))),
  );

  const columns: Column<Reservation>[] = [
    { key: "code", header: "Mã", cell: (r) => <span className="font-medium text-primary">{r.code}</span>, sortValue: (r) => r.code },
    {
      key: "guest",
      header: "Khách",
      cell: (r) => {
        const g = guestById.get(r.guestId);
        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {g?.fullName} {g?.vip && <Badge variant="warning">VIP</Badge>}
          </span>
        );
      },
      sortValue: (r) => guestById.get(r.guestId)?.fullName ?? "",
    },
    { key: "room", header: "Phòng", cell: (r) => (r.roomId ? <span className="tabular font-medium">{roomById.get(r.roomId)?.number}</span> : <Badge variant="warning">Chưa gán</Badge>), sortValue: (r) => roomById.get(r.roomId ?? "")?.number ?? "" },
    { key: "type", header: "Loại", cell: (r) => typeById.get(r.roomTypeId)?.code, sortValue: (r) => typeById.get(r.roomTypeId)?.code ?? "" },
    { key: "in", header: "Nhận phòng", cell: (r) => <span className="tabular whitespace-nowrap">{formatDate(r.checkIn)}</span>, sortValue: (r) => r.checkIn },
    { key: "out", header: "Trả phòng", cell: (r) => <span className="tabular whitespace-nowrap">{formatDate(r.checkOut)}</span>, sortValue: (r) => r.checkOut },
    { key: "nights", header: "Đêm", cell: (r) => nightsBetween(r.checkIn, r.checkOut), sortValue: (r) => nightsBetween(r.checkIn, r.checkOut), className: "tabular text-center" },
    { key: "source", header: "Nguồn", cell: (r) => <SourceBadge source={r.source} />, sortValue: (r) => BOOKING_SOURCE_LABEL[r.source] },
    { key: "total", header: "Tổng tiền", cell: (r) => formatVND(r.ratePerNight * nightsBetween(r.checkIn, r.checkOut)), sortValue: (r) => r.ratePerNight * nightsBetween(r.checkIn, r.checkOut), className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    {
      key: "balance",
      header: "Số dư",
      cell: (r) => {
        const b = folioTotals(folioByRes.get(r.id), hotel).balance;
        return r.status === "checked_in" ? <span className={b > 0 ? "text-danger" : "text-success"}>{formatVND(b)}</span> : <span className="text-muted-foreground">—</span>;
      },
      csv: (r) => folioTotals(folioByRes.get(r.id), hotel).balance,
      className: "tabular text-right whitespace-nowrap",
      headerClassName: "text-right",
    },
    { key: "status", header: "Trạng thái", cell: (r) => <ReservationStatusBadge status={r.status} />, sortValue: (r) => RESERVATION_STATUS_LABEL[r.status] },
  ];

  return (
    <>
      <PageHeader
        title="Đặt phòng"
        description={`${reservations.length} đặt phòng trong hệ thống`}
        actions={
          <Link href="/reservations/new" className={buttonVariants()}>
            <Plus /> Đặt phòng mới
          </Link>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.code} ${guestById.get(r.guestId)?.fullName} ${guestById.get(r.guestId)?.phone} ${roomById.get(r.roomId ?? "")?.number ?? ""}`}
        searchPlaceholder="Mã, tên khách, SĐT, số phòng…"
        onRowClick={(r) => router.push(`/reservations/${r.id}`)}
        exportName="dat-phong"
        initialSort={{ key: "in", dir: "desc" }}
        toolbar={
          <>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" aria-label="Trạng thái">
              <option value="all">Mọi trạng thái</option>
              {RESERVATION_STATUSES.map((s) => (
                <option key={s} value={s}>{RESERVATION_STATUS_LABEL[s]}</option>
              ))}
            </Select>
            <Select value={source} onChange={(e) => setSource(e.target.value)} className="sm:w-40" aria-label="Nguồn">
              <option value="all">Mọi nguồn</option>
              {BOOKING_SOURCES.map((s) => (
                <option key={s} value={s}>{BOOKING_SOURCE_LABEL[s]}</option>
              ))}
            </Select>
            <div className="flex items-center gap-1.5">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-36" aria-label="Nhận phòng từ ngày" />
              <span className="text-muted-foreground">–</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-36" aria-label="Nhận phòng đến ngày" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} /> Chưa gán phòng
            </label>
          </>
        }
      />
    </>
  );
}
