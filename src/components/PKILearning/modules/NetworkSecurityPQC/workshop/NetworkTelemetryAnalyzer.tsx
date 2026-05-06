// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Activity, Clock, ShieldAlert, Server, Smartphone, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateTelemetryImpact } from '../utils/telemetryMath'

const PROFILES = [
  { id: 'classical', name: 'Classical (ECDSA)', payloadBytes: 2500 },
  { id: 'hybrid', name: 'Hybrid (P-256 + ML-DSA-44)', payloadBytes: 6500 },
  { id: 'pure-pqc', name: 'Pure PQC (ML-DSA-65)', payloadBytes: 25000 },
]

export const NetworkTelemetryAnalyzer: React.FC = () => {
  const [selectedProfileId, setSelectedProfileId] = useState('pure-pqc')

  const profile = PROFILES.find((p) => p.id === selectedProfileId) || PROFILES[2]

  // TCP Constants
  const MTU_BYTES = 1440 // Typical MSS/Payload size per TCP segment
  const INIT_CWND = 10 // TCP Initial Congestion Window (10 segments)

  const { requiredSegments, requiresExtraRTT, packets } = calculateTelemetryImpact(
    profile.payloadBytes,
    MTU_BYTES,
    INIT_CWND
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-foreground">TCP Telemetry & Congestion Analyzer</h2>
        <p className="text-muted-foreground mt-2">
          Visualize how massive Post-Quantum TLS handshakes interact with the TCP Initial Congestion
          Window (`initcwnd`) and cause fragmentation latency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Selector */}
        <div className="glass-panel p-6 md:col-span-1 space-y-6">
          <div>
            <h3 className="font-bold text-sm mb-3">TLS Handshake Profile</h3>
            <div className="space-y-2">
              {PROFILES.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedProfileId === p.id ? 'default' : 'outline'}
                  onClick={() => setSelectedProfileId(p.id)}
                  className="w-full justify-start text-xs h-auto py-2"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-[10px] opacity-80">
                      Payload: {p.payloadBytes.toLocaleString()} B
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="font-bold text-xs mb-2">Network Constants</h4>
            <ul className="text-[10px] text-muted-foreground space-y-1 font-mono">
              <li>TCP MTU: {MTU_BYTES} Bytes</li>
              <li>initcwnd: {INIT_CWND} Segments</li>
              <li>Max initial burst: {(MTU_BYTES * INIT_CWND).toLocaleString()} Bytes</li>
            </ul>
          </div>
        </div>

        {/* Network Visualization */}
        <div className="glass-panel p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div className="flex flex-col items-center gap-2">
              <Server size={32} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Server</span>
            </div>

            <div className="flex-1 flex flex-col items-center px-4 relative">
              <div className="text-center mb-2">
                <span className="text-sm font-bold text-foreground block">
                  {profile.name} Handshake
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Total size: {profile.payloadBytes.toLocaleString()} B
                </span>
              </div>
              <div className="w-full h-px bg-border absolute top-1/2 -z-10" />
              <Wifi
                size={24}
                className="text-muted-foreground/30 absolute top-1/2 -translate-y-1/2"
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <Smartphone size={32} className="text-foreground" />
              <span className="text-xs font-bold text-muted-foreground">Client</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">Flight 1 (Initial Burst)</h4>
                <span className="text-xs text-muted-foreground font-mono">
                  Max {INIT_CWND} packets
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {packets
                  .filter((p) => p.flight === 1)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="w-8 h-10 rounded bg-primary flex items-center justify-center border border-primary-foreground/20 shadow-sm relative group"
                    >
                      <span className="text-[10px] text-primary-foreground font-bold">
                        {p.id + 1}
                      </span>
                      <div className="absolute -top-8 hidden group-hover:block bg-background border p-1 text-[10px] rounded shadow z-10 whitespace-nowrap">
                        Segment {p.id + 1} ({MTU_BYTES} B)
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {requiresExtraRTT && (
              <>
                <div className="flex items-center gap-4 text-xs font-mono text-warning bg-warning/10 p-3 rounded-lg border border-warning/30">
                  <Clock size={16} />
                  <span>
                    initcwnd exhausted! TCP must wait for Client ACK (Adds +1 Round Trip Time)
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm">Flight 2 (Post-ACK)</h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      Remaining {packets.filter((p) => p.flight > 1).length} packets
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {packets
                      .filter((p) => p.flight === 2)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="w-8 h-10 rounded bg-secondary flex items-center justify-center border border-secondary-foreground/20 shadow-sm relative group"
                        >
                          <span className="text-[10px] text-secondary-foreground font-bold">
                            {p.id + 1}
                          </span>
                          <div className="absolute -top-8 hidden group-hover:block bg-background border p-1 text-[10px] rounded shadow z-10 whitespace-nowrap">
                            Segment {p.id + 1} ({MTU_BYTES} B)
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {packets.some((p) => p.flight > 2) && (
                  <div className="text-xs text-destructive flex items-center gap-2 mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <ShieldAlert size={16} />
                    <span>
                      Extreme Fragmentation! Payload spans{' '}
                      {Math.max(...packets.map((p) => p.flight))} RTTs. High risk of middlebox
                      firewall drops!
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Analysis Summary */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Activity size={16} className="text-primary" />
              Telemetry Impact Analysis
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/20 p-3 rounded border">
                <span className="text-xs text-muted-foreground block mb-1">Total TCP Segments</span>
                <span className="font-bold font-mono text-lg">{requiredSegments}</span>
              </div>
              <div
                className={`p-3 rounded border ${requiresExtraRTT ? 'bg-warning/10 border-warning/30 text-warning-foreground' : 'bg-success/10 border-success/30 text-success-foreground'}`}
              >
                <span className="text-xs opacity-80 block mb-1">Added Latency Penalty</span>
                <span className="font-bold font-mono text-lg">
                  {requiresExtraRTT ? '+1 RTT' : '0 RTT'}
                </span>
              </div>
            </div>
            {requiresExtraRTT && (
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Why this matters:</strong> PQC signatures are large enough to starve the
                standard TCP Initial Congestion Window. This forces the server to pause transmission
                and wait for network acknowledgements, effectively doubling the network latency of
                the TLS handshake over high-latency links (e.g., satellite or 5G).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
