// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import { Briefcase, Clock, Scale, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Opening statement */}
      <section className="glass-panel p-4 border-primary/10">
        <p className="text-sm text-foreground/80">
          The quantum computing revolution is not a distant possibility &mdash; it is an active
          threat requiring executive action today.{' '}
          <InlineTooltip term="HNDL">Harvest Now, Decrypt Later</InlineTooltip> attacks mean that
          data intercepted today can be decrypted once quantum computers mature, potentially
          exposing strategic plans, financial data, and intellectual property years from now.
        </p>
      </section>

      {/* Section 1: The Executive Quantum Challenge */}
      <section className="glass-panel p-6">
        <div data-section-id="why-it-matters" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <Briefcase size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">The Executive Quantum Challenge</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            As an executive or GRC leader, the quantum threat impacts you differently than it does
            engineers or architects. Your responsibility is not to implement cryptographic changes
            &mdash; it is to ensure the organization is{' '}
            <strong>prepared, funded, governed, and accountable</strong> for a multi-year
            cryptographic transition.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Fiduciary Duty</div>
              <p className="text-xs text-muted-foreground">
                Boards oversee material cyber risk. Quantum risk is now publicly documented, so it
                belongs in that oversight; what it means for directors legally depends on
                jurisdiction.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Regulatory Pressure</div>
              <p className="text-xs text-muted-foreground">
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (US national security
                systems) and EO 14412 (US federal civilian systems) set dated PQC milestones; the EU
                PQC roadmap targets 2030 and 2035. NIS2 and DORA add cyber risk-management duties,
                not PQC deadlines.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Strategic Risk</div>
              <p className="text-xs text-muted-foreground">
                Competitors gaining PQC readiness first may win contracts, customer trust, and
                regulatory standing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why Now? */}
      <section className="glass-panel p-6">
        <div data-section-id="what-to-learn" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-status-warning/10">
            <Clock size={24} className="text-status-warning" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Why Now?</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The timeline is tighter than most executives realize. NIST finalized its first
            post-quantum standards in August 2024, and regulatory bodies worldwide are already
            setting compliance deadlines:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground/90">
              PQC Today summary: migration takes years, while long-lived encrypted data may be
              collected now for future decryption. Planning therefore needs to begin before a
              cryptographically relevant quantum computer exists.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Source: NIST IR 8547, <em>Transition to Post-Quantum Cryptography Standards</em>
              (final, October 2026).
            </p>
          </div>
          <p>
            Two separate US clocks run in parallel, and boards routinely conflate them. CNSA 2.0
            governs <em>National Security Systems</em>. Executive Order 14412, &ldquo;Securing the
            Nation Against Advanced Cryptographic Attacks&rdquo; (signed 22 June 2026), governs
            federal <em>civilian</em> systems and the contractors that serve them — with OMB
            Memorandum M-26-15 (24 June 2026) as its implementing guidance. If you sell to the US
            government, the second clock is the one that reaches you.
          </p>
          <ul className="space-y-2 list-none">
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>Dec 2026 (180 days after EO 14412):</strong> the order directs the FAR
                Council to publish a proposed rule requiring covered federal contractors to meet
                NIST FIPS standards—including all applicable FIPS that incorporate PQC-compliant
                algorithms—by December 31, 2030. M-26-15 required agency PQC migration plans at OMB
                within 120 days of issue
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>2030:</strong> EO 14412 — federal High Value Assets and high-impact systems,
                and covered contractors, on PQC for <em>key establishment</em> (ML-KEM, FIPS 203) by
                31 December 2030
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>2031:</strong> EO 14412 — the same systems on PQC for{' '}
                <em>digital signatures</em> by 31 December 2031. The split is deliberate: key
                establishment carries the harvest-now-decrypt-later risk, so it moves first
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>2030:</strong> CNSA 2.0 (NSS): NSA&apos;s timetable anticipates exclusive
                use of CNSA 2.0 for software/firmware signing and networking equipment (VPNs,
                routers) by 2030
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" />
              <span>
                <strong>2031:</strong> CNSA 2.0 algorithms mandated for NSS unless otherwise noted
                under FAQ version 2.2
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                <strong>2035:</strong> NSM-10 sets a broader federal quantum-risk objective.
                Separately, NIST IR 8547 (final, October 2026) disallows quantum-vulnerable
                public-key algorithms under NIST standards after 2035 — neither is a global sunset
                of RSA and ECC
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: What You Will Learn */}
      <section className="glass-panel p-6">
        <div data-section-id="how-to-act" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">What This Module Covers</h2>
        </div>
        <div className="space-y-3 text-sm text-foreground/80">
          <p>
            This 30-minute module is designed specifically for executives and GRC leaders. The
            interactive workshop guides you through four steps:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-error mb-1">Step 1: Why It Matters</div>
              <p className="text-xs text-muted-foreground">
                Review six decision drivers and distinguish source-backed facts from scenarios and
                questions to verify.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-warning mb-1">
                Step 2: What to Learn
              </div>
              <p className="text-xs text-muted-foreground">
                Identify your knowledge gaps and build a personalized learning path across the
                modules most relevant to your role.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Step 4: Scope Your Evidence</div>
              <p className="text-xs text-muted-foreground">
                Answer Yes, No, or Unknown to identify applicable drivers and evidence requests
                without turning unanswered questions into a low-risk score.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-success mb-1">Step 3: How to Act</div>
              <p className="text-xs text-muted-foreground">
                Build a phased action plan with concrete milestones from this week to six months
                out. Export it as a Markdown document.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/pqc-risk-management"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
              <div className="text-xs text-muted-foreground">
                Build risk registers and executive heatmaps
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-business-case"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <TrendingUp size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Business Case</div>
              <div className="text-xs text-muted-foreground">
                ROI models and board-level presentations
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-governance"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Scale size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Governance</div>
              <div className="text-xs text-muted-foreground">
                Governance frameworks and executive policies
              </div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Briefcase size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">
                Multi-jurisdiction regulatory requirements
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Workshop CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Ready to assess your quantum exposure?
          </h3>
          <p className="text-sm text-muted-foreground">
            The interactive workshop takes about 30 minutes to complete.
          </p>
        </div>
        <Button variant="gradient" size="lg" onClick={onNavigateToWorkshop}>
          Go to Workshop &rarr;
        </Button>
      </div>

      <ReadingCompleteButton />
    </div>
  )
}
