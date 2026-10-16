// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import { RESEARCH_FIELD_BUCKETS } from '@/data/researchFieldTaxonomy'
import { RESEARCH_TOPICS, RESEARCH_TOPIC_TAGS_PENDING_NOTE } from '@/data/researchTopics'
import {
  computeResearchFieldWatch,
  loadFieldWatchCorpus,
  FIELD_WATCH_WINDOW_DAYS,
} from '@/data/researchFieldWatch'
import { PERSONA_JOURNEY_BOARD } from '@/data/personaConfig'
import { formatVerifiedDate } from '@/data/personaBoardLiveMetrics'

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
 * Wired into `PersonaBoardView`'s `customSideCard` slot by `LandingView.tsx`,
 * researcher only.
 *
 * WHAT IS COMPUTED VS WHAT IS MAINTAINED (changed 2026-08-02). Only the
 * NUMBERS are computed here. The title, punchline, footnote and empty-state
 * copy are read from `PERSONA_JOURNEY_BOARD.researcher.sideCard`, i.e. from
 * `role_board_content_*.csv`, like every other board's copy.
 *
 * That split is the fix for a real defect, not a preference. Because this
 * component swapped out the whole CSV-driven side card and hardcoded its own
 * strings, its copy was invisible to the role-board editorial review — so the
 * pass that caught and reworded a developer-facing `track_note` two rows away
 * in the same CSV could not see this card's footnote, which had exactly the
 * same problem, or its punchline, which asserted "Nothing you cited has been
 * retracted" about a citation list the app does not have.
 */

const FIELD_OPTIONS: FilterDropdownItem[] = RESEARCH_FIELD_BUCKETS.map((b) => ({
  id: b.id,
  label: b.label,
}))

const TOPIC_OPTIONS: FilterDropdownItem[] = RESEARCH_TOPICS.map((t) => ({
  id: t.id,
  label: t.label,
}))

/** The card shows at most this many followed-field rows (design mockup shows 3). */
const MAX_VISIBLE_FIELDS = 3

/** Static copy for this card, maintained in `role_board_content_*.csv`. */
const SIDE_CARD = PERSONA_JOURNEY_BOARD.researcher.sideCard

