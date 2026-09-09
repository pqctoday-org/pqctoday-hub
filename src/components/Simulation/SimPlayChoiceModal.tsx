// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimPlayChoiceModal — the unified PLAY entry point (simulation-unified-play-
 * mechanism-plan-07052026.md, rev. 3). Always shows all 3 scopes with their
 * scope/audience/duration and a Deep Dive checkbox each; which card is visually
 * emphasized as "Recommended for you" is informed by persona/phase-context, but
 * nothing is ever auto-started — the whole point of this modal is that scope,
 * audience, and duration stay visible before anything begins (rev. 2's silent
 * bypass was found to undermine that and was reverted).
 *
 * Accessibility follows SimConfirmDialog/SimRunComplete's established pattern:
 * role=dialog, aria-modal, focus to the first actionable control, Escape closes.
 *
 * Play This Phase drives the same genuine auto-run engine as Executive Overview
 * and Full Migration Journey — narrated, auto-advancing steps, genuinely
 * completed — just scoped to the one phase chosen in its dropdown instead of
 * all 9. Its Deep Dive checkbox is real: it selects `phase`/`phase-deep`,
 * exactly like the other two cards select `climb`/`climb-deep` or
 * `walkthrough`/`walkthrough-deep`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Gamepad2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import { phaseName } from './simTrapTally'
import { SIM_TREES } from '@/simulation'
import type { RunMode } from './autorun/useSimAutoRunPlayer'
import {
  autoRunIntroQueue,
  autoRunQueue,
  autoRunDeepQueue,
  autoRunWalkthroughQueue,
  estimatedMinutes,
  stepsForPhase,
} from './autorun/simAutoRun'

/** Which card should open pre-emphasized — derived by the caller from persona /
 *  phase-context (a low-stakes default, not a decision already made for the
 *  player: every card is always fully visible and clickable regardless). */
export type SimPlayDefaultCard = 'intro' | 'walkthrough' | 'climb' | 'phase'

/** Every scope the modal can start is a real engine `RunMode` now. */
export type SimPlayChoice = RunMode

export interface SimPlayChoiceModalProps {
  onClose: () => void
  /** Start a run — `phase` is only read for `mode: 'phase' | 'phase-deep'`. */
  onStart: (mode: SimPlayChoice, phase?: PhaseId) => void
  defaultCard: SimPlayDefaultCard
  defaultPhase: PhaseId
  /** Sector line for the "this run uses your assessed sector" personalization note. */
  sectorLabel?: string
  /**
   * "Play it yourself" — close onto the interactive board (07-29 review U-H1:
   * manual play is the actual game and must be a NAMED mode here, not
   * something a first-timer has to discover by dismissing the modal).
   */
  onInteractive?: () => void
}

function fmtMin(min: number): string {
  return `~${Math.round(min)} min`
}

interface CardProps {
  title: string
  scope: string
  /** Omitted for a card with no deeper variant (the intro is one length). */
  deepScope?: string
  audience: string
  standardMin: number
  deepMin?: number
  recommended: boolean
  onPlay: (deep: boolean) => void
  extra?: React.ReactNode
  firstFocusRef?: React.RefObject<HTMLButtonElement | null>
}

