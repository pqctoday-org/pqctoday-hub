// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Calculator, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  estimateDEKCount,
  estimateKEKCount,
  estimateKMSOpsPerDay,
  estimateStorageOverhead,
  estimateBandwidthOverhead,
  estimateHNDLRiskWindow,
  MIGRATION_PHASE_TEMPLATES,
  PRIVACY_TECH_PROFILES,
  SCALE_REFERENCE_POINTS,
} from '../data/scaleEncryptionData'
import { EFFORT_COLORS, PRIVACY_MATURITY_COLORS } from '../data/aiSecurityConstants'

// Exact counts are used only where the existing sample notes state them.
// Parameter ranges are model-size context, never a number of model instances.
const PLANNER_PRESETS = SCALE_REFERENCE_POINTS.map((ref) => ({
  id: ref.id,
  name: ref.name,
  datasetSizeTB: ref.datasetSizeTB,
  parameterCount: ref.modelParams,
  modelCount: ref.id === 'startup' ? 1 : null,
  regions: ref.id === 'startup' ? 1 : ref.id === 'enterprise' ? 3 : null,
  inferencePerDay:
    ref.inferencePerDay === '100K'
      ? 100000
      : ref.inferencePerDay === '10M'
        ? 10000000
        : ref.inferencePerDay === '1B'
          ? 1000000000
          : null,
  agentCount: null,
  retentionYears: null,
}))

const formatCount = (value: number | null) =>
  value === null ? 'Unknown' : value.toLocaleString('en-US')

