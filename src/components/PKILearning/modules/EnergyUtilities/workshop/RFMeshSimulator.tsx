// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Radio, AlertTriangle, BatteryWarning, Cpu, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateRfMeshImpact } from '../utils/rfMeshMath'

const PAYLOAD_TYPES = [
  { id: 'daily-read-classical', name: 'Daily Read (Classical ECDSA)', bytes: 500 },
  { id: 'daily-read-pqc', name: 'Daily Read (Pure PQC ML-DSA-87)', bytes: 5100 },
  { id: 'fw-update-classical', name: 'Firmware Update (Classical ECDSA)', bytes: 150_064 },
  { id: 'fw-update-pqc', name: 'Firmware Update (Pure PQC ML-DSA-87)', bytes: 154_627 },
]

export const RFMeshSimulator: React.FC = () => {
  const [selectedPayloadId, setSelectedPayloadId] = useState('fw-update-pqc')
  const [meshBandwidthKbps, setMeshBandwidthKbps] = useState(50)
  const [meterCount, setMeterCount] = useState(5000)

  const payload = PAYLOAD_TYPES.find((p) => p.id === selectedPayloadId) || PAYLOAD_TYPES[3]

  const impact = calculateRfMeshImpact(
    payload.bytes,
    meshBandwidthKbps,
    meterCount,
    24 // 24-hour daily reporting window
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-foreground">900MHz RF Mesh Simulator</h2>
        <p className="text-muted-foreground mt-2">
          Model the Time-on-Air (ToA) and network saturation of legacy smart meter networks when
          subjected to massive PQC cryptographic signatures and payloads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass-panel p-6 space-y-6">
          <div>
            <div className="text-sm font-bold block mb-2 flex items-center gap-2">
              <Cpu size={16} /> Transmission Payload
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PAYLOAD_TYPES.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedPayloadId === p.id ? 'default' : 'outline'}
                  onClick={() => setSelectedPayloadId(p.id)}
                  className="w-full text-xs justify-start py-2 h-auto flex flex-col items-start"
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-[10px] opacity-80">{p.bytes.toLocaleString()} Bytes</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold flex justify-between mb-2">
              <span>Cell Mesh Bandwidth</span>
              <span className="font-mono text-primary">{meshBandwidthKbps} kbps</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={meshBandwidthKbps}
              onChange={(e) => setMeshBandwidthKbps(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="text-[10px] text-muted-foreground flex justify-between px-1 mt-1">
              <span>Legacy (10 kbps)</span>
              <span>Wi-SUN (300 kbps)</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold flex justify-between mb-2">
              <span>Meters in Cell</span>
              <span className="font-mono text-primary">{meterCount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="25000"
              step="500"
              value={meterCount}
              onChange={(e) => setMeterCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Visualization */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Radio
                size={20}
                className={impact.meshCollapse ? 'text-destructive' : 'text-success'}
              />
              Time-on-Air (ToA) Analysis
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/20 p-3 rounded-lg border">
                <span className="text-xs text-muted-foreground block mb-1">ToA Per Meter</span>
                <span className="font-mono text-lg font-bold">
                  {impact.timeOnAirSecondsPerMeter.toFixed(2)} sec
                </span>
              </div>
              <div
                className={`p-3 rounded-lg border ${impact.meshCollapse ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-success/10 border-success/30 text-success-foreground'}`}
              >
                <span className="text-xs opacity-80 block mb-1">Total Cell Time</span>
                <span className="font-mono text-lg font-bold">
                  {impact.totalCellTimeHours.toFixed(2)} hours
                </span>
              </div>
            </div>

            {/* Time Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>0 hrs</span>
                <span>24 Hour Operational Window</span>
                <span>48+ hrs</span>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-foreground z-10" />
                <div
                  className={`h-full ${impact.meshCollapse ? 'bg-destructive' : 'bg-success'}`}
                  style={{ width: `${Math.min((impact.totalCellTimeHours / 48) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            {impact.meshCollapse ? (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 text-destructive">
                <AlertTriangle size={24} className="shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Mesh Collapse</h4>
                  <p className="text-xs mt-1 opacity-90">
                    The total transmission time ({impact.totalCellTimeHours.toFixed(1)} hours)
                    strictly exceeds the daily 24-hour reporting window. The sheer size of the PQC
                    payloads saturates the {meshBandwidthKbps} kbps network, preventing meters from
                    syncing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 p-4 rounded-lg flex gap-3 text-success-foreground">
                <BatteryWarning size={24} className="shrink-0 text-success" />
                <div>
                  <h4 className="font-bold text-sm">Mesh Stable</h4>
                  <p className="text-xs mt-1 opacity-90">
                    The transmission completes in {impact.totalCellTimeHours.toFixed(1)} hours, well
                    within the 24-hour daily window.
                  </p>
                </div>
              </div>
            )}

            {impact.timeOnAirSecondsPerMeter > 10 && (
              <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg flex gap-3 text-warning-foreground mt-4">
                <ShieldAlert size={20} className="shrink-0 text-warning" />
                <div className="text-xs">
                  <span className="font-bold block mb-1">Battery Drain Warning</span>
                  Extended Time-on-Air ({impact.timeOnAirSecondsPerMeter.toFixed(1)}s per meter)
                  will severely degrade the 15-year battery life of unconnected IoT edge devices.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
