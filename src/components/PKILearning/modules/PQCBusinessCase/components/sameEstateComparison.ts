// SPDX-License-Identifier: AGPL-3.0-only
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { computeMigrationCostFromProfile } from '@/utils/roiMath'
import { MIN_PRODUCT_COUNT, MAX_PRODUCT_COUNT } from './roiProductCount'

/** First matching closed range wins: 200 remains in 51–200; the final band starts at 201. */
export function estateScaleBand(count: number): '1-10' | '11-50' | '51-200' | '200-plus' {
  if (!Number.isInteger(count) || count < MIN_PRODUCT_COUNT || count > MAX_PRODUCT_COUNT)
    throw new RangeError('Enter a whole estate count from 1 to 1,000,000')
  if (count <= 10) return '1-10'
  if (count <= 50) return '11-50'
  if (count <= 200) return '51-200'
  return '200-plus'
}

/** Adopt the existing assessment attributes as assumptions for this same fictional estate.
 * Only its scale band is replaced. No coefficient, assessment answer or store is mutated. */
export function sameEstateProfileEstimate(result: AssessmentResult, count: number) {
  const band = estateScaleBand(count)
  const estimate = computeMigrationCostFromProfile({
    ...result,
    assessmentProfile: { ...result.assessmentProfile, systemScale: band },
  })
  const d = estimate.details
  const vulnerable = result.algorithmMigrations?.filter((a) => a.quantumVulnerable) ?? []
  const subcategories = Object.entries(result.assessmentProfile?.infrastructureSubCategories ?? {})
    .map(([layer, values]) => `${layer}: ${values.join(', ')}`)
    .join('; ')
  return {
    ...estimate,
    count,
    band,
    bandLabel: band === '200-plus' ? '201 or more' : band.replace('-', '–'),
    assumptions: [
      `Vulnerable algorithm count: ${d.algoCount}${vulnerable.length ? ` (${vulnerable.map((a) => a.classical).join(', ')})` : ' (existing one-algorithm model fallback; none recorded)'}; algorithm base $${d.algoBase.toLocaleString('en-US')}`,
      `Infrastructure: ${d.infraLayers.join(', ') || (result.assessmentProfile?.infrastructureUnknown ? 'unknown; existing three-layer fallback' : 'none recorded')}; base $${d.infraBase.toLocaleString('en-US')}`,
      `Infrastructure subcategories: ${subcategories || 'none recorded'} (included in the infrastructure base)`,
      `Vendor dependency: ${d.vendorLabel} (${d.vendorMul}×)`,
      `Migration status: ${d.migrationStatus} (${d.migrationDiscount}× remaining-work factor)`,
      `Crypto agility: ${d.agilityLabel} (${d.agilityMul}×)`,
      `Team size: ${d.teamLabel} (${d.teamMul}×)`,
    ],
  }
}
