"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Lock, Play, Plus, Wrench } from "lucide-react";
import { TICKET_STATUS_LABEL, type MaintenanceTicket, type TicketStatus } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { EmptyState } from "@/components/hotel/empty-state";
import { KpiCard } from "@/components/hotel/kpi-card";
import { TicketDialog } from "@/components/hotel/ticket-dialog";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/hotel/status-badges";
import { useStore } from "@/lib/store";
import { dayjs, formatDateTime } from "@/lib/utils";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function MaintenancePage() {
  const { tickets, rooms, setTicketStatus } = useStore();
  const [tab, setTab] = React.useState<"active" | TicketStatus>("active");
  const [creating, setCreating] = React.useState(false);
  const list = tickets
    .filter((t) => (tab === "active" ? t.status !== "done" : t.status === tab))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt.localeCompare(a.createdAt));
  const done = tickets.filter((t) => t.status === "done" && t.resolvedAt);
  const avgHours = done.length ? done.reduce((s, t) => s + dayjs(t.resolvedAt).diff(dayjs(t.createdAt), "minute"), 0) / done.length / 60 : 0;

  const act = (t: MaintenanceTicket, s: TicketStatus) => {
    setTicketStatus(t.id, s);
    toast.success(`${t.code}: ${TICKET_STATUS_LABEL[s]}${s === "done" && t.blocksRoom ? " — phòng đã mở bán lại" : ""}`);
  };

  return (
    <>
      <PageHeader title="Bảo trì" description="Theo dõi sự cố, khóa phòng không bán khi đang sửa chữa" actions={<Button onClick={() => setCreating(true)}><Plus /> Báo sự cố</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Đang mở" value={tickets.filter((t) => t.status === "open").length} tone="warning" />
        <KpiCard label="Đang xử lý" value={tickets.filter((t) => t.status === "in_progress").length} tone="info" />
        <KpiCard label="Phòng đang khóa" value={rooms.filter((r) => r.outOfOrder).length} tone="danger" />
        <KpiCard label="Thời gian xử lý TB" value={`${avgHours.toFixed(1).replace(".", ",")} giờ`} tone="success" />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Cần xử lý</TabsTrigger>
          <TabsTrigger value="open">Mới</TabsTrigger>
          <TabsTrigger value="in_progress">Đang xử lý</TabsTrigger>
          <TabsTrigger value="done">Hoàn thành</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <Card><EmptyState icon={Wrench} title="Không có sự cố" /></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t.code} · Phòng <b className="tabular text-foreground">{rooms.find((r) => r.id === t.roomId)?.number}</b></p>
                  <p className="font-semibold">{t.title}</p>
                </div>
                <TicketPriorityBadge priority={t.priority} />
              </div>
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <TicketStatusBadge status={t.status} />
                {t.blocksRoom && t.status !== "done" && <span className="flex items-center gap-1 text-danger"><Lock className="size-3" /> Phòng đang khóa</span>}
                <span>· {t.reportedBy} · {formatDateTime(t.createdAt)}</span>
              </div>
              {t.status !== "done" && (
                <div className="mt-auto flex gap-2">
                  {t.status === "open" && <Button size="sm" variant="outline" className="flex-1" onClick={() => act(t, "in_progress")}><Play /> Nhận xử lý</Button>}
                  <Button size="sm" variant="success" className="flex-1" onClick={() => act(t, "done")}><Check /> Hoàn thành</Button>
                </div>
              )}
              {t.resolvedAt && <p className="text-xs text-success">Xong lúc {formatDateTime(t.resolvedAt)}</p>}
            </Card>
          ))}
        </div>
      )}
      <TicketDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
