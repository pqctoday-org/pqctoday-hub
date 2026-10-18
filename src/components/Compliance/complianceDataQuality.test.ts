// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ComplianceFramework } from '@/data/complianceData'
import { summarizeComplianceDataQuality } from './complianceDataQuality'

describe('summarizeComplianceDataQuality', () => {
  it('keeps freshness coverage separate from binding-basis coverage', () => {
    const rows = [
      {
        lastVerified: '2026-10-16',
        bindingStatus: 'mandatory_for_scope',
        bindingBasis: 'Act, section 1',
      },
      { lastVerified: '2024-01-01', bindingStatus: 'recommendation' },
      { bindingStatus: 'binding' },
    ] as ComplianceFramework[]

    expect(summarizeComplianceDataQuality(rows, new Date('2026-10-17T00:00:00Z'))).toEqual({
      total: 3,
      sourceCheckRecorded: 1,
      sourceCheckOlderThanYear: 1,
      sourceCheckMissing: 1,
      bindingRows: 2,
      bindingRowsMissingBasis: 1,
    })
  })
})
