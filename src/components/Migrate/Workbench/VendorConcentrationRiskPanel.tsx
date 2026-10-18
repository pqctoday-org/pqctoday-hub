// SPDX-License-Identifier: AGPL-3.0-only
//
// Educational catalog evidence cues. These statistics describe the tracked
// rows only; they are not an estate, vendor-risk or compliance assessment.
import { useMemo, useState } from 'react'
import { AlertTriangle, Users, ShieldOff, Globe2 } from 'lucide-react'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { classifyProductDomain } from '@/data/migrationAssets'
import { DeepLinkNotice } from '../../common/DeepLinkNotice'
import { useVendorConcentrationRisks, type RiskCard } from './vendorConcentrationRisk'
import { resolveDomainRef, resolveProductRef } from './workbenchCatalog'

// Icons are this panel's own presentational concern (the shared hook only
// knows about numbers), keyed by the same `key` the hook emits.
const RISK_ICON: Record<RiskCard['key'], typeof Users> = {
  'single-source': AlertTriangle,
  'vendor-concentration': Users,
  'cert-gap': ShieldOff,
  geographic: Globe2,
}

export function VendorConcentrationRiskPanel({ openRef }: { openRef?: string } = {}) {
  const risks = useVendorConcentrationRisks()
  const selectedCount = useSelectedProductIds().length

  // Resolve a deep-linked product to its educational catalog domain.
  const openDomain = useMemo(() => {
    if (!openRef) return null
    const product = resolveProductRef(openRef)?.product
    return product
      ? classifyProductDomain(product.categoryName, product.infrastructureLayer)
      : resolveDomainRef(openRef)
  }, [openRef])
  const [dismissed, setDismissed] = useState<string | null>(null)
  return (
    <div className="mb-4 space-y-3">
      {openRef && !openDomain && dismissed !== openRef && (
        <DeepLinkNotice
          kind="not-found"
          message={`No product or category matching “${openRef}”.`}
          onDismiss={() => setDismissed(openRef)}
        />
      )}
      {openRef && openDomain && (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground"
        >
          Showing catalog-wide evidence cues. The linked item maps to the{' '}
          <strong className="text-foreground">{openDomain}</strong> category; inspect its product
          evidence on the Replace tab.
        </p>
      )}
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Catalog concentration &amp; evidence signals
        </h3>
        <p className="text-xs text-muted-foreground">
          {selectedCount > 0
            ? `Describes the ${selectedCount} catalog example${selectedCount !== 1 ? 's' : ''} you selected; it is not an assessment of your estate or suppliers.`
            : 'Describes the full tracked catalog. These review cues are not likelihood, vendor-risk, suitability or compliance scores.'}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {risks.map((risk) => {
          const Icon = RISK_ICON[risk.key]
          return (
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
                <Icon size={14} aria-hidden />
                {risk.title}
              </div>
              <p className="mt-1.5 text-xl font-bold text-foreground">{risk.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{risk.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
