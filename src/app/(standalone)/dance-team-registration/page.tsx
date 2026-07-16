import type { Metadata } from "next";
import { DanceTeamForm } from "./dance-team-form";

export const metadata: Metadata = {
  title: "Dance Team Performer Registration | Kayal Events",
  description:
    "Registration form for dance team performers — required for backstage accreditation at Kayal Events shows.",
  robots: { index: false, follow: false },
};

export default function DanceTeamRegistrationPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-20">
      <p className="eyebrow">Performer Accreditation</p>
      <h1 className="headline mt-3 text-4xl md:text-6xl">Dance team registration</h1>
      <p className="mt-4 max-w-xl text-sand-muted">
        Every dancer performing at the event must individually complete this
        registration and submit all required photos and identification.
      </p>

      <div className="hairline my-10" />

      <DanceTeamForm />
    </div>
  );
}
