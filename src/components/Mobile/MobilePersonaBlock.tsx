// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — phone twin of shared/PersonaBlock (the mobile
 * tree may not import desktop components). Active persona's paragraph only;
 * nothing without a persona, like MobilePersonaPageNote.
 */
import { personaBlocksFor } from '@/data/personaBlocks'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'

export function MobilePersonaBlock({ route, className }: { route: string; className?: string }) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const blocks = personaBlocksFor(route)
  // eslint-disable-next-line security/detect-object-injection -- PersonaId from the typed union
  const text = selectedPersona && blocks ? blocks[selectedPersona] : undefined
  if (!text) return null
  return (
    <section
      aria-label="For your role"
      data-testid="persona-block"
      className={cn('rounded-xl border border-border bg-muted/30 p-3', className)}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">For your role</p>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-foreground/90">{text}</p>
    </section>
  )
}
