// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuizScoreSummary } from '@/components/PKILearning/modules/Quiz/types'
import { CHECKPOINT_PASS_THRESHOLD as PASS_THRESHOLD } from '@/components/PKILearning/redesign/learnRedesign.helpers'
import { cn } from '@/lib/utils'

export interface MobileQuizResultsProps {
  summary: QuizScoreSummary
  onRetake: () => void
  onExit: () => void
}

/**
 * Handoff screen 5 (result state) — "Result screen shows score, verdict
 * against the 5-of-6 pass bar, and a retake." Deliberately simpler than
 * desktop's QuizResults: no category/difficulty breakdown, no
 * review-all-answers toggle — the handoff's own spec for this screen is
 * just score + verdict + retake, not desktop's fuller report.
 *
 * The handoff also specifies "a warning appears if a module in the phase is
 * still unread" — not built here. MobileMyPathView's checkpoint row already
 * enforces the stronger version of this (the quiz is unreachable at all
 * until every phase module reads completed, unless the checkpoint is
 * already passed via score), so an unread modules can't reach this screen
 * through that entry point. A generic /learn/quiz visit with no phase
 * context has no "phase modules" to check against in the first place.
 */
export function MobileQuizResults({ summary, onRetake, onExit }: MobileQuizResultsProps) {
  const passed = summary.overall.percentage >= PASS_THRESHOLD

  return (
    <div className="flex flex-col items-center gap-4 px-4 pb-4 pt-8 text-center">
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full',
          passed ? 'bg-success/10' : 'bg-destructive/10'
        )}
      >
        {passed ? (
          <CheckCircle2 size={28} className="text-success" aria-hidden="true" />
        ) : (
          <XCircle size={28} className="text-destructive" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          'text-[40px] font-extrabold leading-none',
          passed ? 'text-success' : 'text-destructive'
        )}
      >
        {summary.overall.percentage}%
      </div>

      <span
        className={cn(
          'rounded-full border px-3 py-1 text-[11px] font-bold',
          passed
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-destructive/30 bg-destructive/10 text-destructive'
        )}
      >
        {passed ? 'PASSED' : 'NOT PASSED'}
      </span>

      <p className="text-[13px] text-muted-foreground">
        {summary.overall.correct} of {summary.overall.total} correct · passing grade{' '}
        {PASS_THRESHOLD}%
      </p>

      <div className="mt-2 flex w-full flex-col gap-2.5">
        <Button
          type="button"
          onClick={onRetake}
          className="h-11 w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary text-[13.5px] font-bold text-primary-foreground"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Retake
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onExit}
          className="h-11 w-full rounded-[10px] border-border text-[13.5px] font-bold text-foreground"
        >
          Back to Learn
        </Button>
      </div>
    </div>
  )
}
