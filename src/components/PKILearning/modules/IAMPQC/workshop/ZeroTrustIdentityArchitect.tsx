// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Shield, Calendar, ArrowRight, Download, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  ZERO_TRUST_LAYERS,
  ZERO_TRUST_MIGRATION_YEARS,
  type MigrationYear,
  type HNDLRisk,
} from '../data/iamConstants'

const RISK_STYLES: Record<HNDLRisk, { badge: string; label: string }> = {
  critical: {
    badge: 'bg-status-error/10 text-status-error border-status-error/30',
    label: 'Critical',
  },
  high: { badge: 'bg-warning/10 text-warning border-warning/30', label: 'High' },
  medium: { badge: 'bg-primary/10 text-primary border-primary/30', label: 'Medium' },
  low: { badge: 'bg-status-success/10 text-status-success border-status-success/30', label: 'Low' },
}

const COMPLEXITY_STYLES = {
  high: 'text-status-error',
  medium: 'text-warning',
  low: 'text-status-success',
}

const YEAR_OPTIONS = ZERO_TRUST_MIGRATION_YEARS.map((y) => ({ id: y, label: y }))

const YEAR_COLORS: Record<MigrationYear, string> = {
  '2025': 'bg-status-error/10 text-status-error border-status-error/30',
  '2026': 'bg-warning/10 text-warning border-warning/30',
  '2027': 'bg-primary/10 text-primary border-primary/30',
  '2028': 'bg-status-success/10 text-status-success border-status-success/30',
}

type PillarMigrations = Record<string, MigrationYear>

const DEFAULT_MIGRATIONS: PillarMigrations = {
  'identity-verification': '2026',
  'device-trust': '2027',
  'session-management': '2026',
  authorization: '2026',
  audit: '2027',
}

