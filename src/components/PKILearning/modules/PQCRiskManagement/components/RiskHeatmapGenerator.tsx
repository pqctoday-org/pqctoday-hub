// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState, useCallback } from 'react'
import {
  Grid3X3,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Shield,
  ShieldCheck,
  ArrowRightLeft,
  Ban,
  BookOpen,
  MousePointer2,
} from 'lucide-react'
import { ExportableArtifact } from '@/components/PKILearning/common/executive'
import { useModuleStore } from '@/store/useModuleStore'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}

type TreatmentStrategy = 'mitigate' | 'accept' | 'transfer' | 'avoid'

interface TreatmentDecision {
  strategy: TreatmentStrategy
  justification: string
}

interface ResidualOverride {
  likelihood: number
  impact: number
}

interface RiskHeatmapGeneratorProps {
  riskEntries: RiskEntry[]
}

const LIKELIHOOD_LABELS = ['Almost Certain', 'Likely', 'Possible', 'Unlikely', 'Rare']

const IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic']

const TREATMENT_OPTIONS: {
  value: TreatmentStrategy
  label: string
  icon: React.ElementType
  color: string
  bg: string
  guidance: string
}[] = [
  {
    value: 'mitigate',
    label: 'Mitigate',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    guidance:
      'Migrate to PQC algorithms to reduce likelihood and/or impact. Set your expected post-mitigation values below.',
  },
  {
    value: 'accept',
    label: 'Accept',
    icon: Shield,
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
    guidance:
      "Risk is within tolerance. Example: AES-256 with Grover's reduces effective security to 128-bit, which NIST considers quantum-safe per IR 8547.",
  },
  {
    value: 'transfer',
    label: 'Transfer',
    icon: ArrowRightLeft,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
    guidance:
      'Shift responsibility to a third party (e.g., managed PKI/CA service handling PQC migration, or cyber insurance covering quantum-related breaches).',
  },
  {
    value: 'avoid',
    label: 'Avoid',
    icon: Ban,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
    guidance:
      'Eliminate the risk source entirely (e.g., decommission a legacy system using 3DES rather than migrate it).',
  },
]

function getRiskColor(score: number): string {
  if (score >= 20) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 6) return 'Medium'
  return 'Low'
}

function getRiskBadgeClasses(score: number): string {
  if (score >= 20) return 'bg-destructive/10 text-destructive'
  if (score >= 12) return 'bg-warning/10 text-warning'
  if (score >= 6) return 'bg-primary/10 text-primary'
  return 'bg-success/10 text-success'
}

/** Returns visible background color class for a risk zone cell.
 *  Uses actual Tailwind color tokens (not utility classes) so opacity modifiers work. */
function getZoneBg(score: number): string {
  if (score >= 20) return 'bg-destructive/50 dark:bg-destructive/40'
  if (score >= 12) return 'bg-warning/40 dark:bg-warning/30'
  if (score >= 6) return 'bg-warning/20 dark:bg-warning/15'
  return 'bg-success/20 dark:bg-success/15'
}

/** Returns text color class appropriate for the zone background. */
function getZoneText(score: number): string {
  if (score >= 20) return 'text-destructive-foreground dark:text-white'
  return 'text-foreground'
}

function buildEntriesMap(entries: RiskEntry[]) {
  const map = new Map<string, RiskEntry[]>()
  for (const entry of entries) {
    const rowIdx = 5 - entry.likelihood
    const colIdx = entry.impact - 1
    const key = `${rowIdx}-${colIdx}`
    const existing = map.get(key)
    if (existing) existing.push(entry)
    else map.set(key, [entry])
  }
  return map
}

// --- Sub-components ---

