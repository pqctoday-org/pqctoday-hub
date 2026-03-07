// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Eye, EyeOff, AlertTriangle, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TLSAlgorithm {
  id: string
  name: string
  certSizeKB: number
  signatureSizeKB: number
  chainSizeKB: number
  inspectionFriendly: boolean
  inspectionNotes: string
  handshakeMs: number
  inspectedHandshakeMs: number
}

const TLS_ALGORITHMS: TLSAlgorithm[] = [
  {
    id: 'rsa2048',
    name: 'RSA-2048 (classical)',
    certSizeKB: 1.2,
    signatureSizeKB: 0.25,
    chainSizeKB: 3.2,
    inspectionFriendly: true,
    inspectionNotes:
      'Universally supported by all TLS inspection engines. No buffer size concerns. Hardware offload widely available.',
    handshakeMs: 8,
    inspectedHandshakeMs: 14,
  },
  {
    id: 'ecdsa-p256',
    name: 'ECDSA P-256 (classical)',
    certSizeKB: 0.9,
    signatureSizeKB: 0.07,
    chainSizeKB: 2.4,
    inspectionFriendly: true,
    inspectionNotes:
      'Small certs and signatures. Most NGFW TLS inspection engines handle P-256 natively. No size concerns.',
    handshakeMs: 5,
    inspectedHandshakeMs: 9,
  },
  {
    id: 'hybrid-mldsa65',
    name: 'Hybrid ECDSA+ML-DSA-65',
    certSizeKB: 3.8,
    signatureSizeKB: 3.4,
    chainSizeKB: 8.5,
    inspectionFriendly: false,
    inspectionNotes:
      'Certificate chain exceeds classical NGFW buffer limits (typically 4KB). Requires firmware update for buffer expansion. Inspection feasible on updated Palo Alto PAN-OS 11.1+ and Cisco FTD 7.4+.',
    handshakeMs: 12,
    inspectedHandshakeMs: 28,
  },
  {
    id: 'pure-mldsa65',
    name: 'ML-DSA-65 (pure PQC)',
    certSizeKB: 2.5,
    signatureSizeKB: 3.3,
    chainSizeKB: 6.5,
    inspectionFriendly: false,
    inspectionNotes:
      'Pure PQC certs require NGFW support for ML-DSA OIDs and larger signature buffers. Currently limited to research/preview on most commercial NGFWs. Chain inspection fails on most 2024 firmware.',
    handshakeMs: 15,
    inspectedHandshakeMs: 35,
  },
  {
    id: 'hybrid-mldsa87',
    name: 'Hybrid ECDSA+ML-DSA-87',
    certSizeKB: 5.2,
    signatureSizeKB: 4.6,
    chainSizeKB: 12.0,
    inspectionFriendly: false,
    inspectionNotes:
      'Maximum security hybrid. Certificate chain can exceed 12KB — beyond even updated NGFW inspection buffers on many platforms. Pass-through with logging recommended over active inspection.',
    handshakeMs: 18,
    inspectedHandshakeMs: 45,
  },
]

type InspectionMode = 'passthrough' | 'inspect'

function ConnectionDiagram({ mode, algorithm }: { mode: InspectionMode; algorithm: TLSAlgorithm }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border">
      <div className="text-xs font-bold text-foreground mb-3">TLS Traffic Flow</div>
      <div className="flex items-center gap-1 flex-wrap justify-center text-[10px]">
        <div className="bg-primary/10 border border-primary/30 rounded px-2 py-1 text-primary font-bold">
          Client
        </div>
        <ArrowRight size={12} className="text-muted-foreground" />
        {mode === 'inspect' ? (
          <>
            <div className="bg-warning/10 border border-warning/30 rounded px-2 py-1 text-status-warning font-bold">
              NGFW
              <br />
              <span className="font-normal">(intercept)</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 mx-1">
              <span className="text-[9px] text-muted-foreground">re-encrypt</span>
              <ArrowRight size={10} className="text-muted-foreground" />
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded px-2 py-1 text-status-warning font-bold">
              TLS Proxy
              <br />
              <span className="font-normal">(resign)</span>
            </div>
            <ArrowRight size={12} className="text-muted-foreground" />
          </>
        ) : (
          <div className="bg-muted border border-border rounded px-2 py-1 text-muted-foreground font-bold">
            NGFW
            <br />
            <span className="font-normal">(pass-through)</span>
          </div>
        )}
        <ArrowRight size={12} className="text-muted-foreground" />
        <div className="bg-success/10 border border-success/30 rounded px-2 py-1 text-status-success font-bold">
          Server
        </div>
      </div>
      {mode === 'inspect' && (
        <div className="mt-2 text-[10px] text-muted-foreground text-center">
          NGFW decrypts → inspects payload → re-encrypts with{' '}
          <span className="font-bold text-foreground">{algorithm.name}</span> cert
        </div>
      )}
    </div>
  )
}

