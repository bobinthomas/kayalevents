import type { Metadata } from "next";
import { ReelContestForm } from "./reel-contest-form";

export const metadata: Metadata = {
  title: "#KayalReelFest — Reel Contest | Kayal Events",
  description:
    "Team Lalettan vs Team ChithraChechi. Submit your reel ahead of Mohanlal Live in Australia — Sydney. Entries close 18 July 2026.",
  robots: { index: false, follow: false },
};

export default function ReelContestPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-20">
      <p className="eyebrow">#KayalReelFest — Sydney 2026</p>
      <h1 className="headline mt-3 text-4xl md:text-6xl">
        Team Lalettan or Team ChithraChechi?
      </h1>
      <p className="mt-4 max-w-xl text-sand-muted">
        Submit your reel — dialogues, dance, lip-syncs or melodies — ahead of{" "}
        <span className="font-medium text-sand">
          Mohanlal Live in Australia, Sydney.
        </span>{" "}
        Direct submissions only — upload your video directly below to enter
        the selection process. Best reels get professionally edited, featured
        on our page, and the TOP&nbsp;5 win a FREE SHOW TICKET. Winners
        residing outside New South Wales may additionally receive a travel
        contribution voucher valued at AUD&nbsp;$100. <br />Entries
        close&nbsp;18&nbsp;July&nbsp;2026,&nbsp;11:59&nbsp;pm&nbsp;AEST.
      </p>

      <div className="hairline my-10" />

      <ReelContestForm />
    </div>
  );
}
