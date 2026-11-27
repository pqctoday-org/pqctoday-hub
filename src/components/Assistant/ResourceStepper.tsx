// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Chip, Eyebrow, StoryButton } from '@/components/storybook'
import { cn } from '@/lib/utils'
import type { AssistantRow } from '@/services/assistant/contract'
import { isReferenceSaved, saveReference } from '@/services/assistant/drawerSaves'
import { CopyLinkButton } from './AnswerRowItem'
import { COPY } from './copy'
import { HomeLessonLink } from './HomeLessonLink'
import {
  settleNav,
  stepFrom,
  type CardNav,
  type ResourceTab,
  type ResourceTabKey,
} from './resourceTabs'

const filled = (s: string | null | undefined): s is string =>
  typeof s === 'string' && s.trim().length > 0

function isHttpsUrl(url: string | undefined): url is string {
  if (!url) return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/** The dots of a tab: one per resource, the current one violet. A long tab shows a window of them. */
function Dots({ count, current }: { count: number; current: number }) {
  const WINDOW = 15
  const start =
    count <= WINDOW ? 0 : Math.min(Math.max(current - Math.floor(WINDOW / 2), 0), count - WINDOW)
  const shown = Math.min(count, WINDOW)
  return (
    <span aria-hidden="true" className="flex items-center justify-center gap-1">
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={start + i}
          className={cn(
            'h-1.5 rounded-full',
            start + i === current ? 'w-3 bg-highlight-border' : 'w-1.5 bg-border'
          )}
        />
      ))}
    </span>
  )
}

/** Save the record the card shows to My work. Not `disabled` once saved, so keyboard focus stays. */
function SaveReference({ row, question }: { row: AssistantRow; question: string }) {
  const [saved, setSaved] = useState(() => isReferenceSaved(row.tag))
  const [failed, setFailed] = useState(false)
  const onSave = () => {
    if (saved) return
    const result = saveReference({ tag: row.tag, title: row.title, kind: row.kind, question })
    setSaved(result.ok)
    setFailed(!result.ok)
  }
  return (
    <>
      <StoryButton
        variant="quiet"
        onClick={onSave}
        aria-disabled={saved || undefined}
        aria-live="polite"
        className="min-h-[36px] gap-1 px-1.5"
      >
        {saved ? (
          <>
            <Check size={14} aria-hidden="true" />
            {COPY.saved}
          </>
        ) : (
          COPY.saveReference
        )}
      </StoryButton>
      {failed && (
        <p role="alert" className="basis-full text-xs text-status-error">
          {COPY.saveReferenceFailed}
        </p>
      )}
    </>
  )
}

export interface ResourceStepperProps {
  tabs: readonly ResourceTab[]
  /** Position of each resource in the engine's order, by tag. */
  rankOf: Readonly<Record<string, number>>
  nav: CardNav
  onNav: (nav: CardNav) => void
  /** Ids shared with the tab bar: the panel, and the tab that names it. */
  panelId: string
  tabId: (key: ResourceTabKey) => string
  question: string
  onAction: (row: AssistantRow) => void
}

/**
 * One resource at a time, with dots for the position in its tab and Previous and Next in a footer.
 * At the end of a tab, Next goes on to the first resource of the next tab and says so. The area has
 * a fixed height (`--assistant-step-h`), so the card does not change size as the learner steps.
 */
