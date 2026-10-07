"use client";

import { RoomCard } from "@/components/site/room-card";
import { SiteContainer } from "@/components/site/site-shell";
import { useStore } from "@/lib/store";

export default function RoomsPage() {
  const roomTypes = useStore((s) => s.roomTypes);
  return (
    <SiteContainer className="py-10">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Phòng nghỉ</p>
        <h1 className="text-3xl font-semibold tracking-tight">Phòng & Suite</h1>
        <p className="mt-2 text-muted-foreground">
          Tất cả phòng đều có điều hòa, Wi-Fi tốc độ cao, minibar, két sắt và dọn phòng hằng ngày. Giá hiển thị là giá thấp nhất trong 30 ngày tới, chưa gồm thuế phí.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...roomTypes]
          .sort((a, b) => a.baseRate - b.baseRate)
          .map((rt) => (
            <RoomCard key={rt.id} roomType={rt} />
          ))}
      </div>
    </SiteContainer>
  );
}
