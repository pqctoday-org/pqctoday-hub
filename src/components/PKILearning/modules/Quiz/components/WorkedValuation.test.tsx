// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { useQuizState } from '../hooks/useQuizState'

vi.mock('@/utils/analytics', () => ({ logQuizAnswer: vi.fn() }))

const question = () => QUIZ_QUESTIONS.find((q) => q.id === 'thrt-018')!
const money = (text: string) => Number(text.replace(/[$,]/g, ''))

describe('fictional P2PK output valuation', () => {
  it('loads one complete question and derives the unique answer from its declared balance and price', () => {
    const rows = QUIZ_QUESTIONS.filter((q) => q.id === 'thrt-018')
    expect(rows).toHaveLength(1)
    const q = rows[0]
    const balances = q.question.match(/P2PK outputs of (\d+) BTC and ([\d.]+) BTC/)
    const price = q.question.match(/price of (\$[\d,]+) per BTC/)
    expect(balances).not.toBeNull()
    expect(price).not.toBeNull()
    const expected = (Number(balances![1]) + Number(balances![2])) * money(price![1])
    expect(expected).toBe(75_000)
    const matching = q.options.filter((o) => money(o.text) === expected)
    expect(matching.map((o) => o.id)).toEqual([q.correctAnswer])
    expect(q.question).toContain('P2PKH output of 2 BTC')
    expect(q.question).toContain('P2PK outputs only')
    expect(q.explanation).toContain('2 BTC P2PKH output is outside this sum')
  })

  it('explains the changed-price boundary and distinguishes scoped value from security or real holdings', () => {
    const q = question()
    expect(q.explanation).toContain('$60,000/BTC')
    expect(q.explanation).toContain('$90,000')
    expect((1 + 0.5) * 60_000).toBe(90_000)
    expect(q.explanation).toContain('does not establish quantum safety')
    expect(q.source).toContain('Fictional worked example')
    expect(q.question + q.explanation).not.toMatch(/718 billion|Satoshi/)
  })

  it.each(['a', 'b', 'c', 'd'])('grades option %s through the actual quiz state', (option) => {
    const q = question()
    const { result } = renderHook(() => useQuizState())
    act(() => result.current.startQuiz([q]))
    act(() => result.current.selectAnswer(q.id, option))
    act(() => result.current.submitAnswer())
    expect(result.current.state.hasSubmittedCurrent).toBe(true)
    expect(result.current.state.results[q.id]).toBe(option === 'c')
  })
})
