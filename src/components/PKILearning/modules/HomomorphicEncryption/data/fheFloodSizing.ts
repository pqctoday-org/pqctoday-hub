// SPDX-License-Identifier: GPL-3.0-only

/**
 * The corrected flood sizing of the CKKS decryption policy (2026-10-11) in one place: the
 * formula, the measured precisions, and the one marker for what is not measured yet.
 *
 * Source of every number: the evidence records ckks-metabts2-lmss-gate-f-m5max-3bcdc05,
 * ckks-metabts2-lmss-depth1-m5max-3bcdc05, ckks-metabts2-lmss-depth3-m5max-3bcdc05 and
 * ckks-default-lmss-id2-m5max-3bcdc05 (pqctoday-fhe 3bcdc05, Mac M5 Max, token in a container).
 * Engine: pqctoday-hsm #355, merge commit d6b23452d92e4250069db9b993f818e65712b7b1.
 */

/**
 * BOARD CELLS: the one place that says the corrected flood sizing has not been run on the
 * MX95 and MX95 Pro boards. Replace this constant (and the marked line in rag-summary.md) once
 * the board runs exist; every Learn and workshop text that needs the sentence reads it from here.
 */
export const BOARD_CELLS_NOT_MEASURED = 'not yet measured on the boards with the corrected sizing'

/** The formula as the token applies it (pqctoday-hsm proposal §6.6). */
export const FLOOD_FORMULA = 'log₂σ = s/2 + ½·log₂(24·q·n) + log₂B'

/** The gate F bar: the least precision a flooded third-party release must keep. */
export const GATE_F_BAR_BITS = 10

/** Registry ID 3 (second parameter set, META-BTS ×2, scale 2^90), policy λ_s 30, q = 50,000. */
export const FLOOD_ID3 = {
  sigmaLog2: '69.10',
  /** Mac (M5 Max), token in a container, flooded release, bits over 32,768 slots. */
  depth0: '11.10',
  depth1: '11.25',
  depth3: '11.34',
  /** Margin over the bar, in bits (11.10 − 10 to 11.34 − 10). */
  margin: '1.1–1.3',
  /** The same runs before the correction (σ = 2^57.6). */
  beforeDepth0: '22.84',
  beforeDepth1: '22.63',
  beforeDepth3: '22.78',
  beforeSigmaLog2: '57.6',
  /** Earlier board runs at the earlier width, kept as records (superseded). */
  beforeMx95Pro: '22.78',
  beforeMx95: '22.59',
} as const

/** Registry ID 2 (default parameter set, scale 2^40), same policy. */
export const FLOOD_ID2 = {
  sigmaLog2: '43.1',
  /** Noise-study emulation, worst of 3 draws. */
  emulatedBits: '−12.82',
  /** The earlier width (2^31.64) left this many bits. */
  beforeSigmaLog2: '31.6',
  beforeBits: '−1.3',
} as const

/** How much narrower the earlier flood was at n = 2^16: ½·log₂(24·n). */
export const WIDTH_SHORTFALL_BITS = '10.3'

/** Policy used for the measurements: λ_s 30, 10,000 decrypts, 4 replicas. */
export const FLOOD_POLICY = {
  statSecurityBits: 30,
  maxDecrypts: '10,000',
  maxReplicas: 4,
  q: '50,000',
} as const

/**
 * What the HSM documents state about the sampler (pqctoday-hsm proposal §6.6; pqctoday-fhe
 * docs/ckks/ckks-flood-sampler-timing-note-2026-10-11.md).
 */
export const SAMPLER_SENTENCE =
  'The noise is drawn with floating-point Box–Muller and rounded: the time of one draw depends on the value drawn (measured on both MX95 boards, about 21 ns of 230–390 ns per draw), the time of a whole release showed no measurable dependence on the noise, the noise is a rounded continuous Gaussian rather than the discrete Gaussian of the published analysis, and a constant-time sampler is a tracked next-development item.'
