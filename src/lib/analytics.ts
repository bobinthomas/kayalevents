"use client";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a conversion event to GA4 and Meta Pixel (R9).
 * Tracked events: buy_ticket_click, insider_signup, inquiry_submit, whatsapp_click.
 */
export function track(eventName: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", eventName, params);
  window.fbq?.("trackCustom", eventName, params);
}

export const CONSENT_KEY = "kayal-consent";

export type ConsentState = "granted" | "denied" | null | "pending";

export function getStoredConsent(): ConsentState {
  if (typeof window === "undefined") return "pending";
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function getServerConsent(): ConsentState {
  return "pending";
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener("kayal-consent-change", callback);
  return () => window.removeEventListener("kayal-consent-change", callback);
}

export function storeConsent(value: "granted" | "denied") {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("kayal-consent-change", { detail: value }));
}
