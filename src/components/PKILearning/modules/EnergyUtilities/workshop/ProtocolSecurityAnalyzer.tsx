// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Network, Shield, ShieldAlert, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ENERGY_PROTOCOLS,
  getVulnerableLayers,
  getSafeLayers,
  computeBandwidthImpact,
} from '../data/substationProtocolData'
import type { EnergyProtocol } from '../data/substationProtocolData'

interface ProtocolSecurityAnalyzerProps {
  onComplete: () => void
}

const FEASIBILITY_LABEL: Record<EnergyProtocol['pqcFeasibility'], string> = {
  good: 'Good',
  challenging: 'Challenging',
  problematic: 'Problematic',
}

const FEASIBILITY_CLASSES: Record<EnergyProtocol['pqcFeasibility'], string> = {
  good: 'text-status-success bg-status-success/10',
  challenging: 'text-status-warning bg-status-warning/10',
  problematic: 'text-status-error bg-status-error/10',
}

const COMPLEXITY_CLASSES: Record<string, string> = {
  low: 'text-status-success bg-status-success/10',
  medium: 'text-status-warning bg-status-warning/10',
  high: 'text-status-error bg-status-error/10',
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export const ProtocolSecurityAnalyzer: React.FC<ProtocolSecurityAnalyzerProps> = ({
  onComplete,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const selectedProtocols = useMemo(
    () => ENERGY_PROTOCOLS.filter((p) => selectedIds.has(p.id)),
    [selectedIds]
  )

  const toggleProtocol = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (expandedId === id) setExpandedId(null)
      } else {
        next.add(id)
        setExpandedId(id)
      }
      return next
    })
  }

  const totalVulnerable = useMemo(
    () => selectedProtocols.reduce((sum, p) => sum + getVulnerableLayers(p).length, 0),
    [selectedProtocols]
  )
  const totalSafe = useMemo(
    () => selectedProtocols.reduce((sum, p) => sum + getSafeLayers(p).length, 0),
    [selectedProtocols]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select energy-sector protocols to analyze their cryptographic layers. Each protocol is
        broken down by authentication, key exchange, and transport security, showing which layers
        are quantum-vulnerable and what PQC replacements are available.
      </p>

      {/* Protocol Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ENERGY_PROTOCOLS.map((protocol) => {
          const isSelected = selectedIds.has(protocol.id)
          const vulnerable = getVulnerableLayers(protocol)
          const safe = getSafeLayers(protocol)

          return (
            <label
              key={protocol.id}
              aria-label={`Select ${protocol.name}`}
              className={`glass-panel p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProtocol(protocol.id)}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Network size={14} className="text-primary shrink-0" />
                    <span className="text-sm font-bold text-foreground">{protocol.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {protocol.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {protocol.transport}
                    </span>
                    <span
                      className={`text-[10px] rounded px-1.5 py-0.5 ${FEASIBILITY_CLASSES[protocol.pqcFeasibility]}`}
                    >
                      PQC: {FEASIBILITY_LABEL[protocol.pqcFeasibility]}
                    </span>
                    {protocol.timingRequirement && (
                      <span className="text-[10px] bg-status-info/10 text-status-info rounded px-1.5 py-0.5">
                        {protocol.timingRequirement}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="flex items-center gap-1 text-status-success">
                      <ShieldCheck size={10} /> {safe.length} safe
                    </span>
                    <span className="flex items-center gap-1 text-status-error">
                      <ShieldAlert size={10} /> {vulnerable.length} vulnerable
                    </span>
                  </div>
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Summary Bar */}
      {selectedProtocols.length > 0 && (
        <div className="glass-panel p-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-foreground font-medium">
            {selectedProtocols.length} protocol{selectedProtocols.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-status-success">
              <ShieldCheck size={12} /> {totalSafe} quantum-safe layer
              {totalSafe !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 text-status-error">
              <ShieldAlert size={12} /> {totalVulnerable} vulnerable layer
              {totalVulnerable !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Expanded Layer Breakdown */}
      {selectedProtocols.map((protocol) => {
        const isExpanded = expandedId === protocol.id
        const vulnerable = getVulnerableLayers(protocol)
        const safe = getSafeLayers(protocol)
        const bandwidth = computeBandwidthImpact(protocol)

        return (
          <div key={protocol.id} className="glass-panel overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Network size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">{protocol.name}</span>
                <span className="text-xs text-muted-foreground">({protocol.standard})</span>
              </div>
              <ArrowRight
                size={14}
                className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </Button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Safe layers */}
                {safe.map((layer) => (
                  <div
                    key={layer.layerName}
                    className="flex items-start gap-3 bg-status-success/5 rounded-lg p-3 border border-status-success/20"
                  >
                    <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {layer.layerName}
                        </span>
                        <span className="text-[10px] text-status-success bg-status-success/10 rounded px-1.5 py-0.5">
                          Quantum-safe
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{layer.currentAlgorithm}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{layer.notes}</p>
                    </div>
                  </div>
                ))}

                {/* Vulnerable layers */}
                {vulnerable.map((layer) => (
                  <div
                    key={layer.layerName}
                    className="flex items-start gap-3 bg-status-error/5 rounded-lg p-3 border border-status-error/20"
                  >
                    <ShieldAlert size={16} className="text-status-error shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {layer.layerName}
                        </span>
                        <span className="text-[10px] text-status-error bg-status-error/10 rounded px-1.5 py-0.5">
                          Quantum-vulnerable
                        </span>
                        <span
                          className={`text-[10px] rounded px-1.5 py-0.5 ${COMPLEXITY_CLASSES[layer.migrationComplexity]}`}
                        >
                          {layer.migrationComplexity} complexity
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="text-foreground">{layer.currentAlgorithm}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowRight size={10} className="text-primary" />
                          <span className="text-primary font-medium">{layer.pqcReplacement}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {formatBytes(layer.classicalMessageSizeBytes)}
                          </span>
                          <ArrowRight size={10} className="text-muted-foreground" />
                          <span className="font-mono text-foreground">
                            {formatBytes(layer.pqcMessageSizeBytes)}
                          </span>
                          {layer.classicalMessageSizeBytes > 0 && (
                            <span className="text-status-warning text-[10px]">
                              (
                              {(
                                layer.pqcMessageSizeBytes / layer.classicalMessageSizeBytes
                              ).toFixed(1)}
                              x)
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 italic">{layer.notes}</p>
                    </div>
                  </div>
                ))}

                {/* Bandwidth impact for this protocol */}
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Bandwidth Impact</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Classical: {formatBytes(bandwidth.classicalTotal)}
                    </span>
                    <ArrowRight size={10} className="text-muted-foreground" />
                    <span className="font-mono text-foreground">
                      PQC: {formatBytes(bandwidth.pqcTotal)}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        parseFloat(bandwidth.multiplier) > 5
                          ? 'text-status-error bg-status-error/10'
                          : parseFloat(bandwidth.multiplier) > 2
                            ? 'text-status-warning bg-status-warning/10'
                            : 'text-status-success bg-status-success/10'
                      }`}
                    >
                      {bandwidth.multiplier}x
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-status-success h-full"
                        style={{
                          width:
                            bandwidth.pqcTotal > 0
                              ? `${(bandwidth.classicalTotal / bandwidth.pqcTotal) * 100}%`
                              : '100%',
                        }}
                      />
                      <div className="bg-status-warning h-full flex-1" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>Classical</span>
                    <span>PQC overhead</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Protocol Comparison Matrix */}
      {selectedProtocols.length >= 2 && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Protocol Comparison Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Protocol</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Transport</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Safe Layers</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Vuln. Layers
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    PQC Feasibility
                  </th>
                  <th className="text-right p-2 text-muted-foreground font-medium">
                    Classical Size
                  </th>
                  <th className="text-right p-2 text-muted-foreground font-medium">PQC Size</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Multiplier</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Timing Req.</th>
                </tr>
              </thead>
              <tbody>
                {selectedProtocols.map((protocol, idx) => {
                  const vulnerable = getVulnerableLayers(protocol)
                  const safe = getSafeLayers(protocol)
                  const bandwidth = computeBandwidthImpact(protocol)

                  return (
                    <tr key={protocol.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                      <td className="p-2 font-medium text-foreground">{protocol.name}</td>
                      <td className="p-2 text-muted-foreground">{protocol.transport}</td>
                      <td className="p-2 text-center">
                        <span className="text-status-success font-mono">{safe.length}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-status-error font-mono">{vulnerable.length}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 ${FEASIBILITY_CLASSES[protocol.pqcFeasibility]}`}
                        >
                          {FEASIBILITY_LABEL[protocol.pqcFeasibility]}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono text-muted-foreground">
                        {formatBytes(bandwidth.classicalTotal)}
                      </td>
                      <td className="p-2 text-right font-mono text-foreground">
                        {formatBytes(bandwidth.pqcTotal)}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-mono font-bold ${
                            parseFloat(bandwidth.multiplier) > 5
                              ? 'text-status-error'
                              : parseFloat(bandwidth.multiplier) > 2
                                ? 'text-status-warning'
                                : 'text-status-success'
                          }`}
                        >
                          {bandwidth.multiplier}x
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {protocol.timingRequirement ?? 'None'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bandwidth Impact Summary */}
      {selectedProtocols.length > 0 && (
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">
            Aggregate Bandwidth Impact Summary
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedProtocols.map((protocol) => {
              const bandwidth = computeBandwidthImpact(protocol)
              return (
                <div key={protocol.id} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-xs font-medium text-foreground mb-1">{protocol.name}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {bandwidth.multiplier}x
                    </span>
                    <span className="text-[10px] text-muted-foreground">size increase</span>
                  </div>
                  <div className="mt-1.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        parseFloat(bandwidth.multiplier) > 5
                          ? 'bg-status-error'
                          : parseFloat(bandwidth.multiplier) > 2
                            ? 'bg-status-warning'
                            : 'bg-status-success'
                      }`}
                      style={{
                        width: `${Math.min(parseFloat(bandwidth.multiplier) * 10, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {formatBytes(bandwidth.classicalTotal)} {'\u2192'}{' '}
                    {formatBytes(bandwidth.pqcTotal)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-end pt-2">
        <Button variant="gradient" onClick={onComplete}>
          <CheckCircle2 size={16} className="mr-2" />
          Mark Step Complete
        </Button>
      </div>
    </div>
  )
}
