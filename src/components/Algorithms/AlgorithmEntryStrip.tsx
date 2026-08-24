// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'
import type { Region } from '@/store/usePersonaStore'
// Intent / INTENTS / PERSONA_INTENTS / EU_EXECUTIVE_INTENTS moved to
// '@/data/algorithmEntryIntents' (pure-move extraction E-3,
// IMPLEMENTATION-PLAN.md §5.4) so the mobile Algorithms screen and this
// component's own driftguard test (which now imports from the data module
// directly) can both read them without depending on a view component.
import {
  INTENTS,
  PERSONA_INTENTS,
  EU_EXECUTIVE_INTENTS,
  type Intent,
} from '@/data/algorithmEntryIntents'

const DISMISS_KEY = 'algorithms-entry-strip-dismissed'

interface AlgorithmEntryStripProps {
  persona: PersonaId | null
  region: Region | null
  /** Strip is hidden when the page was loaded with existing URL filter/tab state. */
  hasActiveParams: boolean
  onApply: (params: Record<string, string | null>) => void
}

export function AlgorithmEntryStrip({
  persona,
  region,
  hasActiveParams,
  onApply,
}: AlgorithmEntryStripProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (dismissed) {
      try {
        sessionStorage.setItem(DISMISS_KEY, '1')
      } catch {
        // sessionStorage unavailable — degrade gracefully
      }
    }
  }, [dismissed])

  if (dismissed || hasActiveParams) return null

  const handleApply = (params: Record<string, string | null>) => {
    onApply(params)
    setDismissed(true)
  }

  // EU: BSI and ANSSI diverge (see the comment above EU_EXECUTIVE_INTENTS), so
  // the executive persona gets both entries, distinctly labeled, instead of
  // one line that would have to pick a side or blur the disagreement.
  const personaIntents: Intent[] | undefined =
    persona === 'executive' && region === 'eu'
      ? EU_EXECUTIVE_INTENTS
      : persona && PERSONA_INTENTS[persona]
        ? [PERSONA_INTENTS[persona]]
        : undefined

  return (
    <div className="glass-panel p-4 mb-4 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDismissed(true)}
        className="absolute top-2.5 right-2.5 p-1 h-auto text-muted-foreground hover:text-foreground hover:bg-muted/40"
        aria-label="Dismiss"
      >
        <X size={13} />
      </Button>

      {personaIntents ? (
        /* Known persona — one or more focused CTAs (EU: BSI + ANSSI, shown separately) */
        <div className="flex flex-col gap-3 pr-6">
          {personaIntents.map((intent) => (
            <div key={intent.label} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{intent.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{intent.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApply(intent.params)}
                className="shrink-0 flex items-center gap-1.5"
              >
                {intent.icon}
                Go
              </Button>
            </div>
          ))}
        </div>
      ) : (
        /* Unknown persona — show 3 intent choices */
        <div className="pr-6">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            What are you trying to do?
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {INTENTS.map((intent) => (
              <Button
                key={intent.label}
                variant="ghost"
                size="sm"
                onClick={() => handleApply(intent.params)}
                className="flex-1 flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-colors text-left group h-auto justify-start"
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                  {intent.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-foreground">{intent.label}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {intent.description}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
