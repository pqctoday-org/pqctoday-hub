// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { CONSTRAINED_ALGORITHMS } from '../../IoTPQC/constants'
import { assessFit } from '../../IoTPQC/utils/sizing'
import { useQuizState } from '../hooks/useQuizState'
import { QuestionCard } from './QuestionCard'
import { FeedbackPanel } from './FeedbackPanel'

vi.mock('@/utils/analytics', () => ({ logQuizAnswer: vi.fn() }))

const question = QUIZ_QUESTIONS.find((q) => q.id === 'iot-007')!

describe('IoT operation-specific memory question', () => {
  it('uses the cited signing and verification measurements rather than signature length', () => {
    const algorithm = CONSTRAINED_ALGORITHMS.find((a) => a.id === 'fn-dsa-512')!
    const budget = 10 * 1024
    expect(algorithm.outputBytes).toBeLessThan(budget)
    expect(assessFit(algorithm, 1, 'sign', 'stack').stackBytes).toBe(41_952)
    expect(assessFit(algorithm, 1, 'sign', 'stack').peakBytes).toBeGreaterThan(budget)
    expect(assessFit(algorithm, 1, 'verify', 'stack').stackBytes).toBe(2_976)
    expect(assessFit(algorithm, 1, 'verify', 'stack').peakBytes).toBeLessThan(budget)
    expect(question.question).toContain('cited pqm4 Cortex-M4 benchmark')
    expect(question.explanation).toContain('not total device RAM requirements')
    expect(question.sourceUrl).toContain('90bfb630e53603b4e273a131cd09a025e51540a5')
  })

  it.each([
    ['false', true],
    ['true', false],
  ])('scores %s through the real quiz state', (answer, correct) => {
    const { result } = renderHook(() => useQuizState())
    act(() => result.current.startQuiz([question]))
    act(() => result.current.selectAnswer(question.id, answer))
    act(() => result.current.submitAnswer())
    expect(result.current.state.results[question.id]).toBe(correct)
    expect(result.current.getScoreSummary().overall.correct).toBe(correct ? 1 : 0)
  })

  it('presents the source-scoped question, answer options and useful lesson feedback', () => {
    const select = vi.fn()
    render(
      <MemoryRouter>
        <QuestionCard
          question={question}
          selectedAnswer={undefined}
          hasSubmitted={false}
          onSelectAnswer={select}
        />
        <FeedbackPanel
          isCorrect={true}
          explanation={question.explanation}
          learnMorePath={question.learnMorePath}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('radio', { name: 'False' }))
    expect(select).toHaveBeenCalledWith('false')
    expect(screen.getByText(question.explanation)).toHaveTextContent('41,952 bytes')
    expect(screen.getByText(question.explanation)).toHaveTextContent('2,976 bytes')
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      '/learn/iot-pqc'
    )
  })
})
