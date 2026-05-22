// SPDX-License-Identifier: GPL-3.0-only
import { Sparkles, Layers, Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'
import { granularityForPersona, type PersonaStageGranularity } from '@/data/pqcProtocolMatrix'

interface StageCollapseToggleProps {
  /** Active persona — determines which positions render. */
  persona: PersonaId | null
  /** Effective granularity (persona default OR user override). */
  value: PersonaStageGranularity
  /** Called when the user picks a different granularity. */
  onChange: (next: PersonaStageGranularity) => void
}

/**
 * Persona-aware escape hatch for the protocol-support heatmap palette.
 *
 * - Binary personas (executive / ops / curious) see `Simple ✓ / Detail` and
 *   can flip to the full ternary palette without leaving the page.
 * - Ternary personas (developer / architect) see `Standard ✓ / Full`.
 * - Researcher / no-persona keeps the full 0..7 palette and gets no toggle —
 *   the component renders `null` since there is nothing useful to switch to.
 *
 * The "checkmark" position in each pair is always the persona's natural
 * granularity (`granularityForPersona(persona)`), so the default state matches
 * what the page renders before the user touches anything.
 */
export function StageCollapseToggle({ persona, value, onChange }: StageCollapseToggleProps) {
  const personaGranularity = granularityForPersona(persona)
  if (personaGranularity === 'full') return null

  const options: Array<{
    id: PersonaStageGranularity
    label: string
    icon: typeof Sparkles
    title: string
  }> =
    personaGranularity === 'binary'
      ? [
          {
            id: 'binary',
            label: 'Simple',
            icon: Sparkles,
            title: 'Two-tone palette — RFC-published vs everything else',
          },
          {
            id: 'ternary',
            label: 'Detail',
            icon: Layers,
            title: 'Three-tone palette — early / WG-adopted / RFC',
          },
          {
            id: 'full',
            label: 'Full',
            icon: Microscope,
            title: 'Researcher palette — 8 graduated tiers (0..7)',
          },
        ]
      : [
          {
            id: 'ternary',
            label: 'Standard',
            icon: Layers,
            title: 'Three-tone palette — early / WG-adopted / RFC',
          },
          {
            id: 'full',
            label: 'Full',
            icon: Microscope,
            title: 'Researcher palette — 8 graduated tiers (0..7)',
          },
        ]

  return (
    <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>Palette</span>
      <div
        className="inline-flex rounded-md border border-border bg-card p-0.5"
        role="group"
        aria-label="Heatmap palette granularity"
      >
        {options.map(({ id, label, icon: Icon, title }) => {
          const active = value === id
          return (
            <Button
              key={id}
              type="button"
              variant={active ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => onChange(id)}
              className="h-6 gap-1 px-2 text-[11px]"
              aria-pressed={active}
              title={title}
            >
              <Icon size={11} />
              {label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
