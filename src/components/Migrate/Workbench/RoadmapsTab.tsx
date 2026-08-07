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

/**
 * Vendors that have publicly committed to PQC in some form — the honest
 * denominator for "how much of the field publishes a roadmap".
 *
 * ADDED 2026-08-07. The maintenance framework scores this source's
 * completeness as (vendors with a tracked roadmap row) / (vendors with a PQC
 * commitment) and reported ~24% against an 80% target for months. That was
 * accepted as the STRUCTURAL CEILING rather than a backlog: most vendors
 * simply do not publish a PQC roadmap, and this catalogue is proof-gated, so
 * a row cannot exist without a real published document. The gap is in the
 * world, not the pipeline.
 *
 * Accepting a ceiling privately and showing a bare count publicly would let
 * a reader assume this list is the whole field. It is not, and the page now
 * says so.
 */
const COMMITTED_VENDOR_COUNT = [...vendorMap.values()].filter((vendor) =>
  ['Active', 'Partial', 'Announced'].includes(vendor.pqcCommitment)
).length

// Vendors present only via enrichment (no real published roadmap page) —
// counted separately so the headline doesn't conflate the two (Phase 5, U5).
const enrichmentOnlyCount = [...enrichmentByVendorId.keys()].filter(
  (id) => !roadmapByVendorId.has(id)
).length

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

  // FIXED 2026-07-16 (migrate-process remediation Phase 5, U5): a selected
  // vendor with no roadmap AND no enrichment row simply never appeared
  // anywhere on this tab — the exact signal a migration planner needs
  // ("does my vendor even have a public roadmap yet?") was silently
  // dropped instead of shown as an honest "not yet" state.
  const myVendorsWithoutRoadmap = useMemo(() => {
    const covered = new Set<string>([...roadmapByVendorId.keys(), ...enrichmentByVendorId.keys()])
    return [...myVendorIds]
      .filter((id) => !covered.has(id))
      .map((vendorId) => ({
        vendorId,
        vendorName: vendorMap.get(vendorId)?.vendorDisplayName || vendorId,
      }))
      .sort((a, b) => a.vendorName.localeCompare(b.vendorName))
  }, [myVendorIds])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ROADMAP_ENTRIES
    return ROADMAP_ENTRIES.filter(
      (e) => e.vendorName.toLowerCase().includes(q) || e.vendorId.toLowerCase().includes(q)
    )
  }, [query])

  const filteredWithoutRoadmap = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return myVendorsWithoutRoadmap
    return myVendorsWithoutRoadmap.filter(
      (e) => e.vendorName.toLowerCase().includes(q) || e.vendorId.toLowerCase().includes(q)
    )
  }, [query, myVendorsWithoutRoadmap])

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
          {/* FIXED 2026-07-16 (Phase 5, U5): this used to count the UNION of
              roadmap+enrichment vendors as "published roadmap" — an
              enrichment-only vendor (derived from a doc, not a real
              published roadmap page) inflated the headline. */}
          <span className="text-foreground">{roadmapByVendorId.size}</span> vendors with a published
          PQC roadmap
          {enrichmentOnlyCount > 0 && (
            <>
              {' '}
              · <span className="text-foreground">{enrichmentOnlyCount}</span> more with
              enrichment-derived info only
            </>
          )}
          {COMMITTED_VENDOR_COUNT > 0 && (
            <>
              {' '}
              · of <span className="text-foreground">{COMMITTED_VENDOR_COUNT}</span> vendors with a
              stated PQC commitment
            </>
          )}
        </p>
        {/* The ceiling, stated plainly — see COMMITTED_VENDOR_COUNT above. */}
        <p className="w-full text-xs text-muted-foreground">
          Most vendors with a PQC commitment publish no roadmap at all. Every row here is backed by
          a real published document, so this list is what the field has actually released — not a
          complete picture of who is working on PQC.
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

      {/* FIXED 2026-07-16 (Phase 5, U5): rendered independent of the
          roadmap-entries search/empty state below — these vendors aren't in
          ROADMAP_ENTRIES at all, so they'd never surface otherwise. This is
          exactly the "your vendor has nothing published yet" signal a
          migration planner needs. */}
      {filteredWithoutRoadmap.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Your vendors with no published roadmap yet ·{' '}
            <span className="text-foreground">{filteredWithoutRoadmap.length}</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredWithoutRoadmap.map((e) => (
              <div
                key={e.vendorId}
                className="rounded-lg border border-dashed border-border bg-card/50 p-3 text-sm"
              >
                <p className="font-semibold text-foreground">{e.vendorName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  No published roadmap or enrichment data yet.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
