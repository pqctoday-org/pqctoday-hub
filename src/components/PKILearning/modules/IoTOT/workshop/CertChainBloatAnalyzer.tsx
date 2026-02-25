import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import {
  CERT_ALGORITHM_OPTIONS,
  CERT_BASE_OVERHEAD,
  CERT_MITIGATIONS,
  type CertAlgorithmOption,
} from '../constants'

function calcCertSize(algo: CertAlgorithmOption, isRoot: boolean): number {
  // Root CA: self-signed (1 signature), others: issuer signature
  return CERT_BASE_OVERHEAD + algo.publicKeyBytes + algo.signatureBytes * (isRoot ? 1 : 1)
}

export const CertChainBloatAnalyzer: React.FC = () => {
  const [rootAlgoId, setRootAlgoId] = useState('ecdsa-p256')
  const [intAlgoId, setIntAlgoId] = useState('ecdsa-p256')
  const [eeAlgoId, setEeAlgoId] = useState('ecdsa-p256')
  const [ramBudgetKB, setRamBudgetKB] = useState(50)
  const [activeMitigations, setActiveMitigations] = useState<string[]>([])

  const rootAlgo =
    CERT_ALGORITHM_OPTIONS.find((a) => a.id === rootAlgoId) ?? CERT_ALGORITHM_OPTIONS[0]
  const intAlgo =
    CERT_ALGORITHM_OPTIONS.find((a) => a.id === intAlgoId) ?? CERT_ALGORITHM_OPTIONS[0]
  const eeAlgo = CERT_ALGORITHM_OPTIONS.find((a) => a.id === eeAlgoId) ?? CERT_ALGORITHM_OPTIONS[0]

  const rawChain = useMemo(() => {
    const root = calcCertSize(rootAlgo, true)
    const intermediate = calcCertSize(intAlgo, false)
    // EE cert signed by intermediate's algorithm
    const ee = calcCertSize(eeAlgo, false)
    return { root, intermediate, ee, total: root + intermediate + ee }
  }, [rootAlgo, intAlgo, eeAlgo])

  const effectiveReduction = useMemo(() => {
    if (activeMitigations.length === 0) return 0
    // Session resumption eliminates certs entirely
    if (activeMitigations.includes('resumption')) return 90
    // Combine other mitigations (non-multiplicative, take max + partial credit)
    const reductions = activeMitigations
      .map((id) => CERT_MITIGATIONS.find((m) => m.id === id)?.reductionPercent ?? 0)
      .sort((a, b) => b - a)
    // First mitigation: full effect, subsequent: 50% of remaining
    let total = reductions[0]
    for (let i = 1; i < reductions.length; i++) {
      total = total + (100 - total) * (reductions[i] / 100) * 0.5
    }
    return Math.min(total, 95)
  }, [activeMitigations])

  const mitigatedTotal = Math.round(rawChain.total * (1 - effectiveReduction / 100))
  const ramPct = (mitigatedTotal / (ramBudgetKB * 1024)) * 100
  const exceedsRAM = ramPct > 100

  const toggleMitigation = (id: string) => {
    setActiveMitigations((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Build a 3-level certificate chain by selecting algorithms for Root CA, Intermediate CA, and
        End Entity. Observe the total chain size and apply mitigations to reduce the bloat.
      </p>

      {/* Chain Builder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AlgoSelector
          label="Root CA"
          value={rootAlgoId}
          onChange={setRootAlgoId}
          certSize={rawChain.root}
        />
        <AlgoSelector
          label="Intermediate CA"
          value={intAlgoId}
          onChange={setIntAlgoId}
          certSize={rawChain.intermediate}
        />
        <AlgoSelector
          label="End Entity"
          value={eeAlgoId}
          onChange={setEeAlgoId}
          certSize={rawChain.ee}
        />
      </div>

      {/* Chain Size Visualization */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-foreground">Total Chain Size</div>
          <div className="text-right">
            {activeMitigations.length > 0 ? (
              <>
                <span className="text-sm text-muted-foreground line-through mr-2">
                  {(rawChain.total / 1024).toFixed(1)} KB
                </span>
                <span className="text-lg font-bold font-mono text-primary">
                  {(mitigatedTotal / 1024).toFixed(1)} KB
                </span>
              </>
            ) : (
              <span className="text-lg font-bold font-mono text-primary">
                {(rawChain.total / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        {/* Stacked bar visualization */}
        <div className="space-y-2">
          {[
            { label: 'Root CA', bytes: rawChain.root, color: 'bg-primary/60' },
            { label: 'Intermediate', bytes: rawChain.intermediate, color: 'bg-secondary/60' },
            { label: 'End Entity', bytes: rawChain.ee, color: 'bg-success/60' },
          ].map((item) => {
            const pct = (item.bytes / rawChain.total) * 100
            return (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-foreground">
                    {(item.bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RAM Budget Slider */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-foreground">Device RAM Budget</div>
          <div className="text-sm font-bold font-mono text-foreground">{ramBudgetKB} KB</div>
        </div>
        <input
          type="range"
          min={10}
          max={256}
          step={1}
          value={ramBudgetKB}
          onChange={(e) => setRamBudgetKB(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>10 KB (Class 0/1)</span>
          <span>50 KB (Class 2)</span>
          <span>256 KB (Class 3)</span>
        </div>

        {/* RAM usage indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-muted-foreground">
              Chain uses {ramPct.toFixed(0)}% of device RAM
            </span>
            <span className="font-mono text-foreground">
              {(mitigatedTotal / 1024).toFixed(1)} / {ramBudgetKB} KB
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                exceedsRAM ? 'bg-destructive/70' : ramPct > 50 ? 'bg-warning/70' : 'bg-success/70'
              }`}
              style={{ width: `${Math.min(ramPct, 100)}%` }}
            />
          </div>
        </div>

        {exceedsRAM && (
          <div className="flex items-start gap-2 mt-2 text-xs text-destructive">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              Certificate chain exceeds device RAM. Apply mitigations below or use a smaller
              algorithm.
            </span>
          </div>
        )}
      </div>

      {/* Mitigations */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Mitigations</div>
        <div className="space-y-2">
          {CERT_MITIGATIONS.map((mit) => {
            const active = activeMitigations.includes(mit.id)
            return (
              <button
                key={mit.id}
                onClick={() => toggleMitigation(mit.id)}
                className={`w-full text-left rounded-lg p-3 border transition-colors ${
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/30 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        active ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {active && (
                        <svg
                          className="w-3 h-3 text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">{mit.name}</span>
                  </div>
                  <span className="text-xs font-mono text-primary">-{mit.reductionPercent}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-6">{mit.description}</p>
                <div className="text-[10px] text-muted-foreground mt-0.5 ml-6 font-mono">
                  {mit.rfc}
                </div>
              </button>
            )
          })}
        </div>

        {activeMitigations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            Combined reduction: ~{effectiveReduction.toFixed(0)}% &rarr;{' '}
            <span className="font-mono text-primary">{(mitigatedTotal / 1024).toFixed(1)} KB</span>{' '}
            (from {(rawChain.total / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      {/* Cross-reference */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground">
        For a deep dive into Merkle Tree Certificates, see the{' '}
        <Link to="/learn/merkle-tree-certs" className="text-primary hover:underline font-bold">
          Merkle Tree Certificates module
        </Link>
        .
      </div>
    </div>
  )
}

function AlgoSelector({
  label,
  value,
  onChange,
  certSize,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  certSize: number
}) {
  return (
    <div className="glass-panel p-4">
      <div className="text-sm font-bold text-foreground mb-2">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
      >
        {CERT_ALGORITHM_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name} ({opt.category})
          </option>
        ))}
      </select>
      <div className="mt-2 text-xs text-muted-foreground">
        Cert size:{' '}
        <span className="font-mono text-foreground">{(certSize / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  )
}
