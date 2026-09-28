// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop step 4 — why an FPGA is not a magic speed-up. Three limits, all
 * shown with PQC Today's KV260 numbers (data/measurements.ts):
 *   A. area: LUTs / flip-flops / DSP / block RAM, and what our designs used
 *   B. clock: the critical path sets the MHz, and bigger designs route slower
 *   C. Amdahl: the ML-DSA "+29%" — the CPU keeps most of each signature
 */
import React, { useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { CITED_FACTS, SOURCES, MULTI_ACCEL, MULTI_ACCEL_FACTS } from '../data/cited'
import { CIRCUIT_SIZES, CIRCUIT_LESSONS, MULTICORE } from '../data/circuits'
import { Grid3x3, Timer, PieChart, Lightbulb, RefreshCcw, Ruler, Cpu } from 'lucide-react'
import {
  FPGA_DEVICE,
  FPGA_BUILDS,
  FPGA_LANE_COST,
  FPGA_TIMING,
  FPGA_MLDSA,
  FPGA_HASHSIG,
  FPGA_REPROGRAM,
} from '../data/measurements'

const RESOURCES = [
  {
    name: 'LUT (look-up table)',
    total: FPGA_DEVICE.luts.toLocaleString(),
    plain:
      'A tiny programmable truth table: give it up to 6 input bits and it returns whatever output you wrote into it. Every XOR, AND, adder bit and multiplexer in your design is built from LUTs. They are the “floor space” of the warehouse.',
    ours: 'ML-DSA image: 94,630 (81%). SLH-DSA image: 64,582 (55%).',
  },
  {
    name: 'Flip-flop (register)',
    total: FPGA_DEVICE.flipFlops.toLocaleString(),
    plain:
      'A 1-bit memory that updates once per clock tick. Registers hold state (the 1,600-bit Keccak state is 1,600 of them) and split long logic into shorter clock-sized stages (pipelining).',
    ours: 'ML-DSA image: 115,644 (49%) — plenty left; registers were never our limit.',
  },
  {
    name: 'LUTRAM and shift registers',
    total: 'part of the LUTs',
    plain:
      'Some LUTs can be turned into tiny 64-bit memories or delay lines. Handy for small tables and short buffers — but every LUT used this way is one fewer for logic.',
    ours: 'ML-DSA image: 7,394 LUTs used as memory and 2,108 as shift registers.',
  },
  {
    name: 'DSP slice',
    total: FPGA_DEVICE.dsp.toLocaleString(),
    plain:
      'A hard-wired multiply-and-add block (about 27 × 18 bits). Much faster and smaller than a multiplier built from LUTs — ideal for NTT butterflies and neural networks, useless for Keccak, which never multiplies.',
    ours: 'One ML-DSA signer: 27. The whole SLH-DSA engine: 11. The behaviour monitor (a neural network): 50.',
  },
  {
    name: 'Block RAM (BRAM)',
    total: `${FPGA_DEVICE.bramTiles} tiles of 36 Kb`,
    plain:
      'Medium on-chip memories next to the logic. Matrices, polynomials and DMA buffers live here; each tile can also split into two 18 Kb halves. Fast, but scarce.',
    ours: 'The ML-DSA image used 137 of 144 tiles (95%) — memory ran out before logic did.',
  },
  {
    name: 'UltraRAM (URAM)',
    total: `${FPGA_DEVICE.uram} blocks of 288 Kb`,
    plain:
      'Larger, denser on-chip memory blocks — eight times a block RAM tile, but with fewer ways to connect them. Good for big buffers such as a neural network’s weights or a large key cache.',
    ours: 'Both images use only 3–4 (the monitor’s model). An obvious reserve if a design runs out of block RAM.',
  },
  {
    name: 'Clock generators (PLL / MMCM)',
    total: 'a few',
    plain:
      'Circuits that make the clock frequencies the design runs on, by multiplying and dividing a reference clock. Only certain ratios are possible, so you rarely get exactly the frequency you ask for.',
    ours: 'Asking for 150 MHz gave 142.857 MHz. The SLH-DSA engine runs on its own 240 MHz clock while the monitor keeps 142.857 MHz.',
  },
  {
    name: 'Routing (the wiring)',
    total: 'not counted in a table',
    plain:
      'The programmable wires between all the blocks. You never “use up” a number of them, but a full, crowded chip needs longer detours — which lengthens the critical path and lowers the clock you can run.',
    ours: 'Why our 4-lane engine missed 250 MHz by 10 picoseconds: more lanes, more wiring, longer paths.',
  },
  {
    name: 'The hard processor system',
    total: '4 × Cortex-A53 + memory controller',
    plain:
      'The Zynq chip also contains fixed ARM cores, a DDR memory controller and high-speed links to the fabric. They are not built from LUTs — and every offload has to cross the link between them and the fabric.',
    ours: 'This crossing (DMA + cache flushes) is the round-trip cost measured in step 5.',
  },
]

const fmt = (n: number) => n.toLocaleString()

export const FpgaLimitsLab: React.FC = () => {
  const [mhz, setMhz] = useState(250)
  const period = 1000 / mhz
  // Critical path of the 4-lane hashsig engine: 4.010 ns in the 250 MHz run
  // (WNS −0.010 ns), 4.164 ns in the 240 MHz run (WNS +0.003 ns). Routing
  // differs per run, so show the band, not one number.
  const pathLo = 4.01
  const pathHi = 4.164
  const verdict = period >= pathHi ? 'meets' : period >= pathLo ? 'maybe' : 'fails'
  const scaleMax = 10.5

  return (
    <div className="space-y-6">
      {/* A — area */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Grid3x3 size={18} className="text-status-success" /> A · The floor space: what an FPGA is
          made of
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RESOURCES.map((r) => (
            <div key={r.name} className="rounded-md border border-border bg-card/40 p-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">{r.name}</span>
                <span className="text-xs font-mono text-muted-foreground">KV260: {r.total}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed mt-1">{r.plain}</p>
              <p className="text-[11px] text-primary leading-relaxed mt-1">Ours: {r.ours}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-muted-foreground">
            Our designs against the {fmt(FPGA_DEVICE.luts)}-LUT device
          </div>
          {FPGA_BUILDS.map((b) => {
            const pct = (b.luts / FPGA_DEVICE.luts) * 100
            return (
              <div key={b.name} className="space-y-1">
                <div className="flex justify-between text-xs gap-2">
                  <span className="font-bold text-foreground">{b.name}</span>
                  <span className="text-foreground font-mono shrink-0">
                    {fmt(b.luts)} LUT · {pct.toFixed(0)}% · {b.mhz} MHz
                  </span>
                </div>
                <div className="h-3 bg-muted/40 rounded-sm overflow-hidden">
                  <div className="h-full bg-success/60 rounded-r" style={{ width: `${pct}%` }} />
                </div>
                {b.bram !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                      block RAM
                    </span>
                    <div className="h-2 flex-1 bg-muted/40 rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-r ${b.bram / FPGA_DEVICE.bramTiles > 0.9 ? 'bg-destructive/70' : 'bg-secondary/60'}`}
                        style={{ width: `${(b.bram / FPGA_DEVICE.bramTiles) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {b.bram}/{FPGA_DEVICE.bramTiles}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">{b.note}</p>
              </div>
            )
          })}
          <div className="space-y-1">
            <div className="flex justify-between text-xs gap-2">
              <span className="font-bold text-destructive">Hypothetical: 8 Keccak lanes</span>
              <span className="text-destructive font-mono shrink-0">
                {FPGA_LANE_COST.eightLaneEstimateLuts}
              </span>
            </div>
            <div className="h-3 bg-muted/40 rounded-sm overflow-hidden relative">
              <div className="h-full bg-destructive/60" style={{ width: '100%' }} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Doesn’t fit. One lane cost {FPGA_LANE_COST.earlyLaneLuts} LUT at first and{' '}
              {FPGA_LANE_COST.redesignedLaneLuts} after a redesign — yet the Keccak round itself is
              only {FPGA_LANE_COST.keccakRoundLuts}. Most of each lane is plumbing: buffers,
              addressing and control. {FPGA_LANE_COST.sha2DroppedNote}
            </p>
          </div>
        </div>
      </section>

      {/* B — clock */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Timer size={18} className="text-status-success" /> B · The belt speed: why MHz depends on
          the design
        </h3>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-warning shrink-0" />
            <h4 className="text-sm font-bold text-warning">In plain English</h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            An assembly line moves one step every time the bell rings. Between two bells, every
            station must finish its piece of work — so the bell can ring only as fast as the{' '}
            <strong>slowest</strong> station allows. On an FPGA the bell is the clock, and the
            slowest station is the <strong>critical path</strong>: the longest chain of LUTs and
            wires between two registers.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            A CPU’s clock is fixed by the chip designer. An FPGA’s clock is whatever your own design
            can manage — add more lanes and the wires get longer and more crowded, the critical path
            grows, and the clock you can run drops. You can split a slow station into two
            (pipelining), but that costs registers, area and an extra cycle of latency.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-foreground">
              Target clock for the 4-lane SLH-DSA engine
            </span>
            <span className="font-mono text-foreground">
              {mhz} MHz → one tick every {period.toFixed(3)} ns
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={300}
            step={5}
            value={mhz}
            onChange={(e) => setMhz(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="Target clock in MHz"
          />
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24 shrink-0">clock period</span>
              <div className="h-4 flex-1 bg-muted/40 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary/60"
                  style={{ width: `${(period / scaleMax) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24 shrink-0">critical path</span>
              <div className="h-4 flex-1 bg-muted/40 rounded-sm overflow-hidden relative">
                <div
                  className="h-full bg-warning/60"
                  style={{ width: `${(pathLo / scaleMax) * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full bg-warning/30"
                  style={{
                    left: `${(pathLo / scaleMax) * 100}%`,
                    width: `${((pathHi - pathLo) / scaleMax) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p
            className={`text-sm font-bold ${
              verdict === 'meets'
                ? 'text-status-success'
                : verdict === 'maybe'
                  ? 'text-status-warning'
                  : 'text-destructive'
            }`}
          >
            {verdict === 'meets' && 'Timing met: every path settles before the next tick.'}
            {verdict === 'maybe' &&
              'Knife-edge: inside the 4.01–4.16 ns band our routed builds landed in. The 250 MHz build missed by 0.010 ns; we shipped at 240 MHz.'}
            {verdict === 'fails' &&
              'Timing fails: some paths are still switching when the next tick arrives — the hardware would compute wrong answers.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-2">Our routed build</th>
                <th className="py-1.5 pr-2 text-right">Slack (WNS)</th>
                <th className="py-1.5 pr-2 text-right">Longest path</th>
                <th className="py-1.5">Result</th>
              </tr>
            </thead>
            <tbody>
              {FPGA_TIMING.examples.map((t) => (
                <tr key={t.target} className="border-b border-border/50">
                  <td className="py-1.5 pr-2">{t.target}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {t.wnsNs > 0 ? '+' : ''}
                    {t.wnsNs.toFixed(3)} ns
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {t.longestPathNs.toFixed(3)} ns
                  </td>
                  <td
                    className={`py-1.5 font-bold ${t.met ? 'text-status-success' : 'text-destructive'}`}
                  >
                    {t.met ? 'met' : 'missed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-muted-foreground mt-2">
            {FPGA_TIMING.note} Two more limits: the clock generator only offers certain frequencies
            (asking for 150 MHz gave 142.857 MHz), and the throughput you get is lanes × clock ÷
            cycles per operation — so doubling lanes only helps if the clock does not fall and the
            data can be fed in fast enough.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="text-xs font-bold text-muted-foreground mb-1">
            Lane scaling for SLH-DSA-SHAKE-128s signing
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-2">Keccak lanes</th>
                <th className="py-1.5 pr-2 text-right">Clock</th>
                <th className="py-1.5 pr-2 text-right">Sign time</th>
                <th className="py-1.5">Source</th>
              </tr>
            </thead>
            <tbody>
              {FPGA_HASHSIG.laneScaling.map((l) => (
                <tr key={`${l.lanes}-${l.source}`} className="border-b border-border/50">
                  <td className="py-1.5 pr-2">{l.lanes}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{l.mhz} MHz</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{l.signMs} ms</td>
                  <td className="py-1.5 text-muted-foreground">{l.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* C — Amdahl */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <PieChart size={18} className="text-status-success" /> C · Why ML-DSA gained only +
          {FPGA_MLDSA.gainPct}%
        </h3>
        <div className="space-y-2">
          {[
            { label: 'ARM only', v: FPGA_MLDSA.armOnly, cls: 'bg-muted-foreground/40' },
            { label: 'ARM + 2 FPGA signers', v: FPGA_MLDSA.withFpga, cls: 'bg-success/60' },
            {
              label: 'What the two signers could do alone (HLS estimate)',
              v: FPGA_MLDSA.hlsCeiling,
              cls: 'bg-success/25 border border-dashed border-success/60',
            },
          ].map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">{r.label}</span>
                <span className="font-mono">{fmt(Math.round(r.v))} sign/s</span>
              </div>
              <div className="h-4 bg-muted/40 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-r ${r.cls}`}
                  style={{ width: `${(r.v / FPGA_MLDSA.hlsCeiling) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">{FPGA_MLDSA.note}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="text-xs font-bold text-foreground mb-1">
              The ARM cores still do, for every signature:
            </div>
            <ul className="text-xs text-foreground/80 list-disc pl-4 space-y-0.5">
              {FPGA_MLDSA.armStillDoes.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-2">
              The fabric could sign ~2.5× faster than we can feed it. The limit is on the ARM side —
              Amdahl’s law: speeding up part of a job can never beat the part you left alone.
            </p>
          </div>
          <div className="rounded-md border border-border bg-card/40 p-3 space-y-2">
            <div className="text-xs font-bold text-foreground">
              An earlier try — offload only the NTT step (per rejection attempt):
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-12 shrink-0">CPU</span>
                <div
                  className="h-3 bg-muted-foreground/40 rounded-sm"
                  style={{ width: `${FPGA_MLDSA.nttOnly.cpuPerAttemptMs * 250}px` }}
                />
                <span className="font-mono">{FPGA_MLDSA.nttOnly.cpuPerAttemptMs} ms</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-12 shrink-0">FPGA</span>
                <div className="flex">
                  <div
                    className="h-3 bg-success/60"
                    style={{ width: `${FPGA_MLDSA.nttOnly.fpgaCoreMs * 250}px` }}
                    title="fabric compute"
                  />
                  <div
                    className="h-3 bg-warning/60"
                    style={{ width: `${FPGA_MLDSA.nttOnly.hostOverheadMs * 250}px` }}
                    title="conversion, DMA sync, decode"
                  />
                </div>
                <span className="font-mono">{FPGA_MLDSA.nttOnly.fpgaPerAttemptMs} ms</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                green = fabric compute ({FPGA_MLDSA.nttOnly.fpgaCoreMs} ms) · amber = conversion,
                DMA and cache sync ({FPGA_MLDSA.nttOnly.hostOverheadMs} ms)
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {FPGA_MLDSA.nttOnly.note} Result: {FPGA_MLDSA.nttOnly.fpgaSignPerSec} sign/s with the
              FPGA vs {FPGA_MLDSA.nttOnly.armOnlySignPerSec} on ARM alone — slower.
            </p>
          </div>
        </div>
      </section>

      {/* E — circuit sizes */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Ruler size={18} className="text-status-success" /> E · How big is each accelerator? Our
          KV260 builds
        </h3>
        <div className="space-y-2">
          {CIRCUIT_SIZES.map((c) => {
            const pct = (c.luts / FPGA_DEVICE.luts) * 100
            return (
              <div key={c.circuit} className="space-y-0.5">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="font-bold text-foreground">
                    {c.circuit}{' '}
                    <span className="font-normal text-muted-foreground">— {c.what}</span>
                  </span>
                  <span className="font-mono shrink-0">
                    {c.luts.toLocaleString()} LUT · {c.dsp} DSP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 bg-muted/40 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-r ${
                        c.group === 'building block'
                          ? 'bg-primary/60'
                          : c.group === 'whole operation'
                            ? 'bg-success/60'
                            : c.group === 'plumbing'
                              ? 'bg-warning/60'
                              : 'bg-muted-foreground/40'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-44 shrink-0 text-right">
                    {c.group} · {c.memory} · {c.kind}
                  </span>
                </div>
              </div>
            )
          })}
          <p className="text-[10px] text-muted-foreground">
            Bars are to scale against the whole chip ({FPGA_DEVICE.luts.toLocaleString()} LUTs).
            “Routed” = the real placed-and-wired cost; “HLS estimate” = the synthesis tool’s
            estimate before placement. Blue: building block · green: whole operation · amber:
            plumbing · grey: whole image.
          </p>
        </div>
        <ul className="text-xs text-foreground/85 space-y-1 list-disc pl-4">
          {CIRCUIT_LESSONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      {/* F — multi-core */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Cpu size={18} className="text-status-success" /> F · Serving several CPU cores: duplicate
          or share?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MULTICORE.options.map((o) => (
            <div
              key={o.title}
              className="rounded-md border border-border bg-card/40 p-3 space-y-1.5"
            >
              <div className="text-sm font-bold text-foreground">{o.title}</div>
              <p className="text-xs text-foreground/85 leading-relaxed">{o.plain}</p>
              <p className="text-[11px] text-primary leading-relaxed">Ours: {o.ours}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-foreground/85">
          <strong>Rule of thumb:</strong> {MULTICORE.rule}
        </p>
      </section>

      {/* D — reprogramming */}
      <section className="glass-panel p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <RefreshCcw size={18} className="text-status-success" /> D · Three ways to reprogram the
          fabric
        </h3>
        <MotionConfig reducedMotion="user">
          <svg
            viewBox="0 0 600 200"
            className="w-full h-48"
            role="img"
            aria-label="FPGA reprogramming models"
          >
            {[
              {
                y: 10,
                label: 'At boot',
                blocks: [
                  {
                    w: 440,
                    t: 'whole fabric: one image',
                    cls: 'fill-muted-foreground/25 stroke-muted-foreground/60',
                  },
                ],
              },
              {
                y: 75,
                label: 'Profiles',
                blocks: [
                  {
                    w: 440,
                    t: 'whole fabric: mldsa  ⇄  hashsig (services stop, then restart)',
                    cls: 'fill-success/20 stroke-success',
                  },
                ],
              },
              {
                y: 140,
                label: 'AMD DFX',
                blocks: [
                  {
                    w: 180,
                    t: 'static shell (keeps running)',
                    cls: 'fill-muted-foreground/25 stroke-muted-foreground/60',
                  },
                  { w: 130, t: 'slot 1 ⇄ swap', cls: 'fill-info/25 stroke-info' },
                  {
                    w: 130,
                    t: 'slot 2 (keeps running)',
                    cls: 'fill-muted-foreground/15 stroke-muted-foreground/60',
                  },
                ],
              },
            ].map((row, ri) => {
              let x = 140
              return (
                <g key={row.label}>
                  <text x={20} y={row.y + 30} className="fill-foreground text-[11px] font-bold">
                    {row.label}
                  </text>
                  {row.blocks.map((b, bi) => {
                    const el = (
                      <motion.g
                        key={bi}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: b.t.includes('⇄') ? [0.4, 1, 0.4] : 1 }}
                        transition={{
                          duration: 2,
                          repeat: b.t.includes('⇄') ? Infinity : 0,
                          delay: ri * 0.3,
                        }}
                      >
                        <rect
                          x={x}
                          y={row.y}
                          width={b.w - 6}
                          height={48}
                          rx={5}
                          className={b.cls}
                        />
                        <text
                          x={x + (b.w - 6) / 2}
                          y={row.y + 28}
                          textAnchor="middle"
                          className="fill-foreground text-[9px]"
                        >
                          {b.t}
                        </text>
                      </motion.g>
                    )
                    x += b.w
                    return el
                  })}
                </g>
              )
            })}
          </svg>
        </MotionConfig>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FPGA_REPROGRAM.models.map((m) => (
            <div key={m.id} className="rounded-md border border-border bg-card/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{m.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    m.status === 'tested'
                      ? 'bg-success/15 text-status-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {m.status === 'tested' ? 'Tested by us' : 'Not tested by us'}
                </span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">{m.plain}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{m.ours}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Published, not measured by us
          </div>
          <p className="text-xs text-foreground/85 leading-relaxed">{CITED_FACTS.dfx}</p>
          <p className="text-[10px] text-muted-foreground">
            Source:{' '}
            {(['kriaDfx', 'kriaAppsFw'] as const).map((k, i) => (
              <React.Fragment key={k}>
                {i > 0 && ' · '}
                <a
                  href={SOURCES[k].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {SOURCES[k].label}
                </a>
              </React.Fragment>
            ))}
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-bold text-foreground">
            Other ways the industry manages several accelerators
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1.5 pr-2">Approach</th>
                  <th className="py-1.5 pr-2">How it works</th>
                  <th className="py-1.5">On our K26?</th>
                </tr>
              </thead>
              <tbody>
                {MULTI_ACCEL.map((r) => (
                  <tr key={r.approach} className="border-b border-border/50 align-top">
                    <td className="py-1.5 pr-2 font-medium text-foreground">
                      <a
                        href={SOURCES[r.source].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        {r.approach}
                      </a>
                    </td>
                    <td className="py-1.5 pr-2 text-foreground/85">{r.how}</td>
                    <td className="py-1.5 text-muted-foreground">{r.onK26}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Published, not measured by us
            </div>
            <p className="text-xs text-foreground/85">{MULTI_ACCEL_FACTS.principle}</p>
            <p className="text-xs text-foreground/85">{MULTI_ACCEL_FACTS.security}</p>
            <p className="text-[10px] text-muted-foreground">
              Sources:{' '}
              {(['zynqSecureBit', 'zhaoSuh'] as const).map((k, i) => (
                <React.Fragment key={k}>
                  {i > 0 && ' · '}
                  <a
                    href={SOURCES[k].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {SOURCES[k].label}
                  </a>
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
