// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop step 2 — the five primitives acceleration actually targets:
 * Montgomery reduction, the NTT, the Keccak permutation, and the two sponge
 * constructions built on it (SHA-3, SHAKE). Plain English first, then a
 * worked, checkable picture of the mechanism.
 *
 * Worked Montgomery example (decimal, so it can be checked by hand):
 *   N = 97, R = 100, N' = −N⁻¹ mod R = 67
 *   T = 4321:  m = (T mod R)·N' mod R = 21·67 mod 100 = 7
 *   T + m·N = 4321 + 679 = 5000  →  5000 / 100 = 50
 *   Check: 4321·R⁻¹ mod 97 = 53·65 mod 97 = 50  ✓
 *
 * Parameters are FIPS 202/203/204/205 values: ML-DSA q = 8,380,417 with a full
 * 8-layer NTT (ζ = 1753 is a 512th root of unity); ML-KEM q = 3,329 has no
 * 512th root, so its NTT stops after 7 layers. SHA3-256 / SHAKE256: rate 1088,
 * capacity 512; SHAKE128: rate 1344, capacity 256.
 */
import React, { useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BlockId = 'montgomery' | 'ntt' | 'keccak' | 'sha3' | 'shake'

interface Block {
  id: BlockId
  label: string
  tagline: string
  layman: { analogy: string; whatsDifferent: string; catch: string }
  usedBy: string
  acceleratedBy: string
}

const BLOCKS: Block[] = [
  {
    id: 'montgomery',
    label: 'Montgomery reduction',
    tagline: '“mod N” without ever dividing by N.',
    layman: {
      analogy:
        'Dividing by an awkward number like 97 is slow, even for a computer. Dividing by 100 is trivial — you just drop the last two digits. Montgomery’s trick adds a carefully chosen multiple of 97 so the number ends in 00, then drops the zeros. The answer is still correct “mod 97”, and no division by 97 ever happened.',
      whatsDifferent:
        'Computers do the same thing in binary: “dropping digits” is a free shift. So a modular multiplication becomes a few ordinary multiplications and a shift — which is why it sits inside RSA, elliptic curves and every ML-DSA coefficient multiply (FIPS 204 Appendix A).',
      catch:
        'The fastest way to schedule those multiplications depends on the exact core. On our Cortex-A55 a crypto library picked a kernel tuned for server chips, and plain scalar code beat it by 22–62%.',
    },
    usedBy: 'RSA and ECC big numbers; ML-DSA coefficient arithmetic (mod 8,380,417)',
    acceleratedBy:
      'Fast multiply-high instructions; NEON/AVX2 doing 4–8 reductions at once; AVX-512 IFMA for RSA',
  },
  {
    id: 'ntt',
    label: 'NTT',
    tagline: 'Change the viewpoint and polynomial multiplication becomes element-by-element.',
    layman: {
      analogy:
        'Multiplying two 256-term polynomials the school way means every term times every other term — 65,536 multiplications. The Number-Theoretic Transform is a change of viewpoint, like describing a song by its notes instead of its waveform. In the new view, multiplying is just “each note times the matching note” — 256 multiplications — and you transform back at the end.',
      whatsDifferent:
        'The transform itself is a network of “butterflies”, each taking two numbers and producing their sum and difference with a twist. For 256 coefficients that is 8 layers of 128 butterflies. Doing forward, pointwise and inverse costs about 3,300 multiplications instead of 65,536.',
      catch:
        'Every butterfly needs a modular reduction, and layers must finish in order. ML-KEM’s smaller modulus (3,329) only allows 7 layers, so it finishes with 128 small 2-term products instead of 256 single ones.',
    },
    usedBy: 'ML-DSA (q = 8,380,417, 8 layers) and ML-KEM (q = 3,329, 7 layers)',
    acceleratedBy:
      'SIMD butterflies (NEON 4, AVX2 8, AVX-512 16 lanes); GPUs across thousands of polynomials; FPGA/ASIC butterfly pipelines',
  },
  {
    id: 'keccak',
    label: 'Keccak permutation',
    tagline: 'Shuffle a 1,600-bit block 24 times — using only XOR, AND, NOT and rotate.',
    layman: {
      analogy:
        'Picture a 5×5 grid of 64-bit tiles. Each round mixes every column into its neighbours, rotates each tile, moves the tiles to new positions, scrambles each row, and flips a few bits with a round constant. Repeat 24 times and the block looks completely random.',
      whatsDifferent:
        'It uses no arithmetic and no lookup tables — only bit operations — so it is naturally constant-time and very cheap to build in hardware. The Armv8 SHA-3 instructions (EOR3, RAX1, XAR, BCAX) fuse several of these steps into single instructions.',
      catch:
        'It is 25 × 64-bit lanes wide. A core without SHA-3 instructions spends many instructions per round shuffling them, and our A53/A55 boards have none — so every SHAKE call there is software.',
    },
    usedBy: 'The engine inside SHA-3 and SHAKE — and so inside ML-KEM, ML-DSA and SLH-DSA-SHAKE',
    acceleratedBy:
      'Armv8.2 SHA-3 instructions; SIMD running 4 states side by side (x86 has no Keccak instruction); FPGA/ASIC Keccak cores',
  },
  {
    id: 'sha3',
    label: 'SHA-3',
    tagline: 'A sponge: soak up the message, squeeze out a fixed-length fingerprint.',
    layman: {
      analogy:
        'A sponge. You pour the message in one cupful at a time, and after every cup you wring the sponge (one Keccak permutation). Part of the sponge — the “capacity” — is sealed inside and never touches the message or the output directly; that hidden part is where the security comes from.',
      whatsDifferent:
        'SHA3-256 uses a 1,600-bit state split into 1,088 bits of “rate” (the cup) and 512 bits of capacity (the sealed part). It always returns exactly 256 bits.',
      catch:
        'A bigger capacity means more security but a smaller cup, so more permutations per byte. SHA3-512 is slower than SHA3-256 for exactly that reason.',
    },
    usedBy: 'ML-KEM (SHA3-256, SHA3-512 for its internal hashes); general-purpose hashing',
    acceleratedBy: 'Whatever accelerates Keccak',
  },
  {
    id: 'shake',
    label: 'SHAKE',
    tagline: 'The same sponge, with a tap you can leave running.',
    layman: {
      analogy:
        'SHAKE is SHA-3’s sponge with an open tap: after soaking up the input you can keep squeezing for as much output as you like — 32 bytes, or tens of kilobytes of random-looking data from one short seed.',
      whatsDifferent:
        'That makes it a generator, not just a fingerprint. ML-DSA grows its whole public matrix from a 32-byte seed with SHAKE128, and SLH-DSA-SHAKE uses SHAKE256 for every hash in its trees.',
      catch:
        'Post-quantum schemes call it a lot. One SLH-DSA-SHAKE-128s signature needs about two million Keccak permutations — which is why hash speed, not arithmetic, decides SLH-DSA performance.',
    },
    usedBy:
      'ML-DSA (SHAKE128 matrix expansion, SHAKE256 hashing and sampling), ML-KEM (SHAKE128), SLH-DSA-SHAKE (SHAKE256 everywhere)',
    acceleratedBy: 'Whatever accelerates Keccak — the #1 target in hash-based and lattice PQC',
  },
]

// ── Visuals ────────────────────────────────────────────────────────────────

const MontgomeryVisual: React.FC = () => {
  const steps = [
    { x: 20, top: 'start', big: '4321', note: 'want 4321 “mod 97”' },
    { x: 150, top: 'add 7 × 97', big: '+ 679', note: '7 chosen so the end is 00' },
    { x: 290, top: 'now it ends in 00', big: '5000', note: 'still the same “mod 97”' },
    { x: 430, top: 'drop two zeros', big: '50', note: 'a shift — no division by 97' },
  ]
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-primary">
        Worked example in decimal: N = 97, R = 100
      </div>
      <svg
        viewBox="0 0 600 180"
        className="w-full h-44"
        role="img"
        aria-label="Montgomery reduction example"
      >
        {steps.map((s, i) => (
          <motion.g
            key={s.x}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.6 }}
          >
            <text
              x={s.x + 60}
              y={28}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {s.top}
            </text>
            <rect
              x={s.x}
              y={38}
              width={120}
              height={56}
              rx={6}
              className={i === 3 ? 'fill-primary/20 stroke-primary' : 'fill-muted/40 stroke-border'}
              strokeWidth={i === 3 ? 2 : 1}
            />
            <text
              x={s.x + 60}
              y={74}
              textAnchor="middle"
              className="fill-foreground text-[20px] font-bold font-mono"
            >
              {s.big}
            </text>
            <text
              x={s.x + 60}
              y={112}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {s.note}
            </text>
            {i < 3 && (
              <text x={s.x + 132} y={72} className="fill-foreground/60 text-[16px]">
                →
              </text>
            )}
          </motion.g>
        ))}
        <text x={300} y={145} textAnchor="middle" className="fill-foreground text-[10px]">
          Result: 50 = 4321 × 100⁻¹ mod 97. The extra “÷100” is kept consistent by working in
          “Montgomery form”.
        </text>
        <text x={300} y={165} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          In ML-DSA the same idea runs in binary with R = 2³², so “drop the zeros” is a 32-bit
          shift.
        </text>
      </svg>
    </div>
  )
}

