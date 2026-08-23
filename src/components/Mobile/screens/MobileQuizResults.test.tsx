// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileQuizResults } from './MobileQuizResults'
import type { QuizScoreSummary } from '@/components/PKILearning/modules/Quiz/types'

function summary(percentage: number, correct: number, total: number): QuizScoreSummary {
  return {
    overall: { correct, total, percentage },
    byCategory: {},
    byDifficulty: {},
    timeSpentSeconds: 42,
  }
}

describe('MobileQuizResults', () => {
  it('shows PASSED at the real 80% threshold', () => {
    render(<MobileQuizResults summary={summary(80, 4, 5)} onRetake={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByText('PASSED')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText(/4 of 5 correct/)).toBeInTheDocument()
  })

  it('shows NOT PASSED just below the threshold', () => {
    render(<MobileQuizResults summary={summary(79, 4, 5)} onRetake={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByText('NOT PASSED')).toBeInTheDocument()
  })

  it('Retake and Back to Learn call their real handlers', () => {
    const onRetake = vi.fn()
    const onExit = vi.fn()
    render(<MobileQuizResults summary={summary(90, 9, 10)} onRetake={onRetake} onExit={onExit} />)
    fireEvent.click(screen.getByRole('button', { name: /Retake/ }))
    expect(onRetake).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Back to Learn' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
