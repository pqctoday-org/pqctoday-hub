// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Eyebrow, StoryButton } from '@/components/storybook'
import { useChatStore } from '@/store/useChatStore'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { resourceCount } from './answerRules'
import type { AssistantRow } from '@/services/assistant/contract'
import { AssistantAnswerView, QuestionBlock } from './AssistantAnswerView'
import { AssistantInput } from './AssistantInput'
import { RecordViewer } from './RecordViewer'
import { Suggestions } from './Suggestions'
import { suggestionsFor } from './suggestionSource'
import { COPY } from './copy'
import { describeCurrentPage } from './returnTarget'
import { useAssistantContext } from './useAssistantContext'
import { useAssistantLayout } from './useAssistantLayout'

type Opened = { row: AssistantRow; mode: 'record' | 'tool'; question: string }

/**
 * The Assistant view of the drawer: conversation, suggestions, input. It reads and clears the
 * question another page queued ("Ask the Assistant" buttons), and loads no language model.
 */
export function AssistantConversation() {
  const layout = useAssistantLayout()
  const sheet = layout === 'sheet'
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const getContext = useAssistantContext()

  const turns = useAssistantSessionStore((s) => s.turns)
  const draft = useAssistantSessionStore((s) => s.draft)
  const failedQuestion = useAssistantSessionStore((s) => s.failedQuestion)
  const setDraft = useAssistantSessionStore((s) => s.setDraft)
  const ask = useAssistantSessionStore((s) => s.ask)
  const retry = useAssistantSessionStore((s) => s.retry)

  const pendingQuestion = useChatStore((s) => s.pendingQuestion)
  const setPendingQuestion = useChatStore((s) => s.setPendingQuestion)
  const isOpen = useRightPanelStore((s) => s.isOpen)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const latestRef = useRef<HTMLDivElement>(null)
  const openerTag = useRef<string | null>(null)
  const [opened, setOpened] = useState<Opened | null>(null)

  // On open, the input has focus.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // A question queued by another page is asked once the drawer is open, then cleared.
  useEffect(() => {
    if (pendingQuestion && isOpen) {
      const question = pendingQuestion
      setPendingQuestion(null)
      void ask(question, getContext())
    }
  }, [pendingQuestion, isOpen, setPendingQuestion, ask, getContext])

  const latest = turns[turns.length - 1]
  const latestDone = latest?.status === 'done' ? latest : null
  // A polite live region: the text changes when a new answer is ready, focus does not move.
  const announcement = latestDone ? COPY.answerReady(resourceCount(latestDone.answer)) : ''

  // Bring the newest question to the top of the list, so its answer reads from the first line;
  // announce the answer politely without moving focus.
  useEffect(() => {
    const list = listRef.current
    const latestEl = latestRef.current
    if (list && latestEl) list.scrollTop = latestEl.offsetTop
  }, [turns.length])

  // A failure notice sits at the end of the list: show it.
  useEffect(() => {
    const list = listRef.current
    if (list && failedQuestion) list.scrollTop = list.scrollHeight
  }, [failedQuestion])

  const send = useCallback(
    (question: string) => {
      setOpened(null)
      void ask(question, getContext())
      inputRef.current?.focus()
    },
    [ask, getContext]
  )

  const edit = useCallback(
    (question: string) => {
      setDraft(question)
      inputRef.current?.focus()
    },
    [setDraft]
  )

  const closeViewer = useCallback(() => {
    const tag = openerTag.current
    setOpened(null)
    openerTag.current = null
    // Back to the row action that opened it.
    requestAnimationFrame(() => {
      const target = tag
        ? document.querySelector<HTMLElement>(
            `[data-tag="${CSS.escape(tag)}"] button, [data-tag="${CSS.escape(tag)}"] a`
          )
        : null
      ;(target ?? inputRef.current)?.focus()
    })
  }, [])

  const openPage = useCallback(
    (row: AssistantRow) => {
      if (row.action === 'Go to page' || opened) {
        useAssistantReturnStore.getState().begin({
          path: `${pathname}${search}`,
          label: describeCurrentPage(pathname),
          origin: `${row.action}: ${row.title}`,
        })
      }
      // The phone sheet closes while a page is open; the desktop drawer stays beside the page.
      if (sheet) useRightPanelStore.getState().close()
      setOpened(null)
      navigate(row.link)
    },
    [navigate, opened, pathname, search, sheet]
  )

  const onAction = useCallback(
    (row: AssistantRow, question: string) => {
      openerTag.current = row.tag
      if (row.action === 'Read here') return setOpened({ row, mode: 'record', question })
      if (row.action === 'Try it here') return setOpened({ row, mode: 'tool', question })
      openPage(row)
    },
    [openPage]
  )

  const suggestions = suggestionsFor(turns.map((t) => t.question))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* A pinned record card sits at the top of the phone sheet; the desktop viewer replaces the conversation. */}
      {opened && sheet && (
        <RecordViewer
          row={opened.row}
          mode={opened.mode}
          variant="pinned"
          question={opened.question}
          onClose={closeViewer}
          onOpenPage={openPage}
        />
      )}
      {opened && !sheet && (
        <RecordViewer
          row={opened.row}
          mode={opened.mode}
          variant="drawer"
          question={opened.question}
          onClose={closeViewer}
          onOpenPage={openPage}
        />
      )}

      <div
        ref={listRef}
        className="relative min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 md:px-4 max-md:overscroll-y-contain"
        hidden={Boolean(opened) && !sheet}
      >
        {turns.length === 0 && !failedQuestion && (
          <p className="text-sm font-semibold text-foreground">{COPY.first}</p>
        )}

        {turns.map((t, i) => {
          const isLast = i === turns.length - 1
          const answer = t.status === 'done' ? t.answer : null
          return (
            <div key={t.id} ref={isLast ? latestRef : undefined} className="space-y-2">
              {!isLast && <Eyebrow as="p">{COPY.earlierAnswer}</Eyebrow>}
              {answer ? (
                <AssistantAnswerView answer={answer} onAction={(r) => onAction(r, t.question)} />
              ) : (
                <article aria-label={t.question} className="space-y-3">
                  <QuestionBlock question={t.question} />
                  <p role="status" className="text-sm text-muted-foreground">
                    {COPY.loading}
                  </p>
                </article>
              )}
            </div>
          )
        })}

        {failedQuestion && (
          <div role="alert" className="space-y-2 rounded-2xl border-2 border-ink bg-card p-3">
            <p className="text-sm font-bold text-foreground">{COPY.failData}</p>
            <p className="text-xs text-muted-foreground">{COPY.failDataKept}</p>
            <StoryButton onClick={() => void retry(getContext())}>{COPY.tryAgain}</StoryButton>
          </div>
        )}

        {!failedQuestion && <Suggestions suggestions={suggestions} onAsk={send} onEdit={edit} />}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="shrink-0 border-t border-border px-3 py-3 safe-bottom md:px-4">
        <AssistantInput
          ref={inputRef}
          value={draft}
          onChange={setDraft}
          onSend={send}
          returnSends={!sheet}
          placeholder={sheet ? COPY.placeholderPhone : COPY.placeholder}
        />
      </div>
    </div>
  )
}
