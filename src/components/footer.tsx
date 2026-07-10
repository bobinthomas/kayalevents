import Link from "next/link";
import { InsiderForm } from "@/components/insider-form";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      {/* Lagoon ambient gradient wash */}
      <div
        className="lagoon-wash pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        {/* Brand row */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-display text-3xl tracking-wide text-sand">
              KAYAL<span className="text-lagoon"> EVENTS</span>
            </p>
            <p className="mt-1.5 max-w-xs text-sm text-sand-muted">
              {settings.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-border rounded-full border border-border px-4 py-2 text-sm text-sand-muted transition-colors hover:border-lagoon/40 hover:text-lagoon"
              >
                Instagram
              </a>
            )}
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border inline-flex items-center gap-2 rounded-full border border-lagoon/40 bg-lagoon/8 px-4 py-2 text-sm font-semibold text-lagoon transition-colors hover:bg-lagoon/15"
            >
              <span className="dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-lagoon" aria-hidden="true" />
              WhatsApp Us
            </a>
          </div>
        </div>

        <div className="hairline mb-12" />

        {/* Content grid: Insider form + nav + contact */}
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
          {/* Presale list */}
          <div className="max-w-md">
            <InsiderForm source="footer" />
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation" className="space-y-3">
            <p className="eyebrow">Explore</p>
            {[
              ["Current Events", "/events"],
              ["Previous Events", "/portfolio"],
              ["Services", "/services"],
              ["About", "/about"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block text-sm text-sand-muted transition-colors hover:text-lagoon"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Contact */}
          <div className="space-y-3">
            <p className="eyebrow">Contact</p>
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="block text-sm text-sand-muted transition-colors hover:text-lagoon"
              >
                {settings.phoneDisplay}
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="block break-all text-sm text-sand-muted transition-colors hover:text-lagoon"
              >
                {settings.email}
              </a>
            )}
            <p className="pt-1 text-sm text-sand-muted/50">
              Melbourne · Sydney
              <br />
              Brisbane · Perth · Adelaide
            </p>
          </div>
        </div>

        <div className="hairline mt-12" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-sand-muted/50 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </p>
          <p>kayalevents.com.au</p>
        </div>
      </div>
    </footer>
  );
}
