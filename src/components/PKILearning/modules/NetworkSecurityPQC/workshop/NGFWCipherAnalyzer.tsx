// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Shield, AlertTriangle, CheckCircle, Cpu, Zap, Info } from 'lucide-react'
import { CIPHER_SUITES, HARDWARE_TIERS } from '../data/networkConstants'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const NETSEC_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'netsec-tls-kem',
    useCase: 'TLS 1.3 key exchange (ML-KEM-768)',
    standard: 'RFC 8446 + FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'netsec-ids-sign',
    useCase: 'IDS rule signature integrity (ML-DSA-65)',
    standard: 'FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'IDS rule payload: alert tcp any any -> any 443 (content:"ClientHello";sid:1000001)',
  },
  {
    id: 'netsec-traffic-encrypt',
    useCase: 'Inspection tunnel encryption (AES-256-CTR)',
    standard: 'SP 800-38A ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/a/final',
    kind: { type: 'aesctr-roundtrip' },
  },
  {
    id: 'netsec-hmac-integrity',
    useCase: 'Firewall rule HMAC integrity generation',
    standard: 'FIPS 198-1',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/198-1/final',
    kind: { type: 'hmac-generate', hashAlg: 'SHA-256' },
  },
]

type CipherMode = 'classical' | 'hybrid' | 'pqc'

const MODE_LABELS: Record<CipherMode, { label: string; colorClass: string; bg: string }> = {
  classical: {
    label: 'Classical Only',
    colorClass: 'text-status-error',
    bg: 'bg-destructive/5 border-destructive/30',
  },
  hybrid: {
    label: 'Hybrid (Classical + PQC)',
    colorClass: 'text-status-warning',
    bg: 'bg-warning/5 border-warning/30',
  },
  pqc: {
    label: 'Pure PQC',
    colorClass: 'text-status-success',
    bg: 'bg-success/5 border-success/30',
  },
}

