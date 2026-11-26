// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/utils/analytics', () => ({ logEvent: vi.fn() }))

import { saveAnswer, listSavedAnswers, removeSavedAnswer, savedAnswerId } from './savedAnswers'
import { useMyWorkStore, MY_WORK_KEY } from '@/store/useMyWorkStore'

const answer = {
  question: 'When is the CNSA 2.0 deadline?',
  savedAt: '2026-11-25T10:00:00.000Z',
  payload: { answerText: 'Here is what the Hub holds on this.', rowTags: ['CMP:CNSA-2'] },
}

beforeEach(() => {
  localStorage.clear()
  useMyWorkStore.setState({ comments: [], outputs: [], answers: [], references: [] })
})

describe('saved answers interface (the Assistant drawer hands answers here)', () => {
  it('saves, lists and removes an answer, and keeps it on the device', () => {
    const r = saveAnswer(answer)
    expect(r).toMatchObject({ ok: true, duplicate: false })
    expect(listSavedAnswers()).toHaveLength(1)
    expect(listSavedAnswers()[0]).toMatchObject({
      question: answer.question,
      payload: answer.payload,
    })
    expect(localStorage.getItem(MY_WORK_KEY)).toContain('CMP:CNSA-2')
    if (!r.ok) throw new Error('unreachable')
    expect(removeSavedAnswer(r.id)).toEqual({ ok: true })
    expect(listSavedAnswers()).toHaveLength(0)
  })

  it('saving the same answer twice is one record (one logical change)', () => {
    saveAnswer(answer)
    const again = saveAnswer(answer)
    expect(again).toMatchObject({ ok: true, duplicate: true })
    expect(listSavedAnswers()).toHaveLength(1)
    expect(savedAnswerId(answer)).toBe(savedAnswerId({ ...answer }))
  })

  it('refuses an empty question and a payload that is not plain JSON', () => {
    expect(saveAnswer({ ...answer, question: '  ' })).toEqual({ ok: false, reason: 'invalid' })
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(saveAnswer({ ...answer, savedAt: 'x', payload: cyclic })).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(listSavedAnswers()).toHaveLength(0)
  })

  it('reports a full device and keeps memory unchanged', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(saveAnswer(answer)).toEqual({ ok: false, reason: 'quota' })
    expect(listSavedAnswers()).toHaveLength(0)
    spy.mockRestore()
    expect(saveAnswer(answer)).toMatchObject({ ok: true })
    expect(listSavedAnswers()).toHaveLength(1)
  })
})
