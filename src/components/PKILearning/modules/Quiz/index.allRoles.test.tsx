// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QuizModule } from './index'
import { PERSONAS } from '@/data/learningPersonas'
import { QUIZ_QUESTIONS, QUIZ_CATEGORIES } from '@/data/quizData'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

const SHOW_ALL = 'Show questions for all roles'

const forRole = (personaId: PersonaId, category: string) =>
  QUIZ_QUESTIONS.filter(
    (q) => q.category === category && (q.personas.length === 0 || q.personas.includes(personaId))
  )

/** A role and a topic where the role has no question at all but other roles do (smallest topic first). */
function findEmptyForRole() {
  const found: { personaId: PersonaId; category: string; total: number }[] = []
  for (const personaId of Object.keys(PERSONAS) as PersonaId[]) {
    for (const c of QUIZ_CATEGORIES) {
      const total = QUIZ_QUESTIONS.filter((q) => q.category === c.id).length
      if (total > 0 && forRole(personaId, c.id).length === 0) {
        found.push({ personaId, category: c.id, total })
      }
    }
  }
  return found.sort((a, b) => a.total - b.total)[0]
}
const pair = findEmptyForRole()

// A topic that no role has a beginner question for: widening the role cannot help there.
const topicWithoutBeginner = QUIZ_CATEGORIES.find((c) => {
  const questions = QUIZ_QUESTIONS.filter((q) => q.category === c.id)
  return questions.length > 0 && !questions.some((q) => q.difficulty === 'beginner')
})!

beforeEach(() => {
  usePersonaStore.getState().setExperienceLevel(null) // every difficulty
})

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  useModuleStore.setState({ modules: {} })
  usePersonaStore.getState().setPersona(null)
  usePersonaStore.getState().setExperienceLevel(null)
})

function renderQuiz(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/learn/quiz" element={<QuizModule />} />
      </Routes>
    </MemoryRouter>
  )
}

// A topic with more than a Quick pick of questions, so the phone offers the length choice first.
const LONG_TOPIC = { personaId: 'executive' as PersonaId, category: 'protocol-integration' }
const longTotal = QUIZ_QUESTIONS.filter((q) => q.category === LONG_TOPIC.category).length

describe('data the cases below rely on', () => {
  it('has a role and a topic where the role has no question but other roles do', () => {
    expect(pair).toBeDefined()
    expect(pair.total).toBeGreaterThan(0)
  })

  it('has a topic the role cannot answer and that is longer than a Quick pick', () => {
    expect(forRole(LONG_TOPIC.personaId, LONG_TOPIC.category)).toHaveLength(0)
    expect(longTotal).toBeGreaterThan(20)
  })

  it('still has no Executive question for the topic the browser spec opens (PCI Certification)', () => {
    expect(forRole('executive', 'pci-certification')).toHaveLength(0)
    expect(QUIZ_QUESTIONS.some((q) => q.category === 'pci-certification')).toBe(true)
  })
})

