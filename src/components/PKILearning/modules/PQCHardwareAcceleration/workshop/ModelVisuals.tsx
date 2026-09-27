// SPDX-License-Identifier: GPL-3.0-only
/**
 * One animated SVG per acceleration model. Each draws the MECHANISM the
 * layman analogy describes — not decoration — so a reader can map "one cook,
 * one pan" to "one value per instruction", "school bus" to "fixed launch cost
 * + thousands of lanes", and so on. Numbers inside the drawings are either
 * structural (register widths) or PQC Today measurements from
 * data/measurements.ts, never invented.
 */
import React from 'react'
import { motion, MotionConfig } from 'framer-motion'
import type { ModelId } from '../data/models'
import { FPGA_MLDSA, FPGA_HASHSIG } from '../data/measurements'

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-muted-foreground italic leading-relaxed">{children}</p>
)

const Title: React.FC<{ className: string; children: React.ReactNode }> = ({
  className,
  children,
}) => <div className={`text-sm font-semibold mb-1 ${className}`}>{children}</div>

const COEFFS = Array.from({ length: 16 }, (_, i) => i)

// ── Scalar ────────────────────────────────────────────────────────────────
const ScalarVisual: React.FC = () => (
  <div className="space-y-3">
    <Title className="text-muted-foreground">
      One instruction → one number. 16 coefficients = 16 steps.
    </Title>
    <svg viewBox="0 0 600 200" className="w-full h-48" role="img" aria-label="Scalar processing">
      <text x={20} y={30} className="fill-muted-foreground text-[10px]">
        polynomial coefficients (ML-DSA has 256 of them)
      </text>
      {COEFFS.map((i) => (
        <motion.rect
          key={i}
          x={20 + i * 35}
          y={45}
          width={30}
          height={30}
          rx={4}
          className="stroke-muted-foreground fill-muted/40"
          strokeWidth={1}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.5, delay: i * 0.5, repeat: Infinity, repeatDelay: 7.5 }}
        />
      ))}
      <motion.g
        animate={{ x: [0, 525] }}
        transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
      >
        <rect
          x={20}
          y={110}
          width={30}
          height={40}
          rx={4}
          className="fill-foreground/10 stroke-foreground/60"
        />
        <text x={35} y={134} textAnchor="middle" className="fill-foreground text-[9px] font-bold">
          ALU
        </text>
        <line
          x1={35}
          y1={110}
          x2={35}
          y2={78}
          className="stroke-foreground/50"
          strokeDasharray="3 2"
        />
      </motion.g>
      <text x={300} y={185} textAnchor="middle" className="fill-muted-foreground text-[10px]">
        time → one value per step, in order
      </text>
    </svg>
    <Caption>
      The reference code in FIPS 204/205 is written this way: portable, correct, and the baseline
      every other model is compared with.
    </Caption>
  </div>
)

