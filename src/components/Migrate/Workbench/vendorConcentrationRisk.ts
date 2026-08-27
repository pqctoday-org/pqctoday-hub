// SPDX-License-Identifier: GPL-3.0-only
//
// Pure extraction (2026-08-24 audit fix) from VendorConcentrationRiskPanel.tsx
// — the "Vendor risk" tab's concentration/single-source/cert-gap/geographic
// computation, unchanged, so desktop and mobile compute the same 4 numbers
// and the same `severe` verdict from the same catalog data. Before this
// extraction, MobileMigrateView.tsx carried its own copy of this computation
// with different severity thresholds (25/50/40 vs this file's 40/30/50) —
// identical vendor data could read "severe" on one device and calm on the
// other. No logic changed here; only the home address.
import { useMemo } from 'react'
import { softwareData, vendorMap } from '@/data/migrateData'
import { REPLACE_ASSETS } from '@/data/migrationAssets'
import { productsForDomain } from './workbenchCatalog'
import { productPqcStatus, productFipsBadge } from './productStatus'

export interface RiskCard {
  key: string
  title: string
  headline: string
  detail: string
  severe: boolean
}

export function useVendorConcentrationRisks(): RiskCard[] {
  return useMemo(() => {
    // ── Single-source domains: exactly one GA product covers this asset ──
    const singleSource = REPLACE_ASSETS.filter((asset) => {
      const gaCount = productsForDomain(asset.id).filter(
        (p) => productPqcStatus(p).status === 'ga'
      ).length
      return gaCount === 1
    })

    // ── Vendor concentration: which vendor supplies the most GA products ──
    const gaProducts = softwareData.filter((p) => productPqcStatus(p).status === 'ga')
    const gaByVendor = new Map<string, number>()
    for (const p of gaProducts) {
      if (!p.vendorId) continue
      gaByVendor.set(p.vendorId, (gaByVendor.get(p.vendorId) ?? 0) + 1)
    }
    const topVendorEntry = [...gaByVendor.entries()].sort((a, b) => b[1] - a[1])[0]
    const topVendor = topVendorEntry ? vendorMap.get(topVendorEntry[0]) : undefined
    const topVendorShare =
      topVendorEntry && gaProducts.length > 0
        ? Math.round((topVendorEntry[1] / gaProducts.length) * 100)
        : 0

    // ── Certification gap: GA products with no FIPS validation on record ──
    const gaWithoutFips = gaProducts.filter((p) => productFipsBadge(p) === null)
    const certGapPct =
      gaProducts.length > 0 ? Math.round((gaWithoutFips.length / gaProducts.length) * 100) : 0

    // ── Geographic concentration: HQ country of vendors actually in the catalog ──
    const usedVendors = [...vendorMap.values()].filter((v) => (v.productCount ?? 0) > 0)
    const byCountry = new Map<string, number>()
    for (const v of usedVendors) {
      byCountry.set(v.hqCountry, (byCountry.get(v.hqCountry) ?? 0) + 1)
    }
    const topCountryEntry = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0]
    const topCountryShare =
      topCountryEntry && usedVendors.length > 0
        ? Math.round((topCountryEntry[1] / usedVendors.length) * 100)
        : 0

    return [
      {
        key: 'single-source',
        title: 'Single-source domains',
        headline: `${singleSource.length} of ${REPLACE_ASSETS.length}`,
        detail:
          singleSource.length > 0
            ? `Only one GA product exists for: ${singleSource.map((a) => a.label).join(', ')}.`
            : 'Every domain has more than one GA-ready product to choose from.',
        severe: singleSource.length > 0,
      },
      {
        key: 'vendor-concentration',
        title: 'Vendor concentration',
        headline: topVendor ? `${topVendorShare}%` : 'No data',
        detail: topVendor
          ? `${topVendor.vendorDisplayName} supplies ${topVendorEntry![1]} of your ${gaProducts.length} GA-ready products.`
          : 'No GA products with a known vendor yet.',
        severe: topVendorShare >= 40,
      },
      {
        key: 'cert-gap',
        title: 'Certification gap',
        headline: `${certGapPct}%`,
        detail:
          gaWithoutFips.length > 0
            ? `${gaWithoutFips.length} of ${gaProducts.length} GA-ready products carry no FIPS 140-3 validation on record.`
            : 'Every GA-ready product has a FIPS 140-3 validation on record.',
        severe: certGapPct >= 30,
      },
      {
        key: 'geographic',
        title: 'Geographic concentration',
        headline: topCountryEntry ? `${topCountryShare}%` : 'No data',
        detail: topCountryEntry
          ? `${topCountryEntry[1]} of ${usedVendors.length} vendors in your catalog are headquartered in ${topCountryEntry[0]}.`
          : 'No vendor HQ-country data available yet.',
        severe: topCountryShare >= 50,
      },
    ]
  }, [])
}
