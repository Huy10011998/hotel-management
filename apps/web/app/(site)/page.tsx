"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BookingSearch } from "@/components/site/booking-search";
import { RoomCard } from "@/components/site/room-card";
import { SiteContainer } from "@/components/site/site-shell";
import { RatingBadge, RoomPhoto } from "@/components/site/site-ui";
import { useStore } from "@/lib/store";
import { defaultStay } from "@/lib/booking";
import {
  ATTRACTIONS,
  DIRECT_BENEFITS,
  FACILITIES,
  FAQS,
  HERO_IMAGE,
  NEARBY,
  PHOTO_CREDITS,
  RATING,
  RATING_BREAKDOWN,
  REVIEWS,
} from "@/lib/site-content";
import { cn } from "@/lib/utils";

function SectionTitle({
  eyebrow,
  title,
  text,
  className,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 max-w-2xl", className)}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {text && <p className="mt-2 text-muted-foreground">{text}</p>}
    </div>
  );
}

export default function HomePage() {
  const { hotel, roomTypes } = useStore();
  const initial = React.useMemo(() => defaultStay(), []);
  const faqs = FAQS.map(([q, a]) => [
    q,
    a
      .replace("{checkIn}", hotel.checkInTime)
      .replace("{checkOut}", hotel.checkOutTime)
      .replace("{fee}", String(hotel.serviceFeePercent))
      .replace("{vat}", String(hotel.vatPercent)),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <Image
            src={HERO_IMAGE}
            alt="Hồ nước trong công viên Văn Miếu Cao Lãnh"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
        </div>
        <SiteContainer className="flex min-h-[30rem] flex-col justify-center pb-28 pt-16 text-white sm:min-h-[34rem]">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white/85">
            {hotel.stars > 0 && (
              <span className="tracking-wider text-warning">
                {"★".repeat(hotel.stars)}
              </span>
            )}
            {hotel.name} · Trung tâm Phường Cao Lãnh, Đồng Tháp
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Nghỉ chân giữa lòng Cao Lãnh — Đất Sen hồng
          </h1>
          <p className="mt-4 max-w-xl text-white/85 sm:text-lg">
            Hẻm yên tĩnh trên đường Đặng Văn Bình, gần công viên Văn Miếu và chợ
            Cao Lãnh. Đặt trực tiếp để nhận giá tốt nhất.
          </p>
          {RATING && (
            <div className="mt-6 flex items-center gap-3 text-sm">
              <RatingBadge score={RATING.score} className="text-sm" />
              <span className="font-medium">{RATING.label}</span>
              <span className="text-white/75">
                · {RATING.count.toLocaleString("vi-VN")} đánh giá
              </span>
            </div>
          )}
        </SiteContainer>
      </section>

      {/* Tìm phòng */}
      <SiteContainer className="relative z-10 -mt-20">
        <div className="rounded-2xl border bg-card p-4 shadow-xl sm:p-5">
          <p className="mb-3 font-semibold">Kiểm tra phòng trống</p>
          <BookingSearch initial={initial} />
        </div>
      </SiteContainer>

      {/* Lợi ích đặt trực tiếp */}
      <SiteContainer className="py-10">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECT_BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </SiteContainer>

      {/* Phòng nghỉ */}
      <section className="bg-muted/40 py-14">
        <SiteContainer>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              eyebrow="Phòng nghỉ"
              title="Không gian nghỉ ngơi cho mọi chuyến đi"
              text={`${roomTypes.length} hạng phòng từ Standard đến VIP, dọn phòng hằng ngày, Wi-Fi miễn phí.`}
            />
            <Link
              href="/phong-nghi"
              className={buttonVariants({
                variant: "outline",
                className: "mb-8",
              })}
            >
              Tất cả phòng <ArrowRight />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {roomTypes.slice(0, 6).map((rt) => (
              <RoomCard key={rt.id} roomType={rt} />
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* Tiện ích */}
      <section id="tien-ich" className="scroll-mt-20 py-14">
        <SiteContainer>
          <SectionTitle
            eyebrow="Tiện ích"
            title="Mọi thứ bạn cần cho một chuyến đi"
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FACILITIES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm font-medium"
              >
                <Icon className="size-5 shrink-0 text-primary" /> {label}
              </li>
            ))}
          </ul>
        </SiteContainer>
      </section>

      {/* Khám phá Cao Lãnh */}
      <section id="kham-pha" className="scroll-mt-20 bg-muted/40 py-14">
        <SiteContainer>
          <SectionTitle
            eyebrow="Khám phá"
            title="Điểm đến quanh Cao Lãnh"
            text="Lễ tân sẵn sàng tư vấn lịch trình, gọi xe và cho thuê xe máy để bạn tham quan Đồng Tháp."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ATTRACTIONS.map((e) => (
              <figure
                key={e.title}
                className="group overflow-hidden rounded-xl border bg-card"
              >
                <RoomPhoto
                  src={e.image}
                  alt={e.title}
                  className="aspect-[4/3]"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
                <figcaption className="p-4">
                  <p className="font-semibold">{e.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{e.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Ảnh:{" "}
            {PHOTO_CREDITS.map((c, i) => (
              <React.Fragment key={c.url}>
                {i > 0 && " · "}
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground hover:underline"
                >
                  {c.title} — {c.author}
                </a>{" "}
                ({c.license})
              </React.Fragment>
            ))}
            , Wikimedia Commons.
          </p>
        </SiteContainer>
      </section>

      {/* Đánh giá — chỉ hiện khi có đánh giá thật */}
      {RATING && REVIEWS.length > 0 && (
        <section id="danh-gia" className="scroll-mt-20 py-14">
          <SiteContainer className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <SectionTitle
                eyebrow="Đánh giá"
                title="Khách nói gì về chúng tôi"
                className="mb-6"
              />
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="tabular rounded-lg bg-primary px-3 py-2 text-2xl font-bold text-primary-foreground">
                    {RATING.score.toFixed(1).replace(".", ",")}
                  </span>
                  <div>
                    <p className="font-semibold">{RATING.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {RATING.count.toLocaleString("vi-VN")} đánh giá đã xác
                      thực
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {RATING_BREAKDOWN.map(([label, score]) => (
                    <li key={label} className="text-sm">
                      <div className="mb-1 flex justify-between">
                        <span>{label}</span>
                        <span className="tabular font-medium">
                          {score.toFixed(1).replace(".", ",")}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="grid content-start gap-4 lg:pt-14">
              {REVIEWS.map((r) => (
                <blockquote
                  key={r.name}
                  className="rounded-xl border bg-card p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.from} · {r.stay}
                      </p>
                    </div>
                    <RatingBadge score={r.score} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    “{r.text}”
                  </p>
                </blockquote>
              ))}
            </div>
          </SiteContainer>
        </section>
      )}

      {/* Vị trí + FAQ */}
      <section className="py-14">
        <SiteContainer className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Vị trí"
              title="Trung tâm Cao Lãnh, gần công viên Văn Miếu"
              className="mb-6"
            />
            <p className="mb-4 flex gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{" "}
              {hotel.address}
            </p>
            <ul className="divide-y rounded-xl border bg-card">
              {NEARBY.map(([place, dist]) => (
                <li
                  key={place}
                  className="flex justify-between px-4 py-2.5 text-sm"
                >
                  <span>{place}</span>
                  <span className="tabular text-muted-foreground">{dist}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Khoảng cách ước tính từ trung tâm Cao Lãnh.
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}`)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "mt-4",
              })}
            >
              <MapPin /> Chỉ đường trên Google Maps
            </a>
          </div>
          <div id="cau-hoi" className="scroll-mt-20">
            <SectionTitle
              eyebrow="Hỏi đáp"
              title="Câu hỏi thường gặp"
              className="mb-6"
            />
            <div className="divide-y rounded-xl border bg-card">
              {faqs.map(([q, a]) => (
                <details
                  key={q}
                  className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                    {q}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* CTA */}
      <SiteContainer className="pb-14">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xl font-semibold">
              Sẵn sàng cho chuyến đi tiếp theo?
            </p>
            <p className="text-sm text-primary-foreground/80">
              Đặt trực tiếp — giá tốt nhất, xác nhận ngay qua email.
            </p>
          </div>
          <Link
            href="/dat-phong"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Đặt phòng ngay <ArrowRight />
          </Link>
        </div>
      </SiteContainer>
    </>
  );
}
