import type { EventStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";

const styles: Record<
  EventStatus,
  { badge: string; dot?: string }
> = {
  "on-sale": {
    badge: "border-lagoon/50 bg-lagoon/10 text-lagoon",
    dot: "bg-lagoon",
  },
  "selling-fast": {
    badge: "border-orange-400/50 bg-orange-400/10 text-orange-300 status-pulse",
    dot: "bg-orange-400",
  },
  "sold-out": {
    badge: "border-coral/40 bg-coral/8 text-coral",
  },
  past: {
    badge: "border-border text-sand-muted",
  },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const { badge, dot } = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] ${badge}`}
    >
      {dot && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${dot} ${
            status === "selling-fast" ? "dot-pulse" : ""
          }`}
          aria-hidden="true"
        />
      )}
      {statusLabel[status]}
    </span>
  );
}
