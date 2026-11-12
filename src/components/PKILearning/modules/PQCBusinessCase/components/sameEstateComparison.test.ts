// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { estateScaleBand, sameEstateProfileEstimate } from './sameEstateComparison'
const result = {
  algorithmMigrations: ['RSA', 'ECDSA', 'ECDH'].map((classical) => ({
    classical,
    quantumVulnerable: true,
  })),
  assessmentProfile: {
    systemScale: '200-plus',
    infrastructure: [],
    vendorDependency: 'mixed',
    migrationStatus: 'not-started',
    teamSize: '11-50',
  },
} as unknown as AssessmentResult
it.each([
  [1, '1-10', 90000],
  [10, '1-10', 90000],
  [11, '11-50', 117000],
  [50, '11-50', 117000],
  [51, '51-200', 162000],
  [200, '51-200', 162000],
  [201, '200-plus', 270000],
  [1000000, '200-plus', 270000],
] as const)('maps count%d into existing band%s and coefficients', (n, band, cost) => {
  const before = JSON.stringify(result)
  expect(estateScaleBand(n)).toBe(band)
  const actual = sameEstateProfileEstimate(result, n)
  expect(actual.migrationCost).toBe(cost)
  expect(actual.count).toBe(n)
  expect(JSON.stringify(result)).toBe(before)
})
it.each([0, -1, NaN, 1.5, 1000001])(
  'rejects unsupported count %s rather than selecting a plausible band',
  (n) => {
    expect(() => sameEstateProfileEstimate(result, n)).toThrow(RangeError)
  }
)
it('changes adopted attributes with the same estate while retaining existing multipliers and infrastructure costs', () => {
  const base = sameEstateProfileEstimate(result, 51)
  const vendor = sameEstateProfileEstimate(
    {
      ...result,
      assessmentProfile: { ...result.assessmentProfile!, vendorDependency: 'heavy-vendor' },
    },
    51
  )
  expect(base.migrationCost).toBe(162000)
  expect(vendor.migrationCost).toBe(226800)
  const infra = sameEstateProfileEstimate(
    { ...result, assessmentProfile: { ...result.assessmentProfile!, infrastructure: ['Network'] } },
    51
  )
  expect(infra.migrationCost).toBe(212000)
  expect(infra.assumptions.join(' ')).toContain('Network')
  const partial = sameEstateProfileEstimate(
    { ...result, assessmentProfile: { ...result.assessmentProfile!, migrationStatus: 'started' } },
    51
  )
  expect(partial.migrationCost).toBe(64800)
})
