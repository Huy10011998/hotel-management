"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Bell, BedDouble, CalendarDays, ClipboardList, Keyboard, LogOut, Menu, Monitor, Moon, Plus, RotateCcw, Search, Sun, User, Users } from "lucide-react";
import { STAFF_ROLE_LABEL } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { SidebarNav } from "@/components/layout/sidebar";
import { useStore } from "@/lib/store";
import { todayStr } from "@/lib/selectors";
import { cn, dayjs, initials, normalizeVN } from "@/lib/utils";

const SHORTCUTS: [string, string, string][] = [
  ["Ctrl/⌘ + K", "Tìm nhanh phòng, khách, mã đặt phòng", ""],
  ["Alt + N", "Tạo đặt phòng mới", "/reservations/new"],
  ["Alt + R", "Sơ đồ phòng", "/room-rack"],
  ["Alt + L", "Lịch đặt phòng", "/calendar"],
  ["Alt + I", "Check-in", "/front-desk/check-in"],
  ["Alt + O", "Check-out", "/front-desk/check-out"],
  ["Alt + D", "Tổng quan", "/dashboard"],
];

function GlobalSearch() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { rooms, guests, reservations } = useStore();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = React.useMemo(() => {
    const nq = normalizeVN(q.trim());
    if (nq.length < 1) return null;
    const guestById = new Map(guests.map((g) => [g.id, g]));
    return {
      rooms: rooms.filter((r) => r.number.includes(nq)).slice(0, 5),
      guests: guests.filter((g) => normalizeVN(g.fullName).includes(nq) || g.phone.includes(nq) || g.idNumber.toLowerCase().includes(nq)).slice(0, 5),
      reservations: reservations
        .filter((r) => r.code.toLowerCase().includes(nq) || normalizeVN(guestById.get(r.guestId)?.fullName ?? "").includes(nq))
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
        .slice(0, 5)
        .map((r) => ({ r, g: guestById.get(r.guestId) })),
    };
  }, [q, rooms, guests, reservations]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  };
  const empty = results && !results.rooms.length && !results.guests.length && !results.reservations.length;

  return (
    <Popover open={open && !!results} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Tìm phòng, tên khách, SĐT, mã đặt phòng…"
            aria-label="Tìm kiếm nhanh"
            className="h-9 w-full rounded-md border border-input bg-muted/50 pl-8 pr-14 text-sm placeholder:text-muted-foreground focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1.5 text-[10px] text-muted-foreground sm:block">⌘K</kbd>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-80 p-1.5" onOpenAutoFocus={(e) => e.preventDefault()}>
        {empty && <p className="p-3 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</p>}
        {results?.rooms.length ? (
          <ResultGroup label="Phòng">
            {results.rooms.map((r) => (
              <ResultItem key={r.id} icon={BedDouble} onClick={() => go(`/room-rack?room=${r.number}`)} title={`Phòng ${r.number}`} sub={`Tầng ${r.floor}`} />
            ))}
          </ResultGroup>
        ) : null}
        {results?.reservations.length ? (
          <ResultGroup label="Đặt phòng">
            {results.reservations.map(({ r, g }) => (
              <ResultItem key={r.id} icon={ClipboardList} onClick={() => go(`/reservations/${r.id}`)} title={`${r.code} · ${g?.fullName ?? ""}`} sub={`${dayjs(r.checkIn).format("DD/MM")} → ${dayjs(r.checkOut).format("DD/MM")}`} />
            ))}
          </ResultGroup>
        ) : null}
        {results?.guests.length ? (
          <ResultGroup label="Khách hàng">
            {results.guests.map((g) => (
              <ResultItem key={g.id} icon={Users} onClick={() => go(`/guests/${g.id}`)} title={g.fullName} sub={g.phone} />
            ))}
          </ResultGroup>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ResultItem({ icon: Icon, title, sub, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {sub && <span className="shrink-0 text-xs text-muted-foreground">{sub}</span>}
    </button>
  );
}

function Notifications() {
  const today = todayStr();
  const reservations = useStore((s) => s.reservations);
  const tickets = useStore((s) => s.tickets);
  const items = React.useMemo(() => {
    const list: { href: string; text: string; tone: string }[] = [];
    const overdue = reservations.filter((r) => r.status === "checked_in" && r.checkOut < today);
    if (overdue.length) list.push({ href: "/front-desk/check-out", text: `${overdue.length} phòng quá hạn trả phòng`, tone: "bg-danger" });
    const dueOut = reservations.filter((r) => r.status === "checked_in" && r.checkOut === today);
    if (dueOut.length) list.push({ href: "/front-desk/check-out", text: `${dueOut.length} phòng cần trả hôm nay`, tone: "bg-warning" });
    const arr = reservations.filter((r) => r.checkIn === today && (r.status === "confirmed" || r.status === "tentative"));
    if (arr.length) list.push({ href: "/front-desk/check-in", text: `${arr.length} khách sắp đến hôm nay`, tone: "bg-info" });
    const unassigned = reservations.filter((r) => !r.roomId && r.status === "confirmed" && r.checkIn <= dayjs(today).add(3, "day").format("YYYY-MM-DD"));
    if (unassigned.length) list.push({ href: "/reservations?unassigned=1", text: `${unassigned.length} đặt phòng chưa gán phòng (3 ngày tới)`, tone: "bg-warning" });
    const urgent = tickets.filter((t) => t.status !== "done" && (t.priority === "urgent" || t.priority === "high"));
    if (urgent.length) list.push({ href: "/maintenance", text: `${urgent.length} sự cố bảo trì ưu tiên cao`, tone: "bg-danger" });
    const tentative = reservations.filter((r) => r.status === "tentative" && r.checkIn > today);
    if (tentative.length) list.push({ href: "/reservations?status=tentative", text: `${tentative.length} đặt phòng tạm giữ chờ xác nhận`, tone: "bg-muted-foreground" });
    return list;
  }, [reservations, tickets, today]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Thông báo" className="relative">
          <Bell className="size-[18px]" />
          {items.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-card" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Cần xử lý</DropdownMenuLabel>
        {items.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted-foreground">Không có việc tồn đọng 🎉</p>}
        {items.map((it, i) => (
          <DropdownMenuItem key={i} asChild>
            <Link href={it.href}>
              <span className={cn("size-2 shrink-0 rounded-full", it.tone)} />
              {it.text}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const resetDemo = useStore((s) => s.resetDemo);
  const currentUser = useStore((s) => s.staff.find((x) => x.id === "st-1"));
  const hotel = useStore((s) => s.hotel);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const map: Record<string, string> = { KeyN: "/reservations/new", KeyR: "/room-rack", KeyL: "/calendar", KeyI: "/front-desk/check-in", KeyO: "/front-desk/check-out", KeyD: "/dashboard" };
        if (map[e.code]) {
          e.preventDefault();
          router.push(map[e.code]);
        }
      }
      if (e.key === "?" && e.shiftKey) setHelpOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/85 px-3 backdrop-blur sm:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
        <Menu className="size-5" />
      </Button>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="gap-0 p-0" side="left" aria-describedby={undefined}>
          <DialogTitle className="flex h-14 items-center border-b px-4 text-sm">{hotel.name}</DialogTitle>
          <div className="overflow-y-auto">
            <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 hidden items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs md:flex" title="Ngày làm việc (ngày khách sạn) — chuyển sang ngày mới sau Night Audit">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Ngày làm việc:</span>
          <span className="font-medium capitalize">{dayjs().format("dddd, DD/MM/YYYY")}</span>
        </div>
        <Button size="sm" onClick={() => router.push("/reservations/new")} className="hidden sm:inline-flex" title="Alt + N">
          <Plus /> Đặt phòng
        </Button>
        <Button size="icon" onClick={() => router.push("/reservations/new")} className="sm:hidden" aria-label="Đặt phòng mới">
          <Plus />
        </Button>
        <Notifications />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Giao diện">
              <Sun className="size-[18px] dark:hidden" />
              <Moon className="hidden size-[18px] dark:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {[
              ["light", "Sáng", Sun],
              ["dark", "Tối", Moon],
              ["system", "Theo hệ thống", Monitor],
            ].map(([v, l, I]) => {
              const Icon = I as typeof Sun;
              return (
                <DropdownMenuItem key={v as string} onSelect={() => setTheme(v as string)} className={cn(theme === v && "font-medium text-primary")}>
                  <Icon /> {l as string}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full p-0.5 hover:bg-accent sm:rounded-md sm:pr-2" aria-label="Tài khoản">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(currentUser?.fullName ?? "")}</span>
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-sm font-medium">{currentUser?.fullName}</span>
                <span className="block text-[11px] text-muted-foreground">{currentUser && STAFF_ROLE_LABEL[currentUser.role]}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{currentUser?.email}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/staff">
                <User /> Hồ sơ & phân quyền
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setHelpOpen(true)}>
              <Keyboard /> Phím tắt
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                resetDemo();
                toast.success("Đã khôi phục dữ liệu mẫu");
              }}
            >
              <RotateCcw /> Khôi phục dữ liệu mẫu
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive">
              <Link href="/login">
                <LogOut /> Đăng xuất
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Phím tắt lễ tân</DialogTitle>
            <DialogDescription>Nhấn Shift + ? để mở bảng này.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 text-sm">
            {SHORTCUTS.map(([k, d]) => (
              <li key={k} className="flex items-center justify-between gap-3">
                <span>{d}</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">{k}</kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </header>
  );
}
