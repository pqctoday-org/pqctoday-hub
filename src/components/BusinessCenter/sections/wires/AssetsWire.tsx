// SPDX-License-Identifier: GPL-3.0-only
/**
 * AssetsWire — Command Center Fig 3 Assets zone data wire.
 *
 * Pulls the user's "My Products" selection from the Migrate page
 * (`metrics.bookmarkedProducts`, sourced from `useMigrateSelectionStore.myProducts`)
 * and surfaces it inside the Assets panel grouped by infrastructure layer.
 * Empty-state points the user back to /migrate.
 */
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import { INFRA_LAYERS } from '../../hooks/useBusinessMetrics'

export interface AssetsWireProps {
  metrics: BusinessMetrics
}

interface ProductRowProps {
  product: SoftwareItem
}

/** Compact product chip-row used in the layer groups. */
function ProductRow({ product }: ProductRowProps) {
  const fipsTone =
    product.fipsValidated?.toLowerCase().startsWith('yes') &&
    !product.fipsValidated.toLowerCase().includes('mode')
      ? 'bg-status-success/10 text-status-success'
      : product.fipsValidated?.toLowerCase().includes('partial') ||
          product.fipsValidated?.toLowerCase().includes('mode')
        ? 'bg-status-warning/10 text-status-warning'
        : 'bg-muted text-muted-foreground'
  return (
    <div className="flex items-center gap-2 p-2 rounded border border-border bg-card/50">
      <Package size={14} className="text-muted-foreground shrink-0" />
      <span className="text-sm text-foreground truncate flex-1 min-w-0">
        {product.softwareName}
      </span>
      {product.fipsValidated && (
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${fipsTone}`}
          title={`FIPS: ${product.fipsValidated}`}
        >
          FIPS
        </span>
      )}
      {product.pqcSupport && product.pqcSupport.toLowerCase() !== 'no' && (
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-primary/10 text-primary"
          title={product.pqcSupport}
        >
          PQC
        </span>
      )}
    </div>
  )
}

export const AssetsWire: React.FC<AssetsWireProps> = ({ metrics }) => {
  const navigate = useNavigate()
  const products = metrics.bookmarkedProducts

  /** Group products by infrastructureLayer in INFRA_LAYERS order; products with
   *  unknown/missing layers fall into a trailing "Other" group. */
  const groups = useMemo(() => {
    const byLayer = new Map<string, SoftwareItem[]>()
    for (const p of products) {
      const layer = p.infrastructureLayer || 'Other'
      const list = byLayer.get(layer) ?? []
      list.push(p)
      byLayer.set(layer, list)
    }
    const ordered: Array<{ layer: string; items: SoftwareItem[] }> = []
    for (const layer of INFRA_LAYERS) {
      const items = byLayer.get(layer)
      if (items && items.length > 0) ordered.push({ layer, items })
    }
    // Append any "Other" / unknown layer at the end.
    for (const [layer, items] of byLayer) {
      if (!INFRA_LAYERS.includes(layer as (typeof INFRA_LAYERS)[number])) {
        ordered.push({ layer, items })
      }
    }
    return ordered
  }, [products])

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Boxes size={20} className="text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              No infrastructure components selected yet
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Pick the products in your stack on the Migrate page using the &ldquo;My
              Products&rdquo; control on each card. They&rsquo;ll appear here grouped by
              infrastructure layer (Hardware, Cloud, Network, Database, etc.).
            </p>
          </div>
        </div>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => navigate('/migrate')}
          className="gap-1.5"
        >
          Open Migrate page
          <ArrowRight size={14} />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Your infrastructure ({products.length} component{products.length !== 1 ? 's' : ''})
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/migrate')}
          className="h-auto p-0 text-xs"
        >
          Edit on Migrate
          <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <div className="space-y-3">
        {groups.map(({ layer, items }) => (
          <div key={layer}>
            <div className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide mb-1">
              {layer} · {items.length}
            </div>
            <div className="space-y-1.5">
              {items.map((p) => (
                <ProductRow key={p.productId} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
