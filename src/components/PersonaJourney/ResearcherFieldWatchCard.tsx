// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import { RESEARCH_FIELD_BUCKETS } from '@/data/researchFieldTaxonomy'
import { computeResearchFieldWatch, loadFieldWatchRows } from '@/data/researchFieldWatch'

/**
 * ResearcherFieldWatchCard — the real, live-computed replacement for the
 * Researcher board's stub side card (`PERSONA_JOURNEY_BOARD.researcher.sideCard`
 * in `personaConfig.ts`), per IMPLEMENTATION-PLAN-2026-08-01.md §6.
 *
 * Matches the same tone-tinted side-card visual pattern used everywhere else
 * on the board (`PersonaBoardView.tsx`'s default side card: `glass-panel`,
 * border/bg tinted by tone, a provenance chip, a title, label/value rows, a
 * punchline) — tone is fixed to `info` (→ `text-primary`/`bg-primary`, NOT
 * `text-status-info`; see IMPLEMENTATION-PLAN-2026-08-01.md §5 on why the
 * design's "info/cyan" is the same hue as `--primary`, a different token from
 * the hub's actual `--info` blue) and provenance is fixed to `illustrative`
 * (this card runs on the researcher's OWN followed-fields selection applied
 * to real corpus data — not a fixed, citable corpus fact like the other
 * "sourced" side cards on this board).
 *
 * NOT wired into `PersonaBoardView`'s `customSideCard` slot by this file —
 * that integration happens in a later phase (per the task scope). This file
 * only builds and exports the card.
 */

const FIELD_OPTIONS: FilterDropdownItem[] = RESEARCH_FIELD_BUCKETS.map((b) => ({
  id: b.id,
  label: b.label,
}))

/** The card shows at most this many followed-field rows (design mockup shows 3). */
const MAX_VISIBLE_FIELDS = 3

export function ResearcherFieldWatchCard() {
  const followedFields = useResearchFieldsStore((s) => s.followedFields)
  const lastVisitedAtLive = useResearchFieldsStore((s) => s.lastVisitedAt)
  const toggleFollowedField = useResearchFieldsStore((s) => s.toggleFollowedField)
  const markVisited = useResearchFieldsStore((s) => s.markVisited)

  // Capture the visit boundary from the PREVIOUS visit, once, at first render —
  // before `markVisited()` (below) overwrites the store's `lastVisitedAt` with
  // "now". Using the live store value directly here would flash real counts on
  // first paint and then immediately zero them out once the mount effect fires
  // and this component re-renders. The lazy initializer runs exactly once.
  const [visitBoundary] = useState<number | null>(() => lastVisitedAtLive)

  const [showPicker, setShowPicker] = useState(followedFields.length === 0)

  useEffect(() => {
    markVisited()
    // Intentionally run once on mount only — see `visitBoundary` note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = useMemo(() => {
    const rows = loadFieldWatchRows()
    return computeResearchFieldWatch(followedFields, visitBoundary, rows)
  }, [followedFields, visitBoundary])

  const visibleFields = summary.fields.slice(0, MAX_VISIBLE_FIELDS)
  const hasFollowedFields = followedFields.length > 0

  function handleMultiSelect(nextIds: string[]) {
    const next = new Set(nextIds)
    const current = new Set(followedFields)
    for (const id of next) if (!current.has(id)) toggleFollowedField(id)
    for (const id of current) if (!next.has(id)) toggleFollowedField(id)
  }

  return (
    <div
      className="glass-panel flex h-full flex-col gap-3 border-primary/40 bg-primary/5 p-5"
      data-testid="field-watch-card"
    >
      <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Illustrative — this user&rsquo;s inputs
      </span>

      <h2 className="text-lg font-bold text-primary">
        Changed in your fields since your last visit
      </h2>

      {hasFollowedFields ? (
        <dl className="flex flex-col gap-2">
          {visibleFields.map((field) => (
            <div
              key={field.fieldId}
              className="flex items-baseline justify-between gap-3 text-sm"
              data-testid="field-watch-row"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="text-right font-semibold text-foreground">
                {field.revisionCount} revision{field.revisionCount === 1 ? '' : 's'}
              </dd>
            </div>
          ))}

          <div className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">Corpus deprecated</dt>
            <dd
              className="text-right font-semibold text-foreground"
              data-testid="corpus-deprecated"
            >
              {summary.totalDeprecatedSinceVisit > 0
                ? `-${summary.totalDeprecatedSinceVisit} docs`
                : '0 docs'}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pick a few fields below to start tracking what changes in the corpus between visits.
        </p>
      )}

      {hasFollowedFields && (
        <p className="mt-1 text-base font-bold text-foreground" data-testid="field-watch-punchline">
          {summary.nothingRetracted
            ? 'Nothing you cited has been retracted.'
            : `${summary.totalDeprecatedSinceVisit} document${
                summary.totalDeprecatedSinceVisit === 1 ? '' : 's'
              } in your followed fields ${
                summary.totalDeprecatedSinceVisit === 1 ? 'has' : 'have'
              } been retracted since your last visit.`}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Compares each followed field&rsquo;s most recent library revision date against your last
        visit; deprecations count a document status flip, applied to your own field selection — not
        a per-user citation list (this app doesn&rsquo;t have one).
      </p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker((v) => !v)}
          className="gap-1.5 px-2 text-xs text-muted-foreground"
          aria-expanded={showPicker}
        >
          <Settings2 size={14} aria-hidden="true" />
          Edit your fields
        </Button>
      </div>

      {showPicker && (
        <div className="border-t border-border pt-3">
          <FilterDropdown
            items={FIELD_OPTIONS}
            selectedId=""
            onSelect={() => {}}
            multiSelectedIds={followedFields}
            onMultiSelect={handleMultiSelect}
            defaultLabel="Choose fields to follow"
            searchable
          />
        </div>
      )}
    </div>
  )
}
