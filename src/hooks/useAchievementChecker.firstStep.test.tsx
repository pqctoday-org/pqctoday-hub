// SPDX-License-Identifier: GPL-3.0-only
/**
 * UX batch 2 (2026-09-19, CC-2): "First Steps" must not fire from a tab switch.
 * completedSteps holds tab ids too ('learn' is recorded when you leave the Learn
 * tab); only real workshop step ids count toward totalCompletedSteps.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useModuleStore } from '@/store/useModuleStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { WORKSHOP_STEPS } from '@/components/PKILearning/moduleData'
import { useAchievementChecker } from './useAchievementChecker'

const MODULE = 'pqc-101'

describe('useAchievementChecker — First Steps', () => {
  beforeEach(() => {
    useModuleStore.setState({ modules: {} })
    useAchievementStore.setState({ unlocked: [] })
  })

  it('does not unlock when only a tab id is in completedSteps', () => {
    useModuleStore.setState({
      modules: {
        [MODULE]: { status: 'in-progress', completedSteps: ['learn'], timeSpent: 0 } as never,
      },
    })
    renderHook(() => useAchievementChecker())
    expect(useAchievementStore.getState().unlocked.some((u) => u.id === 'first-step')).toBe(false)
  })

  it('unlocks once a real workshop step id is in completedSteps', () => {
    const firstStep = WORKSHOP_STEPS[MODULE]?.[0]?.id
    expect(firstStep).toBeTruthy()
    useModuleStore.setState({
      modules: {
        [MODULE]: {
          status: 'in-progress',
          completedSteps: ['learn', firstStep],
          timeSpent: 0,
        } as never,
      },
    })
    renderHook(() => useAchievementChecker())
    expect(useAchievementStore.getState().unlocked.some((u) => u.id === 'first-step')).toBe(true)
  })
})
