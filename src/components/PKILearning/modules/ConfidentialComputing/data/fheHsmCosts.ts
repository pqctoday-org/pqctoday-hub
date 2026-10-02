// SPDX-License-Identifier: GPL-3.0-only

// ── Per-step data volume and compute cost for the FHE + HSM flows ─────────
//
// FHE figures are ORDER-OF-MAGNITUDE ESTIMATES, not measurements. The
// RLWE flows (CKKS, BFV, BGV) assume ring dimension N = 2^16 (~30 RNS limbs;
// CKKS with bootstrappable parameters, 32,768 slots per ciphertext); the TFHE
// flows assume the TFHE-rs 1.8.1 default (n = 918, N = 2,048, k = 1, KS level 4). All on a recent multicore CPU or
// datacentre GPU. `SIZE_BASIS` below is shown on screen per flow. Real numbers move by 10x with parameters, library and hardware — the
// workshop says so on screen. Measure before quoting any of them elsewhere.
//
// Exact figures (not estimates): ML-DSA-65 signature 3,309 B and public key
// 1,952 B (FIPS 204); ML-KEM-768 ciphertext 1,088 B (FIPS 203); X25519MLKEM768
// key shares 1,216 B / 1,120 B; AES key wrap adds 8 B (RFC 3394 / SP 800-38F).
// Homomorphic-AES figures (238 KB/s throughput and 26 ms latency, from separate variants, on an
// RTX 5090) is from IACR ePrint 2026/1209.

import type { FheFlowId, LinkKind } from './fheHsmFlows'

/** What the FHE estimates of each flow assume, shown under the diagram. */
export const SIZE_BASIS: Record<FheFlowId, string> = {
  'single-hsm': 'CKKS at ring dimension N = 2¹⁶ with bootstrappable parameters',
  'tfhe-single-hsm':
    'TFHE with LWE n = 918, GLWE N = 2,048, k = 1 (TFHE-rs 1.8.1 default, KS level 4)',
  'openfhe-threshold': 'BFV at ring dimension N = 2¹⁶, leveled (no bootstrapping)',
  'lattigo-threshold': 'BGV at ring dimension N = 2¹⁶, refreshed interactively',
  'hsm-compute-limits': 'CKKS at ring dimension N = 2¹⁶ with bootstrappable parameters',
  'tfhe-transciphering':
    'TFHE with LWE n = 918, GLWE N = 2,048, k = 1 (TFHE-rs 1.8.1 default, KS level 4)',
}

/** Log-scale bucket used to draw the per-step bars. 0 = nothing. */
export type DataLevel = 0 | 1 | 2 | 3 | 4 // —, ≤ KB, ~MB, ~100 MB, ~GB
export type ComputeLevel = 0 | 1 | 2 | 3 | 4 // —, µs–ms, 10s of ms, seconds, minutes

export const DATA_LEVEL_LABELS = ['none', '≤ KB', '~MB', '~100 MB', '~GB'] as const
export const COMPUTE_LEVEL_LABELS = ['none', 'µs–ms', '10s of ms', 'seconds', 'minutes'] as const

export interface StepCost {
  dataLevel: DataLevel
  /** ≤ 12 chars — drawn in the diagram's Data column. */
  dataShort: string
  computeLevel: ComputeLevel
  /** ≤ 12 chars — drawn in the diagram's Compute column. */
  computeShort: string
  /** Where the work runs, e.g. "HSM CPU", "GPU". */
  where: string
  /** One or two sentences for the caption. */
  note: string
}

