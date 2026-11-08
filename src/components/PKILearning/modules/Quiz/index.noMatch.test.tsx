// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QuizModule } from './index'
import { QuizWizard } from './QuizWizard'
import { QUIZ_QUESTIONS, QUIZ_CATEGORIES } from '@/data/quizData'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// A topic that exists but has no beginner question: valid in a link, empty once the reader is on
// the beginner-only setting.
const topicWithoutBeginner = QUIZ_CATEGORIES.find((c) => {
  const questions = QUIZ_QUESTIONS.filter((q) => q.category === c.id)
  return questions.length > 0 && !questions.some((q) => q.difficulty === 'beginner')
})!

beforeEach(() => {
  usePersonaStore.getState().setExperienceLevel('curious') // beginner questions only
})

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  useModuleStore.setState({ modules: {} })
  usePersonaStore.getState().setPersona(null)
  usePersonaStore.getState().setExperienceLevel(null)
})

// The intro has two Start Quiz buttons: the timed one up top and the topic one after the topic list.
function startSelectedTopics() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Start Quiz' }).at(-1)!)
}

function renderQuiz(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/learn/quiz" element={<QuizModule />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('a quiz topic that the difficulty filter leaves empty (desktop)', () => {
  it('the data has such a topic, so the cases below test something', () => {
    expect(topicWithoutBeginner).toBeDefined()
  })

  it('says so on the intro before any start, naming the topic', () => {
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    const notice = screen.getByTestId('quiz-no-match')
    expect(notice).toHaveTextContent('No matching questions')
    expect(notice).toHaveTextContent(topicWithoutBeginner.label)
    expect(notice).toHaveTextContent('difficulty: Beginner')
    expect(
      screen.getByRole('button', { name: 'Include all difficulty levels' })
    ).toBeInTheDocument()
  })

  it('starting it keeps the reader on the intro with the notice, never a blank quiz', () => {
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    startSelectedTopics()
    // The intro is still there and no quiz screen replaced it.
    expect(screen.getByText('PQC Knowledge Quiz')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Exit Quiz/ })).not.toBeInTheDocument()
    expect(screen.getByTestId('quiz-no-match')).toBeInTheDocument()
  })

  it('widening the difficulty recovers: the notice goes and the quiz starts with questions', () => {
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    fireEvent.click(screen.getByRole('button', { name: 'Include all difficulty levels' }))
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    startSelectedTopics()
    const expected = QUIZ_QUESTIONS.filter((q) => q.category === topicWithoutBeginner.id).length
    expect(screen.getByText(`0 of ${expected} answered`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Check Answer/ })).toBeInTheDocument()
  })

  it('shows no notice for a topic that has questions at the current difficulty', () => {
    const withBeginner = QUIZ_CATEGORIES.find((c) =>
      QUIZ_QUESTIONS.some((q) => q.category === c.id && q.difficulty === 'beginner')
    )!
    renderQuiz(`/learn/quiz?category=${withBeginner.id}`)
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
  })
})

describe('a quiz topic that the difficulty filter leaves empty (phone)', () => {
  it('shows the notice and does not start a quiz', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    expect(screen.getByTestId('quiz-no-match')).toHaveTextContent(topicWithoutBeginner.label)
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose a different topic' })).toBeInTheDocument()
  })

  it('widening the difficulty starts the quiz with the topic questions', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    fireEvent.click(screen.getByRole('button', { name: 'Include all difficulty levels' }))
    const expected = QUIZ_QUESTIONS.filter((q) => q.category === topicWithoutBeginner.id).length
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    expect(screen.getByText(`Question 1 of ${expected}`)).toBeInTheDocument()
  })
})

describe('QuizWizard given no question', () => {
  it('explains and offers the way back instead of rendering nothing', () => {
    const onExit = vi.fn()
    const { container } = render(<QuizWizard questions={[]} onComplete={vi.fn()} onExit={onExit} />)
    expect(container).not.toBeEmptyDOMElement()
    expect(screen.getByRole('status')).toHaveTextContent('No matching questions')
    fireEvent.click(screen.getByRole('button', { name: 'Back to topics' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
