// SPDX-License-Identifier: GPL-3.0-only
import { GraduationCap } from 'lucide-react'
import clsx from 'clsx'
import { EDUCATION_NOTICE } from '@/data/educationNotice'

/**
 * The required education / not-for-production status notice, rendered verbatim
 * from the one shared constant. Deliberately modelled on `ValidationDisclaimer`
 * (same always-visible contract, same one-constant rule):
 *
 * - Always visible. Never behind a disclosure, an accordion, a tooltip, or a
 *   persona/role condition — the reader who most needs it is the one who did
 *   not go looking for it.
 * - `data-testid="education-notice"`, so a test can assert it rendered with no
 *   interaction and the release gate can find it by source scan.
 *
 * `tone="strong"` for the places where the notice is the page's own framing
 * (the Playground shell, the HSM Playground); the default quiet tone for
 * panels that sit inside an already-framed surface.
 */
export const EducationNotice = ({
  className,
  tone = 'quiet',
}: {
  className?: string
  tone?: 'quiet' | 'strong'
}) => (
  <p
    data-testid="education-notice"
    className={clsx(
      'flex items-start gap-2 rounded-md border px-3 py-2 text-[11px] leading-relaxed',
      tone === 'strong'
        ? 'border-status-warning/30 bg-status-warning/10 text-status-warning'
        : 'border-border bg-muted/30 text-muted-foreground',
      className
    )}
  >
    <GraduationCap
      size={13}
      className={clsx('mt-0.5 shrink-0', tone === 'strong' ? '' : 'text-primary')}
      aria-hidden="true"
    />
    <span>{EDUCATION_NOTICE}</span>
  </p>
)
