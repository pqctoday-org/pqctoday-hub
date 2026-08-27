// SPDX-License-Identifier: GPL-3.0-only
import { cn } from '@/lib/utils'

export interface MobileProgressProps {
  /** 0–100. Values outside this range are clamped, not thrown on — callers
   *  compute this from real counts (sections read / total, quiz step / N)
   *  which can transiently be 0 or exceed 100 by an off-by-one before a
   *  render settles. */
  value: number
  label?: string
  className?: string
  /** `success` (read-progress, checkpoint pass) vs `accent` (quiz/dock step
   *  progress) — both resolve to real semantic tokens, never a literal. */
  tone?: 'accent' | 'success'
}

/** Thin progress bar — read-section checklist, checkpoint quiz, workshop dock step. */
export function MobileProgress({ value, label, className, tone = 'accent' }: MobileProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 text-[10.5px] font-semibold text-muted-foreground">{label}</div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-[5px] w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            tone === 'success' ? 'bg-success' : 'bg-primary'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
