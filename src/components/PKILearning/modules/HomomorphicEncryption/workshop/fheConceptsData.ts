// SPDX-License-Identifier: GPL-3.0-only
import type { CkksEvidenceKey } from '../data/fheCkksEvidence'

/**
 * Data behind the "FHE concepts, hands-on" workshop step (2026-10-10; cached-generator runs
 * 2026-10-11).
 *
 * Measured numbers are copied from the published evidence files under
 * public/data/fhe-evidence/ (Lattigo v6.2.0 default bootstrappable set N16QP1546H192H32,
 * 51 keys, 3,941,073,029 B exported). Each measured value names the evidence record it
 * comes from (CKKS_EVIDENCE key). Nothing here is interpolated: a chunk size a device was
 * not measured at has no entry, and the UI says "not measured".
 */

/** One limb of one key at N = 2^16: 2^16 coefficients × 8 B. */
export const LIMB_BYTES = 524_288
export const KEYSET_BYTES = 3_941_073_029
export const KEY_COUNT = 51

export const LIMB_CHOICES = [1, 2, 4, 8, 16, 30] as const
export type LimbChoice = (typeof LIMB_CHOICES)[number]

/** C_DeriveKey calls for the whole set at each chunk size (sweep.txt, identical on every device). */
export const CALLS_BY_LIMBS: Record<LimbChoice, number> = {
  1: 7502,
  2: 3751,
  4: 2001,
  8: 1001,
  16: 501,
  30: 251,
}

export type StreamDevice = 'm4pro' | 'mx95' | 'mx95pro' | 'mx95-cached' | 'mx95pro-cached'

export interface StreamMeasurement {
  /** seconds for the token to generate the whole set (output discarded) */
  seconds: number
  /** token peak resident memory, KiB */
  peakKiB: number
  evidence: CkksEvidenceKey
}

export interface StreamDeviceInfo {
  id: StreamDevice
  label: string
  /**
   * Straight-line fit published with the sweep record: work + per-call cost. Absent for the
   * cached-generator runs, which were measured at 8 and 30 limbs only and publish no fit.
   */
  fit?: { workSeconds: number; perCallMs: number; evidence: CkksEvidenceKey }
  measured: Partial<Record<LimbChoice, StreamMeasurement>>
  /** generation streamed to a Mac over the network at 8 limbs per call */
  streamedSeconds?: number
  streamedEvidence?: CkksEvidenceKey
}

export const STREAM_DEVICES: StreamDeviceInfo[] = [
  {
    id: 'm4pro',
    label: 'Mac (M4 Pro), one core',
    fit: { workSeconds: 33.8, perCallMs: 8, evidence: 'sweepMac' },
    measured: {
      1: { seconds: 93.606, peakKiB: 12448, evidence: 'sweepMac' },
      2: { seconds: 64.759, peakKiB: 13052, evidence: 'sweepMac' },
      4: { seconds: 50.009, peakKiB: 13656, evidence: 'sweepMac' },
      8: { seconds: 41.953, peakKiB: 15592, evidence: 'sweepMac' },
      16: { seconds: 37.737, peakKiB: 26692, evidence: 'sweepMac' },
      30: { seconds: 35.817, peakKiB: 40924, evidence: 'sweepMac' },
    },
  },
  {
    id: 'mx95',
    label: 'MX95, one core, before (2026-10-10)',
    fit: { workSeconds: 397, perCallMs: 77, evidence: 'sweepMx95' },
    measured: {
      1: { seconds: 974.579, peakKiB: 14436, evidence: 'sweepMx95' },
      8: { seconds: 473.419, peakKiB: 17060, evidence: 'mx95' },
      30: { seconds: 416.538, peakKiB: 43668, evidence: 'sweepMx95' },
    },
    streamedSeconds: 497.656,
    streamedEvidence: 'mx95',
  },
  {
    id: 'mx95pro',
    label: 'MX95 Pro, one core, before (2026-10-10)',
    fit: { workSeconds: 378, perCallMs: 77, evidence: 'sweepMx95pro' },
    measured: {
      1: { seconds: 955.192, peakKiB: 14924, evidence: 'sweepMx95pro' },
      8: { seconds: 450.934, peakKiB: 16076, evidence: 'mx95pro' },
      30: { seconds: 397.542, peakKiB: 42396, evidence: 'sweepMx95pro' },
    },
    streamedSeconds: 477.955,
    streamedEvidence: 'mx95pro',
  },
  {
    id: 'mx95-cached',
    label: 'MX95, one core, cached generator (2026-10-11)',
    measured: {
      8: { seconds: 213.843, peakKiB: 66056, evidence: 'cachedMx95' },
      30: { seconds: 209.767, peakKiB: 88392, evidence: 'cachedMx95' },
    },
  },
  {
    id: 'mx95pro-cached',
    label: 'MX95 Pro, six cores, cached generator (2026-10-11)',
    measured: {
      8: { seconds: 83.989, peakKiB: 96696, evidence: 'cachedMx95pro' },
      30: { seconds: 72.417, peakKiB: 126556, evidence: 'cachedMx95pro' },
    },
  },
]

