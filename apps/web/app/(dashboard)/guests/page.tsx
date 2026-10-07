"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Crown, UserPlus } from "lucide-react";
import { ID_TYPE_LABEL, type Guest } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { GuestFormDialog } from "@/components/hotel/guest-form-dialog";
import { KpiCard } from "@/components/hotel/kpi-card";
import { useStore } from "@/lib/store";
import { guestStatsMap } from "@/lib/guest-stats";
import { formatDate, formatVND, formatVNDShort, initials } from "@/lib/utils";

export default function GuestsPage() {
  const router = useRouter();
  const { guests, reservations, folios, hotel, companies } = useStore();
  const [filter, setFilter] = React.useState("all");
  const [creating, setCreating] = React.useState(false);
  const stats = React.useMemo(() => guestStatsMap(reservations, folios, hotel), [reservations, folios, hotel]);

  const data = guests.filter(
    (g) =>
      filter === "all" ||
      (filter === "vip" && g.vip) ||
      (filter === "black" && g.blacklisted) ||
      (filter === "foreign" && g.nationality !== "Việt Nam") ||
      (filter === "company" && g.companyId) ||
      (filter === "repeat" && (stats.get(g.id)?.stays ?? 0) >= 2),
  );

  const columns: Column<Guest>[] = [
    {
      key: "name",
      header: "Khách hàng",
      cell: (g) => (
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{initials(g.fullName)}</span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 whitespace-nowrap font-medium">
              {g.fullName}
              {g.vip && <Crown className="size-3.5 text-warning" aria-label="VIP" />}
              {g.blacklisted && <Ban className="size-3.5 text-danger" aria-label="Danh sách đen" />}
            </span>
            <span className="block text-xs text-muted-foreground">{g.email ?? "—"}</span>
          </span>
        </span>
      ),
      sortValue: (g) => g.fullName,
    },
    { key: "phone", header: "Điện thoại", cell: (g) => <span className="tabular">{g.phone}</span>, sortValue: (g) => g.phone },
    { key: "id", header: "Giấy tờ", cell: (g) => <span className="tabular text-xs">{ID_TYPE_LABEL[g.idType]} {g.idNumber}</span>, csv: (g) => g.idNumber },
    { key: "nat", header: "Quốc tịch", cell: (g) => g.nationality, sortValue: (g) => g.nationality },
    { key: "company", header: "Công ty", cell: (g) => <span className="text-xs">{companies.find((c) => c.id === g.companyId)?.name ?? "—"}</span>, csv: (g) => companies.find((c) => c.id === g.companyId)?.name ?? "" },
    { key: "stays", header: "Lượt ở", cell: (g) => stats.get(g.id)?.stays ?? 0, sortValue: (g) => stats.get(g.id)?.stays ?? 0, className: "tabular text-center" },
    { key: "spent", header: "Tổng chi tiêu", cell: (g) => formatVND(stats.get(g.id)?.spent ?? 0), sortValue: (g) => stats.get(g.id)?.spent ?? 0, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
    { key: "last", header: "Lần gần nhất", cell: (g) => { const l = stats.get(g.id)?.lastStay; return l ? formatDate(l) : "—"; }, sortValue: (g) => stats.get(g.id)?.lastStay ?? "", className: "tabular" },
  ];

  const repeat = [...stats.values()].filter((s) => s.stays >= 2).length;
  const totalSpent = [...stats.values()].reduce((a, s) => a + s.spent, 0);

  return (
    <>
      <PageHeader title="Khách hàng" description="Hồ sơ khách, lịch sử lưu trú, phân loại VIP / danh sách đen" actions={<Button onClick={() => setCreating(true)}><UserPlus /> Thêm khách</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Tổng khách" value={guests.length} />
        <KpiCard label="Khách VIP" value={guests.filter((g) => g.vip).length} tone="warning" />
        <KpiCard label="Khách quay lại" value={repeat} sub={`${Math.round((repeat / (stats.size || 1)) * 100)}% khách đã ở`} tone="success" />
        <KpiCard label="Tổng chi tiêu" value={formatVNDShort(totalSpent)} tone="info" />
      </div>
      <DataTable
        data={data}
        columns={columns}
        rowKey={(g) => g.id}
        searchText={(g) => `${g.fullName} ${g.phone} ${g.email ?? ""} ${g.idNumber}`}
        searchPlaceholder="Tên, SĐT, email, số giấy tờ…"
        onRowClick={(g) => router.push(`/guests/${g.id}`)}
        exportName="khach-hang"
        initialSort={{ key: "spent", dir: "desc" }}
        toolbar={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-48" aria-label="Phân loại">
            <option value="all">Tất cả khách</option>
            <option value="vip">VIP</option>
            <option value="repeat">Khách quay lại (≥2 lần)</option>
            <option value="foreign">Khách nước ngoài</option>
            <option value="company">Khách công ty</option>
            <option value="black">Danh sách đen</option>
          </Select>
        }
      />
      <GuestFormDialog open={creating} onOpenChange={setCreating} onSaved={(g) => router.push(`/guests/${g.id}`)} />
    </>
  );
}
