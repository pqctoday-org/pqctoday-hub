// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A certification engineer's journey opens with the validation tests (owner decision, 29 Oct 2026),
 * matching the home picker, the board's main button and the Learn landing's next step. The start
 * milestone is a first step: it is never the "you are here" marker, so a learner deep in the
 * lessons is not pointed back at it.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useJourneyMap } from './useJourneyMap'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONA_FIRST_STEP } from '@/data/personaConfig'

const WORKBENCH = '/playground/hsm?tab=build&dtab=acvp&engine=dual'

describe('useJourneyMap — start milestone for the certification engineer', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: 'cert-engineer' })
    useModuleStore.setState({ modules: {} })
  })

  it('puts Run Validation Tests before the first lesson, pointing at the workbench', () => {
    const { result } = renderHook(() => useJourneyMap())
    const first = result.current.phases[0]
    expect(first.type).toBe('milestone')
    expect(first.label).toBe('Run Validation Tests')
    expect(first.items[0].route).toBe(WORKBENCH)
    expect(result.current.phases[1].type).toBe('learning')
  })

  it('shows the validation tests only once, not again after the first checkpoint', () => {
    const { result } = renderHook(() => useJourneyMap())
    const labels = result.current.phases.filter((p) => p.type === 'milestone').map((p) => p.label)
    expect(labels.filter((l) => l === 'Run Validation Tests')).toHaveLength(1)
  })

  it('marks the first lesson phase, not the start milestone, as the current one', () => {
    const { result } = renderHook(() => useJourneyMap())
    const current = result.current.phases[result.current.currentPhaseIndex]
    expect(current.type).toBe('learning')
  })

  it('leaves the other roles without a start milestone', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    const { result } = renderHook(() => useJourneyMap())
    expect(result.current.phases[0].type).toBe('learning')
  })

  it('uses the same destination as the My Path first step', () => {
    expect(PERSONA_FIRST_STEP['cert-engineer']?.route).toBe(WORKBENCH)
  })
})
