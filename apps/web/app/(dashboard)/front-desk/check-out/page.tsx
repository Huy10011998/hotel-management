"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, Clock, Crown, FileText, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { FolioPanel } from "@/components/hotel/folio-panel";
import { useStore } from "@/lib/store";
import { folioTotals, todayStr } from "@/lib/selectors";
import { cn, formatDate, formatVND, nightsBetween } from "@/lib/utils";

export default function CheckOutPage() {
  return (
    <React.Suspense>
      <CheckOut />
    </React.Suspense>
  );
}

function CheckOut() {
  const params = useSearchParams();
  const router = useRouter();
  const { reservations, guests, rooms, folios, hotel } = useStore();
  const today = todayStr();
  const [tab, setTab] = React.useState<"due" | "all">("due");
  const [selectedId, setSelectedId] = React.useState<string | null>(params.get("reservation"));

  const inHouse = reservations.filter((r) => r.status === "checked_in");
  const list = (tab === "due" ? inHouse.filter((r) => r.checkOut <= today) : inHouse).sort((a, b) => a.checkOut.localeCompare(b.checkOut));
  const doneToday = reservations.filter((r) => r.status === "checked_out" && r.checkOut === today).length;
  const selected = reservations.find((r) => r.id === selectedId);

  return (
    <>
      <PageHeader title="Check-out" description={`${inHouse.filter((r) => r.checkOut <= today).length} phòng cần trả hôm nay · ${doneToday} đã trả`} />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className={cn("h-fit", selected && "hidden lg:block")}>
          <CardHeader>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "due" | "all")}>
              <TabsList>
                <TabsTrigger value="due">Đến hạn ({inHouse.filter((r) => r.checkOut <= today).length})</TabsTrigger>
                <TabsTrigger value="all">Đang ở ({inHouse.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <EmptyState title="Không có phòng cần trả" className="py-6" />
            ) : (
              <ul className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto">
                {list.map((r) => {
                  const g = guests.find((x) => x.id === r.guestId);
                  const bal = folioTotals(folios.find((f) => f.reservationId === r.id), hotel).balance;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => {
                          setSelectedId(r.id);
                          router.replace(`/front-desk/check-out?reservation=${r.id}`);
                        }}
                        className={cn("w-full rounded-lg border p-2.5 text-left text-sm transition-colors hover:bg-accent", selectedId === r.id && "border-primary bg-primary/8")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="tabular text-base font-bold">{rooms.find((x) => x.id === r.roomId)?.number}</span>
                          <span className={cn("tabular text-xs font-medium", bal > 0 ? "text-danger" : "text-success")}>{formatVND(bal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">{g?.vip && <Crown className="size-3 text-warning" />}{g?.fullName}</span>
                          {r.checkOut < today ? <Badge variant="danger">Quá hạn</Badge> : r.checkOut === today ? <span>Hôm nay</span> : <span>{formatDate(r.checkOut)}</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {selected ? (
          <CheckoutDetail key={selected.id} reservationId={selected.id} onBack={() => setSelectedId(null)} />
        ) : (
          <Card className="hidden lg:block">
            <EmptyState icon={LogOut} title="Chọn phòng để check-out" className="py-20" />
          </Card>
        )}
      </div>
    </>
  );
}

function CheckoutDetail({ reservationId, onBack }: { reservationId: string; onBack: () => void }) {
  const { reservations, guests, rooms, companies, folios, hotel, invoices, addCharge, checkOut } = useStore();
  const r = reservations.find((x) => x.id === reservationId)!;
  const g = guests.find((x) => x.id === r.guestId)!;
  const room = rooms.find((x) => x.id === r.roomId);
  const company = companies.find((c) => c.id === g.companyId);
  const t = folioTotals(folios.find((f) => f.reservationId === r.id), hotel);
  const [companyInvoice, setCompanyInvoice] = React.useState(!!company);
  const [buyer, setBuyer] = React.useState({ name: company?.name ?? g.fullName, taxCode: company?.taxCode ?? "" });
  const [minibarChecked, setMinibarChecked] = React.useState(false);
  const today = todayStr();

  if (r.status === "checked_out") {
    const inv = invoices.find((i) => i.reservationId === r.id);
    return (
      <Card>
        <EmptyState
          icon={Check}
          title={`Phòng ${room?.number} đã check-out`}
          description={inv ? `Hóa đơn ${inv.number} · ${formatVND(inv.total)}` : undefined}
          action={
            <div className="flex gap-2">
              {inv && <Link href={`/billing/invoices/${inv.id}`} className={buttonVariants()}><FileText /> Xem / in hóa đơn</Link>}
              <Button variant="outline" onClick={onBack}>Phòng tiếp theo</Button>
            </div>
          }
        />
      </Card>
    );
  }

  const done = () => {
    try {
      checkOut(r.id, companyInvoice ? { name: buyer.name, taxCode: buyer.taxCode || undefined } : { name: g.fullName });
      toast.success(`Check-out phòng ${room?.number} thành công. Phòng chuyển sang “Bẩn”.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const nightsCharged = folios.find((f) => f.reservationId === r.id)?.charges.filter((c) => c.category === "room").length ?? 0;
  const nightsStayed = Math.max(1, nightsBetween(r.checkIn, r.checkOut < today ? r.checkOut : today));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-4 sm:pt-5">
          <Button variant="ghost" size="icon-sm" onClick={onBack} className="lg:hidden" aria-label="Quay lại"><ChevronLeft /></Button>
          <div className="tabular rounded-lg bg-primary/10 px-3 py-2 text-2xl font-bold text-primary">{room?.number}</div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-semibold">{g.vip && <Crown className="size-4 text-warning" />}{g.fullName}</p>
            <p className="text-sm text-muted-foreground">
              <Link href={`/reservations/${r.id}`} className="text-primary hover:underline">{r.code}</Link> · {formatDate(r.checkIn)} → {formatDate(r.checkOut)} · {nightsBetween(r.checkIn, r.checkOut)} đêm
            </p>
          </div>
          {r.checkOut > today && <Badge variant="warning">Trả phòng sớm {nightsBetween(today, r.checkOut)} đêm</Badge>}
          {r.checkOut < today && <Badge variant="danger">Quá hạn {nightsBetween(r.checkOut, today)} ngày</Badge>}
        </CardContent>
      </Card>

      {nightsCharged < nightsStayed && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <Clock className="size-4" /> Folio mới ghi {nightsCharged}/{nightsStayed} đêm tiền phòng (chưa chạy Night Audit).
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              for (let i = nightsCharged; i < nightsStayed; i++) addCharge(r.id, { date: today, category: "room", description: `Tiền phòng ${room?.number} (bổ sung)`, qty: 1, unitPrice: r.ratePerNight, amount: r.ratePerNight });
              toast.success("Đã ghi bổ sung tiền phòng");
            }}
          >
            Ghi bổ sung
          </Button>
        </div>
      )}

      <FolioPanel reservationId={r.id} />

      <Card>
        <CardHeader>
          <CardTitle>Hoàn tất trả phòng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2"><Checkbox checked={minibarChecked} onChange={(e) => setMinibarChecked(e.target.checked)} /> Buồng phòng đã kiểm tra minibar & tài sản</label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { addCharge(r.id, { date: today, category: "surcharge", description: "Phụ thu trả phòng muộn", qty: 1, unitPrice: 300_000, amount: 300_000 }); toast.success("Đã thêm phụ thu trả muộn"); }}>
                + Phụ thu trả muộn
              </Button>
              <Button size="sm" variant="outline" onClick={() => { addCharge(r.id, { date: today, category: "surcharge", description: `Phụ thu trả muộn sau 18h (50% giá phòng)`, qty: 1, unitPrice: Math.round(r.ratePerNight / 2), amount: Math.round(r.ratePerNight / 2) }); toast.success("Đã thêm phụ thu 50%"); }}>
                + Trả sau 18h (50%)
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={companyInvoice} onChange={(e) => setCompanyInvoice(e.target.checked)} /> Xuất hóa đơn công ty</label>
            {companyInvoice && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tên đơn vị" className="sm:col-span-2"><Input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} /></Field>
                <Field label="Mã số thuế"><Input value={buyer.taxCode} onChange={(e) => setBuyer({ ...buyer, taxCode: e.target.value })} /></Field>
              </div>
            )}
          </div>
        </CardContent>
        <div className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            {t.balance > 0 ? <span className="text-danger">Còn phải thu <b className="tabular">{formatVND(t.balance)}</b> trước khi check-out</span> : t.balance < 0 ? <span className="text-success">Hoàn lại khách <b className="tabular">{formatVND(-t.balance)}</b></span> : <span className="text-success">Đã thanh toán đủ</span>}
          </p>
          <Button variant="success" disabled={t.balance > 0 || !minibarChecked} onClick={done}>
            <LogOut /> Hoàn tất check-out & xuất hóa đơn
          </Button>
        </div>
      </Card>
    </div>
  );
}
