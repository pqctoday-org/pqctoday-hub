// SPDX-License-Identifier: GPL-3.0-only
import { Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GUIDED_DEFS } from '../SimTour'
import { CONCEPT_LEARN_MODULE } from './conceptPeekLinks'
import type { TourConcept } from './execTourConfig'

/**
 * Resolve a concept's plain-English body: reuse the existing GUIDED_DEFS text (matched
 * by title keyword, case-insensitive) or the authored inline body. One source, no drift —
 * editing the tour's definition updates the peek too.
 */
export function conceptBody(c: TourConcept): string {
  if (c.source === 'inline') return c.inline ?? ''
  const key = c.key?.toLowerCase()
  const def = key ? GUIDED_DEFS.find((d) => d.title.toLowerCase().includes(key)) : undefined
  return def?.body ?? ''
}

/**
 * SimConceptPeek — lightweight, non-blocking definition cards surfaced during the
 * Executive Overview walkthrough (auto-dismissed by the tour's own pacing) AND, since
 * WP2.3, on first entry to a phase in interactive play (dismissed explicitly, since
 * nothing else advances them for a manual player). HNDL + Mosca at the open, the
 * two-track model at the roadmap, hybrid at pilots. Reuses the tour's plain-English
 * definitions; each card links to the module that teaches it in depth.
 */
export function SimConceptPeek({
  concepts,
  onDismiss,
  onLearnMore,
}: {
  concepts: TourConcept[]
  /** Explicit dismiss (WP2.3) — interactive-play cards have no timer, so a manual
   *  close is the only way they leave. Optional: the walkthrough's own cards are
   *  transient (the tour advances past them) and don't need one. */
  onDismiss?: (id: TourConcept['id']) => void
  /** Opens the concept's Learn module embedded in the sim (never navigates away).
   *  Optional for the same reason as onDismiss. */
  onLearnMore?: (moduleId: string) => void
}) {
  if (concepts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-24 left-4 z-[55] flex max-w-xs flex-col gap-2">
      {concepts.map((c) => {
        const body = conceptBody(c)
        if (!body) return null
        const moduleId = CONCEPT_LEARN_MODULE[c.id]
        return (
          <div
            key={c.id}
            className="pointer-events-auto rounded-lg border border-primary/30 bg-card/95 p-3 shadow-lg backdrop-blur"
            data-testid={`concept-peek-${c.id}`}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Lightbulb size={13} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {c.title}
              </span>
              {onDismiss && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onDismiss(c.id)}
                  aria-label={`Dismiss ${c.title} tip`}
                  className="h-auto shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X size={12} aria-hidden="true" />
                </Button>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            {onLearnMore && moduleId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onLearnMore(moduleId)}
                className="mt-1.5 h-auto rounded-none p-0 text-[11px] font-semibold text-primary hover:underline"
              >
                Learn more →
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
