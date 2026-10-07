"use client";

import { DataTable } from "@/components/hotel/data-table";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export function AuditLogTable() {
  const logs = useStore((s) => s.auditLogs);
  return (
    <DataTable
      data={logs}
      rowKey={(l) => l.id}
      searchText={(l) => `${l.by} ${l.action} ${l.target}`}
      exportName="nhat-ky-he-thong"
      initialSort={{ key: "at", dir: "desc" }}
      columns={[
        { key: "at", header: "Thời gian", cell: (l) => <span className="tabular whitespace-nowrap">{formatDateTime(l.at)}</span>, sortValue: (l) => l.at },
        { key: "by", header: "Người thực hiện", cell: (l) => l.by, sortValue: (l) => l.by },
        { key: "action", header: "Thao tác", cell: (l) => l.action, sortValue: (l) => l.action },
        { key: "target", header: "Đối tượng", cell: (l) => <span className="text-muted-foreground">{l.target}</span>, sortValue: (l) => l.target },
      ]}
    />
  );
}
