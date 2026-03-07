// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowUpDown,
  Shield,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { QUANTUM_THREAT_VECTORS } from '../data/attestationData'
import { SEVERITY_COLORS } from '../data/ccConstants'
import type { ThreatSeverity } from '../data/ccConstants'

// ── Helpers ──────────────────────────────────────────────────────────────

type SortKey = 'severity' | 'priority' | 'effort'

const SEVERITY_RANK: Record<ThreatSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const SEVERITY_FILTER_ITEMS = [
  { id: 'All', label: 'All Severities' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

interface VendorTimelineEntry {
  vendor: string
  year: number | null
  label: string
}

function parseVendorTimelines(): VendorTimelineEntry[] {
  const targetVendors = ['Intel', 'ARM', 'AMD', 'AWS']
  const entries: VendorTimelineEntry[] = targetVendors.map((v) => ({
    vendor: v,
    year: null,
    label: '',
  }))

  for (const vector of QUANTUM_THREAT_VECTORS) {
    const parts = vector.vendorTimeline.split(',').map((s) => s.trim())
    for (const part of parts) {
      for (const entry of entries) {
        if (part.startsWith(entry.vendor)) {
          const yearMatch = part.match(/(\d{4})/)
          if (yearMatch && entry.year === null) {
            entry.year = parseInt(yearMatch[1], 10)
            entry.label = part
          } else if (!yearMatch && !entry.label) {
            entry.label = part
          }
        }
      }
    }
  }

  // Fill in defaults for vendors without parsed years
  for (const entry of entries) {
    if (!entry.label) {
      entry.label = `${entry.vendor}: TBD`
    }
  }

  return entries
}

const vendorTimelines = parseVendorTimelines()
const TIMELINE_START = 2025
const TIMELINE_END = 2030
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START

// ── Component ────────────────────────────────────────────────────────────

export const QuantumThreatMigration: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<string>('All')
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filtered & sorted vectors
  const filteredVectors = useMemo(() => {
    let vectors = [...QUANTUM_THREAT_VECTORS]

    if (severityFilter !== 'All') {
      vectors = vectors.filter((v) => v.severity === severityFilter)
    }

    vectors.sort((a, b) => {
      switch (sortKey) {
        case 'severity':
          return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
        case 'priority':
          return a.migrationPriority - b.migrationPriority
        case 'effort':
          return b.migrationEffort - a.migrationEffort
        default:
          return 0
      }
    })

    return vectors
  }, [severityFilter, sortKey])

  // Summary stats
  const stats = useMemo(() => {
    const all = QUANTUM_THREAT_VECTORS
    const criticalCount = all.filter((v) => v.severity === 'critical').length
    const immediateCount = all.filter(
      (v) => v.severity === 'critical' || v.severity === 'high'
    ).length
    const avgEffort =
      all.length > 0
        ? (all.reduce((sum, v) => sum + v.migrationEffort, 0) / all.length).toFixed(1)
        : '0'
    const firstAction = all.reduce(
      (best, v) => (v.migrationPriority < best.migrationPriority ? v : best),
      all[0]
    )
    return { criticalCount, immediateCount, avgEffort, firstAction }
  }, [])

  // HNDL-exposed vectors
  const hndlVectors = useMemo(() => QUANTUM_THREAT_VECTORS.filter((v) => v.hndlExposure), [])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Assess quantum threat vectors targeting confidential computing components and plan a
        prioritized migration to post-quantum cryptography.
      </p>

      {/* ── Threat Vector Table ────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="text-sm font-bold text-foreground">Threat Vector Table</div>
          <div className="flex items-center gap-2">
            <FilterDropdown
              items={SEVERITY_FILTER_ITEMS}
              selectedId={severityFilter}
              onSelect={setSeverityFilter}
              defaultLabel="All Severities"
              defaultIcon={<Target size={16} className="text-primary" />}
              noContainer
            />
          </div>
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted-foreground">Sort by:</span>
          {(
            [
              { key: 'severity', label: 'Severity' },
              { key: 'priority', label: 'Priority' },
              { key: 'effort', label: 'Effort' },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.key}
              variant={sortKey === opt.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortKey(opt.key)}
              className="text-xs h-7 px-2"
            >
              <ArrowUpDown size={10} className="mr-1" />
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium text-xs">Name</th>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">
                  Component
                </th>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden md:table-cell">
                  Current Crypto
                </th>
                <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                  Severity
                </th>
                <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                  Priority
                </th>
                <th className="text-center p-2 text-muted-foreground font-medium text-xs">HNDL</th>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden lg:table-cell">
                  PQC Solution
                </th>
                <th className="p-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredVectors.map((vector) => {
                const isExpanded = expandedId === vector.id
                return (
                  <React.Fragment key={vector.id}>
                    <tr
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(vector.id)}
                    >
                      <td className="p-2 text-xs font-medium text-foreground">{vector.name}</td>
                      <td className="p-2 text-xs text-muted-foreground hidden sm:table-cell">
                        {vector.component}
                      </td>
                      <td className="p-2 text-[10px] text-muted-foreground hidden md:table-cell font-mono">
                        {vector.currentCrypto.length > 50
                          ? vector.currentCrypto.slice(0, 50) + '...'
                          : vector.currentCrypto}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${SEVERITY_COLORS[vector.severity]}`}
                        >
                          {vector.severity}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-xs font-mono font-bold text-foreground">
                          #{vector.migrationPriority}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {vector.hndlExposure ? (
                          <Eye size={14} className="text-status-error mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="p-2 text-[10px] text-muted-foreground hidden lg:table-cell">
                        {vector.pqcSolution.length > 60
                          ? vector.pqcSolution.slice(0, 60) + '...'
                          : vector.pqcSolution}
                      </td>
                      <td className="p-2">
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={14} className="text-muted-foreground" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="border-b border-border/30">
                        <td colSpan={8} className="p-3 bg-muted/20">
                          <div className="space-y-2">
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Vulnerability
                              </div>
                              <p className="text-xs text-foreground">{vector.vulnerability}</p>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                PQC Solution
                              </div>
                              <p className="text-xs text-foreground">{vector.pqcSolution}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                  Vendor Timeline
                                </div>
                                <p className="text-xs text-foreground">{vector.vendorTimeline}</p>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                  Migration Effort
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-3 h-3 rounded-sm ${
                                        i < vector.migrationEffort
                                          ? 'bg-status-warning'
                                          : 'bg-muted'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    {vector.migrationEffort}/5
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Migration Priority Matrix ─────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Migration Priority Matrix</div>
        <div className="relative border border-border rounded-lg overflow-hidden">
          {/* 2x2 grid */}
          <div className="grid grid-cols-2 min-h-[280px]">
            {/* Top-left: Migrate Now (high severity, low effort) */}
            <div className="bg-status-error/10 border-r border-b border-border p-3 relative">
              <span className="text-[10px] font-bold text-status-error">Migrate Now</span>
              <p className="text-[9px] text-muted-foreground">High severity, low effort</p>
              {QUANTUM_THREAT_VECTORS.filter(
                (v) => SEVERITY_RANK[v.severity] >= 3 && v.migrationEffort <= 3
              ).map((v) => (
                <div
                  key={v.id}
                  className="mt-1.5 inline-flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5 border border-border mr-1"
                >
                  <div className="w-2 h-2 rounded-full bg-status-error" />
                  <span className="text-[9px] text-foreground font-medium">
                    {v.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                </div>
              ))}
            </div>

            {/* Top-right: Plan Carefully (high severity, high effort) */}
            <div className="bg-status-warning/10 border-b border-border p-3 relative">
              <span className="text-[10px] font-bold text-status-warning">Plan Carefully</span>
              <p className="text-[9px] text-muted-foreground">High severity, high effort</p>
              {QUANTUM_THREAT_VECTORS.filter(
                (v) => SEVERITY_RANK[v.severity] >= 3 && v.migrationEffort > 3
              ).map((v) => (
                <div
                  key={v.id}
                  className="mt-1.5 inline-flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5 border border-border mr-1"
                >
                  <div className="w-2 h-2 rounded-full bg-status-warning" />
                  <span className="text-[9px] text-foreground font-medium">
                    {v.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom-left: Schedule (low severity, low effort) */}
            <div className="bg-muted/30 border-r border-border p-3 relative">
              <span className="text-[10px] font-bold text-muted-foreground">Schedule</span>
              <p className="text-[9px] text-muted-foreground">Low severity, low effort</p>
              {QUANTUM_THREAT_VECTORS.filter(
                (v) => SEVERITY_RANK[v.severity] < 3 && v.migrationEffort <= 3
              ).map((v) => (
                <div
                  key={v.id}
                  className="mt-1.5 inline-flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5 border border-border mr-1"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[9px] text-foreground font-medium">
                    {v.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom-right: Monitor (low severity, high effort) */}
            <div className="bg-muted/30 p-3 relative">
              <span className="text-[10px] font-bold text-muted-foreground">Monitor</span>
              <p className="text-[9px] text-muted-foreground">Low severity, high effort</p>
              {QUANTUM_THREAT_VECTORS.filter(
                (v) => SEVERITY_RANK[v.severity] < 3 && v.migrationEffort > 3
              ).map((v) => (
                <div
                  key={v.id}
                  className="mt-1.5 inline-flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5 border border-border mr-1"
                >
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-[9px] text-foreground font-medium">
                    {v.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Axis labels */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground pointer-events-none">
            Migration Effort →
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-muted-foreground pointer-events-none">
            Severity →
          </div>
        </div>
      </div>

      {/* ── Vendor PQC Timeline ───────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Vendor PQC Timeline</div>
        <div className="space-y-3">
          {/* Year axis */}
          <div className="flex items-center pl-20 pr-2">
            {Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {TIMELINE_START + i}
                </span>
              </div>
            ))}
          </div>

          {/* Vendor bars */}
          {vendorTimelines.map((entry) => {
            const readyYear = entry.year
            const currentYear = 2026
            const planStart = ((currentYear - TIMELINE_START) / TIMELINE_SPAN) * 100
            const planEnd = readyYear ? ((readyYear - TIMELINE_START) / TIMELINE_SPAN) * 100 : 100
            const readyEnd = readyYear
              ? ((Math.min(readyYear + 1, TIMELINE_END) - TIMELINE_START) / TIMELINE_SPAN) * 100
              : 0

            return (
              <div key={entry.vendor} className="flex items-center gap-2">
                <div className="w-16 text-xs font-medium text-foreground text-right shrink-0">
                  {entry.vendor}
                </div>
                <div className="flex-1 relative h-6 bg-muted/30 rounded border border-border">
                  {/* Planned period */}
                  <div
                    className="absolute top-0 h-full bg-status-warning/30 rounded-l"
                    style={{
                      left: `${planStart}%`,
                      width: `${Math.max(0, planEnd - planStart)}%`,
                    }}
                  />
                  {/* Ready period */}
                  {readyYear && readyYear <= TIMELINE_END && (
                    <div
                      className="absolute top-0 h-full bg-status-success/30 rounded-r"
                      style={{
                        left: `${planEnd}%`,
                        width: `${Math.max(0, readyEnd - planEnd)}%`,
                      }}
                    />
                  )}
                  {/* Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-medium text-foreground">
                      {readyYear ? `PQC ready ~${readyYear}` : 'TBD'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Legend */}
          <div className="flex items-center gap-4 pl-20 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-status-warning/30 border border-status-warning/50" />
              <span className="text-[10px] text-muted-foreground">Planned</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-status-success/30 border border-status-success/50" />
              <span className="text-[10px] text-muted-foreground">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HNDL Exposure Summary ─────────────────────────────────── */}
      <div className="glass-panel p-4 bg-status-error/10 border-status-error/20">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground">
              HNDL Exposure: {hndlVectors.length} Vulnerable Component
              {hndlVectors.length !== 1 ? 's' : ''}
            </div>
            <ul className="mt-1 space-y-0.5">
              {hndlVectors.map((v) => (
                <li key={v.id} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Eye size={10} className="text-status-error shrink-0" />
                  <span className="font-medium">{v.component}</span>
                  <span className="text-muted-foreground">({v.currentCrypto.split(' (')[0]})</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              These components generate data that can be recorded now and decrypted later when a
              CRQC is available. Prioritize PQC migration for these vectors to close the
              harvest-now-decrypt-later window.
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Report Card ───────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary" />
          <div className="text-sm font-bold text-foreground">Summary Report Card</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-muted/30 rounded-lg border border-border">
            <div className="text-lg font-bold text-status-error">{stats.criticalCount}</div>
            <div className="text-[10px] text-muted-foreground">Critical Vulnerabilities</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg border border-border">
            <div className="text-lg font-bold text-status-warning">{stats.immediateCount}</div>
            <div className="text-[10px] text-muted-foreground">Need Immediate Migration</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg border border-border">
            <div className="text-lg font-bold text-foreground">{stats.avgEffort}/5</div>
            <div className="text-[10px] text-muted-foreground">Avg Migration Effort</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg border border-border">
            <div className="text-lg font-bold text-primary">#1</div>
            <div className="text-[10px] text-muted-foreground">First Action</div>
          </div>
        </div>
        {stats.firstAction && (
          <div className="mt-3 bg-muted/20 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Recommended First Action
            </div>
            <p className="text-xs text-foreground font-medium">{stats.firstAction.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {stats.firstAction.pqcSolution}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
