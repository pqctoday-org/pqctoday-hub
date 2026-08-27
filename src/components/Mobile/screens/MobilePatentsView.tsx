// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { patentsData } from '@/data/patentsData'
import { readPqcOnly } from '@/data/patentsScope'
import { isPqcPatent } from '@/components/Patents/patentColumns'
import { usePatentKpis } from '@/components/Patents/redesign/usePatentKpis'
import type { CryptoAgilityMode, QuantumRelevance, PatentItem } from '@/types/PatentTypes'
import { cn } from '@/lib/utils'
import { MobileSheet } from '../primitives/Sheet'
import { AGILITY_LABELS } from '@/data/patentAgilityLabels'

const AGILITY_ORDER: CryptoAgilityMode[] = [
  'classical_only',
  'hybrid',
  'pqc_only',
  'negotiated',
  'unclear',
]

// Deliberately NOT the same strings as PatentsTable.tsx's own terser
// RELEVANCE_LABELS ('Core'/'Dependent'/'Background') — this is real, already-
// diverged mobile copy (not a byte-identical duplicate the 2026-08-24 audit
// R3.5 pass should force back together), kept more descriptive for a reader
// who won't have the surrounding desktop table's column header for context.
const RELEVANCE_LABELS: Record<QuantumRelevance, string> = {
  core_invention: 'Core invention',
  dependent_claim_only: 'Dependent claim',
  background_only: 'Background only',
  none: 'None',
}

function fipsMappedAlgorithms(p: PatentItem): string[] {
  return p.nistRoundStatus.filter((n) => n.status.startsWith('fips_')).map((n) => n.algorithm)
}

/**
 * Mobile Patents (handoff Phase 7 — Reference set, design handoff §22).
 * Source: usePatentKpis.ts, patentColumns.ts (isPqcPatent), patentsScope.ts
 * (E-4, already pure-moved for this exact reuse).
 *
 * The README's own three headline figures (1,185 / 214 / "Huawei · 63") and
 * crypto-agility counts (402/288/173/141/181) are the SAME stale numbers
 * this plan's own §4.1/§4.3 validation already flagged before Phase 7
 * started (corpus grew to 1,806; top assignee is now Wells Fargo, 88).
 * Nothing here is typed — inScope/highImpact/topAssignee come from
 * usePatentKpis() (the same real hook every desktop Patents KPI strip
 * reads), and crypto-agility counts are computed live over the same scoped
 * corpus, so this screen can never carry a stale figure forward.
 *
 * Same PQC-only default scope desktop uses (`readPqcOnly()` + `isPqcPatent`
 * — real, shared, persisted localStorage state, not a second toggle). No
 * scope toggle UI on mobile — distilled to the default scope, stated below.
 *
 * Card fields are all real: cryptoAgilityMode, quantumRelevance (only shown
 * when not 'none'), the FIPS-mapped algorithm(s) from nistRoundStatus
 * (status.startsWith('fips_') — the same real check usePatentKpis' own
 * fipsMapped figure uses), issueDate, and the real research/IP disclaimer
 * verbatim from PatentsViewRedesign.tsx.
 */
