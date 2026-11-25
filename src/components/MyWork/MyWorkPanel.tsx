// SPDX-License-Identifier: AGPL-3.0-only
/**
 * My work (handoff 6.7, 7.8; requirements O01 to O08, C02, C03, X09; decisions J2, J4).
 *
 * Comments and tracked outputs together, saved answers and saved references beside them, filtered by objective and
 * by type, grouped by day, newest first, with an "Export as Markdown" button. Everything is stored on this device
 * only; nothing here counts as completion. The panel reads objectives through its props, so it works with any
 * objective store.
 */
import { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, AlertTriangle } from 'lucide-react'
import {
  StickerCard,
  StoryButton,
  StoryRow,
  Chip,
  Eyebrow,
  StatusChip,
} from '@/components/storybook'
import { useMyWorkStore, type SavedAnswerRecord } from '@/store/useMyWorkStore'
import { FAILURE_WORDS, probeStorage, type StorageFailureReason } from '@/store/deviceLocalJson'
import { useHistoryStore } from '@/store/useHistoryStore'
import { useModuleStore } from '@/store/useModuleStore'
import {
  ALL_OBJECTIVES,
  NOT_FILED,
  buildItems,
  countItems,
  filterItems,
  groupByDay,
  type MyWorkItem,
  type MyWorkObjective,
  type TypeFilter,
} from '@/services/myWork/items'
import { outputSourceStatus, syncTrackedOutputs } from '@/services/myWork/outputs'
import { storageWords } from '@/services/myWork/storageWords'
import { summarizeAnswerPayload } from '@/services/myWork/answerSummary'
import { addressOf, currentContentVersion } from '@/services/myWork/tags'
import { buildMarkdown, downloadMarkdown } from '@/services/myWork/markdownExport'
import { trackMyWork } from '@/services/myWork/myWorkAnalytics'
import { useTagLabels } from './useTagLabels'

export interface MyWorkPanelProps {
  /** The learner's objectives, for the filter and for filing outputs. Omit when there are none. */
  objectives?: readonly MyWorkObjective[]
  /** Open a Hub address (a lesson, a tool). Defaults to the router. */
  onOpen?: (href: string) => void
  /** Open a saved answer in the Assistant. When omitted the card shows the answer text and no "Open the answer" button. */
  onOpenAnswer?: (answer: SavedAnswerRecord) => void
  className?: string
}

const TYPE_LABEL: Record<MyWorkItem['type'], string> = {
  comment: 'Comment',
  'technical-artifact': 'Technical artifact',
  'business-artifact': 'Business artifact',
  draft: 'Draft',
  'saved-answer': 'Saved answer',
  'saved-reference': 'Saved reference',
}

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'comments', label: 'Comments' },
  { id: 'artifacts', label: 'Artifacts and answers' },
]

