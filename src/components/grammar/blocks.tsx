// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The 12 section blocks (UX grammar v2.1, section 4.2). A tab is an ordered stack of these; a
 * page never gets a block of its own. Every block is wrapped in a BlockFrame, so it has the four
 * states (loading, empty, error, partial) and keeps its heading.
 *
 *  1 RecordList   2 DataTable     3 CompareBlock   4 StatTiles    5 ChartPanel   6 CardGrid
 *  7 AccordionGroup  8 TimelineLanes  9 WizardStep  10 Workbench   11 ProseBlock  12 StepStrip
 */
import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumberOrMissing } from '@/lib/format'
import { StickerCard } from '@/components/storybook'
import { BlockFrame, type BlockStateProps } from './BlockFrame'
import { RecordRow, ListFooter, type RecordRowProps } from './parts'
import { RoleButton } from './RoleButton'
import { verbLabel } from './verbs'

type BlockBase = BlockStateProps & { title: string; hideTitle?: boolean; className?: string }

/* ------------------------------------------------------------------ 1 Record list */

export interface RecordListProps<T> extends BlockBase {
  rows: T[]
  /** The true total of records, not the rows loaded. Defaults to rows.length. */
  total?: number
  /** Maps a row to its Record row (F) props, without onOpen. */
  toRow: (row: T) => Omit<RecordRowProps, 'onOpen' | 'selected'>
  onOpen: (tag: string) => void
  /** The open record's tag, to mark its row. */
  openTag?: string | null
  /** 25 at a time. */
  pageSize?: number
}

