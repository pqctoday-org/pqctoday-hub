// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
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
  Briefcase,
  Landmark,
  ShieldCheck,
  Gauge,
  Layers,
  ScrollText,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Why + RACI + Policy Hierarchy ────────────────────────────────────

const Step1WhyRaciPolicy: React.FC = () => (
  <div className="space-y-8 w-full">
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
                <p className="text-[10px] text-muted-foreground mt-1">{policy.scope}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Section 3b: The PQC Migration Charter */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ScrollText size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The PQC Migration Charter</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The charter is the founding authority document for the entire program. Without it, the
          Quantum Readiness Program Manager (QRPM) has no formal power to compel other business
          units, and budget requests get re-litigated at every phase gate. Framework 2.1 identifies
          insufficient mandate scope as the most common reason Phase 0 programs stall before Phase
          1.
        </p>
        <div className="text-sm font-bold text-foreground">
          Five elements every charter must contain
        </div>
        <div className="space-y-2">
          {[
            {
              n: '1. Signatories',
              d: 'Who signs determines who the charter can compel. CISO-only approval is advisory. CEO + CFO + CISO creates financial obligation and the authority to compel cross-BU cooperation.',
              warn: 'Weak: "CISO approved."',
              good: 'Strong: "Signed by CEO, CFO, and CISO."',
            },
            {
              n: '2. Scope',
              d: 'Named systems, subsidiaries, and geographies — plus explicit out-of-scope exclusions for this phase to prevent future disputes about what was covered.',
              warn: 'Weak: "All production systems."',
              good: 'Strong: "All systems handling Confidential or Regulated data in [regions], including third-party-hosted services. Out of scope: systems scheduled for retirement before [date]."',
            },
            {
              n: '3. Authority granted',
              d: 'What the QRPM can actually do without requiring a separate approval each time. Advisory language means every enforcement action stalls waiting for sign-off.',
              warn: 'Weak: "The QRPM should work with teams to ensure timely migration."',
              good: 'Strong: "The QRPM may require remediation plans and, with CISO approval, delay product launches that introduce non-PQC-ready cryptographic dependencies."',
            },
            {
              n: '4. Budget line',
              d: 'A named, ring-fenced program budget in the operating plan. Project-by-project approval forces re-justification at every phase gate and creates the risk of mid-program defunding.',
              warn: 'Weak: "Funding will be allocated as needed."',
              good: 'Strong: "Program budget of [$X] committed for [period], line item: PQC Migration Program, in the [Year] operating plan."',
            },
            {
              n: '5. Timeline commitment',
              d: 'At minimum, the Gate G1 review date and the overall program completion horizon tied to the binding regulatory deadline.',
              warn: 'Weak: "Migration will proceed as resources allow."',
              good: 'Strong: "Gate G1 review: [date]. Program completion target: [year], aligned to [regulatory deadline]."',
            },
          ].map((el, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
              <div className="text-xs font-bold text-primary">{el.n}</div>
              <p className="text-[11px] text-muted-foreground">{el.d}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                <div className="rounded p-2 bg-muted border border-border/80">
                  <p className="text-[10px] text-muted-foreground">{el.warn}</p>
                </div>
                <div className="rounded p-2 bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-foreground/80">{el.good}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-foreground/90">
            <strong>Framework 2.1 common failure:</strong> organizations reach Gate G1 with a signed
            email thread instead of a formal charter. The SteerCo has no documented authority,
            budget re-approval is required at each phase, and the first procurement dispute stalls
            the program for months.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Governance Models + Escalation + KPIs ───────────────────────────

const Step2ModelsEscalationKpis: React.FC = () => (
  <div className="space-y-8 w-full">
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
          <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
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
          <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
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
          <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
            <strong>Pros:</strong> Balance of control and agility
            <br />
            <strong>Cons:</strong> Requires clear decision-rights mapping
          </div>
        </div>
      </div>
    </section>

    {/* Section 4b: Roles, Workstreams & Three Lines of Defense */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          Roles, Workstreams &amp; Lines of Defense
        </h2>
      </div>
      <div className="space-y-5 text-sm text-foreground/80">
        <div>
          <div className="text-sm font-bold text-foreground mb-2">The four core roles</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                r: 'Executive Sponsor',
                d: 'CISO or CIO — visible owner, clears roadblocks, briefs the board quarterly. Reports to the Board / Risk Committee.',
              },
              {
                r: 'Steering Committee (SteerCo)',
                d: 'Cross-functional: Security, Enterprise Architecture, AppDev, Infra/NetSec, PKI/Identity, Compliance/Legal, Procurement, and Business-Unit reps. Reports monthly to the Sponsor.',
              },
              {
                r: 'Quantum Readiness Program Manager (QRPM)',
                d: 'Day-to-day leader — runs the plan, risk log, and KPIs. Reports weekly to the SteerCo lead.',
              },
              {
                r: 'Workstream Leads',
                d: 'One per domain — execute the phase activities and report weekly to the QRPM.',
              },
            ].map((x, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-primary mb-0.5">{x.r}</div>
                <p className="text-[11px] text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/80 mt-2">
            <strong>Decision cadence:</strong> weekly PMO &middot; monthly SteerCo &middot;
            quarterly Board / Risk Committee. The CISO should lead in most organizations — PQC
            migration is a security risk response, not a technology refresh.
          </p>
        </div>

        <div>
          <div className="text-sm font-bold text-foreground mb-2">The eight workstreams</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              'Inventory & Discovery (Crypto-BOM ownership)',
              'Network & TLS/VPN (hybrid rollouts)',
              'PKI & Code Signing (roots, issuers, toolchains)',
              'Applications & Platforms (libraries, service mesh, cloud)',
              'Embedded / IoT / OT (gateways, compensating controls)',
              'Policy / Compliance / Procurement (standards, clauses)',
              'Vendor Orchestration (roadmaps, SLAs)',
              'Education & Change Management (training, comms)',
            ].map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-muted/50 rounded-lg p-2 border border-border"
              >
                <span className="text-[11px] font-bold text-primary shrink-0 w-4 text-center">
                  {i + 1}
                </span>
                <span className="text-[11px] text-muted-foreground">{w}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-primary" />
            <div className="text-sm font-bold text-foreground">Three lines of defense</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              {
                l: 'First line',
                d: 'Owns and executes — workstream leads and system owners running the migration.',
              },
              {
                l: 'Second line',
                d: 'Governs — CISO, risk, and compliance functions. The QRPM sits here, setting policy and the risk-appetite framing.',
              },
              {
                l: 'Third line',
                d: 'Assures — internal audit provides independent assurance over the program.',
              },
            ].map((x, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-foreground mb-0.5">{x.l}</div>
                <p className="text-[11px] text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/80 mt-2">
            The critical SOC/GRC handoff is the cryptographic inventory — a shared,
            machine-readable, SIEM-integrated asset that both the SOC (threat detection) and GRC
            (evidence, KRIs) depend on.
          </p>
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
              level: 'Tier 1: Team Lead',
              desc: 'Technical disagreements resolved by the Crypto Engineering Lead (e.g., algorithm selection, test environment blockers, minor schedule slippage under 2 weeks). Timeframe: 5 business days.',
            },
            {
              level: 'Tier 2: PQC Program Manager',
              desc: 'Cross-team dependencies, vendor delivery misses, budget variance over 10%, or policy exception requests escalated to the PQC Program Manager. Timeframe: 10 business days.',
            },
            {
              level: 'Tier 3: CISO',
              desc: 'Regulatory deadlines at risk, critical production migration blockers, vendor non-compliance, or risk acceptance requests for high-severity gaps escalated to the Chief Information Security Officer. Timeframe: 15 business days.',
            },
            {
              level: 'Tier 4: Executive Steering Committee',
              desc: 'Program-wide compliance misses, board-level risk exposure, or regulatory enforcement action escalated to the Executive Steering Committee (CTO / CRO / CFO) — the terminal tier, with no further escalation path. Timeframe: 30 business days.',
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

    {/* Section 5b: Board Oversight & Risk Appetite */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Landmark size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Board Oversight &amp; Risk Appetite</h2>
      </div>
      <div className="space-y-5 text-sm text-foreground/80">
        <div>
          <div className="text-sm font-bold text-foreground mb-2">
            Board oversight runs through the existing risk/audit committee
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                t: 'Initial briefing',
                d: '60–90 minutes, once, during Phase 0 — establish the mandate and the risk framing.',
              },
              {
                t: 'Quarterly KPI review',
                d: '15–20 minutes — the five board KPIs: Coverage, Trust, Inventory, Vendors, Agility.',
              },
              {
                t: 'Annual risk-appetite review',
                d: 'Re-confirm tolerances as the threat horizon and standards evolve.',
              },
              {
                t: 'Escalation triggers',
                d: 'Material CRQC-timeline change, program >6 months behind the regulatory buffer, a confirmed vulnerability in a deployed PQC algorithm, or a Tier-1 vendor abandoning PQC without an alternative.',
              },
            ].map((x, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-primary mb-0.5">{x.t}</div>
                <p className="text-[11px] text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={16} className="text-primary" />
            <div className="text-sm font-bold text-foreground">
              Risk appetite — illustrative tolerances
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              {
                k: 'HNDL',
                v: '≤20% of data with a >10-year secrecy requirement may remain quantum-vulnerable by end of 2027; 0% by end of 2029.',
              },
              {
                k: 'TNFL',
                v: 'All production software/firmware signing uses NIST-approved quantum-resistant signatures by end of 2027; all CA signing keys PQC-capable by end of 2029.',
              },
              {
                k: 'Regulatory',
                v: 'Compliance achieved ≥12 months before each binding deadline.',
              },
              {
                k: 'Crypto-agility',
                v: 'Mandatory for all systems deployed from Q3 2026 onward.',
              },
            ].map((x, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
              >
                <span className="text-[11px] font-bold text-primary shrink-0 w-20">{x.k}</span>
                <span className="text-[11px] text-muted-foreground">{x.v}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Illustrative figures — calibrate to your sector, jurisdiction, and confidentiality
            horizons. The GRC function owns the risk-appetite statement and the KRI framework.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: Resources + CTA ─────────────────────────────────────────────────

const Step3ResourcesAndCta: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
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
        <Link
          to="/learn/pqc-business-case"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Briefcase size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Business Case</div>
            <div className="text-xs text-muted-foreground">
              Build executive-ready justification for PQC investment
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
              Who creates PQC standards, certifies products, and mandates compliance
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
      id: 'model',
      label: 'Governance & RACI',
      content: <Step1WhyRaciPolicy />,
    },
    {
      id: 'policy',
      label: 'Governance Models',
      content: <Step2ModelsEscalationKpis />,
    },
    {
      id: 'kpi',
      label: 'Resources & Workshop',
      content: <Step3ResourcesAndCta onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
