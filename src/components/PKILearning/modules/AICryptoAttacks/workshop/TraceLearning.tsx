// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateSyntheticTraceComparison } from '../data/traceLearningData'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'

export const TraceLearning: React.FC = () => {
  const [jitter, setJitter] = useState(2)
  const [maskingOrder, setMaskingOrder] = useState<1 | 2 | 3>(1)
  const [traceCount, setTraceCount] = useState(250)

  const sim = useMemo(
    () => generateSyntheticTraceComparison({ jitter, maskingOrder, traceCount }),
    [jitter, maskingOrder, traceCount]
  )

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">
              Step 3: Synthetic Trace Learning Lab
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore purely synthetic in-page waveforms to compare how fixed-window template
              separation and a shift-tolerant toy classifier respond to clock jitter, masking order,
              and trace count.
            </p>
          </div>
        </div>

        <ReadingNote title="Synthetic-only safety boundary">
          <p>
            All curves and separation scores below are computed in-browser from synthetic Gaussian
            pulses and pseudorandom noise. This lab contains zero real-device trace captures, zero
            STM32/ChipWhisperer hardware parameters, and no trained ML model or weights artefact.
          </p>
        </ReadingNote>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="space-y-1.5">
            <label htmlFor="jitter-slider" className="text-xs font-semibold text-foreground block">
              Synthetic Clock Jitter: {jitter} samples
            </label>
            <input
              id="jitter-slider"
              type="range"
              min={0}
              max={8}
              step={1}
              value={jitter}
              onChange={(e) => setJitter(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Simulates desynchronisation across traces.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground block">
              Masking Order (ω): {maskingOrder}
            </span>
            <div className="flex gap-2" role="group" aria-label="Masking order">
              {([1, 2, 3] as const).map((ord) => (
                <Button
                  key={ord}
                  type="button"
                  size="sm"
                  variant={maskingOrder === ord ? 'gradient' : 'outline'}
                  onClick={() => setMaskingOrder(ord)}
                  aria-pressed={maskingOrder === ord}
                >
                  Order {ord}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Higher order suppresses single-sample signal.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="traces-slider" className="text-xs font-semibold text-foreground block">
              Synthetic Trace Budget: {traceCount} traces
            </label>
            <input
              id="traces-slider"
              type="range"
              min={50}
              max={1000}
              step={50}
              value={traceCount}
              onChange={(e) => setTraceCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Physical or co-located trace capture still required.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <p className="text-xs font-semibold text-foreground">
              Synthetic Waveform Preview (Class A vs Class B)
            </p>
            <div className="flex items-end gap-1 h-24 pt-2" aria-label="Synthetic trace bars">
              {sim.sampleWaveA.map((val, idx) => {
                const valB = sim.sampleWaveB.at(idx) ?? 0
                const hA = Math.max(8, Math.min(100, Math.round(Math.abs(val) * 75)))
                const hB = Math.max(8, Math.min(100, Math.round(Math.abs(valB) * 75)))
                return (
                  <div key={idx} className="flex-1 flex items-end gap-0.5 h-full">
                    <div
                      className="flex-1 bg-primary/70 rounded-t"
                      style={{ height: `${hA}%` }}
                      title={`Sample ${idx} Class A: ${val}`}
                    />
                    <div
                      className="flex-1 bg-secondary/70 rounded-t"
                      style={{ height: `${hB}%` }}
                      title={`Sample ${idx} Class B: ${valB}`}
                    />
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Primary bars: synthetic Class A; Secondary bars: synthetic Class B (jitter-shifted).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <p className="text-xs font-semibold text-foreground">
              Toy Indicator Comparison (Illustrative Only)
            </p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Fixed-window template indicator</span>
                  <span className="font-mono font-semibold text-foreground">
                    {sim.templateScore}%
                  </span>
                </div>
                <div className="h-2.5 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-status-warning transition-all"
                    style={{ width: `${sim.templateScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Shift-tolerant learned-feature indicator
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {sim.learnedScore}%
                  </span>
                </div>
                <div className="h-2.5 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${sim.learnedScore}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{sim.interpretation}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ClaimLine id="AI-4.1" chip="Jitter vs CNN" />
          <ClaimLine id="AI-4.2" chip="Masked Kyber-768" />
        </div>
      </section>
    </div>
  )
}
