// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import { QUIZ_QUESTIONS, QUIZ_CATEGORIES } from '@/data/quizData'

// 2026-08-24 audit R4.1: the handoff spec's "source module named above each
// question" was never built on either desktop or mobile — this is the first
// real implementation, using the question's own real `category` field
// against the real quizCategories label map (not an invented per-question
// module/lm_id association, which the data model has no source for).
describe('QuestionCard — source category (audit R4.1)', () => {
  it('shows the real category label above the question, for a real question of every real category', () => {
    for (const category of QUIZ_CATEGORIES) {
      const question = QUIZ_QUESTIONS.find((q) => q.category === category.id)
      if (!question) continue // some categories may have 0 questions loaded in this env
      const { unmount } = render(
        <QuestionCard
          question={question}
          selectedAnswer={undefined}
          hasSubmitted={false}
          onSelectAnswer={vi.fn()}
        />
      )
      expect(screen.getByTestId('question-source-category')).toHaveTextContent(category.label)
      expect(screen.getByText(question.question)).toBeInTheDocument()
      unmount()
    }
  })
})
