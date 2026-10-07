"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Folio } from "@hotel/shared";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { KpiCard } from "@/components/hotel/kpi-card";
import { useStore } from "@/lib/store";
import { folioTotals } from "@/lib/selectors";
import { formatDate, formatVND, formatVNDShort } from "@/lib/utils";

export default function FoliosPage() {
  const router = useRouter();
  const { folios, reservations, guests, rooms, hotel } = useStore();
  const [status, setStatus] = React.useState("open");
  const resById = React.useMemo(() => new Map(reservations.map((r) => [r.id, r])), [reservations]);
  const guestById = React.useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const relevant = folios.filter((f) => f.charges.length || f.payments.length);
  const data = relevant.filter((f) => status === "all" || f.status === status || (status === "debt" && folioTotals(f, hotel).balance > 0 && f.status === "open"));
  const open = relevant.filter((f) => f.status === "open");
  const openBalance = open.reduce((s, f) => s + Math.max(0, folioTotals(f, hotel).balance), 0);
  const deposits = open.filter((f) => resById.get(f.reservationId)?.status !== "checked_in").reduce((s, f) => s + folioTotals(f, hotel).paid, 0);

  const columns: Column<Folio>[] = [
    { key: "code", header: "Đặt phòng", cell: (f) => <span className="font-medium text-primary">{resById.get(f.reservationId)?.code}</span>, sortValue: (f) => resById.get(f.reservationId)?.code ?? "" },
    { key: "guest", header: "Khách", cell: (f) => guestById.get(resById.get(f.reservationId)?.guestId ?? "")?.fullName, sortValue: (f) => guestById.get(resById.get(f.reservationId)?.guestId ?? "")?.fullName ?? "" },
    { key: "room", header: "Phòng", cell: (f) => <span className="tabular">{rooms.find((r) => r.id === resById.get(f.reservationId)?.roomId)?.number ?? "—"}</span>, sortValue: (f) => rooms.find((r) => r.id === resById.get(f.reservationId)?.roomId)?.number ?? "" },
    { key: "stay", header: "Lưu trú", cell: (f) => { const r = resById.get(f.reservationId); return r ? <span className="tabular whitespace-nowrap">{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</span> : null; }, sortValue: (f) => resById.get(f.reservationId)?.checkIn ?? "" },
    { key: "total", header: "Tổng cộng", cell: (f) => formatVND(folioTotals(f, hotel).total), sortValue: (f) => folioTotals(f, hotel).total, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "paid", header: "Đã thu", cell: (f) => formatVND(folioTotals(f, hotel).paid), sortValue: (f) => folioTotals(f, hotel).paid, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "bal", header: "Số dư", cell: (f) => { const b = folioTotals(f, hotel).balance; return <span className={b > 0 ? "font-medium text-danger" : "text-success"}>{formatVND(b)}</span>; }, sortValue: (f) => folioTotals(f, hotel).balance, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "st", header: "Trạng thái", cell: (f) => (f.status === "open" ? <Badge variant="success">Đang mở</Badge> : <Badge variant="muted">Đã đóng</Badge>), sortValue: (f) => f.status },
  ];
  return (
    <>
      <PageHeader title="Folio" description="Sổ phát sinh & thanh toán theo từng đặt phòng" />
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Folio đang mở" value={open.length} />
        <KpiCard label="Công nợ phòng đang ở" value={formatVNDShort(openBalance)} tone="danger" />
        <KpiCard label="Tiền cọc đang giữ" value={formatVNDShort(deposits)} tone="info" sub="Booking chưa check-in" />
      </div>
      <DataTable
        data={data}
        columns={columns}
        rowKey={(f) => f.id}
        searchText={(f) => `${resById.get(f.reservationId)?.code} ${guestById.get(resById.get(f.reservationId)?.guestId ?? "")?.fullName}`}
        onRowClick={(f) => router.push(`/reservations/${f.reservationId}`)}
        exportName="folio"
        initialSort={{ key: "bal", dir: "desc" }}
        toolbar={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44" aria-label="Trạng thái">
            <option value="open">Đang mở</option>
            <option value="debt">Còn nợ</option>
            <option value="closed">Đã đóng</option>
            <option value="all">Tất cả</option>
          </Select>
        }
      />
    </>
  );
}
