import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** % thay đổi so với kỳ trước. */
  delta?: number;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "warning" | "info" | "danger";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/12 text-info",
    danger: "bg-danger/12 text-danger",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="tabular mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2", toneCls)}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {(sub || delta !== undefined) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-success" : "text-danger")}>
              {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1).replace(".", ",")}%
            </span>
          )}
          {sub}
        </div>
      )}
    </Card>
  );
}
