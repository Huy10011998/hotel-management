"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building, ChevronLeft, CircleAlert, CreditCard, Hotel, Lock, Minus, Plus, QrCode } from "lucide-react";
import { ONLINE_PAYMENT_OPTION_LABEL, onlineBookingSchema, type OnlineBookingInput, type OnlinePaymentOption, type RatePlan, type RoomType } from "@hotel/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/hotel/empty-state";
import { SiteContainer } from "@/components/site/site-shell";
import { BookingSteps, StaySummary } from "@/components/site/site-ui";
import { useStore } from "@/lib/store";
import { roomTypeAvailability, stayQuote, taxBreakdown } from "@/lib/selectors";
import { cancellationInfo, fitsOccupancy, markVerified, parseStay, stayQuery, webRatePlans, type StayParams } from "@/lib/booking";
import { ADDONS, ARRIVAL_TIMES, NATIONALITIES, SPECIAL_REQUESTS } from "@/lib/site-content";
import { cn, dayjs, formatVND } from "@/lib/utils";

export default function GuestDetailsPage() {
  return (
    <React.Suspense>
      <GuestDetails />
    </React.Suspense>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const PAYMENT_ICON: Record<OnlinePaymentOption, React.ComponentType<{ className?: string }>> = {
  pay_at_hotel: Hotel,
  vietqr: QrCode,
  gateway: CreditCard,
};

function GuestDetails() {
  const params = useSearchParams();
  const query = params.toString();
  const stay = React.useMemo(() => parseStay(new URLSearchParams(query)), [query]);
  const { roomTypes, ratePlans, rooms, reservations } = useStore();
  const rt = roomTypes.find((t) => t.id === params.get("roomType"));
  const rp = webRatePlans(ratePlans, stay.promo).find((p) => p.id === params.get("ratePlan"));
  const backHref = `/dat-phong?${stayQuery(stay, { roomType: rt?.id })}`;

  const problem = stay.error
    ? stay.error
    : !rt || !rp
      ? "Hạng phòng hoặc gói giá không còn áp dụng."
      : !fitsOccupancy(rt, stay.adults, stay.children)
        ? `${rt.name} không đủ chỗ cho số khách đã chọn.`
        : roomTypeAvailability(rt.id, rooms, reservations, stay.checkIn, stay.checkOut) < 1
          ? `Rất tiếc, ${rt.name} vừa hết phòng trong khoảng ngày bạn chọn.`
          : null;

  if (problem || !rt || !rp) {
    return (
      <SiteContainer className="py-16">
        <EmptyState
          icon={CircleAlert}
          title="Không thể tiếp tục đặt phòng"
          description={problem ?? undefined}
          action={<Link href={backHref} className={buttonVariants()}>Chọn lại phòng</Link>}
        />
      </SiteContainer>
    );
  }

  return <BookingForm key={query} stay={stay} rt={rt} rp={rp} backHref={backHref} />;
}

function BookingForm({ stay, rt, rp, backHref }: { stay: StayParams; rt: RoomType; rp: RatePlan; backHref: string }) {
  const router = useRouter();
  const { services, hotel, rateRules, createOnlineBooking } = useStore();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<OnlineBookingInput>({
    resolver: zodResolver(onlineBookingSchema),
    defaultValues: {
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      adults: stay.adults,
      children: stay.children,
      roomTypeId: rt.id,
      ratePlanId: rp.id,
      promo: stay.promo,
      fullName: "",
      email: "",
      phone: "",
      nationality: "Việt Nam",
      arrivalTime: "",
      requests: [],
      note: "",
      addons: {},
      needInvoice: false,
      companyName: "",
      taxCode: "",
      companyAddress: "",
      paymentOption: rp.refundable ? "pay_at_hotel" : "vietqr",
      agreeTerms: false,
      marketing: false,
    },
  });
  const { register, handleSubmit, watch, control, formState } = form;
  const e = formState.errors;
  const v = watch();

  const quote = stayQuote(rt, rp, stay.checkIn, stay.checkOut, rateRules);
  const addonOptions = ADDONS.map((a) => ({ ...a, service: services.find((s) => s.id === a.serviceId && s.active) }))
    .filter((a): a is typeof a & { service: NonNullable<typeof a.service> } => !!a.service)
    // Buffet sáng chỉ bán thêm cho gói không kèm ăn sáng
    .filter((a) => a.service.category !== "restaurant" || rp.mealPlan === "room_only");
  const addonLines = addonOptions
    .filter((a) => (v.addons[a.serviceId] ?? 0) > 0)
    .map((a) => ({ label: `${a.service.name} × ${v.addons[a.serviceId]}`, amount: a.service.price * v.addons[a.serviceId] }));
  const lines = [{ label: `Tiền phòng · ${quote.nights.length} đêm`, amount: quote.total }, ...addonLines];
  const totals = taxBreakdown(lines.reduce((s, l) => s + l.amount, 0), hotel);
  const policy = cancellationInfo(rp, stay.checkIn, quote.nights[0]?.rate ?? 0);

  const submit = handleSubmit((d) => {
    setSubmitting(true);
    try {
      const r = createOnlineBooking(d);
      markVerified(r.code);
      toast.success(`Đã ghi nhận đặt phòng ${r.code}`);
      router.push(`/don-dat-phong/${r.code}${d.paymentOption === "pay_at_hotel" ? "" : `?pay=${d.paymentOption}`}`);
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  });

  return (
    <SiteContainer className="py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <BookingSteps current={2} />
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Đổi phòng / gói giá
        </Link>
      </div>

      <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section title="Thông tin người đặt" description="Xác nhận đặt phòng sẽ được gửi tới email này.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ và tên" required error={e.fullName?.message} className="sm:col-span-2" htmlFor="fullName">
                <Input id="fullName" autoComplete="name" placeholder="Như trên CCCD / hộ chiếu" aria-invalid={!!e.fullName} {...register("fullName")} />
              </Field>
              <Field label="Email" required error={e.email?.message} htmlFor="email">
                <Input id="email" type="email" autoComplete="email" placeholder="ban@email.com" aria-invalid={!!e.email} {...register("email")} />
              </Field>
              <Field label="Số điện thoại" required error={e.phone?.message} htmlFor="phone" hint="Khách sạn liên hệ khi cần xác nhận">
                <Input id="phone" type="tel" autoComplete="tel" placeholder="09xx xxx xxx" aria-invalid={!!e.phone} {...register("phone")} />
              </Field>
              <Field label="Quốc tịch" required error={e.nationality?.message} htmlFor="nationality">
                <Select id="nationality" {...register("nationality")}>
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Giờ đến dự kiến" htmlFor="arrival" hint={`Nhận phòng từ ${hotel.checkInTime}`}>
                <Select id="arrival" {...register("arrivalTime")}>
                  <option value="">Chưa rõ</option>
                  {ARRIVAL_TIMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Yêu cầu đặc biệt" description="Khách sạn sẽ cố gắng đáp ứng, tùy tình trạng phòng khi bạn đến.">
            <Controller
              control={control}
              name="requests"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {SPECIAL_REQUESTS.map((r) => (
                    <label key={r.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(r.key)}
                        onChange={(ev) => field.onChange(ev.target.checked ? [...field.value, r.key] : field.value.filter((k) => k !== r.key))}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              )}
            />
            <Field label="Ghi chú thêm" error={e.note?.message} className="mt-4" htmlFor="note">
              <Textarea id="note" rows={3} placeholder="Ví dụ: dị ứng thực phẩm, cần hỗ trợ xe lăn…" {...register("note")} />
            </Field>
          </Section>

          {addonOptions.length > 0 && (
            <Section title="Dịch vụ thêm" description="Đặt trước để được chuẩn bị sẵn — thanh toán cùng tiền phòng.">
              <Controller
                control={control}
                name="addons"
                render={({ field }) => (
                  <ul className="divide-y rounded-lg border">
                    {addonOptions.map(({ serviceId, service, icon: Icon, text }) => {
                      const qty = field.value[serviceId] ?? 0;
                      const setQty = (n: number) => field.onChange({ ...field.value, [serviceId]: Math.max(0, Math.min(10, n)) });
                      return (
                        <li key={serviceId} className="flex flex-wrap items-center gap-3 p-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{text}</p>
                            <p className="tabular text-xs font-medium">{formatVND(service.price)} / {service.unit}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon-sm" onClick={() => setQty(qty - 1)} disabled={qty === 0} aria-label={`Bớt ${service.name}`}>
                              <Minus />
                            </Button>
                            <span className="tabular w-5 text-center text-sm font-semibold">{qty}</span>
                            <Button variant="outline" size="icon-sm" onClick={() => setQty(qty + 1)} disabled={qty >= 10} aria-label={`Thêm ${service.name}`}>
                              <Plus />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              />
            </Section>
          )}

          <Section title="Hóa đơn">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox {...register("needInvoice")} /> <Building className="size-4 text-muted-foreground" /> Xuất hóa đơn VAT cho công ty
            </label>
            {v.needInvoice && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Tên công ty" required error={e.companyName?.message} className="sm:col-span-2" htmlFor="companyName">
                  <Input id="companyName" aria-invalid={!!e.companyName} {...register("companyName")} />
                </Field>
                <Field label="Mã số thuế" required error={e.taxCode?.message} htmlFor="taxCode">
                  <Input id="taxCode" inputMode="numeric" aria-invalid={!!e.taxCode} {...register("taxCode")} />
                </Field>
                <Field label="Địa chỉ" required error={e.companyAddress?.message} htmlFor="companyAddress">
                  <Input id="companyAddress" aria-invalid={!!e.companyAddress} {...register("companyAddress")} />
                </Field>
                <p className="text-xs text-muted-foreground sm:col-span-2">Hóa đơn điện tử được gửi qua email sau khi trả phòng.</p>
              </div>
            )}
          </Section>

          <Section title="Thanh toán">
            <Controller
              control={control}
              name="paymentOption"
              render={({ field }) => (
                <div className="grid gap-2" role="radiogroup" aria-label="Hình thức thanh toán">
                  {(Object.keys(ONLINE_PAYMENT_OPTION_LABEL) as OnlinePaymentOption[]).map((opt) => {
                    const Icon = PAYMENT_ICON[opt];
                    const disabled = opt === "pay_at_hotel" && !rp.refundable;
                    const checked = field.value === opt;
                    return (
                      <label
                        key={opt}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50",
                          checked && "border-primary bg-primary/5 ring-1 ring-primary",
                          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                        )}
                      >
                        <input type="radio" className="mt-1 accent-[var(--primary)]" checked={checked} disabled={disabled} onChange={() => field.onChange(opt)} />
                        <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                        <span className="text-sm">
                          <span className="block font-medium">{ONLINE_PAYMENT_OPTION_LABEL[opt]}</span>
                          <span className="block text-xs text-muted-foreground">
                            {opt === "pay_at_hotel"
                              ? disabled
                                ? "Không áp dụng cho gói không hoàn hủy."
                                : "Giữ phòng ngay, không cần trả trước. Thanh toán khi nhận/trả phòng."
                              : opt === "vietqr"
                                ? "Quét mã QR bằng app ngân hàng bất kỳ — xác nhận ngay khi nhận được tiền."
                                : "Thẻ ATM nội địa, Visa/Master/JCB, ví MoMo qua cổng thanh toán VNPay."}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </Section>

          <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox className="mt-0.5" aria-invalid={!!e.agreeTerms} {...register("agreeTerms")} />
              <span>
                Tôi đồng ý với <Link href="/chinh-sach" target="_blank" className="text-primary hover:underline">điều khoản đặt phòng, chính sách hủy</Link> và cho phép khách sạn xử lý dữ liệu cá nhân theo{" "}
                <Link href="/chinh-sach#bao-mat" target="_blank" className="text-primary hover:underline">chính sách bảo mật</Link> (Nghị định 13/2023/NĐ-CP).
              </span>
            </label>
            {e.agreeTerms && <p className="text-xs text-destructive">{e.agreeTerms.message}</p>}
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox className="mt-0.5" {...register("marketing")} /> Nhận email ưu đãi dành riêng cho khách đặt trực tiếp (có thể hủy bất cứ lúc nào).
            </label>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              <Lock /> {v.paymentOption === "pay_at_hotel" ? "Hoàn tất đặt phòng" : `Tiếp tục thanh toán ${formatVND(totals.total)}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Thông tin được mã hóa và chỉ dùng cho việc đặt phòng.</p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <StaySummary
            hotel={hotel}
            roomType={rt}
            ratePlan={rp}
            checkIn={stay.checkIn}
            checkOut={stay.checkOut}
            adults={stay.adults}
            childCount={stay.children}
            lines={lines}
            totals={totals}
            cancellation={policy.text}
          >
            <details className="text-sm">
              <summary className="cursor-pointer text-primary">Chi tiết giá theo đêm</summary>
              <ul className="mt-2 space-y-1">
                {quote.nights.map((n) => (
                  <li key={n.date} className="flex justify-between text-muted-foreground">
                    <span className="capitalize">{dayjs(n.date).format("dd, DD/MM")}</span>
                    <span className="tabular">{formatVND(n.rate)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </StaySummary>
        </aside>
      </form>
    </SiteContainer>
  );
}
