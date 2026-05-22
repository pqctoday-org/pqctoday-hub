// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '../../data/libraryData'
import type { LibraryCuriousPick } from '../../data/libraryCuriousPicks'

/**
 * Persona-curated "picks" panel rendered above the main library grid.
 * Used by the curious / executive / ops personas — each with their own
 * `picks` constant (LIBRARY_CURIOUS_PICKS, LIBRARY_EXECUTIVE_PICKS,
 * LIBRARY_OPS_PICKS).  Renders nothing when `picks` is empty.
 *
 * Visible cap is 5 cards; an inline "Show all N" expander reveals the rest
 * when the list is longer.  Designed to mirror the existing curious
 * "Start here" pattern so persona switches feel consistent.
 */
interface PersonaPicksPanelProps {
  /** Picks to render (all share the curious shape: referenceId/label/blurb). */
  picks: readonly LibraryCuriousPick[]
  /** Heading shown at the top of the panel. */
  title: string
  /** Subtitle / "why these" explainer. */
  subtitle: string
  /** Lookup for the corresponding LibraryItem — required for the open action. */
  resolveItem: (referenceId: string) => LibraryItem | undefined
  /** Click handler for a pick. */
  onOpen: (item: LibraryItem) => void
  /** Persona ID — used in test selectors / aria labels. */
  personaId: string
}

const VISIBLE_CAP = 5

export function PersonaPicksPanel({
  picks,
  title,
  subtitle,
  resolveItem,
  onOpen,
  personaId,
}: PersonaPicksPanelProps) {
  const [expanded, setExpanded] = useState(false)
  if (picks.length === 0) return null

  const visible = expanded ? picks : picks.slice(0, VISIBLE_CAP)
  const remaining = picks.length - VISIBLE_CAP

  return (
    <section
      className="glass-panel p-4 border border-primary/30 bg-primary/5 rounded-lg"
      aria-label={`${title} for ${personaId}`}
      data-testid={`persona-picks-${personaId}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <ul className="space-y-2">
        {visible.map((pick) => {
          const item = resolveItem(pick.referenceId)
          return (
            <li key={pick.referenceId}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (item) onOpen(item)
                }}
                disabled={!item}
                className="w-full h-auto text-left rounded-md border border-border bg-card/40 px-3 py-2 hover:border-primary/40 hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <span className="text-sm font-semibold text-foreground">{pick.label}</span>
                <span className="text-xs text-muted-foreground leading-snug">{pick.blurb}</span>
              </Button>
            </li>
          )
        })}
      </ul>
      {remaining > 0 && (
        <Button
          variant="link"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs"
          aria-expanded={expanded}
        >
          <ChevronDown
            size={12}
            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
            aria-hidden="true"
          />
          {expanded ? 'Show fewer' : `Show all ${picks.length}`}
        </Button>
      )}
    </section>
  )
}
