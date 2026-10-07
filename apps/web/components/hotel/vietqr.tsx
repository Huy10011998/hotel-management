"use client";

import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { buildVietQR } from "@/lib/vietqr";
import { formatVND } from "@/lib/utils";

export function VietQR({ amount, description, size = 168 }: { amount: number; description: string; size?: number }) {
  const bank = useStore((s) => s.hotel.bank);
  const payload = buildVietQR({ bin: bank.bin, accountNo: bank.accountNo, amount, description });
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-white p-3 text-center text-black">
      <QRCodeSVG value={payload} size={size} level="M" marginSize={1} />
      <div className="text-xs leading-snug">
        <p className="font-semibold">{bank.bankName} · {bank.accountNo}</p>
        <p>{bank.accountName}</p>
        <p className="mt-1 text-sm font-bold">{formatVND(amount)}</p>
        <p className="text-[11px] text-gray-600">ND: {description}</p>
      </div>
    </div>
  );
}
