"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { HK_STATUSES, HK_STATUS_LABEL, type HkStatus, type Room } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { HkStatusBadge, RoomStatusBadge } from "@/components/hotel/status-badges";
import { useStore } from "@/lib/store";
import { roomDisplayStatus } from "@/lib/selectors";
import { formatVND } from "@/lib/utils";

export default function RoomsPage() {
  const { rooms, roomTypes, reservations, setOutOfOrder } = useStore();
  const [editing, setEditing] = React.useState<Room | "new" | null>(null);
  const [type, setType] = React.useState("all");
  const data = rooms.filter((r) => type === "all" || r.roomTypeId === type);

  const columns: Column<Room>[] = [
    { key: "number", header: "Số phòng", cell: (r) => <span className="tabular font-semibold">{r.number}</span>, sortValue: (r) => r.number },
    { key: "floor", header: "Tầng", cell: (r) => r.floor, sortValue: (r) => r.floor, className: "tabular" },
    { key: "type", header: "Loại phòng", cell: (r) => roomTypes.find((t) => t.id === r.roomTypeId)?.name, sortValue: (r) => roomTypes.find((t) => t.id === r.roomTypeId)?.name ?? "" },
    { key: "rate", header: "Giá cơ bản", cell: (r) => formatVND(roomTypes.find((t) => t.id === r.roomTypeId)?.baseRate ?? 0), sortValue: (r) => roomTypes.find((t) => t.id === r.roomTypeId)?.baseRate ?? 0, className: "tabular text-right", headerClassName: "text-right" },
    { key: "status", header: "Trạng thái", cell: (r) => <RoomStatusBadge status={roomDisplayStatus(r, reservations)} />, csv: (r) => roomDisplayStatus(r, reservations) },
    { key: "hk", header: "Buồng phòng", cell: (r) => <HkStatusBadge status={r.hkStatus} />, sortValue: (r) => HK_STATUS_LABEL[r.hkStatus] },
    {
      key: "ooo",
      header: "Bảo trì",
      cell: (r) => <span onClick={(e) => e.stopPropagation()}><Switch checked={r.outOfOrder} onCheckedChange={(v) => { setOutOfOrder(r.id, v); toast(v ? `Đã khóa phòng ${r.number}` : `Đã mở phòng ${r.number}`); }} label={`Bảo trì phòng ${r.number}`} /></span>,
      csv: (r) => (r.outOfOrder ? "Có" : ""),
    },
    { key: "note", header: "Ghi chú", cell: (r) => <span className="text-xs text-muted-foreground">{r.note ?? ""}</span> },
    { key: "act", header: "", cell: (r) => <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setEditing(r); }} aria-label="Sửa"><Pencil /></Button> },
  ];

  return (
    <>
      <PageHeader title="Phòng" description={`${rooms.length} phòng · ${rooms.filter((r) => r.outOfOrder).length} đang bảo trì`} actions={<Button onClick={() => setEditing("new")}><Plus /> Thêm phòng</Button>} />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => r.number}
        searchPlaceholder="Số phòng…"
        exportName="danh-sach-phong"
        pageSize={25}
        initialSort={{ key: "number", dir: "asc" }}
        onRowClick={(r) => setEditing(r)}
        toolbar={
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-52" aria-label="Loại phòng">
            <option value="all">Tất cả loại phòng</option>
            {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        }
      />
      {editing && <RoomDialog room={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function RoomDialog({ room, onClose }: { room?: Room; onClose: () => void }) {
  const { rooms, roomTypes, upsertRoom } = useStore();
  const [v, setV] = React.useState<Room>(room ?? { id: "", number: "", floor: 1, roomTypeId: roomTypes[0].id, hkStatus: "clean", outOfOrder: false });
  const save = () => {
    if (!/^\d{3,4}$/.test(v.number)) return toast.error("Số phòng gồm 3–4 chữ số");
    if (rooms.some((r) => r.number === v.number && r.id !== v.id)) return toast.error("Số phòng đã tồn tại");
    upsertRoom({ ...v, id: v.id || `room-${v.number}` });
    toast.success(room ? "Đã cập nhật phòng" : "Đã thêm phòng");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>{room ? `Sửa phòng ${room.number}` : "Thêm phòng"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Số phòng" required><Input value={v.number} onChange={(e) => setV({ ...v, number: e.target.value })} /></Field>
          <Field label="Tầng"><Input type="number" min={1} value={v.floor} onChange={(e) => setV({ ...v, floor: Number(e.target.value) })} /></Field>
          <Field label="Loại phòng" className="col-span-2">
            <Select value={v.roomTypeId} onChange={(e) => setV({ ...v, roomTypeId: e.target.value })}>{roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
          </Field>
          <Field label="Trạng thái buồng" className="col-span-2">
            <Select value={v.hkStatus} onChange={(e) => setV({ ...v, hkStatus: e.target.value as HkStatus })}>{HK_STATUSES.map((s) => <option key={s} value={s}>{HK_STATUS_LABEL[s]}</option>)}</Select>
          </Field>
          <Field label="Ghi chú" className="col-span-2"><Input value={v.note ?? ""} onChange={(e) => setV({ ...v, note: e.target.value || undefined })} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
