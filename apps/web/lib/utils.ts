import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import minMax from "dayjs/plugin/minMax";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(minMax);
dayjs.extend(isBetween);
dayjs.locale("vi");

export { dayjs };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const vnd = new Intl.NumberFormat("vi-VN");

/** 1250000 → "1.250.000 ₫" */
export function formatVND(amount: number) {
  return `${vnd.format(Math.round(amount))} ₫`;
}

/** 1250000 → "1,25 tr" — dùng cho trục biểu đồ, KPI gọn. */
export function formatVNDShort(amount: number) {
  if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2).replace(".", ",")} tỷ`;
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".", ",")} tr`;
  if (Math.abs(amount) >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

export function formatNumber(n: number) {
  return vnd.format(n);
}

export function formatDate(d: string | Date | dayjs.Dayjs) {
  return dayjs(d).format("DD/MM/YYYY");
}

export function formatDateTime(d: string | Date | dayjs.Dayjs) {
  return dayjs(d).format("DD/MM/YYYY HH:mm");
}

export function toDateOnly(d: dayjs.Dayjs | Date | string) {
  return dayjs(d).format("YYYY-MM-DD");
}

export function nightsBetween(checkIn: string, checkOut: string) {
  return Math.max(0, dayjs(checkOut).diff(dayjs(checkIn), "day"));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const first = parts[0] ?? "";
  return ((parts.length > 1 ? first[0] : "") + (last[0] ?? "")).toUpperCase();
}

export function uid(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Xuất CSV có BOM để Excel mở đúng tiếng Việt. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + rows.map((r) => r.map(escape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
export function normalizeVN(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