/** Measured CKKS bootstrap on a Mac (M5 Max) with the keys each board streamed out (e2e.json). */
export const BOOTSTRAP_MEASURED = [
  { seconds: 6.68, evidence: 'mx95' as CkksEvidenceKey },
  { seconds: 7.27, evidence: 'mx95pro' as CkksEvidenceKey },
]

/** log2 precision of the owner release at precisionBits 20 (e2e-check.json). */
export const RELEASE_PRECISION_MEASURED = [
  { bits: 20.94, evidence: 'mx95' as CkksEvidenceKey },
  { bits: 20.94, evidence: 'mx95pro' as CkksEvidenceKey },
]

/* ------------------------------------------------------------------ */
/*  Program → circuit                                                  */
/* ------------------------------------------------------------------ */

/** TFHE-rs CPU benchmark, FheUint64, vendor figures on AWS hpc8a.96xlarge (ms). */
export const TFHE_RS_U64_MS = { add: 61.3, compare: 49.7, select: 38.5, mul: 262, div: 3360 }

export type ProgramId = 'branch' | 'max' | 'mean'

export interface ProgramCircuit {
  id: ProgramId
  label: string
  plain: string
  tfhe: string
  ckks: string
  tfheOps: string
  /** sum of the vendor per-operation times for the encrypted ops, ms (rough, sequential) */
  tfheMs: number | null
  tfheNote: string
  ckksOps: string
  ckksDepth: string
  ckksNote: string
}

export const PROGRAMS: ProgramCircuit[] = [
  {
    id: 'branch',
    label: 'if (x > t) y = a else y = b',
    plain: `if (x > t) {
  y = a
} else {
  y = b
}`,
    tfhe: `// both branches exist; nothing branches on secret data
c = x.gt(t)          // encrypted boolean
y = c.select(a, b)   // multiplexer`,
    ckks: `// no comparison operator: approximate sign()
s = p(x - t)         // p ≈ sign, a polynomial
c = (1 + s) / 2      // ≈ 1 if x > t, ≈ 0 otherwise
y = b + c * (a - b)  // arithmetic select`,
    tfheOps: '1 compare + 1 select',
    tfheMs: TFHE_RS_U64_MS.compare + TFHE_RS_U64_MS.select,
    tfheNote: 'Compare and select are native TFHE-rs operations on encrypted integers.',
    ckksOps: '1 subtract, the multiplications inside p, 1 multiply for the select, adds',
    ckksDepth: 'depth of p + 1',
    ckksNote:
      'CKKS only adds and multiplies. The comparison becomes a polynomial approximation of sign (for example a composite polynomial), or the ciphertext is switched to a scheme that compares. The result is approximate near x = t.',
  },
  {
    id: 'max',
    label: 'max(x1, x2, x3)',
    plain: `m = x1
for v in [x2, x3]:
  if v > m:
    m = v`,
    tfhe: `// loop with a known bound: unrolled
c1 = x2.gt(x1);  m = c1.select(x2, x1)
c2 = x3.gt(m);   m = c2.select(x3, m)
// TFHE-rs also offers x.max(y)`,
    ckks: `// max(a, b) = (a + b)/2 + (a - b)·sign(a - b)/2
m = maxApprox(x1, x2)
m = maxApprox(m, x3)`,
    tfheOps: '2 compares + 2 selects',
    tfheMs: 2 * (TFHE_RS_U64_MS.compare + TFHE_RS_U64_MS.select),
    tfheNote: 'The unrolled loop runs every iteration; the comparison result picks the value.',
    ckksOps: '2 sign approximations, 2 multiplies, adds',
    ckksDepth: '2 × (depth of p + 1), in sequence',
    ckksNote:
      'Each step depends on the previous maximum, so the depths add up. Comparison-heavy programs consume levels quickly and need bootstrapping or a scheme switch.',
  },
  {
    id: 'mean',
    label: 'mean(x1, x2, x3, x4)',
    plain: `s = 0
for v in xs:   # 4 values
  s = s + v
mean = s / 4`,
    tfhe: `s = x1 + x2 + x3 + x4   // unrolled
mean = s / 4            // divide by a plaintext:
                        // a shift for unsigned integers`,
    ckks: `s = x1 + x2 + x3 + x4
mean = s * 0.25         // multiply by a plaintext constant`,
    tfheOps: '3 adds + 1 division by the plaintext 4',
    tfheMs: 3 * TFHE_RS_U64_MS.add,
    tfheNote:
      'Integer mean truncates. Dividing by a plaintext power of two is a scalar operation, not the 3.36 s encrypted-by-encrypted division; it is not in the quoted table, so the time shown is the three adds only.',
    ckksOps: '3 adds + 1 plaintext multiply',
    ckksDepth: '1 (the constant multiply is followed by one rescale)',
    ckksNote:
      'Arithmetic like this is what CKKS does cheaply, on thousands of packed values at once.',
  },
]
