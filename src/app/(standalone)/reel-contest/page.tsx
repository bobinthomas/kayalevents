import type { Metadata } from "next";
import { ReelContestForm } from "./reel-contest-form";

export const metadata: Metadata = {
  title: "#KayalReelFest — Reel Contest | Kayal Events",
  description:
    "Team Mohanlal vs Team Chithra. Submit your reel ahead of Mohanlal Live in Australia — Sydney. Entries close 31 July 2026.",
  robots: { index: false, follow: false },
};

export default function ReelContestPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-20">
      <p className="eyebrow">#KayalReelFest — Sydney 2026</p>
      <h1 className="headline mt-3 text-4xl md:text-6xl">
        Team Mohanlal or Team Chithra?
      </h1>
      <p className="mt-4 max-w-xl text-sand-muted">
        Submit your reel — dialogues, dance, lip-syncs or melodies — ahead of{" "}
        <span className="font-medium text-sand">
          Mohanlal Live in Australia, Sydney.
        </span>{" "}
        No need to post publicly — upload your video directly below.
        Top 5 reels get professionally edited, featured on our page, and win
        a free show ticket. Entries close&nbsp;31&nbsp;July&nbsp;2026,&nbsp;11:59&nbsp;pm&nbsp;AEST.
      </p>

      <div className="hairline my-10" />

      <ReelContestForm />
    </div>
  );
}