/** Exact wire sizes of the crypto that the quantum overlay swaps. */
export const LINK_SIZES: Record<LinkKind, { classical: string; pqc: string } | null> = {
  tls: {
    classical: 'ECDHE X25519 key shares: 32 B each way',
    pqc: 'X25519MLKEM768 key shares: 1,216 B + 1,120 B (once per session)',
  },
  sig: {
    classical: 'ECDSA P-256 signature: ~64 B',
    pqc: 'ML-DSA-65 signature: 3,309 B (public key 1,952 B)',
  },
  wrap: {
    classical: 'RSA-3072 OAEP wrap: 384 B',
    pqc: 'Replication package: 1,088 B ML-KEM-768 encapsulation + sealed seed and descriptor + 3,309 B ML-DSA-65 signature, plus the ML-DSA-65 certificate chain',
  },
  stream: {
    classical:
      'Kreyvium: 128-bit key and IV, ciphertext = data size (Trivium’s 80-bit key is too short for long-lived data)',
    pqc: 'Kreyvium: 128-bit key and IV, ciphertext = data size',
  },
  fhe: null,
}

const c = (
  dataLevel: DataLevel,
  dataShort: string,
  computeLevel: ComputeLevel,
  computeShort: string,
  where: string,
  note: string
): StepCost => ({ dataLevel, dataShort, computeLevel, computeShort, where, note })

