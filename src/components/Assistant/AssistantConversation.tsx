// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { StoryButton } from '@/components/storybook'
import { useChatStore } from '@/store/useChatStore'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { AssistantRow } from '@/services/assistant/contract'
import { AssistantInput } from './AssistantInput'
import { RecordViewer } from './RecordViewer'
import { ResponseCard } from './ResponseCard'
import { buildResourceTabs } from './resourceTabs'
import { isGlossaryTag, termLessonsFor, type TermLesson } from '@/services/assistant/termLessons'
import { useGlossaryDrawerStore } from '@/store/useGlossaryDrawerStore'
import { Suggestions } from './Suggestions'
import { useRememberAsked, useSuggestions } from './useSuggestions'
import { COPY } from './copy'
import { describeCurrentPage } from './returnTarget'
import { useAssistantContext } from './useAssistantContext'
import { useAssistantLayout } from './useAssistantLayout'

/**
 * The Assistant view of the drawer: conversation, suggestions, input. It reads and clears the
 * question another page queued ("Ask the Assistant" buttons), and loads no language model.
 */
export function AssistantConversation() {
  const layout = useAssistantLayout()
  const sheet = layout === 'sheet'
  const navigate = useNavigate()
  const { pathname, search, key } = useLocation()
  const getContext = useAssistantContext()

  const turns = useAssistantSessionStore((s) => s.turns)
  const draft = useAssistantSessionStore((s) => s.draft)
  const failedQuestion = useAssistantSessionStore((s) => s.failedQuestion)
  const setDraft = useAssistantSessionStore((s) => s.setDraft)
  const ask = useAssistantSessionStore((s) => s.ask)
  const retry = useAssistantSessionStore((s) => s.retry)
  const openTurnId = useAssistantSessionStore((s) => s.openTurnId)
  const setOpenTurn = useAssistantSessionStore((s) => s.setOpenTurn)
  const cardNav = useAssistantSessionStore((s) => s.cardNav)
  const setCardNav = useAssistantSessionStore((s) => s.setCardNav)

  const pendingQuestion = useChatStore((s) => s.pendingQuestion)
  const setPendingQuestion = useChatStore((s) => s.setPendingQuestion)
  const isOpen = useRightPanelStore((s) => s.isOpen)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const spacerRef = useRef<HTMLDivElement>(null)
  const openerTag = useRef<string | null>(null)
  const opened = useAssistantSessionStore((s) => s.viewer)
  const setOpened = useAssistantSessionStore((s) => s.setViewer)
  // The lessons that teach the opened glossary term, read from the knowledge model once per term.
  const [termLessons, setTermLessons] = useState<{ tag: string; lessons: TermLesson[] } | null>(
    null
  )
  const openedTag = opened?.row.tag
  useEffect(() => {
    if (!openedTag) return
    let cancelled = false
    void termLessonsFor(openedTag).then((lessons) => {
      if (!cancelled) setTermLessons({ tag: openedTag, lessons })
    })
    return () => {
      cancelled = true
    }
  }, [openedTag])
  const lessonsOfOpened = termLessons && termLessons.tag === openedTag ? termLessons.lessons : []

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
  // One card is open; a missing or removed one falls back to the newest.
  const openId = turns.some((t) => t.id === openTurnId) ? openTurnId : (latest?.id ?? null)
  // A polite live region: the text changes when a new answer is ready, focus does not move.
  const announcement = latestDone
    ? COPY.answerReady(buildResourceTabs(latestDone.answer).total)
    : ''

  // Bring the open card to the top of the list, so its answer reads from the first line. It runs
  // when the open card changes and again when the newest answer arrives (the loading line is too
  // short to scroll that far). A spacer below the last card lets a short card still reach the top.
  const viewerOpen = Boolean(opened)
  useEffect(() => {
    const list = listRef.current
    const card = openId ? cardRefs.current[openId] : null
    const spacer = spacerRef.current
    if (!list || !card) return
    // Where the list should be scrolled to: the open card's top. On the phone, with a record pinned
    // above, the list is short, so the card is scrolled to its resource instead, which is what the
    // learner just acted on.
    const target = () => {
      const panel = viewerOpen && sheet ? card.querySelector('[role="tabpanel"]') : null
      if (!panel) return card.offsetTop
      const lead = panel.getBoundingClientRect().top - card.getBoundingClientRect().top
      return card.offsetTop + Math.max(0, lead - 8)
    }
    const place = () => {
      if (spacer) {
        // The content ends where the (empty) spacer starts, plus the list's own bottom padding.
        spacer.style.height = '0px'
        const contentEnd =
          spacer.offsetTop + parseFloat(getComputedStyle(list).paddingBottom || '0')
        // Only for a card with controls in it: a scrolling list with nothing to focus fails the keyboard rule.
        const room = card.querySelector('button, a[href]')
          ? Math.max(0, target() + list.clientHeight - contentEnd)
          : 0
        spacer.style.height = `${room}px`
      }
      list.scrollTop = target()
    }
    place()
    // The card can still settle for a frame or two (fonts, the loading line giving way to the answer):
    // check again until the card's top is where it should be, for at most ten frames.
    let frames = 0
    let handle = 0
    const settle = () => {
      if (Math.abs(list.scrollTop - target()) > 1 && frames++ < 10) {
        place()
        handle = requestAnimationFrame(settle)
      }
    }
    handle = requestAnimationFrame(settle)
    return () => cancelAnimationFrame(handle)
  }, [openId, latest?.status, viewerOpen, sheet])

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
    [ask, getContext, setOpened]
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
  }, [setOpened])

  const openPage = useCallback(
    (row: AssistantRow, to: string = row.link) => {
      // Every row that opens another page starts the way back: "Back to your answer" on a wide
      // screen, "Back to <page>" on a phone. (An open that stays on the same page starts none.)
      useAssistantReturnStore.getState().begin({
        path: `${pathname}${search}`,
        fromKey: key,
        label: describeCurrentPage(pathname),
        origin: `${row.action}: ${row.title}`,
      })
      // The phone sheet closes while a page is open; the desktop drawer stays beside the page.
      if (sheet) useRightPanelStore.getState().close()
      setOpened(null)
      navigate(to)
    },
    [navigate, pathname, search, key, sheet, setOpened]
  )

  /** A term's own entry: the drawer shows the Glossary on that term, with the way back to this answer. */
  const openGlossary = useCallback((row: AssistantRow) => {
    useGlossaryDrawerStore.getState().focus(row.title, { fromAnswer: true })
    useRightPanelStore.getState().open('glossary')
  }, [])

  const onAction = useCallback(
    (row: AssistantRow, question: string) => {
      openerTag.current = row.tag
      if (row.action === 'Read here') return setOpened({ row, mode: 'record', question })
      if (row.action === 'Try it here') return setOpened({ row, mode: 'tool', question })
      openPage(row)
    },
    [openPage, setOpened]
  )

  const suggestions = useSuggestions()
  useRememberAsked()

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
          onOpenPage={(r) => (isGlossaryTag(r.tag) ? openGlossary(r) : openPage(r))}
          lessons={lessonsOfOpened}
          onOpenLesson={(lesson) => openPage(opened.row, lesson.link)}
        />
      )}
      {opened && !sheet && (
        <RecordViewer
          row={opened.row}
          mode={opened.mode}
          variant="drawer"
          question={opened.question}
          onClose={closeViewer}
          onOpenPage={(r) => (isGlossaryTag(r.tag) ? openGlossary(r) : openPage(r))}
          lessons={lessonsOfOpened}
          onOpenLesson={(lesson) => openPage(opened.row, lesson.link)}
        />
      )}

      <div
        ref={listRef}
        data-testid="assistant-list"
        // `overflow-anchor: none`: the list is scrolled to the open card on purpose; the browser must not move it again when a card above changes size.
        className="relative min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 [overflow-anchor:none] md:px-4 max-md:overscroll-y-contain"
        hidden={Boolean(opened) && !sheet}
      >
        {turns.length === 0 && !failedQuestion && (
          <p className="text-sm font-semibold text-foreground">{COPY.first}</p>
        )}

        {turns.map((t) => (
          <div
            key={t.id}
            ref={(el) => {
              cardRefs.current[t.id] = el
            }}
            className="space-y-3"
          >
            <ResponseCard
              turn={t}
              open={t.id === openId}
              onOpen={() => setOpenTurn(t.id)}
              nav={cardNav[t.id]}
              onNav={(nav) => setCardNav(t.id, nav)}
              sheet={sheet}
              onAction={(r) => onAction(r, t.question)}
            />
            {t.id === openId && !failedQuestion && t.status === 'done' && (
              <Suggestions suggestions={suggestions} onAsk={send} onEdit={edit} compact />
            )}
          </div>
        ))}

        {failedQuestion && (
          <div role="alert" className="space-y-2 rounded-2xl border-2 border-ink bg-card p-3">
            <p className="text-sm font-bold text-foreground">{COPY.failData}</p>
            <p className="text-xs text-muted-foreground">{COPY.failDataKept}</p>
            <StoryButton onClick={() => void retry(getContext())}>{COPY.tryAgain}</StoryButton>
          </div>
        )}

        {!failedQuestion && turns.length === 0 && (
          <Suggestions suggestions={suggestions} onAsk={send} onEdit={edit} />
        )}
        <div ref={spacerRef} aria-hidden="true" />
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
