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
  // 09-28 nav remediation (WP3.7): the cards used to ALL render at once, stacked
  // upward from bottom-24 — four of them are ~870px tall, which covered the
  // board's left column and the ▶ Play control, and pushed the top card (and
  // its ✕) off the top of the screen. Now ONE card shows at a time, with a
  // counter, and "Hide tips" dismisses the rest; the card is height-capped.
  const shown = concepts.filter((c) => conceptBody(c))
  const c = shown[0]
  if (!c) return null
  const body = conceptBody(c)
  const moduleId = CONCEPT_LEARN_MODULE[c.id]
  return (
    <div
      className="pointer-events-none fixed left-4 z-[55] flex max-w-xs flex-col"
      // Above the desktop play bar while a run is on (it publishes its measured
      // height); the old fixed bottom-24 otherwise.
      style={{ bottom: 'max(6rem, calc(var(--sim-transport-h-md, 0px) + 0.75rem))' }}
    >
      <div
        key={c.id}
        className="pointer-events-auto max-h-[calc(100vh-12rem)] overflow-y-auto rounded-lg border border-primary/30 bg-card/95 p-3 shadow-lg backdrop-blur"
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
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {onLearnMore && moduleId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onLearnMore(moduleId)}
              className="h-auto rounded-none p-0 text-[11px] font-semibold text-primary hover:underline"
            >
              Learn more →
            </Button>
          )}
          {onDismiss && shown.length > 1 && (
            <>
              <span className="ml-auto font-mono text-sim-micro text-muted-foreground">
                tip 1 of {shown.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onDismiss(c.id)}
                className="h-auto rounded-none p-0 text-[11px] font-semibold text-primary hover:underline"
              >
                Next tip →
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => shown.forEach((x) => onDismiss(x.id))}
                className="h-auto rounded-none p-0 text-[11px] font-semibold text-muted-foreground hover:underline"
              >
                Hide tips
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
