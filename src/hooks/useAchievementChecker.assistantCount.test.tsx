// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Conversation Starter" and the hidden "Full Journey" count questions asked the Assistant, plus
 * messages sent to the old chat while it still ships.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAchievementStore } from '@/store/useAchievementStore'
import { useChatStore } from '@/store/useChatStore'
import { useModuleStore } from '@/store/useModuleStore'
import { ACHIEVEMENT_CATALOG } from '@/data/achievementCatalog'
import type { ActivitySnapshot } from '@/types/AchievementTypes'
import type { Conversation } from '@/types/ChatTypes'
import { useAchievementChecker } from './useAchievementChecker'

const FIVE = ['learn', 'assess', 'migrate', 'playground', 'simulation']

const earned = (id: string) => useAchievementStore.getState().unlocked.some((u) => u.id === id)

function oldChat(userMessages: number): Conversation[] {
  return [
    {
      id: 'c1',
      title: 't',
      createdAt: 1,
      updatedAt: 1,
      messages: Array.from({ length: userMessages }, (_, i) => ({
        id: `m${i}`,
        role: 'user' as const,
        content: `message ${i}`,
        timestamp: i,
      })),
    } as unknown as Conversation,
  ]
}

beforeEach(() => {
  localStorage.clear()
  useAchievementStore.getState().resetAchievements()
  useChatStore.setState({ conversations: [] })
  useModuleStore.setState({ modules: {} })
})

describe('Conversation Starter (chat-engaged)', () => {
  it('is earned at 10 Assistant questions and no old chat messages', () => {
    useAchievementStore.setState({ assistantQuestionCount: 10 })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(true)
  })

  it('is not earned at 9', () => {
    useAchievementStore.setState({ assistantQuestionCount: 9 })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(false)
  })

  it('is earned by a mix: 4 old chat messages and 6 Assistant questions', () => {
    useChatStore.setState({ conversations: oldChat(4) })
    useAchievementStore.setState({ assistantQuestionCount: 6 })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(true)
  })

  it('is not earned by 4 + 5', () => {
    useChatStore.setState({ conversations: oldChat(4) })
    useAchievementStore.setState({ assistantQuestionCount: 5 })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(false)
  })

  it('is still earned by 10 old chat messages alone', () => {
    useChatStore.setState({ conversations: oldChat(10) })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(true)
  })

  it('is earned live as the tenth question is recorded', () => {
    useAchievementStore.setState({ assistantQuestionCount: 9 })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(false)
    act(() => useAchievementStore.getState().recordAssistantQuestion())
    expect(earned('chat-engaged')).toBe(true)
  })

  it('a damaged stored count earns nothing and breaks nothing', () => {
    useAchievementStore.setState({ assistantQuestionCount: '12' as unknown as number })
    renderHook(() => useAchievementChecker())
    expect(earned('chat-engaged')).toBe(false)
  })
})

describe('Full Journey (full-journey)', () => {
  const find = (id: string) => ACHIEVEMENT_CATALOG.find((a) => a.id === id)!
  const snap = (over: Partial<ActivitySnapshot>) => over as ActivitySnapshot

  it('is earned with the five sections and one Assistant question', () => {
    useAchievementStore.setState({ sectionsVisited: FIVE, assistantQuestionCount: 1 })
    renderHook(() => useAchievementChecker())
    expect(earned('full-journey')).toBe(true)
  })

  it('is not earned with the five sections and no question', () => {
    useAchievementStore.setState({ sectionsVisited: FIVE, assistantQuestionCount: 0 })
    renderHook(() => useAchievementChecker())
    expect(earned('full-journey')).toBe(false)
  })

  it('is not earned with a question and only four sections', () => {
    useAchievementStore.setState({ sectionsVisited: FIVE.slice(1), assistantQuestionCount: 3 })
    renderHook(() => useAchievementChecker())
    expect(earned('full-journey')).toBe(false)
  })

  it('its condition still reads chatMessageCount (the field name is unchanged)', () => {
    expect(
      find('full-journey').condition(snap({ sectionsVisited: FIVE, chatMessageCount: 1 }))
    ).toBe(true)
    expect(
      find('full-journey').condition(snap({ sectionsVisited: FIVE, chatMessageCount: 0 }))
    ).toBe(false)
  })
})

describe('badge wording', () => {
  const find = (id: string) => ACHIEVEMENT_CATALOG.find((a) => a.id === id)!
  it('speaks of the Assistant and its questions, not of chat messages', () => {
    expect(find('chat-engaged').description).toBe('Asked the PQC Assistant 10 or more questions')
    expect(find('full-journey').description).toBe(
      'Used Learn, Assess, Migrate, Playground, Simulation, and the Assistant'
    )
  })
})
