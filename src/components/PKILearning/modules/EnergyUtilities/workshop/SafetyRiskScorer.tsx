// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { AlertTriangle, Shield, Leaf, Users, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ENERGY_SCENARIOS, computeSafetyRisk } from '../data/safetyRiskData'
import type { EnergyAssetScenario } from '../data/safetyRiskData'
import type {
  SafetyRiskResult,
  PhysicalConsequence,
  EnvironmentalSeverity,
  EnvironmentalZone,
  AssetCriticality,
} from '../data/energyConstants'
import { FilterDropdown } from '@/components/common/FilterDropdown'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface SafetyRiskScorerProps {
  riskResults: SafetyRiskResult[]
  onRiskResultsChange: (r: SafetyRiskResult[]) => void
  onComplete: () => void
}

const PHYSICAL_OPTIONS: { value: PhysicalConsequence; label: string }[] = [
  { value: 'catastrophic', label: 'Catastrophic' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'minor', label: 'Minor' },
]

const ENVIRONMENTAL_SEVERITY_OPTIONS: { value: EnvironmentalSeverity; label: string }[] = [
  { value: 'severe', label: 'Severe' },
  { value: 'significant', label: 'Significant' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'minor', label: 'Minor' },
  { value: 'none', label: 'None' },
]

const ZONE_OPTIONS: { value: EnvironmentalZone; label: string }[] = [
  { value: 'protected-ecosystem', label: 'Protected Ecosystem' },
  { value: 'urban', label: 'Urban' },
  { value: 'suburban', label: 'Suburban' },
  { value: 'rural', label: 'Rural' },
  { value: 'industrial', label: 'Industrial' },
]

const CRITICALITY_OPTIONS: { value: AssetCriticality; label: string }[] = [
  { value: 'tier-1', label: 'Tier 1 (Highest)' },
  { value: 'tier-2', label: 'Tier 2' },
  { value: 'tier-3', label: 'Tier 3' },
]

function riskLevelColor(level: SafetyRiskResult['riskLevel']) {
  switch (level) {
    case 'critical':
      return {
        text: 'text-status-error',
        bg: 'bg-status-error/10',
        border: 'border-status-error/30',
      }
    case 'high':
      return {
        text: 'text-status-warning',
        bg: 'bg-status-warning/10',
        border: 'border-status-warning/30',
      }
    case 'medium':
      return { text: 'text-status-info', bg: 'bg-status-info/10', border: 'border-status-info/30' }
    case 'low':
      return {
        text: 'text-status-success',
        bg: 'bg-status-success/10',
        border: 'border-status-success/30',
      }
  }
}

function threatBadge(threat: 'HNDL' | 'real-time' | 'both') {
  switch (threat) {
    case 'HNDL':
      return { label: 'HNDL', cls: 'bg-status-warning/20 text-status-warning' }
    case 'real-time':
      return { label: 'Real-time', cls: 'bg-status-error/20 text-status-error' }
    case 'both':
      return { label: 'HNDL + Real-time', cls: 'bg-status-error/20 text-status-error' }
  }
}

// ---------------------------------------------------------------------------
// Dropdown helper
// ---------------------------------------------------------------------------

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <FilterDropdown
        noContainer
        selectedId={value}
        onSelect={(id) => onChange(id as T)}
        items={options.map((o) => ({ id: o.value, label: o.label }))}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score breakdown component
// ---------------------------------------------------------------------------

function ScoreBreakdownBar({
  label,
  value,
  weight,
  maxValue,
}: {
  label: string
  value: number
  weight: string
  maxValue: number
}) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {label} <span className="text-foreground/50">({weight})</span>
        </span>
        <span className="font-mono text-foreground">{value}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary/70 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comparison panel
// ---------------------------------------------------------------------------

