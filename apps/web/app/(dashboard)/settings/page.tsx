"use client";

import * as React from "react";
import { toast } from "sonner";
import { BedDouble, Building2, CreditCard, FileText, KeyRound, Landmark, Plug, RotateCcw, Shield, Smartphone } from "lucide-react";
import type { Hotel } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { VietQR } from "@/components/hotel/vietqr";
import { useStore } from "@/lib/store";

const BANKS = [
  ["970436", "Vietcombank"],
  ["970415", "VietinBank"],
  ["970418", "BIDV"],
  ["970405", "Agribank"],
  ["970407", "Techcombank"],
  ["970422", "MB Bank"],
  ["970416", "ACB"],
  ["970432", "VPBank"],
  ["970423", "TPBank"],
  ["970403", "Sacombank"],
];

const INTEGRATIONS = [
  { icon: Plug, name: "Channel Manager", desc: "Đồng bộ phòng trống & giá với Booking.com, Agoda, Traveloka, Expedia (SiteMinder / STAAH)." },
  { icon: FileText, name: "Hóa đơn điện tử", desc: "Phát hành HĐĐT theo NĐ 123/2020 qua VNPT, Viettel S-Invoice hoặc MISA meInvoice." },
  { icon: Shield, name: "Khai báo lưu trú (ASM)", desc: "Gửi thông tin khách lưu trú tới Công an tự động qua cổng dịch vụ công." },
  { icon: CreditCard, name: "Cổng thanh toán", desc: "VNPay, MoMo, OnePay cho booking engine và link thanh toán cọc." },
  { icon: KeyRound, name: "Khóa từ", desc: "Ghi thẻ phòng tự động khi check-in (VingCard, Hune, Adel)." },
  { icon: Smartphone, name: "Zalo OA / SMS", desc: "Gửi xác nhận đặt phòng, nhắc check-in, hóa đơn cho khách." },
];

