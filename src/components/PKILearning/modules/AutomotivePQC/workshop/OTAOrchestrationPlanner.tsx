// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  Radio,
  ArrowRight,
  Clock,
  HardDrive,
  Wifi,
  Shield,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Users,
} from 'lucide-react'
import { ASIL_COLORS, ASIL_LABELS, UPDATE_STRATEGY_LABELS } from '../data/automotiveConstants'
import {
  DEFAULT_CAMPAIGN_TARGETS,
  SIGNATURE_OVERHEADS,
  computeCampaignMetrics,
} from '../data/otaOrchestrationData'
import type { OTACampaignTarget } from '../data/otaOrchestrationData'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute dependency depth for each ECU (0 = no dependencies) */
function computeDepthMap(targets: OTACampaignTarget[]): Map<string, number> {
  const targetMap = new Map(targets.map((t) => [t.ecuId, t]))
  const depthMap = new Map<string, number>()

  function getDepth(ecuId: string): number {
    if (depthMap.has(ecuId)) return depthMap.get(ecuId)!
    const target = targetMap.get(ecuId)
    if (!target || target.dependencies.length === 0) {
      depthMap.set(ecuId, 0)
      return 0
    }
    const maxDep = Math.max(...target.dependencies.map((d) => getDepth(d)))
    const depth = maxDep + 1
    depthMap.set(ecuId, depth)
    return depth
  }

  for (const t of targets) {
    getDepth(t.ecuId)
  }
  return depthMap
}

/** Find the critical path — the longest chain by cumulative update time */
function findCriticalPath(targets: OTACampaignTarget[]): string[] {
  const targetMap = new Map(targets.map((t) => [t.ecuId, t]))

  function longestPath(ecuId: string): string[] {
    const target = targetMap.get(ecuId)
    if (!target) return []
    if (target.dependencies.length === 0) return [ecuId]
    let best: string[] = []
    let bestTime = 0
    for (const depId of target.dependencies) {
      const depPath = longestPath(depId)
      const depTime = depPath.reduce((s, id) => s + (targetMap.get(id)?.updateTimeMinutes ?? 0), 0)
      if (depTime > bestTime) {
        bestTime = depTime
        best = depPath
      }
    }
    return [...best, ecuId]
  }

  let criticalPath: string[] = []
  let criticalTime = 0
  for (const t of targets) {
    const path = longestPath(t.ecuId)
    const time = path.reduce((s, id) => s + (targetMap.get(id)?.updateTimeMinutes ?? 0), 0)
    if (time > criticalTime) {
      criticalTime = time
      criticalPath = path
    }
  }
  return criticalPath
}

/** Format large numbers with locale grouping */
function formatNumber(n: number): string {
  return n.toLocaleString()
}

/** Logarithmic slider helpers (1,000 to 10,000,000) */
const LOG_MIN = Math.log10(1_000)
const LOG_MAX = Math.log10(10_000_000)

