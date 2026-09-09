// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CheckCircle2, Circle, ChevronDown, Lock, Trophy, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERSONAS, essentialsQuizCategories, type PersonaId } from '@/data/learningPersonas'
import { useModuleStore } from '@/store/useModuleStore'
import { useLearnStore } from '@/store/useLearnStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { usePersonaPathItems } from '@/components/PKILearning/usePersonaPathItems'
import {
  computePathProgress,
  isCheckpointPassed,
  formatHours,
} from '@/components/PKILearning/redesign/learnRedesign.helpers'
import { MobileProgress } from '../primitives/Progress'
import { cn } from '@/lib/utils'

export interface MobileMyPathViewProps {
  persona: PersonaId
}

/**
 * "My Path" body (handoff screen 2, Journey view — the plan's own §Phase 5
 * revised scope after 2026-08-23's pre-work: mirrors desktop's real
 * MyPathView 1:1 rather than the handoff's stale 5-track framing). Reads the
 * exact same real primitives desktop's MyPathView/PersonaPathView do —
 * usePersonaPathItems, computePathProgress, isCheckpointPassed,
 * useModuleStore's per-module status, useLearnStore's phaseExpansion — so a
 * checkpoint can never read "passed" here while desktop still shows it
 * locked, or vice versa.
 *
 * Essentials tier matches desktop exactly (confirmed decision, 2026-08-23):
 * a flat, non-phased list of persona.essentials modules — no checkpoints.
 * Only Full track is phased. The target mockup's screenshot shows a
 * checkpoint row under an "Essentials" label, but desktop's real Essentials
 * tier has no phases or checkpoints at all; matching desktop was the
 * confirmed call over matching that one screenshot.
 *
 * Checkpoint locking is new, mobile-only behavior (confirmed decision,
 * 2026-08-23) — desktop's own checkpoint button is never disabled. Derived
 * from real data: a phase's checkpoint stays locked until every one of that
 * phase's modules is read (statusById[id] === 'completed'), the same
 * module-read signal isCheckpointPassed's own fallback branch already uses.
 */
