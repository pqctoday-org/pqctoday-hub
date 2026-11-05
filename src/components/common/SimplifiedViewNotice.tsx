// SPDX-License-Identifier: AGPL-3.0-only
/** Preview-access notice. Access settings and execution/evidence scope are separate. */
import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'

interface Props {
  /** Which controls or linked workbenches the access setting affects. */
  what: string
  /** Execution scope and limitations (legacy prop name; no real-execution guarantee). */
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
        <p className="text-sm font-medium text-foreground">Preview access is selected.</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {what} {stillReal}
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
