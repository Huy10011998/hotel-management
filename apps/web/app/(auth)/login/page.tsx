"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, BedDouble, Eye, EyeOff, Hotel, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("huy.tq@example.com");
  const [password, setPassword] = React.useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) return toast.error("Nhập email và mật khẩu (tối thiểu 6 ký tự)");
    setLoading(true);
    setTimeout(() => {
      toast.success("Đăng nhập thành công");
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15"><Hotel className="size-5" /></span>
          Hotel PMS
        </div>
        <div className="relative space-y-6">
          <h1 className="text-3xl font-semibold leading-tight">Vận hành khách sạn<br />gọn gàng trên một màn hình.</h1>
          <ul className="space-y-3 text-sm text-primary-foreground/85">
            <li className="flex items-center gap-3"><BedDouble className="size-5" /> Sơ đồ phòng & lịch đặt phòng theo thời gian thực</li>
            <li className="flex items-center gap-3"><Users className="size-5" /> Check-in nhanh, khai báo lưu trú, CRM khách hàng</li>
            <li className="flex items-center gap-3"><BarChart3 className="size-5" /> Doanh thu, công suất, ADR, RevPAR mỗi ngày</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} Hotel PMS · Bản prototype</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
          <div className="space-y-1">
            <div className="mb-6 flex items-center gap-2 font-semibold lg:hidden"><Hotel className="size-5 text-primary" /> Hotel PMS</div>
            <h2 className="text-2xl font-semibold">Đăng nhập</h2>
            <p className="text-sm text-muted-foreground">Dùng tài khoản được quản trị viên cấp.</p>
          </div>
          <Field label="Khách sạn / chi nhánh">
            <Select defaultValue="bachdan">
              <option value="bachdan">Khách sạn Bạch Đàn — Cao Lãnh, Đồng Tháp</option>
            </Select>
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mật khẩu" htmlFor="password">
            <div className="relative">
              <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2"><Checkbox defaultChecked /> Ghi nhớ đăng nhập</label>
            <button type="button" className="text-primary hover:underline" onClick={() => toast.info("Liên hệ quản trị viên để đặt lại mật khẩu")}>Quên mật khẩu?</button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> Tài khoản quản lý sẽ được yêu cầu mã xác thực 2 lớp</p>
        </form>
      </div>
    </div>
  );
}
