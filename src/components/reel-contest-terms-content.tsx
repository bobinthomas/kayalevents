// Shared body content for the #KayalReelFest Terms & Conditions — rendered on
// the standalone /reel-contest-terms page and inside the entry form's terms
// modal. Keep these in sync with public/legal/reel-contest-terms.txt.

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
      <p className="text-sand-muted">
        The Kayal Events Reel Contest is a skill-based competition conducted
        by Kayal Events. Winners will be selected solely on the basis of
        merit and judging criteria.
      </p>

      <div className="hairline" />

      <Section n={1} title="Eligibility">
        <p>Participation is open to Australian residents aged 18 years and over.</p>
        <p>
          By entering the Contest, participants confirm that their
          submission is original, that they own or control the rights
          necessary to submit the content, and that their entry complies
          with these Terms and Conditions.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={2} title="Contest Period">
        <p>
          The Contest opens on 10 July 2026 and closes at 11:59 PM AEST on
          18 July 2026.
        </p>
        <p>
          Entries received after the closing date, or entries that are
          incomplete, corrupted, inaccessible, or otherwise non-compliant,
          may be deemed invalid at the sole discretion of Kayal Events.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={3} title="How to Enter">
        <p>Entry is free of charge.</p>
        <p>
          Participants must submit their reel through the official entry
          form available on the Kayal Events website. Entrants may choose to
          create content inspired by either:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Team Mohanlal</li>
          <li>Team Chithra</li>
        </ul>
        <p>Videos must:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Be no longer than 90 seconds in duration;</li>
          <li>
            Be submitted as a direct file upload or via a Google Drive link
            with public viewing access;
          </li>
          <li>
            Be the original work of the entrant or submitted with
            appropriate authority.
          </li>
        </ul>
        <p>Multiple entries are not permitted.</p>
      </Section>

      <div className="hairline" />

      <Section n={4} title="Judging">
        <p>
          All eligible entries will be reviewed by a judging panel appointed
          by Kayal Events.
        </p>
        <p>Entries will be assessed based on:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Creativity</li>
          <li>Performance and presentation quality</li>
          <li>Entertainment value</li>
          <li>Relevance to the selected theme</li>
        </ul>
        <p>
          The decisions of the judging panel are final and no correspondence
          regarding judging outcomes will be entered into.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={5} title="Prizes">
        <p>
          The top five selected entries will be professionally edited and
          featured on Kayal Events&apos; official marketing and social media
          channels.
        </p>
        <p>
          The top five winning entries, whether submitted by an individual
          or a group, will each receive one admission ticket to Mohanlal
          Live in Australia, to be held in Sydney on 8 August 2026. Ticket
          category and seating allocation will be determined by Kayal Events
          and are subject to availability.
        </p>
        <p>Prizes are:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Non-transferable;</li>
          <li>Cannot be exchanged for cash or alternative products;</li>
          <li>Must not be sold, transferred, or resold.</li>
        </ul>
        <p>
          Entrants residing outside New South Wales may additionally
          receive a travel contribution voucher valued at AUD $100. This
          voucher is intended solely as a contribution towards travel
          expenses and does not represent reimbursement of actual travel
          costs. Additional terms relating to voucher redemption may apply.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={6} title="Use of Submitted Content">
        <p>
          By submitting an entry, participants grant Kayal Events a
          non-exclusive, worldwide, royalty-free, perpetual licence to edit,
          reproduce, publish, distribute, promote, and otherwise use the
          submitted content in connection with the Contest, future
          promotional activities, and related marketing campaigns. Ownership
          of the original content remains with the participant.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={7} title="Copyright and Third-Party Content">
        <p>
          Participants are solely responsible for ensuring they have
          obtained all necessary rights, permissions, and licences for any
          music, audio, dialogue, images, or other third-party content
          included in their submission. Kayal Events accepts no
          responsibility or liability for copyright infringement claims,
          takedown notices, or disputes arising from entrant-submitted
          content.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={8} title="Privacy">
        <p>
          Personal information collected during the entry process, including
          names, contact details, state of residence, and submitted content,
          will be used solely for the administration of the Contest, winner
          notifications, prize fulfilment, and related promotional
          activities. Kayal Events will not sell personal information and
          will only disclose information to service providers or
          representatives where reasonably necessary for the operation of
          the Contest.
        </p>
      </Section>

      <div className="hairline" />

      <Section n={9} title="Disqualification">
        <p>Kayal Events reserves the right to reject or disqualify any entry that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Breaches these Terms and Conditions;</li>
          <li>Contains offensive, unlawful, defamatory, or inappropriate content;</li>
          <li>Infringes the rights of any third party;</li>
          <li>Provides false or misleading information.</li>
        </ul>
      </Section>
    </div>
  );
}
