"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hotel, Mail, MapPin, Menu, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/components/layout/app-shell";
import { useHotel } from "@/lib/store";
import { SITE_AREA } from "@/lib/site-content";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/phong-nghi", label: "Phòng nghỉ" },
  { href: "/#tien-ich", label: "Tiện ích" },
  { href: "/#kham-pha", label: "Khám phá" },
  { href: "/#lien-he", label: "Liên hệ" },
  { href: "/tra-cuu", label: "Tra cứu đặt phòng" },
];

function Brand({ className }: { className?: string }) {
  const hotel = useHotel();
  return (
    <Link href="/" className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Hotel className="size-5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-semibold">{hotel.name}</span>
        {hotel.stars ? (
          <span className="block text-[11px] tracking-wide text-warning">{"★".repeat(hotel.stars)}</span>
        ) : (
          <span className="block truncate text-[11px] text-muted-foreground">{SITE_AREA}</span>
        )}
      </span>
    </Link>
  );
}

function SiteHeader() {
  const hotel = useHotel();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const active = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Brand className="mr-auto" />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn("rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", active(n.href) && "text-primary")}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <a href={`tel:${hotel.phone.replace(/\s/g, "")}`} className="hidden items-center gap-1.5 text-sm font-medium xl:flex">
          <Phone className="size-4 text-primary" /> {hotel.phone}
        </a>
        <Link href="/dat-phong" className={buttonVariants({ className: "hidden sm:inline-flex" })}>
          Đặt phòng
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "lg:hidden" })} aria-label="Mở menu">
            <Menu className="size-5" />
          </DialogTrigger>
          <DialogContent side="right" className="gap-2">
            <DialogTitle className="sr-only">Menu</DialogTitle>
            <Brand className="mb-4" />
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}
            <Link href="/dat-phong" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "mt-4" })}>
              Đặt phòng ngay
            </Link>
            <a href={`tel:${hotel.phone.replace(/\s/g, "")}`} className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" /> {hotel.phone}
            </a>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}

function SiteFooter() {
  const hotel = useHotel();
  return (
    <footer id="lien-he" className="no-print scroll-mt-20 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <Brand />
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {hotel.address}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-primary" /> <a href={`tel:${hotel.phone.replace(/\s/g, "")}`} className="hover:text-foreground">{hotel.phone}</a> · Lễ tân 24/7</li>
            <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-primary" /> <a href={`mailto:${hotel.email}`} className="break-all hover:text-foreground">{hotel.email}</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Khám phá</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/phong-nghi" className="hover:text-foreground">Phòng nghỉ</Link></li>
            <li><Link href="/dat-phong" className="hover:text-foreground">Đặt phòng trực tuyến</Link></li>
            <li><Link href="/tra-cuu" className="hover:text-foreground">Tra cứu / hủy đặt phòng</Link></li>
            <li><Link href="/#cau-hoi" className="hover:text-foreground">Câu hỏi thường gặp</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Chính sách</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/chinh-sach#nhan-tra-phong" className="hover:text-foreground">Nhận & trả phòng</Link></li>
            <li><Link href="/chinh-sach#huy-phong" className="hover:text-foreground">Hủy & hoàn tiền</Link></li>
            <li><Link href="/chinh-sach#thanh-toan" className="hover:text-foreground">Thanh toán</Link></li>
            <li><Link href="/chinh-sach#bao-mat" className="hover:text-foreground">Bảo mật dữ liệu cá nhân</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {hotel.legalName}{hotel.taxCode ? ` · MST ${hotel.taxCode}` : ""}</p>
          <Link href="/login" className="hover:text-foreground">Dành cho nhân viên →</Link>
        </div>
      </div>
    </footer>
  );
}

function SiteSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Khung website khách. Dữ liệu mẫu nằm ở localStorage nên chỉ render sau khi mount. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="min-h-dvh">
        <div className="h-16 border-b bg-card" />
        <SiteSkeleton />
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Khung nội dung chuẩn cho các trang con. */
export function SiteContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)} {...props} />;
}
