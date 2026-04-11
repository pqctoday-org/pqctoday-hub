// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Eye,
  GitBranch,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { MIGRATION_VECTORS } from '../data/migrationRiskData'
import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  type MigrationSeverity,
  type PaymentComponent,
  type PaymentNetworkId,
} from '../data/emvConstants'

// ── Helpers ──────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<MigrationSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const SEVERITY_Y_ORDER: MigrationSeverity[] = ['critical', 'high', 'medium', 'low']

const NETWORK_FILTER_ITEMS = [
  { id: 'All', label: 'All Networks' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex', label: 'Amex' },
  { id: 'unionpay', label: 'UnionPay' },
  { id: 'discover', label: 'Discover' },
]

const TIMELINE_START = 2025
const TIMELINE_END = 2035
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START

function parseTimelineRange(timeline: string): { start: number; end: number } {
  const match = timeline.match(/(\d{4})\s*-\s*(\d{4})/)
  if (match) {
    return { start: parseInt(match[1], 10), end: parseInt(match[2], 10) }
  }
  return { start: TIMELINE_START, end: TIMELINE_END }
}

// Build adjacency for dependency DAG
function buildDependencyOrder(
  vectors: typeof MIGRATION_VECTORS
): { id: PaymentComponent; label: string; depth: number }[] {
  const depthMap = new Map<PaymentComponent, number>()
  const labelMap = new Map<PaymentComponent, string>()
  for (const v of vectors) {
    labelMap.set(v.component, v.componentLabel)
  }

  function getDepth(component: PaymentComponent): number {
    if (depthMap.has(component)) return depthMap.get(component)!
    const vec = vectors.find((v) => v.component === component)
    if (!vec || vec.dependencies.length === 0) {
      depthMap.set(component, 0)
      return 0
    }
    const maxDepDep = Math.max(...vec.dependencies.map((d) => getDepth(d)))
    const depth = maxDepDep + 1
    depthMap.set(component, depth)
    return depth
  }

  for (const v of vectors) {
    getDepth(v.component)
  }

  const entries = vectors.map((v) => ({
    id: v.component,
    label: v.componentLabel,
    depth: depthMap.get(v.component) ?? 0,
  }))

  entries.sort((a, b) => a.depth - b.depth)
  return entries
}

// ── Component ────────────────────────────────────────────────────────────

export const MigrationRiskMatrix: React.FC = () => {
  const [networkFilter, setNetworkFilter] = useState('All')
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [view, setView] = useState<'matrix' | 'dag'>('matrix')

  const filteredVectors = useMemo(() => {
    if (networkFilter === 'All') return MIGRATION_VECTORS
    return MIGRATION_VECTORS.filter(
      (v) =>
        v.networkSpecific.length === 0 ||
        v.networkSpecific.includes(networkFilter as PaymentNetworkId)
    )
  }, [networkFilter])

  const selectedVector = useMemo(
    () => filteredVectors.find((v) => v.id === selectedComponentId) ?? null,
    [selectedComponentId, filteredVectors]
  )

  const dagOrder = useMemo(() => buildDependencyOrder(filteredVectors), [filteredVectors])

  // Group components by severity and effort for the heatmap
  const matrixCells = useMemo(() => {
    const cells: Record<string, typeof filteredVectors> = {}
    for (const sev of SEVERITY_Y_ORDER) {
      for (let effort = 1; effort <= 5; effort++) {
        cells[`${sev}-${effort}`] = []
      }
    }
    for (const v of filteredVectors) {
      const key = `${v.severity}-${v.migrationEffort}`
      if (cells[key]) {
        cells[key].push(v)
      }
    }
    return cells
  }, [filteredVectors])

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Visualize the PQC migration risk landscape across payment infrastructure. Position
        components by severity and migration effort, identify HNDL exposure, and understand
        dependency ordering.
      </p>

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <FilterDropdown
          items={NETWORK_FILTER_ITEMS}
          selectedId={networkFilter}
          onSelect={setNetworkFilter}
          label="Network"
          defaultLabel="All Networks"
          defaultIcon={<BarChart3 size={16} className="text-primary" />}
          noContainer
        />
        <div className="flex items-center gap-1">
          <Button
            variant={view === 'matrix' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('matrix')}
            className="text-xs h-8 px-3"
          >
            <BarChart3 size={12} className="mr-1" />
            Risk Matrix
          </Button>
          <Button
            variant={view === 'dag' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('dag')}
            className="text-xs h-8 px-3"
          >
            <GitBranch size={12} className="mr-1" />
            Dependencies
          </Button>
        </div>
      </div>

      {/* ── Risk Matrix View ───────────────────────────────────────── */}
      {view === 'matrix' && (
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">
            Severity vs. Migration Effort
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Column headers (Effort 1-5) */}
              <div className="flex mb-1">
                <div className="w-20 shrink-0" />
                {[1, 2, 3, 4, 5].map((effort) => (
                  <div
                    key={effort}
                    className="flex-1 text-center text-[10px] text-muted-foreground font-medium"
                  >
                    Effort {effort}
                  </div>
                ))}
              </div>

              {/* Rows (Severity high to low) */}
              {SEVERITY_Y_ORDER.map((severity) => (
                <div key={severity} className="flex mb-1">
                  {/* Row label */}
                  <div className="w-20 shrink-0 flex items-center">
                    <span
                      className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${SEVERITY_COLORS[severity]}`}
                    >
                      {SEVERITY_LABELS[severity]}
                    </span>
                  </div>

                  {/* Cells */}
                  {[1, 2, 3, 4, 5].map((effort) => {
                    const cellVectors = matrixCells[`${severity}-${effort}`] ?? []
                    const bgOpacity =
                      severity === 'critical'
                        ? 'bg-status-error/5'
                        : severity === 'high'
                          ? 'bg-status-warning/5'
                          : 'bg-muted/20'
                    return (
                      <div
                        key={effort}
                        className={`flex-1 min-h-[60px] p-1 border border-border/50 rounded ${bgOpacity} flex flex-wrap content-start gap-1`}
                      >
                        {cellVectors.map((v) => (
                          <Button
                            variant="ghost"
                            key={v.id}
                            onClick={() =>
                              setSelectedComponentId(selectedComponentId === v.id ? null : v.id)
                            }
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors border cursor-pointer ${
                              selectedComponentId === v.id
                                ? 'border-primary bg-primary/20 text-primary'
                                : `border-border bg-background/80 text-foreground hover:border-primary/30`
                            }`}
                            title={v.componentLabel}
                          >
                            {v.hndlExposure && (
                              <AlertTriangle size={8} className="text-status-error shrink-0" />
                            )}
                            <span className="truncate max-w-[80px]">
                              {v.componentLabel.split(' ').slice(0, 2).join(' ')}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* Axis label */}
              <div className="flex mt-1">
                <div className="w-20 shrink-0" />
                <div className="flex-1 text-center text-[10px] text-muted-foreground">
                  Migration Effort (1 = easy, 5 = extremely hard) &rarr;
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <AlertTriangle size={10} className="text-status-error" />
              <span className="text-[10px] text-muted-foreground">HNDL Exposure</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-primary bg-primary/20" />
              <span className="text-[10px] text-muted-foreground">Selected</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Dependency DAG View ────────────────────────────────────── */}
      {view === 'dag' && (
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">Migration Dependency Order</div>
          <p className="text-xs text-muted-foreground mb-4">
            Components are ordered by dependency depth. Components at depth 0 have no dependencies
            and can migrate first. Higher depths require prerequisite migrations.
          </p>

          <div className="space-y-2">
            {/* Group by depth */}
            {Array.from(new Set(dagOrder.map((d) => d.depth)))
              .sort((a, b) => a - b)
              .map((depth) => {
                const items = dagOrder.filter((d) => d.depth === depth)
                const isCriticalPath = depth === Math.max(...dagOrder.map((d) => d.depth))
                return (
                  <div key={depth}>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Depth {depth}
                      {depth === 0 && ' (No Dependencies)'}
                      {isCriticalPath && ' (Critical Path)'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => {
                        const vec = filteredVectors.find((v) => v.component === item.id)
                        return (
                          <Button
                            variant="ghost"
                            key={item.id}
                            onClick={() => {
                              const v = filteredVectors.find((fv) => fv.component === item.id)
                              if (v)
                                setSelectedComponentId(selectedComponentId === v.id ? null : v.id)
                            }}
                            className={`rounded-lg p-2 border text-left transition-colors ${
                              isCriticalPath
                                ? 'border-status-error/30 bg-status-error/5'
                                : 'border-border bg-muted/20'
                            } ${
                              vec && selectedComponentId === vec.id
                                ? 'ring-2 ring-primary border-primary'
                                : 'hover:border-primary/30'
                            }`}
                          >
                            <div className="text-xs font-medium text-foreground flex items-center gap-1">
                              {vec?.hndlExposure && (
                                <AlertTriangle size={10} className="text-status-error shrink-0" />
                              )}
                              {item.label}
                            </div>
                            {vec && (
                              <span
                                className={`text-[10px] font-bold rounded px-1 py-0 border mt-0.5 inline-block ${SEVERITY_COLORS[vec.severity]}`}
                              >
                                {SEVERITY_LABELS[vec.severity]}
                              </span>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                    {depth < Math.max(...dagOrder.map((d) => d.depth)) && (
                      <div className="flex justify-center py-1">
                        <ArrowRight size={14} className="text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Selected Component Detail Panel ────────────────────────── */}
      {selectedVector && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-foreground">{selectedVector.componentLabel}</div>
            <span
              className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${SEVERITY_COLORS[selectedVector.severity]}`}
            >
              {SEVERITY_LABELS[selectedVector.severity]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Current Crypto
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedVector.currentCrypto.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5 text-foreground border border-border"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Vulnerability
              </div>
              <p className="text-xs text-foreground">{selectedVector.vulnerability}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-muted/30 rounded-lg p-2 border border-border text-center">
              <div className="text-[10px] text-muted-foreground">Effort</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      i < selectedVector.migrationEffort ? 'bg-status-warning' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs font-mono text-foreground mt-0.5">
                {selectedVector.migrationEffort}/5
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-2 border border-border text-center">
              <div className="text-[10px] text-muted-foreground">HNDL</div>
              {selectedVector.hndlExposure ? (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Eye size={14} className="text-status-error" />
                  <span className="text-xs font-bold text-status-error">Exposed</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <ShieldCheck size={14} className="text-status-success" />
                  <span className="text-xs font-bold text-status-success">No</span>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-2 border border-border text-center">
              <div className="text-[10px] text-muted-foreground">Scale</div>
              <p className="text-[10px] text-foreground mt-1">{selectedVector.affectedScale}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-2 border border-border text-center">
              <div className="text-[10px] text-muted-foreground">Timeline</div>
              <div className="text-xs font-mono font-bold text-foreground mt-1">
                {selectedVector.migrationTimeline}
              </div>
            </div>
          </div>

          {/* PQC Solutions */}
          <div className="mb-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              PQC Solutions
            </div>
            <ul className="space-y-1">
              {selectedVector.pqcSolution.map((sol) => (
                <li key={sol} className="flex items-start gap-1.5 text-xs text-foreground">
                  <ShieldCheck size={10} className="text-status-success shrink-0 mt-0.5" />
                  {sol}
                </li>
              ))}
            </ul>
          </div>

          {/* Dependencies */}
          {selectedVector.dependencies.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Dependencies (must migrate first)
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedVector.dependencies.map((dep) => {
                  const depVec = MIGRATION_VECTORS.find((v) => v.component === dep)
                  return (
                    <Button
                      variant="ghost"
                      key={dep}
                      onClick={() => {
                        if (depVec) setSelectedComponentId(depVec.id)
                      }}
                      className="inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <ArrowRight size={8} />
                      {depVec?.componentLabel ?? dep}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cross-module ref */}
          {selectedVector.crossModuleRef && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <ExternalLink size={12} />
              <a href={selectedVector.crossModuleRef} className="hover:underline">
                Related module: {selectedVector.crossModuleRef}
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Migration Timeline ─────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Migration Timeline Overview</div>

        {/* Year axis */}
        <div className="flex items-center pl-44 pr-2 mb-1">
          {Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => {
            const year = TIMELINE_START + i
            // Only show every other year to avoid clutter
            if (year % 2 !== 1 && year !== TIMELINE_START && year !== TIMELINE_END) return null
            return (
              <div
                key={year}
                className="text-[10px] font-mono text-muted-foreground"
                style={{
                  position: 'absolute',
                  left: `calc(176px + ${((year - TIMELINE_START) / TIMELINE_SPAN) * 100}% * (1 - 176px / 100%))`,
                }}
              >
                {year}
              </div>
            )
          })}
          {/* Simpler inline year labels */}
          {[2025, 2027, 2029, 2031, 2033, 2035].map((year) => (
            <div key={year} className="flex-1 text-center">
              <span className="text-[10px] font-mono text-muted-foreground">{year}</span>
            </div>
          ))}
        </div>

        {/* Deadline markers */}
        <div className="flex items-center pl-44 pr-2 mb-2">
          {[
            { year: 2026, label: 'PCI 4.0', color: 'text-status-warning' },
            { year: 2030, label: 'NIST PQC', color: 'text-status-error' },
            { year: 2035, label: 'Full PQC', color: 'text-status-error' },
          ].map((deadline) => (
            <div
              key={deadline.label}
              className="absolute"
              style={{
                left: `calc(176px + ${((deadline.year - TIMELINE_START) / TIMELINE_SPAN) * 100}%)`,
              }}
            >
              <div className={`text-[8px] font-bold ${deadline.color}`}>{deadline.label}</div>
            </div>
          ))}
        </div>

        {/* Component bars */}
        <div className="space-y-1.5">
          {filteredVectors
            .sort(
              (a, b) =>
                SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
                a.migrationEffort - b.migrationEffort
            )
            .map((v) => {
              const { start, end } = parseTimelineRange(v.migrationTimeline)
              const leftPct = ((start - TIMELINE_START) / TIMELINE_SPAN) * 100
              const widthPct = ((end - start) / TIMELINE_SPAN) * 100

              const barColor =
                v.severity === 'critical'
                  ? 'bg-status-error/40'
                  : v.severity === 'high'
                    ? 'bg-status-warning/40'
                    : v.severity === 'medium'
                      ? 'bg-primary/30'
                      : 'bg-muted/50'

              return (
                <Button
                  variant="ghost"
                  key={v.id}
                  onClick={() => setSelectedComponentId(selectedComponentId === v.id ? null : v.id)}
                  className={`flex items-center gap-2 w-full text-left transition-colors rounded ${
                    selectedComponentId === v.id ? 'bg-muted/30' : 'hover:bg-muted/20'
                  }`}
                >
                  <div className="w-40 shrink-0 text-right pr-2">
                    <span className="text-[10px] text-foreground font-medium truncate block">
                      {v.componentLabel}
                    </span>
                  </div>
                  <div className="flex-1 relative h-5 bg-muted/20 rounded border border-border/50">
                    <div
                      className={`absolute top-0 h-full rounded ${barColor}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                    />
                    {v.hndlExposure && (
                      <div
                        className="absolute top-0.5"
                        style={{ left: `${leftPct + widthPct / 2}%` }}
                      >
                        <AlertTriangle size={8} className="text-status-error" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-mono text-foreground font-medium">
                        {v.migrationTimeline}
                      </span>
                    </div>
                  </div>
                </Button>
              )
            })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-border">
          {SEVERITY_Y_ORDER.map((sev) => {
            const barColor =
              sev === 'critical'
                ? 'bg-status-error/40'
                : sev === 'high'
                  ? 'bg-status-warning/40'
                  : sev === 'medium'
                    ? 'bg-primary/30'
                    : 'bg-muted/50'
            return (
              <div key={sev} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${barColor} border border-border`} />
                <span className="text-[10px] text-muted-foreground">{SEVERITY_LABELS[sev]}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-1">
            <AlertTriangle size={10} className="text-status-error" />
            <span className="text-[10px] text-muted-foreground">HNDL Exposed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