function TreatmentSelector({
  entry,
  decision,
  residualOverride,
  onDecisionChange,
  onResidualChange,
}: {
  entry: RiskEntry
  decision: TreatmentDecision | undefined
  residualOverride: ResidualOverride | undefined
  onDecisionChange: (id: string, decision: TreatmentDecision) => void
  onResidualChange: (id: string, override: ResidualOverride) => void
}) {
  const selectedOption = TREATMENT_OPTIONS.find((o) => o.value === decision?.strategy)

  return (
    <div className="space-y-3">
      {/* Strategy selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TREATMENT_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isSelected = decision?.strategy === opt.value
          return (
            <button
              key={opt.value}
              onClick={() =>
                onDecisionChange(entry.id, {
                  strategy: opt.value,
                  justification: decision?.justification ?? '',
                })
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                isSelected
                  ? `${opt.bg} ${opt.color} border-current`
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              <Icon size={14} />
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Contextual guidance */}
      {selectedOption && (
        <p className="text-xs text-muted-foreground italic px-1">{selectedOption.guidance}</p>
      )}

      {/* Justification */}
      {decision && (
        <label className="block">
          <span className="block text-xs font-medium text-muted-foreground mb-1">
            Justification
          </span>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px] resize-y text-xs"
            placeholder="Brief rationale for this treatment decision..."
            value={decision.justification}
            onChange={(e) =>
              onDecisionChange(entry.id, { ...decision, justification: e.target.value })
            }
          />
        </label>
      )}

      {/* Residual risk overrides for "mitigate" */}
      {decision?.strategy === 'mitigate' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Post-mitigation Likelihood
            </span>
            <FilterDropdown
              noContainer
              selectedId={String(residualOverride?.likelihood ?? entry.likelihood)}
              onSelect={(id) =>
                onResidualChange(entry.id, {
                  likelihood: Number(id),
                  impact: residualOverride?.impact ?? entry.impact,
                })
              }
              items={[
                { id: '1', label: '1 \u2014 Rare' },
                { id: '2', label: '2 \u2014 Unlikely' },
                { id: '3', label: '3 \u2014 Possible' },
                { id: '4', label: '4 \u2014 Likely' },
                { id: '5', label: '5 \u2014 Almost Certain' },
              ]}
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Post-mitigation Impact
            </span>
            <FilterDropdown
              noContainer
              selectedId={String(residualOverride?.impact ?? entry.impact)}
              onSelect={(id) =>
                onResidualChange(entry.id, {
                  likelihood: residualOverride?.likelihood ?? entry.likelihood,
                  impact: Number(id),
                })
              }
              items={[
                { id: '1', label: '1 \u2014 Negligible' },
                { id: '2', label: '2 \u2014 Minor' },
                { id: '3', label: '3 \u2014 Moderate' },
                { id: '4', label: '4 \u2014 Major' },
                { id: '5', label: '5 \u2014 Catastrophic' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PriorityRankingList({
  riskEntries,
  priorityOrder,
  treatmentDecisions,
  onReorder,
  priorityReasons,
  onReasonChange,
}: {
  riskEntries: RiskEntry[]
  priorityOrder: string[]
  treatmentDecisions: Record<string, TreatmentDecision>
  onReorder: (order: string[]) => void
  priorityReasons: Record<string, string>
  onReasonChange: (id: string, reason: string) => void
}) {
  const scoreSortedIds = useMemo(() => {
    return [...riskEntries]
      .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
      .map((e) => e.id)
  }, [riskEntries])

  const entryMap = useMemo(() => {
    const map = new Map<string, RiskEntry>()
    for (const e of riskEntries) map.set(e.id, e)
    return map
  }, [riskEntries])

  const moveUp = useCallback(
    (idx: number) => {
      if (idx <= 0) return
      const next = [...priorityOrder]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      onReorder(next)
    },
    [priorityOrder, onReorder]
  )

  const moveDown = useCallback(
    (idx: number) => {
      if (idx >= priorityOrder.length - 1) return
      const next = [...priorityOrder]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      onReorder(next)
    },
    [priorityOrder, onReorder]
  )

  return (
    <div className="space-y-3">
      {priorityOrder.map((id, idx) => {
        const entry = entryMap.get(id)
        if (!entry) return null
        const score = entry.likelihood * entry.impact
        const scoreRank = scoreSortedIds.indexOf(id)
        const isReordered = idx !== scoreRank
        const treatment = treatmentDecisions[id]

        return (
          <div
            key={id}
            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border"
          >
            <div className="flex flex-col gap-1 shrink-0 pt-1">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-0.5 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"
                aria-label="Move up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === priorityOrder.length - 1}
                className="p-0.5 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"
                aria-label="Move down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">#{idx + 1}</span>
                <span className="text-sm font-medium text-foreground truncate">
                  {entry.assetName || 'Unnamed'}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${getRiskBadgeClasses(score)}`}>
                  {score} ({getRiskColor(score)})
                </span>
                {treatment && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${TREATMENT_OPTIONS.find((o) => o.value === treatment.strategy)?.bg ?? ''}`}
                  >
                    {treatment.strategy}
                  </span>
                )}
                {isReordered && (
                  <span className="text-xs text-warning">(moved from #{scoreRank + 1})</span>
                )}
              </div>
              {isReordered && (
                <input
                  type="text"
                  className="mt-2 w-full px-2 py-1.5 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground text-xs"
                  placeholder="Why is this prioritized differently? (e.g., compliance deadline)"
                  value={priorityReasons[id] ?? ''}
                  onChange={(e) => onReasonChange(id, e.target.value)}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Risk Heatmap Grid (purpose-built, not using shared HeatmapGrid) ---

function RiskHeatmapGrid({
  entriesMap,
  entryIndexMap,
  selectedCell,
  onCellClick,
}: {
  entriesMap: Map<string, RiskEntry[]>
  entryIndexMap: Map<string, number>
  selectedCell: { row: number; col: number } | null
  onCellClick: (row: number, col: number) => void
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-1.5 text-left text-xs font-medium text-muted-foreground w-[100px]" />
              {IMPACT_LABELS.map((label, colIdx) => (
                <th
                  key={label}
                  className="p-1.5 text-center text-xs font-medium text-muted-foreground border-b border-border"
                >
                  <div className="font-bold">{colIdx + 1}</div>
                  <div className="font-normal">{label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIKELIHOOD_LABELS.map((label, rowIdx) => {
              const likelihood = 5 - rowIdx
              return (
                <tr key={label}>
                  <td className="p-1.5 text-xs font-medium text-foreground border-r border-border whitespace-nowrap align-middle">
                    <div className="font-bold">{likelihood}</div>
                    <div className="text-muted-foreground font-normal">{label}</div>
                  </td>
                  {IMPACT_LABELS.map((_, colIdx) => {
                    const impact = colIdx + 1
                    const score = likelihood * impact
                    const key = `${rowIdx}-${colIdx}`
                    const cellEntries = entriesMap.get(key) ?? []
                    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx

                    return (
                      <td
                        key={colIdx}
                        onClick={() => onCellClick(rowIdx, colIdx)}
                        className={`p-1.5 border border-border/50 cursor-pointer transition-all align-top ${getZoneBg(score)} ${getZoneText(score)} ${
                          isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:brightness-90'
                        }`}
                        style={{ minWidth: 90, minHeight: 64 }}
                        title={
                          cellEntries.length > 0
                            ? `Score ${score} (${getRiskColor(score)}): ${cellEntries.map((e) => e.assetName || 'Unnamed').join(', ')}`
                            : `Score ${score} (${getRiskColor(score)})`
                        }
                      >
                        <div className="flex flex-col gap-1 min-h-[52px]">
                          {/* Score badge */}
                          <span className="text-[10px] font-bold opacity-60 self-end">{score}</span>
                          {/* Entry markers */}
                          {cellEntries.map((entry) => {
                            const idx = entryIndexMap.get(entry.id)
                            return (
                              <div
                                key={entry.id}
                                className="bg-background/80 rounded px-1 py-0.5 text-[11px] font-medium text-foreground truncate leading-tight"
                              >
                                #{idx} {entry.assetName || 'Unnamed'}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
        <span className="font-medium">Scale:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> Low
          (1&ndash;5)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-warning/20 border border-warning/30" /> Medium
          (6&ndash;11)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-warning/40 border border-warning/50" /> High
          (12&ndash;19)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-destructive/50 border border-destructive/60" />{' '}
          Critical (20&ndash;25)
        </span>
      </div>
    </div>
  )
}

// --- Main Component ---

export const RiskHeatmapGenerator: React.FC<RiskHeatmapGeneratorProps> = ({ riskEntries }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [treatmentDecisions, setTreatmentDecisions] = useState<Record<string, TreatmentDecision>>(
    {}
  )
  const [residualOverrides, setResidualOverrides] = useState<Record<string, ResidualOverride>>({})
  const [viewMode, setViewMode] = useState<'inherent' | 'residual'>('inherent')
  const [userPriorityOrder, setUserPriorityOrder] = useState<string[] | null>(null)
  const [priorityReasons, setPriorityReasons] = useState<Record<string, string>>({})
  const [guideOpen, setGuideOpen] = useState(false)
  const { addExecutiveDocument } = useModuleStore()

  // Entry index map: entry id → #N (based on original riskEntries order from Step 2)
  const entryIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    riskEntries.forEach((e, idx) => map.set(e.id, idx + 1))
    return map
  }, [riskEntries])

  // Derive effective priority order from user overrides + risk entries
  const priorityOrder = useMemo(() => {
    const entryIds = new Set(riskEntries.map((e) => e.id))

    if (!userPriorityOrder) {
      return [...riskEntries]
        .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
        .map((e) => e.id)
    }

    const existing = userPriorityOrder.filter((id) => entryIds.has(id))
    const currentIds = new Set(userPriorityOrder)
    const newIds = riskEntries.filter((e) => !currentIds.has(e.id)).map((e) => e.id)
    return [...existing, ...newIds]
  }, [riskEntries, userPriorityOrder])

  const hasTreatments = Object.keys(treatmentDecisions).length > 0

  // Compute residual entries
  const residualEntries = useMemo(() => {
    return riskEntries
      .filter((entry) => treatmentDecisions[entry.id]?.strategy !== 'avoid')
      .map((entry) => {
        const decision = treatmentDecisions[entry.id]
        const override = residualOverrides[entry.id]

        if (decision?.strategy === 'mitigate' && override) {
          return { ...entry, likelihood: override.likelihood, impact: override.impact }
        }
        if (decision?.strategy === 'transfer') {
          return { ...entry, impact: Math.max(1, entry.impact - 1) }
        }
        return entry
      })
  }, [riskEntries, treatmentDecisions, residualOverrides])

  const activeEntries = viewMode === 'inherent' ? riskEntries : residualEntries

  // Build entries map from active entries
  const entriesMap = useMemo(() => buildEntriesMap(activeEntries), [activeEntries])

  // Delta summary
  const riskDelta = useMemo(() => {
    const count = (entries: RiskEntry[], min: number, max: number) =>
      entries.filter((e) => {
        const s = e.likelihood * e.impact
        return s >= min && s <= max
      }).length

    return {
      critical: { before: count(riskEntries, 20, 25), after: count(residualEntries, 20, 25) },
      high: { before: count(riskEntries, 12, 19), after: count(residualEntries, 12, 19) },
      medium: { before: count(riskEntries, 6, 11), after: count(residualEntries, 6, 11) },
      low: { before: count(riskEntries, 1, 5), after: count(residualEntries, 1, 5) },
    }
  }, [riskEntries, residualEntries])

  const treatmentProgress = useMemo(() => {
    const treated = riskEntries.filter((e) => treatmentDecisions[e.id]).length
    return riskEntries.length > 0 ? Math.round((treated / riskEntries.length) * 100) : 0
  }, [riskEntries, treatmentDecisions])

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell((prev) => (prev?.row === row && prev?.col === col ? null : { row, col }))
  }, [])

  const selectedEntries = useMemo(() => {
    if (!selectedCell) return []
    const key = `${selectedCell.row}-${selectedCell.col}`
    return entriesMap.get(key) ?? []
  }, [selectedCell, entriesMap])

  const selectedScore = selectedCell ? (5 - selectedCell.row) * (selectedCell.col + 1) : null

  const handleDecisionChange = useCallback((id: string, decision: TreatmentDecision) => {
    setTreatmentDecisions((prev) => {
      const next = { ...prev, [id]: decision }
      if (Object.keys(prev).length === 0) setViewMode('residual')
      return next
    })
  }, [])

  const handleResidualChange = useCallback((id: string, override: ResidualOverride) => {
    setResidualOverrides((prev) => ({ ...prev, [id]: override }))
  }, [])

  const handleReasonChange = useCallback((id: string, reason: string) => {
    setPriorityReasons((prev) => ({ ...prev, [id]: reason }))
  }, [])

  // Export markdown
  const exportMarkdown = useMemo(() => {
    const entryMap = new Map<string, RiskEntry>()
    for (const e of riskEntries) entryMap.set(e.id, e)

    let md = '# Quantum Risk Treatment Plan\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    const strategies = ['mitigate', 'accept', 'transfer', 'avoid'] as const
    md += '## Treatment Summary\n\n'
    md += '| Treatment | Count |\n|-----------|-------|\n'
    for (const s of strategies) {
      const count = Object.values(treatmentDecisions).filter((d) => d.strategy === s).length
      md += `| ${s.charAt(0).toUpperCase() + s.slice(1)} | ${count} |\n`
    }
    const untreated = riskEntries.length - Object.keys(treatmentDecisions).length
    md += `| Untreated | ${untreated} |\n\n`

    md += '## Inherent vs. Residual Risk\n\n'
    md += '| Level | Inherent | Residual | Change |\n|-------|----------|----------|--------|\n'
    for (const [level, data] of Object.entries(riskDelta)) {
      const change = data.after - data.before
      const changeStr = change > 0 ? `+${change}` : `${change}`
      md += `| ${level.charAt(0).toUpperCase() + level.slice(1)} | ${data.before} | ${data.after} | ${changeStr} |\n`
    }
    md += '\n'

    md += '## Treatment Decisions\n\n'
    md += '| # | Asset | Inherent Score | Treatment | Residual Score | Justification |\n'
    md += '|---|-------|---------------|-----------|---------------|---------------|\n'
    riskEntries.forEach((entry, idx) => {
      const inherentScore = entry.likelihood * entry.impact
      const decision = treatmentDecisions[entry.id]
      const strategy = decision?.strategy ?? 'untreated'
      const justification = decision?.justification || '-'

      let residualScore: string
      if (decision?.strategy === 'avoid') {
        residualScore = 'Removed'
      } else if (decision?.strategy === 'mitigate' && residualOverrides[entry.id]) {
        const o = residualOverrides[entry.id]
        const s = o.likelihood * o.impact
        residualScore = `${s} (${getRiskColor(s)})`
      } else if (decision?.strategy === 'transfer') {
        const s = entry.likelihood * Math.max(1, entry.impact - 1)
        residualScore = `${s} (${getRiskColor(s)})`
      } else {
        residualScore = `${inherentScore} (${getRiskColor(inherentScore)})`
      }

      md += `| ${idx + 1} | ${entry.assetName || 'Unnamed'} | ${inherentScore} (${getRiskColor(inherentScore)}) | ${strategy} | ${residualScore} | ${justification} |\n`
    })
    md += '\n'

    md += '## Migration Priority Order\n\n'
    priorityOrder.forEach((id, idx) => {
      const entry = entryMap.get(id)
      if (!entry) return
      const score = entry.likelihood * entry.impact
      const decision = treatmentDecisions[id]
      const strategy = decision ? ` | Treatment: ${decision.strategy}` : ''
      md += `${idx + 1}. **${entry.assetName || 'Unnamed'}** \u2014 Score: ${score}${strategy}\n`
      const reason = priorityReasons[id]
      if (reason) md += `   *Priority note: ${reason}*\n`
    })

    return md
  }, [
    riskEntries,
    treatmentDecisions,
    residualOverrides,
    riskDelta,
    priorityOrder,
    priorityReasons,
  ])

  const handleSaveToPortfolio = useCallback(() => {
    addExecutiveDocument({
      id: `risk-treatment-plan-${Date.now()}`,
      type: 'risk-treatment-plan',
      title: 'Quantum Risk Treatment Plan',
      data: exportMarkdown,
      createdAt: Date.now(),
      moduleId: 'pqc-risk-management',
    })
  }, [exportMarkdown, addExecutiveDocument])

  // --- Empty state ---
  if (riskEntries.length === 0) {
    return (
      <div className="space-y-6">
        <EducationalGuide open={guideOpen} onToggle={() => setGuideOpen(!guideOpen)} />
        <div className="glass-panel p-8 text-center">
          <Grid3X3 size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No risk entries to display. Go to Step 2 (Risk Register Builder) to add risk entries,
            then return here to work through the treatment workshop.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Instructions + Educational Guide */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>
            This workshop guides you through three activities: assign a{' '}
            <strong>treatment strategy</strong> to each risk (click any cell), compare{' '}
            <strong>inherent vs. residual risk</strong>, and set your{' '}
            <strong>migration priority order</strong>.
          </p>
        </div>
      </div>

      <EducationalGuide open={guideOpen} onToggle={() => setGuideOpen(!guideOpen)} />

      {/* 2. View Toggle + Delta Summary */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('inherent')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'inherent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Inherent Risk
            </button>
            <button
              onClick={() => hasTreatments && setViewMode('residual')}
              disabled={!hasTreatments}
              title={!hasTreatments ? 'Assign at least one treatment strategy first' : undefined}
              className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                viewMode === 'residual'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Residual Risk
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {hasTreatments
              ? `${treatmentProgress}% treated (${Object.keys(treatmentDecisions).length} of ${riskEntries.length})`
              : 'No treatments assigned yet — click a cell to start'}
          </span>
        </div>

        {/* Delta strip — only meaningful once treatments exist */}
        {hasTreatments && (
          <div className="flex flex-wrap gap-4 text-xs">
            {(
              [
                { label: 'Critical', data: riskDelta.critical, color: 'text-destructive' },
                { label: 'High', data: riskDelta.high, color: 'text-warning' },
                { label: 'Medium', data: riskDelta.medium, color: 'text-primary' },
                { label: 'Low', data: riskDelta.low, color: 'text-success' },
              ] as const
            ).map(({ label, data, color }) => (
              <span key={label} className={`font-medium ${color}`}>
                {label}: {data.before}
                {data.before !== data.after && (
                  <span className="text-muted-foreground"> &rarr; {data.after}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Heatmap Grid */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            {viewMode === 'inherent' ? 'Inherent' : 'Residual'} Risk Heatmap
          </h3>
          <span className="text-xs text-muted-foreground ml-2">
            ({activeEntries.length} {activeEntries.length === 1 ? 'risk' : 'risks'} plotted)
          </span>
        </div>

        <div className="flex items-start gap-2">
          {/* Y-axis label */}
          <div className="flex items-center justify-center w-5 shrink-0 self-center">
            <span
              className="text-[10px] font-bold text-muted-foreground whitespace-nowrap tracking-widest"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              LIKELIHOOD
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <RiskHeatmapGrid
              entriesMap={entriesMap}
              entryIndexMap={entryIndexMap}
              selectedCell={selectedCell}
              onCellClick={handleCellClick}
            />
            {/* X-axis label */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                IMPACT
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-muted/40 border border-border rounded-lg w-fit mx-auto">
          <MousePointer2 size={14} className="text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">
            Click any cell to assign a treatment strategy
          </span>
        </div>
      </div>

      {/* 4. Cell Detail Panel with Treatment Selectors */}
      {selectedCell && (
        <div className="glass-panel p-6 animate-fade-in">
          <h3 className="text-base font-semibold text-foreground mb-1">
            Cell Details &mdash; Likelihood: {5 - selectedCell.row}, Impact: {selectedCell.col + 1}
            {selectedScore !== null && (
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded ${getRiskBadgeClasses(selectedScore)}`}
              >
                Score: {selectedScore} ({getRiskColor(selectedScore)})
              </span>
            )}
          </h3>

          {selectedEntries.length > 0 ? (
            <div className="space-y-4 mt-4">
              {selectedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-muted/50 rounded-lg border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      #{entryIndexMap.get(entry.id)} {entry.assetName || 'Unnamed Asset'}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.currentAlgorithm}</span>
                  </div>
                  {entry.mitigation && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Mitigation plan:</strong> {entry.mitigation}
                    </p>
                  )}
                  <div className="border-t border-border pt-3">
                    <span className="block text-xs font-semibold text-foreground mb-2">
                      Treatment Strategy
                    </span>
                    <TreatmentSelector
                      entry={entry}
                      decision={treatmentDecisions[entry.id]}
                      residualOverride={residualOverrides[entry.id]}
                      onDecisionChange={handleDecisionChange}
                      onResidualChange={handleResidualChange}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              No risk entries in this cell ({getRiskColor(selectedScore ?? 0)} zone).
            </p>
          )}
        </div>
      )}

      {/* 5. Treatment Summary Cards */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Treatment Summary</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {TREATMENT_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const count = Object.values(treatmentDecisions).filter(
              (d) => d.strategy === opt.value
            ).length
            return (
              <div key={opt.value} className={`rounded-lg p-3 border text-center ${opt.bg}`}>
                <Icon size={16} className={`mx-auto mb-1 ${opt.color}`} />
                <div className={`text-xl font-bold ${opt.color}`}>{count}</div>
                <div className="text-xs text-muted-foreground">{opt.label}</div>
              </div>
            )
          })}
          <div className="rounded-lg p-3 border border-border bg-muted/30 text-center">
            <Shield size={16} className="mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold text-muted-foreground">
              {riskEntries.length - Object.keys(treatmentDecisions).length}
            </div>
            <div className="text-xs text-muted-foreground">Untreated</div>
          </div>
        </div>
        {treatmentProgress > 0 && treatmentProgress < 100 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${treatmentProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{treatmentProgress}%</span>
          </div>
        )}
      </div>

      {/* 6. Priority Ranking Exercise */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUp size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Migration Priority Order</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Reorder to set your migration sequence. Consider compliance deadlines, implementation
          complexity, and business impact &mdash; not just risk score. A priority reason field
          appears when you move an entry out of score order.
        </p>
        <PriorityRankingList
          riskEntries={riskEntries}
          priorityOrder={priorityOrder}
          treatmentDecisions={treatmentDecisions}
          onReorder={setUserPriorityOrder}
          priorityReasons={priorityReasons}
          onReasonChange={handleReasonChange}
        />
      </div>

      {/* 7. Export */}
      <ExportableArtifact
        title="Risk Treatment Plan"
        exportData={exportMarkdown}
        filename="quantum-risk-treatment-plan"
        formats={['markdown']}
        onExport={handleSaveToPortfolio}
      >
        <p className="text-xs text-muted-foreground">
          Includes treatment decisions, residual risk analysis, and priority order.
        </p>
      </ExportableArtifact>
    </div>
  )
}

// --- Educational Guide ---

function EducationalGuide({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <BookOpen size={16} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground flex-1">
          How to Read a Risk Heatmap
        </span>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded bg-destructive/50" />
                <span className="text-sm font-semibold text-destructive">
                  Critical (20&ndash;25)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Top-right zone. Immediate action required. Assets using RSA/ECC with near-term CRQC
                exposure and catastrophic breach consequences. Migrate first.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-warning/20 bg-warning/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded bg-warning/40" />
                <span className="text-sm font-semibold text-warning">High (12&ndash;19)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Either likelihood is high or impact is severe. Plan migration within 12 months.
                Often includes key exchange protocols vulnerable to HNDL attacks.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-warning/15 bg-warning/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded bg-warning/20" />
                <span className="text-sm font-semibold text-primary">Medium (6&ndash;11)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Center zone. Real but manageable risks within normal planning cycles. Schedule for
                migration as part of broader PQC transition.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-success/20 bg-success/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded bg-success/20" />
                <span className="text-sm font-semibold text-success">Low (1&ndash;5)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Bottom-left zone. Threat is unlikely or impact is contained. May include
                quantum-safe algorithms (AES-256) that need monitoring only.
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Reading direction:</strong> Scan from top-right (urgent) to bottom-left
              (safe). Multiple entries in one cell indicate a systemic risk &mdash; an algorithm or
              threat vector affecting many assets simultaneously.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