const NttVisual: React.FC = () => {
  const n = 8
  const layers = 3
  const colX = (l: number) => 150 + l * 110
  const rowY = (r: number) => 30 + r * 20
  const lines: { x1: number; y1: number; x2: number; y2: number; key: string; l: number }[] = []
  for (let l = 0; l < layers; l++) {
    const span = n >> (l + 1)
    for (let r = 0; r < n; r++) {
      const partner =
        Math.floor(r / (2 * span)) * 2 * span + (((r % (2 * span)) + span) % (2 * span))
      lines.push({ x1: colX(l), y1: rowY(r), x2: colX(l + 1), y2: rowY(r), key: `s${l}-${r}`, l })
      lines.push({
        x1: colX(l),
        y1: rowY(r),
        x2: colX(l + 1),
        y2: rowY(partner),
        key: `c${l}-${r}`,
        l,
      })
    }
  }
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-primary">
        Schoolbook: every term × every term. NTT: a butterfly network, then one-to-one.
      </div>
      <svg
        viewBox="0 0 600 245"
        className="w-full h-60"
        role="img"
        aria-label="NTT butterfly network"
      >
        <text x={20} y={20} className="fill-foreground text-[10px] font-bold">
          Schoolbook (8 terms)
        </text>
        {Array.from({ length: 64 }, (_, i) => (
          <rect
            key={i}
            x={20 + (i % 8) * 13}
            y={30 + Math.floor(i / 8) * 13}
            width={10}
            height={10}
            rx={1}
            className="fill-destructive/40"
          />
        ))}
        <text x={20} y={150} className="fill-muted-foreground text-[9px]">
          8 × 8 = 64 products
        </text>
        <text x={20} y={163} className="fill-muted-foreground text-[9px]">
          (256 terms: 65,536)
        </text>
        <text x={150} y={20} className="fill-foreground text-[10px] font-bold">
          NTT butterflies (8 points, 3 layers — ML-DSA uses 256 points, 8 layers)
        </text>
        {lines.map((ln) => (
          <motion.line
            key={ln.key}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            className="stroke-primary/60"
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3 + ln.l * 0.7, duration: 0.6 }}
          />
        ))}
        {Array.from({ length: layers + 1 }, (_, l) =>
          Array.from({ length: n }, (_, r) => (
            <circle
              key={`${l}-${r}`}
              cx={colX(l)}
              cy={rowY(r)}
              r={4}
              className="fill-primary stroke-background"
            />
          ))
        )}
        <text x={150} y={205} className="fill-foreground text-[10px]">
          each layer: n/2 butterflies (a, b) → (a + ζb, a − ζb) mod q
        </text>
        <text x={150} y={222} className="fill-muted-foreground text-[9px]">
          256 terms: 8 layers × 128 butterflies per transform
        </text>
        <text x={150} y={236} className="fill-muted-foreground text-[9px]">
          forward + pointwise + inverse ≈ 3,300 multiplications instead of 65,536
        </text>
      </svg>
    </div>
  )
}

