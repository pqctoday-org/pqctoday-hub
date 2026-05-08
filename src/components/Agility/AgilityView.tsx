// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback } from 'react'
import { Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { maturityRequirements } from '@/data/maturityGovernanceData'
import {
  MATURITY_LEVEL_LABELS,
  PILLARS,
} from '@/components/PKILearning/modules/CryptoMgmtModernization/data/maturityModel'
import type { PillarId, MaturityLevel, AssetClass } from '@/types/MaturityTypes'

type AssetClassFilter = 'all' | AssetClass

const ASSET_CLASS_OPTIONS: { value: AssetClassFilter; label: string }[] = [
  { value: 'all', label: 'All Assets' },
  { value: 'certificates', label: 'Certificates' },
  { value: 'libraries', label: 'Libraries' },
  { value: 'software', label: 'Software' },
  { value: 'keys', label: 'Keys' },
]

const MATURITY_LEVELS: MaturityLevel[] = [1, 2, 3, 4]

const CONFIDENCE_CLS: Record<'high' | 'medium' | 'low', string> = {
  high: 'text-status-success',
  medium: 'text-status-warning',
  low: 'text-status-error',
}

// Filter to CSWP 39 rows only
const cswp39Rows = maturityRequirements.filter(
  (r) => r.refId === 'NIST CSWP 39' || r.sourceName.toLowerCase().includes('cryptographic agility')
)

// Build lookup: pillar → level → asset class → rows
type MaturityLookup = Map<PillarId, Map<MaturityLevel, Map<string, typeof cswp39Rows>>>

function buildLookup(): MaturityLookup {
  const lookup: MaturityLookup = new Map()
  for (const row of cswp39Rows) {
    if (!lookup.has(row.pillar)) lookup.set(row.pillar, new Map())
    const byLevel = lookup.get(row.pillar)!
    if (!byLevel.has(row.maturityLevel)) byLevel.set(row.maturityLevel, new Map())
    const byClass = byLevel.get(row.maturityLevel)!
    const ac = row.assetClass || 'all'
    if (!byClass.has(ac)) byClass.set(ac, [])
    byClass.get(ac)!.push(row)
  }
  return lookup
}

const LOOKUP = buildLookup()

function getRows(pillar: PillarId, level: MaturityLevel, filter: AssetClassFilter) {
  const byLevel = LOOKUP.get(pillar)
  if (!byLevel) return []
  const byClass = byLevel.get(level)
  if (!byClass) return []
  if (filter === 'all') {
    return Array.from(byClass.values()).flat()
  }
  return [...(byClass.get(filter) ?? []), ...(byClass.get('all') ?? [])]
}

function pillarCoverage(pillar: PillarId): { levelsPopulated: number; rowCount: number } {
  const byLevel = LOOKUP.get(pillar)
  if (!byLevel) return { levelsPopulated: 0, rowCount: 0 }
  const levelsPopulated = MATURITY_LEVELS.filter((l) => (byLevel.get(l)?.size ?? 0) > 0).length
  const rowCount = Array.from(byLevel.values())
    .flatMap((m) => Array.from(m.values()))
    .flat().length
  return { levelsPopulated, rowCount }
}

interface EvidenceCellProps {
  pillar: PillarId
  level: MaturityLevel
  filter: AssetClassFilter
}

function EvidenceCell({ pillar, level, filter }: EvidenceCellProps) {
  const [open, setOpen] = useState(false)
  const rows = getRows(pillar, level, filter)
  const handleToggle = useCallback(() => setOpen((v) => !v), [])

  if (rows.length === 0) {
    return (
      <div className="h-full min-h-[80px] flex items-center justify-center p-3 rounded-lg border border-dashed border-border bg-muted/10">
        <span className="text-xs text-muted-foreground/50 italic text-center">
          Pending re-extraction
        </span>
      </div>
    )
  }

  const first = rows[0]

  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
      <p className="text-xs text-foreground leading-relaxed line-clamp-4">{first.requirement}</p>
      {rows.length > 1 && (
        <p className="text-[10px] text-muted-foreground">+{rows.length - 1} more</p>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium uppercase ${CONFIDENCE_CLS[first.confidence]}`}>
          {first.confidence}
        </span>
        {first.evidenceQuote && (
          <Button
            variant="ghost"
            onClick={handleToggle}
            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-0.5"
            aria-expanded={open}
            aria-label="Toggle evidence quote"
          >
            Evidence
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>
      {open && first.evidenceQuote && (
        <blockquote className="border-l-2 border-primary/40 pl-2 text-[10px] text-muted-foreground italic leading-relaxed">
          "{first.evidenceQuote}"
          {first.evidenceLocation && (
            <span className="ml-1 not-italic font-medium text-muted-foreground/70">
              — {first.evidenceLocation}
            </span>
          )}
        </blockquote>
      )}
    </div>
  )
}

interface PillarSectionProps {
  pillarId: PillarId
  label: string
  filter: AssetClassFilter
}

function PillarSection({ pillarId, label, filter }: PillarSectionProps) {
  const { levelsPopulated, rowCount } = pillarCoverage(pillarId)
  const coveragePct = Math.round((levelsPopulated / 4) * 100)

  return (
    <section className="glass-panel p-5 space-y-4">
      {/* Pillar header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{label}</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span
              className={
                coveragePct === 100
                  ? 'text-status-success font-medium'
                  : coveragePct >= 50
                    ? 'text-status-warning font-medium'
                    : 'text-status-error font-medium'
              }
            >
              {levelsPopulated}/4
            </span>{' '}
            levels
          </span>
          <span>{rowCount} rows</span>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            coveragePct === 100
              ? 'bg-status-success'
              : coveragePct >= 50
                ? 'bg-status-warning'
                : 'bg-status-error'
          }`}
          style={{ width: `${coveragePct}%` }}
          aria-label={`${coveragePct}% level coverage`}
        />
      </div>

      {/* 4-column grid (one per maturity level) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MATURITY_LEVELS.map((level) => (
          <div key={level} className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              L{level} — {MATURITY_LEVEL_LABELS[level]}
            </p>
            <EvidenceCell pillar={pillarId} level={level} filter={filter} />
          </div>
        ))}
      </div>
    </section>
  )
}

export function AgilityView() {
  const [assetFilter, setAssetFilter] = useState<AssetClassFilter>('all')

  const totalRows = cswp39Rows.length
  const totalLevels = new Set(cswp39Rows.map((r) => r.maturityLevel)).size

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" aria-hidden="true" />
          <h1 className="text-gradient text-2xl font-bold">Cryptographic Agility Maturity</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          CSWP 39 five-pillar maturity model — requirements by level and asset class.{' '}
          <span className="text-muted-foreground/70">
            {totalRows} rows · {totalLevels}/4 levels populated
            {totalRows > 0 && totalLevels < 4 && (
              <span className="ml-1 italic">(full extraction pending qwen3.6:27b re-run)</span>
            )}
          </span>
        </p>
      </header>

      {/* Asset class filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by asset class">
        {ASSET_CLASS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={assetFilter === opt.value ? 'secondary' : 'ghost'}
            onClick={() => setAssetFilter(opt.value)}
            className="text-xs h-7 px-3"
            aria-pressed={assetFilter === opt.value}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Pillar sections */}
      <div className="space-y-4">
        {PILLARS.map((pillar) => (
          <PillarSection
            key={pillar.id}
            pillarId={pillar.id}
            label={pillar.label}
            filter={assetFilter}
          />
        ))}
      </div>

      {/* Footer attribution */}
      <footer className="text-xs text-muted-foreground/60 pt-2 border-t border-border">
        Source: NIST CSWP 39 — Considerations for Achieving Cryptographic Agility ·{' '}
        <a
          href="https://doi.org/10.6028/NIST.CSWP.39"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          doi.org/10.6028/NIST.CSWP.39
        </a>
      </footer>
    </div>
  )
}
