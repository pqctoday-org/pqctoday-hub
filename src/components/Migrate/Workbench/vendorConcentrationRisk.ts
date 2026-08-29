// SPDX-License-Identifier: GPL-3.0-only
//
// Pure extraction (2026-08-24 audit fix) from VendorConcentrationRiskPanel.tsx
// — the "Vendor risk" tab's concentration/single-source/cert-gap/geographic
// computation, so desktop and mobile compute the same 4 numbers and the same
// `severe` verdict from the same catalog data. Before this extraction,
// MobileMigrateView.tsx carried its own copy of this computation with
// different severity thresholds (25/50/40 vs this file's 40/30/50) —
// identical vendor data could read "severe" on one device and calm on the
// other.
//
// Selection-aware since 2026-08-27 (vendor-risk remediation, decision D4):
// with a Replace-tab selection the four cards score YOUR products, matching
// the matrix below them; with no selection they score the full catalog and
// say so. Previously they always scored the full catalog while their copy
// claimed "your" products. Severity thresholds are unchanged.
import { useMemo } from 'react'
import { softwareData, vendorMap } from '@/data/migrateData'
import { REPLACE_ASSETS } from '@/data/migrationAssets'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
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
  const selectedIds = useSelectedProductIds()
  return useMemo(() => {
    const selectedSet = new Set(selectedIds)
    const hasSelection = selectedSet.size > 0
    const scopeItems = hasSelection
      ? softwareData.filter((p) => selectedSet.has(p.productId))
      : softwareData
    const scopeNoun = hasSelection ? 'selected' : 'catalog'

    // ── Single-source domains: exactly one GA product covers this asset ──
    const singleSource = REPLACE_ASSETS.filter((asset) => {
      const gaCount = productsForDomain(asset.id).filter(
        (p) =>
          (!hasSelection || selectedSet.has(p.productId)) && productPqcStatus(p).status === 'ga'
      ).length
      return gaCount === 1
    })

    // ── Vendor concentration: which vendor supplies the most GA products ──
    const gaProducts = scopeItems.filter((p) => productPqcStatus(p).status === 'ga')
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

    // ── Geographic concentration: HQ country of the vendors in scope ──
    // With a selection, the vendors of the selected products; otherwise every
    // vendor with products in the catalog (the registry's own productCount).
    const usedVendors = hasSelection
      ? [...new Set(scopeItems.map((p) => p.vendorId).filter((id): id is string => Boolean(id)))]
          .map((id) => vendorMap.get(id))
          .filter((v): v is NonNullable<typeof v> => Boolean(v))
      : [...vendorMap.values()].filter((v) => (v.productCount ?? 0) > 0)
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
            ? `Only one GA ${scopeNoun} product covers: ${singleSource.map((a) => a.label).join(', ')}.`
            : `Every domain has more than one GA-ready ${scopeNoun} product to choose from.`,
        severe: singleSource.length > 0,
      },
      {
        key: 'vendor-concentration',
        title: 'Vendor concentration',
        headline: topVendor ? `${topVendorShare}%` : 'No data',
        detail: topVendor
          ? `${topVendor.vendorDisplayName} supplies ${topVendorEntry![1]} of the ${gaProducts.length} GA-ready ${scopeNoun} products.`
          : `No GA ${scopeNoun} products with a known vendor yet.`,
        severe: topVendorShare >= 40,
      },
      {
        key: 'cert-gap',
        title: 'Certification gap',
        headline: `${certGapPct}%`,
        detail:
          gaWithoutFips.length > 0
            ? `${gaWithoutFips.length} of ${gaProducts.length} GA-ready ${scopeNoun} products carry no FIPS 140-3 validation on record.`
            : `Every GA-ready ${scopeNoun} product has a FIPS 140-3 validation on record.`,
        severe: certGapPct >= 30,
      },
      {
        key: 'geographic',
        title: 'Geographic concentration',
        headline: topCountryEntry ? `${topCountryShare}%` : 'No data',
        detail: topCountryEntry
          ? `${topCountryEntry[1]} of ${usedVendors.length} ${scopeNoun} vendors are headquartered in ${topCountryEntry[0]}.`
          : 'No vendor HQ-country data available yet.',
        severe: topCountryShare >= 50,
      },
    ]
  }, [selectedIds])
}