// ── SIMD ─────────────────────────────────────────────────────────────────
const SimdVisual: React.FC = () => {
  const groups = [0, 1, 2, 3]
  return (
    <div className="space-y-3">
      <Title className="text-primary">
        One instruction → a whole register of numbers. Same 16 coefficients = 4 steps (NEON).
      </Title>
      <svg viewBox="0 0 600 200" className="w-full h-48" role="img" aria-label="SIMD processing">
        {COEFFS.map((i) => (
          <rect
            key={i}
            x={20 + i * 35}
            y={45}
            width={30}
            height={30}
            rx={4}
            className="stroke-primary/60 fill-primary/10"
            strokeWidth={1}
          />
        ))}
        {groups.map((g) => (
          <motion.rect
            key={g}
            x={16 + g * 140}
            y={40}
            width={138}
            height={40}
            rx={6}
            className="fill-primary/25 stroke-primary"
            strokeWidth={2}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, delay: g * 1, repeat: Infinity, repeatDelay: 3 }}
          />
        ))}
        <text x={20} y={30} className="fill-muted-foreground text-[10px]">
          128-bit NEON register = 4 × 32-bit coefficients per instruction
        </text>
        {[
          { y: 110, label: 'Arm NEON', bits: 128, lanes: 4 },
          { y: 135, label: 'x86 AVX2', bits: 256, lanes: 8 },
          { y: 160, label: 'x86 AVX-512', bits: 512, lanes: 16 },
        ].map((r) => (
          <g key={r.label}>
            <text x={20} y={r.y + 12} className="fill-foreground text-[10px] font-bold">
              {r.label}
            </text>
            {Array.from({ length: r.lanes }, (_, i) => (
              <rect
                key={i}
                x={110 + i * 22}
                y={r.y}
                width={19}
                height={16}
                rx={2}
                className="fill-primary/30 stroke-primary/70"
              />
            ))}
            <text
              x={110 + r.lanes * 22 + 6}
              y={r.y + 12}
              className="fill-muted-foreground text-[9px]"
            >
              {r.bits}-bit → {r.lanes} lanes
            </text>
          </g>
        ))}
      </svg>
      <Caption>
        ML-DSA applies the same arithmetic to all 256 coefficients of a polynomial, so vector width
        translates almost directly into speed — and it happens inside the CPU, with no data leaving
        the core.
      </Caption>
    </div>
  )
}

// ── Crypto instructions ──────────────────────────────────────────────────
const IsaVisual: React.FC = () => {
  const ops = Array.from({ length: 18 }, (_, i) => i)
  const labels = ['xor', 'rot', 'add', 'and', 'not', 'shr']
  return (
    <div className="space-y-3">
      <Title className="text-secondary">
        Same hash round: many generic steps in software, a few dedicated ones in hardware
      </Title>
      <svg
        viewBox="0 0 600 210"
        className="w-full h-52"
        role="img"
        aria-label="Crypto instructions"
      >
        <text x={20} y={30} className="fill-foreground text-[10px] font-bold">
          Software round
        </text>
        {ops.map((i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <rect
              x={120 + i * 26}
              y={16}
              width={22}
              height={22}
              rx={3}
              className="fill-muted/50 stroke-muted-foreground/60"
            />
            <text
              x={131 + i * 26}
              y={31}
              textAnchor="middle"
              className="fill-muted-foreground text-[7px]"
            >
              {labels[i % labels.length]}
            </text>
          </motion.g>
        ))}
        <text x={20} y={80} className="fill-foreground text-[10px] font-bold">
          With the instruction
        </text>
        <motion.rect
          x={120}
          y={64}
          width={60}
          height={24}
          rx={4}
          className="fill-secondary/30 stroke-secondary"
          strokeWidth={2}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.6 }}
        />
        <text x={150} y={80} textAnchor="middle" className="fill-foreground text-[9px] font-bold">
          SHA256H
        </text>
        <line x1={20} y1={105} x2={580} y2={105} className="stroke-border" />
        <text x={20} y={125} className="fill-foreground text-[10px] font-bold">
          Measured on our Cortex-A5x boards (16 KiB digests):
        </text>
        <rect x={20} y={135} width={470} height={18} rx={3} className="fill-secondary/40" />
        <text x={26} y={148} className="fill-foreground text-[10px]">
          SHA-256 — core HAS the instruction — 396–470 MB/s
        </text>
        <rect x={20} y={160} width={150} height={18} rx={3} className="fill-muted-foreground/30" />
        <text x={176} y={173} className="fill-foreground text-[10px]">
          SHA-512 — no instruction on A53/A55 — 136–143 MB/s
        </text>
        <text x={20} y={198} className="fill-muted-foreground text-[9px]">
          In pure software SHA-512 is usually the faster of the two on a 64-bit core; the dedicated
          instruction flips the order.
        </text>
      </svg>
      <Caption>
        Which hash a scheme uses decides whether the core’s built-in instructions help. A55 and A53
        have SHA-256 instructions but no SHA-3 ones, so SLH-DSA-SHA2 is fast there and SLH-DSA-SHAKE
        is not.
      </Caption>
    </div>
  )
}

