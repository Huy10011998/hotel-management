import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-lg font-semibold">Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground">Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonVariants()}>
          Về trang chủ
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Trang quản trị
        </Link>
      </div>
    </div>
  );
}
