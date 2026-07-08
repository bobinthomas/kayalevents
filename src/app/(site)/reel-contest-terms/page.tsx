import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { ReelContestTermsContent } from "@/components/reel-contest-terms-content";

export const metadata: Metadata = {
  title: "Reel Contest Terms & Conditions",
  description:
    "Terms and conditions for the #KayalReelFest reel contest — Team Mohanlal vs Team Chithra, ahead of Mohanlal Live in Australia, Sydney.",
  alternates: { canonical: "/reel-contest-terms" },
};

export default function ReelContestTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">#KayalReelFest</p>
        <h1 className="headline mt-3 text-4xl md:text-5xl">
          Reel Contest — Terms &amp; Conditions
        </h1>
        <p className="mt-4 text-sand-muted">
          Last updated 8 July 2026. This document governs entry into the
          #KayalReelFest reel contest (the &ldquo;Promotion&rdquo;) run by Kayal
          Events ahead of Mohanlal Live in Australia — Sydney. By submitting an
          entry you agree to be bound by these terms.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <ReelContestTermsContent />

        <p className="mt-10 pt-4 text-xs text-sand-muted/70">
          A plain-text version of these terms is available at{" "}
          <a
            href="/legal/reel-contest-terms.txt"
            className="text-lagoon underline"
          >
            /legal/reel-contest-terms.txt
          </a>
          .
        </p>
      </Reveal>
    </div>
  );
}
