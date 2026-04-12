// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { FileCheck, ShieldCheck, AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  VERIFICATION_LAYERS,
  MODEL_COLLAPSE_CURVES,
  COLLAPSE_SCENARIO_LABELS,
  DATASET_SCENARIOS,
  MANIFEST_SIGNING_PROFILES,
} from '../data/dataAuthenticityData'
import { DATASET_RISK_COLORS, PRIVACY_MATURITY_COLORS } from '../data/aiSecurityConstants'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const AI_SECURITY_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'ai-model-sigver',
    useCase: 'AI model weight authenticity (ML-DSA-65)',
    standard: 'NIST AI RMF + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'AI model weight hash: SHA-256(resnet50-v2.onnx)=7f3a9b2c4d...',
  },
  {
    id: 'ai-agent-encrypt',
    useCase: 'Agent credential envelope encryption',
    standard: 'SP 800-38D + NIST AI RMF',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-functional' },
    message: 'Agent credential token: iss=pqc-ai-platform,sub=agent-7b3f,exp=1735689600',
  },
  {
    id: 'ai-data-integrity',
    useCase: 'Training data integrity hash',
    standard: 'FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 1 },
  },
]

const SCENARIO_ITEMS = DATASET_SCENARIOS.map((s) => ({ id: s.id, label: s.name }))
const SIGNING_ITEMS = MANIFEST_SIGNING_PROFILES.map((p) => ({ id: p.id, label: p.algorithm }))

