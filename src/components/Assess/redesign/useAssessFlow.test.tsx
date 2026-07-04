// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAssessFlow } from './useAssessFlow'
import { useAssessmentStore } from '../../../store/useAssessmentStore'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

beforeEach(() => {
  act(() => useAssessmentStore.getState().reset())
})

describe('useAssessFlow', () => {
  it('full track starts at industry, gates Continue until valid, then advances', () => {
    const onLastStep = vi.fn()
    const { result } = renderHook(() => useAssessFlow({ mode: 'comprehensive', onLastStep }), {
      wrapper,
    })

    expect(result.current.total).toBe(13)
    expect(result.current.stepIdx).toBe(0)
    expect(result.current.activeKey).toBe('industry')
    expect(result.current.canProceed).toBe(false)

    // Invalid Continue does not advance; it flags the step as attempted.
    act(() => result.current.next())
    expect(result.current.stepIdx).toBe(0)
    expect(result.current.attempted).toBe(true)

    // Answering unblocks Continue.
    act(() => useAssessmentStore.getState().setIndustry('Finance & Banking'))
    expect(result.current.canProceed).toBe(true)

    act(() => result.current.next())
    expect(result.current.stepIdx).toBe(1)
    expect(result.current.activeKey).toBe('country')
  })

  it('quick track is 6 steps and back from step 1 returns to step 0', () => {
    const { result } = renderHook(() => useAssessFlow({ mode: 'quick', onLastStep: vi.fn() }), {
      wrapper,
    })
    expect(result.current.total).toBe(6)

    act(() => useAssessmentStore.getState().setIndustry('Healthcare'))
    act(() => result.current.next())
    expect(result.current.stepIdx).toBe(1)

    act(() => result.current.back())
    expect(result.current.stepIdx).toBe(0)
    expect(result.current.activeKey).toBe('industry')
  })

  it('writes the track-relative legacy index into store.currentStep', () => {
    const { result } = renderHook(
      () => useAssessFlow({ mode: 'comprehensive', onLastStep: vi.fn() }),
      { wrapper }
    )
    // Answer industry + country, advance twice → render position 2 (crypto).
    act(() => useAssessmentStore.getState().setIndustry('Technology & Software'))
    act(() => result.current.next())
    act(() => useAssessmentStore.getState().setCountry('United States'))
    act(() => result.current.next())
    expect(result.current.activeKey).toBe('crypto')
    // crypto is legacy index 2 in comprehensive → store.currentStep === 2
    expect(useAssessmentStore.getState().currentStep).toBe(2)
  })
})
