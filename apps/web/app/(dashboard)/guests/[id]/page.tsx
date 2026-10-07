"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CalendarPlus, Crown, Mail, MapPin, Pencil, Phone, Plus, X } from "lucide-react";
import { ID_TYPE_LABEL } from "@hotel/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Switch } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { KpiCard } from "@/components/hotel/kpi-card";
import { GuestFormDialog } from "@/components/hotel/guest-form-dialog";
import { ReservationStatusBadge, SourceBadge } from "@/components/hotel/status-badges";
import { useStore } from "@/lib/store";
import { guestStatsMap } from "@/lib/guest-stats";
import { folioTotals } from "@/lib/selectors";
import { formatDate, formatVND, formatVNDShort, initials, nightsBetween } from "@/lib/utils";

export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { guests, reservations, folios, hotel, rooms, companies, upsertGuest } = useStore();
  const g = guests.find((x) => x.id === id);
  const [editing, setEditing] = React.useState(false);
  const [tag, setTag] = React.useState("");

  if (!g) return <Card><EmptyState title="Không tìm thấy khách hàng" action={<Link href="/guests" className={buttonVariants({ variant: "outline" })}>Về danh sách</Link>} /></Card>;

  const stats = guestStatsMap(reservations, folios, hotel).get(g.id) ?? { stays: 0, nights: 0, spent: 0 };
  const history = reservations.filter((r) => r.guestId === g.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const company = companies.find((c) => c.id === g.companyId);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Khách hàng", href: "/guests" }, { label: g.fullName }]}
        title={<span className="flex flex-wrap items-center gap-2">{g.fullName} {g.vip && <Badge variant="warning"><Crown className="size-3" /> VIP</Badge>} {g.blacklisted && <Badge variant="danger"><Ban className="size-3" /> Danh sách đen</Badge>}</span>}
        description={`Khách từ ${formatDate(g.createdAt)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Sửa</Button>
            <Button disabled={g.blacklisted} onClick={() => router.push(`/reservations/new`)}><CalendarPlus /> Đặt phòng</Button>
          </>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 pt-5 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/12 text-xl font-semibold text-primary">{initials(g.fullName)}</span>
              <p className="font-semibold">{g.fullName}</p>
              <p className="text-xs text-muted-foreground">{g.gender === "male" ? "Nam" : g.gender === "female" ? "Nữ" : "Khác"}{g.dob && ` · ${formatDate(g.dob)}`} · {g.nationality}</p>
            </CardContent>
            <CardContent className="space-y-2 border-t pt-4 text-sm">
              <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {g.phone}</p>
              {g.email && <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> {g.email}</p>}
              {g.address && <p className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> {g.address}</p>}
              <p className="text-muted-foreground">{ID_TYPE_LABEL[g.idType]}: <span className="tabular text-foreground">{g.idNumber}</span></p>
              {company && <p className="text-muted-foreground">Công ty: <span className="text-foreground">{company.name}</span></p>}
            </CardContent>
            <CardContent className="space-y-3 border-t pt-4 text-sm">
              <label className="flex items-center justify-between">Khách VIP <Switch checked={g.vip} onCheckedChange={(v) => { upsertGuest({ ...g, vip: v }); toast.success(v ? "Đã gắn VIP" : "Đã bỏ VIP"); }} label="VIP" /></label>
              <label className="flex items-center justify-between">Danh sách đen <Switch checked={g.blacklisted} onCheckedChange={(v) => { upsertGuest({ ...g, blacklisted: v }); toast(v ? "Đã đưa vào danh sách đen" : "Đã gỡ khỏi danh sách đen"); }} label="Danh sách đen" /></label>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sở thích & ghi chú</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {g.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">{t}<button onClick={() => upsertGuest({ ...g, tags: g.tags.filter((x) => x !== t) })} aria-label={`Xóa ${t}`}><X className="size-3" /></button></Badge>
                ))}
                {g.tags.length === 0 && <span className="text-sm text-muted-foreground">Chưa có</span>}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (tag.trim()) { upsertGuest({ ...g, tags: [...g.tags, tag.trim()] }); setTag(""); } }}>
                <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="VD: Gối cao, không hút thuốc" />
                <Button type="submit" variant="outline" size="icon" aria-label="Thêm sở thích"><Plus /></Button>
              </form>
              {g.notes && <p className="rounded-md bg-muted/50 p-2 text-sm">{g.notes}</p>}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Số lần lưu trú" value={stats.stays} />
            <KpiCard label="Tổng số đêm" value={stats.nights} tone="info" />
            <KpiCard label="Tổng chi tiêu" value={formatVNDShort(stats.spent)} tone="success" />
            <KpiCard label="Chi tiêu TB / lượt" value={formatVNDShort(stats.stays ? stats.spent / stats.stays : 0)} tone="warning" />
          </div>
          <Card>
            <CardHeader><CardTitle>Lịch sử đặt phòng</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? <EmptyState title="Chưa có đặt phòng" /> : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <THead><tr><TH>Mã</TH><TH>Phòng</TH><TH>Thời gian</TH><TH>Nguồn</TH><TH className="text-right">Tổng</TH><TH>Trạng thái</TH></tr></THead>
                    <TBody>
                      {history.map((r) => (
                        <TR key={r.id} className="cursor-pointer" onClick={() => router.push(`/reservations/${r.id}`)}>
                          <TD className="font-medium text-primary">{r.code}</TD>
                          <TD className="tabular">{rooms.find((x) => x.id === r.roomId)?.number ?? "—"}</TD>
                          <TD className="tabular whitespace-nowrap">{formatDate(r.checkIn)} → {formatDate(r.checkOut)} <span className="text-muted-foreground">({nightsBetween(r.checkIn, r.checkOut)}đ)</span></TD>
                          <TD><SourceBadge source={r.source} /></TD>
                          <TD className="tabular whitespace-nowrap text-right">{formatVND(folioTotals(folios.find((f) => f.reservationId === r.id), hotel).total || r.ratePerNight * nightsBetween(r.checkIn, r.checkOut))}</TD>
                          <TD><ReservationStatusBadge status={r.status} /></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <GuestFormDialog key={g.id + String(editing)} open={editing} onOpenChange={setEditing} guest={g} />
    </>
  );
}
