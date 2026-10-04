// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { decodeShareToken, encodeShareToken } from './reportShareToken'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '@/data/exampleReport'

describe('report share links carry the frameworks that were left out', () => {
  it('round-trips omittedCompliance inside the shared result', () => {
    const result = computeAssessment({
      ...EXAMPLE_REPORT_SHARE_PAYLOAD,
      complianceRequirements: ['PCI DSS', 'DORA (EU Digital Operational Resilience)'],
    })
    expect(result.omittedCompliance).toEqual(['DORA (EU Digital Operational Resilience)'])

    const decoded = decodeShareToken(encodeShareToken({ result }))
    expect(decoded?.v).toBe(2)
    if (decoded?.v !== 2) throw new Error('expected a v2 token')
    expect(decoded.result.omittedCompliance).toEqual(['DORA (EU Digital Operational Resilience)'])
  })

  it('a link made before the field existed decodes with none left out', () => {
    const result = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    const { omittedCompliance: _unused, ...older } = result
    void _unused
    const decoded = decodeShareToken(encodeShareToken({ result: older }))
    if (decoded?.v !== 2) throw new Error('expected a v2 token')
    expect(decoded.result.omittedCompliance).toBeUndefined()
  })
})
