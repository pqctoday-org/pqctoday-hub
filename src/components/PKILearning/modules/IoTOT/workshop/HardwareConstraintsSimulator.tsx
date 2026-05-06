// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Cpu, Radio, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateSecureBootLatency, calculateV2XBandwidth } from '../utils/hardwareMath'

const BOOT_ALGOS = [
  { name: 'ECDSA P-256', sigBytes: 64, pubBytes: 64, verifyCycles: 2_000_000 },
  { name: 'RSA-3072', sigBytes: 384, pubBytes: 384, verifyCycles: 100_000 },
  { name: 'ML-DSA-44', sigBytes: 2420, pubBytes: 1312, verifyCycles: 400_000 },
  { name: 'LMS (H=10)', sigBytes: 2500, pubBytes: 60, verifyCycles: 1_200_000 },
]

export const HardwareConstraintsSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'boot' | 'v2x'>('boot')

  // Boot Latency State
  const [spiSpeedMBps, setSpiSpeedMBps] = useState(2) // MB/s
  const [mcuClockMHz, setMcuClockMHz] = useState(120) // MHz
  const [selectedAlgo, setSelectedAlgo] = useState(BOOT_ALGOS[2])

  // V2X Storm State
  const [vehicleCount, setVehicleCount] = useState(100)
  const channelLimitMbps = 6 // DSRC typical data rate

  // Calculations
  const { loadTimeMs, verifyTimeMs, totalBootDelayMs, exceedsRealTimeConstraint } =
    calculateSecureBootLatency(
      selectedAlgo.sigBytes,
      selectedAlgo.pubBytes,
      selectedAlgo.verifyCycles,
      spiSpeedMBps,
      mcuClockMHz,
      100
    )

  const { bandwidthUsedMbps: ecdsaV2XRateMbps, triggersBroadcastStorm: ecdsaStorm } =
    calculateV2XBandwidth(vehicleCount, 64)
  const { bandwidthUsedMbps: mldsaV2XRateMbps, triggersBroadcastStorm: mldsaStorm } =
    calculateV2XBandwidth(vehicleCount, 2420)

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground">Hardware Constraints Simulator</h2>
        <p className="text-muted-foreground mt-2">
          Explore how the physical limitations of embedded devices and constrained networks react to
          the massive cryptographic parameters of PQC.
        </p>
      </div>

      <div className="flex justify-center gap-4 border-b border-border pb-4">
        <Button
          variant={activeTab === 'boot' ? 'default' : 'outline'}
          onClick={() => setActiveTab('boot')}
          className="flex items-center gap-2"
        >
          <Cpu size={16} /> Secure Boot Latency
        </Button>
        <Button
          variant={activeTab === 'v2x' ? 'default' : 'outline'}
          onClick={() => setActiveTab('v2x')}
          className="flex items-center gap-2"
        >
          <Radio size={16} /> V2X Broadcast Storm
        </Button>
      </div>

      {activeTab === 'boot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Secure Boot Delay Calculator</h3>
            <p className="text-sm text-muted-foreground">
              During a Secure Boot sequence, the MCU must load the signature and public key from SPI
              Flash into SRAM, then execute the verification algorithm before the OS can boot.
            </p>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-bold block mb-1">Algorithm</div>
                <div className="grid grid-cols-2 gap-2">
                  {BOOT_ALGOS.map((alg) => (
                    <Button
                      key={alg.name}
                      variant={selectedAlgo.name === alg.name ? 'default' : 'outline'}
                      onClick={() => setSelectedAlgo(alg)}
                      className="text-xs py-1 h-auto"
                    >
                      {alg.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold block mb-1">
                  SPI Flash Read Speed: {spiSpeedMBps} MB/s
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={spiSpeedMBps}
                  onChange={(e) => setSpiSpeedMBps(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-sm font-bold block mb-1">
                  MCU Clock Speed: {mcuClockMHz} MHz
                </div>
                <input
                  type="range"
                  min="48"
                  max="400"
                  step="12"
                  value={mcuClockMHz}
                  onChange={(e) => setMcuClockMHz(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col justify-center">
            <div className="text-center space-y-4">
              <Zap
                size={48}
                className={
                  exceedsRealTimeConstraint ? 'text-warning mx-auto' : 'text-success mx-auto'
                }
              />
              <h4 className="font-bold text-xl">Total Boot Delay</h4>
              <div className="text-4xl font-mono text-primary font-bold">
                {totalBootDelayMs.toFixed(2)} ms
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-left bg-muted/20 p-4 rounded-lg">
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Load Time (SPI -&gt; SRAM)
                  </span>
                  <span className="font-mono">{loadTimeMs.toFixed(2)} ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Verify Time (CPU)</span>
                  <span className="font-mono">{verifyTimeMs.toFixed(2)} ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Payload Size</span>
                  <span className="font-mono">
                    {(selectedAlgo.sigBytes + selectedAlgo.pubBytes).toLocaleString()} Bytes
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Cycles</span>
                  <span className="font-mono">
                    {(selectedAlgo.verifyCycles / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              {exceedsRealTimeConstraint && (
                <div className="text-xs text-warning mt-4 flex items-center justify-center gap-1">
                  <AlertTriangle size={14} /> Exceeds typical 100ms real-time RTOS boot constraint.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'v2x' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
            <h3 className="font-bold text-lg">V2X Intersection Storm</h3>
            <p className="text-sm text-muted-foreground">
              Automotive V2X standards require cars to broadcast Basic Safety Messages (BSMs) 10
              times per second (10Hz). When switching from ECDSA to ML-DSA, the 2.4KB signatures can
              quickly overwhelm the 6 Mbps channel capacity at a busy intersection.
            </p>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-bold block mb-1">
                  Vehicles at Intersection: {vehicleCount}
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={vehicleCount}
                  onChange={(e) => setVehicleCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* ECDSA */}
            <div className="glass-panel p-4 border-l-4 border-l-success">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">Classical (ECDSA)</h4>
                <span
                  className={`font-mono text-sm ${ecdsaStorm ? 'text-destructive font-bold' : ''}`}
                >
                  {ecdsaV2XRateMbps.toFixed(2)} Mbps
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{
                    width: `${Math.min((ecdsaV2XRateMbps / channelLimitMbps) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              {ecdsaStorm && (
                <div className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Broadcast Storm! Exceeds 6 Mbps
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                64-byte signatures at 10Hz per vehicle.
              </div>
            </div>

            {/* ML-DSA */}
            <div
              className={`glass-panel p-4 border-l-4 ${mldsaStorm ? 'border-l-destructive bg-destructive/5' : 'border-l-warning'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">Pure PQC (ML-DSA-44)</h4>
                <span
                  className={`font-mono text-sm ${mldsaStorm ? 'text-destructive font-bold' : ''}`}
                >
                  {mldsaV2XRateMbps.toFixed(2)} Mbps
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${mldsaStorm ? 'bg-destructive' : 'bg-warning'}`}
                  style={{
                    width: `${Math.min((mldsaV2XRateMbps / channelLimitMbps) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              {mldsaStorm && (
                <div className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Broadcast Storm! Exceeds 6 Mbps limit
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                2420-byte signatures at 10Hz per vehicle.
              </div>
            </div>
            {mldsaV2XRateMbps > channelLimitMbps && (
              <div className="mt-3 text-xs text-destructive font-medium border border-destructive/20 bg-destructive/10 p-2 rounded">
                Broadcast Storm! The RF channel capacity ({channelLimitMbps} Mbps) is exceeded.
                Messages will be dropped, endangering autonomous safety features.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