function BarMeter({
  value,
  max,
  label,
  colorClass,
}: {
  value: number
  max: number
  label: string
  colorClass: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-bold ${colorClass}`}>{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct > 70 ? 'bg-status-error' : pct > 40 ? 'bg-status-warning' : 'bg-status-success'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export const NGFWCipherAnalyzer: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<CipherMode>('classical')
  const [selectedHardwareTier, setSelectedHardwareTier] = useState('mid-range')
  const [pqcEnabled, setPqcEnabled] = useState(false)

  const hardwareTierItems = HARDWARE_TIERS.map((t) => ({ id: t.id, label: t.name }))
  const selectedTierData = HARDWARE_TIERS.find((t) => t.id === selectedHardwareTier)

  const relevantSuites = useMemo(() => {
    return CIPHER_SUITES.filter((s) => s.type === selectedMode)
  }, [selectedMode])

  const primarySuite = relevantSuites[0]

  const analysis = useMemo(() => {
    if (!primarySuite || !selectedTierData) return null

    const baseline = CIPHER_SUITES.find((s) => s.id === 'tls13-x25519-aes256')!
    const certOverheadPct = Math.round(
      ((primarySuite.certSizeKB - baseline.certSizeKB) / baseline.certSizeKB) * 100
    )
    const latencyOverheadMs = primarySuite.handshakeMs - baseline.handshakeMs
    const softwareThroughputFactor =
      primarySuite.type === 'classical' ? 1.0 : primarySuite.type === 'hybrid' ? 0.72 : 0.55
    const hardwareThroughputFactor =
      primarySuite.type === 'classical'
        ? 1.0
        : primarySuite.hardwareOffloadRequired && selectedTierData.supportsHardwareOffload
          ? 0.9
          : 0.6

    const effectiveFactor = selectedTierData.supportsHardwareOffload
      ? hardwareThroughputFactor
      : softwareThroughputFactor

    const effectiveConnsSec = Math.round(selectedTierData.maxConnectionsSec * effectiveFactor)

    return {
      certOverheadPct,
      latencyOverheadMs,
      effectiveConnsSec,
      effectiveFactor,
      offloadAvailable:
        selectedTierData.supportsHardwareOffload && !primarySuite.hardwareOffloadRequired,
      offloadNeeded:
        primarySuite.hardwareOffloadRequired && !selectedTierData.supportsHardwareOffload,
    }
  }, [primarySuite, selectedTierData])

  const handleTogglePQC = () => {
    const next = !pqcEnabled
    setPqcEnabled(next)
    if (next) setSelectedMode('hybrid')
    else setSelectedMode('classical')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">NGFW Cipher Policy Analyzer</h3>
        <p className="text-sm text-muted-foreground">
          Configure your NGFW cipher policy and observe the impact of enabling PQC — including
          certificate size increases, handshake latency, and hardware offload requirements.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-panel p-5">
        <h4 className="text-sm font-bold text-foreground mb-4">Policy Configuration</h4>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-2">Hardware Platform</div>
            <FilterDropdown
              items={hardwareTierItems}
              selectedId={selectedHardwareTier}
              onSelect={setSelectedHardwareTier}
              label="Platform"
              defaultLabel="Select tier"
              noContainer
            />
          </div>

          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-2">Cipher Mode</div>
            <div className="flex gap-2">
              {(['classical', 'hybrid', 'pqc'] as CipherMode[]).map((mode) => (
                <Button
                  variant="ghost"
                  key={mode}
                  onClick={() => {
                    setSelectedMode(mode)
                    setPqcEnabled(mode !== 'classical')
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                    selectedMode === mode
                      ? mode === 'classical'
                        ? 'bg-destructive/20 text-status-error border-destructive/50'
                        : mode === 'hybrid'
                          ? 'bg-warning/20 text-status-warning border-warning/50'
                          : 'bg-success/20 text-status-success border-success/50'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {mode === 'classical' ? 'Classical' : mode === 'hybrid' ? 'Hybrid' : 'Pure PQC'}
                </Button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant={pqcEnabled ? 'outline' : 'gradient'}
              onClick={handleTogglePQC}
              className="flex items-center gap-2"
            >
              <Shield size={14} />
              {pqcEnabled ? 'Disable PQC' : 'Enable PQC'}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Policy */}
      {primarySuite && (
        <div className={`glass-panel p-5 border-2 ${MODE_LABELS[selectedMode].bg}`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className={MODE_LABELS[selectedMode].colorClass} />
            <h4 className="text-sm font-bold text-foreground">Active Cipher Policy</h4>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                selectedMode === 'classical'
                  ? 'bg-destructive/10 text-status-error border-destructive/30'
                  : selectedMode === 'hybrid'
                    ? 'bg-warning/10 text-status-warning border-warning/30'
                    : 'bg-success/10 text-status-success border-success/30'
              }`}
            >
              {MODE_LABELS[selectedMode].label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] text-muted-foreground mb-1">Key Exchange</div>
              <div className="text-xs font-bold text-foreground">{primarySuite.keyExchange}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] text-muted-foreground mb-1">Authentication</div>
              <div className="text-xs font-bold text-foreground">{primarySuite.authentication}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] text-muted-foreground mb-1">Cert Size</div>
              <div className={`text-xs font-bold ${MODE_LABELS[selectedMode].colorClass}`}>
                {primarySuite.certSizeKB} KB
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] text-muted-foreground mb-1">Handshake</div>
              <div className={`text-xs font-bold ${MODE_LABELS[selectedMode].colorClass}`}>
                ~{primarySuite.handshakeMs}ms
              </div>
            </div>
          </div>

          {/* Quantum safe indicator */}
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              primarySuite.quantumSafe
                ? 'bg-success/10 border-success/30'
                : 'bg-destructive/10 border-destructive/30'
            } border text-xs`}
          >
            {primarySuite.quantumSafe ? (
              <CheckCircle size={14} className="text-status-success shrink-0" />
            ) : (
              <AlertTriangle size={14} className="text-status-error shrink-0" />
            )}
            <span
              className={primarySuite.quantumSafe ? 'text-status-success' : 'text-status-error'}
            >
              {primarySuite.quantumSafe
                ? 'Quantum-safe: This cipher suite protects against harvest-now-decrypt-later attacks'
                : 'Quantum-vulnerable: Key exchange can be broken by a cryptographically relevant quantum computer (CRQC)'}
            </span>
          </div>
        </div>
      )}

      {/* Impact Analysis */}
      {analysis && primarySuite && selectedTierData && (
        <div className="glass-panel p-5">
          <h4 className="text-sm font-bold text-foreground mb-4">Impact Analysis</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <BarMeter
                value={primarySuite.certSizeKB * 1000}
                max={5200}
                label="Certificate Size (bytes)"
                colorClass={MODE_LABELS[selectedMode].colorClass}
              />
              <BarMeter
                value={primarySuite.handshakeMs}
                max={30}
                label="Handshake Latency (ms)"
                colorClass={MODE_LABELS[selectedMode].colorClass}
              />
              <BarMeter
                value={analysis.effectiveConnsSec}
                max={selectedTierData.maxConnectionsSec}
                label="Effective Connections/sec"
                colorClass="text-primary"
              />
            </div>

            <div className="space-y-3">
              {analysis.certOverheadPct > 0 && (
                <div className="bg-warning/5 rounded-lg p-3 border border-warning/30 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-status-warning">
                      +{analysis.certOverheadPct}% cert size increase
                    </span>{' '}
                    vs classical baseline. Ensure NGFW buffer sizes are updated.
                  </div>
                </div>
              )}
              {analysis.latencyOverheadMs > 0 && (
                <div className="bg-warning/5 rounded-lg p-3 border border-warning/30 flex items-start gap-2">
                  <Zap size={14} className="text-status-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-status-warning">
                      +{analysis.latencyOverheadMs}ms handshake latency
                    </span>{' '}
                    additional overhead per new connection.
                  </div>
                </div>
              )}
              {analysis.offloadNeeded && (
                <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/30 flex items-start gap-2">
                  <Cpu size={14} className="text-status-error shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-status-error">Hardware offload required</span>{' '}
                    for optimal PQC performance, but not available on{' '}
                    <em>{selectedTierData.name}</em>. Expect{' '}
                    {Math.round((1 - analysis.effectiveFactor) * 100)}% throughput reduction.
                  </div>
                </div>
              )}
              {!analysis.offloadNeeded && selectedMode !== 'classical' && (
                <div className="bg-success/5 rounded-lg p-3 border border-success/30 flex items-start gap-2">
                  <Cpu size={14} className="text-status-success shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-status-success">
                      Hardware offload available
                    </span>{' '}
                    on {selectedTierData.name} — PQC operations accelerated by dedicated crypto
                    ASIC.
                  </div>
                </div>
              )}
              <div className="bg-muted/50 rounded-lg p-3 border border-border flex items-start gap-2">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {selectedTierData.pqcRecommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="glass-panel p-5">
        <h4 className="text-sm font-bold text-foreground mb-4">Cipher Policy Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Policy</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Key Exchange
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Cert (KB)
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Latency (ms)
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  HW Offload
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Quantum-Safe
                </th>
              </tr>
            </thead>
            <tbody>
              {CIPHER_SUITES.map((suite) => (
                <tr
                  key={suite.id}
                  className={`border-b border-border/50 transition-colors ${suite.type === selectedMode ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 px-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        suite.type === 'classical'
                          ? 'bg-destructive/10 text-status-error'
                          : suite.type === 'hybrid'
                            ? 'bg-warning/10 text-status-warning'
                            : 'bg-success/10 text-status-success'
                      }`}
                    >
                      {suite.type === 'classical'
                        ? 'Classical'
                        : suite.type === 'hybrid'
                          ? 'Hybrid'
                          : 'Pure PQC'}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-mono text-[10px] text-foreground">
                    {suite.keyExchange}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-mono ${
                      suite.certSizeKB > 3 ? 'text-status-warning' : 'text-foreground'
                    }`}
                  >
                    {suite.certSizeKB}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-mono ${
                      suite.handshakeMs > 15 ? 'text-status-warning' : 'text-foreground'
                    }`}
                  >
                    {suite.handshakeMs}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {suite.hardwareOffloadRequired ? (
                      <span className="text-status-warning">Required</span>
                    ) : (
                      <span className="text-muted-foreground">Optional</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {suite.quantumSafe ? (
                      <CheckCircle size={12} className="text-status-success inline" />
                    ) : (
                      <AlertTriangle size={12} className="text-status-error inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <KatValidationPanel
        specs={NETSEC_KAT_SPECS}
        label="Network Security PQC Known Answer Tests"
        authorityNote="RFC 8446 · FIPS 203 · FIPS 204 · SP 800-38A"
      />
    </div>
  )
}