export function MobilePatentsView() {
  const [highImpactOnly, setHighImpactOnly] = useState(false)
  const [agilityFilter, setAgilityFilter] = useState<CryptoAgilityMode | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selected, setSelected] = useState<PatentItem | null>(null)

  const scoped = useMemo(() => (readPqcOnly() ? patentsData.filter(isPqcPatent) : patentsData), [])
  const kpis = usePatentKpis(scoped)

  const agilityCounts = useMemo(() => {
    const counts = new Map<CryptoAgilityMode, number>()
    for (const p of scoped)
      counts.set(p.cryptoAgilityMode, (counts.get(p.cryptoAgilityMode) ?? 0) + 1)
    return counts
  }, [scoped])

  const filtered = useMemo(() => {
    let data = scoped
    if (highImpactOnly) data = data.filter((p) => p.impactLevel === 'High')
    if (agilityFilter) data = data.filter((p) => p.cryptoAgilityMode === agilityFilter)
    if (searchText) {
      const q = searchText.toLowerCase()
      data = data.filter(
        (p) =>
          p.assignee.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.classicalAlgorithms.some((a) => a.toLowerCase().includes(q)) ||
          p.pqcAlgorithms.some((a) => a.toLowerCase().includes(q)) ||
          p.protocols.some((proto) => proto.toLowerCase().includes(q))
      )
    }
    return data
  }, [scoped, highImpactOnly, agilityFilter, searchText])

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-1">
        <h1 className="sr-only">Patents</h1>
      </div>
      <p className="mb-4 text-[11.5px] leading-relaxed text-muted-foreground">
        Three figures worth carrying. Tap High migration impact to narrow the list below.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div className="glass-panel p-3">
          <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
            Patents in scope
          </p>
          <p className="text-[20px] font-extrabold text-foreground">{kpis.inScope}</p>
          <p className="text-[10px] text-muted-foreground">in scope</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setHighImpactOnly((v) => !v)}
          aria-pressed={highImpactOnly}
          className={cn(
            'glass-panel h-auto flex-col items-start p-3 text-left',
            highImpactOnly && 'border-primary bg-primary/5'
          )}
        >
          <p className="text-sim-chip font-bold uppercase tracking-wide text-destructive">
            High migration impact
          </p>
          <p className="text-[20px] font-extrabold text-foreground">{kpis.highImpact.count}</p>
          <p className="text-[10px] text-muted-foreground">
            {kpis.highImpact.pct}% of corpus · tap to {highImpactOnly ? 'clear' : 'filter'}
          </p>
        </Button>
      </div>

      {kpis.topAssignee && (
        <div className="mb-4 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <p className="text-sim-chip font-bold uppercase tracking-wide text-primary">
            Top assignee
          </p>
          <p className="text-[13px] font-bold text-foreground">
            {kpis.topAssignee.name} · {kpis.topAssignee.count} patents
          </p>
        </div>
      )}

      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Crypto agility
      </p>
      <div className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        {AGILITY_ORDER.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant="ghost"
            onClick={() => setAgilityFilter((f) => (f === mode ? null : mode))}
            aria-pressed={agilityFilter === mode}
            className={cn(
              'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
              agilityFilter === mode
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {AGILITY_LABELS[mode]} · {agilityCounts.get(mode) ?? 0}
          </Button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-border bg-card px-3">
        <Search size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search assignee, algorithm or protocol"
          className="h-11 flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <p className="mb-2 text-[11px] text-muted-foreground">{filtered.length} patents</p>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">No patents match these filters.</p>
        )}
        {filtered.map((p) => {
          const fipsAlgos = fipsMappedAlgorithms(p)
          return (
            <Button
              type="button"
              variant="ghost"
              key={p.patentNumber}
              onClick={() => setSelected(p)}
              // Button's own base classes hard-code whitespace-nowrap for
              // typical short labels; this button wraps a real patent title
              // instead. white-space is CSS-inherited, so without overriding
              // it here the title <h2> below inherited nowrap and ran off
              // the right edge uncut rather than wrapping (2026-08-24, real
              // production feedback).
              className="glass-panel h-auto w-full flex-col items-start gap-1.5 whitespace-normal p-3.5 text-left font-normal"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-[13px] font-bold leading-snug text-foreground">{p.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  {AGILITY_LABELS[p.cryptoAgilityMode]}
                </span>
                {p.quantumRelevance !== 'none' && (
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-sim-chip font-bold uppercase tracking-wide',
                      p.quantumRelevance === 'core_invention'
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    {RELEVANCE_LABELS[p.quantumRelevance]}
                  </span>
                )}
                {p.impactLevel === 'High' && (
                  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-sim-chip font-bold uppercase tracking-wide text-warning">
                    high impact
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-muted-foreground">
                {fipsAlgos.length > 0 && `Maps to ${fipsAlgos.join(', ')} · `}
                {p.assignee} · issued {p.issueDate}
              </p>
            </Button>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The full 25-dimension table/grid, the all-crypto scope toggle, and citation graphs are on a
        laptop. Patent data sourced from USPTO. For research — not legal or IP advice.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.patentNumber}
        large
        testId="patent-detail-sheet"
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-[15px] font-bold leading-snug text-foreground">
                {selected.title}
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {selected.assignee} · issued {selected.issueDate}
              </p>
            </div>
            {selected.summary && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                {selected.summary}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                {AGILITY_LABELS[selected.cryptoAgilityMode]}
              </span>
              {selected.quantumRelevance !== 'none' && (
                <span className="rounded bg-muted/50 px-1.5 py-0.5 text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  {RELEVANCE_LABELS[selected.quantumRelevance]}
                </span>
              )}
            </div>
            {selected.classicalAlgorithms.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Classical algorithms
                </p>
                <p className="mt-0.5 text-[11.5px] text-foreground">
                  {selected.classicalAlgorithms.join(', ')}
                </p>
              </div>
            )}
            {selected.pqcAlgorithms.length > 0 && (
              <div>
                <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  PQC algorithms
                </p>
                <p className="mt-0.5 text-[11.5px] text-foreground">
                  {selected.pqcAlgorithms.join(', ')}
                </p>
              </div>
            )}
            {selected.protocols.length > 0 && (
              <div>
                <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Protocols
                </p>
                <p className="mt-0.5 text-[11.5px] text-foreground">
                  {selected.protocols.join(', ')}
                </p>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
              <div>
                <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Priority date
                </dt>
                <dd className="mt-0.5 text-[11.5px] text-foreground">{selected.priorityDate}</dd>
              </div>
              <div>
                <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Filing date
                </dt>
                <dd className="mt-0.5 text-[11.5px] text-foreground">{selected.filingDate}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Inventors
                </dt>
                <dd className="mt-0.5 text-[11.5px] text-foreground">{selected.inventors}</dd>
              </div>
            </dl>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              The full independent claim text, CPC codes and remaining 20+ extraction dimensions are
              on a laptop.
            </p>
          </div>
        )}
      </MobileSheet>
    </div>
  )
}
