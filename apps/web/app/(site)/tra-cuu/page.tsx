"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteContainer } from "@/components/site/site-shell";
import { BookingLookupForm } from "@/components/site/booking-lookup";
import { useHotel } from "@/lib/store";

export default function LookupPage() {
  return (
    <React.Suspense>
      <Lookup />
    </React.Suspense>
  );
}

function Lookup() {
  const router = useRouter();
  const params = useSearchParams();
  const hotel = useHotel();
  return (
    <SiteContainer className="flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Tra cứu đặt phòng</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Xem chi tiết, thanh toán, tải lịch hoặc hủy đặt phòng của bạn.</p>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <BookingLookupForm initialCode={params.get("code") ?? ""} onFound={(code) => router.push(`/don-dat-phong/${code}`)} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Đặt qua Booking.com, Agoda…? Vui lòng thay đổi trên trang bạn đã đặt, hoặc gọi {hotel.phone}.
        </p>
      </div>
    </SiteContainer>
  );
}
