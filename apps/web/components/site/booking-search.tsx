"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/site/date-range-picker";
import { useStore } from "@/lib/store";
import { nightlyRate, roomTypeAvailability } from "@/lib/selectors";
import { MAX_ADULTS, MAX_CHILDREN, stayQuery, webRatePlans, type StayParams } from "@/lib/booking";
import { cn, dayjs, toDateOnly } from "@/lib/utils";

/** Giá thấp nhất mỗi đêm trên mọi hạng phòng còn trống — hiện trong lịch chọn ngày. */
export function useLowestRate() {
  const { roomTypes, ratePlans, rateRules, rooms, reservations } = useStore();
  return React.useMemo(() => {
    const plans = webRatePlans(ratePlans, "");
    const cache = new Map<string, number | null>();
    return (date: string) => {
      if (cache.has(date)) return cache.get(date)!;
      const next = toDateOnly(dayjs(date).add(1, "day"));
      let min: number | null = null;
      for (const rt of roomTypes) {
        if (roomTypeAvailability(rt.id, rooms, reservations, date, next) < 1) continue;
        for (const rp of plans) {
          const rate = nightlyRate(rt, rp, date, rateRules);
          if (min === null || rate < min) min = rate;
        }
      }
      cache.set(date, min);
      return min;
    };
  }, [roomTypes, ratePlans, rateRules, rooms, reservations]);
}

function Counter({ label, hint, value, min, max, onChange }: { label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Giảm ${label.toLowerCase()}`}>
          <Minus />
        </Button>
        <span className="tabular w-5 text-center font-semibold" aria-live="polite">{value}</span>
        <Button variant="outline" size="icon-sm" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Tăng ${label.toLowerCase()}`}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}

export function OccupancyPicker({ adults, childCount, onChange, className }: { adults: number; childCount: number; onChange: (adults: number, children: number) => void; className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("flex h-12 w-full items-center gap-3 rounded-md border border-input bg-card px-3 text-left text-sm shadow-xs hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40", className)}
          aria-label="Chọn số khách"
        >
          <Users className="size-5 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-[11px] text-muted-foreground">Khách</span>
            <span className="block truncate font-medium">
              {adults} người lớn{childCount ? ` · ${childCount} trẻ em` : ""}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 divide-y py-2">
        <Counter label="Người lớn" hint="Từ 12 tuổi" value={adults} min={1} max={MAX_ADULTS} onChange={(v) => onChange(v, childCount)} />
        <Counter label="Trẻ em" hint="Dưới 12 tuổi" value={childCount} min={0} max={MAX_CHILDREN} onChange={(v) => onChange(adults, v)} />
        <p className="pt-2 text-xs text-muted-foreground">Đặt từ 2 phòng trở lên hoặc đoàn trên 8 khách, vui lòng liên hệ khách sạn để có giá tốt nhất.</p>
      </PopoverContent>
    </Popover>
  );
}

/** Thanh tìm phòng trống — chuyển sang /dat-phong với tham số trên URL. Đổi `key` theo URL để nạp lại giá trị ban đầu. */
export function BookingSearch({ initial, extra, className, compact }: { initial: StayParams; extra?: Record<string, string | undefined>; className?: string; compact?: boolean }) {
  const router = useRouter();
  const priceOf = useLowestRate();
  const [stay, setStay] = React.useState(initial);
  const [showPromo, setShowPromo] = React.useState(!!initial.promo);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dat-phong?${stayQuery({ ...stay, promo: stay.promo.trim().toUpperCase() }, extra)}`);
  };

  return (
    <form onSubmit={submit} className={cn("grid gap-2", compact ? "md:grid-cols-[1.4fr_1fr_auto]" : "lg:grid-cols-[1.4fr_1fr_auto]", className)}>
      <DateRangePicker checkIn={stay.checkIn} checkOut={stay.checkOut} priceOf={priceOf} onChange={(checkIn, checkOut) => setStay((s) => ({ ...s, checkIn, checkOut }))} />
      <OccupancyPicker adults={stay.adults} childCount={stay.children} onChange={(adults, children) => setStay((s) => ({ ...s, adults, children }))} />
      <Button type="submit" size="lg" className="h-12 px-6">
        <Search /> {compact ? "Cập nhật" : "Tìm phòng"}
      </Button>
      <div className="col-span-full">
        {showPromo ? (
          <div className="flex max-w-xs items-center gap-2">
            <Tag className="size-4 shrink-0 text-muted-foreground" />
            <Input value={stay.promo} onChange={(e) => setStay((s) => ({ ...s, promo: e.target.value }))} placeholder="Nhập mã ưu đãi" className="uppercase" aria-label="Mã ưu đãi" />
          </div>
        ) : (
          <button type="button" onClick={() => setShowPromo(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <Tag className="size-3.5" /> Có mã ưu đãi / mã công ty?
          </button>
        )}
      </div>
    </form>
  );
}
