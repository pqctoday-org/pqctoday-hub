// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkshopStore } from './useWorkshopStore'

describe('useWorkshopStore', () => {
  beforeEach(() => {
    useWorkshopStore.getState().reset()
  })

  it('starts in idle mode with no current step', () => {
    const s = useWorkshopStore.getState()
    expect(s.mode).toBe('idle')
    expect(s.currentStepId).toBeNull()
    expect(s.completedStepIds).toEqual([])
  })

  it('start() transitions to running and seeds region + step', () => {
    useWorkshopStore.getState().start('exec-flow', 'intro-01-welcome', 'US')
    const s = useWorkshopStore.getState()
    expect(s.mode).toBe('running')
    expect(s.currentFlowId).toBe('exec-flow')
    expect(s.currentStepId).toBe('intro-01-welcome')
    expect(s.selectedRegion).toBe('US')
    expect(s.startedAt).toBeTruthy()
  })

  it('pause() then resume() round-trips', () => {
    useWorkshopStore.getState().start('exec-flow', 'a', 'CA')
    useWorkshopStore.getState().pause()
    expect(useWorkshopStore.getState().mode).toBe('paused')
    useWorkshopStore.getState().resume()
    expect(useWorkshopStore.getState().mode).toBe('running')
  })

  it('exit() returns to idle and clears step state', () => {
    useWorkshopStore.getState().start('exec-flow', 'a', 'AU')
    useWorkshopStore.getState().exit()
    const s = useWorkshopStore.getState()
    expect(s.mode).toBe('idle')
    expect(s.currentStepId).toBeNull()
    expect(s.completedStepIds).toEqual([])
  })

  it('markStepComplete() is idempotent', () => {
    useWorkshopStore.getState().start('exec-flow', 'a', 'US')
    useWorkshopStore.getState().markStepComplete('a')
    useWorkshopStore.getState().markStepComplete('a')
    expect(useWorkshopStore.getState().completedStepIds).toEqual(['a'])
  })

  it('startVideo() puts mode into video', () => {
    useWorkshopStore.getState().startVideo('exec-flow', 'first', 'CA')
    expect(useWorkshopStore.getState().mode).toBe('video')
    expect(useWorkshopStore.getState().selectedRegion).toBe('CA')
  })
})
