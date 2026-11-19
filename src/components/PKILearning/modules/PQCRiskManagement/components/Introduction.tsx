// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import {
  ShieldAlert,
  Clock,
  ClipboardList,
  Grid3X3,
  GitCompareArrows,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  Target,
  BookOpen,
  FlaskConical,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'
import { describeIndustryBreachBaseline } from '@/data/roiBaselines'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  // The data-section-id anchors below were already here and already
  // matched this module's manifest; nothing read them. One call makes
  // deep links land and section progress record.
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Quantum Computing Primer */}
      <section className="glass-panel p-4 border-primary/10">
        <p className="text-sm text-foreground/80">
          Quantum computers can offer substantial speedups for some mathematical problems; those
          speedups do not apply to every task. Most critically,{' '}
          <strong>Shor&apos;s algorithm</strong> &mdash; running on a sufficiently powerful quantum
          computer &mdash; can factor large integers and solve discrete logarithm problems in
          polynomial time, threatening RSA, finite-field Diffie-Hellman, and elliptic-curve uses in
          many deployed protocols and systems.
        </p>
      </section>

      {/* Section 1: Why PQC Risk Management? */}
      <section className="glass-panel p-6">
        <div data-section-id="crqc" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldAlert size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Why PQC Risk Management?</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A sufficiently capable{' '}
            <InlineTooltip term="CRQC">
              cryptographically relevant quantum computer (CRQC)
            </InlineTooltip>{' '}
            could break widely used public-key algorithms such as RSA, finite-field Diffie-Hellman,
            and elliptic-curve cryptography. Risk management provides a framework for assessing{' '}
            <em>when</em> this threat may become real, <em>what</em> assets are exposed, and{' '}
            <em>how</em> to prioritize migration efforts.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;This means that even if quantum computers are a decade away, organizations must
              begin the migration to post-quantum cryptography today to avoid having their
              cryptographically protected data exposed once quantum computers become operational in
              the future.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST IR 8547, Transition to Post-Quantum Cryptography Standards (final,
              October 2026).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Identify</div>
              <p className="text-xs text-muted-foreground">
                Discover every cryptographic asset in your organization and map quantum
                vulnerability exposure.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Quantify</div>
              <p className="text-xs text-muted-foreground">
                Assign likelihood and impact scores to each risk, calculate composite risk levels,
                and estimate exposure windows.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Prioritize</div>
              <p className="text-xs text-muted-foreground">
                Rank risks by severity, align with compliance deadlines, and allocate migration
                resources where they matter most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Key Concepts */}
      <section className="glass-panel p-6">
        <div data-section-id="register" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-secondary/10">
            <AlertTriangle size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Key Concepts</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            PQC risk management introduces several concepts specific to quantum-era threats.
            Understanding these is essential for building an effective risk register.
          </p>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-primary" />
                <div className="text-sm font-bold text-foreground">CRQC Timeline</div>
              </div>
              <p className="text-xs text-muted-foreground">
                A{' '}
                <InlineTooltip term="CRQC">
                  Cryptographically Relevant Quantum Computer
                </InlineTooltip>{' '}
                is one powerful enough to break <InlineTooltip term="RSA">RSA</InlineTooltip>,{' '}
                <InlineTooltip term="ECC">ECC</InlineTooltip>, and{' '}
                <InlineTooltip term="DH">Diffie-Hellman</InlineTooltip> key exchange. Quantum
                computers already exist; none published to date is cryptographically relevant, and
                the gap between the two is large. Published expert estimates for CRQC arrival vary
                widely &mdash; commonly spanning the 2030s and beyond &mdash; and they are opinion
                surveys, not measurements, so treat any single date as a planning assumption you
                choose rather than a forecast. Plan against the date you would regret being wrong
                about.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-status-warning" />
                <div className="text-sm font-bold text-foreground">
                  HNDL &mdash; Harvest Now, Decrypt Later
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <InlineTooltip term="HNDL">HNDL</InlineTooltip> attacks involve adversaries
                capturing encrypted sessions today with the intent to decrypt them later. The
                exposure depends on the session using quantum-vulnerable public-key key
                establishment, an adversary recording the ciphertext, and the session secrets being
                recoverable from that exchange. Long-lived sensitive data warrants assessment; this
                does not mean all stored records or encrypted traffic can be harvested and
                decrypted.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-status-error" />
                <div className="text-sm font-bold text-foreground">Risk Quantification</div>
              </div>
              <p className="text-xs text-muted-foreground">
                This worksheet multiplies editable <strong>Likelihood x Impact</strong> ratings from
                1&ndash;5 to produce a relative score from 1 to 25. Likelihood is an organizational
                planning judgment about the threat within an asset&apos;s protection lifetime, not a
                measured event probability or CRQC forecast. Impact records the assessed business,
                regulatory and reputational consequences; document the assumptions behind both
                ratings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2b: Algorithm-Specific Vulnerability Weighting */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-status-error/10">
            <AlertTriangle size={24} className="text-status-error" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Weight by Quantum Vulnerability, Not Classical Strength
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A common scoring mistake is to rank likelihood by an algorithm&apos;s <em>classical</em>{' '}
            strength. Against a <InlineTooltip term="CRQC">CRQC</InlineTooltip> that ranking
            inverts. Under <strong>Shor&apos;s algorithm</strong>, what matters is the public-key
            size and math family relative to the quantum resources needed to break it &mdash; not
            how many years a classical attacker would need.
          </p>
          <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
            <p className="text-sm text-foreground/90">
              Classical key sizes do not provide a reliable ranking of quantum migration urgency.
              RSA and elliptic-curve systems are both vulnerable to Shor&apos;s algorithm, but the
              affected operation, required protection lifetime, implementation resources, transition
              requirements and business consequences must be assessed before ranking individual
              assets.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-semibold text-muted-foreground">Algorithm</th>
                  <th className="py-2 px-3 font-semibold text-muted-foreground">
                    Looks-strong (classical)
                  </th>
                  <th className="py-2 pl-3 font-semibold text-status-error">
                    Quantum-vulnerability weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    algo: 'RSA-2048',
                    classical: 'Standard baseline',
                    quantum: 'Shor-vulnerable; assess the actual operation and protection lifetime',
                  },
                  {
                    algo: 'ECC-256 (P-256)',
                    classical: 'Appears far stronger than RSA-2048',
                    quantum:
                      'Shor-vulnerable; classical key-size comparisons do not set an arrival date',
                  },
                  {
                    algo: 'RSA-4096 / ECC-384',
                    classical: 'Stronger still',
                    quantum:
                      'Shor-vulnerable; larger parameters do not make it post-quantum secure',
                  },
                  {
                    algo: 'AES-256 (symmetric)',
                    classical: 'Strong',
                    quantum:
                      'Key-search reference — Category 5 for AES-256. About 2^128 sequential queries in the idealized model.',
                  },
                ].map((row) => (
                  <tr key={row.algo} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">
                      {row.algo}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{row.classical}</td>
                    <td className="py-2 pl-3 text-foreground/80">{row.quantum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Scoring rule: weight likelihood by{' '}
            <strong>the affected operation and quantum-vulnerable algorithm family</strong>, not
            classical key-strength alone. Rank assets using their protection lifetime, applicable
            requirements and consequences; symmetric key search and hash preimage search have
            different quantum analyses, while hash-collision search has a different bound again. Do
            not infer that doubling key length restores every symmetric or hash security objective.
            Source: NIST IR 8547 Table 1 and FIPS 203/204/205.
          </p>
        </div>
      </section>

      {/* Section 3: The Risk Management Process */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">The Risk Management Process</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            This workshop walks you through a structured four-step quantum risk management process:
          </p>
          <div className="space-y-2">
            {[
              {
                n: 1,
                t: 'CRQC Scenario Planning',
                d: 'Choose a hypothetical CRQC year to view modeled vulnerable algorithms, reference dates, and retention overlap; it is not a forecast or compliance assessment.',
                icon: Clock,
              },
              {
                n: 2,
                t: 'Risk Register Building',
                d: 'Record in-scope cryptographic assets with their assumed use, likelihood and impact ratings, and proposed mitigation.',
                icon: ClipboardList,
              },
              {
                n: 3,
                t: 'Risk Heatmap Visualization',
                d: 'Plot worksheet ratings on a 5x5 grid to compare relative priorities; the score does not set a migration deadline.',
                icon: Grid3X3,
              },
              {
                n: 4,
                t: 'Compliance Gap Analysis',
                d: 'Inspect algorithm-name patterns beside CNSA 2.0 and NIST IR 8547 reference dates; determine applicability and compliance separately.',
                icon: GitCompareArrows,
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

      {/* Section 4: Why This Matters for Executives */}
      <section className="glass-panel p-6">
        <div data-section-id="heatmap" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-secondary/10">
            <BarChart3 size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Executive Perspective</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            For CISOs and security leaders, quantum risk management is not a future concern &mdash;
            it&apos;s a present-day requirement. Regulatory bodies worldwide are setting transition
            timelines within their respective scopes, and the HNDL threat means long-lived sensitive
            data carried over quantum-vulnerable key establishment can already be exposed to capture
            today.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">Regulatory Pressure</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; NSA <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (National
                  Security Systems only; FAQ version 2.2, October 2026): new acquisitions from 1
                  January 2027, equipment and services that cannot support it phased out by 31
                  December 2030 absent an exception, and CNSA 2.0 algorithms mandated by 31 December
                  2031 unless otherwise noted. NSM-10&apos;s 2035 goal is separate; the CRQC
                  Scenario Planner shows each date with its scope and source
                </li>
                <li>
                  &bull; EO 14412 &amp; OMB M-26-15 (June 2026): U.S. federal civilian High Value
                  Assets and high-impact systems (excludes NSS; does not directly bind private
                  contractors until finalized in contract rules)
                </li>
                <li>
                  &bull; NIST IR 8547 (final, October 2026): quantum-vulnerable public-key
                  algorithms deprecated after 2030, disallowed under NIST standards and guidelines
                  after 2035
                </li>
                <li>
                  &bull; EU Coordinated Implementation Roadmap v1.1 (June 2025): advisory 2030
                  milestone for Member States&apos; national programmes; DORA and NIS2 impose cyber
                  risk-management duties rather than fixed PQC cutoff dates
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">Business Impact</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; The global average breach cost in IBM’s 2026 study was{' '}
                  <a
                    href={describeIndustryBreachBaseline('Other').source}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    $4.99 million USD
                  </a>
                  .
                </li>
                <li>&bull; Supply chain trust dependent on digital signatures</li>
                <li>&bull; Possible competitive advantage from early PQC adoption</li>
                <li>&bull; Insurance and audit implications</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/assess"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BarChart3 size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Risk Assessment</div>
              <div className="text-xs text-muted-foreground">
                Run a guided PQC readiness assessment
              </div>
            </div>
          </Link>
          <Link
            to="/threats"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Threat Landscape</div>
              <div className="text-xs text-muted-foreground">
                Explore quantum threats by industry and algorithm
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Architecture patterns for rapid algorithm migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/quantum-threats"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Threats</div>
              <div className="text-xs text-muted-foreground">
                Why quantum computing threatens current cryptography
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Model CRQC scenarios, build a risk register, and visualize your exposure on a heatmap.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
