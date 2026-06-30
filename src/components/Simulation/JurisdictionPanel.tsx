// SPDX-License-Identifier: GPL-3.0-only
/**
 * JurisdictionPanel — the Simulation's per-country compliance rule. The country
 * dial drives which migration choice (hybrid vs pure) is compliant, not just
 * the deadline. Shows the authority's stance and how each choice scores.
 *
 * For fully-curated countries (hybrid + endState + note): shows authority,
 * stance recommendation, note, and compliance chips for each choice.
 * For partially-curated countries like India (authority + note, no stance):
 * shows a factual authority summary without compliance verdict chips.
 */
import {
  jurisdictionFor,
  recommendedChoice,
  checkChoice,
  type MigChoice,
} from '@/data/jurisdiction'
import { JURISDICTION_AUTHORITY_NOTE } from '@/data/jurisdictionsData'
import type { SimSize } from '@/data/moscaClock'

const LEVEL_CHIP: Record<string, string> = {
  ok: 'bg-status-success/15 text-status-success',
  warn: 'bg-status-warning/15 text-status-warning',
  fail: 'bg-status-error/15 text-status-error',
}
const LEVEL_MARK: Record<string, string> = { ok: '✓', warn: '⚠', fail: '✗' }

export function JurisdictionPanel({ country, size }: { country: string; size: SimSize }) {
  const rule = jurisdictionFor(country)

  // Partially-curated: has authority + note but no published hybrid/endState ruling.
  if (!rule) {
    const partial = JURISDICTION_AUTHORITY_NOTE[country]
    if (!partial) return null
    return (
      <div className="rounded-lg border border-border bg-card/40 p-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Jurisdiction — {partial.authority}
        </h2>
        <p className="text-sm text-muted-foreground">{partial.note}</p>
        <p className="mt-2 text-xs text-muted-foreground/60">
          No published hybrid/pure-end-state ruling yet — stance chips are omitted until guidance is
          formally verified.
        </p>
      </div>
    )
  }

  const choices: MigChoice[] = ['hybrid', 'pure', 'classical']

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Jurisdiction — {rule.authority}</h2>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          Migrate as: {recommendedChoice(rule)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{rule.note}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {choices.map((c) => {
          const v = checkChoice(country, c)
          return (
            <span
              key={c}
              title={v.reason}
              className={`rounded px-2 py-0.5 text-xs font-medium ${LEVEL_CHIP[v.level]}`}
            >
              {LEVEL_MARK[v.level]} {c}
            </span>
          )
        })}
      </div>

      {size === 'global' && (
        <p className="mt-2 text-xs text-muted-foreground">
          Global estate spans jurisdictions — cross-region links must satisfy the strictest (hybrid
          wherever any region requires it).
        </p>
      )}
    </div>
  )
}
