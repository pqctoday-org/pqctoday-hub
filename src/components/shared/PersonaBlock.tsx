// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "For your role" on a module or tool, from
 * `src/data/personaBlocks.ts`. With a persona set, that persona's paragraph
 * (nothing if the item does not claim it); with none, every claimed persona's
 * paragraph as a definition list. Renders nothing for an item with no blocks.
 */
import { personaBlocksFor } from '@/data/personaBlocks'
import { PERSONAS } from '@/data/learningPersonas'
import { PERSONA_IDS } from '@/data/personaIds'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'

interface PersonaBlockProps {
  route: string
  className?: string
}

export function PersonaBlock({ route, className }: PersonaBlockProps) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const blocks = personaBlocksFor(route)
  if (!blocks) return null
  // eslint-disable-next-line security/detect-object-injection -- PersonaId from the typed union
  const listed = PERSONA_IDS.filter((p) => blocks[p])
  if (listed.length === 0) return null
  const box = cn('rounded-lg border border-border bg-muted/20 p-3', className)
  if (selectedPersona) {
    // eslint-disable-next-line security/detect-object-injection -- PersonaId from the typed union
    const text = blocks[selectedPersona]
    if (!text) return null
    return (
      <section aria-label="For your role" data-testid="persona-block" className={box}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">For your role:</span> {text}
        </p>
      </section>
    )
  }
  return (
    <section aria-label="For your role" data-testid="persona-block" className={box}>
      <p className="text-sm font-semibold text-foreground">For your role</p>
      <dl className="mt-1.5 grid gap-1 text-sm leading-relaxed text-muted-foreground sm:grid-cols-[max-content_1fr] sm:gap-x-3">
        {listed.map((id) => (
          <div key={id} className="contents">
            {/* eslint-disable-next-line security/detect-object-injection -- id from PERSONA_IDS */}
            <dt className="font-medium text-foreground">{PERSONAS[id].label}</dt>
            {/* eslint-disable-next-line security/detect-object-injection -- id from PERSONA_IDS */}
            <dd className="m-0">{blocks[id]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