export const ZeroTrustIdentityArchitect: React.FC = () => {
  const [migrations, setMigrations] = useState<PillarMigrations>(DEFAULT_MIGRATIONS)
  const [showRoadmap, setShowRoadmap] = useState(false)

  const handleSetYear = (pillarId: string, year: string) => {
    if (year === 'All') return
    setMigrations((prev) => ({ ...prev, [pillarId]: year as MigrationYear }))
  }

  const roadmap = useMemo(() => {
    const byYear: Record<MigrationYear, typeof ZERO_TRUST_LAYERS> = {
      '2025': [],
      '2026': [],
      '2027': [],
      '2028': [],
    }
    ZERO_TRUST_LAYERS.forEach((layer) => {
      const year = migrations[layer.id]
      if (year) byYear[year].push(layer)
    })
    return byYear
  }, [migrations])

  const summaryStats = useMemo(() => {
    const counts: Record<MigrationYear, number> = { '2025': 0, '2026': 0, '2027': 0, '2028': 0 }
    Object.values(migrations).forEach((year) => {
      counts[year]++
    })
    return counts
  }, [migrations])

  const handleExport = () => {
    const lines = [
      'PQC Zero Trust Identity Migration Roadmap',
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      '',
    ]
    ZERO_TRUST_MIGRATION_YEARS.forEach((year) => {
      const items = roadmap[year]
      if (items.length === 0) return
      lines.push(`=== ${year} ===`)
      items.forEach((layer) => {
        lines.push(`  ${layer.name} (${layer.pillar} Pillar)`)
        lines.push(`    Current: ${layer.currentCrypto}`)
        lines.push(`    PQC Approach: ${layer.pqcApproach}`)
        lines.push(`    Complexity: ${layer.migrationComplexity}`)
        lines.push('')
      })
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zt-pqc-roadmap-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Zero Trust Identity Architect</h3>
        <p className="text-sm text-muted-foreground">
          Design a PQC migration roadmap across the five zero trust identity pillars. Assign a
          migration year to each pillar, then generate a phased roadmap summary.
        </p>
      </div>

      {/* Summary Timeline Bar */}
      <div className="glass-panel p-4">
        <div className="text-xs font-bold text-foreground mb-3">Migration Timeline Overview</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ZERO_TRUST_MIGRATION_YEARS.map((year) => (
            <div
              key={year}
              className={`rounded-lg p-3 border text-center transition-all ${
                summaryStats[year] > 0 ? YEAR_COLORS[year] : 'bg-muted/30 border-border opacity-50'
              }`}
            >
              <div className="text-lg font-bold">{summaryStats[year]}</div>
              <div className="text-[10px]">{year}</div>
              <div className="text-[9px] opacity-75">
                pillar{summaryStats[year] !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pillar Cards */}
      <div className="space-y-4">
        {ZERO_TRUST_LAYERS.map((layer) => {
          const riskStyle = RISK_STYLES[layer.quantumRisk]
          const complexityStyle = COMPLEXITY_STYLES[layer.migrationComplexity]
          const selectedYear = migrations[layer.id]
          const yearColor = YEAR_COLORS[selectedYear]

          return (
            <div key={layer.id} className="glass-panel p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Layer Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-foreground">{layer.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {layer.pillar} Pillar
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${riskStyle.badge}`}
                        >
                          {riskStyle.label} Risk
                        </span>
                        <span className={`text-[10px] font-medium ${complexityStyle}`}>
                          {layer.migrationComplexity.charAt(0).toUpperCase() +
                            layer.migrationComplexity.slice(1)}{' '}
                          complexity
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{layer.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <div className="text-[10px] font-bold text-status-error mb-1">
                        Current Crypto (Vulnerable)
                      </div>
                      <code className="text-[10px] text-muted-foreground font-mono">
                        {layer.currentCrypto}
                      </code>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 border border-primary/20">
                      <div className="text-[10px] font-bold text-primary mb-1">PQC Approach</div>
                      <p className="text-[10px] text-muted-foreground">{layer.pqcApproach}</p>
                    </div>
                  </div>
                </div>

                {/* Year Selector */}
                <div className="lg:w-48 shrink-0 flex flex-col gap-2">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" />
                    Migration Year
                  </div>
                  <FilterDropdown
                    items={YEAR_OPTIONS}
                    selectedId={selectedYear}
                    onSelect={(id) => handleSetYear(layer.id, id)}
                    defaultLabel="Select Year"
                    noContainer
                  />
                  <div
                    className={`text-[10px] px-2 py-1 rounded border text-center font-bold ${yearColor}`}
                  >
                    {selectedYear}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="gradient"
          onClick={() => setShowRoadmap((p) => !p)}
          className="flex items-center gap-2"
        >
          <ArrowRight size={14} aria-hidden="true" />
          {showRoadmap ? 'Hide Roadmap' : 'Generate Roadmap'}
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2 text-sm"
        >
          <Download size={14} aria-hidden="true" />
          Export Roadmap
        </Button>
      </div>

      {/* Roadmap Output */}
      {showRoadmap && (
        <div className="glass-panel p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground">
            PQC Zero Trust Identity Migration Roadmap
          </h4>
          {ZERO_TRUST_MIGRATION_YEARS.map((year) => {
            const items = roadmap[year]
            if (items.length === 0) return null
            return (
              <div key={year} className={`rounded-lg p-4 border ${YEAR_COLORS[year]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} aria-hidden="true" />
                  <span className="text-sm font-bold">
                    {year} — {items.length} pillar migration{items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((layer) => (
                    <div
                      key={layer.id}
                      className="bg-background/50 rounded-lg p-3 border border-current/20"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        <span className="text-xs font-bold">{layer.name}</span>
                        <span className="text-[10px] opacity-75">({layer.pillar} Pillar)</span>
                      </div>
                      <p className="text-[10px] opacity-80 ml-5">{layer.pqcApproach}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Key Principles */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">Design Principles</div>
            <ul className="text-[10px] text-muted-foreground space-y-1">
              <li>
                &bull; Prioritize pillars with Critical/High risk and long migration lead times
              </li>
              <li>
                &bull; Device Trust has the longest hardware replacement cycle (5-7 years) — plan
                before 2026
              </li>
              <li>
                &bull; Session Management (hybrid TLS) can begin immediately with no app changes
              </li>
              <li>
                &bull; Use hybrid (classical + PQC) for all pillars during transition; pure PQC
                after 2028
              </li>
              <li>
                &bull; Validate each pillar with Continuous Access Evaluation (CAE) before moving to
                next phase
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
