"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BedDouble, Moon, Users } from "lucide-react";
import { BOOKING_SOURCES, BOOKING_SOURCE_LABEL, MEAL_PLAN_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL, reservationSchema, type ReservationInput } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/hotel/page-header";
import { GuestPicker } from "@/components/hotel/guest-picker";
import { useStore } from "@/lib/store";
import { availableRooms, stayQuote, todayStr } from "@/lib/selectors";
import { cn, dayjs, formatVND, nightsBetween, toDateOnly } from "@/lib/utils";

export default function NewReservationPage() {
  return (
    <React.Suspense>
      <NewReservation />
    </React.Suspense>
  );
}

function NewReservation() {
  const router = useRouter();
  const params = useSearchParams();
  const { rooms, reservations, roomTypes, ratePlans, rateRules, guests, hotel, createReservation } = useStore();
  const presetRoom = rooms.find((r) => r.id === params.get("room"));
  const presetIn = params.get("checkIn") ?? todayStr();

  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      checkIn: presetIn,
      checkOut: toDateOnly(dayjs(presetIn).add(1, "day")),
      adults: 2,
      children: 0,
      roomTypeId: presetRoom?.roomTypeId ?? roomTypes[0].id,
      roomId: presetRoom?.id ?? null,
      ratePlanId: ratePlans[0].id,
      source: "walk_in",
      guestId: "",
      deposit: 0,
      depositMethod: "cash",
      confirmed: true,
      note: "",
    },
  });
  const { register, handleSubmit, watch, setValue, control, formState } = form;
  const e = formState.errors;
  const v = watch();
  const nights = nightsBetween(v.checkIn, v.checkOut);
  const validDates = v.checkOut > v.checkIn;

  const rt = roomTypes.find((t) => t.id === v.roomTypeId)!;
  const rp = ratePlans.find((p) => p.id === v.ratePlanId);
  const quote = validDates ? stayQuote(rt, rp, v.checkIn, v.checkOut, rateRules) : null;
  const extraAdults = Math.max(0, v.adults - rt.maxAdults);
  const extraFee = extraAdults * rt.extraAdultFee * nights;
  const total = (quote?.total ?? 0) + extraFee;
  const guest = guests.find((g) => g.id === v.guestId);

  const availability = React.useMemo(
    () =>
      roomTypes.map((t) => ({
        type: t,
        rooms: validDates ? availableRooms(rooms, reservations, v.checkIn, v.checkOut, t.id) : [],
        quote: validDates ? stayQuote(t, rp, v.checkIn, v.checkOut, rateRules) : null,
      })),
    [roomTypes, rooms, reservations, v.checkIn, v.checkOut, validDates, rp, rateRules],
  );
  const roomsOfType = React.useMemo(() => availability.find((a) => a.type.id === v.roomTypeId)?.rooms ?? [], [availability, v.roomTypeId]);

  React.useEffect(() => {
    if (v.roomId && !roomsOfType.some((r) => r.id === v.roomId)) setValue("roomId", null);
  }, [roomsOfType, v.roomId, setValue]);

  const submit = handleSubmit((d) => {
    if (guest?.blacklisted) return toast.error("Khách trong danh sách đen — không thể đặt phòng");
    if (d.adults > rt.maxAdults + 1) return toast.error(`${rt.name} tối đa ${rt.maxAdults} người lớn (+1 giường phụ)`);
    try {
      const r = createReservation(
        {
          guestId: d.guestId,
          roomTypeId: d.roomTypeId,
          roomId: d.roomId,
          checkIn: d.checkIn,
          checkOut: d.checkOut,
          adults: d.adults,
          children: d.children,
          source: d.source,
          status: d.confirmed ? "confirmed" : "tentative",
          ratePlanId: d.ratePlanId,
          ratePerNight: Math.round(total / nights),
          deposit: d.deposit,
          note: d.note || undefined,
        },
        d.depositMethod,
      );
      toast.success(`Đã tạo đặt phòng ${r.code}`);
      router.push(`/reservations/${r.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <>
      <PageHeader title="Đặt phòng mới" breadcrumbs={[{ label: "Đặt phòng", href: "/reservations" }, { label: "Tạo mới" }]} />
      <form onSubmit={submit} noValidate className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Thời gian lưu trú</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <Field label="Nhận phòng" required error={e.checkIn?.message}>
                <Input type="date" min={todayStr()} {...register("checkIn")} />
              </Field>
              <Field label="Trả phòng" required error={e.checkOut?.message}>
                <Input type="date" min={v.checkIn} {...register("checkOut")} aria-invalid={!!e.checkOut} />
              </Field>
              <Field label="Người lớn" error={e.adults?.message}>
                <Input type="number" min={1} max={8} {...register("adults", { valueAsNumber: true })} />
              </Field>
              <Field label="Trẻ em">
                <Input type="number" min={0} max={6} {...register("children", { valueAsNumber: true })} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>2. Chọn loại phòng</CardTitle>
                <CardDescription>Số phòng trống & giá trung bình/đêm theo gói đang chọn</CardDescription>
              </div>
              <Select {...register("ratePlanId")} className="w-full sm:w-72" aria-label="Gói giá">
                {ratePlans.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.mealPlan !== "breakfast" ? ` · ${MEAL_PLAN_LABEL[p.mealPlan]}` : ""}
                  </option>
                ))}
              </Select>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availability.map(({ type, rooms: avail, quote: q }) => {
                const selected = type.id === v.roomTypeId;
                const soldOut = avail.length === 0;
                return (
                  <button
                    type="button"
                    key={type.id}
                    disabled={soldOut}
                    onClick={() => setValue("roomTypeId", type.id, { shouldValidate: true })}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
                      selected && "border-primary bg-primary/8 ring-1 ring-primary",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{type.name}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", soldOut ? "bg-danger/12 text-danger" : avail.length <= 2 ? "bg-warning/18 text-warning" : "bg-success/12 text-success")}>
                        {soldOut ? "Hết phòng" : `Còn ${avail.length}`}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="size-3" /> {type.maxAdults}+{type.maxChildren}</span>
                      <span className="flex items-center gap-1"><BedDouble className="size-3" /> {type.areaM2} m²</span>
                    </p>
                    <p className="tabular mt-2 text-sm font-semibold">{q ? formatVND(q.avg) : "—"} <span className="text-xs font-normal text-muted-foreground">/đêm</span></p>
                  </button>
                );
              })}
            </CardContent>
            <CardContent className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <Field label="Gán phòng" hint="Có thể để trống và gán sau trên Lịch đặt phòng">
                <Controller
                  control={control}
                  name="roomId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onChange={(ev) => field.onChange(ev.target.value || null)}>
                      <option value="">— Chưa gán phòng —</option>
                      {roomsOfType.map((r) => (
                        <option key={r.id} value={r.id}>
                          Phòng {r.number} · Tầng {r.floor}{r.hkStatus === "dirty" ? " · (bẩn)" : ""}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </Field>
              <Field label="Nguồn đặt phòng">
                <Select {...register("source")}>
                  {BOOKING_SOURCES.map((s) => (
                    <option key={s} value={s}>{BOOKING_SOURCE_LABEL[s]}</option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Thông tin khách</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Controller control={control} name="guestId" render={({ field }) => <GuestPicker value={field.value} onChange={field.onChange} invalid={!!e.guestId} />} />
              {e.guestId && <p className="-mt-2 text-xs text-destructive">{e.guestId.message}</p>}
              <Field label="Yêu cầu đặc biệt / ghi chú">
                <Textarea {...register("note")} rows={2} placeholder="VD: Đến muộn sau 22h, cần nôi em bé, trang trí kỷ niệm…" />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phòng</span>
                <span className="font-medium">{rt.name}{v.roomId && ` · ${rooms.find((r) => r.id === v.roomId)?.number}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thời gian</span>
                <span className="flex items-center gap-1 font-medium">
                  {dayjs(v.checkIn).format("DD/MM")} → {dayjs(v.checkOut).format("DD/MM")} · <Moon className="size-3.5" /> {nights} đêm
                </span>
              </div>
              {quote && (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md bg-muted/40 p-2 text-xs">
                  {quote.nights.map((n) => (
                    <li key={n.date} className="tabular flex justify-between">
                      <span className="capitalize">{dayjs(n.date).format("dd DD/MM")}</span>
                      <span className={cn(n.rate > rt.baseRate && "text-warning", n.rate < rt.baseRate && "text-success")}>{formatVND(n.rate)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {extraAdults > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Phụ thu {extraAdults} người lớn × {nights} đêm</span>
                  <span className="tabular">{formatVND(extraFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                <span>Tổng tiền phòng</span>
                <span className="tabular">{formatVND(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Chưa gồm phí dịch vụ {hotel.serviceFeePercent}% & VAT {hotel.vatPercent}%. {rp && !rp.refundable && <b className="text-warning">Gói không hoàn hủy.</b>}</p>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <Field label="Tiền cọc (₫)" error={e.deposit?.message}>
                  <Input type="number" min={0} step={100000} {...register("deposit", { valueAsNumber: true })} />
                </Field>
                <Field label="Hình thức">
                  <Select {...register("depositMethod")}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex gap-1.5">
                {[0, 0.3, 0.5, 1].map((p) => (
                  <Button key={p} type="button" size="sm" variant="outline" className="flex-1" onClick={() => setValue("deposit", Math.round((total * p) / 10000) * 10000)}>
                    {p === 0 ? "0" : `${p * 100}%`}
                  </Button>
                ))}
              </div>
              <label className="flex items-center justify-between gap-2 border-t pt-3">
                <span>
                  <span className="block font-medium">Xác nhận ngay</span>
                  <span className="text-xs text-muted-foreground">Tắt để tạo booking “Tạm giữ”</span>
                </span>
                <Controller control={control} name="confirmed" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Xác nhận ngay" />} />
              </label>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={!quote}>
              Tạo đặt phòng
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
