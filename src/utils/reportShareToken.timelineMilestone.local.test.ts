// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { decodeShareToken, encodeShareToken } from './reportShareToken'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '@/data/exampleReport'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

const pair = { id: 'Sample migration deadline', authority: 'Sample Authority', year: 2035 }

const distantResult = (): AssessmentResult =>
  computeAssessment({
    ...EXAMPLE_REPORT_SHARE_PAYLOAD,
    timelinePressure: 'internal-deadline',
    timelineMilestone: pair,
  })

function decodeV2(result: AssessmentResult): AssessmentResult {
  const decoded = decodeShareToken(encodeShareToken({ result }))
  if (decoded?.v !== 2) throw new Error('expected a v2 token')
  return decoded.result
}

/** A link is untrusted: build one whose profile carries whatever the test wants. */
function tamperedToken(pairValue: unknown, pressure = 'internal-deadline'): string {
  const result = distantResult()
  const profile = { ...result.assessmentProfile!, timelinePressure: pressure } as Record<
    string,
    unknown
  >
  profile.timelineMilestone = pairValue
  return encodeShareToken({ result: { ...result, assessmentProfile: profile } as never })
}

describe('shared report links carry the chosen milestone', () => {
  it('round-trips the pair and keeps the summary value', () => {
    const result = distantResult()
    expect(result.assessmentProfile?.timelinePressure).toBe('internal-deadline')
    expect(result.assessmentProfile?.timelineMilestone).toEqual(pair)
    const back = decodeV2(result)
    expect(back.assessmentProfile?.timelinePressure).toBe('internal-deadline')
    expect(back.assessmentProfile?.timelineMilestone).toEqual(pair)
    expect(back.riskScore).toBe(result.riskScore)
  })

  it('a link made without a pair, or before pairs existed, decodes as before', () => {
    const plain = computeAssessment({
      ...EXAMPLE_REPORT_SHARE_PAYLOAD,
      timelinePressure: 'internal-deadline',
    })
    expect(plain.assessmentProfile).not.toHaveProperty('timelineMilestone')
    const back = decodeV2(plain)
    expect(back.assessmentProfile).not.toHaveProperty('timelineMilestone')
    expect(back.assessmentProfile?.timelinePressure).toBe('internal-deadline')
  })

  it('drops a pair of an unknown shape and still opens the report', () => {
    const shapes: unknown[] = [
      'text',
      42,
      [pair],
      { id: 'A' },
      { id: 1, authority: 'B' },
      { id: 'x'.repeat(5000), authority: 'B' },
      { id: 'A', authority: 'B\ninjected' },
    ]
    for (const shape of shapes) {
      const decoded = decodeShareToken(tamperedToken(shape))
      if (decoded?.v !== 2) throw new Error('expected a v2 token')
      expect(decoded.result.assessmentProfile).not.toHaveProperty('timelineMilestone')
      expect(decoded.result.assessmentProfile?.timelinePressure).toBe('internal-deadline')
      expect(decoded.result.riskScore).toBe(distantResult().riskScore)
    }
  })

  it('keeps only the known fields of a valid pair and drops one that does not fit the summary value', () => {
    const decoded = decodeShareToken(tamperedToken({ ...pair, injected: '<script>' }))
    if (decoded?.v !== 2) throw new Error('expected a v2 token')
    expect(decoded.result.assessmentProfile?.timelineMilestone).toEqual(pair)

    const noDeadline = decodeShareToken(tamperedToken(pair, 'no-deadline'))
    if (noDeadline?.v !== 2) throw new Error('expected a v2 token')
    expect(noDeadline.result.assessmentProfile).not.toHaveProperty('timelineMilestone')
  })
})
