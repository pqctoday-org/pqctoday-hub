// SPDX-License-Identifier: AGPL-3.0-only
import type { PaymentNetwork } from './emvConstants'

/**
 * Same-period purchase-volume comparison for the Network Comparator.
 *
 * Network volume figures are not interchangeable: they differ in what they measure (purchases,
 * or network volume including cash), the period they cover, their currency, and whether the
 * source gives an exact figure or only "more than". Adding them all together gives a number
 * that describes nothing, so only rows that match on every one of those points are added, and
 * the result says how many of the networks it covers.
 */

export interface PurchaseComparisonPeriod {
  start: string
  end: string
  label: string
}

/** Calendar 2025, the one period for which two networks report purchases on the same basis. */
export const CALENDAR_2025: PurchaseComparisonPeriod = {
  start: '2025-01-01',
  end: '2025-12-31',
  label: 'calendar 2025',
}

export interface ExcludedNetwork {
  id: string
  name: string
  reason: string
}

export interface PurchaseVolumeComparison {
  /** Sum in USD billions, or null when no selected network has a compatible figure. */
  totalUsdBn: number | null
  includedIds: string[]
  excluded: ExcludedNetwork[]
  /** Number of networks selected, whether or not they are in the sum. */
  selectedCount: number
  /** E.g. "2 of 5 networks". */
  coverageLabel: string
  periodLabel: string
}

function exclusionReason(network: PaymentNetwork, period: PurchaseComparisonPeriod): string | null {
  const v = network.figures.volume
  if (v === null) return 'No dated, same-scope annual volume is established for this network'
  if (!Number.isFinite(v.usdBn) || v.usdBn < 0) throw new Error(`Invalid volume for ${network.id}`)
  if (v.metric !== 'purchase-volume') {
    return 'Reports network volume that includes cash advances and other payments, not purchases only'
  }
  if (v.periodStart !== period.start || v.periodEnd !== period.end) {
    return 'Covers a different period'
  }
  if (v.currency !== 'USD') return 'Reported in a different currency, and no conversion is assumed'
  if (v.lowerBound) return 'Reported only as "more than", which cannot be added as an exact figure'
  return null
}

/**
 * Adds only the selected networks whose volume is a purchase-volume figure for the same period,
 * in USD, reported as an exact figure. Returns a null total, never zero, when none qualifies.
 */
export function comparePurchaseVolume(
  networks: PaymentNetwork[],
  period: PurchaseComparisonPeriod = CALENDAR_2025
): PurchaseVolumeComparison {
  if (new Set(networks.map((n) => n.id)).size !== networks.length) {
    throw new Error('Duplicate network')
  }
  const includedIds: string[] = []
  const excluded: ExcludedNetwork[] = []
  let thousandths = 0
  for (const network of networks) {
    const reason = exclusionReason(network, period)
    if (reason !== null) {
      excluded.push({ id: network.id, name: network.name, reason })
      continue
    }
    // Work in thousandths of a billion so decimal figures add without floating-point drift.
    thousandths += Math.round((network.figures.volume?.usdBn ?? 0) * 1000)
    includedIds.push(network.id)
  }
  return {
    totalUsdBn: includedIds.length > 0 ? thousandths / 1000 : null,
    includedIds,
    excluded,
    selectedCount: networks.length,
    coverageLabel: `${includedIds.length} of ${networks.length} networks`,
    periodLabel: period.label,
  }
}

/** Formats a USD-billion total as shown on the page, e.g. "$23,366B". */
export function formatUsdBillions(usdBn: number): string {
  return `$${usdBn.toLocaleString('en-US')}B`
}
