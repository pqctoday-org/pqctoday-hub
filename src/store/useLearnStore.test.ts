// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useLearnStore } from './useLearnStore'

describe('useLearnStore', () => {
  beforeEach(() => {
    useLearnStore.getState().reset()
    localStorage.clear()
  })

  it('starts with safe defaults', () => {
    const state = useLearnStore.getState()
    expect(state.showEverything).toBe(false)
    expect(state.phaseExpansion).toEqual({})
    expect(state.researcherSortOverride).toBeNull()
  })

  it('setShowEverything flips the curious escape', () => {
    useLearnStore.getState().setShowEverything(true)
    expect(useLearnStore.getState().showEverything).toBe(true)
    useLearnStore.getState().setShowEverything(false)
    expect(useLearnStore.getState().showEverything).toBe(false)
  })

  it('setPhaseExpanded writes per-key without disturbing siblings', () => {
    useLearnStore.getState().setPhaseExpanded('curious:cp-1', true)
    useLearnStore.getState().setPhaseExpanded('curious:cp-2', false)
    expect(useLearnStore.getState().phaseExpansion).toEqual({
      'curious:cp-1': true,
      'curious:cp-2': false,
    })
  })

  it('reset returns to defaults', () => {
    useLearnStore.getState().setShowEverything(true)
    useLearnStore.getState().setPhaseExpanded('x', true)
    useLearnStore.getState().setResearcherSortOverride('recently')
    useLearnStore.getState().reset()
    const s = useLearnStore.getState()
    expect(s.showEverything).toBe(false)
    expect(s.phaseExpansion).toEqual({})
    expect(s.researcherSortOverride).toBeNull()
  })

  it('persists to localStorage under pqc-learn-storage', () => {
    useLearnStore.getState().setShowEverything(true)
    const raw = localStorage.getItem('pqc-learn-storage')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.version).toBe(1)
    expect(parsed.state.showEverything).toBe(true)
  })
})
