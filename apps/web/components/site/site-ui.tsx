"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Star } from "lucide-react";
import type { Hotel, RatePlan, RoomType } from "@hotel/shared";
import { MEAL_PLAN_LABEL } from "@hotel/shared";
import { roomContent } from "@/lib/site-content";
import { cn, dayjs, formatVND, nightsBetween } from "@/lib/utils";

export function RoomPhoto({ src, alt, className, priority, sizes = "(min-width: 1024px) 33vw, 100vw" }: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

/** Ảnh lớn + dải ảnh nhỏ để chuyển. */
export function RoomGallery({ roomType }: { roomType: RoomType }) {
  const images = roomContent(roomType.code).images;
  const [idx, setIdx] = React.useState(0);
  return (
    <div className="space-y-2">
      <RoomPhoto src={images[idx]} alt={`${roomType.name} — ảnh ${idx + 1}`} priority className="aspect-[3/2] rounded-xl" sizes="(min-width: 1024px) 60vw, 100vw" />
      <div className="grid grid-cols-4 gap-2">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Xem ảnh ${i + 1}`}
            aria-pressed={i === idx}
            className={cn("overflow-hidden rounded-lg ring-offset-2 ring-offset-background transition-opacity", i === idx ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100")}
          >
            <RoomPhoto src={src} alt="" className="aspect-[3/2]" sizes="15vw" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function RatingBadge({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground tabular", className)}>
      <Star className="size-3 fill-current" /> {score.toFixed(1).replace(".", ",")}
    </span>
  );
}

const STEPS = ["Chọn phòng", "Thông tin & thanh toán", "Xác nhận"];

export function BookingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Các bước đặt phòng">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex min-w-0 items-center gap-2" aria-current={active ? "step" : undefined}>
            {i > 0 && <span className={cn("h-px w-4 shrink-0 sm:w-10", done || active ? "bg-primary" : "bg-border")} />}
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done ? "bg-primary text-primary-foreground" : active ? "bg-primary/12 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : step}
            </span>
            <span className={cn("truncate", active ? "font-medium" : "hidden text-muted-foreground sm:inline")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export interface PriceLine {
  label: string;
  amount: number;
}

/** Khung tóm tắt kỳ lưu trú + chi tiết giá — dùng ở bước thông tin và trang xác nhận. */
export function StaySummary({
  hotel,
  roomType,
  ratePlan,
  checkIn,
  checkOut,
  adults,
  childCount,
  lines,
  totals,
  cancellation,
  children,
}: {
  hotel: Hotel;
  roomType: RoomType;
  ratePlan?: RatePlan;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  lines: PriceLine[];
  totals: { serviceFee: number; vat: number; total: number };
  cancellation?: string;
  children?: React.ReactNode;
}) {
  const nights = nightsBetween(checkIn, checkOut);
  const img = roomContent(roomType.code).images[0];
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <RoomPhoto src={img} alt={roomType.name} className="aspect-[2/1]" sizes="400px" />
      <div className="space-y-4 p-4">
        <div>
          <p className="font-semibold">{roomType.name}</p>
          {ratePlan && (
            <p className="text-sm text-muted-foreground">
              {ratePlan.name} · {MEAL_PLAN_LABEL[ratePlan.mealPlan]}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/60 p-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Nhận phòng</dt>
            <dd className="font-medium capitalize">{dayjs(checkIn).format("dd, DD/MM/YYYY")}</dd>
            <dd className="text-xs text-muted-foreground">Từ {hotel.checkInTime}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Trả phòng</dt>
            <dd className="font-medium capitalize">{dayjs(checkOut).format("dd, DD/MM/YYYY")}</dd>
            <dd className="text-xs text-muted-foreground">Trước {hotel.checkOutTime}</dd>
          </div>
          <div className="col-span-2 text-xs text-muted-foreground">
            {nights} đêm · {adults} người lớn{childCount ? ` · ${childCount} trẻ em` : ""}
          </div>
        </dl>
        <div className="space-y-1.5 text-sm">
          {lines.map((l) => (
            <div key={l.label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{l.label}</span>
              <span className="tabular shrink-0">{formatVND(l.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Phí dịch vụ {hotel.serviceFeePercent}%</span>
            <span className="tabular">{formatVND(totals.serviceFee)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">VAT {hotel.vatPercent}%</span>
            <span className="tabular">{formatVND(totals.vat)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t pt-2">
            <span className="font-semibold">Tổng cộng</span>
            <span className="tabular text-lg font-bold text-primary">{formatVND(totals.total)}</span>
          </div>
          <p className="text-right text-xs text-muted-foreground">Đã bao gồm thuế và phí</p>
        </div>
        {cancellation && <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">{cancellation}</p>}
        {children}
      </div>
    </div>
  );
}
