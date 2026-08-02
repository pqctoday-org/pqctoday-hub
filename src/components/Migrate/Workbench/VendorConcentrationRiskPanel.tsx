// SPDX-License-Identifier: GPL-3.0-only
//
// VendorConcentrationRiskPanel — "Vendor risk" tab addition, 2026-08-02
// (design_handoff_2026_pages/IMPLEMENTATION-PLAN-MIGRATE-2026-08-01.md §3.3).
//
// The original design mockup for this tab described a 4-category risk grid
// (concentration / single-source / geopolitical / certification-gap), one
// card citing a specific wolfSSL counter-claim. That specific citation isn't
// real — no migrate-typed counter-claim data exists yet (content authoring
// is out of scope for this pass; see the Migrate plan §3.2/§7) — so this
// panel implements the 4 real categories from data already in the catalog
// instead of inventing an unsourced example. It supplements
// SupplyChainRiskMatrix (a real, working, different-shaped view of the same
// tab), rather than replacing it — the design program's own stated
// invariant across all 10 pages is that no existing coverage gets dropped.
import { useMemo } from 'react'
import { AlertTriangle, Users, ShieldOff, Globe2 } from 'lucide-react'
import { softwareData, vendorMap } from '@/data/migrateData'
import { REPLACE_ASSETS } from '@/data/migrationAssets'
import { productsForDomain } from './workbenchCatalog'
import { productPqcStatus, productFipsBadge } from './productStatus'

interface RiskCard {
  key: string
  icon: typeof Users
  title: string
  headline: string
  detail: string
  severe: boolean
}

function useVendorConcentrationRisks(): RiskCard[] {
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
        icon: AlertTriangle,
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
        icon: Users,
        title: 'Vendor concentration',
        headline: topVendor ? `${topVendorShare}%` : 'No data',
        detail: topVendor
          ? `${topVendor.vendorDisplayName} supplies ${topVendorEntry![1]} of your ${gaProducts.length} GA-ready products.`
          : 'No GA products with a known vendor yet.',
        severe: topVendorShare >= 40,
      },
      {
        key: 'cert-gap',
        icon: ShieldOff,
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
        icon: Globe2,
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

export function VendorConcentrationRiskPanel() {
  const risks = useVendorConcentrationRisks()

  return (
    <div className="mb-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Concentration &amp; coverage risk</h3>
        <p className="text-xs text-muted-foreground">
          Computed from your product catalog, not a generic checklist — refreshes as the catalog
          does.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {risks.map((risk) => (
          <div
            key={risk.key}
            className={`rounded-xl border p-4 ${
              risk.severe
                ? 'border-status-warning/40 bg-status-warning/5'
                : 'border-border bg-card/30'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                risk.severe ? 'text-status-warning' : 'text-muted-foreground'
              }`}
            >
              <risk.icon size={14} aria-hidden />
              {risk.title}
            </div>
            <p className="mt-1.5 text-xl font-bold text-foreground">{risk.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{risk.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
