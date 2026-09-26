// SPDX-License-Identifier: GPL-3.0-only
/**
 * D4 — synthetic failure (and contrast) datasets for the SP 800-90B workshop.
 *
 * EVERY dataset produced here is SYNTHETIC. None of them is a measurement of
 * a physical noise source, and none may be presented as one. They exist
 * because real devices do not fail on demand (plan §4, D4).
 *
 * Output format is the NIST SP800-90B_EntropyAssessment input format: one
 * sample per byte, the sample in the least-significant `bitsPerSymbol` bits.
 * Restart matrices are 1000 rows (restarts) x 1000 columns (samples), stored
 * row-major, exactly as `ea_restart` reads them.
 *
 * Determinism: all randomness comes from xoshiro128** seeded by splitmix32
 * from an explicit 32-bit seed, implemented with 32-bit integer ops only, so
 * Node and every browser produce byte-identical output. The manifest pins the
 * SHA-256 of each output; `syntheticDatasets.local.test.ts` re-checks it.
 *
 * Pure module: no Node or DOM APIs, safe in a Web Worker.
 */
import { sha256 } from '@noble/hashes/sha2.js'

/** SP 800-90B §3.1.1: at least 1,000,000 sequential samples. */
export const SEQUENTIAL_SAMPLES = 1_000_000
/** SP 800-90B §3.1.4.1: 1000 restarts x 1000 samples. */
export const RESTART_ROWS = 1000
export const RESTART_COLS = 1000

/** Base seed for the whole D4 set; each dataset derives its own from it. */
export const D4_BASE_SEED = 0x90b0_0924

// ---------------------------------------------------------------------------
// PRNG: splitmix32 (seeding) + xoshiro128** (stream). 32-bit ops only.
// ---------------------------------------------------------------------------

function splitmix32(state: { s: number }): number {
  state.s = (state.s + 0x9e3779b9) | 0
  let z = state.s
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b)
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35)
  return (z ^ (z >>> 16)) >>> 0
}

export class Xoshiro128ss {
  private a: number
  private b: number
  private c: number
  private d: number

  constructor(seed: number) {
    const st = { s: seed | 0 }
    this.a = splitmix32(st)
    this.b = splitmix32(st)
    this.c = splitmix32(st)
    this.d = splitmix32(st)
  }

  /** Next uniform 32-bit unsigned integer. */
  nextU32(): number {
    const r = Math.imul(rotl(Math.imul(this.b, 5), 7), 9) >>> 0
    const t = this.b << 9
    this.c ^= this.a
    this.d ^= this.b
    this.b ^= this.c
    this.a ^= this.d
    this.c ^= t
    this.d = rotl(this.d, 11)
    return r
  }

  /** Uniform in [0, 1) with 32-bit resolution. */
  nextUnit(): number {
    return this.nextU32() / 4294967296
  }
}

function rotl(x: number, k: number): number {
  return (x << k) | (x >>> (32 - k))
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Stuck source: every sample is the same symbol. */
export function genStuck(n: number, value: number): Uint8Array {
  return new Uint8Array(n).fill(value & 0xff)
}

/** IID Bernoulli bits with P(1) = p1. */
export function genBiasedBits(n: number, p1: number, seed: number): Uint8Array {
  const rng = new Xoshiro128ss(seed)
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) out[i] = rng.nextUnit() < p1 ? 1 : 0
  return out
}

/** IID uniform symbols of `bits` width (PRNG output — statistically IID-like). */
export function genUniform(n: number, bits: number, seed: number): Uint8Array {
  const rng = new Xoshiro128ss(seed)
  const mask = (1 << bits) - 1
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) out[i] = (rng.nextU32() >>> 24) & mask
  return out
}

/**
 * Binary first-order Markov chain: repeat the previous bit with probability
 * `pStay`. Balanced (mean 0.5) but strongly serially correlated.
 */
export function genMarkovBits(n: number, pStay: number, seed: number): Uint8Array {
  const rng = new Xoshiro128ss(seed)
  const out = new Uint8Array(n)
  let prev = rng.nextU32() & 1
  for (let i = 0; i < n; i++) {
    if (rng.nextUnit() >= pStay) prev ^= 1
    out[i] = prev
  }
  return out
}

/**
 * Restart-correlated source: every restart re-initialises to the SAME internal
 * state, so each row replays one base sequence; a fraction `pNoise` of samples
 * are replaced by independent noise. Row-major rows x cols.
 */
