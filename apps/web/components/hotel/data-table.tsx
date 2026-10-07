"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/hotel/empty-state";
import { cn, downloadCSV, normalizeVN } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Giá trị để sắp xếp; bỏ trống = không sắp xếp được. */
  sortValue?: (row: T) => string | number;
  /** Giá trị khi xuất CSV; mặc định dùng sortValue. */
  csv?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = "Tìm kiếm…",
  toolbar,
  exportName,
  pageSize: initialPageSize = 15,
  onRowClick,
  initialSort,
  emptyTitle = "Không có dữ liệu",
  emptyDescription,
}: {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Chuỗi gộp các trường dùng cho ô tìm kiếm. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  exportName?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState(initialSort);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const filtered = React.useMemo(() => {
    let rows = data;
    if (q && searchText) {
      const nq = normalizeVN(q.trim());
      rows = rows.filter((r) => normalizeVN(searchText(r)).includes(nq));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const sv = col.sortValue;
        rows = [...rows].sort((a, b) => {
          const va = sv(a);
          const vb = sv(b);
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "vi");
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return rows;
  }, [data, q, searchText, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  React.useEffect(() => setPage(0), [q, data.length]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : undefined));

  const exportCSV = () => {
    const exportable = columns.filter((c) => c.csv || c.sortValue);
    downloadCSV(exportName ?? "du-lieu", [exportable.map((c) => c.header), ...filtered.map((r) => exportable.map((c) => (c.csv ?? c.sortValue)!(r)))]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {searchText && (
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="pl-8" aria-label="Tìm kiếm" />
          </div>
        )}
        {toolbar}
        {exportName && (
          <Button variant="outline" size="sm" className="sm:ml-auto" onClick={exportCSV}>
            <Download /> Xuất Excel
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <THead>
            <tr>
              {columns.map((c) => (
                <TH key={c.key} className={c.headerClassName}>
                  {c.sortValue ? (
                    <button className="inline-flex items-center gap-1 uppercase hover:text-foreground" onClick={() => toggleSort(c.key)}>
                      {c.header}
                      {sort?.key === c.key && (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn(onRowClick && "cursor-pointer")}>
                {columns.map((c) => (
                  <TD key={c.key} className={c.className}>
                    {c.cell(r)}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
        {rows.length === 0 && <EmptyState title={q ? "Không tìm thấy kết quả" : emptyTitle} description={q ? `Không có dòng nào khớp "${q}"` : emptyDescription} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="tabular">
          {filtered.length === 0 ? "0" : `${safePage * pageSize + 1}–${Math.min(filtered.length, (safePage + 1) * pageSize)}`} / {filtered.length} dòng
        </span>
        <div className="flex items-center gap-2">
          <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="h-8 w-auto" aria-label="Số dòng mỗi trang">
            {[10, 15, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / trang
              </option>
            ))}
          </Select>
          <Button variant="outline" size="icon-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Trang trước">
            <ChevronLeft />
          </Button>
          <span className="tabular">
            {safePage + 1}/{pageCount}
          </span>
          <Button variant="outline" size="icon-sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} aria-label="Trang sau">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
