// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { BookmarkPlus, Check } from 'lucide-react'
import { Chip, Eyebrow, StickerCard, StoryButton } from '@/components/storybook'
import { eyebrowClass } from '@/components/storybook/variants'
import { cn } from '@/lib/utils'
import type { AssistantRow } from '@/services/assistant/contract'
import { isAnswerSaved, saveAnswer } from '@/services/assistant/drawerSaves'
import { AnswerRowItem } from './AnswerRowItem'
import {
  choiceAsRow,
  evidenceLine,
  nameCardAsRow,
  prepareAnswer,
  rowTagsOf,
  sourceLineText,
  sourceTagOf,
  type PreparedAnswer,
  type RenderableAnswer,
} from './answerRules'
import { COPY } from './copy'

// ── Blocks ────────────────────────────────────────────────────────────────────

export function QuestionBlock({ question }: { question: string }) {
  return (
    <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-chip px-3 py-2 text-sm font-semibold text-chip-foreground">
      {question}
    </p>
  )
}

export function AnswerTextBlock({ text }: { text: string }) {
  return <p className="text-sm font-semibold text-foreground">{text}</p>
}

export function PassageBlock({ heading, text }: { heading: string; text: string }) {
  return (
    <blockquote className="rounded-2xl border border-border bg-muted/40 px-3 py-2">
      <Eyebrow as="p">{heading}</Eyebrow>
      <p className="mt-1 text-sm text-foreground">{text}</p>
    </blockquote>
  )
}

