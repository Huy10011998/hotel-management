"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BOOKING_WINDOW_DAYS, MAX_NIGHTS } from "@/lib/booking";
import { todayStr } from "@/lib/selectors";
import { cn, dayjs, formatVNDShort, nightsBetween, toDateOnly } from "@/lib/utils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function Month({
  month,
  start,
  end,
  hover,
  pickingEnd,
  priceOf,
  onPick,
  onHover,
}: {
  month: dayjs.Dayjs;
  start: string;
  end: string | null;
  hover: string | null;
  pickingEnd: boolean;
  priceOf?: (date: string) => number | null;
  onPick: (d: string) => void;
  onHover: (d: string | null) => void;
}) {
  const today = todayStr();
  const lastBookable = toDateOnly(dayjs().add(BOOKING_WINDOW_DAYS, "day"));
  const maxEnd = toDateOnly(dayjs(start).add(MAX_NIGHTS, "day"));
  const lead = (month.startOf("month").day() + 6) % 7; // tuần bắt đầu từ thứ Hai
  const days = Array.from({ length: month.daysInMonth() }, (_, i) => toDateOnly(month.date(i + 1)));
  const rangeEnd = end ?? (pickingEnd ? hover : null);

  return (
    <div className="w-full sm:w-[17rem]">
      <p className="mb-2 text-center text-sm font-semibold capitalize">{month.format("MMMM YYYY")}</p>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => onHover(null)}>
        {Array.from({ length: lead }).map((_, i) => (
          <span key={`e${i}`} />
        ))}
        {days.map((d) => {
          const disabled = pickingEnd ? d <= start || d > maxEnd || d > lastBookable : d < today || d > lastBookable;
          const isStart = d === start;
          const isEnd = d === rangeEnd;
          const inRange = !!rangeEnd && d > start && d < rangeEnd;
          const price = !disabled && !pickingEnd ? priceOf?.(d) : null;
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              onMouseEnter={() => onHover(d)}
              aria-label={dayjs(d).format("dddd, DD/MM/YYYY")}
              aria-pressed={isStart || isEnd}
              className={cn(
                "flex h-11 flex-col items-center justify-center rounded-md text-sm tabular transition-colors hover:bg-accent disabled:pointer-events-none disabled:text-muted-foreground/40",
                inRange && "rounded-none bg-primary/10",
                (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary",
                d === today && !isStart && !isEnd && "font-bold text-primary",
              )}
            >
              <span className="leading-none">{dayjs(d).date()}</span>
              {price ? <span className={cn("mt-0.5 text-[9px] leading-none", isStart || isEnd ? "text-primary-foreground/80" : "text-muted-foreground")}>{formatVNDShort(price)}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Chọn ngày nhận – trả phòng. `priceOf` trả về giá thấp nhất của đêm đó (hiện dưới số ngày). */
export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  priceOf,
  className,
}: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  priceOf?: (date: string) => number | null;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [start, setStart] = React.useState(checkIn);
  const [end, setEnd] = React.useState<string | null>(checkOut);
  const [hover, setHover] = React.useState<string | null>(null);
  const [month, setMonth] = React.useState(() => dayjs(checkIn).startOf("month"));
  const pickingEnd = end === null;
  const minMonth = dayjs().startOf("month");

  const onOpenChange = (o: boolean) => {
    if (o) {
      setStart(checkIn);
      setEnd(checkOut);
      setMonth(dayjs(checkIn).startOf("month"));
    }
    setOpen(o);
  };

  const pick = (d: string) => {
    if (!pickingEnd || d <= start) {
      setStart(d);
      setEnd(null);
      return;
    }
    setEnd(d);
    onChange(start, d);
    setOpen(false);
  };

  const nights = nightsBetween(checkIn, checkOut);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("flex h-12 w-full items-center gap-3 rounded-md border border-input bg-card px-3 text-left text-sm shadow-xs hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40", className)}
          aria-label="Chọn ngày nhận phòng và trả phòng"
        >
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-muted-foreground">Nhận phòng — Trả phòng</span>
            <span className="block truncate font-medium capitalize">
              {dayjs(checkIn).format("dd, DD/MM")} → {dayjs(checkOut).format("dd, DD/MM")}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{nights} đêm</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(36rem,calc(100vw-2rem))] p-3">
        <div className="relative flex gap-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute left-0 top-[-4px]"
            onClick={() => setMonth((m) => m.subtract(1, "month"))}
            disabled={!month.isAfter(minMonth)}
            aria-label="Tháng trước"
          >
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" className="absolute right-0 top-[-4px]" onClick={() => setMonth((m) => m.add(1, "month"))} aria-label="Tháng sau">
            <ChevronRight />
          </Button>
          {[0, 1].map((i) => (
            <div key={i} className={cn("flex-1", i === 1 && "hidden sm:block")}>
              <Month
                month={month.add(i, "month")}
                start={start}
                end={end}
                hover={hover}
                pickingEnd={pickingEnd}
                priceOf={priceOf}
                onPick={pick}
                onHover={setHover}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{pickingEnd ? "Chọn ngày trả phòng" : "Chọn ngày nhận phòng"}</span>
          {priceOf && !pickingEnd ? <span>Giá thấp nhất/đêm, chưa gồm thuế phí</span> : <span>Tối đa {MAX_NIGHTS} đêm</span>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
