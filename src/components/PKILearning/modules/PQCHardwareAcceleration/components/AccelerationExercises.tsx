// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ModelId } from '../data/models'

export interface SimulationConfig {
  step: number
  model?: ModelId
}

interface AccelerationExercisesProps {
  onNavigateToSimulate: () => void
  onSetSimulationConfig?: (config: SimulationConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: SimulationConfig
}

const SCENARIOS: Scenario[] = [
  {
    id: 'bus-vs-car',
    title: '1. Car or School Bus? GPU vs CPU',
    description:
      'Open the GPU model, read the plain-English analogy, then compare the “1 signature” and “4,096 signatures” rows of the diagram.',
    badge: 'Models',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'With one signature a single lane works while the launch cost is paid in full, so the CPU finishes first. With thousands the launch cost is shared and every lane is busy. That is why GPU PQC figures are always quoted at large batches.',
    config: { step: 0, model: 'gpu' },
  },
  {
    id: 'npu-mismatch',
    title: '2. Why the AI Accelerator Cannot Help',
    description:
      'Open the NPU model and check each ✗ against what the “Building blocks” step says Keccak and the NTT need.',
    badge: 'Models',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'The NPU does rounded 8-bit multiply-adds. ML-DSA needs exact 23-bit modular arithmetic, and Keccak has no multiplication at all — the mismatch is structural, not a matter of speed.',
    config: { step: 0, model: 'npu' },
  },
  {
    id: 'montgomery-by-hand',
    title: '3. Check Montgomery Reduction by Hand',
    description:
      'In “Building blocks”, follow the decimal example 4321 → 5000 → 50 with N = 97 and R = 100. Verify that 50 × 100 ≡ 4321 (mod 97).',
    badge: 'Blocks',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    observe:
      '50 × 100 = 5000 = 51 × 97 + 53, and 4321 = 44 × 97 + 53 — the same remainder. The only “division” was dropping two zeros, which in binary is a free shift.',
    config: { step: 1 },
  },
  {
    id: 'sha2-vs-shake',
    title: '4. Same Scheme, Opposite Winner',
    description:
      'In “Our measurements”, compare SLH-DSA-SHA2-128s with SLH-DSA-SHAKE-128s on each platform, then look at each platform’s instruction badges.',
    badge: 'Measured',
    badgeColor: 'bg-success/20 text-success border-success/50',
    observe:
      'On the Cortex-A55 and A53, which have SHA-256 instructions and no SHA-3 ones, the SHA-2 variant signs about 11× faster on today’s engine — only the KV260, whose FPGA does SHAKE, reverses it. The hardware you have, not the algorithm, decides which variant to deploy on a given chip.',
    config: { step: 2 },
  },
  {
    id: 'software-beat-fpga',
    title: '5. When Software Beat Our FPGA',
    description:
      'In “Our measurements”, read the “Same boards, two days later” table, then compare the KV260’s new ML-DSA-65 figure with the +29% FPGA result in step 4.',
    badge: 'Measured',
    badgeColor: 'bg-success/20 text-success border-success/50',
    observe:
      'NEON assembly on the A53 alone reached about five times the FPGA-assisted ML-DSA rate. Meanwhile the FPGA made the KV260 13× faster than the i.MX 95 on SLH-DSA-SHAKE-128s. Accelerate the workload that is actually stuck.',
    config: { step: 2 },
  },
  {
    id: 'timing-closure',
    title: '6. Close Timing at 250 MHz',
    description:
      'In “FPGA limits”, move the clock slider from 200 to 260 MHz and watch where the clock period crosses the 4-lane engine’s critical path.',
    badge: 'FPGA',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
    observe:
      'At 250 MHz the period is 4.000 ns and our routed path was 4.010 ns — 10 picoseconds too long. Shipping at 240 MHz (4.167 ns) cost 4% throughput; the alternative was a redesign.',
    config: { step: 3 },
  },
  {
    id: 'break-even',
    title: '7. Can Any Batch Pay Back the Trip?',
    description:
      'In “Offload, sharing and batching”, keep our measured costs and move the batch slider to 500. Then lower the per-job cost below 12 µs.',
    badge: 'Offload',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
    observe:
      'At 58.7 µs per job the accelerator is slower than the A53 for every batch size — the fixed cost can never be earned back. Only when the per-job cost drops below the CPU’s does a break-even batch size appear.',
    config: { step: 4 },
  },
]

export const AccelerationExercises: React.FC<AccelerationExercisesProps> = ({
  onNavigateToSimulate,
  onSetSimulationConfig,
}) => {
  const navigate = useNavigate()

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetSimulationConfig?.(scenario.config)
    onNavigateToSimulate()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Each exercise opens the right Workshop step. Predict the answer first, then check it
          against the diagram or our measurements.
        </p>
      </div>

      <div className="space-y-4">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about PQC hardware acceleration.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
