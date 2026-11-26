// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Chip, Eyebrow, StickerCard, StoryButton } from '@/components/storybook'
import type { AssistantRow } from '@/services/assistant/contract'
import { isGlossaryTag, type TermLesson } from '@/services/assistant/termLessons'
import { isReferenceSaved, saveReference } from '@/services/assistant/drawerSaves'
import { CopyLinkButton } from './AnswerRowItem'
import { COPY } from './copy'

export interface RecordViewerProps {
  row: AssistantRow
  /** `record`: "Read here". `tool`: "Try it here". */
  mode: 'record' | 'tool'
  /** `drawer`: replaces the conversation, with "Back to your answer". `pinned`: a card at the top of the phone sheet, with "Close". */
  variant: 'drawer' | 'pinned'
  question?: string
  onClose: () => void
  /** Open the record's own page. */
  onOpenPage: (row: AssistantRow) => void
  /** Where the knowledge model says a glossary term is taught (empty until read, or when it holds none). */
  lessons?: TermLesson[]
  /** Open a lesson, section or workshop step that teaches the term. */
  onOpenLesson?: (lesson: TermLesson) => void
}

/**
 * The record viewer and the tool frame. One return control per view. It does not hold focus: the
 * learner can still reach the page and the conversation.
 */
export function RecordViewer({
  row,
  mode,
  variant,
  question,
  onClose,
  onOpenPage,
  lessons = [],
  onOpenLesson,
}: RecordViewerProps) {
  const returnRef = useRef<HTMLButtonElement>(null)
  const [saved, setSaved] = useState(() => isReferenceSaved(row.tag))
  const [saveFailed, setSaveFailed] = useState(false)

  // The return control is first in the tab order; focus starts on it.
  useEffect(() => {
    returnRef.current?.focus()
  }, [row.tag])

  const dims = row.dims
  const from = [row.tag, row.source ? `Source: ${row.source}` : null, dims].filter(Boolean)

  const onSave = () => {
    if (saved) return
    const result = saveReference({ tag: row.tag, title: row.title, kind: row.kind, question })
    if (result.ok) {
      setSaved(true)
      setSaveFailed(false)
    } else {
      setSaveFailed(true)
    }
  }

  const pinned = variant === 'pinned'
  // A glossary term leads to the lesson that teaches it; its own glossary entry is the quiet second action.
  const term = isGlossaryTag(row.tag)
  const lesson = term && onOpenLesson ? lessons[0] : undefined

  return (
    <section
      aria-label={row.title}
      className={
        pinned ? 'sticky top-0 z-10 px-3 pt-3 md:px-4' : 'flex-1 overflow-y-auto px-3 py-3 md:px-4'
      }
    >
      <StickerCard padding="default" className="space-y-3">
        <div>
          {pinned ? (
            <StoryButton ref={returnRef} variant="quiet" onClick={onClose} className="gap-1">
              <X size={14} aria-hidden="true" />
              {COPY.close}
            </StoryButton>
          ) : (
            <StoryButton ref={returnRef} variant="quiet" onClick={onClose} className="gap-1">
              <ArrowLeft size={14} aria-hidden="true" />
              {COPY.backToAnswer}
            </StoryButton>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip>{row.kind}</Chip>
          {row.status && <Chip className="bg-highlight text-heading">{row.status}</Chip>}
        </div>
        <h2 className="text-base font-bold text-heading">{row.title}</h2>
        <p className="text-xs text-muted-foreground">{from.join(' · ')}</p>
        {row.paidReferenceOnly ? (
          <p className="text-sm text-foreground/90">{COPY.paidReference}</p>
        ) : (
          row.extract.trim() && (
            <div>
              <Eyebrow as="p">In the Hub&rsquo;s words</Eyebrow>
              <p className="mt-1 text-sm text-foreground">{row.extract}</p>
            </div>
          )
        )}
        <div className="flex flex-wrap items-center gap-1">
          {mode === 'tool' ? (
            <StoryButton variant="secondary" onClick={() => onOpenPage(row)}>
              Open full page
            </StoryButton>
          ) : (
            <>
              {/* Not `disabled`: a button that is disabled while it has focus drops keyboard focus to the page. */}
              <StoryButton variant="secondary" onClick={onSave} aria-disabled={saved || undefined}>
                {saved ? (
                  <>
                    <Check size={14} aria-hidden="true" />
                    {COPY.saved}
                  </>
                ) : (
                  COPY.saveReference
                )}
              </StoryButton>
              {term ? (
                <>
                  {lesson && (
                    <StoryButton variant="secondary" onClick={() => onOpenLesson?.(lesson)}>
                      Open the lesson: {lesson.lessonTitle}
                    </StoryButton>
                  )}
                  <StoryButton
                    variant={lesson ? 'quiet' : 'secondary'}
                    onClick={() => onOpenPage(row)}
                  >
                    Open in the glossary
                  </StoryButton>
                </>
              ) : (
                <StoryButton variant="secondary" onClick={() => onOpenPage(row)}>
                  Open full page
                </StoryButton>
              )}
            </>
          )}
          <CopyLinkButton link={row.goLink} title={row.title} />
        </div>
        {saveFailed && (
          <p role="alert" className="text-xs text-status-error">
            {COPY.saveReferenceFailed}
          </p>
        )}
      </StickerCard>
    </section>
  )
}
