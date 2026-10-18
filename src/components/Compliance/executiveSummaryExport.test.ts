// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { buildExecutiveSummaryCsv } from './executiveSummaryExport'
import type { ComplianceFramework } from '@/data/complianceData'

describe('buildExecutiveSummaryCsv', () => {
  it('exports applicability evidence and study prompts, not GRC or certification records', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'))
    const item = {
      id: 'rule',
      label: 'Scoped rule',
      bindingStatus: 'mandatory_for_scope',
      bindingBasis: 'Act 1, section 2',
      bindingScope: 'Covered entities',
      pqcRequirement: 'partial',
      deadline: '2030',
      website: 'https://example.test/rule',
      lastVerified: '2026-10-16',
    } as ComplianceFramework
    const csv = buildExecutiveSummaryCsv(
      { country: 'United States', industry: 'Finance & Insurance' },
      [{ item, tier: 'mandatory', reason: 'Binding for its stated scope' }]
    )
    expect(csv).toContain('Binding basis')
    expect(csv).toContain('Act 1, section 2')
    expect(csv).toContain('Study prompt: what would you verify?')
    expect(csv).not.toContain('Decision,Owner,Mapped controls')
    expect(csv).not.toContain('Certificate ID')
    vi.useRealTimers()
  })
})
