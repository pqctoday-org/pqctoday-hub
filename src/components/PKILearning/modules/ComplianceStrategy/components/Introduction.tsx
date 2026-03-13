// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  Globe,
  CheckSquare,
  CalendarRange,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  Building2,
  MapPin,
  Lock,
  Landmark,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Landscape + Key Frameworks ──────────────────────────────────────

const Step1LandscapeAndFrameworks: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Section 1: The PQC Compliance Landscape */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Scale size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The PQC Compliance Landscape</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Governments and standards bodies worldwide are establishing requirements for the
          transition to{' '}
          <InlineTooltip term="Post-Quantum Cryptography">post-quantum cryptography</InlineTooltip>.
          For organizations operating across borders, navigating these overlapping and sometimes
          conflicting requirements is a critical challenge.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;A quantum computer of sufficient size and sophistication &mdash; also known as a
            cryptanalytically relevant quantum computer &mdash; will be capable of breaking much of
            the public-key cryptography used on digital systems across the United States and around
            the world.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; Executive Order 14306, Sustaining Select Efforts to Strengthen the Nation&apos;s
            Cybersecurity (June 6, 2025)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Regulatory Push</div>
            <p className="text-xs text-muted-foreground">
              NIST, NSA, ETSI, <InlineTooltip term="ANSSI">ANSSI</InlineTooltip>, and{' '}
              <InlineTooltip term="BSI">BSI</InlineTooltip> are all publishing PQC transition
              guidance with concrete deadlines.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Industry Standards</div>
            <p className="text-xs text-muted-foreground">
              PCI DSS, HIPAA, FedRAMP, and CMMC are incorporating quantum-safe requirements into
              their compliance frameworks.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Cross-Border Complexity</div>
            <p className="text-xs text-muted-foreground">
              Organizations operating in multiple jurisdictions must reconcile different algorithm
              preferences, timelines, and certification requirements.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 2: Key Frameworks */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <ShieldCheck size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Key Frameworks</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Understanding the major compliance frameworks driving PQC adoption is essential for
          building a multi-jurisdiction strategy.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-primary" />
              <div className="text-sm font-bold text-foreground">
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (NSA)
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The Commercial National Security Algorithm Suite 2.0 mandates PQC adoption for
              National Security Systems. Key deadlines: software/firmware signing preferred by 2025,
              exclusive by 2030; new networking equipment by 2026; web/cloud/servers and all
              remaining NSS by 2033. Requires <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>
              -1024 (FIPS&nbsp;203) and <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>-87
              (FIPS&nbsp;204) as minimum security levels.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-primary" />
              <div className="text-sm font-bold text-foreground">
                <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              NIST&apos;s transition guidance for post-quantum cryptography standards (Initial
              Public Draft published November 2024; comment period closed January 2025; final
              version pending). Recommends deprecating RSA, ECC, and other classical public-key
              algorithms by 2030 and disallowing them entirely after 2035. Emphasizes cryptographic
              agility and hybrid approaches during the transition period.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={16} className="text-secondary" />
              <div className="text-sm font-bold text-foreground">ETSI / ANSSI / BSI</div>
            </div>
            <p className="text-xs text-muted-foreground">
              European bodies have published PQC migration guidance. ANSSI recommends hybrid
              cryptography combining classical and PQC algorithms. BSI endorses ML-KEM
              (FIPS&nbsp;203) and ML-DSA (FIPS&nbsp;204) with specific parameter recommendations.
              ETSI provides interoperability guidance for hybrid key exchanges.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-secondary/30 mt-4">
          <div className="text-sm font-bold text-foreground mb-2">
            Hybrid Now, Pure PQC Later: The Two-Phase Transition
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            All major frameworks converge on a two-phase transition arc. In <strong>Phase 1</strong>{' '}
            (now through roughly 2028), organizations deploy <strong>hybrid mode</strong> &mdash;
            running a classical algorithm alongside a PQC algorithm in parallel. ANSSI and BSI
            require this during transition because it preserves security even if PQC implementations
            have undiscovered flaws. In <strong>Phase 2</strong> (2028 onward, timed to your
            earliest jurisdiction deadline), organizations move to <strong>pure PQC</strong>: CNSA
            2.0&apos;s &ldquo;exclusive&rdquo; requirements mean dropping the classical component
            once FIPS 140-3 validated implementations are widely available and proven.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Executive rule of thumb:</strong> Start hybrid deployments now. Plan your
            transition to pure PQC to meet your earliest jurisdiction deadline &mdash; which you
            will identify in the Jurisdiction Mapper workshop below.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Compliance-First vs Risk + Major Deadlines ──────────────────────

