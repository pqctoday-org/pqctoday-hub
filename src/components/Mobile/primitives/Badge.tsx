// SPDX-License-Identifier: GPL-3.0-only
import { cn } from '@/lib/utils'

/**
 * Unread/notification badge — the ⋯ button's red dot when there's unread
 * news, a count badge on a nav tab, etc. Distinct from `CategoryBadge`
 * (src/components/ui/category-badge.tsx), which is a domain-specific pill
 * for region/difficulty labels, not a notification indicator.
 */
export interface MobileBadgeProps {
  /** Omit for a plain dot (handoff: "6px red unread dot"); pass a number
   *  for a count badge. */
  count?: number
  tone?: 'danger' | 'accent'
  className?: string
  testId?: string
}

export function MobileBadge({ count, tone = 'danger', className, testId }: MobileBadgeProps) {
  const toneClass = tone === 'danger' ? 'bg-destructive' : 'bg-primary'
  if (count === undefined) {
    return (
      <span
        aria-hidden="true"
        data-testid={testId}
        className={cn('absolute right-0 top-0 h-1.5 w-1.5 rounded-full', toneClass, className)}
      />
    )
  }
  return (
    <span
      data-testid={testId}
      className={cn(
        'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white',
        toneClass,
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
