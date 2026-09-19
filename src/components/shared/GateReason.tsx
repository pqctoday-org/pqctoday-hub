// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — the visible reason beside a disabled forward
 * control. The Assess bar (`ux` 94) never leaves a reader guessing why Next
 * does nothing; several workshops carried the reason only as a `title`
 * tooltip, which touch and screen-reader users never see. Renders nothing
 * when `when` is false, so it can sit permanently next to the button.
 */
import { cn } from '@/lib/utils'

interface GateReasonProps {
  /** Show the reason (the same condition that disables the control). */
  when: boolean
  children: React.ReactNode
  className?: string
}

export function GateReason({ when, children, className }: GateReasonProps) {
  if (!when) return null
  return (
    <p
      role="status"
      data-testid="gate-reason"
      className={cn('mt-2 text-xs text-muted-foreground', className)}
    >
      {children}
    </p>
  )
}