/** Indexed in the same order as each flow's `steps` (checked by fheHsmCosts.test.ts). */
export const FHE_STEP_COSTS: Record<FheFlowId, StepCost[]> = {
  'single-hsm': [
    c(
      1,
      '32 B seed',
      1,
      '~ms',
      'HSM',
      'Seed generation is one DRBG call. Expanding it into the secret key takes a few NTTs and stays inside the HSM.'
    ),
    c(
      4,
      '~GB',
      4,
      'too slow',
      'HSM (rejected)',
      'A bootstrappable CKKS key set is ~1.5–5 GB seeded (estimate): relinearization plus dozens of rotation keys at ~50–90 MB each. At these estimated sizes an HSM can neither hold nor return that through PKCS#11. This is the step that does not scale.'
    ),
    c(
      2,
      '~MB',
      1,
      '~ms',
      'HSM → client',
      'The public key is two ring elements, ~15–30 MB at N = 2¹⁶ (estimate). Signing its hash is sub-millisecond.'
    ),
    c(
      2,
      '~MB / ct',
      2,
      '10s of ms',
      'client CPU',
      'Each ciphertext is several MB and packs up to 32,768 values, roughly 100× larger than the raw data. Encrypting one takes tens of milliseconds.'
    ),
    c(
      4,
      '~GB keys',
      4,
      'sec–min',
      'cloud GPU/CPU',
      'Additions are cheap. A multiply plus relinearize takes tens of ms, and each bootstrap takes seconds on a CPU or ~40–330 ms on a GPU (published N = 2¹⁶ figures). The cloud also needs the GB-scale keys in memory.'
    ),
    c(
      2,
      '~1 MB',
      0,
      '—',
      'network',
      'After computation the result sits at a low modulus level, so it shrinks to about 1 MB per ciphertext.'
    ),
    c(
      1,
      '~1 MB in',
      1,
      '~ms',
      'HSM',
      'Decryption is one ring multiplication, a few milliseconds. The policy check and noise flooding add little.'
    ),
    c(
      1,
      '≤ KB',
      0,
      '—',
      'network',
      'The plaintext result is usually small: an aggregate, a score or a decision.'
    ),
    c(
      1,
      '~15 KB',
      1,
      '~ms',
      'HSM → peer HSM',
      'One ML-KEM-768 encapsulation (1,088 B), the sealed seed and descriptor, a 3,309 B ML-DSA-65 signature and the certificate chain (~5.5 KB per ML-DSA-65 certificate). Estimated.'
    ),
    c(
      1,
      '~15 KB',
      1,
      '~ms',
      'HSM → backup HSM',
      'The same package shape, sealed to the backup HSM’s recovery key and stored offline. Estimated.'
    ),
  ],
  'tfhe-single-hsm': [
    c(
      1,
      '~KB',
      1,
      '~ms',
      'HSM',
      'Seed plus two binary secrets (918 + 2,048 bits; ~24 KB as stored). An ordinary HSM-sized object.'
    ),
    c(
      3,
      '~30 MB out',
      3,
      'seconds',
      'HSM',
      'About 1,800 GLWE and 8,200 LWE encryptions at N = 2,048. Seconds on an HSM-class CPU (est.), returned in one size-checked export.'
    ),
    c(
      3,
      '~30 MB',
      1,
      '~ms',
      'HSM → cloud',
      'Compressed server key, about 30 MB (≈130 MB once the cloud expands it), plus one signature.'
    ),
    c(1, '~10s of KB', 1, '~ms', 'HSM → client', 'Compact public key plus signature.'),
    c(
      1,
      '~KB / value',
      1,
      '~ms',
      'client CPU',
      'Compact public-key encryption, a few KB per value. The cloud expands each 64-bit value to ~0.5 MB of blocks (32 blocks × 2,049 × 8 B).'
    ),
    c(
      3,
      '~130 MB keys',
      3,
      'ms–s / op',
      'cloud CPU/GPU',
      'One programmable bootstrap is milliseconds on a CPU core. A 64-bit add takes tens of ms and a multiply hundreds of ms; GPUs are much faster.'
    ),
    c(1, '≤ 100s KB', 0, '—', 'network', 'A few LWE ciphertexts.'),
    c(1, '≤ 100s KB', 1, 'µs', 'HSM', 'One dot product of 2,048 terms per block, then rounding.'),
    c(1, '≤ KB', 0, '—', 'network', 'A small plaintext result.'),
    c(
      1,
      '~15 KB',
      1,
      '~ms',
      'HSM → peer HSM',
      'One ML-KEM-768 encapsulation (1,088 B), the sealed seed and descriptor, a 3,309 B ML-DSA-65 signature and the certificate chain (~5.5 KB per ML-DSA-65 certificate). Estimated.'
    ),
    c(
      1,
      '~15 KB',
      1,
      '~ms',
      'HSM → backup HSM',
      'The same package shape, sealed to the backup HSM’s recovery key and stored offline. Estimated.'
    ),
  ],
  'openfhe-threshold': [
    c(1, '~KB state', 1, '~ms', 'Party A HSM', 'One key pair; the share s₁ is a small polynomial.'),
    c(2, '~MB', 2, '10s of ms', 'Party B HSM', 'Receives and returns a public key of a few MB.'),
    c(2, '~MB', 2, '10s of ms', 'Party C HSM', 'Same as Party B.'),
    c(
      3,
      '~100 MB/rnd',
      3,
      'seconds',
      'all three HSMs',
      'Each round exchanges key-switching material of roughly relinearization-key size (estimate).'
    ),
    c(
      3,
      '~100s MB',
      3,
      'seconds',
      'HSMs → cloud',
      'Summation keys add one key-switching key per rotation used by EvalSum (estimate).'
    ),
    c(2, '~MB / ct', 2, '10s of ms', 'client CPU', 'Ordinary BFV encryption.'),
    c(
      3,
      '~100s MB',
      3,
      'ms–s',
      'cloud CPU',
      'Leveled evaluation, no bootstrapping in the baseline example.'
    ),
    c(2, '~MB × 3', 0, '—', 'network', 'The result ciphertext goes to every party.'),
    c(2, '~MB', 1, '~ms', 'Party A HSM', 'One partial decryption, the cost of a decryption.'),
    c(2, '~MB', 1, '~ms', 'Party B HSM', 'Same.'),
    c(2, '~MB', 1, '~ms', 'Party C HSM', 'Same.'),
    c(1, '≤ KB out', 1, '~ms', 'client', 'Adds the partials and decodes.'),
  ],
  'lattigo-threshold': [
    c(1, '~KB–MB', 1, '~ms', '3 HSMs', 'Shamir shares of a small secret polynomial, one per peer.'),
    c(2, '~MB/party', 2, '10s of ms', 'HSMs → aggregator', 'One public-key-sized share per party.'),
    c(
      3,
      '~100 MB ea.',
      3,
      'seconds',
      'HSMs → aggregator',
      'Two rounds of relinearization-key-sized shares (estimate).'
    ),
    c(
      3,
      '~100 MB/key',
      3,
      'seconds',
      'HSMs → aggregator',
      'Each party sends a full-size share for every Galois key the application needs; no bootstrapping keys (estimate).'
    ),
    c(2, '~MB / ct', 2, '10s of ms', 'client CPU', 'Ordinary BGV encryption.'),
    c(3, '~100s MB', 3, 'ms–s', 'cloud CPU', 'Leveled evaluation until the levels run out.'),
    c(
      2,
      '~MB/party',
      2,
      '10s of ms',
      'Party A, B HSMs',
      'One ciphertext-sized refresh share per active party.'
    ),
    c(2, '~MB', 1, '~ms', 'aggregator', 'Adds the shares and re-encodes at full level.'),
    c(
      2,
      '~MB/party',
      2,
      '10s of ms',
      'Party A, B HSMs',
      'One ciphertext-sized key-switch share per active party.'
    ),
    c(2, '~MB', 0, '—', 'network', 'One ciphertext under the data owner’s key.'),
    c(1, '≤ KB out', 1, '~ms', 'client', 'Ordinary decryption.'),
  ],
  'tfhe-transciphering': [
    c(
      3,
      '~30 MB',
      3,
      'seconds',
      'HSM → server',
      'Same TFHE key material as TFHE single-HSM custody (estimate).'
    ),
    c(1, '32 B', 1, 'µs', 'client', 'A 128-bit key and a 128-bit IV.'),
    c(
      2,
      '~MB, once',
      1,
      '~ms',
      'client → server',
      '16 FheUint8 ciphertexts, ~65 KB each expanded (~1 MB in total), smaller as a compact list (estimate).'
    ),
    c(
      2,
      '= data size',
      1,
      'µs–ms',
      'client → server',
      'Stream-cipher output is the same size as the data.'
    ),
    c(
      3,
      '~30 MB keys',
      3,
      '<300 ms/blk',
      'server CPU',
      'The paper reports under 300 ms per 64-bit block with TFHE-rs.'
    ),
    c(3, '~130 MB keys', 3, 'ms–s / op', 'server CPU/GPU', 'Ordinary TFHE-rs integer operations.'),
    c(1, '≤ 100s KB', 0, '—', 'network', 'A few FheUint64 ciphertexts.'),
    c(1, '≤ 100s KB', 1, 'µs', 'HSM', 'One dot product per block, then rounding.'),
    c(1, '≤ KB', 0, '—', 'network', 'A small plaintext result.'),
  ],
  'hsm-compute-limits': [
    c(1, '32 B seed', 1, '~ms', 'HSM', 'Fits easily: kilobytes of state and milliseconds of work.'),
    c(
      4,
      '~GB out',
      4,
      'too slow',
      'HSM (rejected)',
      'A CKKS bootstrapping key set is GBs. An HSM cannot hold, compute or export that volume in practice. A TFHE server key (~30 MB) is the HSM-sized alternative.'
    ),
    c(
      4,
      '~GB needed',
      4,
      'too slow',
      'HSM (rejected)',
      'Bootstrapping needs GBs of keys resident in memory and GPU-class arithmetic. An HSM would take orders of magnitude longer, if it fit at all.'
    ),
    c(
      4,
      '~GB keys',
      3,
      '~40–330 ms',
      'GPU / FPGA',
      'On a GPU a CKKS bootstrap at N = 2¹⁶ takes ~40–330 ms in published results, and cheaper operations take milliseconds.'
    ),
    c(2, '~1 MB', 0, '—', 'network', 'One small result ciphertext.'),
    c(1, '~1 MB in', 1, '~ms', 'HSM', 'Fits: one ring multiplication on about 1 MB of input.'),
    c(1, '≤ KB', 0, '—', 'network', 'A small plaintext result.'),
  ],
}

