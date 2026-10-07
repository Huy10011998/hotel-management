"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Hotel, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_GROUPS } from "@/components/layout/nav";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/lib/store";
import { todayStr } from "@/lib/selectors";
import { cn } from "@/lib/utils";

export function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const counts = useStore(
    useShallow((s) => {
    const t = todayStr();
    return {
      "/front-desk/check-in": s.reservations.filter((r) => r.checkIn === t && (r.status === "confirmed" || r.status === "tentative")).length,
      "/front-desk/check-out": s.reservations.filter((r) => r.checkOut <= t && r.status === "checked_in").length,
      "/housekeeping": s.rooms.filter((r) => r.hkStatus === "dirty" && !r.outOfOrder).length,
      "/maintenance": s.tickets.filter((t) => t.status !== "done").length,
    } as Record<string, number>;
    }),
  );

  return (
    <nav className="flex flex-col gap-4 px-2 py-3" aria-label="Điều hướng chính">
      {NAV_GROUPS.map((g) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          {!collapsed && <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>}
          {g.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const count = counts[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                  active ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!!count && (
                  <span
                    className={cn(
                      "tabular rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground",
                      collapsed ? "absolute right-1 top-1" : "ml-auto",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const hotel = useStore((s) => s.hotel);
  return (
    <aside className={cn("no-print sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] lg:flex", collapsed ? "w-16" : "w-60")}>
      <div className={cn("flex h-14 items-center gap-2 border-b px-3", collapsed && "justify-center px-0")}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Hotel className="size-[18px]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{hotel.name}</p>
            <p className="text-[11px] text-muted-foreground">{hotel.stars ? `${"★".repeat(hotel.stars)} · ` : ""}Hotel PMS</p>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        title="Website đặt phòng cho khách"
        className={cn("flex h-10 items-center gap-2 border-t px-4 text-sm text-muted-foreground hover:bg-accent hover:text-foreground", collapsed && "justify-center px-0")}
      >
        <Globe className="size-4 shrink-0" />
        {!collapsed && "Website đặt phòng"}
      </a>
      <button
        onClick={onToggle}
        className="flex h-11 items-center justify-center gap-2 border-t text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Thu gọn</>}
      </button>
    </aside>
  );
}
