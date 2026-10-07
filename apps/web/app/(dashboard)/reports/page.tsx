"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Printer } from "lucide-react";
import { BOOKING_SOURCES, BOOKING_SOURCE_LABEL, CHARGE_CATEGORIES, CHARGE_CATEGORY_LABEL, ID_TYPE_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { KpiCard } from "@/components/hotel/kpi-card";
import { DataTable } from "@/components/hotel/data-table";
import { AuditLogTable } from "@/components/hotel/audit-log-table";
import { ChartTooltip, axisProps } from "@/components/charts/chart-tooltip";
import { useStore } from "@/lib/store";
import { occupiedOnNight, todayStr } from "@/lib/selectors";
import { SOURCE_COLOR } from "@/lib/status";
import { dayjs, downloadCSV, formatDate, formatVND, formatVNDShort, nightsBetween, toDateOnly } from "@/lib/utils";

export default function ReportsPage() {
  const [from, setFrom] = React.useState(toDateOnly(dayjs().startOf("month")));
  const [to, setTo] = React.useState(todayStr());
  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Số liệu tính theo ngày phát sinh (ngày khách sạn)"
        actions={
          <>
            <div className="flex items-center gap-1.5">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-38" aria-label="Từ ngày" />
              <span className="text-muted-foreground">–</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-38" aria-label="Đến ngày" />
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> In</Button>
          </>
        }
      />
      <Tabs defaultValue="revenue">
        <TabsList className="no-print">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="occupancy">Công suất</TabsTrigger>
          <TabsTrigger value="source">Nguồn đặt</TabsTrigger>
          <TabsTrigger value="roomtype">Loại phòng</TabsTrigger>
          <TabsTrigger value="shift">Giao ca</TabsTrigger>
          <TabsTrigger value="police">Khai báo lưu trú</TabsTrigger>
          <TabsTrigger value="audit">Nhật ký</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue"><Revenue from={from} to={to} /></TabsContent>
        <TabsContent value="occupancy"><Occupancy from={from} to={to} /></TabsContent>
        <TabsContent value="source"><BySource from={from} to={to} /></TabsContent>
        <TabsContent value="roomtype"><ByRoomType from={from} to={to} /></TabsContent>
        <TabsContent value="shift"><ShiftReport /></TabsContent>
        <TabsContent value="police"><PoliceReport /></TabsContent>
        <TabsContent value="audit"><AuditLogTable /></TabsContent>
      </Tabs>
    </>
  );
}

function daysIn(from: string, to: string) {
  const out: string[] = [];
  for (let d = dayjs(from); !d.isAfter(dayjs(to)); d = d.add(1, "day")) out.push(toDateOnly(d));
  return out;
}