export function RecordList<T>({
  rows,
  total,
  toRow,
  onOpen,
  openTag,
  pageSize = 25,
  ...frame
}: RecordListProps<T>) {
  const [shown, setShown] = React.useState(pageSize)
  const visible = rows.slice(0, shown)
  return (
    <BlockFrame {...frame} status={frame.status ?? (rows.length === 0 ? 'empty' : 'ready')}>
      <ul className="flex flex-col gap-2">
        {visible.map((r) => {
          const p = toRow(r)
          return <RecordRow key={p.tag} {...p} onOpen={onOpen} selected={openTag === p.tag} />
        })}
      </ul>
      <ListFooter
        shown={visible.length}
        total={total ?? rows.length}
        onShowMore={() => setShown((n) => n + pageSize)}
      />
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 2 Data table */

export interface DataColumn<T> {
  key: string
  header: string
  /** Cell content; defaults to String(row[key]). */
  render?: (row: T) => React.ReactNode
  /** Numeric columns: missing data shows one of the four labels and sorts last. */
  numeric?: boolean
  /** On a phone the row becomes a card: `title`, then two `meta` fields, then the `status` chip. */
  phone?: 'title' | 'meta' | 'status'
}

export interface DataTableProps<T> extends BlockBase {
  columns: DataColumn<T>[]
  rows: T[]
  getTag: (row: T) => string
  onOpen: (tag: string) => void
  openTag?: string | null
}

const cell = <T,>(col: DataColumn<T>, row: T): React.ReactNode => {
  if (col.render) return col.render(row)
  const v = (row as Record<string, unknown>)[col.key]
  return col.numeric ? formatNumberOrMissing(v) : v === null || v === undefined ? '' : String(v)
}

/** Sticky header; every row focusable and opens the viewer; below 768 px the rows are record cards. */
export function DataTable<T>({
  columns,
  rows,
  getTag,
  onOpen,
  openTag,
  ...frame
}: DataTableProps<T>) {
  const phone = (role: 'title' | 'meta' | 'status') => columns.filter((c) => c.phone === role)
  return (
    <BlockFrame {...frame} status={frame.status ?? (rows.length === 0 ? 'empty' : 'ready')}>
      <div className="hidden md:block max-h-[70vh] overflow-auto rounded-2xl border border-border">
        <table className="w-full type-small">
          <thead className="sticky top-0 bg-card">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className="type-eyebrow px-3 py-2 text-left">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tag = getTag(r)
              return (
                <tr
                  key={tag}
                  tabIndex={0}
                  data-record-tag={tag}
                  aria-current={openTag === tag ? 'true' : undefined}
                  onClick={() => onOpen(tag)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onOpen(tag)
                  }}
                  className="cursor-pointer border-t border-border hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring focus-visible:outline-solid"
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 align-top">
                      {cell(c, r)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((r) => {
          const tag = getTag(r)
          return (
            <RecordRow
              key={tag}
              tag={tag}
              title={
                phone('title')
                  .map((c) => String(cell(c, r) ?? ''))
                  .join(' ') || tag
              }
              meta={phone('meta')
                .slice(0, 2)
                .map((c) => `${c.header} ${String(cell(c, r) ?? '')}`)}
              chips={phone('status').map((c) => (
                <span key={c.key}>{cell(c, r)}</span>
              ))}
              onOpen={onOpen}
              selected={openTag === tag}
            />
          )
        })}
      </ul>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 3 Compare */

export interface CompareColumn {
  id: string
  title: string
  values: Record<string, React.ReactNode | number | null | undefined>
}

export interface CompareBlockProps extends BlockBase {
  /** The rows of the comparison. */
  fields: { key: string; label: string; numeric?: boolean }[]
  /** Up to 3 columns; the URL holds them in ?compare=. */
  columns: CompareColumn[]
  onRemove: (id: string) => void
}

export function CompareBlock({ fields, columns, onRemove, ...frame }: CompareBlockProps) {
  const cols = columns.slice(0, 3)
  return (
    <BlockFrame
      {...frame}
      status={frame.status ?? (cols.length === 0 ? 'empty' : 'ready')}
      emptyThing="records to compare"
    >
      <div className="overflow-x-auto">
        <table className="w-full type-small">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Field
              </th>
              {cols.map((c) => (
                <th key={c.id} scope="col" className="px-3 py-2 text-left">
                  <span className="type-body font-semibold">{c.title}</span>{' '}
                  <RoleButton
                    emphasis="quiet"
                    dense
                    onClick={() => onRemove(c.id)}
                    aria-label={`Remove ${c.title}`}
                  >
                    Remove
                  </RoleButton>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-t border-border">
                <th scope="row" className="type-eyebrow px-3 py-2 text-left">
                  {f.label}
                </th>
                {cols.map((c) => {
                  const v = c.values[f.key]
                  return (
                    <td key={c.id} className="px-3 py-2">
                      {f.numeric || typeof v === 'number' ? formatNumberOrMissing(v) : (v ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 4 Stat tiles */

export interface StatTile {
  id: string
  label: string
  value: string
  hint?: string
  /** A tile that filters is a button linking to the list it counts. */
  onSelect?: () => void
  pressed?: boolean
}

export interface StatTilesProps extends BlockBase {
  tiles: StatTile[]
}

/** 4 across, 2 on a phone. */
export function StatTiles({ tiles, ...frame }: StatTilesProps) {
  return (
    <BlockFrame {...frame} hideTitle={frame.hideTitle ?? true}>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => {
          const inner = (
            <>
              <span className="type-eyebrow">{t.label}</span>
              <span className="type-section-title">{t.value}</span>
              {t.hint && <span className="type-small text-muted-foreground">{t.hint}</span>}
            </>
          )
          return (
            <li key={t.id}>
              {t.onSelect ? (
                // eslint-disable-next-line no-restricted-syntax -- the whole tile is the control
                <button
                  type="button"
                  aria-pressed={t.pressed}
                  onClick={t.onSelect}
                  className="flex min-h-[44px] w-full flex-col items-start gap-1 rounded-2xl border border-border bg-card p-3 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid aria-pressed:border-highlight-border aria-pressed:bg-highlight"
                >
                  {inner}
                </button>
              ) : (
                <div className="flex w-full flex-col items-start gap-1 rounded-2xl border border-border bg-card p-3">
                  {inner}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 5 Chart panel */

export interface ChartPanelProps extends BlockBase {
  /** The drawn chart. */
  children: React.ReactNode
  /** The same data as a real table; "Show as table" swaps it in. */
  table: { columns: string[]; rows: (string | number)[][] }
  /** The source line under the chart. */
  source: string
  /** On a phone the chart becomes horizontal bars with their values. */
  bars?: { label: string; value: number }[]
}

export function ChartPanel({ children, table, source, bars, ...frame }: ChartPanelProps) {
  const [asTable, setAsTable] = React.useState(false)
  const max = Math.max(1, ...(bars ?? []).map((b) => b.value))
  return (
    <BlockFrame {...frame}>
      <div className="flex justify-end">
        <RoleButton
          emphasis="quiet"
          dense
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {asTable ? 'Show as chart' : 'Show as table'}
        </RoleButton>
      </div>
      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full type-small">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c} scope="col" className="type-eyebrow px-3 py-2 text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((v, j) => (
                    <td key={j} className="px-3 py-2">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className={cn(bars && 'max-md:hidden')}>{children}</div>
          {bars && (
            <ul className="flex flex-col gap-2 md:hidden" aria-label="Values">
              {bars.map((b) => (
                <li key={b.label} className="type-small">
                  <div className="flex justify-between">
                    <span>{b.label}</span>
                    <span className="font-semibold">{b.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(b.value / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="type-small text-muted-foreground">{source}</p>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 6 Card grid */

export interface GridCard {
  id: string
  title: string
  body?: React.ReactNode
  chips?: React.ReactNode
  /** One action per card. */
  action: { label: string; onClick?: () => void; href?: string }
}

export interface CardGridProps extends BlockBase {
  cards: GridCard[]
}

/** StickerCard cards, one action each; one column on a phone. */
export function CardGrid({ cards, ...frame }: CardGridProps) {
  return (
    <BlockFrame
      {...frame}
      status={frame.status ?? (cards.length === 0 ? 'empty' : 'ready')}
      emptyThing="cards"
    >
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <StickerCard as="li" key={c.id} className="flex flex-col gap-2">
            <h4 className="type-block-title">{c.title}</h4>
            {c.chips}
            {c.body && <div className="type-body">{c.body}</div>}
            <div className="mt-auto pt-2">
              {c.action.href ? (
                <a
                  href={c.action.href}
                  className="type-button text-primary-legible underline underline-offset-4 min-h-[44px] inline-flex items-center"
                >
                  {c.action.label}
                </a>
              ) : (
                <RoleButton onClick={c.action.onClick}>{c.action.label}</RoleButton>
              )}
            </div>
          </StickerCard>
        ))}
      </ul>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 7 Accordion group */

export interface AccordionItem {
  id: string
  title: React.ReactNode
  content: React.ReactNode
}

export interface AccordionGroupProps extends BlockBase {
  items: AccordionItem[]
  /** Closed by default. */
  defaultOpenId?: string | null
}

/** Header buttons with aria-expanded; one open at a time. */
export function AccordionGroup({ items, defaultOpenId = null, ...frame }: AccordionGroupProps) {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId)
  const base = React.useId()
  return (
    <BlockFrame
      {...frame}
      status={frame.status ?? (items.length === 0 ? 'empty' : 'ready')}
      emptyThing="items"
    >
      <div className="flex flex-col">
        {items.map((it) => {
          const open = openId === it.id
          return (
            <div key={it.id} className="border-b border-border">
              <h4>
                {/* eslint-disable-next-line no-restricted-syntax -- the whole row is the control */}
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`${base}-${it.id}`}
                  onClick={() => setOpenId(open ? null : it.id)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 py-2 text-left type-body font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
                >
                  {it.title}
                  <span aria-hidden="true">{open ? '▴' : '▾'}</span>
                </button>
              </h4>
              <div id={`${base}-${it.id}`} role="region" hidden={!open} className="pb-3">
                {it.content}
              </div>
            </div>
          )
        })}
      </div>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 8 Timeline lanes */

export interface LaneItem {
  id: string
  label: string
  /** YYYY or YYYY-MM from the record; null when the record holds no structured date. */
  date: string | null
  tag?: string
}

export interface TimelineLane {
  id: string
  label: string
  items: LaneItem[]
}

export interface TimelineLanesProps extends BlockBase {
  lanes: TimelineLane[]
  onOpen?: (tag: string) => void
}

/** Dated items on lanes; undated items under "No structured date recorded"; a phone shows one row per lane with its count. */
export function TimelineLanes({ lanes, onOpen, ...frame }: TimelineLanesProps) {
  const all = lanes.flatMap((l) => l.items)
  const undated = all.filter((i) => i.date === null)
  const item = (i: LaneItem) =>
    i.tag && onOpen ? (
      <RoleButton key={i.id} emphasis="quiet" dense onClick={() => onOpen(i.tag!)}>
        {i.label}
      </RoleButton>
    ) : (
      <span key={i.id}>{i.label}</span>
    )
  return (
    <BlockFrame
      {...frame}
      status={frame.status ?? (all.length === 0 ? 'empty' : 'ready')}
      emptyThing="dates"
    >
      <ul className="flex flex-col gap-2">
        {lanes.map((l) => {
          const dated = l.items
            .filter((i) => i.date !== null)
            .sort((a, b) => a.date!.localeCompare(b.date!))
          return (
            <li
              key={l.id}
              data-lane={l.id}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <p className="type-eyebrow">
                {l.label} <span className="md:hidden">({dated.length})</span>
              </p>
              <ol className="mt-1 flex flex-wrap gap-x-3 gap-y-1 max-md:hidden">
                {dated.map((i) => (
                  <li key={i.id} className="type-small">
                    <span className="font-semibold">{i.date}</span> {item(i)}
                  </li>
                ))}
              </ol>
            </li>
          )
        })}
      </ul>
      {undated.length > 0 && (
        <div data-undated>
          <h4 className="type-block-title">No structured date recorded</h4>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 type-small">
            {undated.map((i) => (
              <li key={i.id}>{item(i)}</li>
            ))}
          </ul>
        </div>
      )}
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 9 Wizard step */

export interface WizardOption {
  value: string
  label: string
}

export interface WizardStepProps extends BlockBase {
  step: number
  total: number
  question: string
  options: WizardOption[]
  /** The chosen value; Continue is disabled until one is chosen. Back keeps the answer. */
  value: string | null
  onChange: (value: string) => void
  onContinue: () => void
  onBack?: () => void
  /** The last step says Finish. */
  last?: boolean
}

export function WizardStep({
  step,
  total,
  question,
  options,
  value,
  onChange,
  onContinue,
  onBack,
  last,
  ...frame
}: WizardStepProps) {
  const name = React.useId()
  return (
    <BlockFrame {...frame}>
      <p className="type-eyebrow">
        Step {step} of {total}
      </p>
      <fieldset className="flex flex-col gap-2">
        <legend className="type-body font-semibold mb-2">{question}</legend>
        <div role="radiogroup" aria-label={question} className="flex flex-col gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 has-[:checked]:border-highlight-border has-[:checked]:bg-highlight has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid"
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              <span className="type-body">{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        {onBack && step > 1 && <RoleButton onClick={onBack}>{verbLabel('back')}</RoleButton>}
        <RoleButton emphasis="primary" disabled={value === null} onClick={onContinue}>
          {last ? verbLabel('finish') : verbLabel('continue')}
        </RoleButton>
      </div>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 10 Workbench */

export interface WorkbenchProps extends BlockBase {
  /** Setup and inputs (T5). */
  controls: React.ReactNode
  /** The Run bar (T6): the next operation, primary. On a phone it sits next to the command. */
  run: React.ReactNode
  /** The instrument: output, log, panels. */
  instrument: React.ReactNode
}

/** Controls, Run and instrument together; one column below 900 px of content width. */
export function Workbench({ controls, run, instrument, ...frame }: WorkbenchProps) {
  return (
    <BlockFrame {...frame}>
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @[900px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-3" data-workbench="controls">
            {controls}
            <div data-workbench="run">{run}</div>
          </div>
          <div className="flex min-w-0 flex-col gap-3" data-workbench="instrument">
            {instrument}
          </div>
        </div>
      </div>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 11 Prose */

export interface ProseSection {
  /** The slug of the heading: the #anchor. */
  id: string
  heading: string
  body: React.ReactNode
}

export interface ProseBlockProps extends BlockBase {
  sections: ProseSection[]
}

/** A contents rail (a details sheet on phones), `#slug` anchors and a reading column. */
export function ProseBlock({ sections, ...frame }: ProseBlockProps) {
  const toc = (
    <ol className="flex flex-col gap-1 type-small">
      {sections.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="underline underline-offset-2">
            {s.heading}
          </a>
        </li>
      ))}
    </ol>
  )
  return (
    <BlockFrame {...frame}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Contents" className="md:sticky md:top-4 md:self-start">
          <details className="md:hidden">
            <summary className="min-h-[44px] cursor-pointer type-body font-semibold">
              Contents
            </summary>
            {toc}
          </details>
          <div className="max-md:hidden">{toc}</div>
        </nav>
        <div className="max-w-[72ch]">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mb-6">
              <h4 id={`${s.id}-h`} className="type-section-title mb-2">
                {s.heading}
              </h4>
              <div className="type-body">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </BlockFrame>
  )
}

/* ------------------------------------------------------------------ 12 Step strip */

export interface StripStep {
  id: string
  label: string
  count?: number
}

export interface StepStripProps {
  steps: StripStep[]
  /** The current step's id: highlighted. */
  currentId: string
  /** Completed steps carry a tick. */
  doneIds?: string[]
  onSelect?: (id: string) => void
  label: string
  className?: string
}

/** Numbered stages with counts; the current one highlighted; ticks on completed ones. */
export function StepStrip({
  steps,
  currentId,
  doneIds = [],
  onSelect,
  label,
  className,
}: StepStripProps) {
  return (
    <ol aria-label={label} data-block="12" className={cn('flex gap-2 overflow-x-auto', className)}>
      {steps.map((s, i) => {
        const current = s.id === currentId
        const done = doneIds.includes(s.id)
        const body = (
          <>
            <span aria-hidden="true" className="type-chip">
              {done ? <Check size={12} /> : i + 1}
            </span>
            <span className="type-small font-semibold">{s.label}</span>
            {s.count !== undefined && (
              <span className="type-chip text-muted-foreground">{s.count}</span>
            )}
            {done && <span className="sr-only">(done)</span>}
          </>
        )
        const cls = cn(
          'flex min-h-[44px] items-center gap-2 rounded-full border-2 px-3',
          current ? 'border-highlight-border bg-highlight' : 'border-border bg-card'
        )
        return (
          <li key={s.id} aria-current={current ? 'step' : undefined}>
            {onSelect ? (
              // eslint-disable-next-line no-restricted-syntax -- the whole stage is the control
              <button type="button" onClick={() => onSelect(s.id)} className={cls}>
                {body}
              </button>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