export function genRestartCorrelated(
  rows: number,
  cols: number,
  bits: number,
  pNoise: number,
  seed: number
): Uint8Array {
  const base = genUniform(cols, bits, seed)
  const noise = new Xoshiro128ss(seed ^ 0x5eed_0001)
  const mask = (1 << bits) - 1
  const out = new Uint8Array(rows * cols)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const replace = noise.nextUnit() < pNoise
      const v = noise.nextU32()
      out[r * cols + c] = replace ? (v >>> 24) & mask : base[c]
    }
  }
  return out
}

/** Healthy restart matrix: every restart starts from an independent state. */
export function genRestartIndependent(
  rows: number,
  cols: number,
  bits: number,
  seed: number
): Uint8Array {
  const out = new Uint8Array(rows * cols)
  for (let r = 0; r < rows; r++) {
    out.set(genUniform(cols, bits, (seed + Math.imul(r + 1, 0x9e3779b9)) | 0), r * cols)
  }
  return out
}

/**
 * SHA-256 conditioning of an input stream: output block i is
 * SHA-256(be64(i) || input[i*inBlock .. (i+1)*inBlock)), truncated to
 * `outBytes` total. The counter makes the output look random even when the
 * input carries no entropy at all — that is the lesson.
 */
export function conditionSha256(input: Uint8Array, inBlock: number, outBytes: number): Uint8Array {
  const out = new Uint8Array(outBytes)
  const buf = new Uint8Array(8 + inBlock)
  let o = 0
  for (let i = 0; o < outBytes; i++) {
    const hi = Math.floor(i / 4294967296)
    const lo = i >>> 0
    buf[0] = (hi >>> 24) & 0xff
    buf[1] = (hi >>> 16) & 0xff
    buf[2] = (hi >>> 8) & 0xff
    buf[3] = hi & 0xff
    buf[4] = (lo >>> 24) & 0xff
    buf[5] = (lo >>> 16) & 0xff
    buf[6] = (lo >>> 8) & 0xff
    buf[7] = lo & 0xff
    const start = (i * inBlock) % input.length
    for (let k = 0; k < inBlock; k++) buf[8 + k] = input[(start + k) % input.length]
    const h = sha256(buf)
    const take = Math.min(h.length, outBytes - o)
    out.set(h.subarray(0, take), o)
    o += take
  }
  return out
}

// ---------------------------------------------------------------------------
// The D4 catalogue
// ---------------------------------------------------------------------------

export type D4Kind = 'sequential' | 'restart'

export interface D4DatasetSpec {
  /** Stable id, also the file stem (`<id>.bin`). */
  id: string
  kind: D4Kind
  bitsPerSymbol: number
  /** Always "synthetic" — never a device measurement. */
  provenance: 'synthetic'
  /** Which SP 800-90B track this dataset is meant to exercise. */
  intendedTrack: 'non-iid' | 'iid' | 'restart'
  /** Generator function name in this module, for the manifest. */
  generator: string
  seed: number | null
  parameters: Record<string, number | string>
  /** What a learner should be able to conclude — and what they must not. */
  teachingNote: string
  /** For the restart matrices: the sequential dataset whose H_I feeds ea_restart. */
  pairedSequentialId?: string
  build: () => Uint8Array
}

const seedFor = (k: number): number => (D4_BASE_SEED + Math.imul(k, 0x01000193)) | 0

