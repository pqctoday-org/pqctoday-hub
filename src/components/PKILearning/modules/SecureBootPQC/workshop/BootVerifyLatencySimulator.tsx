// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router'
import { Zap, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  BOOT_VERIFY_ALGORITHMS,
  ILLUSTRATIVE_BOOT_BUDGET_MS,
  calculateSecureBootLatency,
} from '../utils/bootLatencyMath'

/**
 * Boot-time verify latency on a microcontroller root of trust. Moved here
 * from the IoT/OT module's Hardware Constraints simulator (2026-10-01).
 */
export const BootVerifyLatencySimulator: React.FC = () => {
  const [spiSpeedMBps, setSpiSpeedMBps] = useState(2)
  const [mcuClockMHz, setMcuClockMHz] = useState(120)
  const [selectedName, setSelectedName] = useState('ML-DSA-44')
  const selectedAlgo =
    BOOT_VERIFY_ALGORITHMS.find((a) => a.name === selectedName) ?? BOOT_VERIFY_ALGORITHMS[0]

  const { loadTimeMs, verifyTimeMs, totalBootDelayMs, payloadSizeBytes, exceedsBudget } =
    calculateSecureBootLatency(
      selectedAlgo.sigBytes,
      selectedAlgo.pubBytes,
      selectedAlgo.verifyCycles,
      spiSpeedMBps,
      mcuClockMHz
    )

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        On a microcontroller root of trust, the boot ROM or first-stage loader reads the signature
        and public key from SPI flash into SRAM, then verifies the next stage in software before
        handing over. This calculator splits that delay into flash-read time and verify time for a
        Cortex-M4-class core, so you can see which part PQC actually changes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-4 space-y-4">
          <div>
            <div className="text-sm font-bold mb-1">Algorithm</div>
            <div className="grid grid-cols-2 gap-2">
              {BOOT_VERIFY_ALGORITHMS.map((alg) => (
                <Button
                  key={alg.name}
                  variant={selectedAlgo.name === alg.name ? 'default' : 'outline'}
                  onClick={() => setSelectedName(alg.name)}
                  className="text-xs py-1 h-auto"
                >
                  {alg.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold mb-1">SPI flash read speed: {spiSpeedMBps} MB/s</div>
            <input
              type="range"
              aria-label="SPI flash read speed, megabytes per second"
              min="1"
              max="20"
              value={spiSpeedMBps}
              onChange={(e) => setSpiSpeedMBps(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="text-sm font-bold mb-1">MCU clock: {mcuClockMHz} MHz</div>
            <input
              type="range"
              aria-label="MCU clock speed, megahertz"
              min="48"
              max="408"
              step="12"
              value={mcuClockMHz}
              onChange={(e) => setMcuClockMHz(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border pt-3">
            <div>
              <span className="font-semibold text-foreground">Sizes:</span>{' '}
              {selectedAlgo.sizeSource}
            </div>
            <div>
              <span className="font-semibold text-foreground">Verify cycles:</span>{' '}
              {selectedAlgo.cycleSource}
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 flex flex-col justify-center">
          <div className="text-center space-y-3">
            <Zap
              size={40}
              className={exceedsBudget ? 'text-warning mx-auto' : 'text-success mx-auto'}
            />
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Model estimate
            </div>
            <h4 className="font-bold text-lg">Signature load + verify</h4>
            <div className="text-4xl font-mono text-primary font-bold">
              {totalBootDelayMs.toFixed(2)} ms
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-left bg-muted/20 p-3 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-xs">Load (SPI → SRAM)</span>
                <span className="font-mono">{loadTimeMs.toFixed(2)} ms</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Verify (CPU)</span>
                <span className="font-mono">{verifyTimeMs.toFixed(2)} ms</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Sig + public key</span>
                <span className="font-mono">{payloadSizeBytes.toLocaleString()} B</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Verify cycles (M4)</span>
                <span className="font-mono">
                  {(selectedAlgo.verifyCycles / 1_000_000).toFixed(2)} M
                </span>
              </div>
            </div>

            {exceedsBudget && (
              <div className="text-xs text-warning flex items-center justify-center gap-1">
                <AlertTriangle size={14} /> Over the illustrative {ILLUSTRATIVE_BOOT_BUDGET_MS} ms
                boot budget.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison across all algorithms at the current settings */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold mb-2">All algorithms at these settings</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2 font-medium">Algorithm</th>
                <th className="text-right p-2 font-medium">Sig + pk</th>
                <th className="text-right p-2 font-medium">Load</th>
                <th className="text-right p-2 font-medium">Verify</th>
                <th className="text-right p-2 font-medium">Total (model)</th>
              </tr>
            </thead>
            <tbody>
              {BOOT_VERIFY_ALGORITHMS.map((alg) => {
                const r = calculateSecureBootLatency(
                  alg.sigBytes,
                  alg.pubBytes,
                  alg.verifyCycles,
                  spiSpeedMBps,
                  mcuClockMHz
                )
                return (
                  <tr key={alg.name} className="border-b border-border/50">
                    <td className="p-2 font-mono">{alg.name}</td>
                    <td className="p-2 text-right font-mono">
                      {r.payloadSizeBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right font-mono">{r.loadTimeMs.toFixed(2)} ms</td>
                    <td className="p-2 text-right font-mono">{r.verifyTimeMs.toFixed(2)} ms</td>
                    <td
                      className={`p-2 text-right font-mono font-bold ${r.exceedsBudget ? 'text-status-error' : ''}`}
                    >
                      {r.totalBootDelayMs.toFixed(2)} ms
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-status-info/10 rounded-lg p-3 border border-status-info/30 text-xs text-foreground space-y-2">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-status-info shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              <span className="font-bold">What the numbers say:</span> the PQC signature-plus-key
              payloads are 20-30× larger than ECDSA&apos;s 128 bytes, but at realistic SPI speeds
              that costs only a couple of milliseconds of flash reading. Verify time is what
              dominates — ML-DSA-44 (~1.4 M cycles) and LMS (~2.7 M) stay within a few times ECDSA
              P-256 (~1 M), while RSA-3072 verify in software is roughly 25 M cycles and is by far
              the slowest of the four.
            </p>
            <p>
              <span className="font-bold">Model limits:</span> the {ILLUSTRATIVE_BOOT_BUDGET_MS} ms
              budget is illustrative, not a standard — real boot budgets are product-specific. Cycle
              counts are Cortex-M4 software figures; scaling them by clock ignores flash wait
              states, caches and crypto accelerators. Hashing the firmware image is the same for
              every algorithm and is left out.
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1">
        For memory, power and network constraints on IoT devices, see{' '}
        <Link to="/learn/iot-pqc" className="text-primary inline-flex items-center gap-1">
          IoT &amp; Embedded Device PQC <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
