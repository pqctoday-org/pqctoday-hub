// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Eyebrow, StoryButton } from '@/components/storybook'
import { COPY } from './copy'

/** A suggested question. The type is the drawer's own: the answer contract carries none. */
export interface AnswerSuggestion {
  question: string
  /** "Plan", "Understand", "Your context", "Learn", "From your history" ... */
  label?: string
  /** Shown under "Why this question?". */
  why?: string
}

const MAX_SUGGESTIONS = 8
const MAX_ALTERNATIVES = 3

export interface SuggestionsProps {
  suggestions: readonly AnswerSuggestion[]
  /** A tap sends at once. */
  onAsk: (question: string) => void
  /** Copies the question into the input and focuses it. */
  onEdit: (question: string) => void
}

/**
 * Suggested questions as plain buttons: one main question, up to three alternatives, the rest
 * collapsed. The input stays available and is never pre-filled.
 */
export function Suggestions({ suggestions, onAsk, onEdit }: SuggestionsProps) {
  const [why, setWhy] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const list = suggestions.slice(0, MAX_SUGGESTIONS)
  if (list.length === 0) return null
  const [main, ...rest] = list
  const alternatives = rest.slice(0, MAX_ALTERNATIVES)
  const more = rest.slice(MAX_ALTERNATIVES)
  return (
    <div role="group" aria-label="Suggested questions" className="space-y-2">
      <Eyebrow as="p">{COPY.suggested}</Eyebrow>
      <StoryButton
        variant="secondary"
        onClick={() => onAsk(main.question)}
        className="h-auto w-full justify-start whitespace-normal py-2 text-left text-base"
      >
        {main.question}
      </StoryButton>
      <div className="flex flex-wrap items-center gap-1">
        {main.why && (
          <StoryButton variant="quiet" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
            {COPY.why}
          </StoryButton>
        )}
        <StoryButton variant="quiet" onClick={() => onEdit(main.question)}>
          {COPY.edit}
        </StoryButton>
      </div>
      {why && main.why && <p className="text-xs text-muted-foreground">{main.why}</p>}
      {alternatives.length > 0 && (
        <ul className="space-y-1.5">
          {alternatives.map((s) => (
            <li key={s.question}>
              <StoryButton
                variant="secondary"
                onClick={() => onAsk(s.question)}
                className="h-auto w-full justify-start gap-2 whitespace-normal py-1.5 text-left text-xs"
              >
                {s.label && <span className="text-muted-foreground">{s.label}</span>}
                <span>{s.question}</span>
              </StoryButton>
            </li>
          ))}
        </ul>
      )}
      {more.length > 0 && (
        <>
          <StoryButton
            variant="quiet"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            {COPY.moreQuestions(more.length)}
          </StoryButton>
          {moreOpen && (
            <ul className="space-y-1.5">
              {more.map((s) => (
                <li key={s.question}>
                  <StoryButton
                    variant="secondary"
                    onClick={() => onAsk(s.question)}
                    className="h-auto w-full justify-start gap-2 whitespace-normal py-1.5 text-left text-xs"
                  >
                    {s.label && <span className="text-muted-foreground">{s.label}</span>}
                    <span>{s.question}</span>
                  </StoryButton>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
