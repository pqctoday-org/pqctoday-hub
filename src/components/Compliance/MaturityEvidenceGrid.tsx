// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import type { MaturityRequirement, PillarId, MaturityLevel } from '@/types/MaturityTypes'
import { MATURITY_LEVEL_LABELS } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/maturityModel'

// ── Constants ────────────────────────────────────────────────────────────

const PILLARS: { id: PillarId; label: string; short: string }[] = [
  { id: 'inventory', label: 'Inventory', short: 'Inventory' },
  { id: 'governance', label: 'Governance', short: 'Governance' },
  { id: 'lifecycle', label: 'Lifecycle', short: 'Lifecycle' },
  { id: 'observability', label: 'Observability', short: 'Observability' },
  { id: 'assurance', label: 'Assurance', short: 'Assurance' },
]

const TIERS: { level: MaturityLevel; tone: 'error' | 'warning' | 'info' | 'success' }[] = [
  { level: 1, tone: 'error' },
  { level: 2, tone: 'warning' },
  { level: 3, tone: 'info' },
  { level: 4, tone: 'success' },
]

const TONE_CLASSES = {
  error: {
    row: 'bg-status-error/5',
    label: 'text-status-error',
    badge: 'bg-status-error/15 text-status-error',
    cell: 'hover:bg-status-error/15 border-status-error/20',
    cellActive: 'bg-status-error/20 border-status-error/50 ring-1 ring-status-error/40',
  },
  warning: {
    row: 'bg-status-warning/5',
    label: 'text-status-warning',
    badge: 'bg-status-warning/15 text-status-warning',
    cell: 'hover:bg-status-warning/15 border-status-warning/20',
    cellActive: 'bg-status-warning/20 border-status-warning/50 ring-1 ring-status-warning/40',
  },
  info: {
    row: 'bg-status-info/5',
    label: 'text-status-info',
    badge: 'bg-status-info/15 text-status-info',
    cell: 'hover:bg-status-info/15 border-status-info/20',
    cellActive: 'bg-status-info/20 border-status-info/50 ring-1 ring-status-info/40',
  },
  success: {
    row: 'bg-status-success/5',
    label: 'text-status-success',
    badge: 'bg-status-success/15 text-status-success',
    cell: 'hover:bg-status-success/15 border-status-success/20',
    cellActive: 'bg-status-success/20 border-status-success/50 ring-1 ring-status-success/40',
  },
}

const CATEGORY_OPTIONS = [
  { id: 'All', label: 'All categories' },
  { id: 'Compliance Frameworks', label: 'Compliance Frameworks' },
  { id: 'Certification Schemes', label: 'Certification Schemes' },
  { id: 'Technical Standards', label: 'Technical Standards' },
  { id: 'Standardization Bodies', label: 'Standardization Bodies' },
]

const ASSET_CLASS_OPTIONS = [
  { id: 'All', label: 'All asset classes' },
  { id: 'all', label: 'Generic (all)' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'software', label: 'Software' },
  { id: 'keys', label: 'Keys' },
]

// ── Requirement card ─────────────────────────────────────────────────────

