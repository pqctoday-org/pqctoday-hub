// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gamepad2, Map, Briefcase } from 'lucide-react'
import clsx from 'clsx'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { logReportCta } from '@/utils/analytics'

/**
 * Recommended next steps shown at the foot of a completed report so the user
 * isn't stranded — turns the report into a launchpad for the next action
 * (run the simulation, build the migration plan, or open the executive tools).
 *
 * The lead destination is now derived from the result, not just the persona:
 * a strong signal in the result (many vulnerable algorithms, a hard compliance
 * mandate, a low readiness score) picks which of the three destinations leads;
 * persona order is still used for the remaining two, and as the fallback
 * ordering when no signal is strong enough to lead.
 */
interface Step {
  key: 'next-simulation' | 'next-migrate' | 'next-business'
  icon: ReactNode
  title: string
  body: string
  to: string
}

const STEPS = {
  simulation: {
    key: 'next-simulation',
    icon: <Gamepad2 size={20} className="text-primary" aria-hidden="true" />,
    title: 'Run the guided simulation',
    body: 'Watch your migration play out phase by phase — see where the deadlines and harvest-now-decrypt-later risk bite.',
    to: '/simulation',
  },
  migrate: {
    key: 'next-migrate',
    icon: <Map size={20} className="text-primary" aria-hidden="true" />,
    title: 'Build your migration plan',
    body: 'Turn this report into a concrete, sequenced migration workbench for your estate.',
    to: '/migrate',
  },
  business: {
    key: 'next-business',
    icon: <Briefcase size={20} className="text-primary" aria-hidden="true" />,
    title: 'Open the executive tools',
    body: 'Board briefs, program KPIs, and vendor scorecards to drive the program forward.',
    to: '/business',
  },
} satisfies Record<string, Step>

type StepKey = keyof typeof STEPS

const ORDER: Record<PersonaId, StepKey[]> = {
  executive: ['business', 'migrate', 'simulation'],
  ops: ['migrate', 'business', 'simulation'],
  architect: ['migrate', 'simulation', 'business'],
  developer: ['migrate', 'simulation', 'business'],
  researcher: ['simulation', 'migrate', 'business'],
  curious: ['simulation', 'migrate', 'business'],
}

const DEFAULT_ORDER: StepKey[] = ['migrate', 'simulation', 'business']

/** Prefer a concrete action over exploration when two signals tie. */
const TIE_BREAK_ORDER: StepKey[] = ['migrate', 'business', 'simulation']

/**
 * Picks which destination leads based on the result, or `null` if no signal
 * is strong enough to override the persona-based order.
 */
function resultLeadKey(result: AssessmentResult): StepKey | null {
  const vulnerableCount = result.algorithmMigrations.filter((a) => a.quantumVulnerable).length
  const hasHardMandate = result.complianceImpacts.some((c) => c.requiresPQC === true)
  const readiness = result.categoryScores?.organizationalReadiness
  const lowReadiness = readiness !== undefined && readiness < 40
  const highRisk = result.riskLevel === 'critical' || result.riskLevel === 'high'

  const scores: Record<StepKey, number> = {
    migrate: vulnerableCount >= 3 ? 2 : vulnerableCount > 0 ? 1 : 0,
    business: (hasHardMandate ? 2 : 0) + (highRisk ? 1 : 0),
    simulation: lowReadiness ? 2 : 0,
  }
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore === 0) return null
  return TIE_BREAK_ORDER.find((k) => scores[k] === maxScore) ?? null
}

export const ReportNextSteps = ({ result }: { result?: AssessmentResult }) => {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const order = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const personaOrder = (selectedPersona && ORDER[selectedPersona]) || DEFAULT_ORDER
    const lead = result ? resultLeadKey(result) : null
    if (!lead) return personaOrder
    return [lead, ...personaOrder.filter((k) => k !== lead)]
  }, [selectedPersona, result])

  return (
    <section
      className="mt-8 pt-6 border-t border-border"
      aria-labelledby="report-next-steps-heading"
    >
      <h3
        id="report-next-steps-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Recommended next steps
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {order.map((k, i) => {
          const step = STEPS[k]
          const primary = i === 0
          return (
            <Link
              key={step.key}
              to={step.to}
              onClick={() => logReportCta(step.key)}
              className={clsx(
                'glass-panel flex flex-col gap-2 rounded-lg p-4 transition-all duration-200 hover:-translate-y-0.5',
                primary ? 'border-l-4 border-l-primary' : 'border border-border'
              )}
            >
              <div className="flex items-center gap-2">
                {step.icon}
                <span className="text-sm font-semibold text-foreground">{step.title}</span>
              </div>
              <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
              <span
                className={clsx(
                  'flex items-center gap-1.5 text-xs font-semibold',
                  primary ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {primary ? 'Recommended for you' : 'Go'}
                <ArrowRight size={12} aria-hidden="true" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default ReportNextSteps
