// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Page parts A to G (UX grammar v2.1, section 4.1). A page may leave a part out; it may never
 * replace a part with its own version. Parts H (record viewer) and I (related panel) are in
 * RecordViewer.tsx and RelatedPanel.tsx.
 *
 *   A PageHeader   B NoticeLine (FixedLines)   C PageTabBar   D LensBar
 *   E FilterRow    F RecordRow                 G ListFooter
 */
import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, type DateInput } from '@/lib/format'
import { StoryRow } from '@/components/storybook'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { FacetPill } from './FacetPill'
import { RoleButton } from './RoleButton'
import { verbLabel } from './verbs'

/* ------------------------------------------------------------------ A Header */

export interface Crumb {
  label: string
  href?: string
}

export interface PageHeaderProps {
  breadcrumb?: Crumb[]
  /** The one H1 of the page (Page title style; that class is owned by another branch). */
  title: string
  /** One line under the title. */
  summary?: string
  /** The count with its unit, from the knowledge file: "137 algorithms". */
  count?: { value: number; unit: string }
  /** "For you, <role>: what this means ▸" */
  forYou?: { role: string; content: React.ReactNode }
  /** Extra class for the title, so the page keeps the shared Page title style. */
  titleClassName?: string
  className?: string
}

export function PageHeader({
  breadcrumb,
  title,
  summary,
  count,
  forYou,
  titleClassName,
  className,
}: PageHeaderProps) {
  return (
    <header data-page-part="A" className={cn('flex flex-col gap-2', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="type-small text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumb.map((c, i) => (
              <li key={`${c.label}:${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} aria-hidden="true" />}
                {c.href ? (
                  <a href={c.href} className="underline underline-offset-2">
                    {c.label}
                  </a>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className={titleClassName}>{title}</h1>
      {summary && <p className="type-body text-muted-foreground">{summary}</p>}
      {count && (
        <p className="type-small text-muted-foreground" data-count>
          {count.value.toLocaleString('en-GB')} {count.unit}
        </p>
      )}
      {forYou && (
        <details className="type-small">
          <summary className="cursor-pointer font-semibold min-h-[24px]">
            For you, {forYou.role}: what this means
          </summary>
          <div className="pt-2">{forYou.content}</div>
        </details>
      )}
    </header>
  )
}

/* ------------------------------------------------------------------ C Tab bar */

export interface PageTab {
  /** The slug of the visible label (?tab=<slug>). */
  slug: string
  label: string
  /** Hidden when there is nothing to show; the others never reorder. */
  hidden?: boolean
  count?: number
}

export interface PageTabBarProps {
  tabs: PageTab[]
  /** The slug of the active tab. */
  value: string
  onChange: (slug: string) => void
  label: string
  className?: string
}

/** At most 6 tabs. `role="tablist"`: arrows, Home and End move; scrolls sideways on phones. */
export function PageTabBar({ tabs, value, onChange, label, className }: PageTabBarProps) {
  const visible = tabs.filter((t) => !t.hidden)
  if (import.meta.env.DEV && visible.length > 6)
    throw new Error('A page has at most 6 tabs (handoff 4.1, part C)')
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const move = (to: number) => {
    const t = visible[(to + visible.length) % visible.length]
    onChange(t.slug)
    refs.current[t.slug]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') move(index + 1)
    else if (e.key === 'ArrowLeft') move(index - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(visible.length - 1)
    else return
    e.preventDefault()
  }
  React.useEffect(() => {
    // refs is a ref object read at effect time, not render time

    refs.current[value]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [value])
  return (
    <div
      role="tablist"
      aria-label={label}
      data-page-part="C"
      className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}
    >
      {visible.map((t, i) => {
        const selected = t.slug === value
        return (
          // eslint-disable-next-line no-restricted-syntax -- a tab is not a Button: the tablist pattern needs role="tab" on the raw element
          <button
            key={t.slug}
            ref={(el) => {
              refs.current[t.slug] = el
            }}
            role="tab"
            type="button"
            id={`tab-${t.slug}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.slug)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'min-h-[44px] shrink-0 whitespace-nowrap px-4 type-button border-b-[3px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
              selected ? 'border-primary text-heading' : 'border-transparent text-muted-foreground'
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1 font-semibold">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ D Lens bar */

/** The five dimensions, in this order (I3). */
export const LENS_DIMENSIONS = [
  'NICE area',
  'Role',
  'Industry',
  'Geography',
  'Proficiency',
] as const
export type LensDimension = (typeof LENS_DIMENSIONS)[number]

export interface LensDimensionState {
  dimension: LensDimension
  options: string[]
  value: string | null
  /** The share of the page's records with no value for this dimension (0 to 100). Shown as "Not mapped (n%)". */
  notMappedPercent?: number
  /** Whether the page's records have this dimension at all. Without it the dimension shows only as Not mapped. */
  available: boolean
}

export interface LensBarProps {
  dimensions: LensDimensionState[]
  onChange: (dimension: LensDimension, value: string | null) => void
  className?: string
}

/** Only the dimensions the page's records have; the rest as a dashed "Not mapped (n%)" pill, never a badge on every card. */
export function LensBar({ dimensions, onChange, className }: LensBarProps) {
  const ordered = LENS_DIMENSIONS.map((d) => dimensions.find((x) => x.dimension === d)).filter(
    (x): x is LensDimensionState => x !== undefined
  )
  return (
    <div
      data-page-part="D"
      role="group"
      aria-label="Lens"
      className={cn('flex flex-wrap gap-x-4 gap-y-2', className)}
    >
      {ordered.map((d) =>
        d.available ? (
          <div key={d.dimension} className="flex items-center gap-2 type-small">
            <FilterDropdown
              label={d.dimension}
              items={d.options}
              selectedId={d.value ?? ''}
              onSelect={(id) => onChange(d.dimension, id || null)}
              defaultLabel="All"
            />
            {d.notMappedPercent ? (
              <span className="rounded-full border-[1.5px] border-dashed border-chip-mute-border px-2 py-0.5 type-chip text-chip-mute-fg">
                Not mapped ({d.notMappedPercent}%)
              </span>
            ) : null}
          </div>
        ) : (
          <span
            key={d.dimension}
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-dashed border-chip-mute-border px-3 py-1 type-chip text-chip-mute-fg"
          >
            {d.dimension}: Not mapped
            {d.notMappedPercent !== undefined ? ` (${d.notMappedPercent}%)` : ''}
          </span>
        )
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ E Filter row */

export interface FacetOption {
  slug: string
  label: string
  count?: number
}

export interface FilterRowProps {
  /** The page's one fixed facet key, for assistive technology and tests: "severity". */
  facetKey: string
  facets: FacetOption[]
  /** The active facet slug, or null for all. */
  value: string | null
  onFacetChange: (slug: string | null) => void
  search?: { value: string; onChange: (v: string) => void; label: string }
  /** The cards/table switch every catalog has. */
  view?: { value: 'cards' | 'table'; onChange: (v: 'cards' | 'table') => void }
  className?: string
}

export function FilterRow({
  facetKey,
  facets,
  value,
  onFacetChange,
  search,
  view,
  className,
}: FilterRowProps) {
  return (
    <div
      data-page-part="E"
      data-facet-key={facetKey}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      <div role="group" aria-label="Filter" className="flex flex-wrap items-center gap-2">
        {facets.map((f) => (
          <FacetPill
            key={f.slug}
            label={f.label}
            count={f.count}
            pressed={value === f.slug}
            onToggle={(next) => onFacetChange(next ? f.slug : null)}
          />
        ))}
      </div>
      {search && (
        <input
          type="search"
          aria-label={search.label}
          placeholder={search.label}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className="min-h-[44px] max-md:text-base rounded-full border-2 border-ink bg-card px-4 type-small"
        />
      )}
      {view && (
        <div role="group" aria-label="View" className="ml-auto flex gap-1">
          <FacetPill
            label="Cards"
            pressed={view.value === 'cards'}
            onToggle={() => view.onChange('cards')}
          />
          <FacetPill
            label="Table"
            pressed={view.value === 'table'}
            onToggle={() => view.onChange('table')}
          />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ F Record row */

export interface RecordRowProps {
  /** The record's tag: the single ID. */
  tag: string
  title: string
  /** Shown when the title was taken from the summary (D2): "title taken from the summary". */
  titleFromSummary?: boolean
  /** The two-field meta line: ["Issued by NIST", "Published 2024"]. */
  meta?: string[]
  /** The status chip(s) at the end of the row. */
  chips?: React.ReactNode
  /** Opens the viewer. The whole row is the control. */
  onOpen: (tag: string) => void
  /** Marks the row whose record is open. */
  selected?: boolean
  className?: string
}

/** The whole row opens the viewer: Enter or click. Rows keep `data-record-tag` so focus can return to them. */
export function RecordRow({
  tag,
  title,
  titleFromSummary,
  meta,
  chips,
  onOpen,
  selected,
  className,
}: RecordRowProps) {
  return (
    <StoryRow
      as="li"
      data-page-part="F"
      data-record-tag={tag}
      role="button"
      tabIndex={0}
      aria-label={`${verbLabel('open')} ${title}`}
      aria-current={selected ? 'true' : undefined}
      onClick={() => onOpen(tag)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onOpen(tag)
        }
      }}
      tone={selected ? 'highlight' : 'default'}
      className={cn(
        'flex min-h-[44px] cursor-pointer items-center justify-between gap-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
        className
      )}
    >
      <div className="min-w-0">
        <p className="type-body font-semibold break-words">
          {title}
          {titleFromSummary && (
            <span className="type-small font-normal text-muted-foreground">
              {' '}
              (title from the summary)
            </span>
          )}
        </p>
        {meta && meta.length > 0 && (
          <p className="type-small text-muted-foreground">{meta.slice(0, 2).join(' · ')}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {chips}
        <ChevronRight size={16} aria-hidden="true" />
      </div>
    </StoryRow>
  )
}

/* ------------------------------------------------------------------ G List footer */

export interface ListFooterProps {
  /** How many are showing. */
  shown: number
  /** The true total (never the visible count). */
  total: number
  onShowMore?: () => void
  className?: string
}

/** "Showing 1–25 of <true total>" and Show 25 more. */
export function ListFooter({ shown, total, onShowMore, className }: ListFooterProps) {
  const first = total === 0 ? 0 : 1
  return (
    <div
      data-page-part="G"
      className={cn('flex flex-wrap items-center justify-between gap-2', className)}
    >
      <p className="type-small text-muted-foreground" aria-live="polite">
        Showing {first.toLocaleString('en-GB')}–{Math.min(shown, total).toLocaleString('en-GB')} of{' '}
        {total.toLocaleString('en-GB')}
      </p>
      {shown < total && onShowMore && (
        <RoleButton onClick={onShowMore}>{verbLabel('showMore')}</RoleButton>
      )}
    </div>
  )
}

/** A date for a row meta line, in the shared form. */
export const metaDate = (label: string, d: DateInput | null | undefined) =>
  d === null || d === undefined ? `${label} not recorded` : `${label} ${formatDate(d, 'day')}`
