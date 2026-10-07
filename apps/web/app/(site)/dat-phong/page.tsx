"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarX2, Check, CircleAlert, Coffee, Info, Tag, X } from "lucide-react";
import { MEAL_PLAN_LABEL, type RatePlan, type RoomType } from "@hotel/shared";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { BookingSearch } from "@/components/site/booking-search";
import { RoomFacts } from "@/components/site/room-card";
import { SiteContainer } from "@/components/site/site-shell";
import { BookingSteps, RoomPhoto } from "@/components/site/site-ui";
import { useStore } from "@/lib/store";
import { roomTypeAvailability, stayQuote, taxBreakdown } from "@/lib/selectors";
import { cancellationInfo, fitsOccupancy, isPublicRatePlan, parseStay, promoMatches, slugify, stayQuery, webRatePlans, type StayParams } from "@/lib/booking";
import { roomContent } from "@/lib/site-content";
import { cn, dayjs, formatVND, nightsBetween, toDateOnly } from "@/lib/utils";

export default function SearchPage() {
  return (
    <React.Suspense>
      <SearchResults />
    </React.Suspense>
  );
}

interface Offer {
  plan: RatePlan;
  total: number;
  gross: number;
  avg: number;
  strike: number | null;
  firstNight: number;
}

interface Result {
  rt: RoomType;
  available: number;
  fits: boolean;
  offers: Offer[];
}