export const ScaleEncryptionPlanner: React.FC = () => {
  const [datasetSizeGB, setDatasetSizeGB] = useState<number | null>(100000) // 100 TB
  const [modelCount, setModelCount] = useState<number | null>(12)
  const [inferencePerDay, setInferencePerDay] = useState<number | null>(10000000) // 10M
  const [agentCount, setAgentCount] = useState<number | null>(50)
  const [retentionYears, setRetentionYears] = useState<number | null>(7)
  const [regions, setRegions] = useState<number | null>(3)
  const [parameterCount, setParameterCount] = useState<string | null>(null)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const analysis = useMemo(() => {
    const totalDEKs =
      datasetSizeGB === null || modelCount === null
        ? null
        : estimateDEKCount(datasetSizeGB, modelCount)
    const totalKEKs =
      regions === null || modelCount === null ? null : estimateKEKCount(regions, modelCount)
    const kmsOps =
      inferencePerDay === null || agentCount === null || totalDEKs === null
        ? null
        : estimateKMSOpsPerDay(inferencePerDay, agentCount, totalDEKs)
    const storageOverhead =
      totalDEKs === null || modelCount === null
        ? null
        : estimateStorageOverhead(totalDEKs, modelCount)
    const bwOverhead = inferencePerDay === null ? null : estimateBandwidthOverhead(inferencePerDay)
    const hndlRisk = retentionYears === null ? null : estimateHNDLRiskWindow(retentionYears)

    return { totalDEKs, totalKEKs, kmsOps, storageOverhead, bwOverhead, hndlRisk }
  }, [datasetSizeGB, modelCount, inferencePerDay, agentCount, retentionYears, regions])

  const loadPreset = (presetId: string) => {
    const preset = PLANNER_PRESETS.find((ref) => ref.id === presetId)
    if (!preset) return
    setDatasetSizeGB(preset.datasetSizeTB * 1000)
    setParameterCount(preset.parameterCount)
    setModelCount(preset.modelCount)
    setInferencePerDay(preset.inferencePerDay)
    setAgentCount(preset.agentCount)
    setRetentionYears(preset.retentionYears)
    setRegions(preset.regions)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Scale Encryption Planner</h3>
        <p className="text-sm text-muted-foreground">
          Explore illustrative key counts, operation volumes and retention-window comparisons from
          sample inputs. These estimates do not establish production capacity or security.
        </p>
      </div>

      {/* Presets */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          {PLANNER_PRESETS.map((ref) => (
            <Button key={ref.id} variant="outline" size="sm" onClick={() => loadPreset(ref.id)}>
              {ref.name}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Presets replace the previous scenario. Blank fields are not specified, not zero; enter them
        to compute dependent totals. Parameters per model are size context, not model count.
      </p>
      <p className="text-sm text-foreground">
        Parameters per model (preset context): <strong>{parameterCount ?? 'Not specified'}</strong>.
        The key model assumes ten shards per model regardless of this range.
      </p>

      {/* Input parameters */}
      <div className="glass-panel p-4 space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Calculator size={16} className="text-primary" />
          Infrastructure Parameters
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Dataset Size (TB)',
              value: datasetSizeGB === null ? null : datasetSizeGB / 1000,
              onChange: (v: number | null) => setDatasetSizeGB(v === null ? null : v * 1000),
              min: 0,
              max: 100000,
              step: 0.1,
            },
            {
              label: 'Model Count',
              value: modelCount,
              onChange: setModelCount,
              min: 0,
              max: 1000,
              step: 1,
            },
            {
              label: 'Inference/Day',
              value: inferencePerDay,
              onChange: setInferencePerDay,
              min: 0,
              max: 10000000000,
              step: 100000,
            },
            {
              label: 'Agent Count',
              value: agentCount,
              onChange: setAgentCount,
              min: 0,
              max: 10000,
              step: 1,
            },
            {
              label: 'Retention (years)',
              value: retentionYears,
              onChange: setRetentionYears,
              min: 0,
              max: 30,
              step: 1,
            },
            {
              label: 'Regions',
              value: regions,
              onChange: setRegions,
              min: 0,
              max: 20,
              step: 1,
            },
          ].map((input) => (
            <div key={input.label}>
              <label className="text-xs text-muted-foreground block mb-1">{input.label}</label>
              <input
                type="number"
                aria-label={input.label}
                value={input.value ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : Number(e.target.value)
                  const wholeCount = input.label !== 'Dataset Size (TB)'
                  input.onChange(
                    value !== null &&
                      Number.isFinite(value) &&
                      value >= 0 &&
                      (!wholeCount || Number.isInteger(value))
                      ? value
                      : null
                  )
                }}
                min={input.min}
                max={input.max}
                step={input.step}
                className="w-full px-3 py-2 rounded border border-input bg-background text-foreground text-sm"
              />
              {input.value === null && (
                <p className="text-xs text-muted-foreground mt-1">Not specified — enter a value.</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Dataset units are decimal: 1 TB = 1,000 GB. Counts and years use nonnegative whole
          numbers; clearing a field means unknown.
        </p>
      </div>

      {/* Results */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Illustrative Sizing Estimates
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            className="glass-panel p-3 text-center min-w-0"
            role="group"
            aria-label="Estimated DEKs"
          >
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">
              {formatCount(analysis.totalDEKs)}
            </p>
            <p className="text-xs text-muted-foreground">Estimated DEKs</p>
          </div>
          <div
            className="glass-panel p-3 text-center min-w-0"
            role="group"
            aria-label="Estimated KEKs"
          >
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">
              {formatCount(analysis.totalKEKs)}
            </p>
            <p className="text-xs text-muted-foreground">Estimated KEKs</p>
          </div>
          <div
            className="glass-panel p-3 text-center min-w-0"
            role="group"
            aria-label="Modeled KMS operations per day"
          >
            <p className="text-lg sm:text-2xl font-bold text-primary break-words">
              {formatCount(analysis.kmsOps)}
            </p>
            <p className="text-xs text-muted-foreground">Modeled KMS Ops/Day</p>
          </div>
          <div
            className="glass-panel p-3 text-center min-w-0"
            role="group"
            aria-label="Modeled storage delta"
          >
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">
              {analysis.storageOverhead === null
                ? 'Unknown'
                : `${analysis.storageOverhead.toFixed(6)} GiB`}
            </p>
            <p className="text-xs text-muted-foreground">Modeled Storage Delta</p>
          </div>
          <div
            className="glass-panel p-3 text-center min-w-0"
            role="group"
            aria-label="Illustrative bandwidth overhead"
          >
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">
              {analysis.bwOverhead === null ? 'Unknown' : `${analysis.bwOverhead.toFixed(2)}%`}
            </p>
            <p className="text-xs text-muted-foreground">Illustrative Bandwidth Overhead</p>
          </div>
          <div
            className="glass-panel p-3 text-center min-w-0"
            role="group"
            aria-label="Illustrative retention window"
          >
            <p className="text-sm font-bold text-foreground">
              {analysis.hndlRisk?.split('—')[0] ?? 'Not assessed'}
            </p>
            <p className="text-xs text-muted-foreground">Illustrative Retention Window</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {retentionYears === null
            ? 'Enter retention years to compare the sample window.'
            : `Sample expiry year: ${2026 + retentionYears}. The band compares this year with the exercise boundaries only.`}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          The example rule uses base year 2026: expiry by 2030 is Low, 2031–2035 is Medium, and
          after 2035 is High. These are illustrative bands, not a quantum-arrival forecast or an
          organization-specific HNDL risk assessment.
        </p>
        <details className="text-xs text-muted-foreground mt-3">
          <summary className="cursor-pointer font-medium">
            Illustrative calculation assumptions
          </summary>
          <p className="mt-2">
            The existing model assigns one DEK per decimal GB plus ten shards per model; KEKs are
            one root per region plus one per model per region. Daily KMS operations add one per
            inference, ten per agent and rounded-up 1% DEK rotation. These are example counts, not
            measured service throughput.
          </p>
          <p className="mt-2">
            Storage uses the existing byte-size comparison and binary GiB (2^30 bytes). Bandwidth
            uses the existing example connection assumptions, not a measured network benchmark. With
            production tools, inventory actual shards and key hierarchy, and measure caching,
            rotation and connection reuse before sizing.
          </p>
        </details>
      </div>

      {/* Migration phases */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Phased Migration Roadmap</h4>
        <p className="text-sm text-muted-foreground mb-3" aria-label="Migration schedule basis">
          Hub-authored sequential schedule:{' '}
          {MIGRATION_PHASE_TEMPLATES.map((phase) => phase.durationMonths).join(' + ')}
          {' = '}
          {MIGRATION_PHASE_TEMPLATES.reduce((sum, phase) => sum + phase.durationMonths, 0)} months.
          The four durations and effort labels are fixed exercise assumptions. Workload inputs do
          not estimate these durations, and no phase overlap is modelled. Use the inventory phase to
          identify dependencies before prioritising the key-wrapping and transport work; use your
          own tool and provider readiness evidence to set a real schedule.
        </p>
        <div className="space-y-2">
          {MIGRATION_PHASE_TEMPLATES.map((phase) => (
            <div key={phase.phase} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-bold text-foreground">
                  Phase {phase.phase}: {phase.name}
                </h5>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {phase.durationMonths} months
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${EFFORT_COLORS[phase.effortLevel]}`}
                  >
                    {phase.effortLevel}
                  </span>
                </div>
              </div>
              <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                {phase.components.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              {phase.pqcAlgorithms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {phase.pqcAlgorithms.map((alg) => (
                    <span
                      key={alg}
                      className="text-[10px] px-2 py-0.5 rounded border font-mono bg-status-success/20 text-status-success border-status-success/50"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy-preserving tech */}
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="text-sm font-bold text-foreground flex items-center gap-2"
        >
          Privacy-Preserving ML Technologies
          <span className="text-muted-foreground text-xs">
            {showPrivacy ? '(collapse)' : '(expand)'}
          </span>
        </Button>
        {showPrivacy && (
          <div className="space-y-2 mt-3">
            {PRIVACY_TECH_PROFILES.map((tech) => (
              <div key={tech.id} className="glass-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-bold text-foreground">{tech.name}</h5>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${PRIVACY_MATURITY_COLORS[tech.maturity]}`}
                    >
                      {tech.maturity}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                        tech.quantumSafe
                          ? 'bg-status-success/20 text-status-success border-status-success/50'
                          : 'bg-status-warning/20 text-status-warning border-status-warning/50'
                      }`}
                    >
                      {tech.quantumSafe ? 'Quantum-Safe' : 'Needs PQC'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-foreground/80">{tech.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Performance: </span>
                    <span className="text-foreground">{tech.performanceOverhead}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PQC Relevance: </span>
                    <span className="text-foreground">{tech.pqcRelevance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
