// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Where do I start?" router + framework crosswalk widget (Applied Quantum
 * App. B routing, p.192; App. G crosswalk, p.199).
 *
 * Additive: a collapsed `<details>` on the Learn dashboard. When closed the page
 * is unchanged. When opened it offers a small decision tree that branches by the
 * learner's self-reported migration status and routes to the right first module
 * (or page), plus a compact CSF 2.0 / PQCC / ETSI / Dutch crosswalk read off the
 * canonical phase model (`@/data/frameworkPhases`) — no new data invented here.
 *
 * Fully keyboard-accessible: the disclosure is a native `<details>`/`<summary>`
 * and every branch/target is a shared-UI-kit `<Button>`.
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, ArrowRight, ArrowLeft, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FRAMEWORK_PHASES,
  PHASE_ORDER,
  type PhaseId,
  type PhaseCrosswalk,
} from '@/data/frameworkPhases'

/** A branch in the App. B router: a learner situation → a recommended first stop. */
interface StartBranch {
  id: string
  /** Self-reported situation. */
  question: string
  /** Why this route. */
  rationale: string
  /** Route target — a learn module path or a top-level page. */
  to: string
  /** Button label for the target. */
  cta: string
  /** Phase this branch enters, used to surface the crosswalk row. */
  phase: PhaseId
}

const BRANCHES: StartBranch[] = [
  {
    id: 'never-started',
    question: 'Haven’t started — no mandate or budget yet',
    rationale:
      'Begin with the threat and the executive case so you can secure sponsorship before any technical work.',
    to: '/learn/quantum-threats',
    cta: 'Start: Quantum Threats',
    phase: 'p0',
  },
  {
    id: 'mandate-no-inventory',
    question: 'Have a mandate, but don’t know what crypto we run',
    rationale:
      'You are at Discovery. Build a cryptographic inventory / CBOM before scoring or planning.',
    to: '/learn/crypto-agility',
    cta: 'Start: Crypto Agility & CBOM',
    phase: 'p1',
  },
  {
    id: 'inventory-no-priorities',
    question: 'Have an inventory, but no risk priorities',
    rationale:
      'You are at Risk Scoring. Produce a prioritised, two-track backlog from your inventory.',
    to: '/learn/pqc-risk-management',
    cta: 'Start: PQC Risk Management',
    phase: 'p3',
  },
  {
    id: 'priorities-no-roadmap',
    question: 'Know the priorities, need a multi-year plan',
    rationale: 'You are at Roadmap & Governance. Stand up a program, PMO, and gated roadmap.',
    to: '/learn/migration-program',
    cta: 'Start: Migration Program',
    phase: 'p4',
  },
  {
    id: 'roadmap-migrating',
    question: 'Roadmap exists — actively migrating systems',
    rationale: 'You are at Execution. Use the migration workbench to sequence waves and cutovers.',
    to: '/migrate',
    cta: 'Open: Migrate',
    phase: 'p5',
  },
  {
    id: 'unsure',
    question: 'Not sure — assess me',
    rationale: 'Run the guided readiness assessment; it routes you to the right phase and modules.',
    to: '/assess',
    cta: 'Open: Risk Assessment',
    phase: 'foundations',
  },
]

const CROSSWALK_FRAMEWORKS: { key: keyof PhaseCrosswalk; label: string }[] = [
  { key: 'nistCsf', label: 'NIST CSF 2.0' },
  { key: 'pqcc', label: 'PQCC' },
  { key: 'etsiTr103619', label: 'ETSI TR 103 619' },
  { key: 'dutchHandbook', label: 'Dutch PQC Handbook' },
]

interface WhereToStartTreeProps {
  /**
   * Render open by default and with a stronger "start here" emphasis. Used for
   * the cold-start hero on `/learn` when no persona is selected, so a first-time
   * learner sees the router immediately instead of a collapsed disclosure below
   * the fold. Still fully collapsible (onToggle keeps the state in sync).
   */
  defaultOpen?: boolean
}

export const WhereToStartTree: React.FC<WhereToStartTreeProps> = ({ defaultOpen = false }) => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<StartBranch | null>(null)
  const [open, setOpen] = useState(defaultOpen)

  const crosswalkPhase = selected ? FRAMEWORK_PHASES[selected.phase] : null

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={`glass-panel rounded-xl group ${
        defaultOpen ? 'border-2 border-primary/40 shadow-sm' : 'border border-primary/20'
      }`}
    >
      <summary className="flex items-center gap-2 cursor-pointer list-none p-4 select-none">
        <Compass size={16} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">
          {defaultOpen ? 'New here? Start with the right module' : 'Where do I start?'}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          — find the right first module for where you are
        </span>
        <ArrowRight
          size={14}
          className="ml-auto text-muted-foreground transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
      </summary>

      <div className="p-4 pt-0 space-y-4">
        {selected === null ? (
          <>
            <p className="text-xs text-muted-foreground">
              Pick the statement that best describes your program today:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BRANCHES.map((b) => (
                <Button
                  key={b.id}
                  variant="ghost"
                  onClick={() => setSelected(b)}
                  className="group/branch h-auto text-left rounded-lg border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition-colors px-3 py-2.5 flex items-start justify-between gap-2 w-full"
                >
                  <span className="text-sm font-medium text-foreground leading-snug">
                    {b.question}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground group-hover/branch:text-primary shrink-0 mt-0.5 transition-colors"
                  />
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground h-auto py-1 px-2"
            >
              <ArrowLeft size={12} />
              Back to all paths
            </Button>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="text-sm font-semibold text-foreground">{selected.question}</div>
              <p className="text-xs text-muted-foreground">{selected.rationale}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Phase {crosswalkPhase?.number ?? '—'}: {crosswalkPhase?.name}
                </span>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => navigate(selected.to)}
                  className="flex items-center gap-1.5"
                >
                  {selected.cta}
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            {crosswalkPhase && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Map size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    This phase in other frameworks
                  </span>
                </div>
                <dl className="space-y-1.5">
                  {CROSSWALK_FRAMEWORKS.map((fw) => {
                    const value = crosswalkPhase.crosswalk[fw.key]
                    const text = Array.isArray(value) ? value.join(', ') : value
                    return (
                      <div key={fw.key} className="grid grid-cols-[7rem,1fr] gap-2 text-xs">
                        <dt className="font-medium text-muted-foreground">{fw.label}</dt>
                        <dd className="text-foreground/80">{text}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Routing follows Applied Quantum App. B; crosswalk reads App. G ({PHASE_ORDER.length}{' '}
          phases) from the canonical framework model.
        </p>
      </div>
    </details>
  )
}