export default function SettingsPage() {
  const { hotel, updateHotel, resetDemo } = useStore();
  const [v, setV] = React.useState<Hotel>(hotel);
  const dirty = JSON.stringify(v) !== JSON.stringify(hotel);
  const set = (patch: Partial<Hotel>) => setV({ ...v, ...patch });
  const save = () => {
    updateHotel(v);
    toast.success("Đã lưu cài đặt");
  };

  return (
    <>
      <PageHeader title="Cài đặt" description="Thông tin khách sạn, thuế phí, giờ nhận/trả phòng, tài khoản ngân hàng, tích hợp" />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Building2 /> Chung</TabsTrigger>
          <TabsTrigger value="policy"><BedDouble /> Chính sách & thuế</TabsTrigger>
          <TabsTrigger value="bank"><Landmark /> Ngân hàng</TabsTrigger>
          <TabsTrigger value="integrations"><Plug /> Tích hợp</TabsTrigger>
          <TabsTrigger value="data"><RotateCcw /> Dữ liệu</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>Thông tin khách sạn</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên khách sạn"><Input value={v.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Hạng sao"><Select value={v.stars} onChange={(e) => set({ stars: Number(e.target.value) })}>{[0, 1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s ? `${s} sao` : "Chưa xếp hạng"}</option>)}</Select></Field>
              <Field label="Tên pháp nhân (trên hóa đơn)" className="sm:col-span-2"><Input value={v.legalName} onChange={(e) => set({ legalName: e.target.value })} /></Field>
              <Field label="Mã số thuế"><Input value={v.taxCode} onChange={(e) => set({ taxCode: e.target.value })} /></Field>
              <Field label="Điện thoại"><Input value={v.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
              <Field label="Địa chỉ" className="sm:col-span-2"><Input value={v.address} onChange={(e) => set({ address: e.target.value })} /></Field>
              <Field label="Email đặt phòng"><Input type="email" value={v.email} onChange={(e) => set({ email: e.target.value })} /></Field>
              <Field label="Website"><Input value={v.website} onChange={(e) => set({ website: e.target.value })} /></Field>
            </CardContent>
            <SaveBar dirty={dirty} onSave={save} onReset={() => setV(hotel)} />
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card>
            <CardHeader><div><CardTitle>Giờ chuẩn & thuế phí</CardTitle><CardDescription>Áp dụng cho tính folio, hóa đơn và phụ thu nhận sớm / trả muộn</CardDescription></div></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <Field label="Giờ nhận phòng"><Input type="time" value={v.checkInTime} onChange={(e) => set({ checkInTime: e.target.value })} /></Field>
              <Field label="Giờ trả phòng"><Input type="time" value={v.checkOutTime} onChange={(e) => set({ checkOutTime: e.target.value })} /></Field>
              <Field label="Phí dịch vụ (%)"><Input type="number" min={0} max={20} value={v.serviceFeePercent} onChange={(e) => set({ serviceFeePercent: Number(e.target.value) })} /></Field>
              <Field label="Thuế VAT (%)" hint="8% theo chính sách giảm thuế hiện hành, 10% mặc định"><Input type="number" min={0} max={10} value={v.vatPercent} onChange={(e) => set({ vatPercent: Number(e.target.value) })} /></Field>
            </CardContent>
            <SaveBar dirty={dirty} onSave={save} onReset={() => setV(hotel)} />
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader><div><CardTitle>Tài khoản nhận chuyển khoản</CardTitle><CardDescription>Dùng sinh mã VietQR trên màn hình thu tiền và hóa đơn</CardDescription></div></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ngân hàng"><Select value={v.bank.bin} onChange={(e) => set({ bank: { ...v.bank, bin: e.target.value, bankName: BANKS.find((b) => b[0] === e.target.value)?.[1] ?? "" } })}>{BANKS.map(([bin, n]) => <option key={bin} value={bin}>{n}</option>)}</Select></Field>
                <Field label="Số tài khoản"><Input value={v.bank.accountNo} onChange={(e) => set({ bank: { ...v.bank, accountNo: e.target.value } })} /></Field>
                <Field label="Tên chủ tài khoản" className="sm:col-span-2"><Input value={v.bank.accountName} onChange={(e) => set({ bank: { ...v.bank, accountName: e.target.value.toUpperCase() } })} /></Field>
              </div>
              <div><p className="mb-2 text-sm text-muted-foreground">Xem trước (đã lưu)</p><VietQR amount={1_000_000} description="BK TEST" size={140} /></div>
            </CardContent>
            <SaveBar dirty={dirty} onSave={save} onReset={() => setV(hotel)} />
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATIONS.map((it) => (
              <Card key={it.name} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-primary/10 p-2 text-primary"><it.icon className="size-5" /></span>
                    <CardTitle>{it.name}</CardTitle>
                  </div>
                  <Badge variant="muted">Chưa kết nối</Badge>
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground">{it.desc}</CardContent>
                <CardFooter><Button variant="outline" size="sm" onClick={() => toast.info(`${it.name}: sẽ triển khai ở giai đoạn tích hợp`)}>Cấu hình</Button></CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader><div><CardTitle>Dữ liệu mẫu</CardTitle><CardDescription>Bản prototype lưu dữ liệu trong trình duyệt (localStorage). Dữ liệu tự sinh lại khi sang ngày mới.</CardDescription></div></CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => { resetDemo(); setV(useStore.getState().hotel); toast.success("Đã khôi phục dữ liệu mẫu"); }}><RotateCcw /> Khôi phục dữ liệu mẫu</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function SaveBar({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <CardFooter className="justify-end">
      {dirty && <span className="mr-auto text-xs text-warning">Có thay đổi chưa lưu</span>}
      <Button variant="outline" disabled={!dirty} onClick={onReset}>Hoàn tác</Button>
      <Button disabled={!dirty} onClick={onSave}>Lưu thay đổi</Button>
    </CardFooter>
  );
}