// ── Key sizes, in units of one RSA-2048 key pair ──────────────────────────
//
// Reference unit: an RSA-2048 key pair as usually stored = 294 B DER
// SubjectPublicKeyInfo + ~1,218 B PKCS#8 private key (CRT form; the exact
// length varies by a few bytes) ≈ 1,512 B. FHE rows are estimates at the same
// CKKS N = 2^16 parameter set as above; TFHE rows are computed from TFHE-rs-
// style defaults (TFHE-rs 1.8.1: LWE n = 918, GLWE N = 2,048, k = 1, PBS level 1, KS level 4)
// and should be measured before quoting. AES / ML-KEM / ML-DSA rows are exact.

export type KeyId =
  | 'rsa2048'
  | 'kreyvium-key'
  | 'fhe-seed'
  | 'hpke-kem'
  | 'mldsa65'
  | 'fhe-sk'
  | 'fhe-pk'
  | 'relin'
  | 'rotation'
  | 'eval-set'
  | 'tfhe-client'
  | 'tfhe-cpk'
  | 'tfhe-server'

export interface KeySize {
  id: KeyId
  label: string
  bytes: number
  /** Human-readable size, e.g. "~100 MB". */
  size: string
  exact: boolean
  secret: boolean
  note: string
}

export const RSA2048_PAIR_BYTES = 1512

