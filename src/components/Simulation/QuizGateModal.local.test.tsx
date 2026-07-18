// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuizGateModal } from './QuizGateModal'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

const mcQuestion: QuizQuestion = {
  id: 'test-mc-1',
  category: 'crypto-agility',
  type: 'multiple-choice',
  difficulty: 'beginner',
  quizMode: 'both',
  question: 'What is 2 + 2?',
  options: [
    { id: 'a', text: '3' },
    { id: 'b', text: '4' },
    { id: 'c', text: '5' },
  ],
  correctAnswer: 'b',
  explanation: 'Basic arithmetic: 2 + 2 = 4.',
  personas: [],
  industries: [],
}

describe('QuizGateModal', () => {
  it('disables Submit until an answer is picked', () => {
    render(
      <QuizGateModal
        question={mcQuestion}
        moduleTitle="Test Module"
        onPass={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    fireEvent.click(screen.getByText('4'))
    expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled()
  })

  it('a correct answer reveals feedback and a Mark complete action that calls onPass', () => {
    const onPass = vi.fn()
    render(
      <QuizGateModal
        question={mcQuestion}
        moduleTitle="Test Module"
        onPass={onPass}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('4'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('Correct!')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Mark complete/ }))
    expect(onPass).toHaveBeenCalledOnce()
  })

  it('a wrong answer reveals feedback and a free Try again — never calls onPass', () => {
    const onPass = vi.fn()
    render(
      <QuizGateModal
        question={mcQuestion}
        moduleTitle="Test Module"
        onPass={onPass}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('Incorrect')).toBeInTheDocument()
    expect(screen.getByText(mcQuestion.explanation)).toBeInTheDocument()
    expect(onPass).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    // Back to an unanswered state — Submit disabled again, no feedback shown.
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    expect(screen.queryByText('Incorrect')).toBeNull()
  })

  it('Escape and the cancel button both call onCancel without completing anything', () => {
    const onCancel = vi.fn()
    const onPass = vi.fn()
    render(
      <QuizGateModal
        question={mcQuestion}
        moduleTitle="Test Module"
        onPass={onPass}
        onCancel={onCancel}
      />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onPass).not.toHaveBeenCalled()
  })
})
