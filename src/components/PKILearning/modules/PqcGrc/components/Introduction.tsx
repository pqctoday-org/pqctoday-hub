// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Gauge,
  Scale,
  Radar,
  GitMerge,
  ShieldCheck,
  Megaphone,
  ArrowRight,
  ClipboardCheck,
  Landmark,
  Network,
  BarChart3,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import {
  KRI_LEVELS,
  KRIS,
  STRATEGIC_APPETITE,
  RISK_TOLERANCES,
  REG_CLASSIFICATIONS,
  GRC_SOC_OUTPUTS,
  VENDOR_TIERS,
  AUDIT_TIMELINE,
  CRISIS_COMMS_TEMPLATES,
  type KriLevel,
} from '../data/grcData'

const LEVEL_ORDER: KriLevel[] = ['board', 'ciso', 'operational']

const LEVEL_ACCENT: Record<KriLevel, string> = {
  board: 'text-primary',
  ciso: 'text-secondary',
  operational: 'text-accent',
}

// ─── Section 1: Why GRC + KRI cascade ────────────────────────────────────────

const Step1WhyAndCascade: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Gauge size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          Why Quantum Risk Breaks the ERM Playbook
        </h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Where the SOC <strong>detects and responds</strong>, the{' '}
          <InlineTooltip term="Governance, Risk, and Compliance">GRC</InlineTooltip> function{' '}
          <strong>measures, reports, and governs</strong>. It produces the instruments the board
          uses to oversee the program, the CISO uses to manage it, and internal audit uses to verify
          it.
        </p>
        <p>
          Standard enterprise risk management assumes observable precursors, historical frequency,
          and bounded timelines. Quantum risk has none: CRQC estimates span 10 to 30+ years, there
          are no historical incidents to calibrate against, and the risk straddles technology,
          compliance, strategic, and operational categories at once. Logging it as &quot;Low
          likelihood / High impact, review annually&quot; is risk <em>acknowledgment</em>, not risk{' '}
          <em>management</em>.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-sm text-foreground/90">
            The fix is not a separate quantum-risk framework. It is adapting the existing ERM
            framework so quantum risk receives the same structured treatment — risk-appetite
            statement, KRIs, escalation thresholds, board cadence — as every other top-tier risk.
          </p>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <BarChart3 size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">KRIs: The Three-Level Cascade</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Key Risk Indicators make governance operational. For PQC migration they cascade across
          three organizational levels — each serving a different audience at a different cadence.
          Every KRI carries a threshold that triggers a <em>specific</em> action; an indicator with
          no trigger is a chart, not a control.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {LEVEL_ORDER.map((level) => {
            const meta = KRI_LEVELS[level]
            const kris = KRIS.filter((k) => k.level === level)
            return (
              <div
                key={level}
                className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col"
              >
                <div className={`text-sm font-bold ${LEVEL_ACCENT[level]}`}>{meta.label}</div>
                <div className="text-[10px] text-muted-foreground mb-2">
                  {meta.audience} &mdash; {meta.cadence}
                </div>
                <p className="text-xs text-muted-foreground italic mb-3">{meta.question}</p>
                <ul className="text-xs text-foreground/80 space-y-1.5">
                  {kris.map((k) => (
                    <li key={k.id} className="border-t border-border pt-1.5">
                      <span className="font-medium text-foreground">{k.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{k.threshold}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  </div>
)

// ─── Section 2: Risk appetite + regulatory horizon ───────────────────────────

const Step2AppetiteAndHorizon: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Scale size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Risk Appetite &amp; Tolerance</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A quantum risk-appetite statement translates the board&apos;s intent into decision
          criteria the program can act on. Without it, every trade-off between migrating a costly
          legacy system and deferring it must be escalated, because no instrument defines which
          choice aligns with the board&apos;s intent. The statement operates at two levels.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <div className="text-xs font-bold text-primary mb-1">
            Strategic level (board language)
          </div>
          <p className="text-sm text-foreground/90 italic">&ldquo;{STRATEGIC_APPETITE}&rdquo;</p>
        </div>
        <div className="text-xs font-bold text-foreground">
          Operational tolerances (program language)
        </div>
        <div className="space-y-2">
          {RISK_TOLERANCES.map((t) => (
            <div key={t.id} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-medium text-foreground">{t.dimension}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{t.statement}</p>
              {t.target && <p className="text-[11px] text-primary/80 mt-1">{t.target}</p>}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          These thresholds are illustrative — the right values depend on sector, regulatory
          environment, data profile, and risk culture. The requirement is that they exist, are
          specific enough to drive decisions, and are reviewed annually at board level.
        </p>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Radar size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          Regulatory Intelligence: The Quarterly Horizon Report
        </h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          PQC regulation is moving faster than most GRC teams appreciate. Annual review is too
          infrequent; <strong>quarterly is the minimum</strong>, and monthly is more appropriate in
          regulated sectors. The output is a quarterly <strong>Regulatory Horizon Report</strong> to
          the Steering Committee and risk committee, listing each development&apos;s jurisdiction,
          effective date, migration-plan implications, and required action.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REG_CLASSIFICATIONS.map((c) => (
            <div key={c.status} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">{c.label}</div>
              <p className="text-[11px] text-muted-foreground">{c.definition}</p>
              <p className="text-[11px] text-foreground/70 mt-1 border-t border-border pt-1">
                {c.escalation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
)

// ─── Section 3: GRC-SOC handoff + vendors ────────────────────────────────────

const Step3HandoffAndVendors: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <GitMerge size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The GRC-SOC Handoff</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The SOC&apos;s detection use cases depend on a queryable cryptographic-posture registry —
          which is a GRC asset. Beyond that registry, GRC produces four outputs the SOC consumes.
          The relationship is symbiotic, but only if both sides make their outputs consumable by the
          other; designing these data flows is a Phase 0 governance decision.
        </p>
        <div className="space-y-2">
          {GRC_SOC_OUTPUTS.map((o) => (
            <div key={o.id} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-primary shrink-0 mt-0.5">
                <ArrowRight size={16} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{o.output}</div>
                <p className="text-xs text-muted-foreground">{o.socUse}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-status-warning/30">
          <p className="text-xs text-foreground/90">
            <strong>The exception register as a suppression list.</strong> The SOC must ingest the
            exception and deferral register as a <em>dynamic suppression list</em>. Without it,
            cryptographic-drift detection rules generate constant alerts from legacy systems that
            are legitimately deferred — drowning out the genuine regressions the rules exist to
            catch.
          </p>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Network size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Third-Party Quantum Readiness</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          An organization can migrate its own cryptography flawlessly and still be exposed through
          its vendors. GRC tiers third parties by how their readiness affects the migration.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VENDOR_TIERS.map((v) => (
            <div
              key={v.tier}
              className="bg-muted/50 rounded-lg p-3 border border-border flex flex-col"
            >
              <div className="text-sm font-bold text-foreground">
                Tier {v.tier}: {v.name}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex-grow">{v.description}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-2">{v.examples}</p>
              <p className="text-[11px] text-primary/80 mt-2 border-t border-border pt-2">
                {v.treatment}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          For Tier 1 vendors, require a machine-readable{' '}
          <InlineTooltip term="Cryptographic Bill of Materials">CBOM</InlineTooltip> (CycloneDX
          1.6+). A vendor who cannot produce one has a level of cryptographic visibility that should
          itself concern the organization. Maintain a documented substitution assessment for each —
          concentration on a single HSM vendor, CA, or crypto library is its own risk.
        </p>
      </div>
    </section>
  </div>
)

// ─── Section 4: Audit, insurance, crisis comms ───────────────────────────────

const Step4AssuranceAndCrisis: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Audit, Assurance &amp; Insurance</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A multi-year transformation with significant budget and risk should face the same audit
          oversight as any comparable enterprise program. The key audit question is whether systems
          are <em>actually migrated</em> or only <em>marked</em> migrated — evidenced through an
          auditable artifact set (inventory database with timestamps, quarterly CBOM snapshots,
          SteerCo minutes, the board-approved risk-appetite statement, Regulatory Horizon Reports,
          vendor records, and the exception register).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AUDIT_TIMELINE.map((m) => (
            <div key={m.when} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">{m.when}</div>
              <p className="text-[11px] text-muted-foreground">{m.focus}</p>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-xs text-foreground/90">
            <strong>Insurance.</strong> Cyber underwriters now ask about cryptographic inventories,
            migration plans, and crypto-agility at renewal. GRC should ensure the program&apos;s
            documentation is presentable to underwriters: a documented, governed, measured program
            is a demonstrably better risk than a vague intention to &quot;migrate when standards are
            ready,&quot; and may avert higher premiums or explicit quantum exclusions.
          </p>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Megaphone size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          Crisis Communications &amp; Crisis Governance
        </h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A quantum cryptographic event is a{' '}
          <strong>confidence crisis before it is a technical incident</strong>: operational damage
          may take days, but trust damage begins with the first headline. The SOC playbooks own the
          technical response; GRC owns the external one — and it cannot be drafted during the event.
          Maintain pre-drafted templates, name the spokesperson and approval chain in advance, and
          exercise the communications leg in the same tabletop exercises that test the technical
          playbooks.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CRISIS_COMMS_TEMPLATES.map((t) => (
            <div key={t.id} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-medium text-foreground">{t.audience}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.purpose}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Expect an attestation surge after any public quantum event — counterparties and customers
          demand evidence of migration status. Maintain the evidence dossier so that answering is an{' '}
          <em>export, not a project</em>.
        </p>
      </div>
    </section>
  </div>
)

// ─── Section 5: Resources + CTA ──────────────────────────────────────────────

const Step5ResourcesAndCta: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/learn/pqc-governance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Scale size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Governance &amp; Policy</div>
            <div className="text-xs text-muted-foreground">
              RACI, policy hierarchy, and escalation framework
            </div>
          </div>
        </Link>
        <Link
          to="/compliance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Landmark size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
            <div className="text-xs text-muted-foreground">Feeds the Regulatory Horizon Report</div>
          </div>
        </Link>
        <Link
          to="/assess"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ClipboardCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">Seeds KRI baselines and exposure</div>
          </div>
        </Link>
        <Link
          to="/learn/pqc-risk-management"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <BarChart3 size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
            <div className="text-xs text-muted-foreground">Quantify quantum risk and registers</div>
          </div>
        </Link>
      </div>
    </section>

    <div className="text-center">
      <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Build a three-level KRI dashboard, then triage an exception register into a SOC suppression
        list.
      </p>
    </div>
  </div>
)

// ─── Main ────────────────────────────────────────────────────────────────────

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      id: 'cascade',
      label: 'Why GRC & the KRI Cascade',
      content: <Step1WhyAndCascade />,
    },
    {
      id: 'appetite',
      label: 'Risk Appetite & Regulatory Horizon',
      content: <Step2AppetiteAndHorizon />,
    },
    {
      id: 'handoff',
      label: 'GRC-SOC Handoff & Vendors',
      content: <Step3HandoffAndVendors />,
    },
    {
      id: 'assurance',
      label: 'Audit, Insurance & Crisis Comms',
      content: <Step4AssuranceAndCrisis />,
    },
    {
      id: 'resources',
      label: 'Resources & Workshop',
      content: <Step5ResourcesAndCta onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
