"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CHARGE_CATEGORY_LABEL, PAYMENT_METHOD_LABEL, type ChargeCategory } from "@hotel/shared";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { PrintButton } from "@/components/hotel/folio-panel";
import { VietQR } from "@/components/hotel/vietqr";
import { useStore } from "@/lib/store";
import { folioTotals } from "@/lib/selectors";
import { formatDate, formatDateTime, formatVND, nightsBetween } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { invoices, reservations, folios, guests, rooms, hotel } = useStore();
  const inv = invoices.find((i) => i.id === id);
  if (!inv) return <Card><EmptyState title="Không tìm thấy hóa đơn" action={<Link href="/billing/invoices" className={buttonVariants({ variant: "outline" })}>Về danh sách</Link>} /></Card>;
  const r = reservations.find((x) => x.id === inv.reservationId);
  const folio = folios.find((f) => f.reservationId === inv.reservationId);
  const g = guests.find((x) => x.id === r?.guestId);
  const room = rooms.find((x) => x.id === r?.roomId);
  const t = folioTotals(folio, hotel);

  // Gộp phát sinh theo nhóm cho gọn hóa đơn
  const groups = new Map<ChargeCategory | "discount", { qty: number; amount: number }>();
  folio?.charges.forEach((c) => {
    const k = c.amount < 0 ? "discount" : c.category;
    const cur = groups.get(k) ?? { qty: 0, amount: 0 };
    cur.qty += c.qty;
    cur.amount += c.amount;
    groups.set(k, cur);
  });

  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Hóa đơn", href: "/billing/invoices" }, { label: inv.number }]} title={`Hóa đơn ${inv.number}`} actions={<PrintButton label="In hóa đơn" />} />
      <Card className="print-area mx-auto max-w-3xl p-6 sm:p-10">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row">
          <div>
            <p className="text-lg font-bold">{hotel.legalName}</p>
            <p className="text-sm text-muted-foreground">{hotel.address}</p>
            <p className="text-sm text-muted-foreground">MST: {hotel.taxCode} · ĐT: {hotel.phone}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl font-bold uppercase tracking-wide text-primary">Hóa đơn thanh toán</p>
            <p className="text-sm">Số: <b>{inv.number}</b></p>
            <p className="text-sm text-muted-foreground">Ngày: {formatDateTime(inv.issuedAt)}</p>
          </div>
        </div>
        <div className="grid gap-4 border-b py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Người mua</p>
            <p className="font-semibold">{inv.buyerName}</p>
            {inv.buyerTaxCode && <p>MST: {inv.buyerTaxCode}</p>}
            {g && <p className="text-muted-foreground">Khách lưu trú: {g.fullName} · {g.phone}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase text-muted-foreground">Lưu trú</p>
            <p>Phòng <b>{room?.number}</b> · {r?.code}</p>
            {r && <p>{formatDate(r.checkIn)} → {formatDate(r.checkOut)} ({nightsBetween(r.checkIn, r.checkOut)} đêm)</p>}
          </div>
        </div>
        <table className="my-5 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="py-2">STT</th><th className="py-2">Nội dung</th><th className="py-2 text-right">SL</th><th className="py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {[...groups.entries()].map(([k, v], i) => (
              <tr key={k} className="border-b">
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{k === "discount" ? "Giảm giá" : CHARGE_CATEGORY_LABEL[k]}</td>
                <td className="tabular py-2 text-right">{v.qty}</td>
                <td className="tabular py-2 text-right">{formatVND(v.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col-reverse justify-between gap-6 sm:flex-row">
          <div className="sm:w-48">{t.balance > 0 && <VietQR amount={t.balance} description={`${inv.number}`} size={140} />}</div>
          <dl className="tabular w-full max-w-xs space-y-1.5 self-end text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Cộng tiền hàng</dt><dd>{formatVND(inv.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Phí dịch vụ ({hotel.serviceFeePercent}%)</dt><dd>{formatVND(inv.serviceFee)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Thuế GTGT ({hotel.vatPercent}%)</dt><dd>{formatVND(inv.vat)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Tổng thanh toán</dt><dd>{formatVND(inv.total)}</dd></div>
            {folio?.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-xs text-muted-foreground"><dt>{PAYMENT_METHOD_LABEL[p.method]} {p.note && `(${p.note})`}</dt><dd>-{formatVND(p.amount)}</dd></div>
            ))}
          </dl>
        </div>
        <div className="mt-10 grid grid-cols-2 text-center text-sm">
          <div><p className="font-medium">Khách hàng</p><p className="text-xs text-muted-foreground">(Ký, ghi rõ họ tên)</p></div>
          <div><p className="font-medium">Thu ngân</p><p className="text-xs text-muted-foreground">(Ký, ghi rõ họ tên)</p></div>
        </div>
        <p className="mt-16 text-center text-xs text-muted-foreground">Cảm ơn quý khách đã lưu trú tại {hotel.name}! · {hotel.website}</p>
      </Card>
    </>
  );
}
