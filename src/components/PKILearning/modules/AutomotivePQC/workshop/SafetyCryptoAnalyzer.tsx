// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Shield, AlertTriangle, CheckCircle, Clock, Car, Info } from 'lucide-react'
import type { ASILLevel, AutomotiveFunction } from '../data/automotiveConstants'
import { ASIL_COLORS, ASIL_LABELS, FAIL_MODE_LABELS } from '../data/automotiveConstants'
import { AUTOMOTIVE_FUNCTIONS, ASIL_CRYPTO_REQUIREMENTS } from '../data/safetyCryptoData'
import type { AutomotiveFunctionProfile } from '../data/safetyCryptoData'
import { ALGORITHM_THROUGHPUT } from '../data/sensorFusionData'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const AUTOMOTIVE_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'auto-v2x-sigver',
    useCase: 'V2X Basic Safety Message signing (ML-DSA-44)',
    standard: 'IEEE 1609.2 + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 44 },
    message: 'IEEE 1609.2 BSM: msgCount=42,tempId=0xA7B3,latitude=37.7749,longitude=-122.4194',
  },
  {
    id: 'auto-carkey-kem',
    useCase: 'Digital car key auth (ML-KEM-768)',
    standard: 'CCC Digital Key 3.0 + FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'auto-ota-encrypt',
    useCase: 'OTA firmware manifest encryption',
    standard: 'UNECE WP.29 R155 + SP 800-38D',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-functional' },
    message: 'OTA firmware manifest: version=3.2.1,targetECU=TCU,digest=8c4f...',
  },
  {
    id: 'auto-secoc-cmac',
    useCase: 'SecOC message authentication (AES-CMAC)',
    standard: 'AUTOSAR SecOC + NIST SP 800-38B',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/b/final',
    kind: { type: 'aescmac-verify' },
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ASIL_SORT_ORDER: Record<ASILLevel, number> = { D: 0, C: 1, B: 2, A: 3, QM: 4 }

function timingStatus(verificationTimeMs: number, maxMs: number): 'pass' | 'tight' | 'fail' {
  if (verificationTimeMs <= maxMs) return 'pass'
  if (verificationTimeMs <= maxMs * 2) return 'tight'
  return 'fail'
}

function timingStatusColors(status: 'pass' | 'tight' | 'fail') {
  switch (status) {
    case 'pass':
      return 'bg-status-success/20 text-status-success border-status-success/30'
    case 'tight':
      return 'bg-status-warning/20 text-status-warning border-status-warning/30'
    case 'fail':
      return 'bg-status-error/20 text-status-error border-status-error/30'
  }
}

function timingStatusLabel(status: 'pass' | 'tight' | 'fail') {
  switch (status) {
    case 'pass':
      return 'Feasible'
    case 'tight':
      return 'Marginal'
    case 'fail':
      return 'Exceeds'
  }
}

// Sort functions by ASIL level (D first, QM last)
const sortedFunctions = [...AUTOMOTIVE_FUNCTIONS].sort(
  (a, b) => ASIL_SORT_ORDER[a.asilLevel] - ASIL_SORT_ORDER[b.asilLevel]
)

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FunctionCard({
  fn,
  isSelected,
  onSelect,
}: {
  fn: AutomotiveFunctionProfile
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onSelect}
      className={`text-left rounded-lg border p-3 transition-all ${
        isSelected
          ? 'border-primary ring-1 ring-primary/40'
          : 'border-border hover:border-primary/30'
      } bg-card`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-bold text-foreground leading-tight">{fn.name}</h4>
        <span
          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${ASIL_COLORS[fn.asilLevel]}`}
        >
          {ASIL_LABELS[fn.asilLevel]}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {fn.maxVerificationMs} ms max
        </span>
        <span className="flex items-center gap-1">
          <Shield size={10} />
          {FAIL_MODE_LABELS[fn.failMode]}
        </span>
      </div>
    </Button>
  )
}

function FunctionDetail({ fn }: { fn: AutomotiveFunctionProfile }) {
  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Car size={16} className="text-primary" />
        <h4 className="text-sm font-bold text-foreground">{fn.name}</h4>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ASIL_COLORS[fn.asilLevel]}`}
        >
          {ASIL_LABELS[fn.asilLevel]}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
          {FAIL_MODE_LABELS[fn.failMode]}
        </span>
      </div>

      {/* Crypto in Path */}
      <div>
        <p className="text-xs font-bold text-foreground mb-1.5">Cryptography in Critical Path</p>
        <div className="flex flex-wrap gap-1.5">
          {fn.cryptoInPath.map((cp) => (
            <span
              key={cp}
              className="text-[10px] px-2 py-1 rounded bg-muted border border-border text-foreground"
            >
              {cp}
            </span>
          ))}
        </div>
      </div>

      {/* Fail Mode Description */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
          <Shield size={12} className="text-status-warning" />
          Failure Behavior
        </p>
        <p className="text-xs text-muted-foreground">{fn.failModeDescription}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Quantum Risk */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-status-error" />
            Quantum Risk
          </p>
          <p className="text-xs text-muted-foreground">{fn.quantumRisk}</p>
        </div>

        {/* PQC Constraint */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <Clock size={12} className="text-status-info" />
            PQC Constraint
          </p>
          <p className="text-xs text-muted-foreground">{fn.pqcConstraint}</p>
        </div>

        {/* PQC Design Pattern */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <CheckCircle size={12} className="text-status-success" />
            Recommended Design Pattern
          </p>
          <p className="text-xs text-muted-foreground">{fn.pqcDesignPattern}</p>
        </div>
      </div>
    </div>
  )
}

function RiskMatrixHeatmap() {
  return (
    <div className="glass-panel p-4">
      <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
        <AlertTriangle size={16} className="text-status-warning" />
        PQC Timing Feasibility Matrix
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Verification time vs. maximum allowed time per function. Green = feasible, yellow = within
        2x budget (marginal), red = exceeds 2x budget.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">Function</th>
              <th className="text-center p-2 text-muted-foreground font-medium text-[10px]">
                Budget
              </th>
              {ALGORITHM_THROUGHPUT.map((alg) => (
                <th
                  key={alg.algorithm}
                  className="text-center p-2 text-muted-foreground font-medium text-[10px]"
                >
                  {alg.algorithm}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedFunctions.map((fn, idx) => (
              <tr key={fn.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded border ${ASIL_COLORS[fn.asilLevel]}`}
                    >
                      {fn.asilLevel}
                    </span>
                    <span className="text-xs text-foreground font-medium whitespace-nowrap">
                      {fn.name}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-center">
                  <span className="text-xs font-mono text-foreground">
                    {fn.maxVerificationMs}ms
                  </span>
                </td>
                {ALGORITHM_THROUGHPUT.map((alg) => {
                  const status = timingStatus(alg.verificationTimeMs, fn.maxVerificationMs)
                  const colors = timingStatusColors(status)
                  return (
                    <td key={alg.algorithm} className="p-1.5 text-center">
                      <div
                        className={`rounded px-1.5 py-1 border text-[10px] font-mono font-bold ${colors}`}
                        title={`${alg.algorithm}: ${alg.verificationTimeMs}ms vs ${fn.maxVerificationMs}ms budget — ${timingStatusLabel(status)}`}
                      >
                        {alg.verificationTimeMs}ms
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="w-3 h-3 rounded bg-status-success/20 border border-status-success/30" />
          <span className="text-muted-foreground">Feasible (within budget)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="w-3 h-3 rounded bg-status-warning/20 border border-status-warning/30" />
          <span className="text-muted-foreground">Marginal (within 2x budget)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="w-3 h-3 rounded bg-status-error/20 border border-status-error/30" />
          <span className="text-muted-foreground">Exceeds (over 2x budget)</span>
        </div>
      </div>
    </div>
  )
}

function ASILRequirementsTable() {
  return (
    <div className="glass-panel p-4">
      <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
        <Info size={16} className="text-primary" />
        ISO 26262 ASIL Crypto Requirements
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        How each ASIL level maps to cryptographic verification requirements and PQC migration
        impact.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">ASIL</th>
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                Diagnostic Coverage
              </th>
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                Crypto Requirement
              </th>
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                Redundancy
              </th>
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                PQC Impact
              </th>
            </tr>
          </thead>
          <tbody>
            {ASIL_CRYPTO_REQUIREMENTS.map((req, idx) => (
              <tr key={req.asilLevel} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                <td className="p-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ASIL_COLORS[req.asilLevel]}`}
                  >
                    {ASIL_LABELS[req.asilLevel]}
                  </span>
                </td>
                <td className="p-2 text-xs text-foreground font-mono">{req.diagnosticCoverage}</td>
                <td className="p-2 text-xs text-foreground">{req.cryptoRequirement}</td>
                <td className="p-2 text-xs text-foreground">{req.redundancyLevel}</td>
                <td className="p-2 text-xs text-muted-foreground">{req.pqcImpact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const SafetyCryptoAnalyzer: React.FC = () => {
  const [selectedFunction, setSelectedFunction] = useState<AutomotiveFunction>('braking')

  const selectedProfile = useMemo(
    () => AUTOMOTIVE_FUNCTIONS.find((f) => f.id === selectedFunction)!,
    [selectedFunction]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Map ISO 26262 ASIL levels to cryptographic verification requirements and evaluate whether
        PQC algorithms can meet the real-time timing budgets of safety-critical automotive
        functions.
      </p>

      {/* Function Selector */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Car size={16} className="text-primary" />
          Select Automotive Function
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AUTOMOTIVE_FUNCTIONS.map((fn) => (
            <FunctionCard
              key={fn.id}
              fn={fn}
              isSelected={selectedFunction === fn.id}
              onSelect={() => setSelectedFunction(fn.id)}
            />
          ))}
        </div>
      </div>

      {/* Selected Function Detail */}
      <FunctionDetail fn={selectedProfile} />

      {/* Risk Matrix Heatmap */}
      <RiskMatrixHeatmap />

      {/* ASIL Requirements Summary */}
      <ASILRequirementsTable />

      <KatValidationPanel
        specs={AUTOMOTIVE_KAT_SPECS}
        label="Automotive PQC Known Answer Tests"
        authorityNote="IEEE 1609.2 · CCC DK 3.0 · UNECE R155"
      />
    </div>
  )
}
