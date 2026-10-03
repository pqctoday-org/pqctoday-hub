// SPDX-License-Identifier: GPL-3.0-only

// ── Per-step data volume and compute cost for the FHE + HSM flows ─────────
//
// FHE figures are ORDER-OF-MAGNITUDE ESTIMATES unless marked measured (OpenFHE and Lattigo
// threshold, TFHE: see MEASURED_BASIS). The other RLWE flows (CKKS) assume ring dimension N = 2^16 (~30 RNS limbs;
// CKKS with bootstrappable parameters, 32,768 slots per ciphertext); the TFHE
// flows assume the TFHE-rs 1.8.1 default parameters (n = 918, N = 2,048, k = 1, KS level 4) in the
// custody configuration (dedicated OPRF key off). TFHE sizes and M4 Pro timings are measured
// (pqctoday-fhe reference-runs/tfhe-custody and kv260-tfhe-bench, published). All on a recent multicore CPU or
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
    'TFHE with LWE n = 918, GLWE N = 2,048, k = 1 (TFHE-rs 1.8.1 default parameters, custody configuration with the dedicated OPRF key off)',
  'openfhe-threshold':
    'BFV at n = 16,384, log2 q = 300 with noise flooding (OpenFHE threshold example)',
  'lattigo-threshold':
    'BGV at N = 16,384 (LogN 14), LogQP 438, T = 65537 with noise flooding, refreshed interactively (Lattigo threshold reference run)',
  'hsm-compute-limits': 'CKKS at ring dimension N = 2¹⁶ with bootstrappable parameters',
  'tfhe-transciphering':
    'TFHE with LWE n = 918, GLWE N = 2,048, k = 1 (TFHE-rs 1.8.1 default parameters, custody configuration with the dedicated OPRF key off)',
}

