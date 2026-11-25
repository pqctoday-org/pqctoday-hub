// SPDX-License-Identifier: AGPL-3.0-only
import { forwardRef, useState } from 'react'
import { Send } from 'lucide-react'
import { StoryButton, StoryTextarea } from '@/components/storybook'
import { COPY } from './copy'

export interface AssistantInputProps {
  value: string
  onChange: (value: string) => void
  /** Called with the trimmed question; never called with an empty one. */
  onSend: (question: string) => void
  /**
   * Desktop: Return sends, Shift+Return adds a line. Phone: Return adds a line and only the Send
   * button sends (a phone keyboard has no Shift+Return).
   */
  returnSends: boolean
  placeholder?: string
}

/** The question box. It is always enabled and is never pre-filled. */
export const AssistantInput = forwardRef<HTMLTextAreaElement, AssistantInputProps>(
  ({ value, onChange, onSend, returnSends, placeholder = COPY.placeholder }, ref) => {
    const [empty, setEmpty] = useState(false)

    const send = () => {
      const q = value.trim()
      if (!q) {
        setEmpty(true)
        return
      }
      setEmpty(false)
      onSend(q)
    }

    return (
      <form
        className="space-y-1"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <div className="flex items-end gap-2">
          <StoryTextarea
            ref={ref}
            value={value}
            rows={2}
            aria-label="Your question"
            placeholder={placeholder}
            className="max-h-40 min-h-[64px] flex-1 resize-none"
            onChange={(e) => {
              if (empty) setEmpty(false)
              onChange(e.target.value)
            }}
            onKeyDown={(e) => {
              if (returnSends && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
          />
          <StoryButton type="submit" aria-label={COPY.send} className="shrink-0 px-4">
            <Send size={16} aria-hidden="true" />
            <span>{COPY.send}</span>
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
)
AssistantInput.displayName = 'AssistantInput'
