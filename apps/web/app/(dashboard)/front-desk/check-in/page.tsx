"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Crown, IdCard, KeyRound, LogIn, ScanLine, UserPlus } from "lucide-react";
import { ID_TYPES, ID_TYPE_LABEL, type IdType } from "@hotel/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { ReservationStatusBadge, SourceBadge, HkStatusBadge } from "@/components/hotel/status-badges";
import { PaymentDialog } from "@/components/hotel/folio-panel";
import { useStore } from "@/lib/store";
import { availableRooms, folioTotals, todayStr } from "@/lib/selectors";
import { cn, formatDate, formatVND, nightsBetween, normalizeVN } from "@/lib/utils";

const STEPS = ["Xác nhận đặt phòng", "Giấy tờ khách", "Gán phòng", "Thu cọc & giao chìa"];

export default function CheckInPage() {
  return (
    <React.Suspense>
      <CheckIn />
    </React.Suspense>
  );
}

function CheckIn() {
  const params = useSearchParams();
  const router = useRouter();
  const { reservations, guests, rooms, roomTypes } = useStore();
  const today = todayStr();
  const [selectedId, setSelectedId] = React.useState<string | null>(params.get("reservation"));
  const [q, setQ] = React.useState("");
  const guestById = React.useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const arrivals = reservations
    .filter((r) => (r.status === "confirmed" || r.status === "tentative") && r.checkIn <= today && r.checkOut > today)
    .filter((r) => !q || normalizeVN(`${r.code} ${guestById.get(r.guestId)?.fullName} ${guestById.get(r.guestId)?.phone}`).includes(normalizeVN(q)))
    .sort((a, b) => (guestById.get(b.guestId)?.vip ? 1 : 0) - (guestById.get(a.guestId)?.vip ? 1 : 0) || a.code.localeCompare(b.code));
  const checkedInToday = reservations.filter((r) => r.status === "checked_in" && r.checkIn === today).length;

  const selected = reservations.find((r) => r.id === selectedId);

  return (
    <>
      <PageHeader
        title="Check-in"
        description={`${arrivals.length} khách chờ nhận phòng · ${checkedInToday} đã check-in hôm nay`}
        actions={
          <Link href="/reservations/new?source=walk_in" className={buttonVariants({ variant: "outline" })}>
            <UserPlus /> Khách vãng lai
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className={cn("h-fit", selected && "hidden lg:block")}>
          <CardHeader>
            <CardTitle>Khách đến hôm nay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, mã, SĐT…" aria-label="Tìm khách đến" />
            {arrivals.length === 0 ? (
              <EmptyState title="Không còn khách chờ check-in" className="py-6" />
            ) : (
              <ul className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto">
                {arrivals.map((r) => {
                  const g = guestById.get(r.guestId);
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => {
                          setSelectedId(r.id);
                          router.replace(`/front-desk/check-in?reservation=${r.id}`);
                        }}
                        className={cn("w-full rounded-lg border p-2.5 text-left text-sm transition-colors hover:bg-accent", selectedId === r.id && "border-primary bg-primary/8")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 truncate font-medium">
                            {g?.vip && <Crown className="size-3.5 text-warning" />} {g?.fullName}
                          </span>
                          <span className="tabular text-xs font-semibold">{r.roomId ? rooms.find((x) => x.id === r.roomId)?.number : <Badge variant="warning">Chưa gán</Badge>}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{r.code} · {roomTypes.find((t) => t.id === r.roomTypeId)?.code} · {nightsBetween(r.checkIn, r.checkOut)} đêm</span>
                          {r.checkIn < today && <span className="text-danger">Trễ {nightsBetween(r.checkIn, today)} ngày</span>}
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
          selected.status === "checked_in" ? (
            <Card>
              <EmptyState
                icon={Check}
                title="Khách đã check-in"
                description={`${selected.code} đã nhận phòng ${rooms.find((r) => r.id === selected.roomId)?.number}.`}
                action={
                  <div className="flex gap-2">
                    <Link href={`/reservations/${selected.id}`} className={buttonVariants({ variant: "outline" })}>Xem đặt phòng</Link>
                    <Button onClick={() => setSelectedId(null)}>Khách tiếp theo</Button>
                  </div>
                }
              />
            </Card>
          ) : (
            <Wizard key={selected.id} reservationId={selected.id} onBack={() => setSelectedId(null)} />
          )
        ) : (
          <Card className="hidden lg:block">
            <EmptyState icon={LogIn} title="Chọn khách để bắt đầu check-in" description="Hoặc tìm theo mã đặt phòng / tên khách ở danh sách bên trái." className="py-20" />
          </Card>
        )}
      </div>
    </>
  );
}

function Wizard({ reservationId, onBack }: { reservationId: string; onBack: () => void }) {
  const { reservations, guests, rooms, roomTypes, folios, hotel, checkIn } = useStore();
  const r = reservations.find((x) => x.id === reservationId)!;
  const guest = guests.find((g) => g.id === r.guestId)!;
  const [step, setStep] = React.useState(0);
  const [doc, setDoc] = React.useState({ idType: guest.idType as IdType, idNumber: guest.idNumber, nationality: guest.nationality, dob: guest.dob ?? "", address: guest.address ?? "" });
  const [roomId, setRoomId] = React.useState<string | null>(r.roomId);
  const [payOpen, setPayOpen] = React.useState(false);
  const [keyCards, setKeyCards] = React.useState(2);
  const t = folioTotals(folios.find((f) => f.reservationId === r.id), hotel);

  const options = availableRooms(rooms, reservations, r.checkIn, r.checkOut, undefined, r.id).filter((x) => !reservations.some((o) => o.roomId === x.id && o.status === "checked_in" && o.id !== r.id));
  const sameType = options.filter((x) => x.roomTypeId === r.roomTypeId);
  const upgrade = options.filter((x) => x.roomTypeId !== r.roomTypeId);
  const chosen = rooms.find((x) => x.id === roomId);

  const scan = () => {
    setDoc((d) => ({ ...d, idNumber: d.idNumber || "079200012345", dob: d.dob || "1990-05-12", address: d.address || "TP. Hồ Chí Minh" }));
    toast.success("Đã đọc thông tin từ CCCD gắn chip (mô phỏng)");
  };

  const canNext = [true, doc.idNumber.trim().length >= 6, !!roomId, true][step];

  const finish = () => {
    if (!roomId) return;
    try {
      checkIn(r.id, roomId, { ...doc, dob: doc.dob || undefined });
      toast.success(`Check-in thành công · Phòng ${chosen?.number} · ${keyCards} thẻ phòng`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex w-full items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack} className="lg:hidden" aria-label="Quay lại">
            <ChevronLeft />
          </Button>
          <ol className="flex flex-1 items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <li key={s} className="flex shrink-0 items-center gap-1">
                <span className={cn("flex size-6 items-center justify-center rounded-full border text-xs font-semibold", i < step && "border-success bg-success text-white", i === step && "border-primary bg-primary text-primary-foreground")}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn("text-xs sm:text-sm", i === step ? "font-medium" : "hidden text-muted-foreground sm:inline")}>{s}</span>
                {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" />}
              </li>
            ))}
          </ol>
        </div>
      </CardHeader>
      <CardContent className="min-h-80 pt-5">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="text-lg font-semibold">{guest.fullName} {guest.vip && <Badge variant="warning">VIP</Badge>}</p>
              <p className="text-muted-foreground">{guest.phone} {guest.email && `· ${guest.email}`}</p>
              <div className="flex flex-wrap items-center gap-2"><ReservationStatusBadge status={r.status} /> <SourceBadge source={r.source} /></div>
              {guest.blacklisted && <p className="rounded-md bg-danger/10 p-2 font-medium text-danger">⚠ Khách trong danh sách đen: {guest.notes}</p>}
              {guest.tags.length > 0 && <p>Sở thích: {guest.tags.join(", ")}</p>}
              {r.note && <p className="rounded-md bg-warning/12 p-2">📝 {r.note}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Mã đặt phòng</dt><dd className="font-medium">{r.code}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Loại phòng</dt><dd className="font-medium">{roomTypes.find((x) => x.id === r.roomTypeId)?.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Thời gian</dt><dd className="font-medium">{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Số khách</dt><dd className="font-medium">{r.adults} NL{r.children ? ` + ${r.children} TE` : ""}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Giá/đêm</dt><dd className="tabular font-medium">{formatVND(r.ratePerNight)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Đã thanh toán</dt><dd className="tabular font-medium">{formatVND(t.paid)}</dd></div>
            </dl>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3">
              <p className="flex items-center gap-2 text-sm"><IdCard className="size-5 text-muted-foreground" /> Quét CCCD gắn chip / hộ chiếu (MRZ) để điền tự động</p>
              <Button variant="outline" size="sm" onClick={scan}><ScanLine /> Quét giấy tờ</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Loại giấy tờ">
                <Select value={doc.idType} onChange={(e) => setDoc({ ...doc, idType: e.target.value as IdType })}>
                  {ID_TYPES.map((x) => <option key={x} value={x}>{ID_TYPE_LABEL[x]}</option>)}
                </Select>
              </Field>
              <Field label="Số giấy tờ" required error={doc.idNumber.trim().length < 6 ? "Bắt buộc để khai báo lưu trú" : undefined}>
                <Input value={doc.idNumber} onChange={(e) => setDoc({ ...doc, idNumber: e.target.value })} />
              </Field>
              <Field label="Quốc tịch"><Input value={doc.nationality} onChange={(e) => setDoc({ ...doc, nationality: e.target.value })} /></Field>
              <Field label="Ngày sinh"><Input type="date" value={doc.dob} onChange={(e) => setDoc({ ...doc, dob: e.target.value })} /></Field>
              <Field label="Địa chỉ thường trú" className="sm:col-span-2"><Input value={doc.address} onChange={(e) => setDoc({ ...doc, address: e.target.value })} /></Field>
            </div>
            <p className="text-xs text-muted-foreground">Thông tin sẽ được đưa vào danh sách khai báo lưu trú gửi Công an phường (ASM) trong ngày.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <RoomGrid title={`Cùng loại (${roomTypes.find((x) => x.id === r.roomTypeId)?.name})`} list={sameType} value={roomId} onChange={setRoomId} current={r.roomId} />
            {upgrade.length > 0 && <RoomGrid title="Loại khác (nâng/hạ hạng)" list={upgrade} value={roomId} onChange={setRoomId} current={r.roomId} />}
            {chosen?.hkStatus === "dirty" && <p className="rounded-md bg-warning/12 p-2 text-sm">⚠ Phòng {chosen.number} đang bẩn — báo buồng phòng dọn gấp hoặc chọn phòng khác.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <p className="text-lg font-semibold">Phòng {chosen?.number}</p>
              <p className="text-muted-foreground">{roomTypes.find((x) => x.id === chosen?.roomTypeId)?.name} · Tầng {chosen?.floor}</p>
              <Field label="Số thẻ phòng giao khách">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <Input type="number" min={1} max={4} value={keyCards} onChange={(e) => setKeyCards(Number(e.target.value))} className="w-24" />
                </div>
              </Field>
              <p className="text-xs text-muted-foreground">Tích hợp khóa từ (VingCard/Hune) sẽ ghi thẻ tự động ở giai đoạn sau.</p>
            </div>
            <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span>Tiền phòng dự kiến</span><span className="tabular font-medium">{formatVND(r.ratePerNight * nightsBetween(r.checkIn, r.checkOut))}</span></div>
              <div className="flex justify-between"><span>Đã thanh toán / cọc</span><span className="tabular font-medium">{formatVND(t.paid)}</span></div>
              <Button variant="outline" className="w-full" onClick={() => setPayOpen(true)}>Thu thêm tiền cọc</Button>
            </div>
            <PaymentDialog reservationId={r.id} balance={Math.max(0, r.ratePerNight - t.paid)} open={payOpen} onOpenChange={setPayOpen} />
          </div>
        )}
      </CardContent>
      <div className="flex items-center justify-between border-t p-4">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft /> Quay lại
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext || guest.blacklisted} onClick={() => setStep(step + 1)}>
            Tiếp tục <ChevronRight />
          </Button>
        ) : (
          <Button variant="success" onClick={finish}>
            <Check /> Hoàn tất check-in
          </Button>
        )}
      </div>
    </Card>
  );
}

function RoomGrid({ title, list, value, onChange, current }: { title: string; list: ReturnType<typeof useStore.getState>["rooms"]; value: string | null; onChange: (id: string) => void; current: string | null }) {
  const roomTypes = useStore((s) => s.roomTypes);
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có phòng trống.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-7">
          {list.map((room) => (
            <button key={room.id} onClick={() => onChange(room.id)} className={cn("rounded-lg border p-2 text-left transition-colors hover:bg-accent", value === room.id && "border-primary bg-primary/10 ring-1 ring-primary")}>
              <p className="tabular font-semibold">{room.number} {current === room.id && <span className="text-[10px] font-normal text-primary">(đã gán)</span>}</p>
              <p className="text-[11px] text-muted-foreground">{roomTypes.find((t) => t.id === room.roomTypeId)?.code}</p>
              <div className="mt-1"><HkStatusBadge status={room.hkStatus} /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
