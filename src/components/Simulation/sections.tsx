// SPDX-License-Identifier: GPL-3.0-only
/**
 * Simulation sub-sections (WS-05 extraction) — the prop-driven, presentational
 * pieces of the console that live outside the SimulationView shell: the resource
 * columns, the "next move" decision card, and the End-Quarter report modal.
 * No store access — everything arrives via props.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MATURITY_LEVEL_NAMES } from '@/data/phaseMaturity'
import { type PhaseId } from '@/data/frameworkPhases'
import { SIM_MOVES, type MoveCtx } from '@/data/simMoves'
import type { SimEvent } from '@/data/simEvents'
import { relevantToScenario } from '@/data/simRelevance'
import { resourcesForPhase, REFERENCE_PHASES } from '@/data/phaseResourceMap'
import { MODULE_CATALOG } from './resourceContract'
import type { TreeStep, TreeActivity, LevelBand, Pitfall, StepKind } from '@/simulation'
import type { AssessRec } from '@/simulation/assessBridge'
import { canResolveDeepLink } from '@/simulation/deepLinks'
import { logSimTrapPick } from '@/utils/analytics'
import { Eyebrow } from './atoms'
import {
  SEVERITY_META,
  MOVE_TONE,
  KIND_CHIP,
  REF_LABELS,
  BIZ_NAME,
  PG_NAME,
  markSimResume,
} from './simChrome'

// ---- resources -----------------------------------------------------------
export interface ResItem {
  id: string
  label: string
  to: string
  done?: boolean
  onClick?: () => void
  /** when set, the item opens IN the sim (embed) instead of navigating away */
  onOpen?: () => void
}

export function resLinks(
  leg: 'learn' | 'activities' | 'reference',
  phase: PhaseId,
  sector: string,
  seat: string
): ResItem[] {
  // hide industry verticals / persona modules that don't match the scenario
  const relevant = (id: string) => relevantToScenario(id, sector, seat)
  if (leg === 'learn')
    return resourcesForPhase('learn', phase)
      .filter(relevant)
      .map((id) => ({
        id,
        label: MODULE_CATALOG[id]?.title ?? id,
        to: `/learn/${id}`,
      }))
  if (leg === 'reference')
    return resourcesForPhase('reference', phase).map((id) => ({
      id,
      label: REF_LABELS[id] ?? id,
      to: REFERENCE_PHASES[id]?.deepUrl ?? '/',
    }))
  const biz = resourcesForPhase('business', phase, 'practice')
    .filter(relevant)
    .map((id) => ({
      id,
      label: BIZ_NAME.get(id) ?? id,
      to: `/business/tools/${id}`,
    }))
  const pg = resourcesForPhase('playground', phase, 'practice')
    .filter(relevant)
    .map((id) => ({
      id,
      label: PG_NAME.get(id) ?? id,
      // playground tools route is /playground/:toolId (no "tools" segment)
      to: `/playground/${id}`,
    }))
  return [...biz, ...pg]
}