export function MobileMyPathView({ persona }: MobileMyPathViewProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const modules = useModuleStore((s) => s.modules)
  const phaseExpansion = useLearnStore((s) => s.phaseExpansion)
  const setPhaseExpanded = useLearnStore((s) => s.setPhaseExpanded)
  const summary = usePersonaPathItems(persona)
  const personaData = PERSONAS[persona]

  const tier: 'essentials' | 'full' = searchParams.get('tier') === 'full' ? 'full' : 'essentials'
  const setTier = (next: 'essentials' | 'full') => {
    const params = new URLSearchParams(searchParams)
    if (next === 'full') params.set('tier', 'full')
    else params.delete('tier')
    setSearchParams(params, { replace: true })
  }

  const statusById = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    for (const k of Object.keys(modules)) map[k] = modules[k]?.status
    return map
  }, [modules])

  const quizScores = modules['quiz']?.quizScores

  const progress = useMemo(
    () =>
      computePathProgress(summary?.phases ?? [], statusById, personaData.essentials, quizScores),
    [summary, statusById, personaData.essentials, quizScores]
  )

  // Same walk desktop's computeNextIncompleteModuleId does (PersonaPathView.tsx) —
  // inlined rather than importing that file, which is a full view component this
  // layer may not reach into for one helper.
  const nextIncompleteId = useMemo(() => {
    if (!summary) return null
    for (const item of summary.pathItems) {
      if (item.type !== 'module') continue
      if (statusById[item.moduleId] !== 'completed') return item.moduleId
    }
    return null
  }, [summary, statusById])

  if (!summary) return null

  const startCapstone = () => {
    const categories = essentialsQuizCategories(persona)
    navigate(categories.length ? `/learn/quiz?category=${categories.join(',')}` : '/learn/quiz')
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">
          My path · {personaData.label}
        </p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          {summary.moduleCount} modules · {formatHours(summary.estimatedMinutes)}
        </p>
      </div>

      {/* Essentials <-> Full track toggle */}
      <div
        className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1"
        role="tablist"
        aria-label="Path depth"
      >
        {(['essentials', 'full'] as const).map((t) => {
          const active = tier === t
          const minutes =
            t === 'essentials' ? personaData.essentialsMinutes : personaData.estimatedMinutes
          return (
            <Button
              key={t}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={active}
              onClick={() => setTier(t)}
              className={cn(
                'h-9 rounded-md px-3 text-[11.5px] font-bold',
                active ? 'bg-card text-primary-legible' : 'text-muted-foreground'
              )}
            >
              {t === 'essentials' ? 'Essentials' : 'Full track'}{' '}
              <span className="font-normal">{formatHours(minutes)}</span>
            </Button>
          )
        })}
      </div>

      {tier === 'essentials' ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-bold text-foreground">
              Essentials — the core {progress.essentialsTotal} modules
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              {formatHours(personaData.essentialsMinutes)}
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground">Unlocks the capstone</p>
          <ol className="mt-1 flex flex-col gap-1.5">
            {personaData.essentials.map((id, i) => {
              const mod = MODULE_CATALOG[id]
              const done = statusById[id] === 'completed'
              return (
                <li key={id}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(`/learn/${id}`)}
                    className="h-11 w-full items-center justify-start gap-2.5 rounded-lg border border-border/60 px-2.5 text-left font-normal"
                  >
                    {done ? (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-success"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <span className="w-4 shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
                      {mod?.title ?? id}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ol>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {summary.phases.map((phase) => {
            const completedCount = phase.moduleIds.filter(
              (id) => statusById[id] === 'completed'
            ).length
            const totalCount = phase.moduleIds.length
            const phaseKey = `${persona}:${phase.id}`
            const containsNext =
              nextIncompleteId !== null && phase.moduleIds.includes(nextIncompleteId)
            const expanded = phaseExpansion[phaseKey] ?? containsNext
            const phaseStatusMap: Record<string, string | undefined> = {}
            for (const id of phase.moduleIds) phaseStatusMap[id] = statusById[id]
            const isPassed = isCheckpointPassed(phase, phaseStatusMap, quizScores)
            const allModulesRead = totalCount > 0 && completedCount === totalCount
            const isLocked = !isPassed && !allModulesRead
            return (
              <div key={phaseKey} className="rounded-xl border border-border bg-card">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPhaseExpanded(phaseKey, !expanded)}
                  aria-expanded={expanded}
                  className="h-auto w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 font-normal"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ChevronDown
                      size={15}
                      className={cn(
                        'shrink-0 text-muted-foreground transition-transform',
                        expanded && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate text-[13px] font-bold text-foreground">
                      {phase.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
                    {completedCount} of {totalCount} complete
                  </span>
                </Button>
                {expanded && (
                  <div className="flex flex-col gap-1.5 px-3.5 pb-3.5">
                    {phase.moduleIds.map((id) => {
                      const mod = MODULE_CATALOG[id]
                      const done = statusById[id] === 'completed'
                      return (
                        <Button
                          key={id}
                          type="button"
                          variant="ghost"
                          onClick={() => navigate(`/learn/${id}`)}
                          className="h-11 w-full items-center justify-start gap-2.5 rounded-lg border border-border/60 px-2.5 text-left font-normal"
                        >
                          {done ? (
                            <CheckCircle2
                              size={16}
                              className="shrink-0 text-success"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              size={16}
                              className="shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
                            {mod?.title ?? id}
                          </span>
                          <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
                            {mod?.duration ?? ''}
                          </span>
                        </Button>
                      )
                    })}
                    {phase.categories.length > 0 && (
                      <div
                        className={cn(
                          'mt-1 flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5',
                          isPassed
                            ? 'border-success/30 bg-success/5'
                            : isLocked
                              ? 'border-border bg-muted/30'
                              : 'border-accent/30 bg-accent/5'
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {isLocked ? (
                            <Lock
                              size={14}
                              className="shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <CheckSquare
                              size={14}
                              className={cn('shrink-0', isPassed ? 'text-success' : 'text-accent')}
                              aria-hidden="true"
                            />
                          )}
                          <span className="min-w-0 truncate text-[12px] font-bold text-foreground">
                            Checkpoint quiz — {phase.title}
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant={isPassed ? 'outline' : 'gradient'}
                          disabled={isLocked}
                          onClick={() =>
                            navigate(`/learn/quiz?category=${phase.categories.join(',')}`, {
                              state: { checkpointLabel: `Checkpoint quiz — ${phase.title}` },
                            })
                          }
                          className="h-11 shrink-0 rounded-lg px-2.5 text-[11px] font-bold"
                        >
                          {isPassed ? 'Review quiz' : isLocked ? 'Locked' : 'Take quiz'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Capstone — unlocked by the Essentials, same real gate desktop uses */}
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border p-3.5',
          progress.capstoneUnlocked ? 'border-accent/40' : 'border-border'
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {progress.capstoneUnlocked ? (
            <Trophy size={18} className="shrink-0 text-accent" aria-hidden="true" />
          ) : (
            <Lock size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-foreground">
              Capstone quiz — {personaData.label}
            </p>
            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
              {progress.capstoneUnlocked
                ? "You've unlocked it — give it a go."
                : `Finish the ${progress.essentialsTotal} Essentials to unlock (${progress.essentialsDone} done).`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={progress.capstoneUnlocked ? 'gradient' : 'outline'}
          disabled={!progress.capstoneUnlocked}
          onClick={startCapstone}
          className="h-9 shrink-0 rounded-lg px-3 text-[11.5px] font-bold"
        >
          {progress.capstoneUnlocked ? 'Take it' : 'Locked'}
        </Button>
      </div>

      <MobileProgress
        value={progress.pct}
        label={`Full path progress — ${progress.doneModules} of ${progress.totalModules} modules`}
      />
    </div>
  )
}
