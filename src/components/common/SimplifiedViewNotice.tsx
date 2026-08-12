// SPDX-License-Identifier: GPL-3.0-only
/**
 * "You're seeing the simplified view" — B+ remediation 1.6 (2026-08-10).
 *
 * The curious persona lands in `viewAccess: 'preview'` (usePersonaStore), which
 * renders a deliberately reduced build of several technical surfaces. Nothing
 * on screen ever said so, and an unnamed simplification is indistinguishable
 * from a defect: a missing control reads as a broken one. A NAMED
 * simplification reassures.
 *
 * Two things this component gets right that the handoff's suggested copy did
 * not. First, it says what is still REAL — the operations behind the reduced
 * controls are genuine ML-KEM / ML-DSA, and saying so is the whole reassurance.
 * Second, the unlock it offers is the one that actually exists:
 * `setViewAccess('unlocked')`, the same call `ExploreView` and `AlgorithmsView`
 * already make. The handoff's proposed line — "finish the assessment to unlock
 * the full bench" — describes a mechanism the store does not implement
 * (completing the assessment does not touch `viewAccess`), so shipping it would
 * have put a false instruction in front of the least-expert reader on the site.
 */
import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'

interface Props {
  /** What is reduced here, in the reader's terms. One sentence, no list. */
  what: string
  /** What is nonetheless real. One clause — this is the reassurance. */
  stillReal: string
  className?: string
}

/**
 * Renders only for a curious reader who is actually in preview access. Every
 * other persona, and a curious reader who has already unlocked, sees nothing —
 * a notice about a simplification that isn't in effect is just noise.
 */
export function SimplifiedViewNotice({ what, stillReal, className = '' }: Props) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const viewAccess = usePersonaStore((s) => s.viewAccess)
  const setViewAccess = usePersonaStore((s) => s.setViewAccess)
  const [hidden, setHidden] = useState(false)

  if (hidden) return null
  if (selectedPersona !== 'curious' || viewAccess !== 'preview') return null

  return (
    <div
      role="status"
      className={`flex flex-wrap items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 sm:flex-nowrap ${className}`}
    >
      <Sparkles size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          You’re seeing the simplified version of this page.
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {what} {stillReal} Nothing here is a demo or a mock-up — there are simply fewer dials.
        </p>
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewAccess('unlocked')}
          className="h-7 flex-1 text-xs sm:flex-none"
        >
          Show every control
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHidden(true)}
          aria-label="Dismiss simplified-view notice"
          className="h-7 w-7 shrink-0 p-0"
        >
          <X size={14} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