function Revenue({ from, to }: { from: string; to: string }) {
  const { folios, hotel } = useStore();
  const days = daysIn(from, to);
  const charges = folios.flatMap((f) => f.charges).filter((c) => c.date >= from && c.date <= to);
  const byCat = CHARGE_CATEGORIES.map((cat) => ({ cat, amount: charges.filter((c) => c.category === cat && c.amount > 0).reduce((s, c) => s + c.amount, 0) })).filter((x) => x.amount);
  const discount = charges.filter((c) => c.amount < 0).reduce((s, c) => s + c.amount, 0);
  const total = byCat.reduce((s, x) => s + x.amount, 0) + discount;
  const fee = Math.round(total * (hotel.serviceFeePercent / 100));
  const vat = Math.round((total + fee) * (hotel.vatPercent / 100));
  const series = days.map((d) => {
    const dc = charges.filter((c) => c.date === d);
    return { date: dayjs(d).format("DD/MM"), "Tiền phòng": dc.filter((c) => c.category === "room").reduce((s, c) => s + c.amount, 0), "Dịch vụ": dc.filter((c) => c.category !== "room").reduce((s, c) => s + c.amount, 0) };
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Doanh thu thuần" value={formatVNDShort(total)} />
        <KpiCard label="Tiền phòng" value={formatVNDShort(byCat.find((x) => x.cat === "room")?.amount ?? 0)} tone="info" />
        <KpiCard label="Dịch vụ & phụ thu" value={formatVNDShort(byCat.filter((x) => x.cat !== "room").reduce((s, x) => s + x.amount, 0))} tone="success" />
        <KpiCard label="Giảm giá" value={formatVNDShort(Math.abs(discount))} tone="danger" />
      </div>
      <Card>
        <CardHeader><CardTitle>Doanh thu theo ngày</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ left: -8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" {...axisProps} minTickGap={12} />
              <YAxis {...axisProps} tickFormatter={formatVNDShort} width={56} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Tiền phòng" stackId="a" fill="var(--chart-1)" />
              <Bar dataKey="Dịch vụ" stackId="a" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cơ cấu doanh thu</CardTitle>
          <Button variant="outline" size="sm" onClick={() => downloadCSV(`doanh-thu-${from}-${to}`, [["Nhóm", "Doanh thu"], ...byCat.map((x) => [CHARGE_CATEGORY_LABEL[x.cat], x.amount]), ["Giảm giá", discount], ["Phí dịch vụ", fee], ["VAT", vat]])}><Download /> Xuất Excel</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <THead><tr><TH>Nhóm</TH><TH className="text-right">Doanh thu</TH><TH className="text-right">Tỷ trọng</TH></tr></THead>
              <TBody>
                {byCat.map((x) => (
                  <TR key={x.cat}><TD>{CHARGE_CATEGORY_LABEL[x.cat]}</TD><TD className="tabular text-right">{formatVND(x.amount)}</TD><TD className="tabular text-right">{((x.amount / (total || 1)) * 100).toFixed(1)}%</TD></TR>
                ))}
                <TR><TD>Giảm giá</TD><TD className="tabular text-right text-success">{formatVND(discount)}</TD><TD /></TR>
              </TBody>
              <TFoot>
                <TR><TD>Doanh thu thuần</TD><TD className="tabular text-right">{formatVND(total)}</TD><TD /></TR>
                <TR><TD>Phí dịch vụ {hotel.serviceFeePercent}% / VAT {hotel.vatPercent}%</TD><TD className="tabular text-right">{formatVND(fee)} / {formatVND(vat)}</TD><TD /></TR>
              </TFoot>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Occupancy({ from, to }: { from: string; to: string }) {
  const { reservations, rooms, folios } = useStore();
  const days = daysIn(from, to);
  const sellable = rooms.filter((r) => !r.outOfOrder).length;
  const roomRev = new Map<string, number>();
  folios.forEach((f) => f.charges.forEach((c) => c.category === "room" && roomRev.set(c.date, (roomRev.get(c.date) ?? 0) + c.amount)));
  const rows = days.map((d) => {
    const sold = occupiedOnNight(reservations, d);
    const rev = roomRev.get(d) ?? 0;
    return { d, date: dayjs(d).format("DD/MM"), sold, occ: Math.round((sold / sellable) * 1000) / 10, adr: sold ? rev / sold : 0, revpar: rev / sellable, rev };
  });
  const totSold = rows.reduce((s, r) => s + r.sold, 0);
  const totRev = rows.reduce((s, r) => s + r.rev, 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Công suất TB" value={`${((totSold / (sellable * days.length || 1)) * 100).toFixed(1)}%`} />
        <KpiCard label="Đêm phòng đã bán" value={totSold} tone="info" />
        <KpiCard label="ADR" value={formatVNDShort(totSold ? totRev / totSold : 0)} tone="success" sub="Giá phòng bình quân" />
        <KpiCard label="RevPAR" value={formatVNDShort(totRev / (sellable * days.length || 1))} tone="warning" sub="Doanh thu / phòng sẵn có" />
      </div>
      <Card>
        <CardHeader><CardTitle>Công suất & ADR theo ngày</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ left: -8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" {...axisProps} minTickGap={12} />
              <YAxis yAxisId="l" {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis yAxisId="r" orientation="right" {...axisProps} tickFormatter={formatVNDShort} width={56} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"><p className="mb-1 font-medium">{label}</p><p>Công suất: <b>{payload[0]?.value}%</b></p><p>ADR: <b>{formatVND(Number(payload[1]?.value ?? 0))}</b></p></div>
              ) : null} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="l" dataKey="occ" name="Công suất (%)" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Line yAxisId="r" dataKey="adr" name="ADR" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <DataTable
        data={rows}
        rowKey={(r) => r.d}
        exportName={`cong-suat-${from}-${to}`}
        pageSize={10}
        columns={[
          { key: "d", header: "Ngày", cell: (r) => formatDate(r.d), sortValue: (r) => r.d, className: "tabular" },
          { key: "sold", header: "Phòng bán", cell: (r) => `${r.sold}/${sellable}`, sortValue: (r) => r.sold, className: "tabular" },
          { key: "occ", header: "Công suất", cell: (r) => `${r.occ}%`, sortValue: (r) => r.occ, className: "tabular" },
          { key: "adr", header: "ADR", cell: (r) => formatVND(r.adr), sortValue: (r) => Math.round(r.adr), className: "tabular text-right", headerClassName: "text-right" },
          { key: "revpar", header: "RevPAR", cell: (r) => formatVND(r.revpar), sortValue: (r) => Math.round(r.revpar), className: "tabular text-right", headerClassName: "text-right" },
          { key: "rev", header: "Tiền phòng", cell: (r) => formatVND(r.rev), sortValue: (r) => r.rev, className: "tabular text-right", headerClassName: "text-right" },
        ]}
      />
    </div>
  );
}

function stayNightsInRange(checkIn: string, checkOut: string, from: string, to: string) {
  const s = checkIn > from ? checkIn : from;
  const eExclusive = checkOut < toDateOnly(dayjs(to).add(1, "day")) ? checkOut : toDateOnly(dayjs(to).add(1, "day"));
  return Math.max(0, nightsBetween(s, eExclusive));
}

function BySource({ from, to }: { from: string; to: string }) {
  const { reservations } = useStore();
  const rows = BOOKING_SOURCES.map((s) => {
    const rs = reservations.filter((r) => r.source === s && r.checkIn <= to && r.checkOut > from);
    const ok = rs.filter((r) => !["cancelled", "no_show"].includes(r.status));
    const nights = ok.reduce((n, r) => n + stayNightsInRange(r.checkIn, r.checkOut, from, to), 0);
    const rev = ok.reduce((n, r) => n + stayNightsInRange(r.checkIn, r.checkOut, from, to) * r.ratePerNight, 0);
    return { s, name: BOOKING_SOURCE_LABEL[s], bookings: ok.length, cancelled: rs.length - ok.length, nights, rev, adr: nights ? rev / nights : 0 };
  }).sort((a, b) => b.rev - a.rev);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><div><CardTitle>Doanh thu phòng theo kênh</CardTitle><CardDescription>Giúp đánh giá chi phí hoa hồng OTA (15–20%) so với kênh trực tiếp</CardDescription></div></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" {...axisProps} tickFormatter={formatVNDShort} />
              <YAxis type="category" dataKey="name" {...axisProps} width={96} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="rev" name="Doanh thu" radius={[0, 4, 4, 0]}>
                {rows.map((r) => <Cell key={r.s} fill={SOURCE_COLOR[r.s]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <DataTable
        data={rows}
        rowKey={(r) => r.s}
        exportName={`nguon-dat-${from}-${to}`}
        columns={[
          { key: "name", header: "Kênh", cell: (r) => <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: SOURCE_COLOR[r.s] }} />{r.name}</span>, sortValue: (r) => r.name },
          { key: "b", header: "Booking", cell: (r) => r.bookings, sortValue: (r) => r.bookings, className: "tabular" },
          { key: "c", header: "Hủy/NS", cell: (r) => r.cancelled, sortValue: (r) => r.cancelled, className: "tabular" },
          { key: "n", header: "Đêm", cell: (r) => r.nights, sortValue: (r) => r.nights, className: "tabular" },
          { key: "adr", header: "ADR", cell: (r) => formatVNDShort(r.adr), sortValue: (r) => Math.round(r.adr), className: "tabular text-right", headerClassName: "text-right" },
          { key: "rev", header: "Doanh thu", cell: (r) => formatVND(r.rev), sortValue: (r) => r.rev, className: "tabular text-right whitespace-nowrap", headerClassName: "text-right" },
        ]}
      />
    </div>
  );
}

function ByRoomType({ from, to }: { from: string; to: string }) {
  const { reservations, roomTypes, rooms } = useStore();
  const days = daysIn(from, to).length;
  const rows = roomTypes.map((t) => {
    const count = rooms.filter((r) => r.roomTypeId === t.id && !r.outOfOrder).length;
    const ok = reservations.filter((r) => r.roomTypeId === t.id && r.roomId && !["cancelled", "no_show"].includes(r.status) && r.checkIn <= to && r.checkOut > from);
    const nights = ok.reduce((n, r) => n + stayNightsInRange(r.checkIn, r.checkOut, from, to), 0);
    const rev = ok.reduce((n, r) => n + stayNightsInRange(r.checkIn, r.checkOut, from, to) * r.ratePerNight, 0);
    return { id: t.id, name: t.name, count, nights, occ: (nights / (count * days || 1)) * 100, adr: nights ? rev / nights : 0, rev };
  });
  return (
    <DataTable
      data={rows}
      rowKey={(r) => r.id}
      exportName={`loai-phong-${from}-${to}`}
      columns={[
        { key: "name", header: "Loại phòng", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
        { key: "count", header: "Số phòng", cell: (r) => r.count, sortValue: (r) => r.count, className: "tabular" },
        { key: "n", header: "Đêm bán", cell: (r) => r.nights, sortValue: (r) => r.nights, className: "tabular" },
        { key: "occ", header: "Công suất", cell: (r) => (
          <span className="flex items-center gap-2"><span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-primary" style={{ width: `${Math.min(100, r.occ)}%` }} /></span><span className="tabular">{r.occ.toFixed(1)}%</span></span>
        ), sortValue: (r) => Math.round(r.occ * 10) / 10 },
        { key: "adr", header: "ADR", cell: (r) => formatVND(r.adr), sortValue: (r) => Math.round(r.adr), className: "tabular text-right", headerClassName: "text-right" },
        { key: "rev", header: "Doanh thu", cell: (r) => formatVND(r.rev), sortValue: (r) => r.rev, className: "tabular text-right", headerClassName: "text-right" },
      ]}
    />
  );
}

function ShiftReport() {
  const { folios } = useStore();
  const today = todayStr();
  const payments = folios.flatMap((f) => f.payments).filter((p) => dayjs(p.at).format("YYYY-MM-DD") === today && p.method !== "ota_prepaid");
  const staffNames = [...new Set(payments.map((p) => p.by))];
  const openingCash = 5_000_000;
  const cashIn = payments.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0);
  const [counted, setCounted] = React.useState<number>(openingCash + cashIn);
  const diff = counted - (openingCash + cashIn);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader><div><CardTitle>Thu tiền trong ngày theo nhân viên</CardTitle><CardDescription>{formatDate(today)} · không gồm OTA trả trước</CardDescription></div></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <THead><tr><TH>Nhân viên</TH>{PAYMENT_METHODS.filter((m) => m !== "ota_prepaid").map((m) => <TH key={m} className="text-right">{PAYMENT_METHOD_LABEL[m]}</TH>)}<TH className="text-right">Tổng</TH></tr></THead>
              <TBody>
                {staffNames.map((n) => (
                  <TR key={n}>
                    <TD className="font-medium">{n}</TD>
                    {PAYMENT_METHODS.filter((m) => m !== "ota_prepaid").map((m) => <TD key={m} className="tabular text-right">{formatVND(payments.filter((p) => p.by === n && p.method === m).reduce((s, p) => s + p.amount, 0))}</TD>)}
                    <TD className="tabular text-right font-semibold">{formatVND(payments.filter((p) => p.by === n).reduce((s, p) => s + p.amount, 0))}</TD>
                  </TR>
                ))}
                {staffNames.length === 0 && <TR><TD colSpan={5} className="py-6 text-center text-muted-foreground">Chưa có giao dịch hôm nay</TD></TR>}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Đối soát két tiền mặt</CardTitle></CardHeader>
        <CardContent className="tabular space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tiền đầu ca</span><span>{formatVND(openingCash)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Thu tiền mặt</span><span>{formatVND(cashIn)}</span></div>
          <div className="flex justify-between border-t pt-2 font-semibold"><span>Tiền mặt theo sổ</span><span>{formatVND(openingCash + cashIn)}</span></div>
          <label className="grid gap-1.5 pt-2"><span className="text-muted-foreground">Tiền mặt thực đếm</span><Input type="number" step={1000} value={counted} onChange={(e) => setCounted(Number(e.target.value))} /></label>
          <div className={`flex justify-between rounded-md p-2 font-semibold ${diff === 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}><span>Chênh lệch</span><span>{formatVND(diff)}</span></div>
          <Button className="mt-2 w-full" onClick={() => window.print()}><Printer /> Chốt ca & in biên bản</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PoliceReport() {
  const { reservations, guests, rooms } = useStore();
  const rows = reservations.filter((r) => r.status === "checked_in").map((r) => ({ r, g: guests.find((x) => x.id === r.guestId)!, room: rooms.find((x) => x.id === r.roomId) }));
  return (
    <Card>
      <CardHeader>
        <div><CardTitle>Danh sách khách lưu trú</CardTitle><CardDescription>Dùng khai báo lưu trú với Công an (Luật Cư trú 2020). {rows.filter((x) => x.g.nationality !== "Việt Nam").length} khách nước ngoài cần khai báo tạm trú.</CardDescription></div>
        <Button variant="outline" size="sm" onClick={() => downloadCSV(`khai-bao-luu-tru-${todayStr()}`, [["STT", "Họ tên", "Ngày sinh", "Giới tính", "Quốc tịch", "Loại giấy tờ", "Số giấy tờ", "Phòng", "Đến ngày", "Đi ngày", "Địa chỉ"], ...rows.map(({ r, g, room }, i) => [i + 1, g.fullName, g.dob ? formatDate(g.dob) : "", g.gender === "male" ? "Nam" : "Nữ", g.nationality, ID_TYPE_LABEL[g.idType], g.idNumber, room?.number ?? "", formatDate(r.checkIn), formatDate(r.checkOut), g.address ?? ""])])}><Download /> Xuất file khai báo</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <THead><tr><TH>Phòng</TH><TH>Họ tên</TH><TH>Ngày sinh</TH><TH>Quốc tịch</TH><TH>Giấy tờ</TH><TH>Đến</TH><TH>Đi</TH></tr></THead>
            <TBody>
              {rows.sort((a, b) => (a.room?.number ?? "").localeCompare(b.room?.number ?? "")).map(({ r, g, room }) => (
                <TR key={r.id}>
                  <TD className="tabular font-semibold">{room?.number}</TD>
                  <TD>{g.fullName}</TD>
                  <TD className="tabular">{g.dob ? formatDate(g.dob) : "—"}</TD>
                  <TD>{g.nationality}</TD>
                  <TD className="tabular text-xs">{ID_TYPE_LABEL[g.idType]} {g.idNumber}</TD>
                  <TD className="tabular">{formatDate(r.checkIn)}</TD>
                  <TD className="tabular">{formatDate(r.checkOut)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
