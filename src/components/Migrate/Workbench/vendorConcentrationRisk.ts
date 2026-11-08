// SPDX-License-Identifier: AGPL-3.0-only
//
// Pure extraction (2026-08-24 audit fix) from VendorConcentrationRiskPanel.tsx
// — the Evidence tab's catalog concentration/coverage computation, so desktop
// and mobile compute the same four numbers and the same
// `severe` verdict from the same catalog data. Before this extraction,
// MobileMigrateView.tsx carried its own copy of this computation with
// different severity thresholds (25/50/40 vs this file's 40/30/50) —
// identical vendor data could read "severe" on one device and calm on the
// other.
//
// With a Replace-tab selection the four cards describe selected examples;
// otherwise they describe the full catalog. Neither mode scores an estate.
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
    const domainCoverage = REPLACE_ASSETS.map((asset) => ({
      asset,
      availableCount: productsForDomain(asset.id).filter(
        (p) =>
          (!hasSelection || selectedSet.has(p.productId)) && productPqcStatus(p).status === 'ga'
      ).length,
    }))
    const singleSource = domainCoverage
      .filter((item) => item.availableCount === 1)
      .map((item) => item.asset)
    const withoutRecordedCoverage = domainCoverage
      .filter((item) => item.availableCount === 0)
      .map((item) => item.asset)
    const hasRecordedCoverage = domainCoverage.some((item) => item.availableCount > 0)
    const singleSourceDetail =
      domainCoverage.length === 0
        ? `No domains are defined for ${scopeNoun} coverage; coverage is not assessed.`
        : !hasRecordedCoverage
          ? `No available ${scopeNoun} products are recorded for these domains; coverage has not been established.`
          : [
              singleSource.length > 0
                ? `Only one available ${scopeNoun} product is currently mapped to: ${singleSource.map((a) => a.label).join(', ')}.`
                : withoutRecordedCoverage.length === 0
                  ? `Every mapped domain has more than one available ${scopeNoun} product recorded.`
                  : `Domains with recorded coverage have more than one available ${scopeNoun} product.`,
              withoutRecordedCoverage.length > 0
                ? `No available ${scopeNoun} product is recorded for: ${withoutRecordedCoverage.map((a) => a.label).join(', ')}.`
                : '',
            ]
              .filter(Boolean)
              .join(' ')

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
        title: 'Single-source catalog coverage',
        headline: hasRecordedCoverage
          ? `${singleSource.length} of ${REPLACE_ASSETS.length}`
          : 'No data',
        detail: singleSourceDetail,
        severe: singleSource.length > 0,
      },
      {
        key: 'vendor-concentration',
        title: 'Available-product concentration',
        headline: topVendor ? `${topVendorShare}%` : 'No data',
        detail: topVendor
          ? `${topVendor.vendorDisplayName} supplies ${topVendorEntry![1]} of the ${gaProducts.length} available ${scopeNoun} products.`
          : `No available ${scopeNoun} products with a known vendor yet.`,
        severe: topVendorShare >= 40,
      },
      {
        key: 'cert-gap',
        title: 'FIPS evidence gap',
        headline: gaProducts.length > 0 ? `${certGapPct}%` : 'Not assessed',
        detail:
          gaProducts.length === 0
            ? `FIPS evidence coverage is not assessed because no available ${scopeNoun} products are recorded.`
            : gaWithoutFips.length > 0
              ? `${gaWithoutFips.length} of ${gaProducts.length} available ${scopeNoun} products have no linked FIPS 140-3 validation in this catalog.`
              : `Every available ${scopeNoun} product has a linked FIPS 140-3 validation record.`,
        severe: certGapPct >= 30,
      },
      {
        key: 'geographic',
        title: 'Vendor HQ distribution',
        headline: topCountryEntry ? `${topCountryShare}%` : 'No data',
        detail: topCountryEntry
          ? `${topCountryEntry[1]} of ${usedVendors.length} ${scopeNoun} vendors are headquartered in ${topCountryEntry[0]}.`
          : 'No vendor HQ-country data available yet.',
        severe: topCountryShare >= 50,
      },
    ]
  }, [selectedIds])
}
