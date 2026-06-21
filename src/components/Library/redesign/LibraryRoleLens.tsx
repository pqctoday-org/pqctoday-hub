// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryRoleLens — the redesign's central control. A segmented control of the
 * six personas that, when changed, becomes the single source of truth for the
 * page: it drives the picks, default sort, category emphasis and soft narrow.
 * Persona lives in `usePersonaStore`; this component is presentational.
 */
import { Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'
import {
  LIBRARY_PERSONAS,
  LIBRARY_PERSONA_SENTENCE,
  LIBRARY_NO_PERSONA_SENTENCE,
} from '@/data/libraryPersonaConfig'

interface LibraryRoleLensProps {
  selectedPersona: PersonaId | null
  onSelectPersona: (persona: PersonaId) => void
}

export function LibraryRoleLens({ selectedPersona, onSelectPersona }: LibraryRoleLensProps) {
  const sentence = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      LIBRARY_PERSONA_SENTENCE[selectedPersona]
    : LIBRARY_NO_PERSONA_SENTENCE

  return (
    <div className="glass-panel rounded-2xl p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="shrink-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Role lens
        </span>
        <div
          role="radiogroup"
          aria-label="Viewing the library as"
          className="flex flex-wrap items-center gap-1.5"
        >
          {LIBRARY_PERSONAS.map(({ id, label }) => {
            const active = selectedPersona === id
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={active}
                onClick={() => onSelectPersona(id)}
                className={`h-auto rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-input text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/[0.06] px-3 py-2">
        <Lightbulb size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">{sentence}</p>
      </div>
    </div>
  )
}
