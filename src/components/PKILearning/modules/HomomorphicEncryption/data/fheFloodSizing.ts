// SPDX-License-Identifier: GPL-3.0-only

/**
 * The corrected flood sizing of the CKKS decryption policy (2026-10-11) in one place: the
 * formula, the measured precisions, and the one marker for what is not measured yet.
 *
 * Source of every number: the evidence records ckks-metabts2-lmss-gate-f-m5max-3bcdc05,
 * ckks-metabts2-lmss-depth1-m5max-3bcdc05, ckks-metabts2-lmss-depth3-m5max-3bcdc05 and
 * ckks-default-lmss-id2-m5max-3bcdc05 (Mac M5 Max, token in a container), and
 * ckks-metabts2-lmss-stream-mx95pro-mac-m5max-dc9ad8b and
 * ckks-metabts2-lmss-stream-mx95-mac-m5max-dc9ad8b (token on the boards). Run files: pqctoday-fhe
 * #26, merge commit dc9ad8b9d92013ed95aae7530eadec49ade711b8. Engine: pqctoday-hsm #355, merge
 * commit d6b23452d92e4250069db9b993f818e65712b7b1.
 */

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
  margin: '1.1–1.4',
  /** Lowest and highest of the nine flooded runs (Mac and both boards, depth 0, 1 and 3). */
  rangeLow: '11.10',
  rangeHigh: '11.37',
  /** The same runs before the correction (σ = 2^57.6). */
  beforeDepth0: '22.84',
  beforeDepth1: '22.63',
  beforeDepth3: '22.78',
  beforeSigmaLog2: '57.6',
  /** Earlier board runs at the earlier width, depth 0, kept as records (superseded). */
  beforeMx95Pro: '22.78',
  beforeMx95: '22.59',
} as const

/**
 * The same programs with the token on the boards (2026-10-11): the flooded release, bits over
 * 32,768 slots at depth 0, 1 and 3, and what the depth-0 session measured.
 */
export const FLOOD_ID3_BOARDS = {
  mx95pro: { depth0: '11.37', depth1: '11.20', depth3: '11.26', generationSeconds: '96.9' },
  mx95: { depth0: '11.19', depth1: '11.14', depth3: '11.32', generationSeconds: '99.2' },
  /** Streamed to the Mac, end to end (s): MX95 Pro, MX95. */
  streamedSeconds: { mx95pro: '121', mx95: '124' },
  /** Token peak memory over every measurement of both boards (MiB). */
  peakMiB: '80.6–82.4',
  /** The largest difference from the Mac run of the same program (bits). */
  maxFromMacBits: '0.3',
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
