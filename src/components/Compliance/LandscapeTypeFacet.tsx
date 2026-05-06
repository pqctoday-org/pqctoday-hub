// SPDX-License-Identifier: GPL-3.0-only
/**
 * LandscapeTypeFacet — segmented control that filters the unified Landscape
 * tab by body-type. Replaces the four separate tabs (Standardization Bodies,
 * Technical Standards, Certification Schemes, Compliance Frameworks) that
 * were rendering the same `<ComplianceLandscape>` with a different slice.
 *
 * Colour swatches match `GlossaryStrip.TYPE_COLOURS` so the facet is also a
 * legend.
 */
import { Button } from '@/components/ui/button'
import { TYPE_COLOURS } from './GlossaryStrip'

export type LandscapeType = 'regulations' | 'standards' | 'certifications' | 'bodies'

interface Props {
  value: LandscapeType
  counts: Record<LandscapeType, number>
  onChange: (next: LandscapeType) => void
}

const ITEMS: Array<{ key: LandscapeType; label: string; swatch: string }> = [
  { key: 'regulations', label: 'Regulations', swatch: TYPE_COLOURS.regulations },
  { key: 'standards', label: 'Standards', swatch: TYPE_COLOURS.standards },
  { key: 'certifications', label: 'Certifications', swatch: TYPE_COLOURS.certifications },
  { key: 'bodies', label: 'Bodies', swatch: TYPE_COLOURS.bodies },
]

export function LandscapeTypeFacet({ value, counts, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter Landscape by type"
      className="inline-flex border border-border rounded-lg overflow-hidden bg-muted/30"
    >
      {ITEMS.map((item, i) => {
        const active = item.key === value

        const count = counts[item.key]
        return (
          <Button
            key={item.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors rounded-none h-auto ${
              i > 0 ? 'border-l border-border' : ''
            } ${
              active
                ? 'bg-card text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: item.swatch }}
            />
            {item.label}
            <span className="text-muted-foreground/80 text-[10px]">{count}</span>
          </Button>
        )
      })}
    </div>
  )
}
