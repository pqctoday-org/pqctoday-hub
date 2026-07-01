// SPDX-License-Identifier: GPL-3.0-only
import { Lightbulb } from 'lucide-react'
import { GUIDED_DEFS } from '../SimTour'
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
 * Executive Overview walkthrough when a concept is relevant to the current phase
 * (HNDL + Mosca at the open, the two-track model at the roadmap, hybrid at pilots).
 * Reuses the tour's plain-English definitions; renders nothing outside the tour.
 */
export function SimConceptPeek({ concepts }: { concepts: TourConcept[] }) {
  if (concepts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-24 left-4 z-[55] flex max-w-xs flex-col gap-2">
      {concepts.map((c) => {
        const body = conceptBody(c)
        if (!body) return null
        return (
          <div
            key={c.id}
            className="pointer-events-auto rounded-lg border border-primary/30 bg-card/95 p-3 shadow-lg backdrop-blur"
            data-testid={`concept-peek-${c.id}`}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Lightbulb size={13} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
                {c.title}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
          </div>
        )
      })}
    </div>
  )
}