const Step2ApproachAndDeadlines: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Section 3: Compliance vs Risk Approach */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <AlertTriangle size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Compliance-First vs Risk-First</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Organizations typically approach PQC migration from one of two angles. The optimal
          strategy often combines both, using compliance deadlines as hard constraints and risk
          scoring to prioritize within those constraints.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-2">Compliance-First Approach</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Driven by regulatory deadlines and audit requirements</li>
              <li>&bull; Prioritizes systems under regulatory scope first</li>
              <li>&bull; Clear, external-driven milestones</li>
              <li>&bull; Risk: may miss high-risk systems outside compliance scope</li>
              <li>&bull; Best for: regulated industries (finance, government, healthcare)</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-2">Risk-First Approach</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Driven by data sensitivity and exposure windows</li>
              <li>&bull; Prioritizes highest-risk assets regardless of regulatory scope</li>
              <li>
                &bull; Addresses <InlineTooltip term="HNDL">HNDL</InlineTooltip> threats early
              </li>
              <li>&bull; Risk: may not satisfy auditors without compliance mapping</li>
              <li>&bull; Best for: technology companies, defense, intelligence</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Section 4: Compliance Deadline Timeline */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <CalendarRange size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Major Compliance Deadlines</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Key deadlines are converging across jurisdictions, creating a narrow window for
          organizations to complete their PQC migration.
        </p>
        <div className="space-y-2">
          {[
            {
              year: '2024',
              event:
                'NIST IR 8547 Initial Public Draft published — PQC transition guidance (final version pending)',
              source: 'NIST',
            },
            {
              year: '2025',
              event: 'CNSA 2.0 software/firmware signing preferred for NSS',
              source: 'NSA',
            },
            {
              year: '2026',
              event: 'CNSA 2.0 new networking equipment must support PQC',
              source: 'NSA',
            },
            {
              year: '2030',
              event:
                'CNSA 2.0 software/firmware signing exclusive; legacy networking replaced; NIST RSA/ECC deprecated',
              source: 'NSA/NIST',
            },
            {
              year: '2030',
              event:
                'ANSSI Phase 3 begins — standalone PQC optional; may become mandatory for long-term security products',
              source: 'ANSSI',
            },
            {
              year: '2033',
              event: 'CNSA 2.0 web/cloud/servers exclusive; all remaining NSS systems',
              source: 'NSA',
            },
            {
              year: '2035',
              event: 'NIST RSA/ECC disallowed entirely (NIST IR 8547)',
              source: 'NIST',
            },
          ].map((item) => (
            <div
              key={`${item.year}-${item.event}`}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
            >
              <span className="text-sm font-bold text-primary shrink-0 w-12 text-center">
                {item.year}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{item.event}</div>
                <p className="text-xs text-muted-foreground">{item.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: Country Deadlines + Dependencies + Workshop + Resources + CTA ────

const Step3CountriesAndWorkshop: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Section 5: Country-Specific Deadlines */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <MapPin size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Country-Specific Deadlines</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Beyond the major US and EU frameworks, individual countries are setting their own PQC
          transition deadlines. Organizations operating internationally must track these
          jurisdiction-specific requirements.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">Country</th>
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">Agency</th>
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">
                  Key Deadline
                </th>
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Australia</td>
                <td className="py-2 px-2">ASD</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  Cease use of traditional asymmetric cryptography (RSA, DH, ECDH, ECDSA) in
                  government and critical infrastructure systems; algorithms &ldquo;will not be
                  approved for use beyond 2030&rdquo; (ASD). Phased: transition plans required by
                  end of 2026, implementation begins 2028, full completion by 2030.
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Canada</td>
                <td className="py-2 px-2">CCCS</td>
                <td className="py-2 px-2 font-mono text-primary">2026</td>
                <td className="py-2 px-2">
                  Federal departments submit PQC migration plans by April 2026; high-priority
                  systems by 2031; full transition by 2035
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">United Kingdom</td>
                <td className="py-2 px-2">NCSC</td>
                <td className="py-2 px-2 font-mono text-primary">2028</td>
                <td className="py-2 px-2">
                  Three-phase roadmap: discovery (2025&ndash;2028), priority migration
                  (2028&ndash;2031), full migration (2031&ndash;2035)
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Czech Republic</td>
                <td className="py-2 px-2">NUKIB</td>
                <td className="py-2 px-2 font-mono text-primary">2027</td>
                <td className="py-2 px-2">
                  First EU member state to set a specific encryption migration deadline &mdash;
                  ahead of the broader EU coordinated roadmap
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">European Union</td>
                <td className="py-2 px-2">EC</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  Coordinated Implementation Roadmap (v1.1, June 2025): high-risk systems by 2030,
                  full transition by 2035 &mdash; aligned with NIST timelines
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Israel</td>
                <td className="py-2 px-2">INCD</td>
                <td className="py-2 px-2 font-mono text-primary">2025</td>
                <td className="py-2 px-2">
                  Quantum threat assessments completed by end of 2025; PQC required in new contracts
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Taiwan</td>
                <td className="py-2 px-2">NICS</td>
                <td className="py-2 px-2 font-mono text-primary">2027</td>
                <td className="py-2 px-2">
                  PQC migration target for critical semiconductor and technology sectors
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Singapore</td>
                <td className="py-2 px-2">MAS</td>
                <td className="py-2 px-2 font-mono text-primary">Guidance</td>
                <td className="py-2 px-2">
                  Monetary Authority of Singapore issued PQC readiness guidance (November 2024)
                  directing financial institutions to begin cryptographic inventory and migration
                  planning. No hard mandate yet; best-practice alignment with NIST standards
                  expected. Particularly relevant for financial sector organizations.
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Germany</td>
                <td className="py-2 px-2">BSI/DLR</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  QUANTITY initiative (March 2025) for quantum cryptanalysis; critical applications
                  PQC-protected by end of 2030
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium text-foreground">G7</td>
                <td className="py-2 px-2">CEG</td>
                <td className="py-2 px-2 font-mono text-primary">2034</td>
                <td className="py-2 px-2">
                  Cyber Expert Group (January 2026): financial sector PQC migration by 2034 with
                  phased preparation from 2025
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Key takeaway:</strong> Organizations must meet the{' '}
            <em>earliest</em> deadline across all jurisdictions where they operate. A company in
            Australia and the EU faces a 2030 hard deadline, not the EU&apos;s 2035 full transition
            target.
          </p>
        </div>
      </div>
    </section>

    {/* Section 6: Compliance Dependencies */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Lock size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Compliance Dependencies</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Several cross-cutting compliance requirements affect PQC migration timelines regardless of
          jurisdiction.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> &amp;{' '}
              <InlineTooltip term="CMVP">CMVP</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              The Cryptographic Module Validation Program certifies cryptographic implementations
              for government use. PQC algorithm implementations (FIPS 203/204/205) must undergo CMVP
              validation before deployment in federal systems. Validation exists on a spectrum: full
              CMVP validation (gold standard), modules in process, FIPS-mode operation, and partial
              compliance (FedRAMP, WebTrust). This certification backlog is a key dependency in
              migration timelines.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="eIDAS">eIDAS 2.0</InlineTooltip> (EU Digital Identity)
            </div>
            <p className="text-xs text-muted-foreground">
              The updated EU regulation for electronic identification mandates European Digital
              Identity (EUDI) wallets with deployments starting 2027+. While eIDAS 2.0 does not yet
              mandate PQC specifically, these wallets will need quantum-safe cryptography for
              long-term trust. ENISA identifies wallet providers as high-impact entities for early
              PQC adoption.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              Executive Order 14306 &amp; CISA PQC Product Guidance
            </div>
            <p className="text-xs text-muted-foreground">
              EO 14306 (June 6, 2025) &mdash; &ldquo;Sustaining Select Efforts to Strengthen the
              Nation&apos;s Cybersecurity&rdquo; &mdash; directs CISA, in consultation with NSA, to
              publish and maintain a list of product categories in which PQC-capable products are
              widely available (initial list due December 1, 2025). CISA subsequently issued
              procurement guidance requiring PQC capabilities in new federal product and service
              acquisitions, driving market demand for PQC-capable solutions.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="DORA">DORA</InlineTooltip> (EU Digital Operational Resilience)
            </div>
            <p className="text-xs text-muted-foreground">
              The EU&apos;s Digital Operational Resilience Act (enforcement January 2025) requires
              financial institutions to implement robust ICT risk management including cryptographic
              controls. While not PQC-specific yet, organizations subject to DORA must demonstrate
              encryption resilience planning that will inevitably encompass quantum threats.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="CBOM">CBOM</InlineTooltip> (Cryptographic Bill of Materials)
            </div>
            <p className="text-xs text-muted-foreground">
              A CBOM is your foundational compliance artifact &mdash; you cannot migrate what you
              haven&apos;t inventoried. Studies show 70% of organizations lack a complete
              cryptographic inventory. For the full CBOM framework, including CycloneDX format
              requirements and vendor contract language, see{' '}
              <Link to="/learn/vendor-risk" className="text-primary hover:underline">
                Vendor &amp; Supply Chain Risk
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-status-warning/20">
          <p className="text-xs text-muted-foreground">
            <AlertTriangle size={12} className="inline text-status-warning mr-1" />
            <strong className="text-foreground">Industry finding:</strong> 86% of financial sector
            organisations report being unprepared for post-quantum cybersecurity (2023 survey of 200
            financial sector leaders, cited by Europol&apos;s Quantum Safe Financial Forum, February
            2025).
          </p>
        </div>
      </div>
    </section>

    {/* Section 7: Workshop Preview */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <CheckSquare size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Workshop Overview</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          This workshop guides you through building a comprehensive compliance strategy in three
          steps:
        </p>
        <div className="space-y-2">
          {[
            {
              n: 1,
              t: 'Jurisdiction Mapper',
              d: 'Select your operating jurisdictions and see which frameworks, deadlines, and requirements apply. Identify conflicts between jurisdictions.',
              icon: Globe,
            },
            {
              n: 2,
              t: 'Audit Readiness Checklist',
              d: 'Build a comprehensive audit readiness checklist covering cryptographic inventory, policy, technical controls, vendor management, and documentation.',
              icon: CheckSquare,
            },
            {
              n: 3,
              t: 'Compliance Timeline Builder',
              d: 'Overlay regulatory deadlines with your migration milestones. Identify gaps and build a timeline to close them.',
              icon: CalendarRange,
            },
          ].map((step) => {
            const Icon = step.icon
            return (
              <div key={step.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <div className="p-1.5 rounded bg-primary/10 shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Step {step.n}: {step.t}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.d}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>

    {/* Related Resources */}
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/compliance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <BookOpen size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
            <div className="text-xs text-muted-foreground">
              NIST, ANSSI, BSI, and Common Criteria compliance data
            </div>
          </div>
        </Link>
        <Link
          to="/assess"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ClipboardCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">
              Run a guided PQC readiness assessment
            </div>
          </div>
        </Link>
        <Link
          to="/timeline"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <CalendarRange size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Timeline</div>
            <div className="text-xs text-muted-foreground">
              Country-by-country regulatory timeline explorer
            </div>
          </div>
        </Link>
        <Link
          to="/learn/pqc-governance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Building2 size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Governance &amp; Policy</div>
            <div className="text-xs text-muted-foreground">
              RACI matrices, policies, and board reporting
            </div>
          </div>
        </Link>
        <Link
          to="/learn/standards-bodies"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Landmark size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Standards Bodies</div>
            <div className="text-xs text-muted-foreground">
              Who creates PQC standards, certifies products &amp; mandates compliance
            </div>
          </div>
        </Link>
      </div>
    </section>

    {/* CTA */}
    <div className="text-center">
      <Button variant="gradient" size="lg" onClick={onNavigateToWorkshop}>
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Map jurisdictions, build audit checklists, and construct compliance timelines.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      label: 'Compliance Landscape & Key Frameworks',
      content: <Step1LandscapeAndFrameworks />,
    },
    {
      label: 'Compliance vs Risk Approach & Major Deadlines',
      content: <Step2ApproachAndDeadlines />,
    },
    {
      label: 'Country Deadlines, Dependencies & Workshop',
      content: <Step3CountriesAndWorkshop onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
