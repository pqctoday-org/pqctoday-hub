// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop step 3 — our own measurements across three generations of Arm
 * cores (Apple M4 Pro, Cortex-A55, Cortex-A53). Data: data/measurements.ts,
 * 2026-09-24 four-target bench (M5 Max column deliberately excluded — it was
 * measured under unrelated load). Bars are log-scaled because the rows span
 * five orders of magnitude; every bar carries its platform name and value, so
 * identity never rests on colour alone. A table view is always one click away.
 */
import React, { useMemo, useState } from 'react'
import { FlaskConical, Table2, BarChart3, Cpu, RefreshCw, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PLATFORMS,
  PLATFORM_ORDER,
  SIGN_BENCH_0924,
  SIGN_BENCH_0927,
  BENCH_0927_NOTE,
  KV260_FPGA_ROWS,
  MLDSA44_BOARD_COMPARE,
  SIGN_BENCH_0926,
  BENCH_0926_NOTE,
  KV260_0926_PATH,
  M4_AB_0927,
  FPGA_MLDSA,
  type PlatformId,
  type BoardId,
} from '../data/measurements'

const BAR_CLASS: Record<PlatformId, string> = {
  m4pro: 'bg-primary/70',
  mx95: 'bg-secondary/70',
  kv260: 'bg-tertiary/70',
}

const fmt = (v: number) =>
  v >= 100 ? Math.round(v).toLocaleString() : v >= 10 ? v.toFixed(1) : v.toFixed(2)

const perOp = (opsPerSec: number) => {
  const s = 1 / opsPerSec
  if (s >= 1) return `${s.toFixed(1)} s`
  if (s >= 0.001) return `${(s * 1000).toFixed(1)} ms`
  return `${(s * 1e6).toFixed(0)} µs`
}

