"use client";

import * as React from "react";
import { toast } from "sonner";
import { BadgePercent, Plus, Printer, Trash2, Wallet } from "lucide-react";
import { CHARGE_CATEGORY_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type PaymentMethod } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/hotel/empty-state";
import { VietQR } from "@/components/hotel/vietqr";
import { useStore } from "@/lib/store";
import { folioTotals, todayStr } from "@/lib/selectors";
import { cn, dayjs, formatDateTime, formatVND } from "@/lib/utils";

export function FolioPanel({ reservationId, compact }: { reservationId: string; compact?: boolean }) {
  const { folios, hotel, reservations, removeCharge } = useStore();
  const folio = folios.find((f) => f.reservationId === reservationId);
  const reservation = reservations.find((r) => r.id === reservationId);
  const t = folioTotals(folio, hotel);
  const closed = folio?.status === "closed";
  const [dlg, setDlg] = React.useState<"service" | "discount" | "payment" | null>(null);

  const charges = [...(folio?.charges ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            Folio {closed ? <Badge variant="muted">Đã đóng</Badge> : <Badge variant="success">Đang mở</Badge>}
          </CardTitle>
          <CardDescription>{reservation?.code} · Phát sinh & thanh toán</CardDescription>
        </div>
        {!closed && (
          <div className="no-print flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setDlg("service")}>
              <Plus /> Dịch vụ
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDlg("discount")}>
              <BadgePercent /> Giảm giá
            </Button>
            <Button size="sm" onClick={() => setDlg("payment")}>
              <Wallet /> Thu tiền
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {charges.length === 0 ? (
          <EmptyState title="Chưa có phát sinh" description="Tiền phòng sẽ được ghi khi check-in và mỗi đêm khi Night Audit." className="py-6" />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <THead>
                <tr>
                  <TH>Ngày</TH>
                  <TH>Nội dung</TH>
                  {!compact && <TH>Loại</TH>}
                  <TH className="text-right">SL</TH>
                  <TH className="text-right">Thành tiền</TH>
                  {!closed && <TH className="w-8" />}
                </tr>
              </THead>
              <TBody>
                {charges.map((c) => (
                  <TR key={c.id}>
                    <TD className="tabular whitespace-nowrap text-muted-foreground">{dayjs(c.date).format("DD/MM")}</TD>
                    <TD>{c.description}</TD>
                    {!compact && <TD className="text-muted-foreground">{CHARGE_CATEGORY_LABEL[c.category]}</TD>}
                    <TD className="tabular text-right">{c.qty}</TD>
                    <TD className={cn("tabular text-right font-medium", c.amount < 0 && "text-success")}>{formatVND(c.amount)}</TD>
                    {!closed && (
                      <TD className="px-1">
                        <Button variant="ghost" size="icon-sm" className="no-print text-muted-foreground hover:text-destructive" onClick={() => { removeCharge(reservationId, c.id); toast("Đã xóa phát sinh"); }} aria-label="Xóa phát sinh">
                          <Trash2 />
                        </Button>
                      </TD>
                    )}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Thanh toán</p>
            {folio?.payments.length ? (
              <ul className="divide-y rounded-lg border text-sm">
                {folio.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p>{PAYMENT_METHOD_LABEL[p.method]} {p.note && <span className="text-muted-foreground">· {p.note}</span>}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.at)} · {p.by}</p>
                    </div>
                    <span className="tabular font-medium">{formatVND(p.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">Chưa có thanh toán</p>
            )}
          </div>
          <dl className="tabular space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <Row label="Tổng phát sinh" value={formatVND(t.subtotal)} />
            <Row label={`Phí dịch vụ (${hotel.serviceFeePercent}%)`} value={formatVND(t.serviceFee)} />
            <Row label={`VAT (${hotel.vatPercent}%)`} value={formatVND(t.vat)} />
            <div className="border-t pt-1.5">
              <Row label="Tổng cộng" value={formatVND(t.total)} strong />
            </div>
            <Row label="Đã thanh toán" value={formatVND(t.paid)} />
            <div className="border-t pt-1.5">
              <Row label={t.balance >= 0 ? "Còn phải thu" : "Trả lại khách"} value={formatVND(Math.abs(t.balance))} strong className={t.balance > 0 ? "text-danger" : "text-success"} />
            </div>
          </dl>
        </div>
      </CardContent>

      <AddServiceDialog reservationId={reservationId} open={dlg === "service"} onOpenChange={(v) => setDlg(v ? "service" : null)} />
      <DiscountDialog reservationId={reservationId} subtotal={t.subtotal} open={dlg === "discount"} onOpenChange={(v) => setDlg(v ? "discount" : null)} />
      <PaymentDialog reservationId={reservationId} balance={Math.max(0, t.balance)} open={dlg === "payment"} onOpenChange={(v) => setDlg(v ? "payment" : null)} />
    </Card>
  );
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-3", strong && "text-base font-semibold", className)}>
      <dt className={cn(!strong && "text-muted-foreground")}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AddServiceDialog({ reservationId, open, onOpenChange }: { reservationId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { services, addCharge } = useStore();
  const active = services.filter((s) => s.active);
  const [serviceId, setServiceId] = React.useState(active[0]?.id ?? "");
  const [qty, setQty] = React.useState(1);
  const sv = active.find((s) => s.id === serviceId);
  const submit = () => {
    if (!sv || qty < 1) return;
    addCharge(reservationId, { date: todayStr(), category: sv.category, description: sv.name, qty, unitPrice: sv.price, amount: sv.price * qty, serviceId: sv.id });
    toast.success(`Đã thêm ${qty} × ${sv.name}`);
    onOpenChange(false);
    setQty(1);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Thêm dịch vụ vào folio</DialogTitle>
        </DialogHeader>
        <Field label="Dịch vụ">
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {Object.entries(CHARGE_CATEGORY_LABEL).map(([cat, label]) => {
              const items = active.filter((s) => s.category === cat);
              return items.length ? (
                <optgroup key={cat} label={label}>
                  {items.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {formatVND(s.price)}/{s.unit}</option>
                  ))}
                </optgroup>
              ) : null;
            })}
          </Select>
        </Field>
        <Field label="Số lượng">
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
        </Field>
        {sv && <p className="text-right text-sm">Thành tiền: <b className="tabular">{formatVND(sv.price * qty)}</b></p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit}>Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscountDialog({ reservationId, subtotal, open, onOpenChange }: { reservationId: string; subtotal: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const addCharge = useStore((s) => s.addCharge);
  const [mode, setMode] = React.useState<"percent" | "amount">("percent");
  const [value, setValue] = React.useState(10);
  const [reason, setReason] = React.useState("");
  const amount = mode === "percent" ? Math.round((subtotal * value) / 100 / 1000) * 1000 : value;
  const submit = () => {
    if (amount <= 0 || !reason.trim()) return toast.error("Nhập giá trị và lý do giảm giá");
    addCharge(reservationId, { date: todayStr(), category: "other", description: `Giảm giá${mode === "percent" ? ` ${value}%` : ""}: ${reason}`, qty: 1, unitPrice: -amount, amount: -amount });
    toast.success(`Đã giảm ${formatVND(amount)}`);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Giảm giá</DialogTitle>
          <DialogDescription>Thao tác được ghi vào nhật ký (audit log). Cần quyền “Giảm giá / Hoàn tiền”.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hình thức">
            <Select value={mode} onChange={(e) => setMode(e.target.value as "percent" | "amount")}>
              <option value="percent">Theo %</option>
              <option value="amount">Số tiền</option>
            </Select>
          </Field>
          <Field label={mode === "percent" ? "Phần trăm" : "Số tiền (₫)"}>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Lý do" required>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Khách quen, bồi thường sự cố điều hòa…" />
        </Field>
        <p className="text-right text-sm">Giảm: <b className="tabular text-success">{formatVND(amount)}</b></p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit}>Áp dụng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentDialog({ reservationId, balance, open, onOpenChange }: { reservationId: string; balance: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addPayment, reservations } = useStore();
  const code = reservations.find((r) => r.id === reservationId)?.code ?? "";
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [amount, setAmount] = React.useState(balance);
  const [received, setReceived] = React.useState(0);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setAmount(balance);
      setReceived(0);
    }
  }, [open, balance]);
  const submit = () => {
    if (amount <= 0) return toast.error("Số tiền phải lớn hơn 0");
    addPayment(reservationId, { method, amount, note: note || undefined });
    toast.success(`Đã thu ${formatVND(amount)} (${PAYMENT_METHOD_LABEL[method]})`);
    onOpenChange(false);
    setNote("");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={method === "bank_transfer" ? "lg" : "sm"}>
        <DialogHeader>
          <DialogTitle>Thu tiền</DialogTitle>
          <DialogDescription>Còn phải thu: {formatVND(balance)}</DialogDescription>
        </DialogHeader>
        <div className={cn("grid gap-4", method === "bank_transfer" && "sm:grid-cols-[1fr_auto]")}>
          <div className="grid content-start gap-3">
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.filter((m) => m !== "ota_prepaid").map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={cn("rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent", method === m && "border-primary bg-primary/10 font-medium text-primary")}>
                  {PAYMENT_METHOD_LABEL[m]}
                </button>
              ))}
            </div>
            <Field label="Số tiền thu (₫)">
              <Input type="number" min={0} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </Field>
            {method === "cash" && (
              <Field label="Khách đưa (₫)" hint={received > amount ? `Thối lại: ${formatVND(received - amount)}` : undefined}>
                <Input type="number" min={0} step={1000} value={received || ""} onChange={(e) => setReceived(Number(e.target.value))} />
              </Field>
            )}
            <Field label="Ghi chú">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={method === "card" ? "4 số cuối thẻ, mã chuẩn chi…" : ""} />
            </Field>
          </div>
          {method === "bank_transfer" && amount > 0 && <VietQR amount={amount} description={`${code} thanh toan`} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit}>Xác nhận đã thu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrintButton({ label = "In" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer /> {label}
    </Button>
  );
}
