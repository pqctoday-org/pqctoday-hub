// SPDX-License-Identifier: AGPL-3.0-only
import { edgeLabelFor } from '@/utils/conceptGraphLayout'
import { DIRECTIONAL_LINK_TYPES, LINK_DEFINITIONS } from '@/utils/conceptLinkWords'

/** The order the legend lists link types in; a type not listed here is added after these. */
const LEGEND_ORDER = [
  'published_by',
  'supersedes',
  'subset_of',
  'superset_of',
  'equivalent',
  'intersects_with',
  'scheme_under',
  'part_of_series',
  'not_related',
  'implements',
] as const

interface ConceptLinkLegendProps {
  /** The link types present in the graph; only these are explained. */
  types: readonly string[]
}

/** A short sample of the line: dashed for generated links, with an arrowhead when the direction matters. */
function LineSample({ type }: { type: string }) {
  const arrow = DIRECTIONAL_LINK_TYPES.has(type)
  const dashed = type === 'implements'
  return (
    <svg
      width="34"
      height="10"
      viewBox="0 0 34 10"
      aria-hidden="true"
      className="shrink-0"
      data-testid="legend-line-sample"
    >
      <line
        x1="1"
        y1="5"
        x2={arrow ? 25 : 33}
        y2="5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      {arrow ? <polygon points="24,1.5 33,5 24,8.5" fill="currentColor" /> : null}
    </svg>
  )
}

function definitionFor(type: string): string {
  // eslint-disable-next-line security/detect-object-injection -- type is a link type from the cross-walk data, not user input
  return LINK_DEFINITIONS[type] ?? 'A recorded relationship between the two records.'
}

/**
 * Explains, in plain words, each kind of link drawn in the concept graph. The
 * link name is text, never colour alone; the line sample only shows direction
 * and whether the link is generated.
 */
export function ConceptLinkLegend({ types }: ConceptLinkLegendProps) {
  const present = new Set(types)
  const ordered = [
    ...LEGEND_ORDER.filter((t) => present.has(t)),
    ...[...present].filter((t) => !(LEGEND_ORDER as readonly string[]).includes(t)),
  ]
  if (ordered.length === 0) return null

  return (
    <section className="border-t border-border p-4 space-y-3" aria-label="Link types in this view">
      <h4 className="text-sm font-semibold">What the links mean</h4>
      <dl
        className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-[max-content_1fr]"
        data-testid="legend-list"
      >
        {ordered.map((type) => (
          <div key={type} className="flex flex-col gap-0.5 sm:contents">
            <dt className="flex items-center gap-2 font-medium text-foreground">
              <LineSample type={type} />
              <span>{type === 'implements' ? 'implements' : edgeLabelFor(type)}</span>
            </dt>
            <dd className="min-w-0 break-words text-muted-foreground">{definitionFor(type)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
