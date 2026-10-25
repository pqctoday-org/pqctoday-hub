// SPDX-License-Identifier: AGPL-3.0-only
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

// A checkpoint quiz is opened from the path with its categories in the navigation state; the final
// quiz (a plain visit or the capstone button) has no such state.
function renderQuiz(initialPath: string, checkpointCategories?: string[]) {
  const entry = checkpointCategories
    ? {
        pathname: initialPath.split('?')[0],
        search: initialPath.split('?')[1] ? `?${initialPath.split('?')[1]}` : '',
        state: { checkpointCategories, checkpointLabel: 'Checkpoint' },
      }
    : initialPath
  return render(
    <MemoryRouter initialEntries={[entry]}>
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
    renderQuiz(`/learn/quiz?category=${category.id}`, [category.id])

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

    renderQuiz(`/learn/quiz?category=${category.id}`, [category.id])

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
      <MemoryRouter
        initialEntries={[
          '/prior',
          {
            pathname: '/learn/quiz',
            search: `?category=${category.id}`,
            state: { checkpointCategories: [category.id] },
          },
        ]}
      >
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

describe('QuizModule on a phone: the page names itself in every view', () => {
  // The phone header title is plain text, so the quiz supplies the page's one level-one heading.
  it('has exactly one h1 while a quiz is running', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(`/learn/quiz?category=${QUIZ_CATEGORIES[0].id}`, [QUIZ_CATEGORIES[0].id])
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PQC Quiz')
  })

  it('has exactly one h1 on the placeholder shown when there is nothing to quiz', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz('/learn/quiz')
    expect(screen.getByText('Nothing to quiz here yet')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})

describe('QuizModule on a phone: the final quiz offers a length choice (owner decision D7)', () => {
  const allCategories = QUIZ_CATEGORIES.map((c) => c.id)
  const allQuestions = QUIZ_QUESTIONS.filter((q) => allCategories.includes(q.category)).length
  const finalQuizPath = `/learn/quiz?category=${allCategories.join(',')}`

  it('the data has more than 20 questions in the final quiz, so the choice applies', () => {
    expect(allQuestions).toBeGreaterThan(20)
  })

  it('shows Quick pick and the full run before any question, and no question yet', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(finalQuizPath)
    expect(screen.getByRole('button', { name: 'Quick pick (20 questions)' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: `Full quiz (${allQuestions} questions)` })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('Quick pick runs 20 questions', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(finalQuizPath)
    fireEvent.click(screen.getByRole('button', { name: 'Quick pick (20 questions)' }))
    expect(screen.getByText('Question 1 of 20')).toBeInTheDocument()
  })

  it('the full run runs every question in the quiz', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(finalQuizPath)
    fireEvent.click(screen.getByRole('button', { name: `Full quiz (${allQuestions} questions)` }))
    expect(screen.getByText(`Question 1 of ${allQuestions}`)).toBeInTheDocument()
  })

  it('a checkpoint quiz over the same categories still starts at once with every question', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(finalQuizPath, allCategories)
    expect(screen.queryByRole('button', { name: /Quick pick/ })).not.toBeInTheDocument()
    expect(screen.getByText(`Question 1 of ${allQuestions}`)).toBeInTheDocument()
  })

  it('a quiz of 20 questions or fewer starts at once, with nothing to choose', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    const small = QUIZ_CATEGORIES.find(
      (c) => QUIZ_QUESTIONS.filter((q) => q.category === c.id).length <= 20
    )
    if (!small) return // every category is larger than 20 in the current data
    renderQuiz(`/learn/quiz?category=${small.id}`)
    expect(screen.queryByRole('button', { name: /Quick pick/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument()
  })
})