function RequirementCard({ req }: { req: MaturityRequirement }) {
  const [open, setOpen] = useState(false)
  const categoryColor: Record<string, string> = {
    'Compliance Frameworks': 'bg-status-warning/10 text-status-warning',
    'Certification Schemes': 'bg-status-info/10 text-status-info',
    'Technical Standards': 'bg-primary/10 text-primary',
    'Standardization Bodies': 'bg-secondary/10 text-secondary',
  }
  const catCls = categoryColor[req.category] ?? 'bg-muted text-muted-foreground'

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-card text-xs">
      <div className="flex items-start gap-2 flex-wrap">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${catCls}`}>
          {req.category}
        </span>
        {req.assetClass !== 'all' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium shrink-0">
            {req.assetClass}
          </span>
        )}
        <span className="text-muted-foreground ml-auto shrink-0">{req.sourceType}</span>
      </div>
      <p className="font-medium text-foreground leading-snug">{req.sourceName}</p>
      <p className="text-foreground/80 leading-relaxed">{req.requirement}</p>
      {(req.evidenceQuote || req.evidenceLocation || req.sourceUrl) && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="h-auto p-0 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
          >
            {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {open ? 'Hide evidence' : 'Show evidence'}
            {req.evidenceLocation && (
              <span className="ml-1 font-mono bg-muted px-1 rounded">{req.evidenceLocation}</span>
            )}
          </Button>
          {open && (
            <div className="mt-2 space-y-1.5 border-l-2 border-border pl-2.5">
              {req.evidenceQuote && (
                <blockquote className="text-muted-foreground italic leading-relaxed">
                  &ldquo;{req.evidenceQuote}&rdquo;
                </blockquote>
              )}
              {req.sourceUrl && (
                <a
                  href={req.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  Source document
                  <ExternalLink size={9} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

interface MaturityEvidenceGridProps {
  requirements: MaturityRequirement[]
  initialRefFilter?: string
  onClearRefFilter?: () => void
}

export function MaturityEvidenceGrid({
  requirements,
  initialRefFilter,
  onClearRefFilter,
}: MaturityEvidenceGridProps) {
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [assetFilter, setAssetFilter] = useState('All')
  const [selected, setSelected] = useState<{ tier: MaturityLevel; pillar: PillarId } | null>(null)

  // Derive the banner source name when filtering to a single ref
  const refSourceName = useMemo(() => {
    if (!initialRefFilter) return null
    const match = requirements.find((r) => r.refId === initialRefFilter)
    return match?.sourceName ?? initialRefFilter
  }, [initialRefFilter, requirements])

  // Apply all filters
  const filtered = useMemo(() => {
    let base = requirements
    if (initialRefFilter) base = base.filter((r) => r.refId === initialRefFilter)
    if (categoryFilter !== 'All') base = base.filter((r) => r.category === categoryFilter)
    if (assetFilter !== 'All') base = base.filter((r) => r.assetClass === assetFilter)
    return base
  }, [requirements, initialRefFilter, categoryFilter, assetFilter])

  // Build count grid
  const countGrid = useMemo(() => {
    const grid = new Map<string, number>()
    for (const req of filtered) {
      const key = `${req.maturityLevel}:${req.pillar}`
      grid.set(key, (grid.get(key) ?? 0) + 1)
    }
    return grid
  }, [filtered])

  // Requirements for the selected cell
  const cellRequirements = useMemo(() => {
    if (!selected) return []
    return filtered.filter((r) => r.maturityLevel === selected.tier && r.pillar === selected.pillar)
  }, [filtered, selected])

  const uniqueSources = useMemo(() => new Set(filtered.map((r) => r.refId)).size, [filtered])

  function handleCellClick(tier: MaturityLevel, pillar: PillarId) {
    const key = `${tier}:${pillar}`
    const count = countGrid.get(key) ?? 0
    if (count === 0) return
    setSelected((prev) =>
      prev?.tier === tier && prev?.pillar === pillar ? null : { tier, pillar }
    )
  }

  return (
    <div className="space-y-4">
      {/* Ref filter banner */}
      {initialRefFilter && refSourceName && (
        <div className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <span className="text-foreground/80 flex-1 min-w-0 truncate">
            Filtered to: <span className="font-medium text-foreground">{refSourceName}</span> (
            {filtered.length} requirements)
          </span>
          {onClearRefFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRefFilter}
              className="h-auto px-1 py-0 shrink-0 inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:bg-transparent font-medium"
            >
              <X size={12} />
              Show all
            </Button>
          )}
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {filtered.length} requirements · {uniqueSources} sources
        </span>
        <div className="flex gap-2 ml-auto">
          <FilterDropdown
            items={CATEGORY_OPTIONS}
            selectedId={categoryFilter}
            onSelect={setCategoryFilter}
            label="Category"
            defaultLabel="All categories"
            noContainer
          />
          <FilterDropdown
            items={ASSET_CLASS_OPTIONS}
            selectedId={assetFilter}
            onSelect={setAssetFilter}
            label="Asset class"
            defaultLabel="All asset classes"
            noContainer
          />
        </div>
      </div>

      {/* Grid */}
      <div className="relative overflow-x-auto rounded-lg border border-border">
        <div
          aria-hidden="true"
          className="md:hidden pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent"
        />
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left p-2.5 border-b border-border font-medium text-muted-foreground w-28">
                Tier
              </th>
              {PILLARS.map((p) => (
                <th
                  key={p.id}
                  className="text-center p-2.5 border-b border-border font-medium text-foreground"
                >
                  {p.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIERS.map(({ level, tone }) => {
              const cls = TONE_CLASSES[tone]
              return (
                <tr key={level} className={cls.row}>
                  <td className="p-2.5 border-b border-border align-middle">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold ${cls.label}`}>Tier {level}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {MATURITY_LEVEL_LABELS[level]}
                      </span>
                    </div>
                  </td>
                  {PILLARS.map((p) => {
                    const count = countGrid.get(`${level}:${p.id}`) ?? 0
                    const isActive = selected?.tier === level && selected?.pillar === p.id
                    return (
                      <td
                        key={p.id}
                        className="p-2 border-b border-border text-center align-middle"
                      >
                        {count > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCellClick(level, p.id)}
                            className={`h-auto p-0 inline-flex items-center justify-center w-full min-h-[36px] rounded border transition-all font-semibold text-sm ${
                              isActive ? cls.cellActive : `${cls.cell} ${cls.badge}`
                            }`}
                            title={`${count} requirement${count !== 1 ? 's' : ''} — Tier ${level} · ${p.label}`}
                          >
                            {count}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Selected cell requirements */}
      {selected && cellRequirements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              {PILLARS.find((p) => p.id === selected.pillar)?.label} · Tier {selected.tier}{' '}
              {MATURITY_LEVEL_LABELS[selected.tier]}
            </h4>
            <span className="text-xs text-muted-foreground">
              {cellRequirements.length} requirement{cellRequirements.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(null)}
              className="h-auto p-0 ml-auto text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
            {cellRequirements.map((req, i) => (
              <RequirementCard
                key={`${req.refId}-${req.pillar}-${req.maturityLevel}-${i}`}
                req={req}
              />
            ))}
          </div>
        </div>
      )}

      {selected && cellRequirements.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No requirements match the current filters for this cell.
        </p>
      )}

      {!selected && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Click any highlighted cell to see the requirements at that tier and pillar.
        </p>
      )}

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No requirements match the current filters.
        </p>
      )}
    </div>
  )
}