describe('Quiz "Show questions for all roles" (desktop)', () => {
  it('offers the button in the notice when the role leaves a requested topic empty', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    const notice = screen.getByTestId('quiz-no-match')
    expect(within(notice).getByRole('button', { name: SHOW_ALL })).toBeInTheDocument()
  })

  it('says in the notice that answers to other roles questions do not change the role score', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    expect(screen.getByTestId('quiz-no-match')).toHaveTextContent(
      "Answers to other roles' questions are saved but do not count toward your role's awareness score."
    )
  })

  it('clicking it clears the notice and leaves the site-wide role unchanged', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    expect(usePersonaStore.getState().selectedPersona).toBe(pair.personaId)
  })

  it('after the click the quiz can start and holds every question of the topic', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Start Quiz' }).at(-1)!)
    expect(screen.getByText(`0 of ${pair.total} answered`)).toBeInTheDocument()
    expect(usePersonaStore.getState().selectedPersona).toBe(pair.personaId)
  })

  it('moves focus to the All roles control, because the clicked button leaves the page', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    expect(screen.getByRole('radio', { name: 'All roles' })).toHaveFocus()
  })

  it('is absent when no role is set', () => {
    usePersonaStore.getState().setExperienceLevel('curious') // a difficulty-only empty notice
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    expect(screen.getByTestId('quiz-no-match')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: SHOW_ALL })).not.toBeInTheDocument()
  })

  it('is absent when widening the role would not give the topic a question', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    usePersonaStore.getState().setExperienceLevel('curious')
    renderQuiz(`/learn/quiz?category=${topicWithoutBeginner.id}`)
    expect(screen.getByTestId('quiz-no-match')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: SHOW_ALL })).not.toBeInTheDocument()
  })

  it('is absent when the role already has questions for the requested topic', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    usePersonaStore.getState().setExperienceLevel('curious')
    // A topic the role can answer at the beginner level is never in the notice.
    const answerable = QUIZ_CATEGORIES.find((c) =>
      forRole(pair.personaId, c.id).some((q) => q.difficulty === 'beginner')
    )!
    renderQuiz(`/learn/quiz?category=${answerable.id}`)
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: SHOW_ALL })).not.toBeInTheDocument()
  })

  it('does not remember the choice: a new visit starts with the role filter on', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    const view = renderQuiz(`/learn/quiz?category=${pair.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    view.unmount()
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    expect(screen.getByTestId('quiz-no-match')).toBeInTheDocument()
  })
})

describe('Quiz "My role / All roles" switch on the desktop intro', () => {
  it('is always on the intro when a role is set, with My role selected', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz('/learn/quiz')
    const group = screen.getByRole('radiogroup', { name: 'Questions for' })
    expect(within(group).getByRole('radio', { name: /My role/ })).toBeChecked()
    expect(within(group).getByRole('radio', { name: 'All roles' })).not.toBeChecked()
    expect(group).toHaveTextContent(PERSONAS[pair.personaId].label)
  })

  it('is not shown when no role is set, because every question already applies', () => {
    renderQuiz('/learn/quiz')
    expect(screen.queryByRole('radiogroup', { name: 'Questions for' })).not.toBeInTheDocument()
  })

  it('choosing All roles lists the topics the role had none for, and the note appears', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz('/learn/quiz')
    const topicCount = () => /across (\d+) topic areas/.exec(document.body.textContent ?? '')![1]
    const before = Number(topicCount())
    fireEvent.click(screen.getByRole('radio', { name: 'All roles' }))
    expect(Number(topicCount())).toBeGreaterThan(before)
    const status = screen.getByTestId('quiz-role-scope-status')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveTextContent('Showing questions for all roles.')
    expect(status).toHaveTextContent(
      "Answers to other roles' questions are saved but do not count toward your role's awareness score."
    )
    expect(usePersonaStore.getState().selectedPersona).toBe(pair.personaId)
  })

  it('choosing My role again brings the role filter back', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /My role/ }))
    expect(screen.getByTestId('quiz-no-match')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-role-scope-status')).toBeEmptyDOMElement()
    expect(usePersonaStore.getState().selectedPersona).toBe(pair.personaId)
  })

  it('is reachable with the keyboard: a native radio pair, so arrow keys move between them', () => {
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz('/learn/quiz')
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    const names = radios.map((r) => r.getAttribute('name'))
    expect(new Set(names).size).toBe(1)
    expect(radios.every((r) => r.type === 'radio')).toBe(true)
  })
})

describe('Quiz "Show questions for all roles" (phone)', () => {
  it('shows the button and does not start a quiz', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    expect(screen.getByRole('button', { name: SHOW_ALL })).toBeInTheDocument()
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument()
  })

  it('lets a long label wrap instead of overflowing a 390 px screen', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    const button = screen.getByRole('button', { name: SHOW_ALL })
    expect(button.className).toContain('whitespace-normal')
    expect(button.className).toContain('min-h-11')
  })

  it('a long topic first offers the length choice and repeats that these are all roles', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona(LONG_TOPIC.personaId)
    renderQuiz(`/learn/quiz?category=${LONG_TOPIC.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    const choice = screen.getByTestId('quiz-length-choice')
    expect(choice).toHaveTextContent(`${longTotal} questions across 1 topic.`)
    expect(choice).toHaveTextContent('From all roles, for this quiz only.')
    expect(choice).toHaveTextContent(
      "Answers to other roles' questions are saved but do not count toward your role's awareness score."
    )
    fireEvent.click(screen.getByRole('button', { name: /^Full quiz/ }))
    expect(screen.getByText(`Question 1 of ${longTotal}`)).toBeInTheDocument()
  })

  it('clicking it starts the quiz with the topic questions and names the scope in the title', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona(pair.personaId)
    renderQuiz(`/learn/quiz?category=${pair.category}`)
    fireEvent.click(screen.getByRole('button', { name: SHOW_ALL }))
    // A long topic first offers Quick pick or the full run; take the full one.
    const full = screen.queryByRole('button', { name: /^Full quiz/ })
    if (full) fireEvent.click(full)
    expect(screen.queryByTestId('quiz-no-match')).not.toBeInTheDocument()
    expect(screen.getByText(`Question 1 of ${pair.total}`)).toBeInTheDocument()
    expect(screen.getByText(/all roles/i)).toBeInTheDocument()
    expect(usePersonaStore.getState().selectedPersona).toBe(pair.personaId)
  })
})
