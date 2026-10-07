"use client";

import Link from "next/link";
import { BedDouble, Eye, Maximize2, Users } from "lucide-react";
import type { RoomType } from "@hotel/shared";
import { buttonVariants } from "@/components/ui/button";
import { RoomPhoto } from "@/components/site/site-ui";
import { useStore } from "@/lib/store";
import { fromPrice, slugify } from "@/lib/booking";
import { roomContent } from "@/lib/site-content";
import { formatVND } from "@/lib/utils";

export function RoomFacts({ roomType, className }: { roomType: RoomType; className?: string }) {
  const c = roomContent(roomType.code);
  return (
    <ul className={className ?? "flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"}>
      <li className="flex items-center gap-1.5"><Maximize2 className="size-4" /> {roomType.areaM2} m²</li>
      <li className="flex items-center gap-1.5"><Users className="size-4" /> {roomType.maxAdults} người lớn{roomType.maxChildren ? ` + ${roomType.maxChildren} trẻ em` : ""}</li>
      <li className="flex items-center gap-1.5"><BedDouble className="size-4" /> {roomType.bedType}</li>
      <li className="flex items-center gap-1.5"><Eye className="size-4" /> {c.view}</li>
    </ul>
  );
}

/** Thẻ hạng phòng: ảnh, thông số, giá từ, liên kết chi tiết. */
export function RoomCard({ roomType }: { roomType: RoomType }) {
  const { ratePlans, rateRules } = useStore();
  const c = roomContent(roomType.code);
  const href = `/phong-nghi/${slugify(roomType.name)}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        <RoomPhoto src={c.images[0]} alt={roomType.name} className="aspect-[3/2] transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-semibold">
            <Link href={href} className="hover:text-primary">{roomType.name}</Link>
          </h3>
          <p className="text-sm text-muted-foreground">{c.tagline}</p>
        </div>
        <RoomFacts roomType={roomType} className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground [&_li]:flex [&_li]:items-center [&_li]:gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0" />
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Giá chỉ từ</p>
            <p className="tabular text-lg font-bold text-primary">
              {formatVND(fromPrice(roomType, ratePlans, rateRules))}
              <span className="text-xs font-normal text-muted-foreground"> /đêm</span>
            </p>
          </div>
          <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Xem phòng
          </Link>
        </div>
      </div>
    </article>
  );
}
