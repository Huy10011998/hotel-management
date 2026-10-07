"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { findBookingFor, markVerified } from "@/lib/booking";

/** Nhập mã đặt phòng + email/SĐT để xem đơn. Thành công thì ghi nhận đã xác minh trong phiên. */
export function BookingLookupForm({ initialCode = "", onFound }: { initialCode?: string; onFound: (code: string) => void }) {
  const { reservations, guests } = useStore();
  const [code, setCode] = React.useState(initialCode);
  const [contact, setContact] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !contact.trim()) return setError("Nhập mã đặt phòng và email hoặc số điện thoại");
    const r = findBookingFor(reservations, guests, code, contact);
    // Không nói rõ sai mã hay sai liên hệ để tránh dò thông tin
    if (!r) return setError("Không tìm thấy đặt phòng khớp với thông tin đã nhập");
    markVerified(r.code);
    onFound(r.code);
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field label="Mã đặt phòng" htmlFor="code" hint="Có trong email xác nhận, dạng BK2600123">
        <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BK…" autoComplete="off" className="uppercase" />
      </Field>
      <Field label="Email hoặc số điện thoại đặt phòng" htmlFor="contact">
        <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
      </Field>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" size="lg">
        <Search /> Tra cứu
      </Button>
    </form>
  );
}
