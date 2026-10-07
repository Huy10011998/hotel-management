"use client";

import { formatVND } from "@/lib/utils";

interface Item {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
}

/** Tooltip thống nhất cho mọi biểu đồ Recharts. */
export function ChartTooltip({
  active,
  payload,
  label,
  money = true,
  suffix = "",
}: {
  active?: boolean;
  payload?: Item[];
  label?: string | number;
  money?: boolean;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tabular ml-auto pl-3 font-medium">
            {money ? formatVND(Number(p.value)) : `${p.value}${suffix}`}
          </span>
        </p>
      ))}
    </div>
  );
}

export const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
