// SPDX-License-Identifier: GPL-3.0-only
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