// ── GPU ──────────────────────────────────────────────────────────────────
const GpuVisual: React.FC = () => {
  const cols = 24
  const rows = 6
  const cells = Array.from({ length: cols * rows }, (_, i) => i)
  return (
    <div className="space-y-3">
      <Title className="text-status-info">
        Fixed launch cost, then thousands of lanes in lockstep — only a full batch pays it back
      </Title>
      <svg viewBox="0 0 600 230" className="w-full h-56" role="img" aria-label="GPU batching">
        {[
          { y: 20, label: '1 signature', fill: 1 },
          { y: 125, label: '4,096 signatures', fill: cols * rows },
        ].map((row) => (
          <g key={row.label}>
            <text x={20} y={row.y + 10} className="fill-foreground text-[10px] font-bold">
              {row.label}
            </text>
            <rect
              x={20}
              y={row.y + 18}
              width={70}
              height={60}
              rx={4}
              className="fill-warning/20 stroke-warning"
            />
            <text x={55} y={row.y + 45} textAnchor="middle" className="fill-foreground text-[9px]">
              launch +
            </text>
            <text x={55} y={row.y + 57} textAnchor="middle" className="fill-foreground text-[9px]">
              copy setup
            </text>
            {cells.map((i) => {
              const c = i % cols
              const r = Math.floor(i / cols)
              const active = i < row.fill
              return (
                <motion.rect
                  key={i}
                  x={100 + c * 20}
                  y={row.y + 18 + r * 10}
                  width={17}
                  height={8}
                  rx={1}
                  className={active ? 'fill-info stroke-info' : 'fill-muted/40 stroke-border'}
                  strokeWidth={0.5}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: active ? [0.4, 1, 0.4] : 0.5 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                />
              )
            })}
            <text
              x={590}
              y={row.y + 94}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {row.fill === 1
                ? '1 lane busy, the rest idle — the CPU finishes first'
                : 'every lane busy — launch cost shared by all'}
            </text>
          </g>
        ))}
      </svg>
      <Caption>
        GPUs trade latency for throughput: each launch costs a fixed start-up time, and memory
        delays are hidden only when many independent operations are in flight. That is why GPU PQC
        results are quoted at batches of thousands.
      </Caption>
    </div>
  )
}

// ── FPGA ─────────────────────────────────────────────────────────────────
const FpgaVisual: React.FC = () => {
  const bar = (
    y: number,
    parts: { w: number; cls: string; label: string }[],
    title: string,
    result: string
  ) => {
    let x = 150
    return (
      <g>
        <text x={20} y={y + 14} className="fill-foreground text-[10px] font-bold">
          {title}
        </text>
        {parts.map((p, i) => {
          const el = (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.25 }}
            >
              <rect x={x} y={y} width={p.w} height={20} className={p.cls} />
              {p.w > 40 && (
                <text
                  x={x + p.w / 2}
                  y={y + 14}
                  textAnchor="middle"
                  className="fill-foreground text-[8px]"
                >
                  {p.label}
                </text>
              )}
            </motion.g>
          )
          x += p.w
          return el
        })}
        <text x={x + 6} y={y + 14} className="fill-foreground text-[10px] font-bold">
          {result}
        </text>
      </g>
    )
  }
  return (
    <div className="space-y-3">
      <Title className="text-status-success">
        The fabric is fast — but data must travel CPU → fabric → CPU, and the CPU keeps its share
      </Title>
      <svg viewBox="0 0 600 190" className="w-full h-48" role="img" aria-label="FPGA offload">
        <text x={20} y={20} className="fill-muted-foreground text-[9px]">
          One signature, not to scale: ARM work · transfer · fabric work
        </text>
        {bar(
          35,
          [
            { w: 150, cls: 'fill-muted-foreground/30', label: 'ARM: key, ExpandA, PKCS#11' },
            { w: 40, cls: 'fill-warning/50', label: 'DMA' },
            { w: 60, cls: 'fill-success/60', label: 'fabric' },
            { w: 40, cls: 'fill-warning/50', label: 'DMA' },
          ],
          'ML-DSA-65',
          `+${FPGA_MLDSA.gainPct}%`
        )}
        {bar(
          85,
          [
            { w: 20, cls: 'fill-muted-foreground/30', label: 'ARM' },
            { w: 20, cls: 'fill-warning/50', label: 'DMA' },
            { w: 250, cls: 'fill-success/60', label: 'fabric: millions of Keccak calls' },
            { w: 20, cls: 'fill-warning/50', label: 'DMA' },
          ],
          'SLH-DSA-SHAKE',
          `${FPGA_HASHSIG.rows[0].shipped} → ${FPGA_HASHSIG.rows[0].fpga}`
        )}
        <line x1={20} y1={125} x2={580} y2={125} className="stroke-border" />
        <text x={20} y={145} className="fill-foreground text-[10px]">
          Amdahl’s law: if the fabric only takes over part of each operation, the rest caps the
          gain.
        </text>
        <text x={20} y={163} className="fill-muted-foreground text-[9px]">
          ML-DSA keeps key decoding, ExpandA, copying and PKCS#11 on the ARM cores for every
          signature.
        </text>
        <text x={20} y={179} className="fill-muted-foreground text-[9px]">
          SLH-DSA is almost pure hashing, so nearly the whole operation moves into the fabric.
        </text>
      </svg>
      <Caption>
        Same board, same fabric, opposite results: that is the FPGA lesson in one picture. The “FPGA
        limits” step shows the area, clock and sharing limits behind it.
      </Caption>
    </div>
  )
}