export const D4_DATASETS: readonly D4DatasetSpec[] = [
  {
    id: 'd4-stuck-8bit',
    kind: 'sequential',
    bitsPerSymbol: 8,
    provenance: 'synthetic',
    intendedTrack: 'non-iid',
    generator: 'genStuck',
    seed: null,
    parameters: { samples: SEQUENTIAL_SAMPLES, value: 0 },
    teachingNote:
      'A stuck source emits one symbol forever. The NIST tool refuses to award any entropy (alphabet of one symbol).',
    build: () => genStuck(SEQUENTIAL_SAMPLES, 0),
  },
  {
    id: 'd4-biased-1bit',
    kind: 'sequential',
    bitsPerSymbol: 1,
    provenance: 'synthetic',
    intendedTrack: 'iid',
    generator: 'genBiasedBits',
    seed: seedFor(1),
    parameters: { samples: SEQUENTIAL_SAMPLES, p1: 0.75 },
    teachingNote:
      'Independent but biased bits, P(1)=0.75: the true min-entropy is -log2(0.75) ≈ 0.415 bit/sample. The estimators should land near, and not above, that value.',
    build: () => genBiasedBits(SEQUENTIAL_SAMPLES, 0.75, seedFor(1)),
  },
  {
    id: 'd4-markov-1bit',
    kind: 'sequential',
    bitsPerSymbol: 1,
    provenance: 'synthetic',
    intendedTrack: 'non-iid',
    generator: 'genMarkovBits',
    seed: seedFor(2),
    parameters: { samples: SEQUENTIAL_SAMPLES, pStay: 0.7 },
    teachingNote:
      'Balanced bits (mean ≈ 0.5) that repeat the previous bit 70% of the time. Most Common Value alone looks near 1 bit/sample; the Markov and predictor estimators expose the correlation (true per-sample min-entropy −log2(0.7) ≈ 0.515).',
    build: () => genMarkovBits(SEQUENTIAL_SAMPLES, 0.7, seedFor(2)),
  },
  {
    id: 'd4-healthy-iid-8bit',
    kind: 'sequential',
    bitsPerSymbol: 8,
    provenance: 'synthetic',
    intendedTrack: 'iid',
    generator: 'genUniform',
    seed: seedFor(3),
    parameters: { samples: SEQUENTIAL_SAMPLES, prng: 'xoshiro128**' },
    teachingNote:
      'Deterministic PRNG output that passes the statistics. It is NOT an entropy source: anyone with the seed predicts every sample. Passing tests is not evidence of unpredictability.',
    build: () => genUniform(SEQUENTIAL_SAMPLES, 8, seedFor(3)),
  },
  {
    id: 'd4-healthy-iid-8bit-restart',
    kind: 'restart',
    bitsPerSymbol: 8,
    provenance: 'synthetic',
    intendedTrack: 'restart',
    generator: 'genRestartIndependent',
    seed: seedFor(4),
    parameters: { rows: RESTART_ROWS, cols: RESTART_COLS, prng: 'xoshiro128**' },
    teachingNote:
      'Restart matrix where every restart starts from an independent PRNG state: the restart sanity test has nothing to find. (Still synthetic PRNG output — see d4-healthy-iid-8bit.)',
    pairedSequentialId: 'd4-healthy-iid-8bit',
    build: () => genRestartIndependent(RESTART_ROWS, RESTART_COLS, 8, seedFor(4)),
  },
  {
    id: 'd4-restart-correlated-8bit',
    kind: 'restart',
    bitsPerSymbol: 8,
    provenance: 'synthetic',
    intendedTrack: 'restart',
    generator: 'genRestartCorrelated',
    seed: seedFor(5),
    parameters: { rows: RESTART_ROWS, cols: RESTART_COLS, pNoise: 0.02 },
    teachingNote:
      'Every restart replays the same internal state (98% of each row identical to one base row). A single long run looks healthy; only the restart test shows that power-cycling the device repeats its output.',
    pairedSequentialId: 'd4-healthy-iid-8bit',
    build: () => genRestartCorrelated(RESTART_ROWS, RESTART_COLS, 8, 0.02, seedFor(5)),
  },
  {
    id: 'd4-sha256-conditioned-stuck-8bit',
    kind: 'sequential',
    bitsPerSymbol: 8,
    provenance: 'synthetic',
    intendedTrack: 'non-iid',
    generator: 'conditionSha256(genStuck)',
    seed: null,
    parameters: {
      samples: SEQUENTIAL_SAMPLES,
      input: 'd4-stuck-8bit',
      inBlockBytes: 64,
      construction: 'SHA-256(be64(counter) || 64-byte input block)',
    },
    teachingNote:
      'SHA-256 over a STUCK input (zero entropy) plus a counter. The output passes the estimators at close to 8 bits/byte, yet it carries no entropy at all: conditioning cannot create entropy, and testing conditioned output is not an entropy assessment.',
    build: () => conditionSha256(genStuck(SEQUENTIAL_SAMPLES, 0), 64, SEQUENTIAL_SAMPLES),
  },
]

/**
 * Small KAT fixture for the fast unit test (NOT a 90B-sized dataset; the tool
 * prints its "< 1,000,000 samples" warning for it). Markov bits, 20,000 samples.
 */
export const KAT_FIXTURE = {
  id: 'kat-markov-1bit-20k',
  bitsPerSymbol: 1,
  build: (): Uint8Array => genMarkovBits(20_000, 0.7, seedFor(99)),
} as const

/**
 * Small IID KAT fixture: biased independent bits, 20,000 samples. The IID
 * permutation test passes early on IID data, so a seeded run stays fast
 * (the Markov fixture above would run all 10,000 permutations).
 */
export const KAT_IID_FIXTURE = {
  id: 'kat-biased-1bit-20k',
  bitsPerSymbol: 1,
  build: (): Uint8Array => genBiasedBits(20_000, 0.75, seedFor(98)),
} as const
