"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type FolioPayment } from "@hotel/shared";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { KpiCard } from "@/components/hotel/kpi-card";
import { useStore } from "@/lib/store";
import { dayjs, formatDateTime, formatVND, formatVNDShort } from "@/lib/utils";

type Row = FolioPayment & { reservationId: string };

export default function PaymentsPage() {
  const router = useRouter();
  const { folios, reservations, guests } = useStore();
  const [method, setMethod] = React.useState("all");
  const [from, setFrom] = React.useState(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
  const [to, setTo] = React.useState(dayjs().format("YYYY-MM-DD"));
  const all: Row[] = React.useMemo(() => folios.flatMap((f) => f.payments.map((p) => ({ ...p, reservationId: f.reservationId }))), [folios]);
  const data = all.filter((p) => {
    const d = dayjs(p.at).format("YYYY-MM-DD");
    return (method === "all" || p.method === method) && d >= from && d <= to;
  });
  const by = (m: string) => data.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0);
  const resById = new Map(reservations.map((r) => [r.id, r]));

  const columns: Column<Row>[] = [
    { key: "at", header: "Thời gian", cell: (p) => <span className="tabular whitespace-nowrap">{formatDateTime(p.at)}</span>, sortValue: (p) => p.at },
    { key: "res", header: "Đặt phòng", cell: (p) => <span className="text-primary">{resById.get(p.reservationId)?.code}</span>, sortValue: (p) => resById.get(p.reservationId)?.code ?? "" },
    { key: "guest", header: "Khách", cell: (p) => guests.find((g) => g.id === resById.get(p.reservationId)?.guestId)?.fullName, csv: (p) => guests.find((g) => g.id === resById.get(p.reservationId)?.guestId)?.fullName ?? "" },
    { key: "method", header: "Hình thức", cell: (p) => PAYMENT_METHOD_LABEL[p.method], sortValue: (p) => PAYMENT_METHOD_LABEL[p.method] },
    { key: "note", header: "Ghi chú", cell: (p) => <span className="text-xs text-muted-foreground">{p.note}</span>, csv: (p) => p.note ?? "" },
    { key: "by", header: "Người thu", cell: (p) => p.by, sortValue: (p) => p.by },
    { key: "amount", header: "Số tiền", cell: (p) => <b>{formatVND(p.amount)}</b>, sortValue: (p) => p.amount, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
  ];

  return (
    <>
      <PageHeader title="Thanh toán" description="Nhật ký thu tiền theo hình thức — dùng đối soát giao ca & ngân hàng" />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PAYMENT_METHODS.map((m, i) => (
          <KpiCard key={m} label={PAYMENT_METHOD_LABEL[m]} value={formatVNDShort(by(m))} tone={(["success", "info", "warning", "primary"] as const)[i]} sub={`${data.filter((p) => p.method === m).length} giao dịch`} />
        ))}
      </div>
      <DataTable
        data={data}
        columns={columns}
        rowKey={(p) => p.id}
        searchText={(p) => `${resById.get(p.reservationId)?.code} ${p.note ?? ""} ${p.by}`}
        onRowClick={(p) => router.push(`/reservations/${p.reservationId}`)}
        exportName={`thanh-toan-${from}-${to}`}
        initialSort={{ key: "at", dir: "desc" }}
        toolbar={
          <>
            <Select value={method} onChange={(e) => setMethod(e.target.value)} className="sm:w-40" aria-label="Hình thức">
              <option value="all">Mọi hình thức</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
            </Select>
            <div className="flex items-center gap-1.5">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-36" aria-label="Từ ngày" />
              <span className="text-muted-foreground">–</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-36" aria-label="Đến ngày" />
            </div>
          </>
        }
      />
    </>
  );
}