// ── ASIC ─────────────────────────────────────────────────────────────────
const AsicVisual: React.FC = () => {
  const cores = [0, 1, 2, 3]
  return (
    <div className="space-y-3">
      <Title className="text-status-warning">
        Hard-wired and efficient — but fixed at tape-out, and still one engine behind a shared bus
      </Title>
      <svg viewBox="0 0 600 200" className="w-full h-48" role="img" aria-label="ASIC engine">
        {cores.map((c) => (
          <g key={c}>
            <rect
              x={20}
              y={20 + c * 42}
              width={70}
              height={30}
              rx={4}
              className="fill-muted/50 stroke-muted-foreground/60"
            />
            <text x={55} y={39 + c * 42} textAnchor="middle" className="fill-foreground text-[9px]">
              CPU core {c + 1}
            </text>
            <motion.line
              x1={90}
              y1={35 + c * 42}
              x2={250}
              y2={100}
              className="stroke-warning/60"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              animate={{ strokeDashoffset: [14, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </g>
        ))}
        <rect
          x={250}
          y={80}
          width={60}
          height={40}
          rx={4}
          className="fill-warning/15 stroke-warning"
        />
        <text x={280} y={98} textAnchor="middle" className="fill-foreground text-[9px] font-bold">
          bus +
        </text>
        <text x={280} y={110} textAnchor="middle" className="fill-foreground text-[9px] font-bold">
          queue
        </text>
        <line x1={310} y1={100} x2={350} y2={100} className="stroke-warning" strokeWidth={2} />
        <rect
          x={350}
          y={55}
          width={130}
          height={90}
          rx={6}
          className="fill-warning/25 stroke-warning"
          strokeWidth={2}
        />
        <text x={415} y={85} textAnchor="middle" className="fill-foreground text-[10px] font-bold">
          PQC engine
        </text>
        <text x={415} y={102} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          fixed algorithms
        </text>
        <text x={415} y={116} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          fixed parameter sets
        </text>
        <text x={415} y={130} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          fixed clock
        </text>
        <text x={500} y={80} className="fill-foreground text-[9px]">
          ✓ low power
        </text>
        <text x={500} y={96} className="fill-foreground text-[9px]">
          ✓ high clock
        </text>
        <text x={500} y={112} className="fill-foreground text-[9px]">
          ✓ side-channel
        </text>
        <text x={512} y={124} className="fill-foreground text-[9px]">
          hardening
        </text>
        <text x={500} y={140} className="fill-destructive text-[9px]">
          ✗ cannot be patched
        </text>
        <text x={20} y={192} className="fill-muted-foreground text-[9px]">
          Every core that wants a signature waits its turn for the single engine — the same sharing
          problem as an FPGA.
        </text>
      </svg>
      <Caption>
        A new parameter set, a revised standard or an algorithm broken after tape-out means new
        silicon. That is why many chips pair a fixed Keccak or NTT block with firmware, rather than
        hard-wiring a whole algorithm.
      </Caption>
    </div>
  )
}

// ── NPU ──────────────────────────────────────────────────────────────────
const NpuVisual: React.FC = () => {
  const grid = Array.from({ length: 48 }, (_, i) => i)
  return (
    <div className="space-y-3">
      <Title className="text-destructive">
        A giant grid of 8-bit multiply-add units — PQC needs exact 23-bit arithmetic and bit
        shuffling
      </Title>
      <svg viewBox="0 0 600 210" className="w-full h-52" role="img" aria-label="NPU mismatch">
        {grid.map((i) => (
          <rect
            key={i}
            x={20 + (i % 12) * 22}
            y={30 + Math.floor(i / 12) * 22}
            width={18}
            height={18}
            rx={2}
            className="fill-destructive/10 stroke-destructive/40"
          />
        ))}
        <text x={20} y={20} className="fill-muted-foreground text-[9px]">
          int8 × int8 → accumulate (what the NPU does)
        </text>
        <text x={20} y={135} className="fill-muted-foreground text-[9px]">
          fed a pre-compiled neural-network graph
        </text>
        {[
          {
            y: 30,
            ok: false,
            text: 'ML-DSA numbers are mod q = 8,380,417 (23 bits) — they do not fit in 8 bits',
          },
          { y: 60, ok: false, text: 'Results must be exact; NPU quantisation rounds by design' },
          {
            y: 90,
            ok: false,
            text: 'Keccak/SHAKE is XOR, AND, NOT and rotate — no multiplication at all',
          },
          {
            y: 120,
            ok: false,
            text: 'Each NTT stage would need a round trip back to the CPU',
          },
          {
            y: 160,
            ok: true,
            text: 'What we use it for instead: watching the appliance’s behaviour',
          },
        ].map((r) => (
          <motion.g
            key={r.y}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + r.y / 200 }}
          >
            <text
              x={300}
              y={r.y + 12}
              className={
                r.ok
                  ? 'fill-success text-[12px] font-bold'
                  : 'fill-destructive text-[12px] font-bold'
              }
            >
              {r.ok ? '✓' : '✗'}
            </text>
            <text x={316} y={r.y + 12} className="fill-foreground text-[9px]">
              {r.text.length > 50 ? r.text.slice(0, r.text.lastIndexOf(' ', 50)) : r.text}
            </text>
            {r.text.length > 50 && (
              <text x={316} y={r.y + 24} className="fill-foreground text-[9px]">
                {r.text.slice(r.text.lastIndexOf(' ', 50) + 1)}
              </text>
            )}
          </motion.g>
        ))}
      </svg>
      <Caption>
        The contrast with GPUs is instructive: NVIDIA cuPQC runs on the GPU’s general-purpose CUDA
        cores, which do exact integer arithmetic. Even research that does push lattice-style math
        onto 8-bit tensor units (TensorFHE) splits every 32-bit number into four 8-bit pieces and
        relies on those neighbouring general-purpose cores to put them back together. A
        fixed-function NPU has no such neighbour.
      </Caption>
    </div>
  )
}

export const ModelVisual: React.FC<{ id: ModelId }> = ({ id }) => (
  <MotionConfig reducedMotion="user">
    {id === 'scalar' && <ScalarVisual />}
    {id === 'simd' && <SimdVisual />}
    {id === 'isa' && <IsaVisual />}
    {id === 'gpu' && <GpuVisual />}
    {id === 'fpga' && <FpgaVisual />}
    {id === 'asic' && <AsicVisual />}
    {id === 'npu' && <NpuVisual />}
  </MotionConfig>
)