function fleetToSlider(fleet: number): number {
  return ((Math.log10(fleet) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100
}

function sliderToFleet(pct: number): number {
  const logVal = LOG_MIN + (pct / 100) * (LOG_MAX - LOG_MIN)
  return Math.round(Math.pow(10, logVal))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OTAOrchestrationPlanner: React.FC = () => {
  const [fleetSize, setFleetSize] = useState(100_000)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('ML-DSA-65')

  const targets = DEFAULT_CAMPAIGN_TARGETS

  const selectedOverhead = useMemo(
    () =>
      SIGNATURE_OVERHEADS.find((s) => s.algorithm === selectedAlgorithm) ?? SIGNATURE_OVERHEADS[3],
    [selectedAlgorithm]
  )

  const metrics = useMemo(
    () => computeCampaignMetrics(targets, fleetSize, selectedOverhead),
    [targets, fleetSize, selectedOverhead]
  )

  const depthMap = useMemo(() => computeDepthMap(targets), [targets])
  const criticalPath = useMemo(() => findCriticalPath(targets), [targets])
  const criticalPathSet = useMemo(() => new Set(criticalPath), [criticalPath])
  const maxDepth = useMemo(() => Math.max(...Array.from(depthMap.values())), [depthMap])

  /** ECUs grouped by dependency depth */
  const layers = useMemo(() => {
    const grouped: OTACampaignTarget[][] = []
    for (let d = 0; d <= maxDepth; d++) {
      grouped.push(targets.filter((t) => depthMap.get(t.ecuId) === d))
    }
    return grouped
  }, [targets, depthMap, maxDepth])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFleetSize(sliderToFleet(Number(e.target.value)))
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Plan a multi-ECU OTA firmware campaign. Adjust fleet size and signature algorithm to see how
        PQC signature overhead affects bandwidth and campaign duration across the dependency graph.
      </p>

      {/* ── Fleet Size Slider ─────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Fleet Size</span>
          <span className="ml-auto text-lg font-mono font-bold text-primary">
            {formatNumber(fleetSize)} vehicles
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={fleetToSlider(fleetSize)}
          onChange={handleSliderChange}
          className="w-full accent-[hsl(var(--primary))] h-2 rounded-lg appearance-none bg-muted cursor-pointer"
          aria-label="Fleet size"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>1,000</span>
          <span>10,000</span>
          <span>100,000</span>
          <span>1,000,000</span>
          <span>10,000,000</span>
        </div>
      </div>

      {/* ── Algorithm Selector ────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Signature Algorithm</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SIGNATURE_OVERHEADS.map((overhead) => {
            const isSelected = overhead.algorithm === selectedAlgorithm
            const isPQC = !['ECDSA P-256', 'RSA-2048'].includes(overhead.algorithm)
            return (
              <Button
                variant="ghost"
                key={overhead.algorithm}
                onClick={() => setSelectedAlgorithm(overhead.algorithm)}
                className={`rounded-lg p-3 border text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-muted/20 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isPQC && <Shield size={10} className="text-status-success shrink-0" />}
                  <span className="text-xs font-bold text-foreground">{overhead.algorithm}</span>
                </div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>
                    Sig:{' '}
                    <span className="font-mono text-foreground">
                      {formatNumber(overhead.signatureBytes)} B
                    </span>
                  </div>
                  <div>
                    Key:{' '}
                    <span className="font-mono text-foreground">
                      {formatNumber(overhead.publicKeyBytes)} B
                    </span>
                  </div>
                  <div>
                    Overhead:{' '}
                    <span className="font-mono text-foreground">{overhead.totalOverheadKB} KB</span>
                    /pkg
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* ── ECU Target Cards ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">ECU Campaign Targets</span>
          <span className="ml-auto text-xs text-muted-foreground">{targets.length} ECUs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {targets.map((ecu) => {
            const isOnCriticalPath = criticalPathSet.has(ecu.ecuId)
            return (
              <div
                key={ecu.ecuId}
                className={`rounded-lg p-3 border transition-colors ${
                  isOnCriticalPath
                    ? 'border-status-error/40 bg-status-error/5'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{ecu.ecuName}</span>
                  <span
                    className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${ASIL_COLORS[ecu.asilLevel]}`}
                  >
                    {ASIL_LABELS[ecu.asilLevel]}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Zone</span>
                    <span className="font-medium text-foreground">{ecu.zone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Firmware</span>
                    <span className="font-mono text-foreground">{ecu.firmwareSizeMB} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Strategy</span>
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-foreground border border-border">
                      {UPDATE_STRATEGY_LABELS[ecu.updateStrategy]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Update Time</span>
                    <span className="font-mono text-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {ecu.updateTimeMinutes} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rollback</span>
                    {ecu.rollbackSupported ? (
                      <span className="flex items-center gap-1 text-status-success font-medium">
                        <RotateCcw size={10} />
                        Supported
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-status-warning font-medium">
                        <AlertTriangle size={10} />
                        No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dependencies</span>
                    <span className="text-foreground">
                      {ecu.dependencies.length === 0 ? (
                        <span className="text-muted-foreground italic">None</span>
                      ) : (
                        ecu.dependencies
                          .map((d) => targets.find((t) => t.ecuId === d)?.ecuName ?? d)
                          .join(', ')
                      )}
                    </span>
                  </div>
                </div>

                {isOnCriticalPath && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-status-error">
                    <AlertTriangle size={10} />
                    Critical Path
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Dependency Graph ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Update Dependency Graph</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          ECUs are arranged in columns by dependency depth. Column 0 has no dependencies and updates
          first. ECUs in the same column can update in parallel. The critical path (longest
          sequential chain) is highlighted.
        </p>

        {/* Layered graph */}
        <div className="overflow-x-auto">
          <div className="flex items-start gap-2 min-w-0 md:min-w-[500px]">
            {layers.map((layer, depth) => (
              <React.Fragment key={depth}>
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  {/* Column header */}
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    {depth === 0 ? 'Root' : `Depth ${depth}`}
                  </div>

                  {/* ECU nodes */}
                  {layer.map((ecu) => {
                    const isOnCritical = criticalPathSet.has(ecu.ecuId)
                    return (
                      <div
                        key={ecu.ecuId}
                        className={`w-full rounded-lg p-2 border text-center transition-colors ${
                          isOnCritical
                            ? 'border-status-error/50 bg-status-error/10 shadow-[0_0_8px_hsl(var(--status-error)/0.15)]'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        <div className="text-xs font-bold text-foreground">{ecu.ecuName}</div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span
                            className={`text-[9px] font-bold rounded px-1 py-0 border ${ASIL_COLORS[ecu.asilLevel]}`}
                          >
                            {ecu.asilLevel}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {ecu.updateTimeMinutes}m
                          </span>
                        </div>
                        {ecu.dependencies.length > 0 && (
                          <div className="text-[9px] text-muted-foreground mt-1">
                            needs: {ecu.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Parallel indicator */}
                  {layer.length > 1 && (
                    <div className="text-[9px] text-status-success font-medium flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Parallel
                    </div>
                  )}
                </div>

                {/* Arrow between columns */}
                {depth < maxDepth && (
                  <div className="flex items-center self-center pt-6">
                    <div className="w-6 h-0.5 bg-border" />
                    <ArrowRight size={14} className="text-muted-foreground -ml-1" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Critical path callout */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Critical Path (longest sequential chain)
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {criticalPath.map((ecuId, idx) => {
              const ecu = targets.find((t) => t.ecuId === ecuId)
              return (
                <React.Fragment key={ecuId}>
                  <span className="inline-flex items-center gap-1 text-xs font-medium rounded px-2 py-1 border border-status-error/30 bg-status-error/10 text-foreground">
                    {ecu?.ecuName ?? ecuId}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({ecu?.updateTimeMinutes}m)
                    </span>
                  </span>
                  {idx < criticalPath.length - 1 && (
                    <ArrowRight size={12} className="text-status-error shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
            <span className="ml-2 text-xs font-mono font-bold text-status-error">
              = {metrics.criticalPathMinutes} min total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-status-error/50 bg-status-error/10" />
            <span className="text-[10px] text-muted-foreground">Critical Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-border bg-muted/20" />
            <span className="text-[10px] text-muted-foreground">Parallel Update</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={10} className="text-status-success" />
            <span className="text-[10px] text-muted-foreground">Can run simultaneously</span>
          </div>
        </div>
      </div>

      {/* ── Campaign Metrics Panel ────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wifi size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Campaign Metrics</span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {selectedOverhead.algorithm} &middot; {formatNumber(fleetSize)} vehicles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total firmware */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Firmware
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              {metrics.totalFirmwareSizeMB}
            </div>
            <div className="text-[10px] text-muted-foreground">MB</div>
          </div>

          {/* Signature overhead */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Sig Overhead
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              {metrics.signatureOverheadMB < 1
                ? `${(metrics.signatureOverheadMB * 1024).toFixed(1)} KB`
                : `${metrics.signatureOverheadMB.toFixed(2)} MB`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {((metrics.signatureOverheadMB / metrics.totalFirmwareSizeMB) * 100).toFixed(3)}% of
              firmware
            </div>
          </div>

          {/* Bandwidth per vehicle */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Per Vehicle
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              {(metrics.totalFirmwareSizeMB + metrics.signatureOverheadMB).toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">MB</div>
          </div>

          {/* Total fleet bandwidth */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Fleet Bandwidth
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              {metrics.totalBandwidthGB >= 1024
                ? `${(metrics.totalBandwidthGB / 1024).toFixed(1)}`
                : metrics.totalBandwidthGB.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {metrics.totalBandwidthGB >= 1024 ? 'TB' : 'GB'}
            </div>
          </div>

          {/* Campaign duration */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              CDN Duration
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              {metrics.maxDurationHours < 1
                ? `${(metrics.maxDurationHours * 60).toFixed(1)} min`
                : metrics.maxDurationHours < 24
                  ? `${metrics.maxDurationHours.toFixed(1)} hr`
                  : `${(metrics.maxDurationHours / 24).toFixed(1)} days`}
            </div>
            <div className="text-[10px] text-muted-foreground">@ 10 Gbps CDN, 60% util</div>
          </div>

          {/* Critical path time */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Critical Path
            </div>
            <div className="text-lg font-mono font-bold text-status-error mt-1">
              {metrics.criticalPathMinutes}
            </div>
            <div className="text-[10px] text-muted-foreground">minutes (sequential)</div>
          </div>
        </div>

        {/* Algorithm comparison bar */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Signature Overhead Comparison (per ECU package)
          </div>
          <div className="space-y-1.5">
            {SIGNATURE_OVERHEADS.map((overhead) => {
              const maxOverhead = Math.max(...SIGNATURE_OVERHEADS.map((o) => o.totalOverheadKB))
              const widthPct = (overhead.totalOverheadKB / maxOverhead) * 100
              const isSelected = overhead.algorithm === selectedAlgorithm
              return (
                <div key={overhead.algorithm} className="flex items-center gap-2">
                  <div className="w-24 shrink-0 text-right">
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-primary font-bold' : 'text-foreground'
                      }`}
                    >
                      {overhead.algorithm}
                    </span>
                  </div>
                  <div className="flex-1 h-4 bg-muted/30 rounded border border-border/50 relative">
                    <div
                      className={`h-full rounded transition-all ${
                        isSelected ? 'bg-primary/40' : 'bg-muted'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-foreground">
                      {overhead.totalOverheadKB} KB
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
