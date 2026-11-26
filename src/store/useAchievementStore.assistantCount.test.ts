// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The number of questions asked the Assistant lives in the achievement store: one number, kept on
 * the device, never the text. It must survive a reload and a version upgrade without losing earned
 * badges, and a damaged value must never reach a badge as NaN or undefined.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useAchievementStore, sanitizeQuestionCount } from './useAchievementStore'
import { restoredAchievementState } from '@/hooks/useSyncEffect'

const KEY = 'pqc-achievements'
const count = () => useAchievementStore.getState().assistantQuestionCount

function stored(): { state: Record<string, unknown>; version: number } {
  return JSON.parse(localStorage.getItem(KEY) ?? 'null')
}

async function reloadFrom(raw: unknown) {
  // Start from a blank in-memory state (this writes the device copy too), then put the stored
  // copy back, so only what is read back from the device can show.
  useAchievementStore.setState({ assistantQuestionCount: 0, unlocked: [] })
  localStorage.setItem(KEY, JSON.stringify(raw))
  await useAchievementStore.persist.rehydrate()
}

beforeEach(() => {
  localStorage.clear()
  useAchievementStore.getState().resetAchievements()
})

describe('assistantQuestionCount: keeping the number', () => {
  it('starts at 0 and goes up by one for each recorded question', () => {
    expect(count()).toBe(0)
    useAchievementStore.getState().recordAssistantQuestion()
    useAchievementStore.getState().recordAssistantQuestion()
    expect(count()).toBe(2)
  })

  it('is written to the device as a number, and nothing else about the questions', () => {
    for (let i = 0; i < 3; i++) useAchievementStore.getState().recordAssistantQuestion()
    const s = stored()
    expect(s.version).toBe(3)
    expect(s.state.assistantQuestionCount).toBe(3)
    // Only the numbers and lists the store always had; no field that could hold text or times.
    expect(Object.keys(s.state).sort()).toEqual(
      [
        'assistantQuestionCount',
        'businessToolsUsed',
        'playgroundOpCount',
        'playgroundToolsUsed',
        'sectionsVisited',
        'unlocked',
      ].sort()
    )
  })

  it('survives a reload', async () => {
    for (let i = 0; i < 7; i++) useAchievementStore.getState().recordAssistantQuestion()
    const onDevice = stored()
    await reloadFrom(onDevice)
    expect(count()).toBe(7)
  })

  it('is cleared with the other achievement counters on reset', () => {
    useAchievementStore.getState().recordAssistantQuestion()
    useAchievementStore.getState().resetAchievements()
    expect(count()).toBe(0)
  })
})

describe('upgrade from the previous store version', () => {
  it('keeps every earned badge and the other counters, and starts the count at 0', async () => {
    const earned = [
      { id: 'first-step', unlockedAt: 1_700_000_000_000, seen: true },
      { id: 'quiz-fifty', unlockedAt: 1_700_000_100_000, seen: false },
    ]
    await reloadFrom({
      version: 2,
      state: {
        unlocked: earned,
        playgroundOpCount: 12,
        sectionsVisited: ['learn', 'assess'],
        playgroundToolsUsed: ['hybrid-encrypt'],
        businessToolsUsed: ['roi'],
      },
    })
    const s = useAchievementStore.getState()
    expect(s.unlocked).toEqual(earned)
    expect(s.playgroundOpCount).toBe(12)
    expect(s.sectionsVisited).toEqual(['learn', 'assess'])
    expect(s.playgroundToolsUsed).toEqual(['hybrid-encrypt'])
    expect(s.businessToolsUsed).toEqual(['roi'])
    expect(s.assistantQuestionCount).toBe(0)
    expect(Number.isNaN(s.assistantQuestionCount)).toBe(false)
    // and the next question counts from there
    s.recordAssistantQuestion()
    expect(count()).toBe(1)
  })
})

describe('the migration step on its own', () => {
  it('adds the count as 0 to a version 2 copy and leaves the badges as they are', () => {
    const migrate = useAchievementStore.persist.getOptions().migrate!
    const v2 = { unlocked: [{ id: 'first-step', unlockedAt: 5, seen: true }], playgroundOpCount: 2 }
    const out = migrate(v2, 2) as Record<string, unknown>
    expect(out.assistantQuestionCount).toBe(0)
    expect(out.unlocked).toEqual(v2.unlocked)
    expect(out.playgroundOpCount).toBe(2)
  })

  it('repairs a damaged count it is handed', () => {
    const migrate = useAchievementStore.persist.getOptions().migrate!
    expect(
      (migrate({ assistantQuestionCount: -3 }, 2) as Record<string, unknown>).assistantQuestionCount
    ).toBe(0)
  })
})

describe('a damaged stored value is repaired', () => {
  it.each([
    ['negative', -4, 0],
    ['a fraction', 6.9, 6],
    ['a string', '12', 0],
    ['not a number', Number.NaN, 0],
    ['null', null, 0],
    ['an object', { n: 3 }, 0],
    ['missing', undefined, 0],
  ])('on the current version: %s', async (_label, bad, expected) => {
    await reloadFrom({
      version: 3,
      state: {
        unlocked: [{ id: 'first-step', unlockedAt: 1, seen: true }],
        assistantQuestionCount: bad,
      },
    })
    expect(count()).toBe(expected)
    expect(useAchievementStore.getState().unlocked).toHaveLength(1)
  })

  it('on an older version too', async () => {
    await reloadFrom({ version: 2, state: { assistantQuestionCount: -1 } })
    expect(count()).toBe(0)
  })

  it('sanitizeQuestionCount handles the edges', () => {
    expect(sanitizeQuestionCount(Infinity)).toBe(0)
    expect(sanitizeQuestionCount(-Infinity)).toBe(0)
    expect(sanitizeQuestionCount(0.4)).toBe(0)
    expect(sanitizeQuestionCount(10)).toBe(10)
    expect(sanitizeQuestionCount(1e300)).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('a bad count in memory goes up from 0, never to NaN', () => {
    useAchievementStore.setState({ assistantQuestionCount: Number.NaN })
    useAchievementStore.getState().recordAssistantQuestion()
    expect(count()).toBe(1)
  })
})

describe('copied between devices (the cloud-sync document)', () => {
  it('round-trips the number', () => {
    for (let i = 0; i < 5; i++) useAchievementStore.getState().recordAssistantQuestion()
    const doc = JSON.parse(JSON.stringify(useAchievementStore.getState()))
    expect(restoredAchievementState(doc)).toMatchObject({ assistantQuestionCount: 5 })
  })

  it('a copy made before the number existed restores it as 0', () => {
    const doc = { unlocked: [], playgroundOpCount: 3 }
    const restored = restoredAchievementState(doc) as Record<string, unknown>
    expect(restored.assistantQuestionCount).toBe(0)
    expect(restored.playgroundOpCount).toBe(3)
  })

  it('a damaged number in the copy restores as 0', () => {
    expect(restoredAchievementState({ assistantQuestionCount: 'x' })).toMatchObject({
      assistantQuestionCount: 0,
    })
    expect(restoredAchievementState({ assistantQuestionCount: -2 })).toMatchObject({
      assistantQuestionCount: 0,
    })
  })

  it('leaves a missing slice alone', () => {
    expect(restoredAchievementState(undefined)).toBeUndefined()
  })
})
