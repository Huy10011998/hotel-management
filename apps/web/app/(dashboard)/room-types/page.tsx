"use client";

import * as React from "react";
import { toast } from "sonner";
import { BedDouble, Maximize2, Pencil, Plus, Users } from "lucide-react";
import type { RoomType } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { useStore } from "@/lib/store";
import { formatVND, uid } from "@/lib/utils";

export default function RoomTypesPage() {
  const { roomTypes, rooms } = useStore();
  const [editing, setEditing] = React.useState<RoomType | "new" | null>(null);
  return (
    <>
      <PageHeader title="Loại phòng" description="Hạng phòng, sức chứa, tiện nghi và giá cơ bản" actions={<Button onClick={() => setEditing("new")}><Plus /> Thêm loại phòng</Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roomTypes.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <div className="flex h-28 items-end rounded-t-xl bg-gradient-to-br from-primary/25 via-primary/10 to-chart-2/20 p-4">
              <Badge variant="secondary" className="bg-card/90">{t.code}</Badge>
            </div>
            <CardHeader>
              <div>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="size-4" /> {t.maxAdults} NL + {t.maxChildren} TE</span>
                <span className="flex items-center gap-1"><Maximize2 className="size-4" /> {t.areaM2} m²</span>
                <span className="flex items-center gap-1"><BedDouble className="size-4" /> {t.bedType}</span>
              </div>
              <div className="flex flex-wrap gap-1">{t.amenities.map((a) => <Badge key={a} variant="muted">{a}</Badge>)}</div>
            </CardContent>
            <CardFooter className="justify-between">
              <div>
                <p className="tabular text-lg font-semibold">{formatVND(t.baseRate)}<span className="text-xs font-normal text-muted-foreground">/đêm</span></p>
                <p className="text-xs text-muted-foreground">{rooms.filter((r) => r.roomTypeId === t.id).length} phòng · phụ thu {formatVND(t.extraAdultFee)}/người</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(t)}><Pencil /> Sửa</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {editing && <RoomTypeDialog rt={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function RoomTypeDialog({ rt, onClose }: { rt?: RoomType; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertRoomType);
  const [v, setV] = React.useState<RoomType>(rt ?? { id: "", code: "", name: "", maxAdults: 2, maxChildren: 1, bedType: "", areaM2: 25, baseRate: 1_000_000, extraAdultFee: 250_000, amenities: ["Wi-Fi", "Điều hòa"], description: "" });
  const [amen, setAmen] = React.useState(v.amenities.join(", "));
  const save = () => {
    if (!v.code.trim() || !v.name.trim()) return toast.error("Nhập mã và tên loại phòng");
    upsert({ ...v, id: v.id || uid("rt-"), amenities: amen.split(",").map((s) => s.trim()).filter(Boolean) });
    toast.success("Đã lưu loại phòng");
    onClose();
  };
  const num = (k: keyof RoomType) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader><DialogTitle>{rt ? `Sửa ${rt.name}` : "Thêm loại phòng"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mã" required><Input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} maxLength={5} /></Field>
          <Field label="Tên" required className="sm:col-span-2"><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
          <Field label="Người lớn tối đa"><Input type="number" min={1} value={v.maxAdults} onChange={num("maxAdults")} /></Field>
          <Field label="Trẻ em tối đa"><Input type="number" min={0} value={v.maxChildren} onChange={num("maxChildren")} /></Field>
          <Field label="Diện tích (m²)"><Input type="number" min={5} value={v.areaM2} onChange={num("areaM2")} /></Field>
          <Field label="Giá cơ bản (₫/đêm)"><Input type="number" step={10000} value={v.baseRate} onChange={num("baseRate")} /></Field>
          <Field label="Phụ thu người lớn (₫)"><Input type="number" step={10000} value={v.extraAdultFee} onChange={num("extraAdultFee")} /></Field>
          <Field label="Loại giường"><Input value={v.bedType} onChange={(e) => setV({ ...v, bedType: e.target.value })} /></Field>
          <Field label="Tiện nghi (phân cách dấu phẩy)" className="sm:col-span-3"><Input value={amen} onChange={(e) => setAmen(e.target.value)} /></Field>
          <Field label="Mô tả" className="sm:col-span-3"><Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={2} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
