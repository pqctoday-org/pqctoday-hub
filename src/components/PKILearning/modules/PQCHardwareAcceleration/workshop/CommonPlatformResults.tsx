// SPDX-License-Identifier: AGPL-3.0-only
/** Current common CPU/PKCS#11 result set, kept separate from the historical FPGA lab. */
import React, { useMemo, useState } from 'react'
import { Activity, BarChart3, Cpu, FlaskConical, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getScenario39Ranked,
  getScenario39Scaling,
  SCENARIO39_OPERATIONS,
  SCENARIO39_SOURCE,
  X1_ISA_RESULTS,
  type Scenario39Category,
  type Scenario39Profile,
} from '../data/scenario39'

const fmt = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 })

const perOperation = (tps: number) => {
  const seconds = 1 / tps
  if (seconds >= 1) return `${seconds.toFixed(2)} s`
  if (seconds >= 0.001) return `${(seconds * 1000).toFixed(2)} ms`
  return `${(seconds * 1e6).toFixed(0)} µs`
}

const STATUS_CLASS = {
  verified: 'bg-success/10 border-success/30 text-status-success',
  measured: 'bg-primary/10 border-primary/30 text-primary',
  rejected: 'bg-warning/10 border-warning/30 text-status-warning',
  'not-applicable': 'bg-muted border-border text-muted-foreground',
} as const

export const CommonPlatformResults: React.FC = () => {
  const [category, setCategory] = useState<Scenario39Category | 'all'>('all')
  const [operationIndex, setOperationIndex] = useState(0)
  const [profile, setProfile] = useState<Scenario39Profile>('wholePlatform')
  const operations = useMemo(
    () =>
      SCENARIO39_OPERATIONS.filter(
        (operation) => category === 'all' || operation.category === category
      ),
    [category]
  )
  const operation = operations[Math.min(operationIndex, operations.length - 1)]
  const ranked = getScenario39Ranked(operation, profile)

  const selectCategory = (next: Scenario39Category | 'all') => {
    setCategory(next)
    setOperationIndex(0)
  }

  return (
    <div className="glass-panel p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" /> Step 3A — Current common platform
            benchmark
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Same CPU PKCS#11 workload across seven systems: classical controls, pure PQC, and the
            PKCS#11 v3.3 hybrid mechanisms. This is a CPU comparison, not an FPGA, GPU, or NPU
            comparison.
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded border border-primary/30 bg-primary/5 text-primary font-bold">
          {SCENARIO39_SOURCE.dataset}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-bold text-muted-foreground">Mechanism family</div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'classical', 'pqc', 'hybrid'] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant="ghost"
              onClick={() => selectCategory(item)}
              className={`border text-xs ${category === item ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border'}`}
            >
              {item === 'all'
                ? 'All'
                : item === 'pqc'
                  ? 'Pure PQC'
                  : item[0].toUpperCase() + item.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {operations.map((item, index) => (
            <Button
              key={item.id}
              size="sm"
              variant="ghost"
              onClick={() => setOperationIndex(index)}
              className={`border text-xs ${operation.id === item.id ? 'border-secondary/50 bg-secondary/10 text-secondary' : 'border-border'}`}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-muted-foreground mr-1">Measurement</span>
        {(
          [
            ['wholePlatform', 'Whole platform'],
            ['oneWorker', 'One active worker'],
          ] as const
        ).map(([item, label]) => (
          <Button
            key={item}
            size="sm"
            variant="ghost"
            aria-pressed={profile === item}
            onClick={() => setProfile(item)}
            className={`border text-xs ${profile === item ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border'}`}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1">
        <div className="text-sm font-bold text-foreground">{operation.label}</div>
        <div className="text-xs text-muted-foreground">{operation.explanation}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-2">Rank</th>
              <th className="py-2 pr-2">Platform</th>
              <th className="py-2 pr-2">CPU / worker setup</th>
              <th className="py-2 pr-2 text-right">TPS</th>
              <th className="py-2 pr-2 text-right">Time / operation</th>
              <th className="py-2 text-right">Whole ÷ one worker</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ platform, tps }, index) => {
              const scale = getScenario39Scaling(operation, platform.id)
              return (
                <tr key={platform.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-2 font-mono text-muted-foreground">{index + 1}</td>
                  <td className="py-2 pr-2 font-bold text-foreground">
                    {platform.label}
                    <div className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                      {platform.note}
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">{platform.cpu}</td>
                  <td className="py-2 pr-2 text-right font-mono font-bold">{fmt(tps)}</td>
                  <td className="py-2 pr-2 text-right font-mono">{perOperation(tps)}</td>
                  <td
                    className="py-2 text-right font-mono"
                    title="Measured whole-platform throughput divided by one-worker throughput"
                  >
                    {scale.toFixed(2)}×
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-1">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <Layers size={14} className="text-status-warning" /> Read the two views correctly
          </div>
          <p className="text-muted-foreground">
            One worker is the closest available per-worker view. Whole-platform throughput is a
            measured service-capacity result, not a promise of linear scaling or identical cores.
            The Ventuno Q and Apple systems are heterogeneous; the X1 exposes virtual CPUs.
          </p>
        </div>
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-1">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <Cpu size={14} className="text-status-success" /> Hybrid is not an inferred sum
          </div>
          <p className="text-muted-foreground">
            The hybrid rows are direct PKCS#11 v3.3 measurements. Their classical and PQC secrets
            are combined inside the HSM, so compare them with their measured ECDSA/X25519 and
            ML-DSA/ML-KEM controls rather than adding separate TPS figures.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <div className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity size={15} className="text-primary" /> AI X1 Pro — AMD64 instruction-set results
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-2">Capability</th>
                <th className="py-1.5 pr-2">Result from the actual X1 build</th>
                <th className="py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {X1_ISA_RESULTS.map((item) => (
                <tr key={item.feature} className="border-b border-border/50 align-top">
                  <td className="py-1.5 pr-2 font-medium text-foreground">{item.feature}</td>
                  <td className="py-1.5 pr-2 text-muted-foreground">{item.result}</td>
                  <td className="py-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${STATUS_CLASS[item.status]}`}
                    >
                      {item.status === 'not-applicable' ? 'not applicable' : item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground flex items-start gap-1">
        <FlaskConical size={11} className="mt-0.5 shrink-0" /> {SCENARIO39_SOURCE.note} Evidence:{' '}
        {SCENARIO39_SOURCE.dashboard}; {SCENARIO39_SOURCE.evidence}.
      </p>
    </div>
  )
}
