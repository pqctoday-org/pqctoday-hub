// SPDX-License-Identifier: GPL-3.0-only
/**
 * Wave C (2026-09-19) — phone-shell twin of shared/PersonaPageNote. The Mobile
 * tree may not import desktop view components (eslint no-restricted-imports),
 * so this reads the same PAGE_PERSONA_NOTES data and renders only the active
 * persona's line; with no persona set it renders nothing — the seven-line list
 * is a desktop affordance and would push a phone screen's first control below
 * the fold.
 */
import { PAGE_PERSONA_NOTES } from '@/data/pagePersonaNotes'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'

interface MobilePersonaPageNoteProps {
  route: string
  className?: string
}

export function MobilePersonaPageNote({ route, className }: MobilePersonaPageNoteProps) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  // eslint-disable-next-line security/detect-object-injection -- route is a literal passed by the screen, not user input
  const notes = PAGE_PERSONA_NOTES[route]
  if (!notes || !selectedPersona) return null
  return (
    <section
      aria-label="What this means for you"
      data-testid="persona-page-note"
      className={cn('rounded-xl border border-border bg-muted/30 p-3', className)}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">
        What this means for you
      </p>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-foreground/90">
        {/* eslint-disable-next-line security/detect-object-injection -- selectedPersona is the typed PersonaId union */}
        {notes[selectedPersona]}
      </p>
    </section>
  )
}
