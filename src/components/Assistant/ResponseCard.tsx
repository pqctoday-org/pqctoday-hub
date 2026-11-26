// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useMemo, type CSSProperties } from 'react'
import { Eyebrow, StickerCard, StoryButton } from '@/components/storybook'
import { cn } from '@/lib/utils'
import type { AssistantRow } from '@/services/assistant/contract'
import type { AssistantTurn } from '@/store/useAssistantSessionStore'
import { CopyLinkButton } from './AnswerRowItem'
import {
  AnswerTextBlock,
  DirectAnswerBlock,
  NameCardBlock,
  NameChoicesBlock,
  NoteBlock,
  NotHeldBlock,
  PassageBlock,
  QuestionBlock,
  SaveAnswerBlock,
  SourceLineBlock,
} from './AssistantAnswerView'
import { prepareAnswer, type RenderableAnswer } from './answerRules'
import { COPY } from './copy'
import { ResourceStepper } from './ResourceStepper'
import { ResourceTabBar } from './ResourceTabBar'
import { buildResourceTabs, settleNav, START_NAV, type CardNav } from './resourceTabs'

export interface ResponseCardProps {
  turn: AssistantTurn
  /** True for the one open card; the others fold to one line. */
  open: boolean
  onOpen: () => void
  /** The card's own tab and position; unset opens on "Top 5", first resource. */
  nav: CardNav | undefined
  onNav: (nav: CardNav) => void
  /** The phone sheet: smaller tabs and a slightly shorter stepper. */
  sheet?: boolean
  onAction: (row: AssistantRow) => void
}

/** The short link of the record the answer was drawn from, when the answer has one. */
function sourceLinkOf(answer: RenderableAnswer): { link: string; title: string } | null {
  if (answer.state === 'name' && answer.nameCard) {
    return { link: answer.nameCard.goLink, title: answer.nameCard.title }
  }
  if ((answer.state === 'direct' || answer.state === 'resources') && answer.source) {
    return { link: answer.source.goLink, title: answer.source.title }
  }
  return null
}

/**
 * One answer as one card: the question, a compact header, a bar of resource types, and a stepper
 * that shows one resource at a time. An earlier answer folds to one line.
 */
export function ResponseCard({
  turn,
  open,
  onOpen,
  nav,
  onNav,
  sheet = false,
  onAction,
}: ResponseCardProps) {
  const id = useId()
  const cardId = `${id}-card`
  const panelId = `${id}-panel`
  const tabId = (key: string) => `${id}-tab-${key}`

  const answer = turn.status === 'done' ? turn.answer : null
  const resources = useMemo(
    () => (answer ? buildResourceTabs(answer) : { tabs: [], total: 0, rankOf: {} }),
    [answer]
  )

  if (!open) {
    const names = resources.tabs.filter((t) => t.key !== 'top').map((t) => t.label)
    const summary = !answer
      ? COPY.loading
      : resources.total === 0
        ? COPY.noResourcesSummary
        : COPY.earlierAnswerSummary(resources.total, names)
    return (
      <article aria-label={turn.question}>
        <StoryButton
          variant="secondary"
          aria-expanded="false"
          aria-controls={cardId}
          onClick={onOpen}
          className={cn(
            'h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-2xl px-3 py-2 text-left',
            sheet ? 'min-h-[48px]' : 'min-h-[52px]'
          )}
        >
          <Eyebrow as="span">{COPY.earlierAnswer}</Eyebrow>
          <span className="w-full truncate font-bold">{turn.question}</span>
          <span className="w-full truncate text-xs font-normal text-muted-foreground">
            {summary}
          </span>
        </StoryButton>
      </article>
    )
  }

  if (!answer) {
    return (
      <article id={cardId} aria-label={turn.question} className="space-y-3">
        <QuestionBlock question={turn.question} />
        <p role="status" className="text-sm text-muted-foreground">
          {COPY.loading}
        </p>
      </article>
    )
  }

  const p = prepareAnswer(answer)
  const settled = settleNav(resources.tabs, nav ?? START_NAV)
  const link = sourceLinkOf(answer)
  const shown = p.state !== 'not-held' && !p.held
  const style = { '--assistant-step-h': sheet ? '278px' : '288px' } as CSSProperties

  // The answer line: the direct answer, else the engine's own note (fixes a note that contradicts the fixed "Here is what ..." line).
  const header = !shown ? (
    p.state === 'not-held' ? (
      <NotHeldBlock text={p.answerText} note={p.note} />
    ) : (
      <NotHeldBlock text={COPY.notHeld} note={COPY.notHeldHint} />
    )
  ) : (
    <>
      {p.direct ? (
        <DirectAnswerBlock direct={p.direct} />
      ) : p.state === 'name' || p.state === 'choices' ? (
        <>
          <AnswerTextBlock text={p.answerText} />
          <NoteBlock note={p.note} />
        </>
      ) : (
        <AnswerTextBlock text={p.note.trim() ? p.note : COPY.noDirect} />
      )}
      {p.passage && <PassageBlock {...p.passage} />}
      {p.nameCard && <NameCardBlock card={p.nameCard} onAction={onAction} />}
      {p.choices.length > 0 && <NameChoicesBlock choices={p.choices} onAction={onAction} />}
    </>
  )

  return (
    <article id={cardId} aria-label={turn.question} style={style}>
      <StickerCard padding="none" className={cn('space-y-2', sheet ? 'p-2' : 'p-3')}>
        <QuestionBlock question={turn.question} />
        {header}
        {shown && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
            {p.source && <SourceLineBlock source={p.source} />}
            <SaveAnswerBlock answer={answer} />
            {link && (
              <CopyLinkButton
                link={link.link}
                title={link.title}
                label={`${COPY.copyLinkToSource}: ${link.title}`}
                className="min-h-[36px] shrink-0"
              />
            )}
          </div>
        )}
        {shown && resources.tabs.length > 0 && (
          <>
            <ResourceTabBar
              tabs={resources.tabs}
              selected={settled.tab}
              onSelect={(key) => onNav({ tab: key, index: 0 })}
              panelId={panelId}
              tabId={tabId}
              compact={sheet}
            />
            <ResourceStepper
              tabs={resources.tabs}
              rankOf={resources.rankOf}
              nav={settled}
              onNav={onNav}
              panelId={panelId}
              tabId={tabId}
              question={turn.question}
              onAction={onAction}
            />
          </>
        )}
      </StickerCard>
    </article>
  )
}