const LOG_MIN = -1 // 0.1 ops/s
const LOG_MAX = 6 // 1,000,000 ops/s
const logPct = (v: number) => Math.max(2, ((Math.log10(v) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100)

export const PlatformExplorer: React.FC = () => {
  const [algo, setAlgo] = useState('ML-DSA-65')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const row = useMemo(() => SIGN_BENCH_0927.find((r) => r.algorithm === algo)!, [algo])

  const sha2 = SIGN_BENCH_0927.find((r) => r.algorithm === 'SLH-DSA-SHA2-128s')!
  const shake = SIGN_BENCH_0927.find((r) => r.algorithm === 'SLH-DSA-SHAKE-128s')!
  const mldsa65 = SIGN_BENCH_0927.find((r) => r.algorithm === 'ML-DSA-65')!

  return (
    <div className="space-y-6">
      {/* Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLATFORM_ORDER.map((p) => {
          const pl = PLATFORMS[p] // eslint-disable-line security/detect-object-injection
          return (
            <div key={p} className="glass-panel p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm ${BAR_CLASS[p]}`} aria-hidden />
                <span className="text-sm font-bold text-foreground">{pl.label}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {pl.core} · {pl.isa} · {pl.cores} cores
              </div>
              <div className="flex flex-wrap gap-1">
                {pl.cryptoFeatures.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-status-success border border-success/30"
                  >
                    {f}
                  </span>
                ))}
                {pl.missing.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 line-through"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground italic">{pl.featureSource}</div>
            </div>
          )
        })}
      </div>

      {/* Algorithm picker */}
      <div className="glass-panel p-3 space-y-2">
        <div className="text-xs font-bold text-muted-foreground">Pick an algorithm</div>
        <div className="flex flex-wrap gap-2">
          {SIGN_BENCH_0927.map((r) => (
            <Button
              key={r.algorithm}
              variant="ghost"
              size="sm"
              onClick={() => setAlgo(r.algorithm)}
              className={`border text-xs ${
                algo === r.algorithm
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border'
              }`}
            >
              {r.algorithm}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart / table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg font-bold text-foreground">{algo} — signatures per second</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('chart')}
              className={view === 'chart' ? 'bg-muted' : ''}
              aria-pressed={view === 'chart'}
            >
              <BarChart3 size={14} className="mr-1" /> Chart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('table')}
              className={view === 'table' ? 'bg-muted' : ''}
              aria-pressed={view === 'table'}
            >
              <Table2 size={14} className="mr-1" /> Table
            </Button>
          </div>
        </div>

        {view === 'chart' ? (
          <div className="space-y-3">
            {PLATFORM_ORDER.map((p) => {
              const v = row.ops[p] // eslint-disable-line security/detect-object-injection
              return (
                <div
                  key={p}
                  className="space-y-1"
                  title={`${PLATFORMS[p].label}: ${fmt(v)} signatures/s (${perOp(v)} each)`}
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-foreground">
                      {PLATFORMS[p].label}
                      {p === 'kv260' && KV260_FPGA_ROWS.includes(algo) && (
                        <span className="ml-1.5 text-[9px] px-1 rounded bg-success/15 text-status-success">
                          FPGA
                        </span>
                      )}
                    </span>
                    <span className="text-foreground">
                      <strong>{fmt(v)}</strong>/s · {perOp(v)} per signature ·{' '}
                      <span className="text-muted-foreground">
                        {p === 'm4pro'
                          ? 'reference'
                          : row.ops.m4pro / v < 1.1
                            ? 'close to the M4 Pro (see note)'
                            : `${(row.ops.m4pro / v).toFixed(1)}× slower`}
                      </span>
                    </span>
                  </div>
                  <div className="h-4 bg-muted/40 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-r ${BAR_CLASS[p]} transition-all duration-500`}
                      style={{ width: `${logPct(v)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
              <span>0.1/s</span>
              <span>10/s</span>
              <span>1,000/s</span>
              <span>100,000/s</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Logarithmic scale — each step is 100×.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1.5 pr-2">Algorithm</th>
                  {PLATFORM_ORDER.map((p) => (
                    <th key={p} className="py-1.5 pr-2 text-right">
                      {PLATFORMS[p].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIGN_BENCH_0927.map((r) => (
                  <tr
                    key={r.algorithm}
                    className={`border-b border-border/50 ${r.algorithm === algo ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-1.5 pr-2 font-medium">{r.algorithm}</td>
                    {PLATFORM_ORDER.map((p) => (
                      <td key={p} className="py-1.5 pr-2 text-right font-mono">
                        {fmt(r.ops[p])} {/* eslint-disable-line security/detect-object-injection */}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground flex items-start gap-1">
          <FlaskConical size={11} className="mt-0.5 shrink-0" /> {BENCH_0927_NOTE}
        </p>
      </div>

      {/* Engine update: 09-24 -> 09-26 */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <RefreshCw size={16} className="text-primary" /> Same boards, two days later: the software
          update
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Between the two runs our engine moved ML-DSA onto hand-written NEON (SIMD) assembly,
          reworked SLH-DSA’s hashing, and the KV260 loaded its SLH-DSA hash-engine bitstream.
          Nothing about the silicon changed.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-2">Algorithm (sign/s)</th>
                {(['mx95', 'kv260'] as BoardId[]).map((b) => (
                  <th key={b} className="py-1.5 pr-2 text-right" colSpan={2}>
                    {PLATFORMS[b].label}: 09-24 → 09-26
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGN_BENCH_0926.map((r) => {
                const old = SIGN_BENCH_0924.find((o) => o.algorithm === r.algorithm)
                if (!old) return null
                return (
                  <tr key={r.algorithm} className="border-b border-border/50">
                    <td className="py-1.5 pr-2 font-medium">{r.algorithm}</td>
                    {(['mx95', 'kv260'] as BoardId[]).map((b) => {
                      const before = old.ops[b] // eslint-disable-line security/detect-object-injection
                      const after = r.ops[b] // eslint-disable-line security/detect-object-injection
                      const x = after / before
                      const fpga = b === 'kv260' && KV260_0926_PATH[r.algorithm] === 'fpga'
                      return (
                        <React.Fragment key={b}>
                          <td className="py-1.5 pr-1 text-right font-mono text-muted-foreground">
                            {fmt(before)} → {fmt(after)}
                          </td>
                          <td
                            className={`py-1.5 pr-2 text-right font-mono font-bold ${x >= 2 ? 'text-status-success' : 'text-muted-foreground'}`}
                          >
                            {x.toFixed(1)}×
                            {fpga && (
                              <span className="ml-1 text-[9px] px-1 rounded bg-success/15 text-status-success">
                                FPGA
                              </span>
                            )}
                          </td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ul className="text-xs text-foreground/85 space-y-1 list-disc pl-4">
          <li>
            <strong>SIMD in software beat our ML-DSA FPGA.</strong> The KV260’s A53 alone now signs
            ML-DSA-65 at {fmt(SIGN_BENCH_0926[1].ops.kv260)}/s — about five times the{' '}
            {FPGA_MLDSA.withFpga}/s we reached with two FPGA signers on the older engine.
          </li>
          <li>
            <strong>The FPGA shows up where it should.</strong> SLH-DSA-SHAKE-128s: KV260{' '}
            {fmt(SIGN_BENCH_0926[6].ops.kv260)}/s on the fabric vs i.MX 95{' '}
            {fmt(SIGN_BENCH_0926[6].ops.mx95)}/s in software — a slower board, 13× faster, for the
            one workload the fabric was built for. For SHA2-128s, which stays on the CPU’s SHA-256
            instructions, the faster i.MX 95 still wins.
          </li>
          <li>
            Ed25519 was not touched by the update and still moved ~16% on the i.MX 95 — the size of
            ordinary run-to-run and load differences. Read the 5–45× changes as real; ignore
            differences of a few tens of percent between runs.
          </li>
        </ul>
        <p className="text-[10px] text-muted-foreground flex items-start gap-1">
          <FlaskConical size={11} className="mt-0.5 shrink-0" /> {BENCH_0926_NOTE}
        </p>
      </div>

      {/* One feature on/off, M4 Pro */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ToggleRight size={16} className="text-primary" /> Switch one thing on, measure again (M4
          Pro)
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The cleanest way to credit an acceleration: same machine, same engine, one feature on or
          off, runs alternated. Left: letting SLH-DSA’s SHAKE use the M4’s SHA-3 instructions.
          Right: running ML-DSA/ML-KEM on AWS-LC’s hand-written NEON code instead of portable Rust.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              title: 'SHA-3 instructions for SHAKE',
              rows: M4_AB_0927.keccakAsm,
              off: 'off',
              on: 'on',
            },
            {
              title: 'AWS-LC NEON for ML-DSA / ML-KEM',
              rows: M4_AB_0927.awslcNeon,
              off: 'Rust',
              on: 'AWS-LC',
            },
          ].map((t) => (
            <div key={t.title} className="overflow-x-auto">
              <div className="text-xs font-bold text-foreground mb-1">{t.title}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1 pr-2">ops/s</th>
                    <th className="py-1 pr-2 text-right">{t.off}</th>
                    <th className="py-1 pr-2 text-right">{t.on}</th>
                    <th className="py-1 text-right">gain</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r) => (
                    <tr key={r.cell} className="border-b border-border/50">
                      <td className="py-1 pr-2">{r.cell}</td>
                      <td className="py-1 pr-2 text-right font-mono">{fmt(r.off)}</td>
                      <td className="py-1 pr-2 text-right font-mono">{fmt(r.on)}</td>
                      <td
                        className={`py-1 text-right font-mono font-bold ${r.x >= 1.5 ? 'text-status-success' : 'text-muted-foreground'}`}
                      >
                        {r.x.toFixed(2)}×
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <ul className="text-xs text-foreground/85 space-y-1 list-disc pl-4">
          <li>
            <strong>SHA-3 instructions: +17–21%.</strong> Real, but small next to AES’s 7–13× — the
            M4’s wide cores already run the software Keccak well. Even with it, SLH-DSA-SHA2 still
            signs about 7× faster than SLH-DSA-SHAKE on this chip.
          </li>
          <li>
            <strong>
              AWS-LC NEON: about 4× for ML-DSA signing and verifying, 7–8× for key generation.
            </strong>{' '}
            Hand-scheduled SIMD code is the biggest single CPU win we measured for lattice
            signatures. ML-KEM encapsulation and key generation stay on Rust in our build, which is
            why they show no change.
          </li>
        </ul>
        <p className="text-[10px] text-muted-foreground flex items-start gap-1">
          <FlaskConical size={11} className="mt-0.5 shrink-0" /> {M4_AB_0927.note} hsm 476f97d1,
          full optimisation, 4 workers, background 83–92% CPU idle.
        </p>
      </div>

      {/* Three lessons from the numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="glass-panel p-4 space-y-2">
          <h4 className="text-sm font-bold text-foreground">1 · Same scheme, opposite winner</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1" />
                <th className="py-1 text-right">SHA2-128s</th>
                <th className="py-1 text-right">SHAKE-128s</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_ORDER.map((p) => {
                const a = sha2.ops[p] // eslint-disable-line security/detect-object-injection
                const b = shake.ops[p] // eslint-disable-line security/detect-object-injection
                return (
                  <tr key={p} className="border-t border-border/50">
                    <td className="py-1">{PLATFORMS[p].label}</td>
                    <td
                      className={`py-1 text-right font-mono ${a > b ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                    >
                      {fmt(a)}
                    </td>
                    <td
                      className={`py-1 text-right font-mono ${b > a ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                    >
                      {fmt(b)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground leading-relaxed">
            On every CPU the SHA-2 variant signs 9–12× faster than the SHAKE variant: SHA-256
            instructions on all three chips, plus our SHA-2-specific software work. Switching on the
            M4’s SHA-3 instructions narrows the gap only by about 20%. The one place SHAKE wins is
            the KV260 — because its FPGA does the SHAKE hashing.
          </p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <h4 className="text-sm font-bold text-foreground">2 · Lattice vs hash: a 5,000× gap</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            On the CPUs, ML-DSA-65 signs <strong>more than 5,000× faster</strong> than
            SLH-DSA-SHAKE-128s (i.MX 95: {fmt(mldsa65.ops.mx95)} vs {fmt(shake.ops.mx95)} per
            second). That is why acceleration effort pays off so differently: shaving 30% off a
            fraction of a millisecond rarely matters; turning a one-second signature into 70 ms
            changes what a device can do.
          </p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Cpu size={14} /> 3 · Core generation, same instructions
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The A55 and A53 have the same crypto instructions, yet with one worker the A55 signs
            ML-DSA-44{' '}
            <strong>
              {MLDSA44_BOARD_COMPARE.oneWorker.mx95}/s vs {MLDSA44_BOARD_COMPARE.oneWorker.kv260}/s
            </strong>{' '}
            (+37%) with a p50 of {MLDSA44_BOARD_COMPARE.p50ms.mx95} ms vs{' '}
            {MLDSA44_BOARD_COMPARE.p50ms.kv260} ms. Newer microarchitecture and a higher clock help
            everything; new instructions help only the workloads that use them. Always compare at
            equal thread counts — the KV260’s “700+/s” was a 4-worker figure.
          </p>
        </div>
      </div>
    </div>
  )
}
