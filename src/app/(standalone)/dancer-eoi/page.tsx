import type { Metadata } from "next";
import { EOIForm } from "./eoi-form";

export const metadata: Metadata = {
  title: "Perform with Us — Dancer EOI | Kayal Events",
  description:
    "Open call for dance groups to perform at Vaikittu Endha Paripadi — Mohanlal Live in Sydney. Submit your expression of interest before 8 July 2026.",
  robots: { index: false, follow: false },
};

export default function DancerEOIPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-20">
      <p className="eyebrow">Open Call — Sydney 2026</p>
      <h1 className="headline mt-3 text-4xl md:text-6xl">Perform with us</h1>
      <p className="mt-4 max-w-xl text-sand-muted">
        We are inviting dance groups to perform at{" "}
        <span className="font-medium text-sand">
          Vaikittu Endha Paripadi — Mohanlal Live in Sydney.
        </span>{" "}
        Fill in your details below. Applications close&nbsp;8&nbsp;July&nbsp;2026,&nbsp;5&nbsp;pm&nbsp;AEST.
      </p>

      <div className="hairline my-10" />

      <EOIForm />
    </div>
  );
}
