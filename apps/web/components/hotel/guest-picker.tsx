"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, Crown, Search, UserPlus, X } from "lucide-react";
import { ID_TYPE_LABEL, type Guest } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { GuestFormDialog } from "@/components/hotel/guest-form-dialog";
import { useStore } from "@/lib/store";
import { initials, normalizeVN } from "@/lib/utils";

export function GuestPicker({ value, onChange, invalid }: { value: string; onChange: (id: string) => void; invalid?: boolean }) {
  const guests = useStore((s) => s.guests);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const selected = guests.find((g) => g.id === value);

  const results = React.useMemo(() => {
    const nq = normalizeVN(q.trim());
    if (!nq) return guests.slice(0, 6);
    return guests.filter((g) => normalizeVN(g.fullName).includes(nq) || g.phone.includes(nq) || g.idNumber.toLowerCase().includes(nq)).slice(0, 8);
  }, [q, guests]);

  if (selected) return <SelectedGuest guest={selected} onClear={() => onChange("")} />;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Tìm theo tên, SĐT, số CCCD/hộ chiếu…"
                className="pl-8"
                aria-invalid={invalid}
              />
            </div>
            <Button variant="outline" onClick={() => setCreating(true)}>
              <UserPlus /> Khách mới
            </Button>
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-72 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
          {results.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Không tìm thấy.{" "}
              <button className="font-medium text-primary hover:underline" onClick={() => { setOpen(false); setCreating(true); }}>
                Tạo khách &quot;{q}&quot;
              </button>
            </div>
          ) : (
            results.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  onChange(g.id);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">{initials(g.fullName)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate font-medium">
                    {g.fullName}
                    {g.vip && <Crown className="size-3 text-warning" />}
                    {g.blacklisted && <Ban className="size-3 text-danger" />}
                  </span>
                  <span className="text-xs text-muted-foreground">{g.phone} · {g.nationality}</span>
                </span>
              </button>
            ))
          )}
        </PopoverContent>
      </Popover>
      <GuestFormDialog open={creating} onOpenChange={setCreating} defaultName={q} onSaved={(g) => onChange(g.id)} />
    </>
  );
}

export function SelectedGuest({ guest, onClear }: { guest: Guest; onClear?: () => void }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${guest.blacklisted ? "border-danger/50 bg-danger/8" : "bg-muted/30"}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{initials(guest.fullName)}</span>
      <div className="min-w-0 flex-1 text-sm">
        <Link href={`/guests/${guest.id}`} className="flex items-center gap-1.5 font-semibold hover:underline">
          {guest.fullName} {guest.vip && <Crown className="size-3.5 text-warning" />}
        </Link>
        <p className="text-xs text-muted-foreground">
          {guest.phone}
          {guest.email && ` · ${guest.email}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {ID_TYPE_LABEL[guest.idType]}: {guest.idNumber} · {guest.nationality}
        </p>
        {guest.blacklisted && <p className="mt-1 text-xs font-medium text-danger">⚠ Khách trong danh sách đen: {guest.notes}</p>}
        {guest.tags.length > 0 && <p className="mt-1 text-xs">Sở thích: {guest.tags.join(", ")}</p>}
      </div>
      {onClear && (
        <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Bỏ chọn khách">
          <X />
        </Button>
      )}
    </div>
  );
}