export function ResearcherFieldWatchCard() {
  const followedFields = useResearchFieldsStore((s) => s.followedFields)
  const followedTopics = useResearchFieldsStore((s) => s.followedTopics)
  const toggleFollowedField = useResearchFieldsStore((s) => s.toggleFollowedField)
  const toggleFollowedTopic = useResearchFieldsStore((s) => s.toggleFollowedTopic)

  const [showPicker, setShowPicker] = useState(
    followedFields.length === 0 && followedTopics.length === 0
  )

  const corpus = loadFieldWatchCorpus()
  const topicsTagged = corpus.topicTaggedCount > 0

  const summary = useMemo(
    () =>
      computeResearchFieldWatch(followedFields, corpus.windowStartMs, corpus.rows, followedTopics),
    [followedFields, followedTopics, corpus]
  )

  const releaseLabel =
    corpus.releaseDateMs === null
      ? null
      : formatVerifiedDate(new Date(corpus.releaseDateMs).toISOString().slice(0, 10))

  // Topic rows only count once the Library carries topic tags; until then a
  // followed topic is listed under the pending note instead of as a 0.
  const countedRows = topicsTagged ? [...summary.fields, ...summary.topics] : summary.fields
  const visibleFields = countedRows.slice(0, MAX_VISIBLE_FIELDS)
  const hasFollowedFields = followedFields.length > 0 || followedTopics.length > 0
  const hasCountedSelection =
    followedFields.length > 0 || (topicsTagged && followedTopics.length > 0)
  const topicsPending = !topicsTagged && followedTopics.length > 0

  function syncSelection(nextIds: string[], current: string[], toggle: (id: string) => void) {
    const next = new Set(nextIds)
    const now = new Set(current)
    for (const id of next) if (!now.has(id)) toggle(id)
    for (const id of now) if (!next.has(id)) toggle(id)
  }

  return (
    <div
      className="glass-panel flex h-full flex-col gap-3 border-primary/40 bg-primary/5 p-5"
      data-testid="field-watch-card"
    >
      <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Illustrative — this user&rsquo;s inputs
      </span>

      <div>
        <h2 className="text-lg font-bold text-primary">{SIDE_CARD.title}</h2>
        {releaseLabel && (
          <p className="text-xs text-muted-foreground" data-testid="field-watch-window">
            In the {FIELD_WATCH_WINDOW_DAYS} days to {releaseLabel}
          </p>
        )}
      </div>

      {topicsPending && (
        <p className="text-xs text-muted-foreground" data-testid="field-watch-topics-pending">
          {RESEARCH_TOPIC_TAGS_PENDING_NOTE}
        </p>
      )}

      {hasCountedSelection ? (
        <dl className="flex flex-col gap-2">
          {visibleFields.map((field) => (
            <div
              key={field.fieldId}
              className="flex items-baseline justify-between gap-3 text-sm"
              data-testid="field-watch-row"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="text-right font-semibold text-foreground">
                {field.revisionCount} published or revised in window
              </dd>
            </div>
          ))}

          {/* Label is scoped to the followed fields, matching what the number
              actually counts. It read "Corpus deprecated" until 2026-08-02,
              which promised a corpus-wide total the value never was. */}
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">Retracted in your fields</dt>
            <dd
              className="text-right font-semibold text-foreground"
              data-testid="corpus-deprecated"
            >
              {summary.totalDeprecatedInWindow > 0
                ? `-${summary.totalDeprecatedInWindow} docs`
                : '0 docs'}
            </dd>
          </div>
        </dl>
      ) : (
        !hasFollowedFields && (
          <p className="text-sm text-muted-foreground">{SIDE_CARD.emptyState}</p>
        )
      )}

      {hasCountedSelection && (
        <p className="mt-1 text-base font-bold text-foreground" data-testid="field-watch-punchline">
          {summary.nothingRetracted
            ? SIDE_CARD.punchline
            : `${summary.totalDeprecatedInWindow} document${
                summary.totalDeprecatedInWindow === 1 ? '' : 's'
              } in the fields you follow ${
                summary.totalDeprecatedInWindow === 1 ? 'was' : 'were'
              } retracted.`}
        </p>
      )}

      {SIDE_CARD.footnote && (
        <p className="text-xs leading-relaxed text-muted-foreground">{SIDE_CARD.footnote}</p>
      )}

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
          {corpus.otherShare.total > 0 && (
            <p className="mb-2 text-xs text-muted-foreground" data-testid="field-watch-other-share">
              {corpus.otherShare.percent}% of the {corpus.otherShare.total.toLocaleString('en-US')}{' '}
              active documents ({corpus.otherShare.other.toLocaleString('en-US')}) have no
              recognised algorithm family and count under Other / Uncategorized.
            </p>
          )}
          <p className="mb-1 text-xs font-semibold text-foreground">Algorithm families</p>
          <FilterDropdown
            items={FIELD_OPTIONS}
            selectedId=""
            onSelect={() => {}}
            multiSelectedIds={followedFields}
            onMultiSelect={(ids) => syncSelection(ids, followedFields, toggleFollowedField)}
            defaultLabel="Choose fields to follow"
            searchable
          />

          <div className="mt-3" data-testid="field-watch-topic-group">
            <p className="mb-1 text-xs font-semibold text-foreground">Research topics</p>
            {topicsTagged ? (
              <FilterDropdown
                items={TOPIC_OPTIONS}
                selectedId=""
                onSelect={() => {}}
                multiSelectedIds={followedTopics}
                onMultiSelect={(ids) => syncSelection(ids, followedTopics, toggleFollowedTopic)}
                defaultLabel="Choose topics to follow"
                searchable
              />
            ) : (
              <p className="text-xs text-muted-foreground" data-testid="field-watch-topic-note">
                {RESEARCH_TOPIC_TAGS_PENDING_NOTE}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
