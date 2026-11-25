// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Eyebrow, StoryButton, StoryTextarea } from '@/components/storybook'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { COPY, STARTING_SUGGESTIONS } from './copy'
import { useAssistantContext } from './useAssistantContext'

/**
 * The phone's dock on Learn screens: one suggested question, a box for your own question about this
 * page, and Ask. Ask opens the full-screen sheet. On a phone Return adds a line; only Ask sends.
 */
export function AssistantDock() {
  const [text, setText] = useState('')
  const [empty, setEmpty] = useState(false)
  const getContext = useAssistantContext()
  const ask = useAssistantSessionStore((s) => s.ask)
  const open = useRightPanelStore((s) => s.open)
  const suggestion = STARTING_SUGGESTIONS[0]

  const openWith = (question: string) => {
    open('chat')
    void ask(question, getContext())
  }

  return (
    <form
      aria-label="Ask the Assistant"
      className="fixed inset-x-0 z-mobile-dock space-y-2 border-t-2 border-ink bg-card px-3 py-2"
      style={{ bottom: 'var(--mobile-nav-height)' }}
      onSubmit={(e) => {
        e.preventDefault()
        const q = text.trim()
        if (!q) {
          setEmpty(true)
          return
        }
        setText('')
        setEmpty(false)
        openWith(q)
      }}
    >
      <div className="flex items-center gap-2">
        <Eyebrow as="span">Suggested</Eyebrow>
        <StoryButton
          variant="quiet"
          className="h-auto min-w-0 flex-1 justify-start whitespace-normal py-1 text-left text-xs"
          onClick={() => openWith(suggestion.question)}
        >
          {suggestion.question}
        </StoryButton>
      </div>
      <div className="flex items-end gap-2">
        <StoryTextarea
          rows={1}
          value={text}
          aria-label="Ask your own question about this page"
          placeholder={COPY.placeholderPhone}
          className="min-h-[44px] flex-1 resize-none py-2"
          onChange={(e) => {
            setEmpty(false)
            setText(e.target.value)
          }}
        />
        <StoryButton type="submit" className="shrink-0 px-5">
          {COPY.ask}
        </StoryButton>
      </div>
      {empty && (
        <p role="alert" className="text-xs text-status-error">
          {COPY.emptySend}
        </p>
      )}
    </form>
  )
}
