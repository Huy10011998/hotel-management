"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";

/** Dữ liệu mẫu nằm ở localStorage nên chỉ render sau khi mount (tránh lệch SSR/CSR). */
export function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Đang tải">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    } catch {}
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("sidebar-collapsed", c ? "0" : "1");
      } catch {}
      return !c;
    });

  return (
    <div className="flex min-h-dvh">
      {mounted ? <Sidebar collapsed={collapsed} onToggle={toggle} /> : <div className="hidden w-60 shrink-0 border-r bg-sidebar lg:block" />}
      <div className="flex min-w-0 flex-1 flex-col">
        {mounted ? <Topbar /> : <div className="h-14 border-b bg-card" />}
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">{mounted ? children : <PageSkeleton />}</main>
      </div>
    </div>
  );
}
