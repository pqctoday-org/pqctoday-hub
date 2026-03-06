// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Scale,
  Network,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Why + RACI + Policy Hierarchy ────────────────────────────────────

const Step1WhyRaciPolicy: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Section 1: Why PQC Governance? */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Why PQC Governance Matters</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The transition to{' '}
          <InlineTooltip term="Post-Quantum Cryptography">post-quantum cryptography</InlineTooltip>{' '}
          is not just a technical upgrade &mdash; it&apos;s an enterprise-wide transformation that
          touches every system, vendor, and compliance obligation. Without formal governance,
          organizations risk fragmented migration efforts, missed deadlines, and security gaps.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-sm text-foreground/90">
            OMB Memorandum M-23-02 directs federal agencies to establish governance structures with
            clear roles, responsibilities, and executive sponsorship for their cryptographic
            transition to post-quantum algorithms &mdash; a model that applies equally to
            private-sector organizations managing complex PQC migrations.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; OMB M-23-02, Migrating to Post-Quantum Cryptography (2022)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Coordination</div>
            <p className="text-xs text-muted-foreground">
              Align security, engineering, compliance, and procurement teams on a unified migration
              roadmap.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Accountability</div>
            <p className="text-xs text-muted-foreground">
              Clear ownership of decisions &mdash; who selects algorithms, who approves exceptions,
              who tracks compliance.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Consistency</div>
            <p className="text-xs text-muted-foreground">
              Enterprise-wide cryptographic standards prevent teams from making conflicting
              algorithm and library choices.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 2: RACI for PQC Migration */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Users size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">RACI: Roles &amp; Responsibilities</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A <strong>RACI matrix</strong> (Responsible, Accountable, Consulted, Informed) is the
          standard tool for mapping governance roles to migration activities. Every PQC program
          needs clarity on who does the work, who owns the decision, who provides input, and who
          needs to know.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-primary mb-1">R</div>
            <div className="text-xs font-bold text-foreground">Responsible</div>
            <p className="text-[10px] text-muted-foreground mt-1">Does the work</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-accent mb-1">A</div>
            <div className="text-xs font-bold text-foreground">Accountable</div>
            <p className="text-[10px] text-muted-foreground mt-1">Owns the decision</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-status-warning mb-1">C</div>
            <div className="text-xs font-bold text-foreground">Consulted</div>
            <p className="text-[10px] text-muted-foreground mt-1">Provides input</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-muted-foreground mb-1">I</div>
            <div className="text-xs font-bold text-foreground">Informed</div>
            <p className="text-[10px] text-muted-foreground mt-1">Kept in the loop</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          <strong>Key rule:</strong> Each activity should have exactly one &quot;A&quot;
          (Accountable) to avoid diffusion of responsibility. Multiple &quot;R&quot; and
          &quot;C&quot; assignments are common for cross-functional work.
        </p>
      </div>
    </section>

    {/* Section 3: Policy Hierarchy */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Policy Hierarchy</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          PQC governance requires a layered policy framework. Each layer provides increasing
          specificity, from enterprise-wide principles to team-level procedures.
        </p>
        <div className="space-y-2">
          {[
            {
              level: 'Enterprise Cryptographic Policy',
              desc: 'High-level principles: approved algorithms, prohibited algorithms, exception process, compliance obligations.',
              scope: 'Approved by CISO / Board',
            },
            {
              level: 'Key Management Policy',
              desc: 'Key lifecycle rules: generation, storage, rotation, destruction. HSM requirements. PQC key sizes and parameters.',
              scope: 'Approved by CISO / CTO',
            },
            {
              level: 'Vendor Crypto Requirements',
              desc: 'What cryptographic capabilities vendors must demonstrate. PQC readiness criteria for procurement.',
              scope: 'Approved by Procurement / CISO',
            },
            {
              level: 'Migration Timeline Policy',
              desc: 'Deadlines for each migration phase, system prioritization criteria, hybrid deployment requirements.',
              scope: 'Approved by CTO / CISO',
            },
          ].map((policy, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-bold text-primary shrink-0 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{policy.level}</div>
                <p className="text-xs text-muted-foreground">{policy.desc}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{policy.scope}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Governance Models + Escalation + KPIs ───────────────────────────

const Step2ModelsEscalationKpis: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Section 4: Governance Models */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Network size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Governance Models</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <Building2 size={16} />
            </div>
            <div className="text-sm font-bold text-foreground">Centralized</div>
          </div>
          <p className="text-xs text-muted-foreground mb-3 flex-grow">
            A single crypto governance team sets all policies, selects algorithms, and manages
            migration. Best for smaller organizations or those with a strong central security
            function.
          </p>
          <div className="text-[10px] text-muted-foreground/70 border-t border-border pt-2">
            <strong>Pros:</strong> Consistent standards, faster decisions
            <br />
            <strong>Cons:</strong> May not account for BU-specific needs
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-secondary/10 text-secondary">
              <Network size={16} />
            </div>
            <div className="text-sm font-bold text-foreground">Federated</div>
          </div>
          <p className="text-xs text-muted-foreground mb-3 flex-grow">
            Each business unit or region manages its own PQC transition within guardrails.
            Governance board sets boundaries but delegates execution. Common in regulated
            multi-nationals.
          </p>
          <div className="text-[10px] text-muted-foreground/70 border-t border-border pt-2">
            <strong>Pros:</strong> Local autonomy, compliance flexibility
            <br />
            <strong>Cons:</strong> Risk of inconsistency, slower alignment
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-accent/10 text-accent">
              <Scale size={16} />
            </div>
            <div className="text-sm font-bold text-foreground">Hybrid</div>
          </div>
          <p className="text-xs text-muted-foreground mb-3 flex-grow">
            Central team owns algorithm policy and compliance mapping. Business units own migration
            execution and testing. Most common model for large enterprises migrating to{' '}
            <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip>.
          </p>
          <div className="text-[10px] text-muted-foreground/70 border-t border-border pt-2">
            <strong>Pros:</strong> Balance of control and agility
            <br />
            <strong>Cons:</strong> Requires clear decision-rights mapping
          </div>
        </div>
      </div>
    </section>

    {/* Section 4.5: Escalation & Conflict Resolution */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ArrowUpRight size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Escalation &amp; Conflict Resolution</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          PQC migration inevitably creates conflicts: business units resist migration timelines,
          vendors miss readiness deadlines, and teams disagree on algorithm choices. A defined
          escalation path prevents these conflicts from stalling the program.
        </p>
        <div className="space-y-2">
          {[
            {
              level: 'Level 1: Working Group Resolution',
              desc: 'Technical disagreements resolved within the PQC working group (e.g., algorithm selection, testing methodology). Timeframe: 5 business days.',
            },
            {
              level: 'Level 2: Steering Committee',
              desc: 'Cross-functional conflicts (timeline vs. resource constraints, vendor exceptions) escalated to the PQC steering committee. Timeframe: 10 business days.',
            },
            {
              level: 'Level 3: Executive Sponsor (CISO/CTO)',
              desc: 'Unresolved steering committee issues or budget-impacting decisions escalated to executive sponsor. Timeframe: 5 business days.',
            },
            {
              level: 'Level 4: Board / Risk Committee',
              desc: 'Enterprise-level risk acceptance decisions (e.g., accepting quantum vulnerability for a critical system beyond deadline). Requires formal risk acceptance documentation.',
            },
          ].map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-bold text-primary shrink-0 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{step.level}</div>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Section 5: KPI Tracking */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Measuring Progress: KPIs</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Governance without measurement is aspirational. The governance layer tracks KPIs that
          reflect <em>how well the program is governed</em> &mdash; policy health, accountability,
          and organizational readiness. For operational migration progress KPIs (systems migrated %,
          budget utilization, phase completion dates), see{' '}
          <Link to="/learn/migration-program" className="text-primary hover:underline">
            Migration Program Management
          </Link>
          .
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">
              Policy &amp; Accountability KPIs
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Policy coverage rate (% of systems under documented PQC policy)</li>
              <li>&bull; Active exception count (# of open policy exceptions)</li>
              <li>&bull; Board reporting cadence (on schedule: yes / no)</li>
              <li>&bull; Training completion rate</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">
              Supply Chain &amp; Compliance KPIs
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Vendor PQC readiness score (weighted across supply chain)</li>
              <li>&bull; Compliance gap closure rate</li>
              <li>&bull; % of vendors with signed PQC migration commitments</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: Resources + CTA ─────────────────────────────────────────────────

const Step3ResourcesAndCta: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Related Resources */}
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          to="/compliance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <BookOpen size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
            <div className="text-xs text-muted-foreground">
              NIST, <InlineTooltip term="ANSSI">ANSSI</InlineTooltip>, and{' '}
              <InlineTooltip term="BSI">BSI</InlineTooltip> compliance requirements
            </div>
          </div>
        </Link>
        <Link
          to="/learn/crypto-agility"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Shield size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Crypto Agility</div>
            <div className="text-xs text-muted-foreground">
              Architecture patterns for algorithm-agile systems
            </div>
          </div>
        </Link>
        <Link
          to="/learn/pqc-risk-management"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <BarChart3 size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
            <div className="text-xs text-muted-foreground">
              Quantify quantum risk and build risk registers
            </div>
          </div>
        </Link>
      </div>
    </section>

    {/* CTA */}
    <div className="text-center">
      <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Build a RACI matrix, generate PQC policies, and design a governance KPI dashboard.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      label: 'Why Governance, RACI & Policy Hierarchy',
      content: <Step1WhyRaciPolicy />,
    },
    {
      label: 'Governance Models, Escalation & KPIs',
      content: <Step2ModelsEscalationKpis />,
    },
    {
      label: 'Resources & Workshop',
      content: <Step3ResourcesAndCta onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