export const DataAuthenticityVerifier: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>(DATASET_SCENARIOS[0].id)
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set())
  const [selectedSigning, setSelectedSigning] = useState(MANIFEST_SIGNING_PROFILES[0].id)

  const scenario = useMemo(
    () => DATASET_SCENARIOS.find((s) => s.id === selectedScenario) ?? DATASET_SCENARIOS[0],
    [selectedScenario]
  )

  const signingProfile = useMemo(
    () =>
      MANIFEST_SIGNING_PROFILES.find((p) => p.id === selectedSigning) ??
      MANIFEST_SIGNING_PROFILES[0],
    [selectedSigning]
  )

  const toggleLayer = (layerId: string) => {
    setEnabledLayers((prev) => {
      const next = new Set(prev)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return next
    })
  }

  const trustScore = useMemo(() => {
    const riskBase: Record<string, number> = { low: 80, medium: 60, high: 40, critical: 20 }
    let score = riskBase[scenario.riskLevel] ?? 50
    enabledLayers.forEach(() => {
      score = Math.min(100, score + 8)
    })
    if (signingProfile.quantumSafe) score = Math.min(100, score + 5)
    return Math.round(score)
  }, [scenario, enabledLayers, signingProfile])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Data Authenticity Verifier</h3>
        <p className="text-sm text-muted-foreground">
          Configure verification layers to defend against synthetic data contamination and model
          collapse. See how cryptographic provenance protects training data integrity.
        </p>
      </div>

      {/* Scenario selector */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        <FilterDropdown
          items={SCENARIO_ITEMS}
          selectedId={selectedScenario}
          onSelect={(id) => setSelectedScenario(id)}
          label="Dataset"
          defaultLabel="Select Dataset"
          noContainer
        />
        <span
          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${DATASET_RISK_COLORS[scenario.riskLevel]}`}
        >
          {scenario.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      {/* Scenario details */}
      <div className="glass-panel p-4">
        <p className="text-sm text-foreground/80">{scenario.description}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Typical synthetic content: <strong>{scenario.typicalSyntheticPercent}%</strong>
        </p>
      </div>

      {/* Verification layers */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FileCheck size={16} className="text-primary" />
          Verification Layers
        </h4>
        <div className="space-y-2">
          {VERIFICATION_LAYERS.map((layer) => {
            const isEnabled = enabledLayers.has(layer.id)
            const isRecommended = scenario.recommendedVerification.includes(layer.id)
            return (
              <Button
                variant="ghost"
                type="button"
                key={layer.id}
                className={`w-full text-left glass-panel p-4 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isEnabled ? 'border-primary/50 ring-1 ring-primary/30' : ''
                }`}
                onClick={() => toggleLayer(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isEnabled ? 'bg-primary border-primary text-black' : 'border-border'
                      }`}
                    >
                      {isEnabled && <ShieldCheck size={12} />}
                    </div>
                    <span className="text-sm font-medium text-foreground">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRecommended && (
                      <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/20 text-primary border-primary/50">
                        Recommended
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${PRIVACY_MATURITY_COLORS[layer.maturity]}`}
                    >
                      {layer.maturity}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-foreground/70 mt-2 ml-8">{layer.description}</p>
                <div className="flex flex-wrap gap-4 mt-2 ml-8 text-xs text-muted-foreground">
                  <span>Accuracy: {layer.accuracy}</span>
                  <span>Overhead: {layer.performanceOverhead}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Model collapse table */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-warning" />
          Model Collapse Across Generations
        </h4>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Strategy</th>
                {[0, 1, 2, 3, 4, 5].map((gen) => (
                  <th key={gen} className="text-center p-3 text-muted-foreground font-medium">
                    Gen {gen}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(MODEL_COLLAPSE_CURVES).map(([key, points]) => {
                const meta = COLLAPSE_SCENARIO_LABELS[key as keyof typeof COLLAPSE_SCENARIO_LABELS]
                return (
                  <tr key={key} className="border-b border-border/50">
                    <td className={`p-3 font-medium ${meta.color}`}>{meta.label}</td>
                    {points.map((pt) => {
                      const color =
                        pt.qualityScore >= 80
                          ? 'text-status-success'
                          : pt.qualityScore >= 60
                            ? 'text-status-warning'
                            : 'text-status-error'
                      return (
                        <td key={pt.generation} className={`text-center p-3 font-mono ${color}`}>
                          {pt.qualityScore}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground p-3 border-t border-border">
            Quality Score (0–100): higher is better. Provenance-verified datasets maintain quality
            across generations by cryptographically filtering out synthetic contamination.
          </p>
        </div>
      </div>

      {/* Signing overhead */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Manifest Signing Overhead</h4>
        <div className="glass-panel p-4 space-y-3">
          <FilterDropdown
            items={SIGNING_ITEMS}
            selectedId={selectedSigning}
            onSelect={(id) => setSelectedSigning(id)}
            label="Algorithm"
            defaultLabel="Select Algorithm"
            noContainer
          />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">
                {signingProfile.signatureSize.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Signature (bytes)</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{signingProfile.signTimeMs}ms</p>
              <p className="text-xs text-muted-foreground">Sign Time</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{signingProfile.verifyTimeMs}ms</p>
              <p className="text-xs text-muted-foreground">Verify Time</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{signingProfile.nistLevel || '—'}</p>
              <p className="text-xs text-muted-foreground">NIST Level</p>
            </div>
            <div>
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded border font-bold ${
                  signingProfile.quantumSafe
                    ? 'bg-status-success/20 text-status-success border-status-success/50'
                    : 'bg-status-error/20 text-status-error border-status-error/50'
                }`}
              >
                {signingProfile.quantumSafe ? 'Quantum-Safe' : 'Vulnerable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust score */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">Data Authenticity Trust Score</h4>
        <div className="flex items-center gap-4">
          <div
            className={`text-3xl font-bold ${
              trustScore >= 80
                ? 'text-status-success'
                : trustScore >= 60
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {trustScore}/100
          </div>
          <div className="flex-1">
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  trustScore >= 80
                    ? 'bg-status-success'
                    : trustScore >= 60
                      ? 'bg-status-warning'
                      : 'bg-status-error'
                }`}
                style={{ width: `${trustScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on dataset risk ({scenario.riskLevel}), {enabledLayers.size} verification
              layers, and {signingProfile.quantumSafe ? 'PQC' : 'classical'} signing
            </p>
          </div>
        </div>
      </div>

      <KatValidationPanel
        specs={AI_SECURITY_KAT_SPECS}
        label="AI Security PQC Known Answer Tests"
        authorityNote="NIST AI RMF · FIPS 204 · SP 800-38D"
      />
    </div>
  )
}
