// SPDX-License-Identifier: AGPL-3.0-only
import { jurisdictionConfigsFor } from '@/data/jurisdictionsData'

export interface JurisdictionConfig {
  id: string
  label: string
  region: string
  countryNames: string[]
}

/**
 * The jurisdictions this module offers, in picker order, as [module id, registry code].
 * The module id keys the module's own data (complianceFrameworks.ts, saved selections); it is
 * the lowercase registry code except the long-standing 'uk'. The name, region group and country
 * name each entry shows come from the jurisdictions registry (jurisdictions_*.csv).
 */
const OFFERED: ReadonlyArray<readonly [id: string, code: string]> = [
  // North America
  ['us', 'US'],
  ['ca', 'CA'],
  // Europe
  ['eu', 'EU'],
  ['uk', 'GB'],
  ['fr', 'FR'],
  ['de', 'DE'],
  ['cz', 'CZ'],
  ['it', 'IT'],
  ['es', 'ES'],
  // Asia Pacific
  ['jp', 'JP'],
  ['kr', 'KR'],
  ['au', 'AU'],
  ['sg', 'SG'],
  ['nz', 'NZ'],
  ['cn', 'CN'],
  ['in', 'IN'],
  ['tw', 'TW'],
  ['hk', 'HK'],
  ['my', 'MY'],
  // Middle East
  ['il', 'IL'],
  ['ae', 'AE'],
  ['sa', 'SA'],
  ['bh', 'BH'],
  ['jo', 'JO'],
]

export const JURISDICTIONS: JurisdictionConfig[] = jurisdictionConfigsFor(OFFERED)
