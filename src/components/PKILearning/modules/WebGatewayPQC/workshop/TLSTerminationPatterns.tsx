// SPDX-License-Identifier: GPL-3.0-only

import React, { useState, useMemo } from 'react'
import { Eye, EyeOff, Lock, Unlock, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { TERMINATION_PATTERNS, type TerminationPattern } from '../data/gatewayData'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const GATEWAY_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'gw-cert-sign',
    useCase: 'CDN edge certificate signing (ML-DSA-65)',
    standard: 'FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'CDN edge certificate: CN=cdn.pqc.example,SAN=*.pqc.example',
  },
  {
    id: 'gw-tls-kem',
    useCase: 'Gateway TLS key exchange (ML-KEM-768)',
    standard: 'FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'gw-api-encrypt',
    useCase: 'API gateway request encryption',
    standard: 'SP 800-38D',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-functional' },
    message: 'API gateway request: X-PQC-Policy=enforce,method=POST,path=/v1/data',
  },
]

type CryptoMode = 'classical' | 'pqc-hybrid'

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

const PatternFlow: React.FC<{
  pattern: TerminationPattern
  cryptoMode: CryptoMode
}> = ({ pattern, cryptoMode }) => {
  const overhead =
    cryptoMode === 'pqc-hybrid'
      ? pattern.bandwidthOverheadBytes.pqcHybrid
      : pattern.bandwidthOverheadBytes.classical
  const latency =
    cryptoMode === 'pqc-hybrid'
      ? pattern.latencyOverheadMs.pqcHybrid
      : pattern.latencyOverheadMs.classical

  return (
    <div className="space-y-4">
      {/* Flow Diagram */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="space-y-3">
          {pattern.steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  step.encrypted
                    ? 'border-status-success bg-status-success/10'
                    : 'border-status-warning bg-status-warning/10'
                }`}
              >
                {step.encrypted ? (
                  <Lock size={14} className="text-status-success" />
                ) : (
                  <Unlock size={14} className="text-status-warning" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{step.label}</div>
                <div className="text-xs text-muted-foreground">
                  {step.algorithm}
                  {cryptoMode === 'pqc-hybrid' &&
                    step.encrypted &&
                    step.algorithm.includes('TLS 1.3') &&
                    ' + X25519MLKEM768'}
                </div>
              </div>
              {idx < pattern.steps.length - 1 && (
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">{formatBytes(overhead)}</div>
          <div className="text-xs text-muted-foreground">Bandwidth</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">{latency} ms</div>
          <div className="text-xs text-muted-foreground">Latency</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">{pattern.certsRequired}</div>
          <div className="text-xs text-muted-foreground">Certs</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center">
            {pattern.wafCanInspect ? (
              <Eye size={18} className="text-status-success" />
            ) : (
              <EyeOff size={18} className="text-status-error" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">WAF Inspect</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center">
            {pattern.gatewayHoldsKey ? (
              <Lock size={18} className="text-status-warning" />
            ) : (
              <Unlock size={18} className="text-status-success" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">GW Key</div>
        </div>
      </div>
    </div>
  )
}

export const TLSTerminationPatterns: React.FC = () => {
  const [selectedPatternId, setSelectedPatternId] = useState(TERMINATION_PATTERNS[0].id)
  const [cryptoMode, setCryptoMode] = useState<CryptoMode>('classical')
  const [compareMode, setCompareMode] = useState(false)
  const [comparePatternId, setComparePatternId] = useState(TERMINATION_PATTERNS[1].id)

  const selectedPattern = useMemo(
    () => TERMINATION_PATTERNS.find((p) => p.id === selectedPatternId) ?? TERMINATION_PATTERNS[0],
    [selectedPatternId]
  )

  const comparePattern = useMemo(
    () => TERMINATION_PATTERNS.find((p) => p.id === comparePatternId) ?? TERMINATION_PATTERNS[1],
    [comparePatternId]
  )

  const patternItems = TERMINATION_PATTERNS.map((p) => ({
    id: p.id,
    label: p.name,
  }))

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-bold text-foreground mb-1">Pattern</div>
          <FilterDropdown
            items={patternItems}
            selectedId={selectedPatternId}
            onSelect={setSelectedPatternId}
            noContainer
          />
        </div>

        {/* Crypto mode toggle */}
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Crypto Mode</div>
          <Button
            variant="ghost"
            onClick={() =>
              setCryptoMode((prev) => (prev === 'classical' ? 'pqc-hybrid' : 'classical'))
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm"
          >
            {cryptoMode === 'classical' ? (
              <ToggleLeft size={18} className="text-status-warning" />
            ) : (
              <ToggleRight size={18} className="text-status-success" />
            )}
            <span className="text-foreground">
              {cryptoMode === 'classical' ? 'Classical' : 'PQC Hybrid'}
            </span>
          </Button>
        </div>

        {/* Compare toggle */}
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Compare</div>
          <Button
            variant="ghost"
            onClick={() => setCompareMode((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
              compareMode
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            {compareMode ? 'Side-by-Side On' : 'Compare Off'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {compareMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <FilterDropdown
                items={patternItems}
                selectedId={selectedPatternId}
                onSelect={setSelectedPatternId}
                noContainer
              />
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-sm font-bold text-foreground mb-1">{selectedPattern.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{selectedPattern.description}</p>
              <PatternFlow pattern={selectedPattern} cryptoMode={cryptoMode} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <FilterDropdown
                items={patternItems.filter((p) => p.id !== selectedPatternId)}
                selectedId={comparePatternId}
                onSelect={setComparePatternId}
                noContainer
              />
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-sm font-bold text-foreground mb-1">{comparePattern.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{comparePattern.description}</p>
              <PatternFlow pattern={comparePattern} cryptoMode={cryptoMode} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="glass-panel p-4">
            <h3 className="text-lg font-bold text-foreground mb-1">{selectedPattern.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedPattern.description}</p>
            <PatternFlow pattern={selectedPattern} cryptoMode={cryptoMode} />
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="text-xs font-bold text-foreground mb-3">Pattern Comparison Summary</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 pr-3">Pattern</th>
                <th className="pb-2 pr-3">Classical BW</th>
                <th className="pb-2 pr-3">PQC Hybrid BW</th>
                <th className="pb-2 pr-3">Increase</th>
                <th className="pb-2 pr-3">WAF</th>
                <th className="pb-2">Certs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TERMINATION_PATTERNS.map((p) => {
                const increase =
                  p.bandwidthOverheadBytes.classical > 0
                    ? Math.round(
                        ((p.bandwidthOverheadBytes.pqcHybrid - p.bandwidthOverheadBytes.classical) /
                          p.bandwidthOverheadBytes.classical) *
                          100
                      )
                    : 0
                return (
                  <tr key={p.id}>
                    <td className="py-1.5 pr-3 font-medium text-foreground">{p.name}</td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                      {formatBytes(p.bandwidthOverheadBytes.classical)}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                      {formatBytes(p.bandwidthOverheadBytes.pqcHybrid)}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-status-warning">
                      {increase > 0 ? `+${increase}%` : '\u2014'}
                    </td>
                    <td className="py-1.5 pr-3">
                      {p.wafCanInspect ? (
                        <Eye size={12} className="text-status-success" />
                      ) : (
                        <EyeOff size={12} className="text-status-error" />
                      )}
                    </td>
                    <td className="py-1.5 text-muted-foreground">{p.certsRequired}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <KatValidationPanel
        specs={GATEWAY_KAT_SPECS}
        label="Web Gateway PQC Known Answer Tests"
        authorityNote="FIPS 203 · FIPS 204 · SP 800-38D"
      />
    </div>
  )
}