const KeccakVisual: React.FC = () => {
  const steps = [
    { sym: 'θ', name: 'theta', what: 'mix each column into its neighbours', instr: 'EOR3 · RAX1' },
    { sym: 'ρ', name: 'rho', what: 'rotate each 64-bit lane', instr: 'XAR (with θ)' },
    { sym: 'π', name: 'pi', what: 'move lanes to new positions', instr: 'register renaming' },
    { sym: 'χ', name: 'chi', what: 'scramble each row (the only non-linear step)', instr: 'BCAX' },
    { sym: 'ι', name: 'iota', what: 'XOR a round constant', instr: 'EOR' },
  ]
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-primary">
        1,600-bit state = 5 × 5 lanes of 64 bits · 5 steps per round · 24 rounds
      </div>
      <svg
        viewBox="0 0 600 220"
        className="w-full h-56"
        role="img"
        aria-label="Keccak state and round steps"
      >
        {Array.from({ length: 25 }, (_, i) => {
          const c = i % 5
          const r = Math.floor(i / 5)
          return (
            <motion.rect
              key={i}
              x={20 + c * 34}
              y={30 + r * 34}
              width={30}
              height={30}
              rx={3}
              className="fill-primary/20 stroke-primary/60"
              animate={{ opacity: [0.5, 1, 0.5], rotate: [0, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: (c + r) * 0.1 }}
            />
          )
        })}
        <text x={20} y={210} className="fill-muted-foreground text-[9px]">
          each tile = one 64-bit lane
        </text>
        {steps.map((s, i) => (
          <motion.g
            key={s.sym}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.35 }}
          >
            <circle cx={215} cy={40 + i * 36} r={13} className="fill-primary/20 stroke-primary" />
            <text
              x={215}
              y={45 + i * 36}
              textAnchor="middle"
              className="fill-foreground text-[13px] font-bold"
            >
              {s.sym}
            </text>
            <text x={236} y={38 + i * 36} className="fill-foreground text-[10px] font-bold">
              {s.name}
            </text>
            <text x={236} y={51 + i * 36} className="fill-muted-foreground text-[9px]">
              {s.what}
            </text>
            <text
              x={590}
              y={45 + i * 36}
              textAnchor="end"
              className="fill-secondary text-[9px] font-mono"
            >
              {s.instr}
            </text>
          </motion.g>
        ))}
        <text x={590} y={22} textAnchor="end" className="fill-muted-foreground text-[9px]">
          Armv8.2 SHA-3 instruction
        </text>
      </svg>
    </div>
  )
}

