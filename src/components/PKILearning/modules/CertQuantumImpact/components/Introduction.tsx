// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import { ShieldCheck, Clock, Scale, FlaskConical, AlertTriangle, FileCheck2 } from 'lucide-react'
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
          For certification and validation engineers, the post-quantum transition is an immediate
          evidence and lead-time challenge.{' '}
          <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> module submissions,{' '}
          <InlineTooltip term="ACVP">ACVP</InlineTooltip> algorithm testing for{' '}
          <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>,{' '}
          <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>, and{' '}
          <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>, entropy source validation (ESV),
          and regional schemes such as <InlineTooltip term="EUCC">EUCC</InlineTooltip> and NIAP
          Policy #33 each enforce distinct boundaries and multi-quarter queues.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Educational scope:</strong> This module teaches certification scoping, evidence
          verification, and scheme-boundary reasoning using fictional examples. Completing exercises
          here does not perform CSTL/ITSEF testing or validate a production cryptographic module.
        </p>
      </section>

      {/* Section 1: The Certification Engineer's PQC Challenge */}
      <section className="glass-panel p-6">
        <div data-section-id="why-it-matters" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            The Certification Engineer&rsquo;s PQC Challenge
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Whether you work in an accredited testing laboratory (CSTL / ITSEF), on a cryptographic
            module vendor&rsquo;s validation team, or as a scheme/procurement reviewer, your job is
            not simply to ship PQC code &mdash; it is to ensure that{' '}
            <strong>
              module boundaries, test harnesses, entropy packages, and certificate claims
            </strong>{' '}
            withstand formal scrutiny.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">ACVP vs. CMVP Discipline</div>
              <p className="text-xs text-muted-foreground">
                An <InlineTooltip term="ACVP">ACVP</InlineTooltip> certificate proves algorithm
                vector conformance on a specific operating environment; it never substitutes for an
                active <InlineTooltip term="CMVP">CMVP</InlineTooltip> FIPS 140-3 module Security
                Policy.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                PQC Harnesses &amp; Self-Tests
              </div>
              <p className="text-xs text-muted-foreground">
                ML-KEM, ML-DSA, and SLH-DSA require deterministic seed-driven AFT{' '}
                <code>keyGen</code> harnesses, IG 10.3.A CAST/PCT self-tests, and active SP
                800-90B/90C ESV entropy certificates.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Multi-Scheme Boundaries</div>
              <p className="text-xs text-muted-foreground">
                <InlineTooltip term="Common Criteria">Common Criteria</InlineTooltip> /{' '}
                <InlineTooltip term="EUCC">EUCC</InlineTooltip>, NIAP Policy #33, and PCI PTS HSM
                v5.0 vs. PCI DSS v4.0.1 enforce separate evidence rules that cannot be collapsed
                into one certificate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why Now? Key Validation & Regulatory Clocks */}
      <section className="glass-panel p-6">
        <div data-section-id="what-to-learn" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-status-warning/10">
            <Clock size={24} className="text-status-warning" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Why Now? Validation &amp; Policy Clocks
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Certification queues often span 12&ndash;24 months from lab engagement to active
            listing. Because multiple scheme and regulatory clocks are now active simultaneously,
            engineering teams that wait until a customer mandate arrives will miss the submission
            window:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground/90">
              PQC Today summary: FIPS 140-2 certificates moved to the CMVP Historical List in
              September 2026, NIST finalized SP 800-90C in September 2025 and NIST IR 8547 in
              October 2026, and scoped NSS and federal civilian mandates now set concrete
              2027&ndash;2031 gates.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Sources: NIST CMVP FIPS 140-2 to 140-3 Transition Timeline; NIST IR 8547 (final,
              October 2026); NSA CNSA 2.0 FAQ v2.2 (October 2026); EO 14412 &amp; OMB M-26-15 (June
              2026).
            </p>
          </div>
          <ul className="space-y-2 list-none">
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>21 September 2026 (CMVP):</strong> Active FIPS 140-2 certificates
                transitioned to the CMVP Historical List. New federal procurements and PQC module
                additions require FIPS 140-3 validation with an active SP 800-90B ESV entropy
                certificate.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>1 January 2027 (NSS / NIAP):</strong>{' '}
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> FAQ v2.2 requires CNSA 2.0
                algorithm support in new US National Security System acquisitions; NIAP CCEVS Policy
                Letter #33 enforces aligned Protection Profile cut-offs.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>31 December 2030 (Dual US clocks &amp; NIST IR 8547):</strong> EO 14412 /
                OMB M-26-15 requires US federal civilian HVAs and high-impact systems to move key
                establishment to PQC (ML-KEM, FIPS 203); CNSA 2.0 FAQ v2.2 phases out unsupported
                NSS equipment; and NIST IR 8547 deprecates quantum-vulnerable public-key algorithms.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" />
              <span>
                <strong>31 December 2031 (US signatures &amp; NSS mandate):</strong> EO 14412 / OMB
                M-26-15 requires federal civilian HVAs and high-impact systems on PQC for digital
                signatures; CNSA 2.0 FAQ v2.2 mandates CNSA 2.0 algorithms for NSS unless otherwise
                noted.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                <strong>After 2035 (NIST IR 8547):</strong> Final NIST IR 8547 (October 2026)
                disallows quantum-vulnerable public-key algorithms under NIST standards after 2035.
                Separately, EUCC (CIR (EU) 2024/482) and PCI PTS HSM v5.0 / PCI DSS v4.0.1 follow
                their own scheme governance and must be tracked independently.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: What This Module Covers */}
      <section className="glass-panel p-6">
        <div data-section-id="how-to-act" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">What This Module Covers</h2>
        </div>
        <div className="space-y-3 text-sm text-foreground/80">
          <p>
            This 25-minute role guide is designed for CSTL/ITSEF testers, module vendor validation
            engineers, and scheme reviewers. The interactive workshop walks through four steps:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-error mb-1">Step 1: Why It Matters</div>
              <p className="text-xs text-muted-foreground">
                Examine six certification-engineering impacts spanning CMVP queues, ACVP/IG 10.3.A,
                ESV, EUCC/NIAP, PCI boundaries, and claim conflation.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-warning mb-1">
                Step 2: What to Learn
              </div>
              <p className="text-xs text-muted-foreground">
                Map your validation skill gaps to deep-dive Hub modules covering FIPS 140-3, ACVP,
                entropy (ESV), EUCC, PCI, and <InlineTooltip term="CBOM">CBOM</InlineTooltip>.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-success mb-1">Step 3: How to Act</div>
              <p className="text-xs text-muted-foreground">
                Build a phased validation-readiness plan from immediate certificate audits through
                6-month CBOM-linked lifecycle tracking.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                Step 4: Certification Evidence Scope
              </div>
              <p className="text-xs text-muted-foreground">
                Answer Yes, No, or Unknown across nine validation criteria to surface applicable
                drivers and missing evidence without inventing a low-risk score.
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
            to="/learn/crypto-product-certification"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ShieldCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                Cryptographic Product Certification
              </div>
              <div className="text-xs text-muted-foreground">
                Standards, evaluation criteria, and certification schemes
              </div>
            </div>
          </Link>
          <Link
            to="/learn/fips-140-3-certification"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FileCheck2 size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">FIPS 140-3 Certification</div>
              <div className="text-xs text-muted-foreground">
                CMVP boundaries, MIP queue, ESV, and submission routes
              </div>
            </div>
          </Link>
          <Link
            to="/learn/acvp-lab-workflow"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">ACVP Lab Workflow</div>
              <div className="text-xs text-muted-foreground">
                PQC vector sets, seed-driven AFT keyGen, and harness discipline
              </div>
            </div>
          </Link>
          <Link
            to="/learn/cc-eucc-certification"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Scale size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Common Criteria &amp; EUCC</div>
              <div className="text-xs text-muted-foreground">
                EUCC ACM v2, eIDAS QSCDs, and NIAP Policy #33
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Workshop CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Ready to scope your certification evidence?
          </h3>
          <p className="text-sm text-muted-foreground">
            The interactive workshop takes about 25 minutes to complete.
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
