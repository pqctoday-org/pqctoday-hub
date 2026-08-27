// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PROTOCOL_MATRIX,
  type DimensionStatusValue,
  type ProtocolMatrixRow,
} from '@/data/pqcProtocolMatrix'
import { libraryHref } from '@/components/Algorithms/libraryRef'
import { MobileSheet } from '../primitives/Sheet'

const STATUS_ORDER: DimensionStatusValue[] = ['rfc', 'draft', 'experimental', 'none', 'na']

// Same 5-value label/tone map PQCProtocolMatrix.tsx's own dimensionLabel/
// dimensionTone functions carry — replicated (a 5-entry literal, not worth
// an ESLint exception on a full desktop view component) so mobile can never
// invent a different reading of the same status value.
const STATUS_LABEL: Record<DimensionStatusValue, string> = {
  rfc: '✓ RFC',
  draft: '⊳ Draft',
  experimental: '⚠ Experimental',
  none: '✗ None',
  na: '— N/A',
}
const STATUS_TONE: Record<DimensionStatusValue, string> = {
  rfc: 'bg-status-success/15 text-status-success border-status-success/30',
  draft: 'bg-primary/15 text-primary border-primary/30',
  experimental: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  none: 'bg-status-error/10 text-status-error border-status-error/30',
  na: 'bg-muted text-muted-foreground border-border',
}

const DIMENSION_LABELS: { key: keyof ProtocolMatrixRow['dimensions']; label: string }[] = [
  { key: 'pureKem', label: 'Pure KEM' },
  { key: 'hybridKem', label: 'Hybrid KEM' },
  { key: 'pureSig', label: 'Pure Sig' },
  { key: 'hybridSig', label: 'Hybrid Sig' },
]

/**
 * "Understand PQC protocols" / "See protocol readiness" (`?tab=support`).
 *
 * 2026-08-24 audit: this deep link used to fall through to the full desktop
 * AlgorithmsView (AlgorithmsView.tsx's mobile-shell gate only covers the
 * bare landing state, `!searchParams.get('tab')`) — the exact "resize the
 * full page instead of distilling" pattern this project has spent the
 * session fixing elsewhere, just not yet caught here. Now gets a real
 * native screen.
 *
 * Real data: PROTOCOL_MATRIX (`@/data/pqcProtocolMatrix`) — the SAME 30
 * default-visible rows (35 total, 5 `historical` hidden by default, matching
 * desktop) × 4 PQC dimensions PQCProtocolMatrix.tsx renders from. The
 * heatmap-table view and detailed-accordion view toggle, the 8-way
 * availability filter and 6-way sort are desktop-only cuts — investigated
 * first (2026-08-24), confirmed none are gated behind another filter (all
 * flat/simultaneous on desktop too), so nothing here is a "2nd level" cut,
 * just a smaller, phone-appropriate set of the real first-level ones: a
 * single Status filter (the same 5 real values) plus free-text search.
 * Tapping a row opens a lightweight detail sheet with the same 4 dimensions
 * + refs + deployment note — not the full 715-line ProtocolDetailModal.
 */
export function MobileProtocolMatrixView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DimensionStatusValue | null>(null)
  const [selected, setSelected] = useState<ProtocolMatrixRow | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PROTOCOL_MATRIX.filter((row) => {
      if (row.historical) return false
      if (q && !row.name.toLowerCase().includes(q) && !row.description.toLowerCase().includes(q)) {
        return false
      }
      if (statusFilter) {
        const values = DIMENSION_LABELS.map((d) => row.dimensions[d.key].value)
        if (!values.includes(statusFilter)) return false
      }
      return true
    })
  }, [query, statusFilter])

  return (
    <div className="px-4 pb-4 pt-4">
      <h1 className="text-[17px] font-extrabold leading-tight text-foreground">
        PQC Protocol Support
      </h1>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        Which IETF/vendor protocols have a real post-quantum path today.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2">
        <Search size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search protocols"
          className="w-full bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-4 mt-3 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        {STATUS_ORDER.map((s) => (
          <Button
            key={s}
            type="button"
            variant="ghost"
            onClick={() => setStatusFilter((cur) => (cur === s ? null : s))}
            aria-pressed={statusFilter === s}
            className={cn(
              'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
              statusFilter === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      <p className="mt-3 text-[10.5px] text-muted-foreground">
        {rows.length} of {PROTOCOL_MATRIX.filter((r) => !r.historical).length} protocols
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row) => (
          <Button
            key={row.id}
            type="button"
            variant="ghost"
            onClick={() => setSelected(row)}
            className="h-auto flex-col items-start gap-1.5 whitespace-normal rounded-lg border border-border bg-card p-3 text-left"
          >
            <span className="text-[12.5px] font-bold text-foreground">{row.name}</span>
            <div className="flex flex-wrap gap-1">
              {DIMENSION_LABELS.map((d) => {
                const status = row.dimensions[d.key]
                return (
                  <span
                    key={d.key}
                    title={d.label}
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                      STATUS_TONE[status.value]
                    )}
                  >
                    {d.label.replace('Hybrid ', 'H-').replace('Pure ', '')}:{' '}
                    {STATUS_LABEL[status.value]}
                  </span>
                )
              })}
            </div>
          </Button>
        ))}
        {rows.length === 0 && (
          <p className="py-6 text-center text-[12px] text-muted-foreground">
            No protocols match this search.
          </p>
        )}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Availability and sort filters, the heatmap-table view, deprecated protocols, and the
        production-readiness/transport-blockers panels are on a laptop.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        large
        testId="protocol-matrix-detail-sheet"
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] leading-relaxed text-foreground/90">{selected.description}</p>
            {DIMENSION_LABELS.map((d) => {
              const status = selected.dimensions[d.key]
              return (
                <div
                  key={d.key}
                  className={cn('rounded-lg border p-2.5', STATUS_TONE[status.value])}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-bold">{d.label}</span>
                    <span className="text-[10.5px] font-semibold">
                      {STATUS_LABEL[status.value]}
                    </span>
                  </div>
                  {status.note && <p className="mt-1 text-[10.5px] opacity-90">{status.note}</p>}
                  {status.deploymentPosture && (
                    <p className="mt-0.5 text-[10px] opacity-80">
                      Deployment: {status.deploymentPosture}
                      {status.deploymentNote ? ` — ${status.deploymentNote}` : ''}
                    </p>
                  )}
                  {status.refs && status.refs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {status.refs.map((ref) => (
                        <a
                          key={ref.id}
                          href={libraryHref(ref.id)}
                          className="inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-mono font-semibold"
                        >
                          {ref.id}
                          <ExternalLink size={9} aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {selected.liveDeployments && selected.liveDeployments.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Live deployments
                </p>
                <div className="flex flex-col gap-1">
                  {selected.liveDeployments.map((d, i) => (
                    <a
                      key={i}
                      href={d.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1.5 text-[10.5px] text-foreground/90"
                    >
                      <span>
                        <span className="font-semibold">{d.provider}</span> — {d.what}
                      </span>
                      <ExternalLink size={10} className="shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </MobileSheet>
    </div>
  )
}
