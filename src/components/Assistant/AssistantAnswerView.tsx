// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { BookmarkPlus, Check } from 'lucide-react'
import { Chip, Eyebrow, StickerCard, StoryButton } from '@/components/storybook'
import type { AssistantRow } from '@/services/assistant/contract'
import { isAnswerSaved, saveAnswer } from '@/services/assistant/drawerSaves'
import {
  choiceAsRow,
  evidenceLine,
  nameCardAsRow,
  rowTagsOf,
  shortSourceLine,
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

/** The direct answer, compact: the value in a violet card, and the evidence on one line (the whole line is its title). */
export function DirectAnswerBlock({ direct }: { direct: NonNullable<PreparedAnswer['direct']> }) {
  const evidence = evidenceLine(direct)
  return (
    <StickerCard
      tone="highlight"
      padding="none"
      className="px-2.5 py-1.5"
      role="group"
      aria-label={COPY.directAnswer}
    >
      <Eyebrow as="p">{COPY.directAnswer}</Eyebrow>
      <p className="text-sm font-bold leading-snug text-heading">{direct.value}</p>
      <p className="truncate text-xs text-foreground/80" title={evidence}>
        {evidence}
      </p>
    </StickerCard>
  )
}

/** "From: <kind>: <title> (<tag>)" or "Closest: ..." on one line; the whole line is its title. */
export function SourceLineBlock({ source }: { source: NonNullable<PreparedAnswer['source']> }) {
  return (
    <p
      className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground"
      title={sourceLineText(source)}
    >
      {shortSourceLine(source)}
    </p>
  )
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

/** Draws inside a wrapping row: the button, and a notice on its own line when the save failed. */
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
    if (saved) return
    const result = saveAnswer(draft)
    if (result.ok) {
      setSaved(true)
      setFailed(false)
    } else {
      setFailed(true)
    }
  }
  return (
    <>
      <StoryButton
        variant="quiet"
        onClick={onSave}
        // Not `disabled`: a button that is disabled while it has focus drops keyboard focus to the page.
        aria-disabled={saved || undefined}
        aria-live="polite"
        className="min-h-[36px] shrink-0 gap-1.5"
      >
        {saved ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <BookmarkPlus size={14} aria-hidden="true" />
        )}
        {saved ? COPY.saved : COPY.saveAnswer}
      </StoryButton>
      {failed && (
        <p role="alert" className="basis-full text-xs text-status-error">
          {COPY.saveFailed}
        </p>
      )}
    </>
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
