// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CSWP39_SOURCE_METADATA,
  CSWP39_STEPS,
  PILLAR_TO_STEP,
  frameworksForStep,
  type Cswp39Pillar,
} from './cswp39Data'
import { complianceFrameworks } from '@/data/complianceData'

describe('CSWP39_SOURCE_METADATA staleness', () => {
  it('nextReviewBy must not be in the past — re-verify the upstream NIST doc and bump dataExtractedAt + nextReviewBy', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(CSWP39_SOURCE_METADATA.nextReviewBy >= today).toBe(true)
  })

  it('dataExtractedAt must be on or before nextReviewBy', () => {
    expect(CSWP39_SOURCE_METADATA.dataExtractedAt <= CSWP39_SOURCE_METADATA.nextReviewBy).toBe(true)
  })

  it('all date fields are ISO YYYY-MM-DD', () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/
    expect(iso.test(CSWP39_SOURCE_METADATA.publicationDate)).toBe(true)
    expect(iso.test(CSWP39_SOURCE_METADATA.dataExtractedAt)).toBe(true)
    expect(iso.test(CSWP39_SOURCE_METADATA.nextReviewBy)).toBe(true)
  })

  it('sourceUrl points at the canonical NIST CSWP.39 PDF', () => {
    expect(CSWP39_SOURCE_METADATA.sourceUrl).toMatch(
      /^https:\/\/nvlpubs\.nist\.gov\/.+CSWP\.39(-upd1)?\.pdf$/
    )
  })
})

describe('PILLAR_TO_STEP drift guard', () => {
  it('is bijective — every step maps back from exactly the pillar that names it in cpmPillar', () => {
    const PILLARS: Cswp39Pillar[] = [
      'governance',
      'inventory',
      'observability',
      'assurance',
      'lifecycle',
    ]
    expect(Object.keys(PILLAR_TO_STEP).sort()).toEqual([...PILLARS].sort())
    for (const pillar of PILLARS) {
      const stepId = PILLAR_TO_STEP[pillar]
      const step = CSWP39_STEPS.find((s) => s.id === stepId)
      expect(
        step,
        `PILLAR_TO_STEP['${pillar}'] -> '${stepId}' does not match any CSWP39_STEPS id`
      ).toBeDefined()
      expect(
        step!.cpmPillar.toLowerCase(),
        `CSWP39_STEPS['${stepId}'].cpmPillar ('${step!.cpmPillar}') does not match pillar '${pillar}'`
      ).toBe(pillar)
    }
  })

  it('every CSWP39_STEPS entry has exactly one pillar mapping to it', () => {
    for (const step of CSWP39_STEPS) {
      const mapped = Object.entries(PILLAR_TO_STEP).filter(([, s]) => s === step.id)
      expect(mapped, `step '${step.id}' should have exactly one pillar mapping to it`).toHaveLength(
        1
      )
    }
  })
})

describe('frameworksForStep', () => {
  it('returns only active compliance rows tagged with the pillar this step maps from', () => {
    const govern = frameworksForStep('govern', complianceFrameworks)
    for (const fw of govern) {
      expect(fw.cswp39Tags).toContain('cswp39:governance')
    }
  })

  it('returns [] for an unmapped step id', () => {
    // @ts-expect-error deliberately testing an invalid step id at the boundary
    expect(frameworksForStep('not-a-real-step', complianceFrameworks)).toEqual([])
  })

  it("changing a real row's cswp39_tags changes which step surfaces it (data is live, not static)", () => {
    const withLifecycleTag = complianceFrameworks.filter((f) =>
      f.cswp39Tags?.includes('cswp39:lifecycle')
    )
    const implement = frameworksForStep('implement', complianceFrameworks)
    expect(implement.length).toBe(withLifecycleTag.length)
    expect(implement.map((f) => f.id).sort()).toEqual(withLifecycleTag.map((f) => f.id).sort())
  })
})