/** Flows whose sizes are measured rather than estimated: the note shown under the diagram. */
export const MEASURED_BASIS: Partial<Record<FheFlowId, string>> = {
  'openfhe-threshold':
    'Data and key sizes and timings in this scenario are measured: OpenFHE v1.6.0, BFV at n = 16,384, log2 q = 300 with noise flooding, 3 parties in one process on an Apple M4 Pro (pqctoday-fhe de1d2b8d) and again on a KV260’s Cortex-A53 (pqctoday-fhe adab554, peak RAM about 384 MiB with every party on the one board); files linked from the step evidence. Without noise flooding the 5-party example runs at n = 8,192. Other key sizes in the panel are estimates.',
  'lattigo-threshold':
    'Data and key sizes and timings in this scenario are measured: Lattigo v6.2.0 t-of-N threshold BGV at N = 16,384, LogQP 438 with noise flooding, 2-of-3 with every party in one process on a KV260’s Cortex-A53 (pqctoday-fhe 2819ebf, peak RAM about 122 MiB); the M4 Pro timings are from the same spike’s reference run, quoted in the published result. Files linked from the step evidence.',
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
    c(2, 'ciphertext', 0, '—', 'network', 'Ciphertexts only; the same bytes that were encrypted.'),
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
      'About 1,800 GLWE and 8,200 LWE encryptions at N = 2,048. Measured 195 ms on an Apple M4 Pro. On the MX95 custodian board (Cortex-A55) the whole export, with the compressed server key, the compact public key and two ML-DSA-65 signatures, took about 5 s (measured). Returned in one size-checked export.'
    ),
    c(
      3,
      '~30 MB',
      1,
      '~ms',
      'HSM → cloud',
      'Compressed server key: 30.1 MB measured in the custody configuration (the library default adds a 28.7 MB OPRF key, 57.4 MB in total); 120 MB once the cloud expands it (measured), plus one signature.'
    ),
    c(
      1,
      '33 KB',
      1,
      '~ms',
      'HSM → client',
      'Compact public key: 33 KB measured, plus a signature.'
    ),
    c(
      1,
      '~KB / value',
      1,
      '~ms',
      'client CPU',
      'Compact public-key encryption, a few KB per value. The cloud expands each 64-bit value to ~0.5 MB of blocks (32 blocks × 2,049 × 8 B).'
    ),
    c(1, 'ciphertext', 0, '—', 'network', 'Ciphertexts only; the same bytes that were encrypted.'),
    c(
      3,
      '~0.1 GB keys',
      3,
      '0.2s–3.5 min',
      'cloud CPU/GPU',
      'Measured: a 64-bit add took 0.19 s and a multiply 2.6 s on an Apple M4 Pro (14 cores), and 12.7 s and 211 s on a KV260 (4× Cortex-A53, peak RAM 203 MB). Smaller integers are much cheaper on the KV260: a 16-bit add 2.6 s and multiply 14.7 s, an 8-bit add 1.35 s and multiply 4.1 s. GPUs are much faster.'
    ),
    c(1, '≤ 100s KB', 0, '—', 'network', 'A few LWE ciphertexts.'),
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
    c(
      2,
      '656 KB share',
      1,
      '~ms',
      'Party A HSM',
      'Party A’s secret-key share serializes to 656 KB (measured, OpenFHE v1.6.0, n = 16,384).'
    ),
    c(
      2,
      '1.31 MB pk',
      1,
      '~ms',
      'Party B HSM',
      'Receives and returns the joint public key: 1.31 MB. The whole 3-party public-key chain took 9 ms on an M4 Pro and 131 ms on a KV260 Cortex-A53 (measured).'
    ),
    c(2, '1.31 MB pk', 1, '~ms', 'Party C HSM', 'Same as Party B.'),
    c(
      2,
      '6.56 MB',
      2,
      '10s of ms',
      'all three HSMs',
      'The joint relinearization key is 6.56 MB; building it across 3 parties took 59 ms on an M4 Pro and 0.78 s on a Cortex-A53 (measured).'
    ),
    c(
      3,
      '78.7 MB',
      2,
      '10s of ms',
      'HSMs → cloud',
      'The joint EvalSum keys are 78.7 MB, generated in 47 ms on an M4 Pro and 1.09 s on a Cortex-A53 for 3 parties, plus the 6.56 MB relinearization key (measured).'
    ),
    c(
      2,
      '1.31 MB / ct',
      1,
      '~ms',
      'client CPU',
      'One fresh BFV ciphertext is 1.31 MB; encryption took 8 ms on an M4 Pro and 0.15 s on a Cortex-A53 (measured).'
    ),
    c(2, 'ciphertext', 0, '—', 'network', 'Ciphertexts only; the same bytes that were encrypted.'),
    c(
      3,
      '~85 MB keys',
      2,
      '10s of ms',
      'cloud CPU',
      'Leveled evaluation with the joint keys: one multiplication took 18 ms and an addition 0.1 ms on an M4 Pro; 0.27 s and 10 ms on a Cortex-A53 (measured).'
    ),
    c(2, '1.31 MB', 0, '—', 'network', 'The encrypted result returns to the data owner.'),
    c(
      2,
      '1.31 MB × 3',
      0,
      '—',
      'network',
      'The data owner sends the result ciphertext to every party.'
    ),
    c(
      2,
      '657 KB',
      1,
      '~ms',
      'Party A HSM',
      'One partial decryption share is 657 KB; the three took 9 ms together on an M4 Pro and 60 ms on a Cortex-A53 (measured).'
    ),
    c(2, '657 KB', 1, '~ms', 'Party B HSM', 'Same.'),
    c(2, '657 KB', 1, '~ms', 'Party C HSM', 'Same.'),
    c(1, '≤ KB out', 1, '~ms', 'client', 'Adds the partials and decodes.'),
  ],
  'lattigo-threshold': [
    c(
      2,
      '1.05 MB/peer',
      1,
      '~ms',
      '3 HSMs',
      'Shamir re-sharing of the secret: one 1.05 MB share per peer, 6.2 ms on an M4 Pro and 139 ms on a Cortex-A53 (measured).'
    ),
    c(
      2,
      '~1 MB/party',
      1,
      '~ms',
      'HSMs → aggregator',
      'One 1.05 MB public-key share per party; the joint public key is 2.10 MB. 7.0 ms on an M4 Pro, 201 ms on a Cortex-A53 (measured).'
    ),
    c(
      2,
      '6.3+3.1 MB',
      2,
      '10s of ms',
      'HSMs → aggregator',
      'Two rounds of relinearization shares per party, 6.29 MB then 3.15 MB; the joint key is 6.29 MB. 44 ms on an M4 Pro, 1.4 s on a Cortex-A53 (measured).'
    ),
    c(
      2,
      '3.1 MB/key',
      2,
      '10s of ms',
      'HSMs → aggregator',
      'Each party sends a 3.15 MB share for every Galois key (one per rotation the application needs); the joint key is 6.29 MB per rotation. 21 ms on an M4 Pro, 0.59 s on a Cortex-A53 (measured). No bootstrapping keys.'
    ),
    c(
      2,
      '1.57 MB / ct',
      1,
      '~ms',
      'client CPU',
      'Ordinary BGV encryption; a fresh ciphertext is 1.57 MB. 4.8 ms on an M4 Pro, 0.17 s on a Cortex-A53 (measured).'
    ),
    c(2, 'ciphertext', 0, '—', 'network', 'Ciphertexts only; the same bytes that were encrypted.'),
    c(
      2,
      '~10s MB keys',
      1,
      '~ms',
      'cloud CPU',
      'Leveled evaluation until the levels run out, with the 6.29 MB joint relinearization key and one 6.29 MB Galois key per rotation. Add 0.1 ms, multiply 5.2 ms and rotate 4.6 ms on an M4 Pro; 2.1 ms, 0.19 s and 0.18 s on a Cortex-A53 (measured).'
    ),
    c(
      2,
      '~1 MB/party',
      2,
      '10s of ms',
      'Party A, B HSMs',
      'One 1.05 MB refresh share per active party; the whole refresh took 0.25 s on a Cortex-A53 (measured, 2-of-3).'
    ),
    c(
      2,
      '~MB',
      1,
      '~ms',
      'aggregator',
      'Adds the shares and re-encodes at full level (level 1 back to 5 in the measured run).'
    ),
    c(
      2,
      '1.6 MB/party',
      2,
      '10s of ms',
      'Party A, B HSMs',
      'One 1.57 MB key-switch share per active party. The threshold decryption, switching to the data owner’s key, took 9.8 ms on an M4 Pro and 0.35 s on a Cortex-A53 (measured).'
    ),
    c(2, '1.57 MB', 0, '—', 'network', 'One 1.57 MB ciphertext under the data owner’s key.'),
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
      '16 FheUint8 ciphertexts, 66,101 B each expanded (measured; ~1 MB in total), smaller as a compact list.'
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
      'The WAHC 2023 paper (Balenbois, Orfila, Smart; IACR ePrint 2023/980) reports under 300 ms per 64-bit block with TFHE-rs.'
    ),
    c(
      3,
      '~0.1 GB keys',
      3,
      '~s / op',
      'server CPU/GPU',
      'Ordinary TFHE-rs integer operations: on an Apple M4 Pro a 64-bit add took 0.19 s and a multiply 2.6 s; on a KV260 (Cortex-A53) 12.7 s and 211 s, and for 8-bit values 1.35 s and 4.1 s (measured).'
    ),
    c(1, '≤ 100s KB', 0, '—', 'network', 'A few FheUint64 ciphertexts.'),
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
  | 'bfv16k-share'
  | 'bfv16k-pk'
  | 'bfv16k-relin'
  | 'bfv16k-evalsum'
  | 'bgv14k-share'
  | 'bgv14k-pk'
  | 'bgv14k-relin'
  | 'bgv14k-galois'

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
    id: 'bfv16k-share',
    label: 'BFV secret-key share (one party, n = 16,384)',
    bytes: 656_356,
    size: '656 KB (measured)',
    exact: true,
    secret: true,
    note: 'Measured 2026-10-03 with OpenFHE v1.6.0 (BINARY serialization), BFV n = 16,384, log2 q = 300, noise flooding; pqctoday-fhe de1d2b8d reference run.',
  },
  {
    id: 'bfv16k-pk',
    label: 'BFV joint public key (n = 16,384)',
    bytes: 1_311_909,
    size: '1.31 MB (measured)',
    exact: true,
    secret: false,
    note: 'Measured 2026-10-03 with OpenFHE v1.6.0 (BINARY serialization), BFV n = 16,384, log2 q = 300, noise flooding; pqctoday-fhe de1d2b8d reference run.',
  },
  {
    id: 'bfv16k-relin',
    label: 'BFV joint relinearization key (n = 16,384)',
    bytes: 6_556_391,
    size: '6.56 MB (measured)',
    exact: true,
    secret: false,
    note: 'Measured 2026-10-03 with OpenFHE v1.6.0 (BINARY serialization), BFV n = 16,384, log2 q = 300, noise flooding; pqctoday-fhe de1d2b8d reference run.',
  },
  {
    id: 'bfv16k-evalsum',
    label: 'BFV joint EvalSum keys (n = 16,384)',
    bytes: 78_667_237,
    size: '78.7 MB (measured)',
    exact: true,
    secret: false,
    note: 'Measured 2026-10-03 with OpenFHE v1.6.0 (BINARY serialization), BFV n = 16,384, log2 q = 300, noise flooding; pqctoday-fhe de1d2b8d reference run.',
  },
  {
    id: 'bgv14k-share',
    label: 'BGV Shamir secret-key share (one party, N = 16,384)',
    bytes: 1_048_656,
    size: '1.05 MB (measured)',
    exact: true,
    secret: true,
    note: 'Measured 2026-10-03 with Lattigo v6.2.0, BGV N = 16,384, LogQP 438, T = 65537, noise flooding; pqctoday-fhe 2819ebf KV260 reference run (2-of-3).',
  },
  {
    id: 'bgv14k-pk',
    label: 'BGV joint public key (N = 16,384)',
    bytes: 2_097_320,
    size: '2.10 MB (measured)',
    exact: true,
    secret: false,
    note: 'Measured 2026-10-03 with Lattigo v6.2.0, BGV N = 16,384, LogQP 438, T = 65537, noise flooding; pqctoday-fhe 2819ebf KV260 reference run (2-of-3).',
  },
  {
    id: 'bgv14k-relin',
    label: 'BGV joint relinearization key (N = 16,384)',
    bytes: 6_292_000,
    size: '6.29 MB (measured)',
    exact: true,
    secret: false,
    note: 'Measured 2026-10-03 with Lattigo v6.2.0, BGV N = 16,384, LogQP 438, T = 65537, noise flooding; pqctoday-fhe 2819ebf KV260 reference run (2-of-3).',
  },
  {
    id: 'bgv14k-galois',
    label: 'BGV joint Galois key, one rotation (N = 16,384)',
    bytes: 6_292_016,
    size: '6.29 MB (measured)',
    exact: true,
    secret: false,
    note: 'Measured 2026-10-03 with Lattigo v6.2.0, BGV N = 16,384, LogQP 438, T = 65537, noise flooding; pqctoday-fhe 2819ebf KV260 reference run (2-of-3).',
  },
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
    size: '~24 KB as stored',
    exact: false,
    secret: true,
    note: '918-bit LWE key + 2,048-bit GLWE key: ~371 B of key bits; TFHE-rs stores them as 64-bit words, ~24 KB. Regenerable from the seed.',
  },
  {
    id: 'tfhe-cpk',
    label: 'TFHE compact public key',
    bytes: 33_034,
    size: '33 KB (measured)',
    exact: false,
    secret: false,
    note: 'Lets clients encrypt compactly without the secret.',
  },
  {
    id: 'tfhe-server',
    label: 'TFHE server key (compressed)',
    bytes: 30_147_061,
    size: '30.1 MB (measured)',
    exact: false,
    secret: false,
    note: 'Bootstrapping key + key-switching key with seeded compression: 30,147,061 B measured (TFHE-rs 1.8.1 default parameters, custody configuration with the dedicated OPRF key off; the default configuration is 57.4 MB). 120.4 MB once expanded by the cloud (measured; loading and expanding it took 1.3 s on a KV260).',
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
    [],
    ['eval-set'],
    [],
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
    [],
    ['tfhe-server'],
    [],
    [],
    ['tfhe-client'],
    [],
    ['fhe-seed', 'hpke-kem', 'mldsa65'],
    ['fhe-seed', 'hpke-kem', 'mldsa65'],
  ],
  'openfhe-threshold': [
    ['bfv16k-share'],
    ['bfv16k-pk', 'bfv16k-share'],
    ['bfv16k-pk', 'bfv16k-share'],
    ['bfv16k-relin'],
    ['bfv16k-evalsum', 'mldsa65'],
    ['bfv16k-pk'],
    [],
    ['bfv16k-relin', 'bfv16k-evalsum'],
    [],
    [],
    ['bfv16k-share'],
    ['bfv16k-share'],
    ['bfv16k-share'],
    [],
  ],
  'lattigo-threshold': [
    ['bgv14k-share'],
    ['bgv14k-pk'],
    ['bgv14k-relin'],
    ['bgv14k-galois'],
    ['bgv14k-pk'],
    [],
    ['bgv14k-relin', 'bgv14k-galois'],
    ['bgv14k-share'],
    [],
    ['bgv14k-share'],
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
    [],
    ['fhe-sk'],
    [],
  ],
}