export const TLSInspectionLab: React.FC = () => {
  const [selectedAlgoId, setSelectedAlgoId] = useState('rsa2048')
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('passthrough')
  const [connectionCount, setConnectionCount] = useState(1000)

  const selectedAlgo = TLS_ALGORITHMS.find((a) => a.id === selectedAlgoId) ?? TLS_ALGORITHMS[0]
  const baseline = TLS_ALGORITHMS[0]

  const stats = useMemo(() => {
    const handshakeMs =
      inspectionMode === 'inspect' ? selectedAlgo.inspectedHandshakeMs : selectedAlgo.handshakeMs
    const baselineMs =
      inspectionMode === 'inspect' ? baseline.inspectedHandshakeMs : baseline.handshakeMs
    const latencyOverhead = handshakeMs - baselineMs
    const certOverheadKB = selectedAlgo.chainSizeKB - baseline.chainSizeKB
    const inspectionFeasible = !selectedAlgo.inspectionFriendly && inspectionMode === 'inspect'
    // Approximate connections/sec based on CPU budget
    const softwareConnsSec =
      inspectionMode === 'inspect' ? Math.round(1000 / (handshakeMs / 1000)) : 5000
    const tlsInspectionOverheadMbps =
      inspectionMode === 'inspect' ? (connectionCount * selectedAlgo.chainSizeKB * 2) / 1024 : 0

    return {
      handshakeMs,
      latencyOverhead,
      certOverheadKB: parseFloat(certOverheadKB.toFixed(1)),
      inspectionFeasible,
      softwareConnsSec,
      tlsInspectionOverheadMbps: parseFloat(tlsInspectionOverheadMbps.toFixed(1)),
    }
  }, [selectedAlgo, inspectionMode, connectionCount, baseline])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">TLS Inspection Lab</h3>
        <p className="text-sm text-muted-foreground">
          Simulate TLS intercept proxy behavior with PQC certificates. Toggle between pass-through
          and full inspection modes to see performance and compatibility impact.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-panel p-5">
        <h4 className="text-sm font-bold text-foreground mb-4">Lab Configuration</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Certificate Algorithm</div>
            <div className="space-y-2">
              {TLS_ALGORITHMS.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => setSelectedAlgoId(algo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                    selectedAlgoId === algo.id
                      ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                      : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{algo.name}</span>
                    <span
                      className={
                        algo.inspectionFriendly ? 'text-status-success' : 'text-status-warning'
                      }
                    >
                      {algo.chainSizeKB} KB chain
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Inspection Mode</div>
              <div className="flex gap-2">
                <Button
                  variant={inspectionMode === 'passthrough' ? 'outline' : 'ghost'}
                  onClick={() => setInspectionMode('passthrough')}
                  className="flex-1 flex items-center gap-2"
                >
                  <EyeOff size={14} />
                  Pass-Through
                </Button>
                <Button
                  variant={inspectionMode === 'inspect' ? 'outline' : 'ghost'}
                  onClick={() => setInspectionMode('inspect')}
                  className="flex-1 flex items-center gap-2"
                >
                  <Eye size={14} />
                  Full Inspect
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Concurrent Connections: {connectionCount.toLocaleString()}
              </div>
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={connectionCount}
                onChange={(e) => setConnectionCount(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Concurrent connections"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>100</span>
                <span>10,000</span>
              </div>
            </div>

            <ConnectionDiagram mode={inspectionMode} algorithm={selectedAlgo} />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="glass-panel p-5">
        <h4 className="text-sm font-bold text-foreground mb-4">Performance Metrics</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div
              className={`text-lg font-bold ${stats.handshakeMs > 20 ? 'text-status-error' : stats.handshakeMs > 12 ? 'text-status-warning' : 'text-status-success'}`}
            >
              {stats.handshakeMs}ms
            </div>
            <div className="text-[10px] text-muted-foreground">Handshake Latency</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div
              className={`text-lg font-bold ${stats.certOverheadKB > 4 ? 'text-status-error' : stats.certOverheadKB > 2 ? 'text-status-warning' : 'text-status-success'}`}
            >
              {stats.certOverheadKB > 0 ? `+${stats.certOverheadKB}` : stats.certOverheadKB} KB
            </div>
            <div className="text-[10px] text-muted-foreground">Chain Size Overhead</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-primary">{selectedAlgo.chainSizeKB} KB</div>
            <div className="text-[10px] text-muted-foreground">Full Cert Chain</div>
          </div>
          {inspectionMode === 'inspect' && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div
                className={`text-lg font-bold ${stats.tlsInspectionOverheadMbps > 100 ? 'text-status-error' : 'text-status-warning'}`}
              >
                {stats.tlsInspectionOverheadMbps} Mbps
              </div>
              <div className="text-[10px] text-muted-foreground">Inspection Overhead</div>
            </div>
          )}
          {inspectionMode === 'passthrough' && (
            <div className="bg-success/5 rounded-lg p-3 border border-success/30 text-center">
              <div className="text-lg font-bold text-status-success">Pass-through</div>
              <div className="text-[10px] text-muted-foreground">No Inspection Overhead</div>
            </div>
          )}
        </div>

        {/* Algorithm compatibility */}
        <div
          className={`rounded-lg p-4 border ${
            selectedAlgo.inspectionFriendly
              ? 'bg-success/5 border-success/30'
              : 'bg-warning/5 border-warning/30'
          }`}
        >
          <div className="flex items-start gap-2">
            {selectedAlgo.inspectionFriendly ? (
              <CheckCircle size={16} className="text-status-success shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
            )}
            <div>
              <div
                className={`text-xs font-bold mb-1 ${selectedAlgo.inspectionFriendly ? 'text-status-success' : 'text-status-warning'}`}
              >
                {selectedAlgo.inspectionFriendly
                  ? 'Inspection-Friendly Algorithm'
                  : 'Inspection Challenges Detected'}
              </div>
              <p className="text-xs text-muted-foreground">{selectedAlgo.inspectionNotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Feasibility Matrix */}
      <div className="glass-panel p-5">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Inspection Feasibility by Algorithm
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Cert (KB)
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Chain (KB)
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Inspect Latency
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Inspection
                </th>
              </tr>
            </thead>
            <tbody>
              {TLS_ALGORITHMS.map((algo) => (
                <tr
                  key={algo.id}
                  className={`border-b border-border/50 ${algo.id === selectedAlgoId ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 px-2 text-foreground font-medium">{algo.name}</td>
                  <td className="py-2 px-2 text-right font-mono text-foreground">
                    {algo.certSizeKB}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-mono ${algo.chainSizeKB > 8 ? 'text-status-error' : algo.chainSizeKB > 4 ? 'text-status-warning' : 'text-foreground'}`}
                  >
                    {algo.chainSizeKB}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-foreground">
                    ~{algo.inspectedHandshakeMs}ms
                  </td>
                  <td className="py-2 px-2 text-center">
                    {algo.inspectionFriendly ? (
                      <CheckCircle size={12} className="text-status-success inline" />
                    ) : (
                      <Info size={12} className="text-status-warning inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Latency values are for a mid-range NGFW appliance with software TLS inspection. Hardware
          offload reduces inspection latency by 60-70%.
        </p>
      </div>
    </div>
  )
}
