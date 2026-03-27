// SPDX-License-Identifier: GPL-3.0-only
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

export const ScaleEncryptionPlanner: React.FC = () => {
  const [datasetSizeGB, setDatasetSizeGB] = useState(100000) // 100 TB
  const [modelCount, setModelCount] = useState(12)
  const [inferencePerDay, setInferencePerDay] = useState(10000000) // 10M
  const [agentCount, setAgentCount] = useState(50)
  const [retentionYears, setRetentionYears] = useState(7)
  const [regions, setRegions] = useState(3)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const analysis = useMemo(() => {
    const totalDEKs = estimateDEKCount(datasetSizeGB, modelCount)
    const totalKEKs = estimateKEKCount(regions, modelCount)
    const kmsOps = estimateKMSOpsPerDay(inferencePerDay, agentCount, totalDEKs)
    const storageOverhead = estimateStorageOverhead(totalDEKs, modelCount)
    const bwOverhead = estimateBandwidthOverhead(inferencePerDay)
    const hndlRisk = estimateHNDLRiskWindow(retentionYears)

    return { totalDEKs, totalKEKs, kmsOps, storageOverhead, bwOverhead, hndlRisk }
  }, [datasetSizeGB, modelCount, inferencePerDay, agentCount, retentionYears, regions])

  const loadPreset = (presetId: string) => {
    const ref = SCALE_REFERENCE_POINTS.find((r) => r.id === presetId)
    if (!ref) return
    setDatasetSizeGB(ref.datasetSizeTB * 1024)
    setModelCount(parseInt(ref.modelParams.split('–')[0]) || 7)
    const infMap: Record<string, number> = { '100K': 100000, '10M': 10000000, '1B': 1000000000 }
    setInferencePerDay(infMap[ref.inferencePerDay] || 10000000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Scale Encryption Planner</h3>
        <p className="text-sm text-muted-foreground">
          Input your AI infrastructure parameters to calculate PQC migration requirements — key
          counts, KMS operations, storage overhead, and HNDL risk windows.
        </p>
      </div>

      {/* Presets */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          {SCALE_REFERENCE_POINTS.map((ref) => (
            <Button key={ref.id} variant="outline" size="sm" onClick={() => loadPreset(ref.id)}>
              {ref.name}
            </Button>
          ))}
        </div>
      </div>

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
              value: datasetSizeGB / 1024,
              onChange: (v: number) => setDatasetSizeGB(v * 1024),
              min: 0.1,
              max: 100000,
              step: 10,
            },
            {
              label: 'Model Count',
              value: modelCount,
              onChange: setModelCount,
              min: 1,
              max: 1000,
              step: 1,
            },
            {
              label: 'Inference/Day',
              value: inferencePerDay,
              onChange: setInferencePerDay,
              min: 1000,
              max: 10000000000,
              step: 100000,
            },
            {
              label: 'Agent Count',
              value: agentCount,
              onChange: setAgentCount,
              min: 1,
              max: 10000,
              step: 1,
            },
            {
              label: 'Retention (years)',
              value: retentionYears,
              onChange: setRetentionYears,
              min: 1,
              max: 30,
              step: 1,
            },
            {
              label: 'Regions',
              value: regions,
              onChange: setRegions,
              min: 1,
              max: 20,
              step: 1,
            },
          ].map((input) => (
            <div key={input.label}>
              <label className="text-xs text-muted-foreground block mb-1">{input.label}</label>
              <input
                type="number"
                value={input.value}
                onChange={(e) => input.onChange(Number(e.target.value) || input.min)}
                min={input.min}
                max={input.max}
                step={input.step}
                className="w-full px-3 py-2 rounded border border-input bg-background text-foreground text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          PQC Migration Analysis
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-foreground">
              {analysis.totalDEKs >= 1000000
                ? `${(analysis.totalDEKs / 1000000).toFixed(1)}M`
                : analysis.totalDEKs >= 1000
                  ? `${(analysis.totalDEKs / 1000).toFixed(0)}K`
                  : analysis.totalDEKs}
            </p>
            <p className="text-xs text-muted-foreground">Total DEKs</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{analysis.totalKEKs}</p>
            <p className="text-xs text-muted-foreground">Total KEKs</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {analysis.kmsOps >= 1000000
                ? `${(analysis.kmsOps / 1000000).toFixed(1)}M`
                : analysis.kmsOps >= 1000
                  ? `${(analysis.kmsOps / 1000).toFixed(0)}K`
                  : analysis.kmsOps}
            </p>
            <p className="text-xs text-muted-foreground">KMS Ops/Day</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-foreground">
              {analysis.storageOverhead.toFixed(2)} GB
            </p>
            <p className="text-xs text-muted-foreground">Storage Overhead</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{analysis.bwOverhead.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Bandwidth Overhead</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p
              className={`text-sm font-bold ${analysis.hndlRisk.startsWith('High') ? 'text-status-error' : analysis.hndlRisk.startsWith('Medium') ? 'text-status-warning' : 'text-status-success'}`}
            >
              {analysis.hndlRisk.split('—')[0]}
            </p>
            <p className="text-xs text-muted-foreground">HNDL Risk</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">{analysis.hndlRisk}</p>
      </div>

      {/* Migration phases */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Phased Migration Roadmap</h4>
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
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="text-sm font-bold text-foreground flex items-center gap-2"
        >
          Privacy-Preserving ML Technologies
          <span className="text-muted-foreground text-xs">
            {showPrivacy ? '(collapse)' : '(expand)'}
          </span>
        </button>
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
