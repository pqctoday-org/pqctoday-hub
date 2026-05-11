// SPDX-License-Identifier: GPL-3.0-only
import { ShieldCheck, ExternalLink } from 'lucide-react'

const EFFECTIVE_DATE = 'May 9, 2026'
const POLICY_VERSION = '1.0'

function Section({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="glass-panel p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {number}. {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-secondary">{children}</div>
    </section>
  )
}

export function EditorialIndependenceView() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-primary shrink-0" size={28} />
          <h1 className="text-2xl font-bold text-gradient">Editorial Independence</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          The binding policy that governs how sponsorship and editorial content interact at PQC
          Today
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Effective Date: {EFFECTIVE_DATE} &middot; Last Updated: {EFFECTIVE_DATE} &middot; Policy
          Version: {POLICY_VERSION}
        </p>
      </div>

      <div className="space-y-4">
        <section className="glass-panel p-6">
          <p className="text-sm leading-relaxed text-secondary">
            PQC Today provides reference data, assessments, and educational content used by
            enterprises, consultants, and vendors to plan post-quantum cryptography migration. The
            credibility of that content depends on its independence from commercial influence. This
            page is the binding policy that governs how we operate.
          </p>
        </section>

        <Section number={1} title="What sponsorship buys, and what it does not">
          <p>
            <strong className="text-foreground">Sponsorship buys recognition.</strong> Sponsors
            receive named acknowledgment on a dedicated Sponsors page, in the site footer, and
            &mdash; where applicable to their tier &mdash; on the Landing page, the About page, and
            inside category landing sections. Sponsor placements are clearly labeled as sponsorship.
          </p>
          <p>
            <strong className="text-foreground">Sponsorship buys access.</strong> Higher tiers
            receive access to roadmap-input calls, early access to standards summaries, content
            collaboration slots, and direct support channels. These benefits affect the{' '}
            <em>platform</em>, not the <em>editorial content</em>.
          </p>
          <p>
            <strong className="text-foreground">
              Sponsorship does not buy editorial outcomes.
            </strong>{' '}
            Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Sponsorship does not affect whether a product, vendor, library, standard, or
              certification appears in <code className="text-accent">/migrate</code>,{' '}
              <code className="text-accent">/compliance</code>, the algorithm catalog, the standards
              library, or any other reference dataset.
            </li>
            <li>
              Sponsorship does not affect ordering, ranking, scoring, or filtering within those
              datasets.
            </li>
            <li>
              Sponsorship does not affect the substance of any assessment, including certification
              status, feature coverage, security level, or migration recommendations.
            </li>
            <li>
              Sponsorship does not buy removal of competitors, suppression of negative information,
              or modification of cited evidence.
            </li>
          </ul>
        </Section>

        <Section number={2} title="Inclusion and assessment criteria">
          <p>Inclusion and assessment criteria are documented and applied uniformly:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Migration data</strong> &mdash; presence of FIPS
              203 / 204 / 205 certification, public product documentation, or observable shipping
              support.
            </li>
            <li>
              <strong className="text-foreground">Compliance data</strong> &mdash; scraped directly
              from NIST CMVP, Common Criteria, ANSSI, ENISA, BSI, and other certification
              authorities.
            </li>
            <li>
              <strong className="text-foreground">Standards library</strong> &mdash; published RFCs,
              NIST FIPS / SP, ETSI TS, ISO / IEC.
            </li>
          </ul>
          <p>
            Where a sponsor&apos;s product appears in this data, it appears on the same basis as any
            non-sponsor product, and is marked with a &ldquo;Sponsor&rdquo; badge so readers can see
            the relationship.
          </p>
        </Section>

        <Section number={3} title="Conflict-of-interest disclosure">
          <p>
            When a sponsor&apos;s product appears in editorial content &mdash; a deep-dive, case
            study, webinar, or named example &mdash; that content carries a visible sponsorship
            disclosure.
          </p>
          <p>
            When PQC Today maintainers hold any other relationship with a vendor (consulting
            engagement, advisory role, or employment history within the last 24 months), that
            relationship is disclosed on the relevant page.
          </p>
        </Section>

        <Section number={4} title="Requests to modify content">
          <p>
            We will publicly disclose any vendor request to modify, remove, or re-rank a listing in
            our reference data. We will not act on such requests, except to:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Correct a factual error supported by primary-source evidence (e.g., an updated FIPS
              certificate, a corrected vendor name, a fixed version number). Corrections are logged
              in the changelog with attribution.
            </li>
            <li>Update data that has changed in the underlying authoritative source.</li>
          </ol>
          <p>Disclosure is published in the changelog and on the relevant data page.</p>
        </Section>

        <Section number={5} title="Funding sources">
          <p>PQC Today is funded by:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vendor and enterprise sponsorship</li>
            <li>Consultant tier subscriptions</li>
            <li>Individual donations</li>
          </ul>
          <p>
            We do not accept funding from any source that requires editorial influence as a
            condition. We do not run advertising. We do not use affiliate links.
          </p>
        </Section>

        <Section number={6} title="How to flag a violation">
          <p>
            If you believe this policy has been violated &mdash; that a listing, ranking,
            assessment, or content item has been influenced by sponsorship &mdash; please report it
            via a public issue on{' '}
            <a
              href="https://github.com/pqctoday-org/pqctoday-hub/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              GitHub
              <ExternalLink size={12} />
            </a>
            .
          </p>
          <p>
            We will investigate, respond publicly within 30 days, and publish findings in the
            changelog. Reports may be made anonymously through a third-party tipline (planned).
          </p>
        </Section>

        <Section number={7} title="Changes to this policy">
          <p>
            Changes to this policy are tracked in the changelog and require a 30-day notice period
            before taking effect. Material weakening of the policy &mdash; reducing transparency,
            narrowing disclosure, or adding sponsor influence &mdash; will trigger sponsor renewal
            opt-outs at no cost.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground text-center pt-4 pb-8">
          This policy is binding on PQC Today maintainers and supersedes any contrary representation
          made in sponsor agreements.
        </p>
      </div>
    </div>
  )
}
