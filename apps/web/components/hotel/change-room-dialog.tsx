"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Reservation } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { availableRooms } from "@/lib/selectors";
import { cn, formatDate, formatVND } from "@/lib/utils";

/** Đổi phòng cho booking — chỉ liệt kê phòng trống trong toàn bộ khoảng ngày. */
export function ChangeRoomDialog({ reservation, open, onOpenChange }: { reservation: Reservation; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { rooms, reservations, roomTypes, updateReservation } = useStore();
  const [roomId, setRoomId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const options = availableRooms(rooms, reservations, reservation.checkIn, reservation.checkOut, undefined, reservation.id).filter((r) => r.id !== reservation.roomId);
  const current = rooms.find((r) => r.id === reservation.roomId);

  const submit = () => {
    if (!roomId) return;
    const target = rooms.find((r) => r.id === roomId)!;
    try {
      updateReservation(reservation.id, { roomId, roomTypeId: target.roomTypeId }, `Đổi phòng ${current?.number ?? "(chưa gán)"} → ${target.number}${reason ? `: ${reason}` : ""}`);
      toast.success(`Đã chuyển sang phòng ${target.number}`);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{current ? `Đổi phòng ${current.number}` : "Gán phòng"}</DialogTitle>
          <DialogDescription>
            {reservation.code} · {formatDate(reservation.checkIn)} → {formatDate(reservation.checkOut)} · Hiển thị {options.length} phòng trống
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
          {options.map((r) => {
            const rt = roomTypes.find((t) => t.id === r.roomTypeId)!;
            return (
              <button
                key={r.id}
                onClick={() => setRoomId(r.id)}
                className={cn(
                  "rounded-lg border p-2 text-left transition-colors hover:bg-accent",
                  roomId === r.id && "border-primary bg-primary/10 ring-1 ring-primary",
                  rt.id === reservation.roomTypeId && roomId !== r.id && "border-primary/40",
                )}
              >
                <p className="tabular font-semibold">{r.number}</p>
                <p className="truncate text-xs text-muted-foreground">{rt.code} · {r.hkStatus === "dirty" ? "Bẩn" : "Sạch"}</p>
                <p className="tabular text-[11px] text-muted-foreground">{formatVND(rt.baseRate)}</p>
              </button>
            );
          })}
        </div>
        <Field label="Lý do đổi phòng">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Khách yêu cầu tầng cao, phòng hỏng điều hòa…" />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={!roomId}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
