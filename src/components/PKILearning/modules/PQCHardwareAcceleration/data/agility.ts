// SPDX-License-Identifier: GPL-3.0-only
/**
 * Crypto agility × acceleration: which primitive each algorithm spends its time
 * in, and which accelerator therefore helps it. Primitive usage follows the
 * standards (FIPS 202/203/204/205; FN-DSA per the FIPS 206 draft, marked
 * draft). The "ours" notes point at PQC Today's own engine decisions and
 * measurements (data/measurements.ts, data/armWork.ts).
 */

export type PrimitiveId = 'keccak' | 'ntt' | 'sha2' | 'bignum' | 'aes' | 'fft'

export interface Primitive {
  id: PrimitiveId
  label: string
  accelerators: string
}

export const PRIMITIVES: Primitive[] = [
  {
    id: 'keccak',
    label: 'Keccak (SHA-3 / SHAKE)',
    accelerators:
      'Armv8.2 SHA-3 instructions (M4-class cores); SIMD running several states side by side; FPGA/ASIC Keccak cores',
  },
  {
    id: 'ntt',
    label: 'NTT polynomial arithmetic',
    accelerators: 'SIMD (NEON/AVX2/AVX-512); GPU for batches; FPGA/ASIC butterfly pipelines',
  },
  {
    id: 'sha2',
    label: 'SHA-256 / SHA-512',
    accelerators: 'Armv8 SHA-256/SHA-512 instructions, x86 SHA-NI (SHA-256); FPGA/ASIC SHA-2 cores',
  },
  {
    id: 'bignum',
    label: 'Big-number (Montgomery) arithmetic',
    accelerators:
      'Multiply instructions, AVX-512 IFMA; hand-tuned kernels (e.g. AWS-LC); crypto co-processors',
  },
  {
    id: 'aes',
    label: 'AES',
    accelerators: 'Armv8 AES instructions, x86 AES-NI/VAES',
  },
  {
    id: 'fft',
    label: 'Floating-point FFT',
    accelerators: 'CPU floating-point/SIMD units — hard to do in constant time; rarely offloaded',
  },
]

export interface AlgorithmUse {
  algorithm: string
  kind: 'PQC signature' | 'PQC KEM' | 'Classical' | 'Symmetric'
  uses: PrimitiveId[]
  /** the primitive that dominates its run time */
  hotspot: PrimitiveId
  note: string
}

export const ALGORITHM_USES: AlgorithmUse[] = [
  {
    algorithm: 'ML-KEM (FIPS 203)',
    kind: 'PQC KEM',
    uses: ['ntt', 'keccak'],
    hotspot: 'keccak',
    note: 'NTT over q = 3,329 (7 layers); SHAKE128 grows the public matrix, SHA3-256/512 and SHAKE256 hash the rest.',
  },
  {
    algorithm: 'ML-DSA (FIPS 204)',
    kind: 'PQC signature',
    uses: ['ntt', 'keccak'],
    hotspot: 'keccak',
    note: 'NTT over q = 8,380,417 (8 layers); SHAKE128/256 for matrix expansion, sampling and hashing, inside a retry loop.',
  },
  {
    algorithm: 'SLH-DSA-SHAKE (FIPS 205)',
    kind: 'PQC signature',
    uses: ['keccak'],
    hotspot: 'keccak',
    note: 'SHAKE256 for every hash — about two million Keccak permutations per 128s signature.',
  },
  {
    algorithm: 'SLH-DSA-SHA2 (FIPS 205)',
    kind: 'PQC signature',
    uses: ['sha2'],
    hotspot: 'sha2',
    note: 'SHA-256 at category 1; SHA-512 for some functions at categories 3 and 5.',
  },
  {
    algorithm: 'FN-DSA (FIPS 206, draft)',
    kind: 'PQC signature',
    uses: ['fft', 'keccak'],
    hotspot: 'fft',
    note: 'Floating-point FFT sampling for signing (hard to accelerate safely) plus SHAKE256 hashing.',
  },
  {
    algorithm: 'RSA / ECDSA / ECDH',
    kind: 'Classical',
    uses: ['bignum', 'sha2'],
    hotspot: 'bignum',
    note: 'Still in every hybrid deployment during migration.',
  },
  {
    algorithm: 'AES-GCM, SHA-2 hashing',
    kind: 'Symmetric',
    uses: ['aes', 'sha2'],
    hotspot: 'aes',
    note: 'Carries the traffic once a PQC key exchange has run.',
  },
]

