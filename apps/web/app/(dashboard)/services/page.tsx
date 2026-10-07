"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { CHARGE_CATEGORIES, CHARGE_CATEGORY_LABEL, type ChargeCategory, type Service } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { useStore } from "@/lib/store";
import { formatVND, uid } from "@/lib/utils";

export default function ServicesPage() {
  const { services, upsertService } = useStore();
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [cat, setCat] = React.useState("all");
  const columns: Column<Service>[] = [
    { key: "name", header: "Dịch vụ", cell: (s) => <span className="font-medium">{s.name}</span>, sortValue: (s) => s.name },
    { key: "cat", header: "Nhóm", cell: (s) => CHARGE_CATEGORY_LABEL[s.category], sortValue: (s) => CHARGE_CATEGORY_LABEL[s.category] },
    { key: "price", header: "Đơn giá", cell: (s) => formatVND(s.price), sortValue: (s) => s.price, className: "tabular text-right", headerClassName: "text-right" },
    { key: "unit", header: "Đơn vị", cell: (s) => s.unit, sortValue: (s) => s.unit },
    { key: "active", header: "Đang bán", cell: (s) => <span onClick={(e) => e.stopPropagation()}><Switch checked={s.active} onCheckedChange={(v) => upsertService({ ...s, active: v })} label={`Bán ${s.name}`} /></span> },
    { key: "act", header: "", cell: (s) => <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setEditing(s); }} aria-label="Sửa"><Pencil /></Button> },
  ];
  return (
    <>
      <PageHeader title="Dịch vụ" description="Minibar, giặt ủi, nhà hàng, đưa đón, spa, phụ thu — ghi vào folio phòng" actions={<Button onClick={() => setEditing({ id: "", name: "", category: "minibar", price: 0, unit: "", active: true })}><Plus /> Thêm dịch vụ</Button>} />
      <DataTable
        data={services.filter((s) => cat === "all" || s.category === cat)}
        columns={columns}
        rowKey={(s) => s.id}
        searchText={(s) => s.name}
        exportName="dich-vu"
        onRowClick={setEditing}
        toolbar={<Select value={cat} onChange={(e) => setCat(e.target.value)} className="sm:w-44" aria-label="Nhóm"><option value="all">Mọi nhóm</option>{CHARGE_CATEGORIES.filter((c) => c !== "room").map((c) => <option key={c} value={c}>{CHARGE_CATEGORY_LABEL[c]}</option>)}</Select>}
      />
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent size="sm">
            <DialogHeader><DialogTitle>{editing.id ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên dịch vụ" className="col-span-2"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Nhóm" className="col-span-2"><Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as ChargeCategory })}>{CHARGE_CATEGORIES.filter((c) => c !== "room").map((c) => <option key={c} value={c}>{CHARGE_CATEGORY_LABEL[c]}</option>)}</Select></Field>
              <Field label="Đơn giá (₫)"><Input type="number" step={1000} min={0} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Field>
              <Field label="Đơn vị"><Input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} placeholder="chai, lượt…" /></Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
              <Button onClick={() => { if (!editing.name || editing.price <= 0) return toast.error("Nhập tên và đơn giá"); upsertService({ ...editing, id: editing.id || uid("sv-") }); toast.success("Đã lưu dịch vụ"); setEditing(null); }}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
