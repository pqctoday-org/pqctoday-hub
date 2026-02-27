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
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
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
            <InlineTooltip term="Post-Quantum Cryptography">
              post-quantum cryptography
            </InlineTooltip>
            . For organizations operating across borders, navigating these overlapping and sometimes
            conflicting requirements is a critical challenge.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Federal agencies must identify and prioritize the migration of vulnerable
              cryptographic systems to quantum-resistant standards.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NSM-10, National Security Memorandum on Quantum Computing (2022)
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
                National Security Systems. Key deadlines: software/firmware signing by 2025,
                web/cloud/networking by 2030, legacy systems by 2033. Requires{' '}
                <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>-1024 (FIPS&nbsp;203) and{' '}
                <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>-87 (FIPS&nbsp;204) as minimum
                security levels.
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
                NIST&apos;s transition guidance for post-quantum cryptography standards. Recommends
                deprecating RSA and ECC by 2030 and disallowing them after 2035. Emphasizes
                cryptographic agility and hybrid approaches during the transition period.
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
        </div>
      </section>

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
              <div className="text-sm font-bold text-foreground mb-2">
                Compliance-First Approach
              </div>
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
                year: '2025',
                event: 'CNSA 2.0 software/firmware signing for NSS',
                source: 'NSA',
              },
              {
                year: '2024',
                event: 'NIST IR 8547 published — official PQC transition guidance',
                source: 'NIST',
              },
              {
                year: '2030',
                event: 'CNSA 2.0 web/cloud/networking; NIST RSA/ECC deprecated (NIST IR 8547)',
                source: 'NSA/NIST',
              },
              {
                year: '2030',
                event: 'ANSSI recommends full PQC migration for sensitive government systems',
                source: 'ANSSI (advisory)',
              },
              {
                year: '2033',
                event: 'CNSA 2.0 all legacy NSS systems',
                source: 'NSA',
              },
              {
                year: '2035',
                event: 'NIST RSA/ECC disallowed (NIST IR 8547)',
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

      {/* Section 5: Workshop Preview */}
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
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Map jurisdictions, build audit checklists, and construct compliance timelines.
        </p>
      </div>
    </div>
  )
}
