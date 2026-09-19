// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8, Wave C (2026-09-19) — "What this means for you" strip for the
 * twelve routed reference pages (landing, patents, leaders, explore, revisions,
 * changelog, faq, about, editorial-independence, sponsor, terms, navigate).
 *
 * Renders the active persona's line from PAGE_PERSONA_NOTES; with no persona
 * set it lists all seven, so a first-time visitor still sees why the page is
 * there. Sits under the page header, above the first table or list. Renders
 * nothing for a route with no notes, so it is safe to mount unconditionally.
 */
import { PAGE_PERSONA_NOTES } from '@/data/pagePersonaNotes'
import { PERSONAS } from '@/data/learningPersonas'
import { PERSONA_IDS } from '@/data/personaIds'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'

interface PersonaPageNoteProps {
  /** Route key in PAGE_PERSONA_NOTES, e.g. '/patents'. */
  route: string
  className?: string
}

export function PersonaPageNote({ route, className }: PersonaPageNoteProps) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  // eslint-disable-next-line security/detect-object-injection -- route is a literal passed by the page component, not user input
  const notes = PAGE_PERSONA_NOTES[route]
  if (!notes) return null

  if (selectedPersona) {
    return (
      <section
        aria-label="What this means for you"
        data-testid="persona-page-note"
        className={cn('rounded-lg border border-border bg-muted/20 p-3', className)}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">What this means for you:</span>{' '}
          {/* eslint-disable-next-line security/detect-object-injection -- selectedPersona is the typed PersonaId union */}
          {notes[selectedPersona]}
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label="What this means for you"
      data-testid="persona-page-note"
      className={cn('rounded-lg border border-border bg-muted/20 p-3', className)}
    >
      <p className="text-sm font-semibold text-foreground">What this means for you</p>
      <dl className="mt-1.5 grid gap-1 text-sm leading-relaxed text-muted-foreground sm:grid-cols-[max-content_1fr] sm:gap-x-3">
        {PERSONA_IDS.map((id) => (
          <div key={id} className="contents">
            {/* eslint-disable-next-line security/detect-object-injection -- id comes from the PERSONA_IDS const tuple */}
            <dt className="font-medium text-foreground">{PERSONAS[id].label}</dt>
            {/* eslint-disable-next-line security/detect-object-injection -- id comes from the PERSONA_IDS const tuple */}
            <dd className="m-0">{notes[id]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