/** Strategies for keeping acceleration agile, each tied to our own evidence where we have it. */
export interface AgilityStrategy {
  title: string
  plain: string
  ours: string
}

export const AGILITY_STRATEGIES: AgilityStrategy[] = [
  {
    title: 'Accelerate shared building blocks, not whole algorithms',
    plain:
      'One Keccak engine serves ML-KEM, ML-DSA and SLH-DSA-SHAKE; one NTT engine serves both lattice schemes. A new algorithm built from the same blocks gets faster for free.',
    ours: 'Our first plan did exactly this — but a per-hash Keccak engine lost to the CPU (1,481 µs fixed cost per call). Building blocks only pay off when each call carries a lot of work.',
  },
  {
    title: 'Offload whole operations only where the win is decisive',
    plain:
      'A whole-signature engine avoids the round trip and can be many times faster — but it only knows one algorithm and a few parameter sets.',
    ours: 'Our SLH-DSA engine signs the SHAKE “s” sets 26–31× faster on the same board, and does nothing for the SHA-2 or “f” sets.',
  },
  {
    title: 'Always keep a software path for every algorithm',
    plain:
      'Hardware is an optimisation, never the only implementation: if the accelerator is missing, busy or does not know the parameter set, the CPU does the work.',
    ours: 'Our engine falls back to ARM when the FPGA is busy or absent, and verification always stays on ARM. Every accelerated result is checked against the software path.',
  },
  {
    title: 'Route by configuration, not by code change',
    plain:
      'A routing table decides which algorithm goes to which accelerator, so a new standard or a broken parameter set is a configuration change.',
    ours: 'Our engine prints its routing at start-up, e.g. “shake=Fpga sha2=Cpu”, and can be told to ignore the hardware entirely (a switch we use for on/off measurements).',
  },
  {
    title: 'Reprogram the hardware when the workload changes',
    plain:
      'An FPGA can swap whole images (profiles) or single slots (partial reconfiguration). An ASIC cannot — which is why ASIC PQC engines fix their parameter sets up front.',
    ours: 'We swap ML-DSA and SLH-DSA profiles live on the KV260; Caliptra’s Adams Bridge ASIC supports ML-DSA-87 and ML-KEM-1024 only.',
  },
  {
    title: 'Prefer general instructions over fixed engines on the CPU',
    plain:
      'A SHA-3 or SIMD instruction helps every algorithm that uses the primitive, now and later — the most agile acceleration there is.',
    ours: 'NEON code gave ML-DSA ~4×; SHA-3 instructions gave SHAKE ~20% — for every SHAKE user at once.',
  },
]

/** Why dynamic loading is needed at all: the two profiles do not fit together. */
export const CAPACITY_LIMIT = {
  deviceLuts: 117_120,
  deviceBram: 144,
  profiles: [
    { name: 'ML-DSA profile (2 signers + monitor)', luts: 94_630, bram: 137 },
    {
      name: 'SLH-DSA profile (4 Keccak lanes + monitor)',
      luts: 64_600,
      bram: null as number | null,
    },
  ],
  plain:
    'An FPGA has a fixed amount of logic and memory. Our ML-DSA image alone uses 81% of the KV260’s logic and 95% of its on-chip memory; the SLH-DSA image uses 55% of the logic. Together they would need roughly 159k LUTs on a 117k-LUT chip — so they cannot be loaded at the same time. Every extra algorithm you want in hardware makes this worse, which is what forces a loading model: swap whole images (profiles), swap slots (partial reconfiguration), or keep only small shared building blocks resident.',
}
