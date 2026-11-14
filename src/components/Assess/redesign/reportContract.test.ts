// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FAST_REPORT_SECTIONS, FULL_LOCKED_SECTIONS, FULL_ONLY_SECTIONS } from './reportContract'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '@/data/exampleReport'

describe('track contract matches what each track produces', () => {
  it('a fast-track result has no HNDL window, so the fast list must not promise one', () => {
    const quick = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    expect(quick.assessmentProfile?.mode).not.toBe('comprehensive')
    expect(quick.hndlRiskWindow).toBeUndefined()
    expect(quick.tnflRiskWindow).toBeUndefined()
    expect(FAST_REPORT_SECTIONS.join('|')).not.toMatch(/HNDL|HNFL/)
  })

  it('names the risk windows as full-track additions, separate from the locked sections', () => {
    expect(FULL_ONLY_SECTIONS).toEqual(['HNDL & HNFL risk windows'])
    expect(FULL_LOCKED_SECTIONS).not.toContain(FULL_ONLY_SECTIONS[0])
  })

  it('a fast-track result renders the algorithm migration matrix it advertises', () => {
    const quick = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    expect(FAST_REPORT_SECTIONS).toContain('Algorithm migration matrix')
    expect(quick.algorithmMigrations.length).toBeGreaterThan(0)
  })
})
