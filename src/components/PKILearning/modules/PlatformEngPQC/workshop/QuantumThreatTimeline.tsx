// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { AlertTriangle, Calendar, Clock, ShieldCheck } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import { HNDL_COLORS, HNDL_LABELS, ALGORITHM_LABELS } from '../data/platformEngConstants'

// CRQC timeline scenarios (years)
const CRQC_SCENARIOS = [
  { id: '2030', label: 'Optimistic: 2030', year: 2030 },
  { id: '2033', label: 'Consensus: 2033', year: 2033 },
  { id: '2035', label: 'Conservative: 2035', year: 2035 },
  { id: '2040', label: 'Pessimistic: 2040', year: 2040 },
]

const CRQC_ITEMS = CRQC_SCENARIOS.map((s) => ({ id: s.id, label: s.label }))

const STAGE_ITEMS = [
  { id: 'All', label: 'All Stages' },
  ...PIPELINE_STAGES.map((s) => ({ id: s.id, label: s.label })),
]

const CURRENT_YEAR = 2026

/** Parse exposure window string → max years (rough) */
function parseExposureYears(window: string): number {
  const match = window.match(/(\d+)(?:–(\d+))? year/)
  if (!match) return 5
  return parseInt(match[2] ?? match[1], 10)
}

export const QuantumThreatTimeline: React.FC = () => {
  const [crqcScenario, setCrqcScenario] = useState('2033')
  const [stageFilter, setStageFilter] = useState('All')

  const crqcYear = CRQC_SCENARIOS.find((s) => s.id === crqcScenario)?.year ?? 2033

  const allAssets = useMemo(() => {
    return PIPELINE_STAGES.flatMap((stage) =>
      stage.cryptoAssets.map((asset) => ({
        ...asset,
        stageName: stage.label,
        stageId: stage.id,
      }))
    )
  }, [])

  const filteredAssets = useMemo(() => {
    return allAssets.filter((a) => {
      if (stageFilter !== 'All' && a.stageId !== stageFilter) return false
      return a.quantumVulnerable
    })
  }, [allAssets, stageFilter])

  const assessedAssets = useMemo(() => {
    return filteredAssets.map((asset) => {
      const exposureYears = parseExposureYears(asset.exposureWindow)
      const dataExpireYear = CURRENT_YEAR + exposureYears
      const atRisk = dataExpireYear > crqcYear
      const yearsUntilCRQC = crqcYear - CURRENT_YEAR
      const migrationUrgency =
        yearsUntilCRQC <= 3 ? 'immediate' : yearsUntilCRQC <= 7 ? 'near-term' : 'planned'
      return { ...asset, exposureYears, dataExpireYear, atRisk, migrationUrgency, yearsUntilCRQC }
    })
  }, [filteredAssets, crqcYear])

  const stats = useMemo(
    () => ({
      atRisk: assessedAssets.filter((a) => a.atRisk).length,
      total: assessedAssets.length,
      immediate: assessedAssets.filter((a) => a.migrationUrgency === 'immediate').length,
    }),
    [assessedAssets]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Quantum Threat Timeline</h3>
        <p className="text-sm text-muted-foreground">
          For each quantum-vulnerable crypto asset in your pipeline, calculate whether the data it
          protects will still need to be kept secret when a CRQC arrives. Assets whose data lifetime
          extends past the CRQC horizon are harvest-now-decrypt-later (HNDL) risks today.
        </p>
      </div>

      {/* Configuration */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span className="text-sm text-foreground font-medium">CRQC Scenario:</span>
          </div>
          <FilterDropdown
            items={CRQC_ITEMS}
            selectedId={crqcScenario}
            onSelect={setCrqcScenario}
            label="CRQC Year"
            defaultLabel="Select scenario"
            defaultIcon={<Calendar size={16} className="text-primary" />}
            noContainer
          />
          <FilterDropdown
            items={STAGE_ITEMS}
            selectedId={stageFilter}
            onSelect={setStageFilter}
            label="Pipeline Stage"
            defaultLabel="All Stages"
            defaultIcon={<Clock size={16} className="text-primary" />}
            noContainer
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            Current year: <strong className="text-foreground">{CURRENT_YEAR}</strong>
          </span>
          <span>
            CRQC horizon: <strong className="text-status-error">{crqcYear}</strong>
          </span>
          <span>
            Time remaining:{' '}
            <strong className="text-foreground">{crqcYear - CURRENT_YEAR} years</strong>
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-error">{stats.atRisk}</div>
          <div className="text-xs text-muted-foreground">HNDL At-Risk Assets</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-warning">{stats.immediate}</div>
          <div className="text-xs text-muted-foreground">Need Immediate Action</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Vulnerable Assets Assessed</div>
        </div>
      </div>

      {/* CRQC timeline bar */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">CRQC Timeline Context</h4>
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          {/* Time to CRQC bar */}
          <div
            className="absolute top-0 left-0 h-full bg-status-error/30 border-r-2 border-status-error"
            style={{ width: `${Math.min(100, ((crqcYear - CURRENT_YEAR) / 20) * 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold">
            <span className="text-foreground">{CURRENT_YEAR}</span>
            <span className="text-status-error">{crqcYear} — CRQC</span>
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-status-error/30 border border-status-error inline-block" />
            Migration window
          </span>
          <span>NSA CNSA 2.0 deadline: 2030 | NIST mandate: 2030</span>
        </div>
      </div>

      {/* Assets Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium">Asset</th>
              <th className="text-left p-2 text-muted-foreground font-medium hidden sm:table-cell">
                Stage
              </th>
              <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
              <th className="text-center p-2 text-muted-foreground font-medium">Data Expires</th>
              <th className="text-center p-2 text-muted-foreground font-medium">HNDL Risk</th>
              <th className="text-left p-2 text-muted-foreground font-medium">PQC Replacement</th>
            </tr>
          </thead>
          <tbody>
            {assessedAssets.map((asset) => (
              <tr
                key={asset.id}
                className={`border-b border-border/50 ${asset.atRisk ? 'bg-status-error/5' : ''}`}
              >
                <td className="p-2">
                  <div className="text-xs font-bold text-foreground">{asset.name}</div>
                  <div className="text-[10px] text-muted-foreground">{asset.exposureWindow}</div>
                </td>
                <td className="p-2 text-xs text-muted-foreground hidden sm:table-cell">
                  {asset.stageName}
                </td>
                <td className="p-2 text-xs font-mono text-foreground">
                  {ALGORITHM_LABELS[asset.algorithm]} {asset.keySize}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`text-xs font-bold ${
                      asset.dataExpireYear > crqcYear ? 'text-status-error' : 'text-status-success'
                    }`}
                  >
                    ~{asset.dataExpireYear}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${HNDL_COLORS[asset.hndlRisk]}`}
                  >
                    {HNDL_LABELS[asset.hndlRisk]}
                  </span>
                </td>
                <td className="p-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck size={12} className="text-status-success shrink-0" />
                    <span className="font-mono text-[10px]">{asset.pqcReplacement}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key insight callout */}
      <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-1">
              Why Short-Lived Certs Don't Eliminate HNDL Risk
            </h4>
            <p className="text-xs text-muted-foreground">
              A Vault mTLS session using ECDH with a 1-hour certificate is still an HNDL target. The
              cert lifetime doesn't matter — what matters is how long the{' '}
              <em>data transmitted in that TLS session</em> must remain secret. A pipeline that
              fetches an API key valid for 10 years creates a 10-year HNDL window, regardless of the
              cert TTL.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
