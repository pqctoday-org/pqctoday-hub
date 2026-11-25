// SPDX-License-Identifier: AGPL-3.0-only
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { facetChips, type LearnFacets } from '@/data/learnFacets'

/** The stage or NICE area an address names, as chips that clear themselves. Draws nothing when no facet is set. */
export function FacetChips({
  facets,
  onClear,
}: {
  facets: LearnFacets
  onClear: (key: 'stage' | 'area') => void
}) {
  const chips = facetChips(facets)
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filters from the link">
      {chips.map((c) => (
        <Button
          key={c.key}
          variant="ghost"
          size="sm"
          onClick={() => onClear(c.key)}
          aria-label={`Remove filter: ${c.label}`}
          className="gap-1.5 text-xs border border-primary/40 text-primary bg-primary/10"
        >
          {c.label}
          <X size={12} aria-hidden="true" />
        </Button>
      ))}
    </div>
  )
}
