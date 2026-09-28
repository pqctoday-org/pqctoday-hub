// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop step 5 — the costs that live OUTSIDE the accelerator:
 *   A. the round trip (fixed cost per call + cost per job vs the CPU)
 *   B. sharing one engine between many cores
 *   C. batch vs latency (why GPUs need thousands of operations)
 * Numbers: data/measurements.ts (KV260 Keccak engine, KV260 hashsig engine,
 * Metal ML-DSA-65 study). The same A/B limits apply to an on-chip ASIC block.
 */
import React, { useState } from 'react'
import { ArrowLeftRight, Users, Bus, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OFFLOAD_ROUND_TRIP, FPGA_HASHSIG, GPU_BATCH } from '../data/measurements'

const Plain: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
    <div className="flex items-center gap-2">
      <Lightbulb size={16} className="text-warning shrink-0" />
      <h4 className="text-sm font-bold text-warning">In plain English</h4>
    </div>
    <div className="text-sm text-foreground/85 leading-relaxed space-y-2">{children}</div>
  </div>
)

const fmtUs = (us: number) => (us >= 1000 ? `${(us / 1000).toFixed(2)} ms` : `${Math.round(us)} µs`)

export const OffloadLab: React.FC = () => {
  const [jobs, setJobs] = useState(30)
  const [fixed, setFixed] = useState(OFFLOAD_ROUND_TRIP.fixedUs)
  const [perJob, setPerJob] = useState(OFFLOAD_ROUND_TRIP.perJobUs)
  const cpu = OFFLOAD_ROUND_TRIP.cpuPerJobUs * jobs
  const accel = fixed + perJob * jobs
  const max = Math.max(cpu, accel)
  const breakEven =
    perJob < OFFLOAD_ROUND_TRIP.cpuPerJobUs
      ? Math.ceil(fixed / (OFFLOAD_ROUND_TRIP.cpuPerJobUs - perJob))
      : null

  const [threads, setThreads] = useState(1)
  const engineRate =
    threads === 1 ? FPGA_HASHSIG.concurrency.oneThread : FPGA_HASHSIG.concurrency.fourThreads

  const maxGpu = Math.max(...GPU_BATCH.keygen.map((k) => k.gpu))

  return (
    <div className="space-y-6">
      {/* A — round trip */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary" /> A · The truck ride: CPU ↔
          accelerator
        </h3>
        <Plain>
          <p>
            Every offload is a delivery run: pack the data, hand it over the bus (DMA), flush the
            caches so both sides see the same memory, wait for the accelerator, then unpack the
            answer. That costs roughly the same whether the truck carries one box or thirty — so an
            accelerator only wins if it is so much faster per box that it earns back the trip.
          </p>
          <p>
            Our first KV260 Keccak engine lost on both counts: each call cost{' '}
            {fmtUs(OFFLOAD_ROUND_TRIP.fixedUs)} before any work, and even the per-hash cost (
            {OFFLOAD_ROUND_TRIP.perJobUs} µs) was higher than the A53 doing it itself (~
            {OFFLOAD_ROUND_TRIP.cpuPerJobUs.toFixed(0)} µs). We removed it and moved to engines that
            take a <strong>whole signature</strong> per trip.
          </p>
        </Plain>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Hash jobs per call',
              value: jobs,
              set: setJobs,
              min: 1,
              max: 500,
              step: 1,
              unit: '',
            },
            {
              label: 'Fixed cost per call',
              value: fixed,
              set: setFixed,
              min: 0,
              max: 2000,
              step: 10,
              unit: ' µs',
            },
            {
              label: 'Accelerator cost per job',
              value: perJob,
              set: setPerJob,
              min: 0.5,
              max: 80,
              step: 0.5,
              unit: ' µs',
            },
          ].map((c) => (
            <div key={c.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">{c.label}</span>
                <span className="font-mono">
                  {c.value}
                  {c.unit}
                </span>
              </div>
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={c.value}
                onChange={(e) => c.set(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label={c.label}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { label: 'A53 does it itself', v: cpu, cls: 'bg-muted-foreground/50' },
            { label: 'Offload to accelerator', v: accel, cls: 'bg-primary/60' },
          ].map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">{r.label}</span>
                <span className="font-mono">{fmtUs(r.v)}</span>
              </div>
              <div className="h-4 bg-muted/40 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-r ${r.cls} transition-all duration-300`}
                  style={{ width: `${(r.v / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p
            className={`text-sm font-bold ${accel < cpu ? 'text-status-success' : 'text-destructive'}`}
          >
            {accel < cpu
              ? `Offload wins by ${(cpu / accel).toFixed(1)}×.`
              : `The CPU wins by ${(accel / cpu).toFixed(1)}×.`}{' '}
            <span className="font-normal text-muted-foreground">
              {breakEven === null
                ? 'With the per-job cost above the CPU’s, no batch size can ever pay back the trip.'
                : `Break-even at about ${breakEven.toLocaleString()} jobs per call.`}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Starts at our measured values: {OFFLOAD_ROUND_TRIP.note} Move the sliders to see what a
            better engine would need.
          </p>
        </div>
      </section>

      {/* B — sharing */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users size={18} className="text-primary" /> B · One engine, many cores
        </h3>
        <Plain>
          <p>
            A CPU has several cores, but an accelerator block is usually one shared machine — like
            one espresso machine in an office. Four people queuing does not make four coffees at
            once. Worse, if the people who find it busy go and make instant coffee instead, they are
            served faster than waiting would take, but with a much worse result.
          </p>
        </Plain>
        <div className="flex gap-2">
          {[1, 4].map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              onClick={() => setThreads(t)}
              className={`px-3 py-1.5 rounded-md border text-xs font-bold ${
                threads === t
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
              aria-pressed={threads === t}
            >
              {t} signing thread{t > 1 ? 's' : ''}
            </Button>
          ))}
        </div>
        <svg
          viewBox="0 0 600 150"
          className="w-full h-40"
          role="img"
          aria-label="Shared FPGA engine"
        >
          {Array.from({ length: threads }, (_, i) => (
            <g key={i}>
              <rect
                x={20}
                y={15 + i * 32}
                width={80}
                height={24}
                rx={4}
                className={
                  i === 0
                    ? 'fill-primary/20 stroke-primary'
                    : 'fill-muted/50 stroke-muted-foreground/60'
                }
              />
              <text
                x={60}
                y={31 + i * 32}
                textAnchor="middle"
                className="fill-foreground text-[9px]"
              >
                thread {i + 1}
              </text>
              <line
                x1={100}
                y1={27 + i * 32}
                x2={i === 0 ? 300 : 180}
                y2={i === 0 ? 70 : 27 + i * 32}
                className={i === 0 ? 'stroke-success' : 'stroke-destructive/60'}
                strokeDasharray={i === 0 ? '0' : '4 3'}
              />
              {i > 0 && (
                <text x={186} y={31 + i * 32} className="fill-destructive text-[9px]">
                  engine busy → falls back to ARM (~30× slower)
                </text>
              )}
            </g>
          ))}
          <rect
            x={300}
            y={45}
            width={130}
            height={50}
            rx={6}
            className="fill-success/20 stroke-success"
            strokeWidth={2}
          />
          <text
            x={365}
            y={67}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-bold"
          >
            FPGA hashsig engine
          </text>
          <text x={365} y={82} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            (only one)
          </text>
          <text x={450} y={60} className="fill-foreground text-[11px] font-bold">
            {engineRate} sign/s total
          </text>
          <text x={450} y={78} className="fill-muted-foreground text-[9px]">
            {threads === 1
              ? 'p50 69 ms per signature'
              : `p99 rises to ${FPGA_HASHSIG.concurrency.p99s} s`}
          </text>
        </svg>
        <p className="text-[11px] text-muted-foreground">
          {FPGA_HASHSIG.concurrency.note} Options: a queue in front of the engine, more engines (if
          area allows — see step 4), or giving each tenant a fixed share. On-chip ASIC crypto blocks
          face exactly the same design choice.
        </p>
      </section>

      {/* C — batch vs latency */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Bus size={18} className="text-status-info" /> C · The school bus: batch throughput vs
          single-operation latency
        </h3>
        <Plain>
          <p>
            A GPU is built to finish a mountain of identical work, not to finish one piece quickly.
            Each launch has a fixed start-up cost; its thousands of lanes run in lock-step groups;
            and it hides slow memory by switching to other work while waiting. All three only pay
            off when there are thousands of independent operations in flight.
          </p>
          <p>
            One signature can use a handful of lanes and still pays the full launch cost — the CPU,
            built for low latency, finishes first. And ML-DSA’s retry loop means a batch is only as
            fast as its unluckiest signature.
          </p>
        </Plain>
        <div className="space-y-4">
          {GPU_BATCH.keygen.map((k) => (
            <div key={k.batch} className="space-y-1">
              <div className="text-xs font-bold text-foreground">
                Batch of {k.batch.toLocaleString()} ML-DSA-65 key generations
              </div>
              {[
                { label: 'CPU, 1 core', v: k.cpu1, cls: 'bg-muted-foreground/40' },
                { label: 'CPU, all cores', v: k.cpuAll, cls: 'bg-secondary/60' },
                { label: 'GPU', v: k.gpu, cls: 'bg-info/70' },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2"
                  title={`${r.label}: ${r.v} M keys/s`}
                >
                  <span className="text-[11px] w-24 shrink-0 text-foreground">{r.label}</span>
                  <div className="h-3 flex-1 bg-muted/40 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-r ${r.cls}`}
                      style={{ width: `${Math.max(1, (r.v / maxGpu) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono w-28 text-right shrink-0">
                    {(r.v * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k keys/s
                  </span>
                </div>
              ))}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            {GPU_BATCH.note} Crossover ≈ {GPU_BATCH.crossover}. {GPU_BATCH.signAt16k.note}
          </p>
        </div>
      </section>
    </div>
  )
}