export const KEY_SIZES: KeySize[] = [
  {
    id: 'fhe-seed',
    label: 'FHE seed (what the HSM stores)',
    bytes: 32,
    size: '32 B',
    exact: true,
    secret: true,
    note: 'The whole FHE secret, regenerable from this seed.',
  },
  {
    id: 'kreyvium-key',
    label: 'Kreyvium key (transciphering)',
    bytes: 16,
    size: '16 B',
    exact: true,
    secret: true,
    note: '128-bit stream-cipher key on the data owner’s device.',
  },
  {
    id: 'rsa2048',
    label: 'RSA-2048 key pair (reference)',
    bytes: RSA2048_PAIR_BYTES,
    size: '~1.5 KB',
    exact: false,
    secret: true,
    note: '294 B public key + ~1,218 B PKCS#8 private key (DER sizes vary by a few bytes).',
  },
  {
    id: 'hpke-kem',
    label: 'Recipient key pair (FIPS 203 ML-KEM-768), peer / backup HSM',
    bytes: 1184 + 64,
    size: '1.2 KB',
    exact: true,
    secret: true,
    note: '1,184 B public key (in the recipient function certificate) + 64 B private key stored as the KEM seed (the expanded FIPS 203 decapsulation key is 2,400 B).',
  },
  {
    id: 'mldsa65',
    label: 'ML-DSA-65 key pair (signs eval keys)',
    bytes: 1952 + 4032,
    size: '5.8 KB',
    exact: true,
    secret: true,
    note: 'FIPS 204: 1,952 B public key + 4,032 B private key.',
  },
  {
    id: 'fhe-sk',
    label: 'FHE secret key, packed',
    bytes: 16_384,
    size: '~16 KB',
    exact: false,
    secret: true,
    note: '65,536 ternary coefficients at 2 bits each. Expanded in memory (NTT/RNS form) it is tens of MB.',
  },
  {
    id: 'tfhe-client',
    label: 'TFHE client (secret) key',
    bytes: 24_000,
    size: '~3 KB',
    exact: false,
    secret: true,
    note: '918-bit LWE key + 2,048-bit GLWE key: ~371 B of key bits; TFHE-rs stores them as 64-bit words, ~24 KB. Regenerable from the seed.',
  },
  {
    id: 'tfhe-cpk',
    label: 'TFHE compact public key',
    bytes: 32_000,
    size: '~16–32 KB',
    exact: false,
    secret: false,
    note: 'Lets clients encrypt compactly without the secret.',
  },
  {
    id: 'tfhe-server',
    label: 'TFHE server key (compressed)',
    bytes: 30_000_000,
    size: '~30 MB',
    exact: false,
    secret: false,
    note: 'Bootstrapping key + key-switching key with seeded compression. About 130 MB once expanded by the cloud. Estimated for the TFHE-rs 1.8.1 default (n = 918, N = 2,048, k = 1).',
  },
  {
    id: 'fhe-pk',
    label: 'FHE public key',
    bytes: 15_000_000,
    size: '~15 MB',
    exact: false,
    secret: false,
    note: 'Two ring elements across the full modulus chain (one can be a seed).',
  },
  {
    id: 'relin',
    label: 'Relinearization key',
    bytes: 100_000_000,
    size: '~100 MB',
    exact: false,
    secret: false,
    note: 'One key-switching key: s² → s.',
  },
  {
    id: 'rotation',
    label: 'One rotation key',
    bytes: 100_000_000,
    size: '~100 MB',
    exact: false,
    secret: false,
    note: 'One per allowed rotation step; bootstrapping needs dozens.',
  },
  {
    id: 'eval-set',
    label: 'Bootstrappable evaluation-key set',
    bytes: 3_000_000_000,
    size: '~1.5–5 GB seeded (3–10 GB raw)',
    exact: false,
    secret: false,
    note: 'Relinearization + conjugation + ~25–50 rotation keys at ~50–90 MB seeded (100–180 MB raw) each. Computed for N = 2^16, ~30 RNS limbs, dnum 3–6; measure before quoting.',
  },
]