const Sponge: React.FC<{ rate: number; capacity: number; outBlocks: number; outLabel: string }> = ({
  rate,
  capacity,
  outBlocks,
  outLabel,
}) => {
  const total = rate + capacity
  const h = 90
  const rateH = (rate / total) * h
  const blocks = [0, 1, 2]
  return (
    <svg viewBox="0 0 600 190" className="w-full h-48" role="img" aria-label="Sponge construction">
      {blocks.map((b) => (
        <g key={b}>
          <motion.rect
            x={20 + b * 90}
            y={10}
            width={60}
            height={20}
            rx={3}
            className="fill-secondary/30 stroke-secondary"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: b * 0.5 }}
          />
          <text x={50 + b * 90} y={24} textAnchor="middle" className="fill-foreground text-[9px]">
            msg {b + 1}
          </text>
          <line x1={50 + b * 90} y1={30} x2={50 + b * 90} y2={48} className="stroke-secondary" />
        </g>
      ))}
      {[0, 1, 2, 3].map((s) => (
        <g key={s}>
          <rect
            x={30 + s * 90}
            y={50}
            width={40}
            height={rateH}
            className="fill-primary/20 stroke-primary/60"
          />
          <rect
            x={30 + s * 90}
            y={50 + rateH}
            width={40}
            height={h - rateH}
            className="fill-muted-foreground/30 stroke-muted-foreground/60"
          />
          {s < 3 && (
            <g>
              <rect
                x={75 + s * 90}
                y={75}
                width={30}
                height={40}
                rx={4}
                className="fill-primary/40 stroke-primary"
              />
              <text
                x={90 + s * 90}
                y={99}
                textAnchor="middle"
                className="fill-foreground text-[8px] font-bold"
              >
                f
              </text>
            </g>
          )}
        </g>
      ))}
      <text x={20} y={155} className="fill-primary text-[9px]">
        rate r = {rate} bits (the cup)
      </text>
      <text x={20} y={168} className="fill-muted-foreground text-[9px]">
        capacity c = {capacity} bits (sealed — never output)
      </text>
      <text x={20} y={182} className="fill-muted-foreground text-[9px]">
        f = Keccak-f[1600], 24 rounds
      </text>
      <text x={350} y={45} className="fill-foreground text-[9px] font-bold">
        squeeze
      </text>
      {Array.from({ length: outBlocks }, (_, o) => (
        <motion.rect
          key={o}
          x={400 + o * 38}
          y={60}
          width={32}
          height={rateH * 0.6}
          rx={3}
          className="fill-success/30 stroke-success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1.6 + o * 0.35,
            repeat: outBlocks > 1 ? Infinity : 0,
            repeatDelay: 2,
          }}
        />
      ))}
      <text x={400} y={140} className="fill-success text-[10px] font-bold">
        {outLabel}
      </text>
    </svg>
  )
}