function PlayCard({
  title,
  scope,
  deepScope,
  audience,
  standardMin,
  deepMin,
  recommended,
  onPlay,
  extra,
  firstFocusRef,
}: CardProps) {
  const [deep, setDeep] = useState(false)
  // Deep-dive content is authored per phase — today only Phase 6 has any, so
  // most phases' delta rounds to 0. A checkbox that's always clickable but
  // silently adds "+0 min" reads as broken; hide it and say so instead.
  // A card with no deeper variant (the intro) has no delta at all.
  const deepDeltaMin = deepMin === undefined ? 0 : Math.round(deepMin - standardMin)
  const hasDeepContent = deepDeltaMin > 0
  const effectiveDeep = deep && hasDeepContent
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border p-4 ${
        recommended ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
      }`}
    >
      {recommended && (
        <span className="w-fit rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-primary">
          Recommended for you
        </span>
      )}
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="text-[12.5px] leading-snug text-muted-foreground">
        {effectiveDeep ? deepScope : scope}
      </p>
      <p className="text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground/80">Audience: </span>
        {audience}
      </p>
      {extra}
      {hasDeepContent ? (
        <label className="flex items-center gap-2 text-[12px] text-foreground">
          <input
            type="checkbox"
            checked={deep}
            onChange={(e) => setDeep(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          Include deep-dive content (+{deepDeltaMin} min)
        </label>
      ) : (
        <p className="text-[12px] italic text-muted-foreground">
          No deep-dive content available for this yet
        </p>
      )}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {fmtMin(effectiveDeep && deepMin !== undefined ? deepMin : standardMin)}{' '}
          <span className="italic">(approximate)</span>
        </span>
        <Button
          ref={firstFocusRef}
          type="button"
          variant="gradient"
          size="sm"
          className="gap-1.5"
          onClick={() => onPlay(effectiveDeep)}
        >
          <Play size={13} aria-hidden="true" />▶ Play
        </Button>
      </div>
    </div>
  )
}

export function SimPlayChoiceModal({
  onClose,
  onStart,
  defaultCard,
  defaultPhase,
  sectorLabel,
  onInteractive,
}: SimPlayChoiceModalProps) {
  const reduce = useReducedMotion()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const trapRef = useFocusTrap(true)
  const [phase, setPhase] = useState<PhaseId>(defaultPhase)
  // WP2.4: every phase with a real tree is playable here, including the spanning
  // Foundations band — previously excluded (LIFECYCLE_PHASES omits it on purpose
  // for the maturity climb, but "Play This Phase" has no such reason to). The
  // phase-run machinery (phaseFocusFor, SimPhaseRunComplete) already supports
  // Foundations fully; only this picker was excluding it.
  const playablePhases = useMemo(() => PHASE_ORDER.filter((p) => Boolean(SIM_TREES[p])), [])

  useEffect(() => {
    primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Computed once per open — trees are static in-memory data, this mirrors what
  // start() already does on every real run.
  const durations = useMemo(
    () => ({
      walkthroughStandard: estimatedMinutes(autoRunWalkthroughQueue(false).map((i) => i.step)),
      walkthroughDeep: estimatedMinutes(autoRunWalkthroughQueue(true).map((i) => i.step)),
      climbStandard: estimatedMinutes(autoRunQueue().map((i) => i.step)),
      climbDeep: estimatedMinutes(autoRunDeepQueue().map((i) => i.step)),
      // W7.1/W7.3 — measured from the same estimator as every other mode, not
      // an advertised figure. The queue is bounded BY this number.
      intro: estimatedMinutes(autoRunIntroQueue().map((i) => i.step)),
    }),
    []
  )
  const phaseStandardMin = useMemo(() => estimatedMinutes(stepsForPhase(phase, false)), [phase])
  const phaseDeepMin = useMemo(() => estimatedMinutes(stepsForPhase(phase, true)), [phase])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label="Choose how to play the simulation"
          onClick={(e) => e.stopPropagation()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
          // 2026-08-02: widened from max-w-2xl (672px) — the 3 path cards were
          // cramping their body copy to 3-4 words a line at that width.
          className="glass-panel relative max-h-[88vh] w-full max-w-[46rem] overflow-y-auto rounded-2xl border-2 border-primary/30 p-6 shadow-xl"
        >
          <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Choose how to play
          </div>
          <h2 className="mb-1 text-lg font-bold text-foreground">
            Every path runs on your own assessed organization
          </h2>
          {sectorLabel && (
            <p className="mb-4 text-[12px] text-muted-foreground">
              This run uses your assessed sector:{' '}
              <span className="font-semibold">{sectorLabel}</span>
            </p>
          )}

          {/* W7.1 — the shortest way in. The previous minimum was the ~45-minute
              overview, which is a lot to ask before a learner knows whether any
              of this concerns them. Five beats: what the threat is, one asset,
              one choice, its consequence, and what it meant. */}
          <div className="mb-3">
            <PlayCard
              title="Start here — 10-minute intro"
              scope="What the quantum threat actually is, one exposed asset, one decision and its consequence — then a plain-language summary of what you just saw."
              audience="Anyone new to this — no assessment or background needed"
              standardMin={durations.intro}
              recommended={defaultCard === 'intro'}
              firstFocusRef={defaultCard === 'intro' ? primaryRef : undefined}
              onPlay={() => onStart('intro')}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <PlayCard
              title="Executive Overview"
              scope="8 curated highlights across all 9 phases — governance, risk, roadmap, key documents. No technical detail, calendar frozen."
              deepScope="Same 8 highlights, plus each deep stage's phase surfaces its own further-reading extras — a richer board-level tour, still no technical depth."
              audience="Board / exec / non-technical stakeholders"
              standardMin={durations.walkthroughStandard}
              deepMin={durations.walkthroughDeep}
              recommended={defaultCard === 'walkthrough'}
              firstFocusRef={defaultCard === 'walkthrough' ? primaryRef : undefined}
              onPlay={(deep) => onStart(deep ? 'walkthrough-deep' : 'walkthrough')}
            />
            <PlayCard
              title="Full Migration Journey"
              scope="Every required step, all 9 phases, genuinely completed — the real program, real artifacts, real gate-clearing."
              deepScope="Full Migration Journey, plus every optional practice/reading extra along the way."
              audience="Practitioners, technical evaluators, trainers"
              standardMin={durations.climbStandard}
              deepMin={durations.climbDeep}
              recommended={defaultCard === 'climb'}
              firstFocusRef={defaultCard === 'climb' ? primaryRef : undefined}
              onPlay={(deep) => onStart(deep ? 'climb-deep' : 'climb')}
            />
            <PlayCard
              title="Play This Phase"
              scope="One phase's required steps, narrated and auto-advanced — pick it below."
              deepScope="That same phase's required steps, plus its optional extras, narrated and auto-advanced."
              audience="Someone practicing a specific Learn lesson, or previewing one phase"
              standardMin={phaseStandardMin}
              deepMin={phaseDeepMin}
              recommended={defaultCard === 'phase'}
              firstFocusRef={defaultCard === 'phase' ? primaryRef : undefined}
              onPlay={(deep) => onStart(deep ? 'phase-deep' : 'phase', phase)}
              extra={
                <FilterDropdown
                  items={playablePhases.map((p) => ({ id: p, label: phaseName(p) }))}
                  selectedId={phase}
                  onSelect={(id) => setPhase(id as PhaseId)}
                  size="sm"
                  noContainer
                  opaque
                />
              }
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Gamepad2 size={14} aria-hidden="true" className="text-primary" />
                Play it yourself — interactive
              </h3>
              <p className="text-[12.5px] leading-snug text-muted-foreground">
                No narration: you make every call on the board — pick moves, spend quarters, clear
                gates, and live with the traps you hit. The three narrated runs above show the
                journey; this one is the game.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => (onInteractive ? onInteractive() : onClose())}
            >
              Use the board
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="mt-4 w-full text-muted-foreground"
          >
            Cancel
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