function Notice({ tone, icon: Icon, children }: { tone: "warning" | "success" | "info"; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  const cls = { warning: "border-warning/40 bg-warning/10", success: "border-success/40 bg-success/10", info: "border-info/30 bg-info/8" }[tone];
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", cls)} role="status">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function SearchResults() {
  const params = useSearchParams();
  const query = params.toString();
  const stay = React.useMemo(() => parseStay(new URLSearchParams(query)), [query]);
  const focusType = params.get("roomType");
  const { roomTypes, rooms, reservations, ratePlans, rateRules, hotel } = useStore();
  const [sort, setSort] = React.useState<"recommended" | "price">("recommended");
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const plans = React.useMemo(() => webRatePlans(ratePlans, stay.promo), [ratePlans, stay.promo]);
  const promoOk = promoMatches(ratePlans, stay.promo);
  const bar = ratePlans.find((p) => p.code === "BAR");

  const results: Result[] = React.useMemo(() => {
    const list = roomTypes.map((rt) => {
      const barTotal = bar ? stayQuote(rt, bar, stay.checkIn, stay.checkOut, rateRules).total : null;
      const offers = plans
        .map((plan) => {
          const q = stayQuote(rt, plan, stay.checkIn, stay.checkOut, rateRules);
          return {
            plan,
            total: q.total,
            gross: taxBreakdown(q.total, hotel).total,
            avg: q.avg,
            // Chỉ gạch giá khi cùng mức bữa ăn với BAR — gói "Chỉ phòng" rẻ hơn vì bỏ ăn sáng, không phải khuyến mãi
            strike: barTotal && barTotal > q.total && plan.mealPlan === bar?.mealPlan ? taxBreakdown(barTotal, hotel).total : null,
            firstNight: q.nights[0]?.rate ?? 0,
          };
        })
        .sort((a, b) => a.total - b.total);
      return {
        rt,
        available: roomTypeAvailability(rt.id, rooms, reservations, stay.checkIn, stay.checkOut),
        fits: fitsOccupancy(rt, stay.adults, stay.children),
        offers,
      };
    });
    const bookable = (r: Result) => (r.fits && r.available > 0 ? 0 : 1);
    return list.sort((a, b) => bookable(a) - bookable(b) || (sort === "price" ? (a.offers[0]?.total ?? 0) - (b.offers[0]?.total ?? 0) : 0));
  }, [roomTypes, rooms, reservations, plans, rateRules, hotel, bar, stay, sort]);

  const anyBookable = results.some((r) => r.fits && r.available > 0);

  // Gợi ý ngày khác (±7 ngày, cùng số đêm) khi không còn phòng phù hợp
  const alternatives = React.useMemo(() => {
    if (anyBookable) return [];
    const out: string[] = [];
    for (const off of [1, -1, 2, -2, 3, -3, 4, 5, 6, 7]) {
      const ci = dayjs(stay.checkIn).add(off, "day");
      if (ci.isBefore(dayjs(), "day")) continue;
      const checkIn = toDateOnly(ci);
      const checkOut = toDateOnly(ci.add(nights, "day"));
      const ok = roomTypes.some((rt) => fitsOccupancy(rt, stay.adults, stay.children) && roomTypeAvailability(rt.id, rooms, reservations, checkIn, checkOut) > 0);
      if (ok) out.push(checkIn);
      if (out.length >= 4) break;
    }
    return out.sort();
  }, [anyBookable, stay, nights, roomTypes, rooms, reservations]);

  React.useEffect(() => {
    if (focusType) document.getElementById(`rt-${focusType}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusType]);

  return (
    <SiteContainer className="py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <BookingSteps current={1} />
        <Link href="/tra-cuu" className="text-sm text-primary hover:underline">Đã đặt phòng? Tra cứu</Link>
      </div>
      <div className="mb-5 rounded-xl border bg-card p-3 shadow-sm">
        <BookingSearch key={query} initial={stay} compact />
      </div>

      <div className="mb-5 space-y-2">
        {stay.error && <Notice tone="warning" icon={CircleAlert}>{stay.error}</Notice>}
        {stay.promo && (promoOk ? (
          <Notice tone="success" icon={Tag}>Đã áp dụng mã <b>{stay.promo}</b> — giá ưu đãi được đánh dấu bên dưới.</Notice>
        ) : (
          <Notice tone="warning" icon={Tag}>Mã <b>{stay.promo}</b> không hợp lệ hoặc đã hết hạn.</Notice>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Chọn hạng phòng</h1>
          <p className="text-sm text-muted-foreground">
            {dayjs(stay.checkIn).format("dd DD/MM")} – {dayjs(stay.checkOut).format("dd DD/MM/YYYY")} · {nights} đêm · {stay.adults} người lớn{stay.children ? `, ${stay.children} trẻ em` : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sắp xếp</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-40">
            <option value="recommended">Đề xuất</option>
            <option value="price">Giá thấp → cao</option>
          </Select>
        </label>
      </div>

      {!anyBookable && (
        <div className="mb-5 rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 font-semibold"><CalendarX2 className="size-5 text-danger" /> Không còn phòng phù hợp cho ngày bạn chọn</p>
          {alternatives.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Còn phòng {nights} đêm vào các ngày sau:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {alternatives.map((ci) => (
                  <Link
                    key={ci}
                    href={`/dat-phong?${stayQuery({ ...stay, checkIn: ci, checkOut: toDateOnly(dayjs(ci).add(nights, "day")) })}`}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "capitalize" })}
                  >
                    {dayjs(ci).format("dd DD/MM")} → {dayjs(ci).add(nights, "day").format("dd DD/MM")}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Vui lòng chọn ngày khác hoặc gọi {hotel.phone} để được hỗ trợ.</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {results.map((r) => (
          <ResultCard key={r.rt.id} result={r} stay={stay} nights={nights} focused={r.rt.id === focusType} />
        ))}
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Tổng giá đã gồm phí dịch vụ {hotel.serviceFeePercent}% và VAT {hotel.vatPercent}%. Giá /đêm là giá trung bình trước thuế phí. Giá cuối tuần và ngày lễ có thể cao hơn ngày thường.
      </p>
    </SiteContainer>
  );
}

function ResultCard({ result, stay, nights, focused }: { result: Result; stay: StayParams; nights: number; focused: boolean }) {
  const { rt, available, fits, offers } = result;
  const c = roomContent(rt.code);
  const bookable = fits && available > 0;
  return (
    <article
      id={`rt-${rt.id}`}
      className={cn("scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-sm", focused && "ring-2 ring-primary", !bookable && "opacity-75")}
    >
      <div className="grid md:grid-cols-[300px_1fr]">
        <RoomPhoto src={c.images[0]} alt={rt.name} className="aspect-[3/2] md:self-start" sizes="(min-width: 768px) 300px, 100vw" />
        <div className="min-w-0 p-4">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                <Link href={`/phong-nghi/${slugify(rt.name)}`} className="hover:text-primary">{rt.name}</Link>
              </h2>
              <p className="text-sm text-muted-foreground">{c.tagline}</p>
            </div>
            {!fits ? (
              <Badge variant="muted">Không đủ chỗ cho {stay.adults + stay.children} khách</Badge>
            ) : available === 0 ? (
              <Badge variant="danger">Hết phòng</Badge>
            ) : available <= 3 ? (
              <Badge variant="warning">Chỉ còn {available} phòng</Badge>
            ) : (
              <Badge variant="success">Còn phòng</Badge>
            )}
          </div>
          <RoomFacts roomType={rt} className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground [&_li]:flex [&_li]:items-center [&_li]:gap-1 [&_svg]:size-3.5" />
          <p className="text-xs text-muted-foreground">{rt.amenities.slice(0, 6).join(" · ")}</p>

          {bookable ? (
            <ul className="mt-4 divide-y rounded-lg border">
              {offers.map((o) => (
                <OfferRow key={o.plan.id} offer={o} stay={stay} roomTypeId={rt.id} nights={nights} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              {!fits
                ? `Hạng phòng này tối đa ${rt.maxAdults} người lớn và ${rt.maxChildren} trẻ em. Đoàn đông người vui lòng đặt nhiều phòng qua hotline.`
                : "Đã hết phòng trong khoảng ngày này. Thử đổi ngày hoặc chọn hạng phòng khác."}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function OfferRow({ offer, stay, roomTypeId, nights }: { offer: Offer; stay: StayParams; roomTypeId: string; nights: number }) {
  const { plan } = offer;
  const policy = cancellationInfo(plan, stay.checkIn, offer.firstNight);
  const href = `/dat-phong/thong-tin?${stayQuery(stay, { roomType: roomTypeId, ratePlan: plan.id })}`;
  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1 text-sm">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {plan.name}
          {!isPublicRatePlan(plan) && <Badge variant="info">Giá ưu đãi riêng</Badge>}
        </p>
        <p className={cn("flex items-center gap-1.5", plan.mealPlan === "room_only" ? "text-muted-foreground" : "text-success")}>
          <Coffee className="size-3.5" /> {MEAL_PLAN_LABEL[plan.mealPlan]}
        </p>
        <p className={cn("flex items-center gap-1.5", policy.free ? "text-success" : "text-muted-foreground")}>
          {policy.free ? <Check className="size-3.5" /> : <X className="size-3.5" />}
          {policy.free ? `Hủy miễn phí đến ${dayjs(policy.until).format("DD/MM")}` : plan.refundable ? "Đã quá hạn hủy miễn phí" : "Không hoàn tiền"}
        </p>
        <p className="text-xs text-muted-foreground">{plan.refundable ? "Thanh toán tại khách sạn hoặc trả trước online" : "Thanh toán trước online"}</p>
      </div>
      <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
        <div>
          {offer.strike && <p className="tabular text-xs text-muted-foreground line-through">{formatVND(offer.strike)}</p>}
          <p className="tabular text-xl font-bold">{formatVND(offer.gross)}</p>
          <p className="text-xs text-muted-foreground">
            {nights} đêm, đã gồm thuế phí · <span className="tabular">{formatVND(offer.avg)}</span>/đêm
          </p>
        </div>
        <Link href={href} className={buttonVariants({ className: "shrink-0 sm:mt-1" })}>
          Chọn
        </Link>
      </div>
    </li>
  );
}
