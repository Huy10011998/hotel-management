"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ID_TYPES, ID_TYPE_LABEL, guestSchema, type Guest, type GuestInput } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

export function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  onSaved,
  defaultName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guest?: Guest;
  onSaved?: (g: Guest) => void;
  defaultName?: string;
}) {
  const upsertGuest = useStore((s) => s.upsertGuest);
  const form = useForm<GuestInput>({
    resolver: zodResolver(guestSchema),
    defaultValues: guest
      ? { ...guest, email: guest.email ?? "", dob: guest.dob ?? "", address: guest.address ?? "", notes: guest.notes ?? "" }
      : { fullName: defaultName ?? "", gender: "male", phone: "", email: "", idType: "cccd", idNumber: "", nationality: "Việt Nam", vip: false, dob: "", address: "", notes: "" },
  });
  const { register, handleSubmit, formState, reset } = form;
  const e = formState.errors;

  React.useEffect(() => {
    if (open && !guest) reset((v) => ({ ...v, fullName: defaultName ?? v.fullName }));
  }, [open, defaultName, guest, reset]);

  const submit = handleSubmit((v) => {
    const g: Guest = {
      ...(guest ?? { id: uid("g-"), blacklisted: false, tags: [], createdAt: new Date().toISOString() }),
      ...v,
      email: v.email || undefined,
      dob: v.dob || undefined,
    };
    upsertGuest(g);
    toast.success(guest ? "Đã cập nhật khách hàng" : "Đã tạo khách hàng");
    onSaved?.(g);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{guest ? "Sửa thông tin khách" : "Thêm khách hàng"}</DialogTitle>
          <DialogDescription>Thông tin giấy tờ dùng cho khai báo lưu trú. Dữ liệu cá nhân được bảo vệ theo NĐ 13/2023.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" required error={e.fullName?.message} className="sm:col-span-2">
              <Input {...register("fullName")} aria-invalid={!!e.fullName} autoFocus />
            </Field>
            <Field label="Giới tính">
              <Select {...register("gender")}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </Select>
            </Field>
            <Field label="Ngày sinh">
              <Input type="date" {...register("dob")} />
            </Field>
            <Field label="Số điện thoại" required error={e.phone?.message}>
              <Input {...register("phone")} inputMode="tel" placeholder="09xxxxxxxx" aria-invalid={!!e.phone} />
            </Field>
            <Field label="Email" error={e.email?.message}>
              <Input type="email" {...register("email")} aria-invalid={!!e.email} />
            </Field>
            <Field label="Loại giấy tờ">
              <Select {...register("idType")}>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>{ID_TYPE_LABEL[t]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Số giấy tờ" required error={e.idNumber?.message}>
              <Input {...register("idNumber")} aria-invalid={!!e.idNumber} />
            </Field>
            <Field label="Quốc tịch" required error={e.nationality?.message}>
              <Input {...register("nationality")} aria-invalid={!!e.nationality} />
            </Field>
            <Field label="Địa chỉ">
              <Input {...register("address")} />
            </Field>
            <Field label="Ghi chú / sở thích" className="sm:col-span-2">
              <Textarea {...register("notes")} rows={2} placeholder="VD: Dị ứng hải sản, thích phòng yên tĩnh…" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox {...register("vip")} /> Khách VIP
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
