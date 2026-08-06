import type { EventStatus, KayalEvent, ShowDate } from "@/lib/types";

export function formatShowDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  });
}

export function formatShowTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Melbourne",
  });
}

/** Single date + time for a one-off show, or a date range (no time) for a multi-day one. */
export function formatShowDateTime(show: ShowDate): string {
  if (!show.end) return `${formatShowDate(show.start)} · ${formatShowTime(show.start)}`;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Australia/Melbourne",
    });
  return `${fmt(show.start)} – ${fmt(show.end)}`;
}

export function eventDateRange(event: KayalEvent): string {
  const dates = event.shows
    .flatMap((s) => [new Date(s.start), ...(s.end ? [new Date(s.end)] : [])])
    .sort((a, b) => +a - +b);
  if (dates.length === 0) return "Dates to be announced";
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Australia/Melbourne",
    });
  if (dates.length === 1) return fmt(dates[0]);
  return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
}

export function eventCities(event: KayalEvent): string {
  return [...new Set(event.shows.map((s) => s.city))].join(" · ");
}

export function priceRange(event: KayalEvent): string | null {
  const prices = event.ticketTiers
    .map((t) => parseFloat(t.price.replace(/[^0-9.]/g, "")))
    .filter((n) => !Number.isNaN(n));
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min}` : `$${min} – $${max}`;
}

export const statusLabel: Record<EventStatus, string> = {
  "on-sale": "On Sale",
  "selling-fast": "Selling Fast",
  "sold-out": "Sold Out",
  past: "Past Event",
};
