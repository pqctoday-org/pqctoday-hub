// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
  Shield,
  FlaskConical,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  PHARMA_PHASE_CONFIGS,
  DEFAULT_DRUG_PIPELINE,
  PHASE_COLORS,
  SEVERITY_COLORS,
  computePharmaExposure,
  type DrugPhase,
  type DrugPipelineEntry,
} from '../data/healthcareConstants'

// ── Constants ────────────────────────────────────────────────────────────

const MAX_COMPOUNDS = 6

const PHASE_DROPDOWN_ITEMS = PHARMA_PHASE_CONFIGS.map((p) => ({
  id: p.id,
  label: p.label,
}))

const ENCRYPTION_OPTIONS = [
  { id: 'RSA-2048', label: 'RSA-2048' },
  { id: 'ECDH P-256', label: 'ECDH P-256' },
  { id: 'AES-128-GCM', label: 'AES-128-GCM' },
  { id: 'AES-256-GCM', label: 'AES-256-GCM' },
  { id: 'TLS 1.3 hybrid', label: 'TLS 1.3 hybrid' },
]

// Encryption schemes vulnerable to Shor's algorithm (asymmetric key exchange)
const QUANTUM_VULNERABLE_ENCRYPTION = new Set(['RSA-2048', 'ECDH P-256'])

function getUrgencyClassification(totalExposureM: number): {
  level: 'critical' | 'high' | 'medium'
  label: string
  description: string
} {
  if (totalExposureM >= 5000) {
    return {
      level: 'critical',
      label: 'Critical',
      description:
        'Portfolio has massive HNDL exposure. Competitors capturing encrypted trial data now could skip years of R&D once CRQC arrives.',
    }
  }
  if (totalExposureM >= 1000) {
    return {
      level: 'high',
      label: 'High',
      description:
        'Significant financial exposure from harvest-now-decrypt-later attacks. PQC migration for high-value compounds should begin immediately.',
    }
  }
  return {
    level: 'medium',
    label: 'Medium',
    description:
      'Moderate exposure. Consider PQC migration planning for early-phase compounds with long patent runways.',
  }
}

// ── Component ────────────────────────────────────────────────────────────

