// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { complianceFrameworks } from '@/data/complianceData'
import { COMPLIANCE_MANDATES } from './industryComplianceData'

describe('DataAssetSensitivity compliance mandates', () => {
  const activeIds = new Set(complianceFrameworks.map((f) => f.id))

  it('every csvId resolves to an active CSV row', () => {
    const broken: string[] = []
    for (const m of COMPLIANCE_MANDATES) {
      if (m.csvId && !activeIds.has(m.csvId)) {
        broken.push(`${m.id}: csvId "${m.csvId}" not in active CSV`)
      }
    }
    expect(broken).toEqual([])
  })

  it('states GDPR scope through its territorial triggers, not residence alone', () => {
    const gdpr = COMPLIANCE_MANDATES.find((m) => m.id === 'GDPR')!
    // Art. 3(1): establishment in the Union; Art. 3(2): offering to, or monitoring, people in the Union.
    expect(gdpr.scope).toMatch(/establishment/)
    expect(gdpr.scope).toMatch(/offering goods or services/)
    expect(gdpr.scope).toMatch(/monitoring the behaviour/)
    expect(gdpr.scope).not.toMatch(/EU residents processed by any organization globally/)
    expect(gdpr.pqcRequirement).not.toMatch(/PQC will become expected/)
  })

  it('has no forward-looking deadlineYear in the past', () => {
    const currentYear = new Date().getFullYear()
    const stale: string[] = []
    for (const m of COMPLIANCE_MANDATES) {
      if (m.deadlineYear !== null && m.deadlineYear < currentYear) {
        stale.push(
          `${m.id}: deadlineYear ${m.deadlineYear} is past — set to null or update to the next applicable deadline`
        )
      }
    }
    expect(stale).toEqual([])
  })
})