export function NoteBlock({ note }: { note: string }) {
  if (!note.trim()) return null
  return (
    <div>
      <Eyebrow as="p">{COPY.fromTheHub}</Eyebrow>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export function DirectAnswerBlock({ direct }: { direct: NonNullable<PreparedAnswer['direct']> }) {
  return (
    <StickerCard tone="highlight" padding="default" role="group" aria-label={COPY.directAnswer}>
      <Eyebrow as="p">{COPY.directAnswer}</Eyebrow>
      <p className="mt-1 text-base font-bold text-heading">{direct.value}</p>
      <p className="mt-2 text-xs text-foreground/80">{evidenceLine(direct)}</p>
    </StickerCard>
  )
}

export function SourceLineBlock({ source }: { source: NonNullable<PreparedAnswer['source']> }) {
  return <p className="text-xs font-semibold text-foreground">{sourceLineText(source)}</p>
}

export function NameCardBlock({
  card,
  onAction,
}: {
  card: NonNullable<PreparedAnswer['nameCard']>
  onAction: (row: AssistantRow) => void
}) {
  const row = nameCardAsRow(card)
  return (
    <StickerCard role="group" aria-label={card.title} className="space-y-2">
      <Chip>{card.kind}</Chip>
      <p className="text-base font-bold text-heading">{card.title}</p>
      {card.extract && <p className="text-sm text-foreground/90">{card.extract}</p>}
      {(card.taughtIn.length > 0 || card.tryIn.length > 0) && (
        <p className="text-xs text-muted-foreground">
          {card.taughtIn.length > 0 && (
            <>Taught in {card.taughtIn.map((l) => l.title).join(', ')}</>
          )}
          {card.taughtIn.length > 0 && card.tryIn.length > 0 && ' · '}
          {card.tryIn.length > 0 && <>Try it in {card.tryIn.map((l) => l.title).join(', ')}</>}
        </p>
      )}
      <StoryButton
        variant="secondary"
        onClick={() => onAction(row)}
        aria-label={`${row.action}: ${card.title}`}
      >
        {row.action}
      </StoryButton>
    </StickerCard>
  )
}

export function NameChoicesBlock({
  choices,
  onAction,
}: {
  choices: PreparedAnswer['choices']
  onAction: (row: AssistantRow) => void
}) {
  return (
    <ul className="space-y-2" aria-label="Records with this name">
      {choices.map((c) => (
        <li key={c.tag}>
          <StoryButton
            variant="secondary"
            className="h-auto w-full flex-col items-start gap-0 whitespace-normal py-2 text-left"
            onClick={() => onAction(choiceAsRow(c))}
          >
            <span className="text-xs text-muted-foreground">{c.kind}</span>
            <span>{c.title}</span>
          </StoryButton>
        </li>
      ))}
    </ul>
  )
}

export function ResourceGroupsBlock({
  groups,
  hiddenCount,
  onAction,
}: {
  groups: PreparedAnswer['groups']
  hiddenCount: number
  onAction: (row: AssistantRow) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const base = useId()
  if (groups.length === 0) return null
  return (
    <div role="group" aria-label={COPY.resourcesIntro} className="space-y-3">
      {groups.map((g) => (
        <div key={g.name} className="space-y-1.5">
          <h3 id={`${base}-${g.name}`} className={eyebrowClass}>
            {g.name}
          </h3>
          <ul aria-labelledby={`${base}-${g.name}`} className="space-y-2">
            {g.rows.map((r) => (
              <AnswerRowItem key={r.tag} row={r} onAction={onAction} />
            ))}
            {showAll &&
              g.more.map((r) => <AnswerRowItem key={r.tag} row={r} onAction={onAction} />)}
          </ul>
        </div>
      ))}
      {hiddenCount > 0 && (
        <StoryButton variant="quiet" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
          {showAll ? COPY.hideMore : COPY.showMore(hiddenCount)}
        </StoryButton>
      )}
    </div>
  )
}

export function SaveAnswerBlock({ answer }: { answer: RenderableAnswer }) {
  const draft = {
    question: answer.question,
    answerText: answer.answerText,
    note: answer.note,
    sourceTag: sourceTagOf(answer),
    rowTags: rowTagsOf(answer),
  }
  const [saved, setSaved] = useState(() => isAnswerSaved(draft))
  const [failed, setFailed] = useState(false)
  const onSave = () => {
    const result = saveAnswer(draft)
    if (result.ok) {
      setSaved(true)
      setFailed(false)
    } else {
      setFailed(true)
    }
  }
  return (
    <div className="space-y-1">
      <StoryButton
        variant="quiet"
        onClick={onSave}
        disabled={saved}
        aria-live="polite"
        className="gap-1.5"
      >
        {saved ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <BookmarkPlus size={14} aria-hidden="true" />
        )}
        {saved ? COPY.saved : COPY.saveAnswer}
      </StoryButton>
      {failed && (
        <p role="alert" className="text-xs text-status-error">
          {COPY.saveFailed}
        </p>
      )}
    </div>
  )
}

export function NotHeldBlock({ text, note }: { text: string; note: string }) {
  return (
    <div role="status" className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{text}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

// ── The whole answer ──────────────────────────────────────────────────────────

export interface AssistantAnswerViewProps {
  answer: RenderableAnswer
  onAction: (row: AssistantRow) => void
  className?: string
}

/**
 * One answer, drawn from fixed blocks in a fixed order. Every answer keeps its own resources.
 * Order: question, answer text, passage box, note, direct answer, source line, name card, groups,
 * save. Suggestions and the input belong to the conversation, below the latest answer.
 */
export function AssistantAnswerView({ answer, onAction, className }: AssistantAnswerViewProps) {
  const p = prepareAnswer(answer)
  return (
    <article aria-label={answer.question} className={cn('space-y-3', className)}>
      <QuestionBlock question={answer.question} />
      {p.state === 'not-held' ? (
        <NotHeldBlock text={p.answerText} note={p.note} />
      ) : p.held ? (
        <NotHeldBlock text={COPY.notHeld} note={COPY.notHeldHint} />
      ) : (
        <>
          <AnswerTextBlock text={p.answerText} />
          {p.passage && <PassageBlock {...p.passage} />}
          <NoteBlock note={p.note} />
          {p.direct && <DirectAnswerBlock direct={p.direct} />}
          {p.source && <SourceLineBlock source={p.source} />}
          {p.nameCard && <NameCardBlock card={p.nameCard} onAction={onAction} />}
          {p.choices.length > 0 && <NameChoicesBlock choices={p.choices} onAction={onAction} />}
          <ResourceGroupsBlock groups={p.groups} hiddenCount={p.hiddenCount} onAction={onAction} />
          <SaveAnswerBlock answer={answer} />
        </>
      )}
    </article>
  )
}
