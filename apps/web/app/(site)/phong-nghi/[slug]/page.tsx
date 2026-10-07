"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronLeft, Clock, Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/hotel/empty-state";
import { BookingSearch } from "@/components/site/booking-search";
import { RoomCard, RoomFacts } from "@/components/site/room-card";
import { SiteContainer } from "@/components/site/site-shell";
import { RoomGallery } from "@/components/site/site-ui";
import { useStore } from "@/lib/store";
import { defaultStay, fromPrice, slugify } from "@/lib/booking";
import { roomContent } from "@/lib/site-content";
import { formatVND } from "@/lib/utils";

export default function RoomDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { roomTypes, ratePlans, rateRules, hotel } = useStore();
  const rt = roomTypes.find((t) => slugify(t.name) === slug);
  const initial = React.useMemo(() => {
    const d = defaultStay();
    return rt ? { ...d, adults: Math.min(d.adults, rt.maxAdults) } : d;
  }, [rt]);

  if (!rt) {
    return (
      <SiteContainer className="py-16">
        <EmptyState
          title="Không tìm thấy hạng phòng"
          description="Hạng phòng này không còn được bán trực tuyến."
          action={<Link href="/phong-nghi" className={buttonVariants({ variant: "outline" })}>Xem các phòng khác</Link>}
        />
      </SiteContainer>
    );
  }

  const c = roomContent(rt.code);
  const others = roomTypes.filter((t) => t.id !== rt.id).slice(0, 3);

  return (
    <SiteContainer className="py-8">
      <Link href="/phong-nghi" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Tất cả phòng
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          <RoomGallery roomType={rt} />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{rt.name}</h1>
            <p className="mt-1 text-muted-foreground">{c.tagline}</p>
            <RoomFacts roomType={rt} className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm [&_li]:flex [&_li]:items-center [&_li]:gap-1.5 [&_svg]:size-4 [&_svg]:text-primary" />
          </div>
          <p className="leading-relaxed text-muted-foreground">{c.story}</p>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Tiện nghi trong phòng</h2>
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {[...new Set([...c.highlights, ...rt.amenities])].map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-success" /> {a}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Lưu ý</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0" /> Nhận phòng từ {hotel.checkInTime}, trả phòng trước {hotel.checkOutTime}.</li>
              <li className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" /> Tối đa {rt.maxAdults} người lớn và {rt.maxChildren} trẻ em. Giường phụ {formatVND(rt.extraAdultFee)}/đêm, đặt qua lễ tân.</li>
              <li className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" /> Toàn bộ phòng không hút thuốc. <Link href="/chinh-sach" className="text-primary hover:underline">Xem chính sách</Link></li>
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Giá chỉ từ</p>
            <p className="tabular text-2xl font-bold text-primary">
              {formatVND(fromPrice(rt, ratePlans, rateRules))}
              <span className="text-sm font-normal text-muted-foreground"> /đêm</span>
            </p>
            <p className="mb-4 text-xs text-muted-foreground">Chưa gồm phí dịch vụ {hotel.serviceFeePercent}% và VAT {hotel.vatPercent}%</p>
            <BookingSearch initial={initial} extra={{ roomType: rt.id }} compact className="md:grid-cols-1" />
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold">Có thể bạn cũng thích</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((t) => (
              <RoomCard key={t.id} roomType={t} />
            ))}
          </div>
        </section>
      )}
    </SiteContainer>
  );
}
