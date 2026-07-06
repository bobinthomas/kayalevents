// Shared body content for the #KayalReelFest Terms & Conditions — rendered on
// the standalone /reel-contest-terms page and inside the entry form's terms
// modal. Keep these in sync with public/legal/reel-contest-terms.txt.

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-coral/15 px-1.5 py-0.5 font-mono text-[0.85em] text-coral">
      {children}
    </span>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl text-sand md:text-2xl">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-3 text-sand-muted">{children}</div>
    </section>
  );
}

export function ReelContestTermsContent() {
  return (
    <div className="space-y-10">
      <Section n={1} title="The Promotion">
        <p>
          The Promotion is a game of skill, judged against published
          criteria (see clause 5). It is not a game of chance, lottery or
          raffle, and no element of the Promotion is determined by chance.
          Accordingly, no trade promotion lottery permit is required in any
          Australian state or territory.
        </p>
        <p>
          Promoter: Kayal Events (<Placeholder>ABN [TODO]</Placeholder>),
          Australia (&ldquo;Kayal&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
          Contact:{" "}
          <a
            href="mailto:kayaleventsofficial@gmail.com"
            className="text-lagoon underline"
          >
            kayaleventsofficial@gmail.com
          </a>
          .
        </p>
      </Section>

      <div className="hairline" />

      <Section n={2} title="Eligibility">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Entrants must be Australian residents and at least 18 years of
            age at the time of entry. The Promotion is not open to entrants
            under 18, with or without guardian consent.
          </li>
          <li>
            Employees (and their immediate families) of Kayal Events and any
            agencies directly associated with the judging or administration
            of this Promotion are not eligible to enter.
          </li>
          <li>
            By entering, you confirm the submitted reel is your own original
            performance (or that of the group you represent) and that you
            have the right to submit it.
          </li>
        </ul>
      </Section>

      <div className="hairline" />

      <Section n={3} title="Entry period">
        <ul className="list-disc space-y-2 pl-5">
          <li>Entries open: 12:00am AEST, 10 July 2026.</li>
          <li>Entries close: 11:59pm AEST, 31 July 2026.</li>
          <li>
            Winners announced: on or from 3 August 2026, via Kayal
            Events&apos; official Instagram and Facebook pages and by direct
            email/phone contact to winning entrants.
          </li>
          <li>
            Late, incomplete, corrupted or otherwise unplayable entries will
            not be considered.
          </li>
        </ul>
      </Section>

      <div className="hairline" />

      <Section n={4} title="How to enter">
        <p>
          Entry is free. Entrants choose one of two themes and submit a
          video directly through the entry form at{" "}
          <span className="text-sand">kayalevents.com.au/reel-contest</span>{" "}
          — no public posting to Instagram or any other platform is required
          to enter:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-sand">Team Mohanlal</span> — dialogues,
            iconic scenes, or dance to his songs.
          </li>
          <li>
            <span className="text-sand">Team Chithra</span> — melodies,
            lip-syncs, or creative videos to K.S. Chithra songs.
          </li>
        </ul>
        <p>
          Videos must be your own upload — either a file submitted directly
          through the entry form (maximum 10MB) or, for larger files, a
          Google Drive link you control, shared with &ldquo;Anyone with the
          link can view&rdquo; access so Kayal can retrieve it. Videos must
          be no longer than 90 seconds. There is no limit on the number of
          entries a person may submit, and you may enter both themes.
        </p>
        <p>
          Entrants are solely responsible for the audio/music used in their
          own account or upload — see clause 8 (Music &amp; copyright).
        </p>
      </Section>

      <div className="hairline" />

      <Section n={5} title="Judging criteria and process">
        <p>
          All eligible entries will be scored by a panel of three judges
          appointed by Kayal Events, against the following published,
          weighted criteria (each scored out of 10):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Creativity — 40%</li>
          <li>Execution / effort (performance and video/audio quality) — 30%</li>
          <li>Entertainment value / rewatchability — 20%</li>
          <li>Theme fit — 10%</li>
        </ul>
        <p>
          Each judge&apos;s scores are weighted and averaged across the
          panel; the five entries with the highest average score are the
          winners. Judges score entries independently from the submitted
          file or Drive link only — public engagement (likes, views, shares)
          plays no part in judging, as entries are not required to be
          posted publicly. The judging panel&apos;s decision is final and
          binding, and no correspondence will be entered into regarding
          individual scores.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={6} title="Prizes">
        <p>
          The five winning entries will be professionally edited by Kayal
          Events and featured on Kayal Events&apos; official channels. Each
          of the five winning entrants will receive:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            One (1) <Placeholder>ticket tier TBC</Placeholder> ticket to
            Mohanlal Live in Australia, Sydney (8 August 2026, Norwest
            Convention Centre). The ticket is non-transferable, has no cash
            alternative, and cannot be resold.
          </li>
          <li>
            If the winning entrant&apos;s declared state of residence is not
            New South Wales: a $100 AUD voucher as a contribution toward the
            cost of travel to Sydney to attend the show. This voucher is a
            contribution only, not a full or partial airfare, has no cash
            alternative, and is valid for redemption{" "}
            <Placeholder>validity window TBC</Placeholder>.
          </li>
        </ul>
        <p>
          Prizes are not transferable to a third party and cannot be
          exchanged, varied or redeemed for cash, except as required by law.
          Total prize pool: 5 tickets plus up to 5 travel vouchers ($500 AUD
          maximum).
        </p>
      </Section>

      <div className="hairline" />

      <Section n={7} title="Licence to use your entry">
        <p>
          By submitting an entry, you grant Kayal Events a non-exclusive,
          royalty-free, worldwide licence to edit, adapt, reproduce,
          publish, repost and otherwise feature your submitted video
          (including your name and the team you entered under) across Kayal
          Events&apos; own marketing channels, in connection with this
          Promotion and Mohanlal Live in Australia, including after the
          Promotion ends. You retain ownership of your original footage;
          Kayal will credit you where practical when featuring an edited
          version.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={8} title="Music and copyright">
        <p>
          Any music, dialogue or other third-party content used in your
          submitted video is used at your own risk and on your own account.
          Kayal Events is not responsible for any copyright claim, takedown,
          or platform action arising from an entrant&apos;s use of
          third-party audio in their own submission. Where Kayal Events
          professionally edits a winning entry for its own channels, Kayal
          will handle music licensing for that edited version appropriately
          for its own posting.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={9} title="Privacy">
        <p>
          Kayal Events collects the personal information you provide on the
          entry form (name, email, phone, state of residence, and your
          submitted video or Drive link) to administer this Promotion —
          including judging, contacting winners, and coordinating
          prize/travel-voucher fulfilment. We do not sell your personal
          information. It may be shared with the judging panel and with
          service providers strictly for the purposes of running the
          Promotion (e.g. Google Sheets/Drive for entry storage).
          Non-winning entrants&apos; personal details are not retained
          beyond what is reasonably necessary to administer the Promotion
          and respond to any queries about it. Entrants may request access
          to, correction of, or deletion of their information at any time by
          emailing{" "}
          <a
            href="mailto:kayaleventsofficial@gmail.com"
            className="text-lagoon underline"
          >
            kayaleventsofficial@gmail.com
          </a>
          .
        </p>
      </Section>

      <div className="hairline" />

      <Section n={10} title="General">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Kayal Events reserves the right to disqualify any entry that
            breaches these terms, is offensive, defamatory, unlawful, or
            infringes a third party&apos;s rights.
          </li>
          <li>
            Kayal Events may vary, suspend or cancel the Promotion where
            circumstances beyond its reasonable control require it, subject
            to applicable law.
          </li>
          <li>
            These terms are governed by the laws of New South Wales,
            Australia, and entrants submit to the exclusive jurisdiction of
            its courts.
          </li>
        </ul>
      </Section>
    </div>
  );
}