/** Keys each step generates, moves or uses — aligned with each flow's `steps`. */
export const FHE_STEP_KEYS: Record<FheFlowId, KeyId[][]> = {
  'single-hsm': [
    ['fhe-seed', 'fhe-sk'],
    ['eval-set', 'relin', 'rotation', 'mldsa65'],
    ['fhe-pk', 'mldsa65'],
    ['fhe-pk'],
    ['eval-set'],
    [],
    ['fhe-sk'],
    [],
    ['fhe-seed', 'hpke-kem', 'mldsa65'],
    ['fhe-seed', 'hpke-kem', 'mldsa65'],
  ],
  'tfhe-single-hsm': [
    ['fhe-seed', 'tfhe-client'],
    ['tfhe-server'],
    ['tfhe-server', 'mldsa65'],
    ['tfhe-cpk', 'mldsa65'],
    ['tfhe-cpk'],
    ['tfhe-server'],
    [],
    ['tfhe-client'],
    [],
    ['fhe-seed', 'hpke-kem', 'mldsa65'],
    ['fhe-seed', 'hpke-kem', 'mldsa65'],
  ],
  'openfhe-threshold': [
    ['fhe-sk'],
    ['fhe-pk', 'fhe-sk'],
    ['fhe-pk', 'fhe-sk'],
    ['relin'],
    ['rotation', 'mldsa65'],
    ['fhe-pk'],
    ['relin', 'rotation'],
    [],
    ['fhe-sk'],
    ['fhe-sk'],
    ['fhe-sk'],
    [],
  ],
  'lattigo-threshold': [
    ['fhe-sk'],
    ['fhe-pk'],
    ['relin'],
    ['rotation'],
    ['fhe-pk'],
    ['relin', 'rotation'],
    ['fhe-sk'],
    [],
    ['fhe-sk'],
    [],
    [],
  ],
  'tfhe-transciphering': [
    ['tfhe-server', 'mldsa65'],
    ['kreyvium-key'],
    ['kreyvium-key', 'tfhe-cpk'],
    ['kreyvium-key'],
    ['tfhe-server'],
    ['tfhe-server'],
    [],
    ['tfhe-client'],
    [],
  ],
  'hsm-compute-limits': [
    ['fhe-seed', 'fhe-sk'],
    ['eval-set', 'mldsa65'],
    ['eval-set'],
    ['eval-set'],
    [],
    ['fhe-sk'],
    [],
  ],
}
