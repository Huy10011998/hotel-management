"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { MEAL_PLANS, MEAL_PLAN_LABEL, type MealPlan, type RatePlan, type RateRule } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Switch } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { useStore } from "@/lib/store";
import { nightlyRate } from "@/lib/selectors";
import { cn, dayjs, formatDate, formatVNDShort, toDateOnly, uid } from "@/lib/utils";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function RatesPage() {
  return (
    <>
      <PageHeader title="Giá phòng" description="Giá theo loại phòng × gói giá × quy tắc mùa / ngày lễ / cuối tuần" />
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar"><CalendarDays /> Lịch giá</TabsTrigger>
          <TabsTrigger value="plans">Gói giá</TabsTrigger>
          <TabsTrigger value="rules">Quy tắc mùa & lễ</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar"><RateCalendar /></TabsContent>
        <TabsContent value="plans"><RatePlans /></TabsContent>
        <TabsContent value="rules"><RateRules /></TabsContent>
      </Tabs>
    </>
  );
}

function RateCalendar() {
  const { roomTypes, ratePlans, rateRules } = useStore();
  const [planId, setPlanId] = React.useState(ratePlans[0].id);
  const [start, setStart] = React.useState(toDateOnly(dayjs()));
  const plan = ratePlans.find((p) => p.id === planId);
  const dates = Array.from({ length: 21 }, (_, i) => dayjs(start).add(i, "day"));
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Lịch giá 21 ngày</CardTitle>
          <CardDescription>Màu cam: cao hơn giá cơ bản · xanh: thấp hơn. Giá đã làm tròn 10.000 ₫.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-56" aria-label="Gói giá">
            {ratePlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" aria-label="Từ ngày" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="sticky left-0 z-10 min-w-36 bg-muted px-3 py-2 text-left font-medium">Loại phòng</th>
                {dates.map((d) => (
                  <th key={d.format()} className={cn("min-w-16 px-1 py-2 text-center font-medium", (d.day() === 5 || d.day() === 6) && "bg-warning/10")}>
                    <div className="capitalize text-muted-foreground">{d.format("dd")}</div>
                    <div className="tabular">{d.format("DD/MM")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2">
                    <p className="font-medium">{t.name}</p>
                    <p className="tabular text-muted-foreground">Gốc {formatVNDShort(t.baseRate)}</p>
                  </td>
                  {dates.map((d) => {
                    const rate = nightlyRate(t, plan, toDateOnly(d), rateRules);
                    return (
                      <td key={d.format()} className={cn("tabular px-1 py-2 text-center", rate > t.baseRate && "bg-warning/12 font-medium", rate < t.baseRate && "bg-success/10 font-medium")}>
                        {formatVNDShort(rate)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RatePlans() {
  const { ratePlans, upsertRatePlan } = useStore();
  const [editing, setEditing] = React.useState<RatePlan | null>(null);
  return (
    <Card>
      <CardHeader>
        <div><CardTitle>Gói giá</CardTitle><CardDescription>% điều chỉnh so với giá cơ bản của loại phòng</CardDescription></div>
        <Button size="sm" onClick={() => setEditing({ id: "", code: "", name: "", mealPlan: "breakfast", adjustPercent: 0, refundable: true, active: true })}><Plus /> Thêm gói</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <THead><tr><TH>Mã</TH><TH>Tên gói</TH><TH>Bữa ăn</TH><TH className="text-right">Điều chỉnh</TH><TH>Hoàn hủy</TH><TH>Kích hoạt</TH></tr></THead>
            <TBody>
              {ratePlans.map((p) => (
                <TR key={p.id} className="cursor-pointer" onClick={() => setEditing(p)}>
                  <TD className="font-semibold">{p.code}</TD>
                  <TD>{p.name}</TD>
                  <TD>{MEAL_PLAN_LABEL[p.mealPlan]}</TD>
                  <TD className={cn("tabular text-right font-medium", p.adjustPercent > 0 && "text-warning", p.adjustPercent < 0 && "text-success")}>{p.adjustPercent > 0 ? "+" : ""}{p.adjustPercent}%</TD>
                  <TD>{p.refundable ? <Badge variant="success">Được hoàn</Badge> : <Badge variant="danger">Không hoàn</Badge>}</TD>
                  <TD onClick={(e) => e.stopPropagation()}><Switch checked={p.active} onCheckedChange={(v) => upsertRatePlan({ ...p, active: v })} label={`Kích hoạt ${p.name}`} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </CardContent>
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent size="sm">
            <DialogHeader><DialogTitle>{editing.id ? "Sửa gói giá" : "Thêm gói giá"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mã"><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></Field>
              <Field label="Điều chỉnh (%)"><Input type="number" value={editing.adjustPercent} onChange={(e) => setEditing({ ...editing, adjustPercent: Number(e.target.value) })} /></Field>
              <Field label="Tên gói" className="col-span-2"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Bữa ăn" className="col-span-2"><Select value={editing.mealPlan} onChange={(e) => setEditing({ ...editing, mealPlan: e.target.value as MealPlan })}>{MEAL_PLANS.map((m) => <option key={m} value={m}>{MEAL_PLAN_LABEL[m]}</option>)}</Select></Field>
              <label className="col-span-2 flex items-center gap-2 text-sm"><Checkbox checked={editing.refundable} onChange={(e) => setEditing({ ...editing, refundable: e.target.checked })} /> Cho phép hoàn hủy</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
              <Button onClick={() => { if (!editing.code || !editing.name) return toast.error("Nhập mã và tên"); upsertRatePlan({ ...editing, id: editing.id || uid("rp-") }); toast.success("Đã lưu gói giá"); setEditing(null); }}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function RateRules() {
  const { rateRules, roomTypes, upsertRateRule, removeRateRule } = useStore();
  const [editing, setEditing] = React.useState<RateRule | null>(null);
  return (
    <Card>
      <CardHeader>
        <div><CardTitle>Quy tắc giá</CardTitle><CardDescription>Cộng dồn % lên giá gói khi thỏa điều kiện ngày</CardDescription></div>
        <Button size="sm" onClick={() => setEditing({ id: "", name: "", weekdays: [], adjustPercent: 10, roomTypeIds: [], active: true })}><Plus /> Thêm quy tắc</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <THead><tr><TH>Tên</TH><TH>Khoảng ngày</TH><TH>Thứ</TH><TH>Áp dụng</TH><TH className="text-right">Điều chỉnh</TH><TH>Bật</TH><TH /></tr></THead>
            <TBody>
              {rateRules.map((r) => (
                <TR key={r.id} className="cursor-pointer" onClick={() => setEditing(r)}>
                  <TD className="font-medium">{r.name}</TD>
                  <TD className="tabular whitespace-nowrap text-xs">{r.from ? `${formatDate(r.from)} → ${r.to ? formatDate(r.to) : "…"}` : "Mọi ngày"}</TD>
                  <TD className="text-xs">{r.weekdays.length ? r.weekdays.map((d) => WEEKDAYS[d]).join(", ") : "Tất cả"}</TD>
                  <TD className="text-xs">{r.roomTypeIds.length ? r.roomTypeIds.map((id) => roomTypes.find((t) => t.id === id)?.code).join(", ") : "Mọi loại phòng"}</TD>
                  <TD className={cn("tabular text-right font-medium", r.adjustPercent > 0 ? "text-warning" : "text-success")}>{r.adjustPercent > 0 ? "+" : ""}{r.adjustPercent}%</TD>
                  <TD onClick={(e) => e.stopPropagation()}><Switch checked={r.active} onCheckedChange={(v) => upsertRateRule({ ...r, active: v })} label={`Bật ${r.name}`} /></TD>
                  <TD onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon-sm" onClick={() => { removeRateRule(r.id); toast("Đã xóa quy tắc"); }} aria-label="Xóa"><Trash2 /></Button></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </CardContent>
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Sửa quy tắc" : "Thêm quy tắc giá"}</DialogTitle><DialogDescription>Để trống khoảng ngày = áp dụng mọi ngày; bỏ chọn thứ = mọi thứ.</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên quy tắc" className="col-span-2"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="VD: Lễ 30/4 – 1/5" /></Field>
              <Field label="Từ ngày"><Input type="date" value={editing.from ?? ""} onChange={(e) => setEditing({ ...editing, from: e.target.value || undefined })} /></Field>
              <Field label="Đến ngày"><Input type="date" value={editing.to ?? ""} onChange={(e) => setEditing({ ...editing, to: e.target.value || undefined })} /></Field>
              <Field label="Áp dụng các thứ" className="col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((w, i) => {
                    const on = editing.weekdays.includes(i);
                    return <button key={w} type="button" onClick={() => setEditing({ ...editing, weekdays: on ? editing.weekdays.filter((x) => x !== i) : [...editing.weekdays, i] })} className={cn("h-8 w-10 rounded-md border text-xs", on && "border-primary bg-primary/10 font-medium text-primary")}>{w}</button>;
                  })}
                </div>
              </Field>
              <Field label="Loại phòng áp dụng" className="col-span-2">
                <div className="flex flex-wrap gap-3">
                  {roomTypes.map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 text-sm"><Checkbox checked={editing.roomTypeIds.includes(t.id)} onChange={(e) => setEditing({ ...editing, roomTypeIds: e.target.checked ? [...editing.roomTypeIds, t.id] : editing.roomTypeIds.filter((x) => x !== t.id) })} />{t.code}</label>
                  ))}
                </div>
              </Field>
              <Field label="Điều chỉnh (%)" hint="Số âm để giảm giá"><Input type="number" value={editing.adjustPercent} onChange={(e) => setEditing({ ...editing, adjustPercent: Number(e.target.value) })} /></Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
              <Button onClick={() => { if (!editing.name) return toast.error("Nhập tên quy tắc"); upsertRateRule({ ...editing, id: editing.id || uid("rr-") }); toast.success("Đã lưu quy tắc"); setEditing(null); }}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