export function ResourceStepper({
  tabs,
  rankOf,
  nav,
  onNav,
  panelId,
  tabId,
  question,
  onAction,
}: ResourceStepperProps) {
  const at = settleNav(tabs, nav)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tab = tabs.find((t) => t.key === at.tab)
  const row = tab?.rows[at.index]
  const shownTag = row?.tag
  // The text area scrolls when a long extract does not fit; then it can be reached with the keyboard too.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      if (el.scrollHeight > el.clientHeight + 1) el.setAttribute('tabindex', '0')
      else el.removeAttribute('tabindex')
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [shownTag])
  if (!tab || !row) return null

  const prev = stepFrom(tabs, at, -1)
  const next = stepFrom(tabs, at, 1)
  const rank = rankOf[row.tag]
  const external = row.action === 'Open reference' && isHttpsUrl(row.link)
  const actionLabel = `${row.action}: ${row.title}`
  // One line: where the record comes from, in words, then its dimensions.
  const meta = [row.source ? `Source: ${row.source}` : null, row.dims].filter(Boolean).join(' · ')

  const labelOf = (kind: 'prev' | 'next') => {
    const step = kind === 'prev' ? prev : next
    if (!step) return kind === 'prev' ? [COPY.prev, COPY.startAria] : [COPY.end, COPY.endAria]
    if (!step.crosses)
      return kind === 'prev' ? [COPY.prev, COPY.prevAria] : [COPY.next, COPY.nextAria]
    return kind === 'prev'
      ? [COPY.prevType(step.crosses.label), COPY.prevTypeAria(step.crosses.label)]
      : [COPY.nextType(step.crosses.label), COPY.nextTypeAria(step.crosses.label)]
  }
  const [prevText, prevAria] = labelOf('prev')
  const [nextText, nextAria] = labelOf('next')

  const buttonClass =
    'h-auto min-h-[36px] shrink-0 whitespace-normal px-3 py-1 text-left leading-tight'

  return (
    <div className="flex h-[var(--assistant-step-h,262px)] flex-col gap-1.5">
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(tab.key)}
        data-tag={row.tag}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card"
      >
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pt-2 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring focus-visible:outline-solid"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip>{row.kind}</Chip>
            {row.status && <Chip className="bg-highlight text-heading">{row.status}</Chip>}
            {rank !== undefined && (
              <span className="text-xs text-muted-foreground">{COPY.rankLine(rank)}</span>
            )}
          </div>
          <h3 className="line-clamp-3 font-display text-[15px] font-bold leading-snug text-heading">
            {row.title}
          </h3>
          {meta && (
            <p className="truncate text-xs text-muted-foreground" title={meta}>
              {meta}
            </p>
          )}
          <HomeLessonLink row={row} onOpen={onAction} oneLine />
          {row.paidReferenceOnly ? (
            <p className="text-xs text-muted-foreground">{COPY.paidReference}</p>
          ) : (
            filled(row.extract) && (
              <p className="line-clamp-6 text-[13px] leading-snug text-foreground/90">
                {row.extract}
              </p>
            )
          )}
          <Eyebrow
            as="p"
            className="break-all font-mono text-[10px] normal-case tracking-normal text-muted-foreground"
          >
            {row.tag}
          </Eyebrow>
        </div>
        {/* Not `sticky`: the nearest scrolling ancestor is the conversation list, so a sticky bar floated over the text whenever that list was shorter than the card. The bar is already below the text area, which scrolls on its own. */}
        <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-b-2xl bg-card px-2 pb-1.5 pt-1">
          {external ? (
            <a
              href={row.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={actionLabel}
              data-row-action=""
              className="inline-flex min-h-[36px] items-center justify-center rounded-full border-2 border-ink bg-primary px-3 text-sm font-bold text-primary-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
            >
              {row.action}
            </a>
          ) : (
            <StoryButton
              onClick={() => onAction(row)}
              aria-label={actionLabel}
              data-row-action=""
              className="min-h-[36px] px-3"
            >
              {row.action}
            </StoryButton>
          )}
          <SaveReference key={row.tag} row={row} question={question} />
          <CopyLinkButton link={row.goLink} title={row.title} className="min-h-[36px] px-1.5" />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
        <StoryButton
          variant="secondary"
          aria-label={prevAria}
          aria-disabled={!prev || undefined}
          onClick={() => prev && onNav(prev.nav)}
          className={buttonClass}
        >
          {prevText}
        </StoryButton>
        <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
          <Dots count={tab.rows.length} current={at.index} />
          <span aria-live="polite" aria-atomic="true" className="text-xs font-bold text-heading">
            {COPY.stepPos(tab.label, at.index + 1, tab.rows.length)}
          </span>
        </div>
        <StoryButton
          variant="secondary"
          aria-label={nextAria}
          aria-disabled={!next || undefined}
          onClick={() => next && onNav(next.nav)}
          className={buttonClass}
        >
          {nextText}
        </StoryButton>
      </div>
    </div>
  )
}
