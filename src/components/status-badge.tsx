import type { EventStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";

const styles: Record<EventStatus, string> = {
  "on-sale": "border-gold/50 text-gold",
  "selling-fast": "border-orange-400/60 text-orange-300",
  "sold-out": "border-red-400/50 text-red-300",
  past: "border-ink-border text-ivory-muted",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] ${styles[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
