import type { Metadata } from "next";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: { default: "Đặt phòng trực tuyến — giá tốt nhất", template: "%s · Đặt phòng khách sạn" },
  description: "Khách sạn Bạch Đàn — 14/64 Đặng Văn Bình, Phường Cao Lãnh, Đồng Tháp. Gần công viên Văn Miếu Cao Lãnh. Đặt phòng trực tiếp: giá tốt nhất, hủy miễn phí, thanh toán VietQR / thẻ / tại khách sạn.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