const Sha3Visual: React.FC = () => (
  <div className="space-y-3">
    <div className="text-sm font-semibold text-primary">
      SHA3-256: absorb in 1,088-bit cups, always output exactly 256 bits
    </div>
    <Sponge rate={1088} capacity={512} outBlocks={1} outLabel="256-bit digest — fixed length" />
  </div>
)

const ShakeVisual: React.FC = () => (
  <div className="space-y-3">
    <div className="text-sm font-semibold text-primary">
      SHAKE128: same sponge, bigger cup (1,344 bits), and the output tap stays open
    </div>
    <Sponge
      rate={1344}
      capacity={256}
      outBlocks={5}
      outLabel="as many output blocks as you ask for"
    />
    <p className="text-xs text-muted-foreground italic">
      SHAKE256 uses the same 1,088 / 512 split as SHA3-256. ML-DSA-65 grows a 6 × 5 matrix of
      256-coefficient polynomials from a 32-byte seed this way.
    </p>
  </div>
)

// ── Component ──────────────────────────────────────────────────────────────

export const BuildingBlocksExplainer: React.FC = () => {
  const [idx, setIdx] = useState(0)
  const block = BLOCKS[idx] // eslint-disable-line security/detect-object-injection
  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        <div className="glass-panel p-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BLOCKS.map((b, i) => (
              <Button
                key={b.id}
                variant="ghost"
                size="tile"
                onClick={() => setIdx(i)}
                className={`rounded-md border p-2 text-left transition-colors h-auto block whitespace-normal ${
                  i === idx
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border bg-card/40 hover:bg-card'
                }`}
              >
                <div
                  className={`text-sm font-bold ${i === idx ? 'text-primary' : 'text-foreground'}`}
                >
                  {b.label}
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5 space-y-4 border border-primary/30">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-primary">{block.label}</h3>
            <span className="text-xs text-muted-foreground italic">{block.tagline}</span>
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-warning shrink-0" />
              <h4 className="text-sm font-bold text-warning">In plain English</h4>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{block.layman.analogy}</p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {block.layman.whatsDifferent}
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              <span className="font-semibold text-foreground">The catch — </span>
              {block.layman.catch}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card/40 p-4 overflow-hidden">
            {block.id === 'montgomery' && <MontgomeryVisual />}
            {block.id === 'ntt' && <NttVisual />}
            {block.id === 'keccak' && <KeccakVisual />}
            {block.id === 'sha3' && <Sha3Visual />}
            {block.id === 'shake' && <ShakeVisual />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-card/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                Used by
              </div>
              <p className="text-xs text-foreground/85 leading-snug">{block.usedBy}</p>
            </div>
            <div className="rounded-md border border-border bg-card/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                Accelerated by
              </div>
              <p className="text-xs text-foreground/85 leading-snug">{block.acceleratedBy}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="gap-2"
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          <Button
            variant="gradient"
            onClick={() => setIdx(Math.min(BLOCKS.length - 1, idx + 1))}
            disabled={idx === BLOCKS.length - 1}
            className="gap-2"
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </MotionConfig>
  )
}
