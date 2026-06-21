// SPDX-License-Identifier: GPL-3.0-only
//
// Direct access to vendor PQC roadmaps — a flat, searchable list of every
// vendor that publishes a roadmap (or has enrichment data), each rendered with
// the same VendorRoadmapPanel used in the product detail.

import { useMemo, useState } from 'react'
import { Search, Map as MapIcon } from 'lucide-react'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { vendorMap } from '@/data/migrateData'
import { Input } from '../../ui/input'
import { VendorRoadmapPanel } from '../VendorRoadmapPanel'

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ROADMAP_ENTRIES
    return ROADMAP_ENTRIES.filter(
      (e) => e.vendorName.toLowerCase().includes(q) || e.vendorId.toLowerCase().includes(q)
    )
  }, [query])

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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((e) => (
            <div key={e.vendorId} className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">{e.vendorName}</p>
              <VendorRoadmapPanel
                roadmap={roadmapByVendorId.get(e.vendorId)}
                enrichment={enrichmentByVendorId.get(e.vendorId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
