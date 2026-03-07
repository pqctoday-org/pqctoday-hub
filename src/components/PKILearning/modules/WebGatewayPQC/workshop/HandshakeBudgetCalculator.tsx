// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { BarChart3, Server } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  GATEWAY_KEM_OPTIONS,
  GATEWAY_SIG_OPTIONS,
  HANDSHAKE_MITIGATIONS,
  GATEWAY_BENCHMARKS,
  calculateHandshakeSize,
  applyMitigations,
} from '../data/gatewayData'

function formatBytes(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec >= 1073741824) return `${(bytesPerSec / 1073741824).toFixed(1)} GB/s`
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${bytesPerSec} B/s`
}

const CHAIN_DEPTHS = [
  { id: '1', label: '1 (Self-signed)' },
  { id: '2', label: '2 (Root + Leaf)' },
  { id: '3', label: '3 (Root + Intermediate + Leaf)' },
]

const CONNECTIONS_PER_SEC = [
  { id: '1000', label: '1K / sec' },
  { id: '10000', label: '10K / sec' },
  { id: '100000', label: '100K / sec' },
  { id: '1000000', label: '1M / sec' },
]

export const HandshakeBudgetCalculator: React.FC = () => {
  const [selectedKEM, setSelectedKEM] = useState(GATEWAY_KEM_OPTIONS[0].id)
  const [selectedSig, setSelectedSig] = useState(GATEWAY_SIG_OPTIONS[0].id)
  const [chainDepth, setChainDepth] = useState('2')
  const [connPerSec, setConnPerSec] = useState('10000')
  const [enabledMitigations, setEnabledMitigations] = useState<string[]>([])

  const kem = useMemo(
    () => GATEWAY_KEM_OPTIONS.find((k) => k.id === selectedKEM) ?? GATEWAY_KEM_OPTIONS[0],
    [selectedKEM]
  )
  const sig = useMemo(
    () => GATEWAY_SIG_OPTIONS.find((s) => s.id === selectedSig) ?? GATEWAY_SIG_OPTIONS[0],
    [selectedSig]
  )

  const handshake = useMemo(
    () => calculateHandshakeSize(kem, sig, parseInt(chainDepth)),
    [kem, sig, chainDepth]
  )

  // Classical baseline for comparison
  const classicalHandshake = useMemo(
    () =>
      calculateHandshakeSize(GATEWAY_KEM_OPTIONS[0], GATEWAY_SIG_OPTIONS[0], parseInt(chainDepth)),
    [chainDepth]
  )

  const mitigated = useMemo(
    () => applyMitigations(handshake.total, enabledMitigations),
    [handshake.total, enabledMitigations]
  )

  const cps = parseInt(connPerSec)
  const bandwidthPerSec = mitigated.adjustedSize * cps
  const classicalBandwidthPerSec = classicalHandshake.total * cps

  const kemItems = GATEWAY_KEM_OPTIONS.map((k) => ({ id: k.id, label: k.name }))
  const sigItems = GATEWAY_SIG_OPTIONS.map((s) => ({ id: s.id, label: s.name }))

  const toggleMitigation = (id: string) => {
    setEnabledMitigations((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  // Bar chart data
  const maxSize = Math.max(handshake.total, classicalHandshake.total)

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="text-xs font-bold text-foreground mb-1">KEM Algorithm</div>
          <FilterDropdown
            items={kemItems}
            selectedId={selectedKEM}
            onSelect={setSelectedKEM}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Signature Algorithm</div>
          <FilterDropdown
            items={sigItems}
            selectedId={selectedSig}
            onSelect={setSelectedSig}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Chain Depth</div>
          <FilterDropdown
            items={CHAIN_DEPTHS}
            selectedId={chainDepth}
            onSelect={setChainDepth}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Connections / sec</div>
          <FilterDropdown
            items={CONNECTIONS_PER_SEC}
            selectedId={connPerSec}
            onSelect={setConnPerSec}
            noContainer
          />
        </div>
      </div>

      {/* Handshake Breakdown */}
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Handshake Size Breakdown</h3>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Client Hello', size: handshake.clientHello, baseline: 232 },
            { label: 'Server Hello', size: handshake.serverHello, baseline: 182 },
            {
              label: `Certificate (${chainDepth}-deep)`,
              size: handshake.certificate,
              baseline: classicalHandshake.certificate,
            },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{item.label}</span>
                <span className="font-mono text-foreground">{formatBytes(item.size)}</span>
              </div>
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-status-warning/40 rounded-full"
                  style={{
                    width: maxSize > 0 ? `${(item.baseline / maxSize) * 100}%` : '0%',
                  }}
                />
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    kem.category === 'classical' && sig.category === 'classical'
                      ? 'bg-status-success'
                      : kem.category === 'hybrid' || sig.category === 'hybrid'
                        ? 'bg-status-warning'
                        : 'bg-status-error'
                  }`}
                  style={{
                    width: maxSize > 0 ? `${(item.size / maxSize) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Handshake</span>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-foreground">
                {formatBytes(handshake.total)}
              </span>
              {handshake.total > classicalHandshake.total && (
                <span className="text-xs text-status-warning ml-2">
                  (+
                  {Math.round(
                    ((handshake.total - classicalHandshake.total) / classicalHandshake.total) * 100
                  )}
                  % vs classical)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mitigations */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Apply Mitigations</h3>
        <div className="space-y-2">
          {HANDSHAKE_MITIGATIONS.map((m) => (
            <label
              key={m.id}
              aria-label={m.name}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
            >
              <input
                type="checkbox"
                checked={enabledMitigations.includes(m.id)}
                onChange={() => toggleMitigation(m.id)}
                className="mt-0.5 accent-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-xs font-mono text-status-success">
                    -{m.reductionPercent}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
            </label>
          ))}
        </div>

        {enabledMitigations.length > 0 && (
          <div className="bg-status-success/10 rounded-lg p-3 border border-status-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">After mitigations:</span>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-status-success">
                  {formatBytes(mitigated.adjustedSize)}
                </span>
                <span className="text-xs text-status-success ml-2">
                  (-{mitigated.savingsPercent}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bandwidth Impact */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Bandwidth at {parseInt(connPerSec).toLocaleString()} conn/sec
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Classical Baseline</div>
            <div className="text-lg font-bold font-mono text-foreground">
              {formatRate(classicalBandwidthPerSec)}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Selected Config{enabledMitigations.length > 0 ? ' (mitigated)' : ''}
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {formatRate(bandwidthPerSec)}
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Capacity Benchmarks */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="text-xs font-bold text-foreground mb-3">Gateway Capacity Benchmarks</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 pr-3">Gateway</th>
                <th className="pb-2 pr-3">Classical HS/s</th>
                <th className="pb-2 pr-3">PQC Hybrid HS/s</th>
                <th className="pb-2 pr-3">Capacity vs Target</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {GATEWAY_BENCHMARKS.map((b) => {
                const ratio = b.pqcHybridHandshakesPerSec / cps
                return (
                  <tr key={b.name}>
                    <td className="py-1.5 pr-3 font-medium text-foreground">{b.name}</td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                      {b.classicalHandshakesPerSec.toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                      {b.pqcHybridHandshakesPerSec.toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span
                        className={`font-mono ${ratio >= 1 ? 'text-status-success' : 'text-status-error'}`}
                      >
                        {ratio >= 1
                          ? `${ratio.toFixed(1)}\u00d7 OK`
                          : `${ratio.toFixed(2)}\u00d7 UNDER`}
                      </span>
                    </td>
                    <td className="py-1.5 text-muted-foreground">{b.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