export const PharmaIPCalculator: React.FC = () => {
  const [pipeline, setPipeline] = useState<DrugPipelineEntry[]>(DEFAULT_DRUG_PIPELINE)
  const [crqcYear, setCrqcYear] = useState(2035)

  const addCompound = useCallback(() => {
    setPipeline((prev) => [
      ...prev,
      {
        id: `compound-${Date.now()}`,
        compoundName: `NEW-${prev.length + 1}`,
        phase: 'discovery' as DrugPhase,
        commercialValueM: 500,
        currentEncryption: 'RSA-2048',
      },
    ])
  }, [])

  const removeCompound = useCallback((id: string) => {
    setPipeline((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateCompound = useCallback((id: string, updates: Partial<DrugPipelineEntry>) => {
    setPipeline((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  // ── Exposure calculations ──────────────────────────────────────────────

  const exposures = useMemo(() => {
    return pipeline.map((compound) => {
      const phaseConfig = PHARMA_PHASE_CONFIGS.find((p) => p.id === compound.phase)!
      const { exposureM, atRisk } = computePharmaExposure(
        compound.commercialValueM,
        phaseConfig.avgYearsToExpiry,
        crqcYear
      )
      const phaseIndex = PHARMA_PHASE_CONFIGS.findIndex((p) => p.id === compound.phase)
      const rdYearsSkipped =
        atRisk && phaseIndex >= 0
          ? Math.round(
              (phaseIndex / PHARMA_PHASE_CONFIGS.length) * phaseConfig.avgYearsToExpiry * 10
            ) / 10
          : 0
      const isQuantumVulnerable = QUANTUM_VULNERABLE_ENCRYPTION.has(compound.currentEncryption)
      return {
        ...compound,
        phaseConfig,
        exposureM,
        atRisk,
        rdYearsSkipped,
        isQuantumVulnerable,
      }
    })
  }, [pipeline, crqcYear])

  const totalValue = useMemo(
    () => pipeline.reduce((sum, c) => sum + c.commercialValueM, 0),
    [pipeline]
  )

  const totalExposure = useMemo(
    () => exposures.reduce((sum, e) => sum + e.exposureM, 0),
    [exposures]
  )

  const atRiskCount = useMemo(() => exposures.filter((e) => e.atRisk).length, [exposures])

  const percentAtRisk = totalValue > 0 ? Math.round((totalExposure / totalValue) * 100) : 0

  const urgency = useMemo(() => getUrgencyClassification(totalExposure), [totalExposure])

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Model the financial exposure of your pharmaceutical IP portfolio to
        harvest-now-decrypt-later (HNDL) attacks. Add compounds, set their development phase and
        commercial value, then adjust the estimated CRQC arrival year to see how exposure changes.
      </p>

      {/* ── Pipeline Builder ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FlaskConical size={16} className="text-primary" />
          Drug Pipeline Builder
        </h4>

        <div className="space-y-3">
          {pipeline.map((compound) => (
            <div key={compound.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                {/* Compound name */}
                <div>
                  <label
                    htmlFor={`compound-name-${compound.id}`}
                    className="block text-xs text-muted-foreground mb-1"
                  >
                    Compound
                  </label>
                  <Input
                    id={`compound-name-${compound.id}`}
                    type="text"
                    value={compound.compoundName}
                    onChange={(e) => updateCompound(compound.id, { compoundName: e.target.value })}
                    className="h-9 text-sm"
                    maxLength={20}
                  />
                </div>

                {/* Phase */}
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Phase</span>
                  <FilterDropdown
                    items={PHASE_DROPDOWN_ITEMS}
                    selectedId={compound.phase}
                    onSelect={(id) => updateCompound(compound.id, { phase: id as DrugPhase })}
                    label="Phase"
                    defaultLabel="Select"
                    noContainer
                  />
                </div>

                {/* Commercial value */}
                <div>
                  <label
                    htmlFor={`compound-value-${compound.id}`}
                    className="block text-xs text-muted-foreground mb-1"
                  >
                    Value ($M)
                  </label>
                  <Input
                    id={`compound-value-${compound.id}`}
                    type="number"
                    min={0}
                    max={99999}
                    value={compound.commercialValueM}
                    onChange={(e) =>
                      updateCompound(compound.id, {
                        commercialValueM: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="h-9 text-sm font-mono"
                  />
                </div>

                {/* Encryption */}
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Encryption</span>
                  <FilterDropdown
                    items={ENCRYPTION_OPTIONS}
                    selectedId={compound.currentEncryption}
                    onSelect={(id) => updateCompound(compound.id, { currentEncryption: id })}
                    label="Encryption"
                    defaultLabel="Select"
                    noContainer
                  />
                </div>

                {/* Remove */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCompound(compound.id)}
                    className="text-status-error hover:text-status-error h-9"
                    disabled={pipeline.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addCompound}
          disabled={pipeline.length >= MAX_COMPOUNDS}
          className="mt-3 flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add Compound
          {pipeline.length >= MAX_COMPOUNDS && (
            <span className="text-muted-foreground ml-1">(max {MAX_COMPOUNDS})</span>
          )}
        </Button>
      </div>

      {/* ── CRQC Year Slider ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="crqc-year"
            className="text-sm font-bold text-foreground flex items-center gap-2"
          >
            <Clock size={16} className="text-primary" />
            Estimated CRQC Year
          </label>
          <span className="text-lg font-bold font-mono text-primary">{crqcYear}</span>
        </div>
        <input
          id="crqc-year"
          type="range"
          min={2028}
          max={2042}
          step={1}
          value={crqcYear}
          onChange={(e) => setCrqcYear(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>2028 (aggressive)</span>
          <span>2035 (consensus)</span>
          <span>2042 (conservative)</span>
        </div>
      </div>

      {/* ── Financial Exposure Dashboard ──────────────────────────────── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          Financial Exposure Dashboard
        </h4>

        <div className="space-y-2">
          {exposures.map((entry) => {
            const phaseColor = PHASE_COLORS[entry.phase] ?? 'bg-muted text-muted-foreground'
            return (
              <div
                key={entry.id}
                className={`rounded-lg border p-3 transition-colors ${
                  entry.atRisk
                    ? 'border-status-error/30 bg-status-error/5'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {entry.compoundName}
                    </span>
                    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${phaseColor}`}>
                      {entry.phaseConfig.label}
                    </span>
                    {entry.atRisk && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-error/20 text-status-error">
                        <AlertTriangle size={10} />
                        At Risk
                      </span>
                    )}
                    {entry.isQuantumVulnerable && (
                      <span className="text-[10px] rounded px-1.5 py-0.5 bg-status-warning/20 text-status-warning font-medium">
                        {entry.currentEncryption} &mdash; quantum-vulnerable
                      </span>
                    )}
                    {!entry.isQuantumVulnerable && (
                      <span className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground font-medium">
                        {entry.currentEncryption}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Value</div>
                      <div className="font-mono text-foreground">
                        ${entry.commercialValueM.toLocaleString()}M
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Exposure</div>
                      <div
                        className={`font-mono font-bold ${
                          entry.atRisk ? 'text-status-error' : 'text-foreground'
                        }`}
                      >
                        ${entry.exposureM.toLocaleString()}M
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Yrs to Expiry</div>
                      <div className="font-mono text-foreground">
                        {entry.phaseConfig.avgYearsToExpiry}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total row */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Total Portfolio Exposure</span>
          <span
            className={`text-lg font-bold font-mono ${
              totalExposure > 0 ? 'text-status-error' : 'text-foreground'
            }`}
          >
            ${totalExposure.toLocaleString()}M
          </span>
        </div>
      </div>

      {/* ── Competitor Advantage Window ───────────────────────────────── */}
      {atRiskCount > 0 && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-status-warning" />
            Competitor R&amp;D Advantage Window
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            If a competitor harvests encrypted trial data now and decrypts it after CRQC arrives,
            they could skip years of independent R&amp;D for each at-risk compound.
          </p>

          <div className="space-y-3">
            {exposures
              .filter((e) => e.atRisk)
              .map((entry) => {
                const maxSkip = Math.max(
                  ...exposures.filter((e) => e.atRisk).map((e) => e.rdYearsSkipped),
                  1
                )
                const barWidthPct = maxSkip > 0 ? (entry.rdYearsSkipped / maxSkip) * 100 : 0

                return (
                  <div key={entry.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-foreground">
                        {entry.compoundName}
                      </span>
                      <span className="text-xs font-mono text-status-warning">
                        {entry.rdYearsSkipped} years skipped
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-status-warning/70 transition-all"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>0 years</span>
                      <span>{entry.phaseConfig.avgYearsToExpiry} years (full pipeline)</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Summary Panel ─────────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Portfolio Summary
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Value
            </div>
            <div className="text-lg font-bold font-mono text-foreground mt-1">
              ${totalValue.toLocaleString()}M
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              HNDL Exposure
            </div>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                totalExposure > 0 ? 'text-status-error' : 'text-foreground'
              }`}
            >
              ${totalExposure.toLocaleString()}M
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              % at Risk
            </div>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                percentAtRisk > 50
                  ? 'text-status-error'
                  : percentAtRisk > 20
                    ? 'text-status-warning'
                    : 'text-foreground'
              }`}
            >
              {percentAtRisk}%
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Compounds at Risk
            </div>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                atRiskCount > 0 ? 'text-status-error' : 'text-foreground'
              }`}
            >
              {atRiskCount}/{pipeline.length}
            </div>
          </div>
        </div>

        {/* Urgency classification */}
        <div
          className={`rounded-lg border p-4 ${
            SEVERITY_COLORS[urgency.level] ?? 'bg-muted text-muted-foreground border-border'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} />
            <span className="text-sm font-bold">Migration Urgency: {urgency.label}</span>
          </div>
          <p className="text-xs opacity-90">{urgency.description}</p>
        </div>
      </div>
    </div>
  )
}
