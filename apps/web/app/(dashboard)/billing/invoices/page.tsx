"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@hotel/shared";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { KpiCard } from "@/components/hotel/kpi-card";
import { useStore } from "@/lib/store";
import { dayjs, formatDateTime, formatVND, formatVNDShort } from "@/lib/utils";

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, reservations } = useStore();
  const [month, setMonth] = React.useState(dayjs().format("YYYY-MM"));
  const data = invoices.filter((i) => !month || i.issuedAt.startsWith(month) || dayjs(i.issuedAt).format("YYYY-MM") === month);
  const sum = (k: keyof Pick<Invoice, "subtotal" | "serviceFee" | "vat" | "total">) => data.reduce((s, i) => s + i[k], 0);

  const columns: Column<Invoice>[] = [
    { key: "no", header: "Số HĐ", cell: (i) => <span className="font-medium text-primary">{i.number}</span>, sortValue: (i) => i.number },
    { key: "date", header: "Ngày xuất", cell: (i) => <span className="tabular whitespace-nowrap">{formatDateTime(i.issuedAt)}</span>, sortValue: (i) => i.issuedAt },
    { key: "buyer", header: "Người mua", cell: (i) => <span>{i.buyerName}{i.buyerTaxCode && <span className="block text-xs text-muted-foreground">MST {i.buyerTaxCode}</span>}</span>, sortValue: (i) => i.buyerName },
    { key: "res", header: "Đặt phòng", cell: (i) => reservations.find((r) => r.id === i.reservationId)?.code, csv: (i) => reservations.find((r) => r.id === i.reservationId)?.code ?? "" },
    { key: "sub", header: "Tiền hàng", cell: (i) => formatVND(i.subtotal), sortValue: (i) => i.subtotal, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "fee", header: "Phí DV", cell: (i) => formatVND(i.serviceFee), sortValue: (i) => i.serviceFee, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "vat", header: "VAT", cell: (i) => formatVND(i.vat), sortValue: (i) => i.vat, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "total", header: "Tổng thanh toán", cell: (i) => <b>{formatVND(i.total)}</b>, sortValue: (i) => i.total, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
  ];

  return (
    <>
      <PageHeader title="Hóa đơn" description="Hóa đơn bán hàng sau check-out · tích hợp hóa đơn điện tử (VNPT/Viettel/MISA) ở giai đoạn sau" />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Số hóa đơn" value={data.length} />
        <KpiCard label="Doanh thu trước thuế" value={formatVNDShort(sum("subtotal") + sum("serviceFee"))} tone="info" />
        <KpiCard label="Thuế VAT" value={formatVNDShort(sum("vat"))} tone="warning" />
        <KpiCard label="Tổng thanh toán" value={formatVNDShort(sum("total"))} tone="success" />
      </div>
      <DataTable
        data={data}
        columns={columns}
        rowKey={(i) => i.id}
        searchText={(i) => `${i.number} ${i.buyerName} ${i.buyerTaxCode ?? ""}`}
        onRowClick={(i) => router.push(`/billing/invoices/${i.id}`)}
        exportName={`hoa-don-${month}`}
        initialSort={{ key: "date", dir: "desc" }}
        toolbar={<Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="sm:w-44" aria-label="Tháng" />}
      />
    </>
  );
}
