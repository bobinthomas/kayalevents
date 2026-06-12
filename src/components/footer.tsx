import Link from "next/link";
import { InsiderForm } from "@/components/insider-form";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-ink-border bg-ink-raised/40">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="max-w-md">
            <InsiderForm source="footer" />
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <nav aria-label="Footer" className="space-y-3">
              <p className="eyebrow">Explore</p>
              {[
                ["Upcoming Events", "/events"],
                ["Portfolio", "/portfolio"],
                ["Services", "/services"],
                ["About", "/about"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-ivory-muted transition hover:text-gold"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="space-y-3">
              <p className="eyebrow">Contact</p>
              <a
                href={`tel:${settings.phone}`}
                className="block text-ivory-muted transition hover:text-gold"
              >
                {settings.phoneDisplay}
              </a>
              <a
                href={`mailto:${settings.email}`}
                className="block break-all text-ivory-muted transition hover:text-gold"
              >
                {settings.email}
              </a>
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-ivory-muted transition hover:text-gold"
              >
                Instagram
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-ivory-muted transition hover:text-gold"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="hairline mt-12" />

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-ivory-muted/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. {settings.tagline}.
          </p>
          <p>Melbourne · Sydney · Brisbane · Perth · Adelaide</p>
        </div>
      </div>
    </footer>
  );
}
