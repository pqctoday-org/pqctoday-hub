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
import { useMemo, useState } from 'react'
import { AlertTriangle, Users, ShieldOff, Globe2 } from 'lucide-react'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { classifyProductDomain } from '@/data/migrationAssets'
import { useScrollToDeepLinkTarget } from '@/hooks/useScrollToDeepLinkTarget'
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

  // ?open=<domainId|productId> (deep-link PR 2): scroll to and ring the
  // Supply Chain Risk Matrix layer card for that domain (a product → the
  // domain it lives in). The matrix renders those cards with
  // data-testid="layer-card-<domainId>"; opening a single product row inside
  // one would need a change to SupplyChainRiskMatrix itself.
  const openDomain = useMemo(() => {
    if (!openRef) return null
    const product = resolveProductRef(openRef)?.product
    return product
      ? classifyProductDomain(product.categoryName, product.infrastructureLayer)
      : resolveDomainRef(openRef)
  }, [openRef])
  const [dismissed, setDismissed] = useState<string | null>(null)
  useScrollToDeepLinkTarget(
    openDomain ? `open:${openRef}` : null,
    openDomain ? `[data-testid="layer-card-${openDomain}"]` : null
  )

  return (
    <div className="mb-4 space-y-3">
      {openRef && !openDomain && dismissed !== openRef && (
        <DeepLinkNotice
          kind="not-found"
          message={`No product or category matching “${openRef}”.`}
          onDismiss={() => setDismissed(openRef)}
        />
      )}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Concentration &amp; coverage risk</h3>
        <p className="text-xs text-muted-foreground">
          {selectedCount > 0
            ? `Computed from the ${selectedCount} product${selectedCount !== 1 ? 's' : ''} you selected on the Replace tab — refreshes as your selection does.`
            : 'Computed from the full product catalog (select products on the Replace tab to score your own estate) — refreshes as the catalog does.'}
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
