// SPDX-License-Identifier: GPL-3.0-only
// OWNER: FIPS author
/* eslint-disable security/detect-object-injection -- keys are typed unions (Tone, LevelChoice, AnchorComponentId, decision keys) from fipsData */
/**
 * Workshop step `fips-level-planner` (plan r2 A6): plan the FIPS 140-3 module
 * boundary and target level for four deployments of the fictional anchor HSM,
 * then the evidence, CMVP route and procurement claim for adding ML-KEM and
 * ML-DSA. The rubric scores FIT, never height: a level above what the threat
 * model needs is marked over-specified, not rewarded.
 *
 * Output: an inspectable plain-text plan the learner copies into the capstone.
 */
import { useMemo, useState, type FC, type ReactNode } from 'react'
import { CheckCircle2, ClipboardList, RotateCcw, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { CopyButton } from '@/components/ui/CopyButton'
import { OptionTile } from '@/components/common/OptionTile'
import type { CertWorkshopStepProps } from '../data/types'
import { ANCHOR_SCENARIO, type AnchorComponentId } from '../data/anchorScenario'
import {
  BOUNDARY_NOTES,
  EVIDENCE_OPTIONS,
  FIPS_AS_OF_LABEL,
  LEVEL_OPTIONS,
  PLANNER_SCENARIOS,
  ROUTE_OPTIONS,
  type LevelChoice,
  type PlannerScenario,
  type PlannerScenarioId,
  type RouteChoice,
} from '../data/fipsData'

type Focus = 'route' | 'claim'

const isScenarioId = (v: unknown): v is PlannerScenarioId =>
  typeof v === 'string' && PLANNER_SCENARIOS.some((s) => s.id === v)

const isFocus = (v: unknown): v is Focus => v === 'route' || v === 'claim'

const scenarioById = (id: PlannerScenarioId): PlannerScenario =>
  PLANNER_SCENARIOS.find((s) => s.id === id) ?? PLANNER_SCENARIOS[0]

const componentLabel = (id: AnchorComponentId): string =>
  ANCHOR_SCENARIO.components.find((c) => c.id === id)?.label ?? id

interface Verdict {
  ok: boolean
  notes: string[]
}

interface PlanInput {
  scenario: PlannerScenario
  boundary: ReadonlySet<AnchorComponentId>
  level: LevelChoice | null
  evidence: ReadonlySet<string>
  route: RouteChoice | null
  claim: number | null
}

/** Pure rubric: one verdict per decision. */
function assessPlan(
  input: PlanInput
): Record<'boundary' | 'level' | 'evidence' | 'route' | 'claim', Verdict> {
  const { scenario, boundary, level, evidence, route, claim } = input

  const boundaryNotes: string[] = []
  let boundaryOk = true
  for (const id of scenario.requiredIn) {
    if (!boundary.has(id)) {
      boundaryOk = false
      boundaryNotes.push(`${componentLabel(id)} is missing: ${BOUNDARY_NOTES[id].missing}`)
    }
  }
  for (const id of scenario.requiredOut) {
    if (boundary.has(id)) {
      boundaryOk = false
      boundaryNotes.push(`${componentLabel(id)} should be outside: ${BOUNDARY_NOTES[id].wronglyIn}`)
    }
  }
  for (const id of scenario.widening) {
    if (boundary.has(id)) boundaryNotes.push(`${componentLabel(id)}: ${BOUNDARY_NOTES[id].widened}`)
  }
  if (boundaryOk && boundaryNotes.length === 0)
    boundaryNotes.push(
      'Tight boundary: only what performs and protects the cryptography is inside.'
    )

  const levelVerdict: Verdict =
    level === null
      ? { ok: false, notes: ['Pick a target level.'] }
      : {
          ok: scenario.fittingLevels.includes(level),
          notes: [scenario.levelFeedback[level]],
        }

  const evidenceNotes: string[] = []
  let evidenceOk = true
  for (const opt of EVIDENCE_OPTIONS) {
    const picked = evidence.has(opt.id)
    if (opt.needed && !picked) {
      evidenceOk = false
      evidenceNotes.push(`Missing — ${opt.label}: ${opt.why}`)
    } else if (!opt.needed && picked) {
      evidenceOk = false
      evidenceNotes.push(`Not evidence — ${opt.label}: ${opt.why}`)
    }
  }
  if (evidenceOk)
    evidenceNotes.push(
      'Complete: algorithm validation, the module’s own self-tests and entropy evidence — and nothing that only looks like evidence.'
    )

  const routeOpt = ROUTE_OPTIONS.find((r) => r.id === route)
  const routeVerdict: Verdict = routeOpt
    ? { ok: routeOpt.ok, notes: [routeOpt.why] }
    : { ok: false, notes: ['Pick a route.'] }

  const claimOpt = claim === null ? undefined : scenario.claims.at(claim)
  const claimVerdict: Verdict = claimOpt
    ? { ok: claimOpt.ok, notes: [claimOpt.why] }
    : { ok: false, notes: ['Pick a claim.'] }

  return {
    boundary: { ok: boundaryOk, notes: boundaryNotes },
    level: levelVerdict,
    evidence: { ok: evidenceOk, notes: evidenceNotes },
    route: routeVerdict,
    claim: claimVerdict,
  }
}

const DECISION_LABELS: Readonly<Record<keyof ReturnType<typeof assessPlan>, string>> = {
  boundary: 'Boundary',
  level: 'Target level',
  evidence: 'Evidence for the PQC change',
  route: 'CMVP route for the change',
  claim: 'Procurement claim',
}

const Step = ({
  n,
  title,
  highlight,
  children,
}: {
  n: number
  title: string
  highlight?: boolean
  children: ReactNode
}) => (
  <section
    className={`rounded-lg border p-4 ${highlight ? 'border-primary bg-primary/5' : 'border-border'}`}
    aria-labelledby={`fips-planner-step-${n}`}
  >
    <h3 id={`fips-planner-step-${n}`} className="mb-3 text-sm font-bold text-foreground">
      {n}. {title}
    </h3>
    {children}
  </section>
)

export const FipsLevelPlanner: FC<CertWorkshopStepProps> = ({ config }) => {
  const initialScenario: PlannerScenarioId = isScenarioId(config?.scenario)
    ? config.scenario
    : 'appliance'
  const focus: Focus | undefined = isFocus(config?.focus) ? config.focus : undefined

  const [scenarioId, setScenarioId] = useState<PlannerScenarioId>(initialScenario)
  const [boundary, setBoundary] = useState<Set<AnchorComponentId>>(new Set())
  const [level, setLevel] = useState<LevelChoice | null>(null)
  const [evidence, setEvidence] = useState<Set<string>>(new Set())
  const [route, setRoute] = useState<RouteChoice | null>(null)
  const [claim, setClaim] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const scenario = scenarioById(scenarioId)

  const reset = () => {
    setBoundary(new Set())
    setLevel(null)
    setEvidence(new Set())
    setRoute(null)
    setClaim(null)
    setChecked(false)
  }

  const pickScenario = (id: string) => {
    if (!isScenarioId(id)) return
    setScenarioId(id)
    reset()
  }

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const complete = level !== null && route !== null && claim !== null
  const result = useMemo(
    () => assessPlan({ scenario, boundary, level, evidence, route, claim }),
    [scenario, boundary, level, evidence, route, claim]
  )
  const score = Object.values(result).filter((v) => v.ok).length

  const planText = useMemo(() => {
    const inside = ANCHOR_SCENARIO.components.filter((c) => boundary.has(c.id)).map((c) => c.label)
    const outside = ANCHOR_SCENARIO.components
      .filter((c) => !boundary.has(c.id))
      .map((c) => c.label)
    const levelLabel = LEVEL_OPTIONS.find((l) => l.id === level)?.label ?? '(not chosen)'
    const evidenceLabels = EVIDENCE_OPTIONS.filter((e) => evidence.has(e.id)).map((e) => e.label)
    const routeLabel = ROUTE_OPTIONS.find((r) => r.id === route)?.label ?? '(not chosen)'
    const claimText = claim === null ? '(not chosen)' : (scenario.claims.at(claim)?.text ?? '')
    const lines = [
      `FIPS 140-3 level and boundary plan — ${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel})`,
      `Scenario: ${scenario.title}`,
      `Inside the module boundary: ${inside.join(', ') || '(nothing)'}`,
      `Outside: ${outside.join(', ') || '(nothing)'}`,
      `Target: ${levelLabel}`,
      `Evidence for ${ANCHOR_SCENARIO.change.toLowerCase()}: ${evidenceLabels.join('; ') || '(none)'}`,
      `CMVP route: ${routeLabel}`,
      `Procurement claim: "${claimText}"`,
    ]
    if (checked) {
      lines.push(`Self-check: ${score} of 5 decisions defensible`)
      for (const [key, v] of Object.entries(result) as [keyof typeof result, Verdict][]) {
        lines.push(`  - ${DECISION_LABELS[key]}: ${v.ok ? 'OK' : 'revisit'}`)
      }
    }
    lines.push(
      `Basis: CMVP Management Manual v2.7 and FIPS 140-3 IG of 19 August 2026, as of ${FIPS_AS_OF_LABEL}.`,
      'Practitioner orientation — not laboratory training.'
    )
    return lines.join('\n')
  }, [boundary, checked, claim, evidence, level, result, route, scenario, score])

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">
            {ANCHOR_SCENARIO.name}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({ANCHOR_SCENARIO.fictionalLabel} network HSM)
            </span>
          </h2>
        </div>
        <p className="text-sm text-foreground/80">
          Plan one FIPS 140-3 validation for a deployment of {ANCHOR_SCENARIO.name}: draw the module
          boundary, choose the target level, then plan the evidence, route and claim for{' '}
          {ANCHOR_SCENARIO.change.charAt(0).toLowerCase() + ANCHOR_SCENARIO.change.slice(1)}. The
          planner scores <strong>fit</strong>, not height: a level above what the threat model needs
          is marked over-specified.
        </p>
      </div>

      <Step n={1} title="Pick a deployment">
        <div className="grid gap-2 sm:grid-cols-2">
          {PLANNER_SCENARIOS.map((s) => (
            <OptionTile
              key={s.id}
              id={s.id}
              label={s.title}
              selected={s.id === scenarioId}
              onSelect={pickScenario}
            />
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-foreground/90">
          {scenario.situation}
        </p>
      </Step>

      <Step n={2} title="Draw the module boundary — which components are inside?">
        <div className="flex flex-wrap gap-2">
          {ANCHOR_SCENARIO.components.map((c) => {
            const on = boundary.has(c.id)
            return (
              <Button
                key={c.id}
                variant={on ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={on}
                onClick={() => {
                  setBoundary((b) => toggle(b, c.id))
                  setChecked(false)
                }}
              >
                {on ? 'Inside: ' : ''}
                {c.label}
              </Button>
            )
          })}
        </div>
      </Step>

      <Step n={3} title="Choose the target overall level">
        <div className="grid gap-2 sm:grid-cols-2">
          {LEVEL_OPTIONS.map((l) => (
            <OptionTile
              key={l.id}
              id={l.id}
              label={l.label}
              selected={level === l.id}
              onSelect={(id) => {
                setLevel(LEVEL_OPTIONS.find((o) => o.id === id)?.id ?? null)
                setChecked(false)
              }}
            />
          ))}
        </div>
      </Step>

      <Step
        n={4}
        title="Which evidence does adding ML-KEM and ML-DSA need? (select all that apply)"
      >
        <div className="flex flex-col gap-2">
          {EVIDENCE_OPTIONS.map((e) => {
            const on = evidence.has(e.id)
            return (
              <Button
                key={e.id}
                variant={on ? 'secondary' : 'outline'}
                className="h-auto justify-start whitespace-normal py-2 text-left"
                aria-pressed={on}
                onClick={() => {
                  setEvidence((s) => toggle(s, e.id))
                  setChecked(false)
                }}
              >
                {e.label}
              </Button>
            )
          })}
        </div>
      </Step>

      <Step
        n={5}
        title="A customer deadline is close. Which CMVP route adds PQC?"
        highlight={focus === 'route'}
      >
        <div className="grid gap-2">
          {ROUTE_OPTIONS.map((r) => (
            <OptionTile
              key={r.id}
              id={r.id}
              label={r.label}
              selected={route === r.id}
              onSelect={(id) => {
                setRoute(ROUTE_OPTIONS.find((o) => o.id === id)?.id ?? null)
                setChecked(false)
              }}
            />
          ))}
        </div>
      </Step>

      <Step
        n={6}
        title="Which procurement claim can the buyer rely on?"
        highlight={focus === 'claim'}
      >
        <div className="grid gap-2">
          {scenario.claims.map((c, i) => (
            <OptionTile
              key={c.text}
              id={String(i)}
              label={c.text}
              selected={claim === i}
              onSelect={() => {
                setClaim(i)
                setChecked(false)
              }}
            />
          ))}
        </div>
      </Step>

      <div className="flex flex-wrap gap-2">
        <Button variant="gradient" disabled={!complete} onClick={() => setChecked(true)}>
          <ClipboardList size={16} className="mr-2" aria-hidden="true" />
          Check my plan
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw size={16} className="mr-2" aria-hidden="true" />
          Reset
        </Button>
        {!complete ? (
          <p className="self-center text-xs text-muted-foreground">
            Choose a level, a route and a claim to check the plan.
          </p>
        ) : null}
      </div>

      {checked ? (
        <div className="glass-panel space-y-3 p-5" aria-live="polite">
          <p className="text-sm font-bold text-foreground">
            {score} of 5 decisions defensible for “{scenario.title}”
          </p>
          <ul className="space-y-3">
            {(Object.entries(result) as [keyof typeof result, Verdict][]).map(([key, v]) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                {v.ok ? (
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-status-success"
                    aria-label="Defensible"
                  />
                ) : (
                  <XCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-status-error"
                    aria-label="Revisit"
                  />
                )}
                <div>
                  <p className="font-semibold text-foreground">{DECISION_LABELS[key]}</p>
                  {v.notes.map((n) => (
                    <p key={n} className="text-xs text-muted-foreground">
                      {n}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            The accepted levels are this planner’s teaching model for a fictional product, not a
            CMVP rule. Your lab and the CMVP decide real submissions.
          </p>
        </div>
      ) : null}

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">
            Your plan (copy it into the capstone)
          </h3>
          <CopyButton text={planText} label="Copy plan" />
        </div>
        <CodeBlock code={planText} language="text" className="mt-3 whitespace-pre-wrap px-4" />
      </div>
    </div>
  )
}
