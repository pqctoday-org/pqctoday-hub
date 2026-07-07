// SPDX-License-Identifier: GPL-3.0-only
//
// Direct access to vendor PQC roadmaps — a flat, searchable list of every
// vendor that publishes a roadmap (or has enrichment data), each rendered with
// the same VendorRoadmapPanel used in the product detail.

import { useMemo, useState } from 'react'
import { Search, Map as MapIcon, ChevronDown } from 'lucide-react'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { vendorMap, softwareData } from '@/data/migrateData'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { VendorRoadmapPanel } from '../VendorRoadmapPanel'
import { ProductRow } from './ProductRow'
import { productsForVendor } from './workbenchCatalog'

/** productId → vendorId, to resolve the user's cross-page product selection
 *  (see {@link useSelectedProductIds}) back to the vendors that own them. */
const VENDOR_ID_BY_PRODUCT_ID = new Map<string, string>(
  softwareData
    .filter((s): s is typeof s & { vendorId: string } => Boolean(s.vendorId))
    .map((s) => [s.productId, s.vendorId])
)

interface RoadmapEntry {
  vendorId: string
  vendorName: string
}

// Union of vendors that have a roadmap and/or enrichment, sorted by name.
const ROADMAP_ENTRIES: RoadmapEntry[] = (() => {
  const ids = new Set<string>([...roadmapByVendorId.keys(), ...enrichmentByVendorId.keys()])
  const entries: RoadmapEntry[] = []
  for (const vendorId of ids) {
    const vendorName =
      roadmapByVendorId.get(vendorId)?.vendorName ||
      vendorMap.get(vendorId)?.vendorDisplayName ||
      vendorId
    entries.push({ vendorId, vendorName })
  }
  entries.sort((a, b) => a.vendorName.localeCompare(b.vendorName))
  return entries
})()

export function RoadmapsTab() {
  const [query, setQuery] = useState('')
  const selectedProductIds = useSelectedProductIds()

  const myVendorIds = useMemo(() => {
    const ids = new Set<string>()
    for (const productId of selectedProductIds) {
      const vendorId = VENDOR_ID_BY_PRODUCT_ID.get(productId)
      if (vendorId) ids.add(vendorId)
    }
    return ids
  }, [selectedProductIds])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ROADMAP_ENTRIES
    return ROADMAP_ENTRIES.filter(
      (e) => e.vendorName.toLowerCase().includes(q) || e.vendorId.toLowerCase().includes(q)
    )
  }, [query])

  const myVendors = useMemo(
    () => filtered.filter((e) => myVendorIds.has(e.vendorId)),
    [filtered, myVendorIds]
  )
  const otherVendors = useMemo(
    () => filtered.filter((e) => !myVendorIds.has(e.vendorId)),
    [filtered, myVendorIds]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapIcon size={14} aria-hidden />
          <span className="text-foreground">{ROADMAP_ENTRIES.length}</span> vendors with a published
          PQC roadmap
        </p>
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter vendors…"
            aria-label="Filter vendor roadmaps"
            className="pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No vendors match “{query}”.
        </p>
      ) : (
        <>
          {myVendors.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Your vendors · <span className="text-foreground">{myVendors.length}</span>
              </p>
              <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
                {myVendors.map((e) => (
                  <RoadmapCard key={e.vendorId} vendorId={e.vendorId} vendorName={e.vendorName} />
                ))}
              </div>
            </div>
          )}
          <div>
            {myVendors.length > 0 && (
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                All vendors
              </p>
            )}
            <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {otherVendors.map((e) => (
                <RoadmapCard key={e.vendorId} vendorId={e.vendorId} vendorName={e.vendorName} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RoadmapCard({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const [showProducts, setShowProducts] = useState(false)
  const products = useMemo(() => productsForVendor(vendorId), [vendorId])

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-sm font-semibold text-foreground">{vendorName}</p>
      <VendorRoadmapPanel
        roadmap={roadmapByVendorId.get(vendorId)}
        enrichment={enrichmentByVendorId.get(vendorId)}
      />

      {products.length > 0 && (
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProducts((v) => !v)}
            aria-expanded={showProducts}
            className="h-7 px-2 text-xs text-primary"
          >
            <ChevronDown
              size={13}
              className={`mr-1 transition-transform ${showProducts ? 'rotate-180' : ''}`}
              aria-hidden
            />
            {showProducts ? 'Hide' : 'View'} {products.length}{' '}
            {products.length === 1 ? 'product' : 'products'}
          </Button>
          {showProducts && (
            <div className="mt-2 flex flex-col gap-2">
              {products.map((p) => (
                <ProductRow key={p.productId || p.softwareName} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
