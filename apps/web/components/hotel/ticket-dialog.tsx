"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TICKET_PRIORITIES, TICKET_PRIORITY_LABEL, ticketSchema, type TicketInput } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export function TicketDialog({ open, onOpenChange, roomId }: { open: boolean; onOpenChange: (v: boolean) => void; roomId?: string }) {
  const { rooms, addTicket } = useStore();
  const { register, handleSubmit, formState, reset } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    values: { roomId: roomId ?? "", title: "", description: "", priority: "medium", blocksRoom: false },
  });
  const e = formState.errors;
  const submit = handleSubmit((v) => {
    addTicket({ ...v, description: v.description ?? "" });
    toast.success(v.blocksRoom ? "Đã tạo sự cố và khóa phòng" : "Đã tạo sự cố");
    reset();
    onOpenChange(false);
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo sự cố / hỏng hóc</DialogTitle>
          <DialogDescription>Bộ phận kỹ thuật sẽ nhận thông báo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phòng" required error={e.roomId?.message}>
              <Select {...register("roomId")} aria-invalid={!!e.roomId}>
                <option value="">— Chọn phòng —</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.number}</option>)}
              </Select>
            </Field>
            <Field label="Mức ưu tiên">
              <Select {...register("priority")}>{TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{TICKET_PRIORITY_LABEL[p]}</option>)}</Select>
            </Field>
          </div>
          <Field label="Tiêu đề" required error={e.title?.message}><Input {...register("title")} placeholder="VD: Vòi sen rò nước" aria-invalid={!!e.title} /></Field>
          <Field label="Mô tả chi tiết"><Textarea {...register("description")} rows={3} /></Field>
          <label className="flex items-center gap-2 text-sm"><Checkbox {...register("blocksRoom")} /> Khóa phòng (không bán) cho đến khi xử lý xong</label>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Gửi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
