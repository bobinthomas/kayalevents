"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getServerConsent,
  getStoredConsent,
  storeConsent,
  subscribeConsent,
} from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function Analytics() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getStoredConsent,
    getServerConsent
  );

  if (consent !== "granted") return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}
      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}

export function ConsentBanner() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getStoredConsent,
    getServerConsent
  );
  const acceptRef = useRef<HTMLButtonElement>(null);

  // Move focus to Accept button when banner appears
  useEffect(() => {
    if (consent === null) {
      acceptRef.current?.focus();
    }
  }, [consent]);

  // "pending" = server render / pre-hydration; only show once we know
  // there is genuinely no stored choice.
  if (consent !== null) return null;

  const choose = (value: "granted" | "denied") => {
    storeConsent(value);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="consent-description"
      className="gradient-border fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-border bg-surface/95 p-5 shadow-2xl backdrop-blur"
    >
      <p id="consent-description" className="text-sm text-sand-muted">
        We use cookies for analytics and to measure our advertising (Google
        Analytics, Meta Pixel). No marketing emails without your consent.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          ref={acceptRef}
          onClick={() => choose("granted")}
          className="gradient-border rounded-full bg-coral px-5 py-2 text-sm font-semibold text-sand transition hover:bg-coral-bright"
        >
          Accept
        </button>
        <button
          onClick={() => choose("denied")}
          className="rounded-full border border-border px-5 py-2 text-sm text-sand-muted transition hover:text-sand"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
