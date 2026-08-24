// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QuizModule } from './index'
import { QUIZ_QUESTIONS, QUIZ_CATEGORIES } from '@/data/quizData'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  useModuleStore.setState({ modules: {} })
  usePersonaStore.getState().setPersona(null)
})

function renderQuiz(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/learn/quiz" element={<QuizModule />} />
        <Route path="/prior" element={<div>Prior page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('QuizModule — mobile UX layer wiring', () => {
  it('flag off: renders the desktop QuizIntro screen (topic/mode picker)', () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderQuiz('/learn/quiz')
    expect(screen.getByText('PQC Knowledge Quiz')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to quiz here yet')).not.toBeInTheDocument()
  })

  it('flag on with a real ?category=: skips the intro and shows question 1 directly', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    const category = QUIZ_CATEGORIES[0]
    const realQuestionTexts = new Set(
      QUIZ_QUESTIONS.filter((q) => q.category === category.id).map((q) => q.question)
    )
    renderQuiz(`/learn/quiz?category=${category.id}`)

    // handleStart shuffles the category's real questions (real desktop
    // behavior, reused as-is) — so this asserts on the real progress count
    // and that the shown question is genuinely one of the category's real
    // questions, not which specific one landed first.
    expect(
      screen.getByText(new RegExp(`Question 1 of ${realQuestionTexts.size}`))
    ).toBeInTheDocument()
    const shownHeading = screen.getByRole('heading', { level: 3 })
    expect(realQuestionTexts.has(shownHeading.textContent ?? '')).toBe(true)
  })

  it('flag on with no resolvable category and no persona: shows the stated placeholder, not a broken screen', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz('/learn/quiz')
    expect(screen.getByText('Nothing to quiz here yet')).toBeInTheDocument()
  })

  it('flag on: answering every real question correctly shows 100% PASSED on MobileQuizResults', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    // Smallest real category — fewest clicks, still real data end-to-end.
    const [category, categoryQuestions] = QUIZ_CATEGORIES.map(
      (c) => [c, QUIZ_QUESTIONS.filter((q) => q.category === c.id)] as const
    ).sort((a, b) => a[1].length - b[1].length)[0]
    const byQuestionText = new Map(categoryQuestions.map((q) => [q.question, q]))

    renderQuiz(`/learn/quiz?category=${category.id}`)

    for (let i = 0; i < categoryQuestions.length; i++) {
      const shown = screen.getByRole('heading', { level: 3 }).textContent ?? ''
      const question = byQuestionText.get(shown)!
      const correctIds = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer]
      for (const id of correctIds) {
        const option = question.options.find((o) => o.id === id)!
        fireEvent.click(screen.getByText(option.text))
      }
      fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
      const isLast = i === categoryQuestions.length - 1
      fireEvent.click(
        screen.getByRole('button', { name: isLast ? 'See your result' : 'Next question' })
      )
    }

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('PASSED')).toBeInTheDocument()
  })

  it('flag on: Exit navigates back rather than reopening the desktop intro', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    const category = QUIZ_CATEGORIES[0]
    render(
      <MemoryRouter initialEntries={['/prior', `/learn/quiz?category=${category.id}`]}>
        <Routes>
          <Route path="/learn/quiz" element={<QuizModule />} />
          <Route path="/prior" element={<div>Prior page</div>} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    expect(screen.getByText('Prior page')).toBeInTheDocument()
  })
})
