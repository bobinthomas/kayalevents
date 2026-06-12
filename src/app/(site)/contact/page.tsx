import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { Reveal } from "@/components/reveal";
import { getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start an event inquiry with Kayal Events — concerts, corporate events, festivals and private celebrations across Australia. Call, WhatsApp or send the form.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">Get in touch</p>
        <h1 className="headline mt-3 text-4xl md:text-6xl">
          Let&apos;s plan your event
        </h1>
        <p className="mt-4 max-w-xl text-ivory-muted">
          Tell us the occasion, the city and the scale — the first call back
          will already be well-informed.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-12 md:grid-cols-[2fr_1fr]">
        <Reveal>
          <InquiryForm />
        </Reveal>

        <Reveal delay={100}>
          <div className="space-y-6 rounded-2xl border border-ink-border bg-ink-raised p-7 text-sm">
            <div>
              <p className="eyebrow">Prefer to talk?</p>
              <a
                href={`tel:${settings.phone}`}
                className="mt-3 block text-lg text-ivory transition hover:text-gold"
              >
                {settings.phoneDisplay}
              </a>
            </div>
            <div>
              <p className="eyebrow">WhatsApp</p>
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-ivory-muted transition hover:text-gold"
              >
                Message us — we reply fast
              </a>
            </div>
            <div>
              <p className="eyebrow">Email</p>
              <a
                href={`mailto:${settings.email}`}
                className="mt-3 block break-all text-ivory-muted transition hover:text-gold"
              >
                {settings.email}
              </a>
            </div>
            <div className="hairline" />
            <p className="text-ivory-muted">
              Based in Melbourne. Producing events nationally — Melbourne,
              Sydney, Brisbane, Perth and Adelaide.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