export function ResCol({ title, items }: { title: string; items: ResItem[] }) {
  const doneCount = items.filter((i) => i.done).length
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Eyebrow className="mb-2 block">
        {title}{' '}
        <span className="text-muted-foreground/60">
          · {doneCount > 0 ? `${doneCount}/${items.length}` : items.length}
        </span>
      </Eyebrow>
      <div className="flex flex-col gap-1.5">
        {items.map((r) => {
          // WS-06: a navigation target that no longer resolves degrades to a
          // disabled "resource moved" row instead of dead-ending the player.
          const resolvable = !!r.onOpen || canResolveDeepLink(r.to)
          const inner = (
            <>
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                  r.done
                    ? 'bg-success text-success-foreground'
                    : 'border border-border text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[11.5px] font-semibold text-foreground">{r.label}</span>
                <span className="block font-mono text-[9px] text-muted-foreground">
                  {r.onOpen
                    ? 'opens in simulation'
                    : resolvable
                      ? r.to
                      : 'resource moved — unavailable'}
                </span>
              </span>
            </>
          )
          const cls = `flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
            r.done ? 'border-success/40 bg-success/5' : 'border-border bg-muted hover:bg-muted/70'
          }`
          if (!resolvable)
            return (
              <div
                key={r.id + r.to}
                aria-disabled="true"
                title="This resource has moved — it'll return when the link is updated."
                className={`${cls} cursor-not-allowed border-warning/40 bg-warning/5 opacity-60`}
              >
                {inner}
              </div>
            )
          // embed in-sim (keeps the sim header) when onOpen is set; else navigate
          return r.onOpen ? (
            <Button
              key={r.id + r.to}
              type="button"
              variant="ghost"
              onClick={r.onOpen}
              className={`h-auto justify-start whitespace-normal ${cls}`}
            >
              {inner}
            </Button>
          ) : (
            <Link
              key={r.id + r.to}
              to={r.to}
              onClick={() => {
                markSimResume()
                r.onClick?.()
              }}
              className={cls}
            >
              {inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---- decision section ----------------------------------------------------
interface DecisionCard {
  correct: boolean
  label: string
  /** revealed-on-pick context: activity (correct) or failure rationale (wrong). */
  detail: string
  kind?: StepKind
}

export function DecisionSection({
  phaseId,
  ctx,
  nextMove,
  level,
  stepsDone,
  stepsTotal,
  gate,
  pitfalls,
  onVisitRef,
  canEmbed,
  onOpenStep,
  assessRec,
}: {
  phaseId: PhaseId
  ctx: MoveCtx
  nextMove: { band: LevelBand; act: TreeActivity; step: TreeStep } | null
  level: number
  stepsDone: number
  stepsTotal: number
  gate?: { id: string; criterion: string }
  pitfalls: Pitfall[]
  onVisitRef: (id: string) => void
  canEmbed: (s: TreeStep) => boolean
  onOpenStep: (s: TreeStep) => void
  assessRec?: AssessRec
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  // reset the choice whenever the move changes (new phase or a step completed)
  const moveKey = `${phaseId}:${stepsDone}`
  const [lastKey, setLastKey] = useState(moveKey)
  if (lastKey !== moveKey) {
    setLastKey(moveKey)
    setChosen(null)
  }

  // wrong-move pool: context-aware traps (SIM_MOVES) + framework Common Failures.
  const ctxTraps = (SIM_MOVES[phaseId] ?? [])
    .map((m) => ({ m, res: m.evaluate(ctx) }))
    .filter((x) => x.res.kind !== 'sound')
    .map((x) => ({ title: x.m.label, why: x.res.outcome }))
  const pool = [...ctxTraps, ...pitfalls]

  // Phase fully cleared — nothing left to do.
  if (!nextMove) {
    return (
      <div className="mb-4 rounded-lg border border-success bg-success/10 p-3">
        <div className="font-mono text-[9.5px] font-extrabold text-success">✓ PHASE CLEARED</div>
        <div className="mt-0.5 text-[12.5px] font-bold text-foreground">
          Every maturity level earned{gate ? ` — Gate ${gate.id} certified` : ''}.
        </div>
      </div>
    )
  }

  // Build the choice: the correct tree step + two wrong moves, ordered by the
  // step count so the right answer isn't always in the same slot.
  const wrong = pickWrong(pool, stepsDone, 2)
  const correctCard: DecisionCard = {
    correct: true,
    label: nextMove.step.label,
    detail: `${nextMove.act.id} · ${nextMove.act.title}`,
    kind: nextMove.step.kind,
  }
  const wrongCards: DecisionCard[] = wrong.map((w) => ({
    correct: false,
    label: w.title,
    detail: w.why,
  }))
  const insertAt = wrongCards.length ? stepsDone % (wrongCards.length + 1) : 0
  const cards: DecisionCard[] = [
    ...wrongCards.slice(0, insertAt),
    correctCard,
    ...wrongCards.slice(insertAt),
  ]

  const chosenCard = chosen != null ? cards[chosen] : null
  const step = nextMove.step

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow>Next move — pick the right play</Eyebrow>
        <span className="font-mono text-[9.5px] font-bold text-muted-foreground">
          {stepsDone}/{stepsTotal} · at L{level}
        </span>
      </div>
      {/* the target: what this move advances (which level + framework activity) */}
      <div className="mb-2 flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5">
        <span className="grid h-5 min-w-[26px] place-items-center rounded bg-primary px-1 font-mono text-[9px] font-extrabold text-primary-foreground">
          L{nextMove.band.level}
        </span>
        <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
          Toward {MATURITY_LEVEL_NAMES[nextMove.band.level]} · {nextMove.act.id}{' '}
          {nextMove.act.title}
        </span>
        {assessRec && (
          <span
            className="shrink-0 rounded-full bg-secondary/15 px-2 py-0.5 font-mono text-[9px] font-bold text-secondary"
            title="Flagged by your assessment"
          >
            ★ Assess · {assessRec.category}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {cards.map((c, i) => {
          const picked = chosen === i
          const tone = picked ? (c.correct ? MOVE_TONE.sound : MOVE_TONE.trap) : null
          return (
            <Button
              variant="ghost"
              key={`${c.label}-${i}`}
              type="button"
              onClick={() => {
                setChosen(i)
                // WS-16: record which Common Failure the player fell for.
                if (!c.correct) logSimTrapPick(phaseId, c.label)
              }}
              className={`flex h-auto w-full flex-col items-start justify-start whitespace-normal rounded-lg border p-2.5 text-left transition-opacity ${
                tone ? `${tone.border} bg-card` : 'border-border bg-muted'
              } ${chosen != null && !picked ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md font-mono text-[9px] font-extrabold ${
                    picked && tone
                      ? 'bg-foreground text-background'
                      : 'bg-card text-muted-foreground'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[11.5px] font-bold leading-tight text-foreground">
                  {c.label}
                </span>
              </div>
            </Button>
          )
        })}
      </div>
      {/* outcome of the pick */}
      {chosenCard && chosenCard.correct && (
        <div className="mt-2 rounded-lg border border-success bg-success/10 p-3">
          <div className="mb-1 font-mono text-[9.5px] font-extrabold text-success">
            ✓ Right call — {chosenCard.detail}
          </div>
          {canEmbed(step) ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenStep(step)}
              className="flex h-auto w-full items-center gap-2.5 rounded-md border border-success/40 bg-card px-3 py-2 hover:bg-muted/60"
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${KIND_CHIP[step.kind]}`}
              >
                {step.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold text-foreground">
                {step.label}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-primary">open here →</span>
            </Button>
          ) : canResolveDeepLink(step.to) ? (
            <Link
              to={step.to}
              onClick={() => {
                markSimResume()
                if (step.kind === 'reference' && step.refId) onVisitRef(step.refId)
              }}
              className="flex items-center gap-2.5 rounded-md border border-success/40 bg-card px-3 py-2 hover:bg-muted/60"
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${KIND_CHIP[step.kind]}`}
              >
                {step.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">
                {step.label}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-primary">open →</span>
            </Link>
          ) : (
            // WS-06: target no longer resolves — show a notice, never a dead link.
            <div
              className="flex items-center gap-2.5 rounded-md border border-warning/40 bg-warning/5 px-3 py-2"
              title="This resource has moved — it'll return when the link is updated."
            >
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">
                {step.label}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-warning">resource moved</span>
            </div>
          )}
        </div>
      )}
      {chosenCard && !chosenCard.correct && (
        <div className="mt-2 rounded-lg border border-destructive bg-destructive/5 p-3">
          <div className="mb-0.5 font-mono text-[9.5px] font-extrabold text-destructive">
            ✕ Common failure
          </div>
          <div className="text-[11px] leading-snug text-muted-foreground">{chosenCard.detail}</div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setChosen(null)}
            className="mt-1 h-auto p-0 font-mono text-[9.5px] font-bold text-primary hover:bg-transparent"
          >
            ↺ try again
          </Button>
        </div>
      )}
    </div>
  )
}

/** deterministic pick of k wrong moves, varied by the step seed. */
function pickWrong(pool: Pitfall[], seed: number, k: number): Pitfall[] {
  if (pool.length <= k) return pool
  return Array.from({ length: k }, (_, j) => pool[(seed + j) % pool.length])
}

// ---- quarter report ------------------------------------------------------
export interface QuarterReportData {
  from: string
  to: string
  clockFrom: number
  clockTo: number
  over: number
  clearedFrom: number
  clearedTo: number
  events: SimEvent[]
  aiProgress: string[]
  recommend: string
}

export function QuarterReport({
  report,
  onClose,
}: {
  report: QuarterReportData
  onClose: () => void
}) {
  const drift = +(report.clockFrom - report.clockTo).toFixed(2)
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <Button
        type="button"
        variant="ghost"
        aria-label="Close report"
        onClick={onClose}
        className="absolute inset-0 h-full w-full rounded-none bg-transparent p-0 hover:bg-transparent"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[88vh] w-[560px] max-w-[92vw] overflow-auto rounded-2xl border border-border bg-card"
      >
        <div className="rounded-t-2xl bg-foreground px-5 py-4 text-background">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-background/55">
            Quarter Report
          </div>
          <div className="mt-0.5 text-[19px] font-extrabold">
            {report.from} → {report.to}
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <Eyebrow>Q-Day horizon</Eyebrow>
              <div className="mt-0.5 text-xl font-extrabold text-destructive">
                {report.clockTo}y left
              </div>
              <div className="text-[10.5px] text-muted-foreground">
                −{drift}y this quarter · over by {report.over}y
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <Eyebrow>Phases cleared</Eyebrow>
              <div className="mt-0.5 text-xl font-extrabold text-success">{report.clearedTo}/8</div>
              <div className="text-[10.5px] text-muted-foreground">
                {report.clearedTo > report.clearedFrom
                  ? `+${report.clearedTo - report.clearedFrom} this quarter`
                  : 'no change'}
              </div>
            </div>
          </div>

          {report.aiProgress.length > 0 && (
            <div className="mb-4">
              <Eyebrow className="mb-1.5 block">AI team progress</Eyebrow>
              {report.aiProgress.map((t, i) => (
                <div
                  key={i}
                  className="mb-1 flex items-center gap-2 text-[12px] text-muted-foreground"
                >
                  <span className="text-primary">▸</span>
                  {t}
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <Eyebrow className="mb-1.5 block">This quarter</Eyebrow>
            {report.events.map((e, i) => {
              const sev = SEVERITY_META[e.sev]
              return (
                <div key={i} className="mb-1.5 flex items-start gap-2.5">
                  {/* icon + sr-only label = non-colour severity signal (AA) */}
                  <span
                    className={`mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[8px] font-bold text-background ${sev.dot}`}
                    aria-hidden="true"
                  >
                    {sev.icon}
                  </span>
                  <span className="text-[12px] leading-snug text-muted-foreground">
                    <span className="sr-only">{sev.label}: </span>
                    {e.txt}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mb-4 rounded-xl border border-primary bg-primary/10 p-3">
            <Eyebrow className="mb-1 block text-primary">Recommended next move</Eyebrow>
            <div className="text-[12.5px] leading-snug text-foreground">{report.recommend}</div>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="h-auto w-full rounded-lg bg-gradient-to-r from-primary to-secondary py-2.5 text-[13px] font-extrabold text-background"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  )
}
