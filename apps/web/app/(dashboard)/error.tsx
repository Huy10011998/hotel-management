"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-full bg-danger/12 p-3 text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message || "Không thể hiển thị trang này. Vui lòng thử lại."}</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