const dayHeading = (day: string): string => {
  const d = new Date(`${day}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
}
const shortDay = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const CLAMP = 280

export function MyWorkPanel({
  objectives = [],
  onOpen,
  onOpenAnswer,
  className,
}: MyWorkPanelProps) {
  const uid = useId()
  const navigate = useNavigate()
  const open = (href: string) => (onOpen ? onOpen(href) : navigate(href))
  const { labelOf } = useTagLabels()
  const comments = useMyWorkStore((s) => s.comments)
  const outputs = useMyWorkStore((s) => s.outputs)
  const answers = useMyWorkStore((s) => s.answers)
  const references = useMyWorkStore((s) => s.references)
  const fileOutput = useMyWorkStore((s) => s.fileOutput)
  const removeOutput = useMyWorkStore((s) => s.removeOutput)
  const removeAnswer = useMyWorkStore((s) => s.removeAnswer)
  const removeReference = useMyWorkStore((s) => s.removeReference)
  const events = useHistoryStore((s) => s.events)
  const docs = useModuleStore((s) => s.artifacts.executiveDocuments)

  const [chosenObjective, setObjective] = useState<string>(ALL_OBJECTIVES)
  const [type, setType] = useState<TypeFilter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [failed, setFailed] = useState<{
    key: string
    what: string
    reason: StorageFailureReason
    retry: () => void
  } | null>(null)
  const [storage, setStorage] = useState<'ok' | 'quota' | 'blocked'>(() => probeStorage())

  // Bring in what the Hub already holds (phase 1 of tracked outputs). Safe to repeat.
  useEffect(() => {
    syncTrackedOutputs()
  }, [events, docs])

  // A filter whose objective has gone falls back to All, so the list is never empty for an invisible reason.
  const objective =
    chosenObjective === ALL_OBJECTIVES ||
    chosenObjective === NOT_FILED ||
    objectives.some((o) => o.id === chosenObjective)
      ? chosenObjective
      : ALL_OBJECTIVES

  const items = useMemo(
    () => buildItems({ comments, outputs, answers, references }, objectives),
    [comments, outputs, answers, references, objectives]
  )
  const counts = useMemo(
    () => countItems(items, objectives, objective, type),
    [items, objectives, objective, type]
  )
  const shown = useMemo(() => filterItems(items, objective, type), [items, objective, type])
  const groups = useMemo(() => groupByDay(shown), [shown])

  const objectiveTitle = (id: string) => objectives.find((o) => o.id === id)?.title

  function runWrite(
    key: string,
    what: string,
    write: () => { ok: boolean; reason?: StorageFailureReason }
  ) {
    const result = write()
    if (!result.ok) {
      setFailed({
        key,
        what,
        reason: result.reason ?? 'blocked',
        retry: () => runWrite(key, what, write),
      })
      setStorage(probeStorage())
      return
    }
    setFailed(null)
  }

  function exportAll() {
    const text = buildMarkdown(shown, { labelOf, origin: window.location.origin, objectiveTitle })
    downloadMarkdown(text)
    trackMyWork('export_markdown', shown.length)
  }
  function exportOne(item: MyWorkItem) {
    downloadMarkdown(
      buildMarkdown([item], { labelOf, origin: window.location.origin, objectiveTitle })
    )
    trackMyWork('export_markdown', 1)
  }

  const failureNote = (key: string) =>
    failed && failed.key === key ? (
      <div
        role="alert"
        className="mt-2 rounded-2xl border-2 border-ink bg-caution px-4 py-3 text-sm text-caution-foreground"
      >
        <p className="flex items-center gap-2 font-bold">
          <AlertTriangle size={16} aria-hidden="true" />
          {failed.what} was not saved
        </p>
        <p className="mt-1">{FAILURE_WORDS[failed.reason]} Nothing else was changed.</p>
        <StoryButton variant="secondary" className="mt-2" onClick={failed.retry}>
          Try again
        </StoryButton>
      </div>
    ) : null

  function renderText(text: string, id: string) {
    const long = text.length > CLAMP
    const isOpen = expanded.has(id)
    return (
      <>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
          {long && !isOpen ? `${text.slice(0, CLAMP).trimEnd()}…` : text}
        </p>
        {long && (
          <StoryButton
            variant="quiet"
            aria-expanded={isOpen}
            onClick={() =>
              setExpanded((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
          >
            {isOpen ? 'Show less' : 'Show full text'}
          </StoryButton>
        )}
      </>
    )
  }

  function card(item: MyWorkItem) {
    const filedLine = (ids: string[]) =>
      ids.length > 0
        ? `Objective: ${ids.map((i) => objectiveTitle(i) ?? i).join(', ')}`
        : 'Not filed'
    switch (item.type) {
      case 'comment': {
        const c = item.comment
        const live = currentContentVersion(c.tag)
        return (
          <>
            <Eyebrow>{labelOf(c.tag)}</Eyebrow>
            {renderText(c.body, item.key)}
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                You · {shortDay(c.updatedAt)} · version {c.contentVersion}
                {c.edited ? ' · edited' : ''}
              </span>
              {live > c.contentVersion && (
                <StatusChip status="changed" label="Section changed since" />
              )}
              <span>{filedLine(item.objectiveIds)}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <StoryButton variant="quiet" onClick={() => open(addressOf(c.tag))}>
                Open in {labelOf(c.tag).split(' › ')[0]}
              </StoryButton>
              <StoryButton variant="quiet" onClick={() => exportOne(item)}>
                Export
              </StoryButton>
            </div>
          </>
        )
      }
      case 'technical-artifact':
      case 'business-artifact':
      case 'draft': {
        const o = item.output
        const missing = outputSourceStatus(o, events, docs ?? []) === 'missing'
        return (
          <>
            <Eyebrow>{o.producer.toolId ? `Tool · ${o.producer.toolId}` : 'Tool'}</Eyebrow>
            <p className="mt-1 text-sm font-bold text-heading">{o.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                You · {shortDay(o.updatedAt)} · {storageWords(o)}
              </span>
              {o.approvalStatus && <Chip>{`Approval: ${o.approvalStatus}`}</Chip>}
              {typeof o.unfilledFields === 'number' && (
                <Chip>{`${o.unfilledFields} unfilled`}</Chip>
              )}
            </p>
            {missing && (
              <p
                role="note"
                className="mt-2 rounded-2xl bg-caution px-3 py-2 text-xs text-caution-foreground"
              >
                The saved {o.ref.type === 'executive-document' ? 'document' : 'tool run'} is no
                longer on this device. The title and link are kept here.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor={`${uid}-file-${o.id}`} className="text-xs font-bold text-heading">
                Filed under
              </label>
              {/* A native select: a closed list of the learner's objectives, read by every screen reader and phone keyboard without a portal. */}
              {/* eslint-disable-next-line no-restricted-syntax -- FilterDropdown opens a portal menu; this short inline choice is better as the native control */}
              <select
                id={`${uid}-file-${o.id}`}
                className="min-h-[44px] rounded-full border-2 border-ink bg-card px-3 text-sm text-card-foreground"
                value={
                  o.objectiveId && objectives.some((x) => x.id === o.objectiveId)
                    ? o.objectiveId
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value
                  runWrite(item.key, 'The filing', () => fileOutput(o.id, value || null))
                  trackMyWork('output_filed')
                }}
              >
                <option value="">Not filed</option>
                {objectives.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {o.producer.route && (
                <StoryButton variant="quiet" onClick={() => open(o.producer.route)}>
                  Open in the tool
                </StoryButton>
              )}
              <StoryButton variant="quiet" onClick={() => exportOne(item)}>
                Export
              </StoryButton>
              <StoryButton
                variant="quiet"
                onClick={() => runWrite(item.key, 'The removal', () => removeOutput(o.id))}
              >
                Remove from My work
              </StoryButton>
            </div>
            {failureNote(item.key)}
          </>
        )
      }
      case 'saved-answer': {
        const a = item.answer
        const s = summarizeAnswerPayload(a.payload)
        return (
          <>
            <Eyebrow>Assistant</Eyebrow>
            <p className="mt-1 text-sm font-bold text-heading">{a.question}</p>
            {s.answerText && renderText(s.answerText, item.key)}
            {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              You · {shortDay(a.savedAt)} · {filedLine(item.objectiveIds)}
              {s.rowTags.length > 0
                ? ` · ${s.rowTags.length} record${s.rowTags.length === 1 ? '' : 's'}`
                : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {onOpenAnswer && (
                <StoryButton variant="quiet" onClick={() => onOpenAnswer(a)}>
                  Open the answer
                </StoryButton>
              )}
              <StoryButton variant="quiet" onClick={() => exportOne(item)}>
                Export
              </StoryButton>
              <StoryButton
                variant="quiet"
                onClick={() => runWrite(item.key, 'The removal', () => removeAnswer(a.id))}
              >
                Remove from My work
              </StoryButton>
            </div>
            {failureNote(item.key)}
          </>
        )
      }
      case 'saved-reference': {
        const r = item.reference
        return (
          <>
            <Eyebrow>{r.savedFrom === 'assistant' ? 'Assistant' : 'Page'}</Eyebrow>
            <p className="mt-1 text-sm font-bold text-heading">{r.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.kind} · {shortDay(r.createdAt)} · {filedLine(item.objectiveIds)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <StoryButton variant="quiet" onClick={() => open(`/go/${encodeURIComponent(r.tag)}`)}>
                Open
              </StoryButton>
              <StoryButton variant="quiet" onClick={() => exportOne(item)}>
                Export
              </StoryButton>
              <StoryButton
                variant="quiet"
                onClick={() => runWrite(item.key, 'The removal', () => removeReference(r.id))}
              >
                Remove from My work
              </StoryButton>
            </div>
            {failureNote(item.key)}
          </>
        )
      }
    }
  }

  const empty = items.length === 0

  return (
    <StickerCard
      as="section"
      aria-labelledby={`${uid}-h`}
      padding="roomy"
      className={className}
      data-testid="my-work-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${uid}-h`} className="text-xl font-extrabold text-heading">
            My work
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stored on this device only. Nothing here counts as completion.
          </p>
        </div>
        <StoryButton variant="secondary" onClick={exportAll} disabled={shown.length === 0}>
          <Download size={16} aria-hidden="true" /> Export as Markdown
        </StoryButton>
      </div>

      {storage !== 'ok' && (
        <div
          role="alert"
          className="mt-3 rounded-2xl border-2 border-ink bg-caution px-4 py-3 text-sm text-caution-foreground"
        >
          <p className="font-bold">Your work cannot be saved right now</p>
          <p className="mt-1">
            {FAILURE_WORDS[storage]} What is already here stays readable. Export it as Markdown to
            keep a copy.
          </p>
        </div>
      )}

      {empty ? (
        <div className="mt-6" data-testid="my-work-empty">
          <p className="text-base font-bold text-heading">Nothing here yet</p>
          <p className="mt-1 text-sm text-foreground">
            Add a comment on any lesson or section, save an answer from the Assistant, or run a
            tool. It appears here, on this device.
          </p>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filter by objective" className="mt-4 flex flex-wrap gap-2">
            <Chip
              pressed={objective === ALL_OBJECTIVES}
              onClick={() => setObjective(ALL_OBJECTIVES)}
            >
              {`All (${counts.all})`}
            </Chip>
            {objectives.map((o) => (
              <Chip key={o.id} pressed={objective === o.id} onClick={() => setObjective(o.id)}>
                {`${o.title} (${counts.byObjective[o.id] ?? 0})`}
              </Chip>
            ))}
            <Chip pressed={objective === NOT_FILED} onClick={() => setObjective(NOT_FILED)}>
              {`Not filed (${counts.notFiled})`}
            </Chip>
          </div>
          <div role="group" aria-label="Filter by type" className="mt-2 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((t) => (
              <Chip key={t.id} pressed={type === t.id} onClick={() => setType(t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="mt-6 text-sm text-foreground" data-testid="my-work-no-match">
              Nothing matches these filters.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {groups.map((g) => (
                <section key={g.day} aria-label={dayHeading(g.day)}>
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-heading">
                    {dayHeading(g.day)}
                  </h3>
                  <ul className="mt-2 space-y-3">
                    {g.items.map((item) => (
                      <StoryRow
                        as="li"
                        key={item.key}
                        data-testid="my-work-item"
                        data-type={item.type}
                      >
                        <Chip className="mb-2">{TYPE_LABEL[item.type]}</Chip>
                        {card(item)}
                      </StoryRow>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </StickerCard>
  )
}
