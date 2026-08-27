// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileQuizWizard } from './MobileQuizWizard'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'beginner',
    quizMode: 'both',
    question: 'Which algorithm is a NIST-selected KEM?',
    options: [
      { id: 'a', text: 'RSA-2048' },
      { id: 'b', text: 'ML-KEM-768' },
    ],
    correctAnswer: 'b',
    explanation: 'ML-KEM-768 (FIPS 203) is the NIST-selected key encapsulation mechanism.',
    personas: [],
    industries: [],
  },
  {
    id: 'q2',
    category: 'pqc-fundamentals',
    type: 'true-false',
    difficulty: 'beginner',
    quizMode: 'both',
    question: 'RSA is quantum-safe.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation: 'RSA is broken by Shor’s algorithm on a sufficiently large quantum computer.',
    personas: [],
    industries: [],
  },
]

function renderWizard(onComplete = vi.fn(), onExit = vi.fn()) {
  return render(
    <MemoryRouter>
      <MobileQuizWizard
        questions={questions}
        title="Checkpoint quiz — Foundations"
        onComplete={onComplete}
        onExit={onExit}
      />
    </MemoryRouter>
  )
}

describe('MobileQuizWizard', () => {
  it('shows the real title and the first real question', () => {
    renderWizard()
    expect(screen.getByText('Checkpoint quiz — Foundations')).toBeInTheDocument()
    expect(screen.getByText('Which algorithm is a NIST-selected KEM?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('disables "Check answer" until an option is picked, then shows real feedback', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled()
    fireEvent.click(screen.getByText('ML-KEM-768'))
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText(/ML-KEM-768 \(FIPS 203\) is the NIST-selected/)).toBeInTheDocument()
  })

  it('advances to the next question and completes on the last one, calling onComplete with the real summary', () => {
    const onComplete = vi.fn()
    renderWizard(onComplete)
    fireEvent.click(screen.getByText('ML-KEM-768'))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }))
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()

    fireEvent.click(screen.getByText('False'))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'See your result' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    const data = onComplete.mock.calls[0][0]
    expect(data.summary.overall.correct).toBe(2)
    expect(data.summary.overall.total).toBe(2)
    expect(data.summary.overall.percentage).toBe(100)
  })

  it('the Exit button calls onExit', () => {
    const onExit = vi.fn()
    renderWizard(vi.fn(), onExit)
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
