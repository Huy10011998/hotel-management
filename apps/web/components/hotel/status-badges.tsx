import {
  BOOKING_SOURCE_LABEL,
  HK_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
  ROOM_DISPLAY_STATUSES,
  ROOM_DISPLAY_STATUS_LABEL,
  TICKET_PRIORITY_LABEL,
  TICKET_STATUS_LABEL,
  type BookingSource,
  type HkStatus,
  type ReservationStatus,
  type RoomDisplayStatus,
  type TicketPriority,
  type TicketStatus,
} from "@hotel/shared";
import { Badge } from "@/components/ui/badge";
import {
  HK_STATUS_VARIANT,
  RESERVATION_STATUS_VARIANT,
  ROOM_STATUS_STYLE,
  SOURCE_COLOR,
  TICKET_PRIORITY_VARIANT,
  TICKET_STATUS_VARIANT,
} from "@/lib/status";
import { cn } from "@/lib/utils";

export function RoomStatusBadge({ status, className }: { status: RoomDisplayStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <span className={cn("size-2 rounded-full", ROOM_STATUS_STYLE[status].dot)} />
      {ROOM_DISPLAY_STATUS_LABEL[status]}
    </span>
  );
}

export function RoomStatusLegend({ counts, active, onToggle }: { counts?: Partial<Record<RoomDisplayStatus, number>>; active?: RoomDisplayStatus | null; onToggle?: (s: RoomDisplayStatus | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROOM_DISPLAY_STATUSES.map((s) => {
        const content = (
          <>
            <span className={cn("size-2.5 rounded-full", ROOM_STATUS_STYLE[s].dot)} />
            <span>{ROOM_DISPLAY_STATUS_LABEL[s]}</span>
            {counts && <span className="tabular font-semibold">{counts[s] ?? 0}</span>}
          </>
        );
        return onToggle ? (
          <button
            key={s}
            onClick={() => onToggle(active === s ? null : s)}
            aria-pressed={active === s}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent",
              active === s && "border-primary bg-accent ring-1 ring-primary",
            )}
          >
            {content}
          </button>
        ) : (
          <span key={s} className="inline-flex items-center gap-1.5 text-xs">
            {content}
          </span>
        );
      })}
    </div>
  );
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge variant={RESERVATION_STATUS_VARIANT[status]}>{RESERVATION_STATUS_LABEL[status]}</Badge>;
}

export function HkStatusBadge({ status }: { status: HkStatus }) {
  return <Badge variant={HK_STATUS_VARIANT[status]}>{HK_STATUS_LABEL[status]}</Badge>;
}

export function SourceBadge({ source }: { source: BookingSource }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="size-2 rounded-sm" style={{ background: SOURCE_COLOR[source] }} />
      {BOOKING_SOURCE_LABEL[source]}
    </span>
  );
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={TICKET_PRIORITY_VARIANT[priority]}>{TICKET_PRIORITY_LABEL[priority]}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={TICKET_STATUS_VARIANT[status]}>{TICKET_STATUS_LABEL[status]}</Badge>;
}