function ComparisonPanel({
  leftResult,
  rightResult,
  leftScenario,
  rightScenario,
}: {
  leftResult: SafetyRiskResult
  rightResult: SafetyRiskResult
  leftScenario: EnergyAssetScenario
  rightScenario: EnergyAssetScenario
}) {
  const sides = [
    { result: leftResult, scenario: leftScenario },
    { result: rightResult, scenario: rightScenario },
  ] as const

  return (
    <div className="glass-panel p-4">
      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        Scenario Comparison
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sides.map(({ result, scenario }) => {
          const colors = riskLevelColor(result.riskLevel)
          return (
            <div
              key={result.scenarioId}
              className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
            >
              <p className="text-sm font-bold text-foreground mb-1">{scenario.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{scenario.assetType}</p>
              <div
                className={`text-3xl font-bold text-center py-3 rounded-lg ${colors.text} ${colors.bg}`}
              >
                {result.compoundRiskScore}
                <span className="text-xs font-normal block mt-1">/100</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Safety (40%)</span>
                  <span className="text-foreground font-mono">{result.safetyScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Environmental (20%)</span>
                  <span className="text-foreground font-mono">{result.environmentalScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">HNDL (20%)</span>
                  <span className="text-foreground font-mono">{result.hndlScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Compliance (20%)</span>
                  <span className="text-foreground font-mono">{result.compliancePenalty}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.text} ${colors.bg}`}
                >
                  {result.riskLevel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const SafetyRiskScorer: React.FC<SafetyRiskScorerProps> = ({
  riskResults,
  onRiskResultsChange,
  onComplete,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareId, setCompareId] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)

  // Override state per scenario
  const [overrides, setOverrides] = useState<
    Record<
      string,
      {
        physicalConsequence: PhysicalConsequence
        environmentalSeverity: EnvironmentalSeverity
        environmentalZone: EnvironmentalZone
        populationExposure: number
        assetCriticality: AssetCriticality
      }
    >
  >({})

  const selectedScenario = useMemo(
    () => ENERGY_SCENARIOS.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  )

  const compareScenario = useMemo(
    () => ENERGY_SCENARIOS.find((s) => s.id === compareId) ?? null,
    [compareId]
  )

  // Get or initialize overrides for a scenario
  function getOverrides(scenario: EnergyAssetScenario) {
    const existing = overrides[scenario.id]
    if (existing) return existing
    return {
      physicalConsequence: scenario.defaultPhysicalConsequence,
      environmentalSeverity: scenario.defaultEnvironmentalSeverity,
      environmentalZone: scenario.defaultEnvironmentalZone,
      populationExposure: scenario.defaultPopulationExposure,
      assetCriticality: scenario.defaultAssetCriticality,
    }
  }

  function updateOverride(scenarioId: string, field: string, value: string | number) {
    setOverrides((prev) => {
      const scenario = ENERGY_SCENARIOS.find((s) => s.id === scenarioId)
      if (!scenario) return prev
      const current = getOverridesForId(prev, scenario)
      return { ...prev, [scenarioId]: { ...current, [field]: value } }
    })
  }

  // Pure helper to avoid state capture issues
  function getOverridesForId(state: typeof overrides, scenario: EnergyAssetScenario) {
    const existing = state[scenario.id]
    if (existing) return existing
    return {
      physicalConsequence: scenario.defaultPhysicalConsequence,
      environmentalSeverity: scenario.defaultEnvironmentalSeverity,
      environmentalZone: scenario.defaultEnvironmentalZone,
      populationExposure: scenario.defaultPopulationExposure,
      assetCriticality: scenario.defaultAssetCriticality,
    }
  }

  // Compute current result for selected scenario
  const currentResult = useMemo(() => {
    if (!selectedScenario) return null
    const o = getOverrides(selectedScenario)
    return computeSafetyRisk(selectedScenario, o)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScenario, overrides])

  // Compute result for compare scenario
  const compareResult = useMemo(() => {
    if (!compareScenario) return null
    const o = getOverrides(compareScenario)
    return computeSafetyRisk(compareScenario, o)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareScenario, overrides])

  // Store result when a scenario is viewed/adjusted
  function storeResult(result: SafetyRiskResult) {
    const existingIdx = riskResults.findIndex((r) => r.scenarioId === result.scenarioId)
    let updated: SafetyRiskResult[]
    if (existingIdx >= 0) {
      updated = [...riskResults]
      // eslint-disable-next-line security/detect-object-injection
      updated[existingIdx] = result
    } else {
      updated = [...riskResults, result]
    }
    onRiskResultsChange(updated)
  }

  // Auto-store when result changes
  React.useEffect(() => {
    if (currentResult) storeResult(currentResult)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentResult])

  React.useEffect(() => {
    if (compareResult) storeResult(compareResult)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareResult])

  function handleSelectScenario(id: string) {
    if (compareMode && selectedId && selectedId !== id) {
      setCompareId(id)
    } else {
      setSelectedId(id)
      setCompareId(null)
      setCompareMode(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Score safety and environmental consequences of cryptographic failures across energy
        infrastructure scenarios. Select a scenario to view its risk profile, adjust parameters, and
        compare scenarios side by side.
      </p>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ENERGY_SCENARIOS.map((scenario) => {
          const defaultResult = computeSafetyRisk(scenario)
          const colors = riskLevelColor(defaultResult.riskLevel)
          const isSelected = selectedId === scenario.id
          const isCompare = compareId === scenario.id

          return (
            <Button
              variant="ghost"
              key={scenario.id}
              onClick={() => handleSelectScenario(scenario.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/40'
                  : isCompare
                    ? 'border-secondary ring-1 ring-secondary/40'
                    : 'border-border hover:border-primary/30'
              } bg-card`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-foreground leading-tight">{scenario.name}</h4>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.text} ${colors.bg}`}
                >
                  {defaultResult.riskLevel}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{scenario.assetType}</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold font-mono ${colors.text}`}>
                  {defaultResult.compoundRiskScore}
                </span>
                <span className="text-[10px] text-muted-foreground">/100 default</span>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Compare Mode Toggle */}
      {selectedId && (
        <div className="flex items-center gap-3">
          <Button
            variant={compareMode ? 'gradient' : 'outline'}
            onClick={() => {
              setCompareMode(!compareMode)
              if (compareMode) setCompareId(null)
            }}
          >
            {compareMode ? 'Exit Comparison' : 'Compare Two Scenarios'}
          </Button>
          {compareMode && !compareId && (
            <span className="text-xs text-muted-foreground">
              Select a second scenario card above to compare
            </span>
          )}
        </div>
      )}

      {/* Comparison Panel */}
      {compareMode && currentResult && compareResult && selectedScenario && compareScenario && (
        <ComparisonPanel
          leftResult={currentResult}
          rightResult={compareResult}
          leftScenario={selectedScenario}
          rightScenario={compareScenario}
        />
      )}

      {/* Selected Scenario Detail Panel */}
      {selectedScenario && currentResult && !compareMode && (
        <div className="space-y-4">
          {/* Attack Vectors */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap size={16} className="text-status-warning" />
              Attack Vectors
            </h4>
            <div className="space-y-3">
              {selectedScenario.attackVectors.map((av) => {
                const badge = threatBadge(av.quantumThreat)
                return (
                  <div key={av.id} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{av.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{av.description}</p>
                    <div className="flex flex-wrap gap-x-4 text-[10px] text-muted-foreground">
                      <span>
                        Vulnerability:{' '}
                        <span className="text-foreground">{av.currentVulnerability}</span>
                      </span>
                      <span>
                        Time to exploit: <span className="text-foreground">{av.timeToExploit}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Consequence Chain */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-status-error" />
              Consequence Chain
            </h4>
            <div className="space-y-2">
              {selectedScenario.consequenceChain.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-foreground/80 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Override Controls */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Risk Parameter Overrides
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectField
                label="Physical Consequence"
                value={getOverrides(selectedScenario).physicalConsequence}
                options={PHYSICAL_OPTIONS}
                onChange={(v) => updateOverride(selectedScenario.id, 'physicalConsequence', v)}
              />
              <SelectField
                label="Environmental Severity"
                value={getOverrides(selectedScenario).environmentalSeverity}
                options={ENVIRONMENTAL_SEVERITY_OPTIONS}
                onChange={(v) => updateOverride(selectedScenario.id, 'environmentalSeverity', v)}
              />
              <SelectField
                label="Environmental Zone"
                value={getOverrides(selectedScenario).environmentalZone}
                options={ZONE_OPTIONS}
                onChange={(v) => updateOverride(selectedScenario.id, 'environmentalZone', v)}
              />
              <SelectField
                label="Asset Criticality"
                value={getOverrides(selectedScenario).assetCriticality}
                options={CRITICALITY_OPTIONS}
                onChange={(v) => updateOverride(selectedScenario.id, 'assetCriticality', v)}
              />
            </div>

            {/* Population Exposure Slider */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="population-exposure"
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <Users size={12} />
                  Population Exposure
                </label>
                <span className="text-xs font-mono text-foreground">
                  {getOverrides(selectedScenario).populationExposure.toLocaleString()}
                </span>
              </div>
              <input
                id="population-exposure"
                type="range"
                min={1000}
                max={10_000_000}
                step={10000}
                value={getOverrides(selectedScenario).populationExposure}
                onChange={(e) =>
                  updateOverride(selectedScenario.id, 'populationExposure', Number(e.target.value))
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>1K</span>
                <span>10M</span>
              </div>
            </div>
          </div>

          {/* Risk Score Breakdown */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-4">Risk Score Breakdown</h4>
            <div className="space-y-3">
              <ScoreBreakdownBar
                label="Safety Score"
                value={currentResult.safetyScore}
                weight="40%"
                maxValue={100}
              />
              <ScoreBreakdownBar
                label="Environmental Score"
                value={currentResult.environmentalScore}
                weight="20%"
                maxValue={100}
              />
              <ScoreBreakdownBar
                label="HNDL Score"
                value={currentResult.hndlScore}
                weight="20%"
                maxValue={100}
              />
              <ScoreBreakdownBar
                label="Compliance Penalty"
                value={currentResult.compliancePenalty}
                weight="20%"
                maxValue={30}
              />
            </div>

            {/* Compound Score */}
            <div className="mt-5 flex items-center justify-center">
              {(() => {
                const colors = riskLevelColor(currentResult.riskLevel)
                return (
                  <div
                    className={`rounded-xl p-6 text-center ${colors.bg} border ${colors.border}`}
                  >
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Compound Risk Score
                    </p>
                    <p className={`text-3xl md:text-5xl font-bold font-mono ${colors.text}`}>
                      {currentResult.compoundRiskScore}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">/100</p>
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${colors.text} ${colors.bg}`}
                    >
                      {currentResult.riskLevel}
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-status-success" />
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {currentResult.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Leaf size={14} className="text-status-success shrink-0 mt-0.5" />
                  {action}
                </li>
              ))}
            </ul>
            {selectedScenario.nercCipRelevance.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1.5">NERC CIP Standards</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedScenario.nercCipRelevance.map((cip) => (
                    <span
                      key={cip}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted border border-border text-foreground"
                    >
                      {cip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stored Results Summary */}
      {riskResults.length > 0 && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">
            Scored Scenarios ({riskResults.length}/{ENERGY_SCENARIOS.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Scenario</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Safety</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Env</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">HNDL</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Compliance</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {riskResults
                  .sort((a, b) => b.compoundRiskScore - a.compoundRiskScore)
                  .map((r, idx) => {
                    const scenario = ENERGY_SCENARIOS.find((s) => s.id === r.scenarioId)
                    const colors = riskLevelColor(r.riskLevel)
                    return (
                      <tr key={r.scenarioId} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                        <td className="p-2 text-foreground font-medium">
                          {scenario?.name ?? r.scenarioId}
                        </td>
                        <td className="p-2 text-center font-mono text-foreground">
                          {r.safetyScore}
                        </td>
                        <td className="p-2 text-center font-mono text-foreground">
                          {r.environmentalScore}
                        </td>
                        <td className="p-2 text-center font-mono text-foreground">{r.hndlScore}</td>
                        <td className="p-2 text-center font-mono text-foreground">
                          {r.compliancePenalty}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`font-mono font-bold ${colors.text}`}>
                            {r.compoundRiskScore}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.text} ${colors.bg}`}
                          >
                            {r.riskLevel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Complete */}
      <div className="flex justify-center pt-2">
        <Button variant="gradient" onClick={onComplete} className="flex items-center gap-2">
          <CheckCircle2 size={16} />
          Mark Step Complete
        </Button>
      </div>
    </div>
  )
}
