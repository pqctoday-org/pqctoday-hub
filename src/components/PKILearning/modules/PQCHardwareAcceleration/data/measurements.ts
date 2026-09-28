// SPDX-License-Identifier: GPL-3.0-only
/**
 * PQC Today's OWN measurements, used as the evidence base for this module.
 *
 * Every figure here was measured by the PQC Today project on its own hardware:
 *   - Apple M4 Pro MacBook Pro (Mac16,7, 10P + 4E cores) — bench sidecar only.
 *   - FRDM-IMX95 appliance — 6x Arm Cortex-A55 @ 1.8 GHz (Yocto image).
 *   - AMD Kria KV260 appliance — 4x Arm Cortex-A53 + Zynq UltraScale+ FPGA fabric.
 *
 * Nothing in this file is a vendor or literature figure — cited, third-party
 * material lives in `cited.ts` and is rendered visually separate. Each dataset
 * names its run date and conditions so a reader can tell like from unlike;
 * do not mix rows from different datasets in one ratio.
 */

export type PlatformId = 'm4pro' | 'mx95' | 'kv260'

export interface Platform {
  id: PlatformId
  label: string
  core: string
  isa: string
  cores: number
  /** Crypto instructions the core reports */
  cryptoFeatures: string[]
  /** Crypto instructions the core does NOT have — the ones that matter for PQC */
  missing: string[]
  featureSource: string
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  m4pro: {
    id: 'm4pro',
    label: 'Apple M4 Pro',
    core: 'Apple M4 Pro (performance + efficiency cores)',
    isa: 'Armv9.2-A',
    cores: 14,
    cryptoFeatures: [
      'AES',
      'PMULL',
      'SHA-1',
      'SHA-256',
      'SHA-512',
      'SHA-3 (EOR3/RAX1/XAR/BCAX)',
      'SME2',
    ],
    missing: [],
    featureSource: 'sysctl hw.optional.arm.* on the machine, 2026-09-27',
  },
  mx95: {
    id: 'mx95',
    label: 'NXP i.MX 95 (FRDM)',
    core: 'Arm Cortex-A55 @ 1.8 GHz',
    isa: 'Armv8.2-A',
    cores: 6,
    cryptoFeatures: ['AES', 'PMULL', 'SHA-1', 'SHA-256'],
    missing: ['SHA-512', 'SHA-3'],
    featureSource:
      '/proc/cpuinfo on the board, 2026-09-15 (aes pmull sha1 sha2 — no sha3, no sha512)',
  },
  kv260: {
    id: 'kv260',
    label: 'AMD Kria KV260',
    core: 'Arm Cortex-A53 + FPGA fabric',
    isa: 'Armv8.0-A',
    cores: 4,
    cryptoFeatures: ['AES', 'PMULL', 'SHA-1', 'SHA-256'],
    missing: ['SHA-512', 'SHA-3'],
    featureSource:
      'Armv8.0 crypto extension; corroborated by the measured SHA-256 > SHA-512 throughput inversion (2026-09-26)',
  },
}

export const PLATFORM_ORDER: PlatformId[] = ['m4pro', 'mx95', 'kv260']

// ── Dataset 1: four-target PKCS#11 bench, 2026-09-24 ────────────────────────
// Scenario 39 (hsm-perf-bench), Rust engine softhsmrustv3, --threads 9 on every
// target => 4 concurrent workers per tenant; tenant 0 shown. Boards carried
// their full appliance service load; the M4 Pro ran only the bench sidecar.
// Engine as of 2026-09-24 — BEFORE the hash-signature CPU work that merged
// 2026-09-25, so SLH-DSA rows here are the old software path.

export const BENCH_0924_NOTE =
  'PQC Today bench, 2026-09-24: Rust PKCS#11 engine, 4 concurrent workers, sign operations per second. Boards ran their full appliance service load. The M4 Pro engine was built size-optimised (the boards’ at full optimisation), which understates the M4 Pro (measured on the same machine: RSA signing 1.10×, bulk AES 1.4–1.5×) — so its lead here is, if anything, larger in reality.'

export interface BenchRow {
  algorithm: string
  family: 'lattice' | 'hash' | 'classical'
  /** sign ops/s per platform */
  ops: Record<PlatformId, number>
}

export const SIGN_BENCH_0924: BenchRow[] = [
  { algorithm: 'ML-DSA-44', family: 'lattice', ops: { m4pro: 18109, mx95: 1285, kv260: 678 } },
  { algorithm: 'ML-DSA-65', family: 'lattice', ops: { m4pro: 11167, mx95: 814, kv260: 515 } },
  { algorithm: 'ML-DSA-87', family: 'lattice', ops: { m4pro: 9222, mx95: 676, kv260: 352 } },
  { algorithm: 'SLH-DSA-SHA2-128f', family: 'hash', ops: { m4pro: 75, mx95: 17, kv260: 9.98 } },
  { algorithm: 'SLH-DSA-SHAKE-128f', family: 'hash', ops: { m4pro: 92, mx95: 12, kv260: 7.48 } },
  { algorithm: 'SLH-DSA-SHA2-128s', family: 'hash', ops: { m4pro: 3.91, mx95: 0.76, kv260: 0.39 } },
  {
    algorithm: 'SLH-DSA-SHAKE-128s',
    family: 'hash',
    ops: { m4pro: 4.97, mx95: 0.57, kv260: 0.29 },
  },
  { algorithm: 'SLH-DSA-SHA2-256s', family: 'hash', ops: { m4pro: 2.58, mx95: 0.53, kv260: 0.26 } },
  { algorithm: 'SLH-DSA-SHAKE-256s', family: 'hash', ops: { m4pro: 3.1, mx95: 0.39, kv260: 0.2 } },
  { algorithm: 'Ed25519', family: 'classical', ops: { m4pro: 220263, mx95: 16053, kv260: 8335 } },
  { algorithm: 'ECDSA-P256', family: 'classical', ops: { m4pro: 20343, mx95: 2475, kv260: 1370 } },
  { algorithm: 'RSA-PSS-2048', family: 'classical', ops: { m4pro: 4450, mx95: 297, kv260: 156 } },
]

// ── Dataset 0: TODAY'S ENGINE on all platforms, 2026-09-27 (primary) ───────
// hsm 37de2892 everywhere; boards = Yocto opt-3 engines from the reflashed
// images (KV260 on its `hashsig` FPGA profile); M4 Pro = same commit built
// for linux-arm64 at opt-3, in its bench container (~18% background CPU).
// --threads 9 (4 workers), tenant 0. Source: sandbox-bench-results-09262026.md
// §"2026-09-27 today's engine: platform comparison" (antigravity-2f).
export const BENCH_0927_NOTE =
  'PQC Today bench, 2026-09-27: the same engine build (hsm 37de2892) on every platform, 4 concurrent workers, sign operations per second. The KV260 runs its SLH-DSA-SHAKE FPGA engine; everything else is CPU.'

export const SIGN_BENCH_0927: BenchRow[] = [
  { algorithm: 'ML-DSA-44', family: 'lattice', ops: { m4pro: 111845, mx95: 9060, kv260: 4899 } },
  { algorithm: 'ML-DSA-65', family: 'lattice', ops: { m4pro: 72776, mx95: 5800, kv260: 3268 } },
  { algorithm: 'ML-DSA-87', family: 'lattice', ops: { m4pro: 56529, mx95: 4201, kv260: 2365 } },
  { algorithm: 'SLH-DSA-SHA2-128f', family: 'hash', ops: { m4pro: 1979, mx95: 203, kv260: 103 } },
  { algorithm: 'SLH-DSA-SHAKE-128f', family: 'hash', ops: { m4pro: 286, mx95: 20.5, kv260: 10.4 } },
  { algorithm: 'SLH-DSA-SHA2-128s', family: 'hash', ops: { m4pro: 124, mx95: 10.87, kv260: 5.09 } },
  {
    algorithm: 'SLH-DSA-SHAKE-128s',
    family: 'hash',
    ops: { m4pro: 13.49, mx95: 0.94, kv260: 13.0 },
  },
  { algorithm: 'SLH-DSA-SHA2-256s', family: 'hash', ops: { m4pro: 68, mx95: 4.61, kv260: 2.29 } },
  {
    algorithm: 'SLH-DSA-SHAKE-256s',
    family: 'hash',
    ops: { m4pro: 9.61, mx95: 0.62, kv260: 8.06 },
  },
  { algorithm: 'Ed25519', family: 'classical', ops: { m4pro: 254981, mx95: 18607, kv260: 8702 } },
  { algorithm: 'ECDSA-P256', family: 'classical', ops: { m4pro: 26189, mx95: 3030, kv260: 1632 } },
  { algorithm: 'RSA-PSS-2048', family: 'classical', ops: { m4pro: 4637, mx95: 319, kv260: 169 } },
]

/** Rows where the KV260 figure comes from its FPGA fabric, not the A53 */
export const KV260_FPGA_ROWS = ['SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-192s', 'SLH-DSA-SHAKE-256s']

// ── Dataset 0b: SLH-DSA-SHAKE s-sets, KV260 FPGA vs CPUs, 2026-09-27 ───────
// Same source/settings as SIGN_BENCH_0927 (hsm 37de2892, --threads 9 = 4
// workers, tenant 0, 2 s windows, 0.5 s warm-up, --min-ops 20). On/off:
// same KV260, same image, default vs PQC_HW_DISABLE=1.
export const SLH_FPGA_0927 = {
  note: 'Measured by PQC Today, 2026-09-27, hsm 37de2892 on every platform: sign operations per second, 4 concurrent workers, 2 s measurement windows (0.5 s warm-up, at least 20 operations). KV260 on its hashsig FPGA profile (4 Keccak lanes, 240 MHz); i.MX 95 and M4 Pro on CPU.',
  rows: [
    {
      set: 'SLH-DSA-SHAKE-128s',
      kv260: 13.0,
      mx95: 0.94,
      m4pro: 13.49,
      onOff: '28.4× (13.00 vs 0.46)',
    },
    {
      set: 'SLH-DSA-SHAKE-192s',
      kv260: 8.06,
      mx95: 0.53,
      m4pro: 8.33,
      onOff: '30.6× (8.05 vs 0.26)',
    },
    {
      set: 'SLH-DSA-SHAKE-256s',
      kv260: 8.06,
      mx95: 0.62,
      m4pro: 9.61,
      onOff: '26.4× (8.05 vs 0.31)',
    },
  ],
}

// ── Dataset 1b: same bench, boards only, CURRENT engine, 2026-09-26 ─────────
// Same harness and flags as 09-24 (--threads 9 => 4 workers, tenant 0). The
// engine now includes the 2026-09-25 update: native ML-DSA on AWS-LC's
// hand-written AArch64 NEON code, SLH-DSA CPU work (SHA-256 midstate reuse,
// multi-core signing) and the KV260 hashsig FPGA driver — the KV260 ran its
// `hashsig` bitstream, so its SLH-DSA-SHAKE rows use the fabric while its
// ML-DSA rows are pure ARM software. No Mac leg in this run.
// Cross-run noise: Ed25519, untouched by the update, moved +16% on the MX95
// between the two runs — read small differences as noise, not the 5–45× ones.

export const BENCH_0926_NOTE =
  'PQC Today bench, 2026-09-26: same harness and settings as 09-24, current engine (ML-DSA on NEON assembly, SLH-DSA CPU work, KV260 FPGA hash engine loaded). Boards only.'

export type BoardId = 'mx95' | 'kv260'

export const SIGN_BENCH_0926: { algorithm: string; ops: Record<BoardId, number> }[] = [
  { algorithm: 'ML-DSA-44', ops: { mx95: 8922, kv260: 4591 } },
  { algorithm: 'ML-DSA-65', ops: { mx95: 5390, kv260: 2675 } },
  { algorithm: 'ML-DSA-87', ops: { mx95: 3795, kv260: 2002 } },
  { algorithm: 'SLH-DSA-SHA2-128f', ops: { mx95: 179, kv260: 102 } },
  { algorithm: 'SLH-DSA-SHAKE-128f', ops: { mx95: 18.5, kv260: 10.4 } },
  { algorithm: 'SLH-DSA-SHA2-128s', ops: { mx95: 10.0, kv260: 4.88 } },
  { algorithm: 'SLH-DSA-SHAKE-128s', ops: { mx95: 0.96, kv260: 12.97 } },
  { algorithm: 'SLH-DSA-SHA2-256s', ops: { mx95: 4.87, kv260: 2.27 } },
  { algorithm: 'SLH-DSA-SHAKE-256s', ops: { mx95: 0.61, kv260: 8.04 } },
  { algorithm: 'Ed25519', ops: { mx95: 18695, kv260: 9710 } },
  { algorithm: 'ECDSA-P256', ops: { mx95: 3027, kv260: 1658 } },
  { algorithm: 'RSA-PSS-2048', ops: { mx95: 321, kv260: 170 } },
]

/** Which accelerator each 09-26 KV260 row actually used */
export const KV260_0926_PATH: Record<string, 'fpga' | 'arm'> = {
  'SLH-DSA-SHAKE-128s': 'fpga',
  'SLH-DSA-SHAKE-256s': 'fpga',
}

// ── Dataset 2: ML-DSA-44 single-worker, MX95 vs KV260 (2026-09-13/15) ───────
// Same Rust engine, PKCS#11 direct, pure software on both boards.
export const MLDSA44_BOARD_COMPARE = {
  note: 'ML-DSA-44 sign, Rust engine, PKCS#11 direct, software only on both boards (MX95 2026-09-15, KV260 2026-09-13).',
  oneWorker: { mx95: 255.6, kv260: 186.0 },
  fourWorkers: { mx95: '975.4', kv260: '719–749' },
  p50ms: { mx95: 3.03, kv260: 4.074 },
}

// ── Dataset 3: ISA effects measured on our boards ───────────────────────────
export const ISA_EFFECTS = {
  sha256VsSha512: {
    note: 'Digest throughput at 16 KiB through the PKCS#11 engine on the boards, 2026-09-26. Cortex-A5x has SHA-256 instructions but not SHA-512 ones, so the usual software ordering inverts.',
    sha256MBps: '396–470',
    sha512MBps: '136–143',
  },
  shakeVsSha256OnA55: {
    note: 'Direct probe on the i.MX 95 Cortex-A55, 2026-09-15. No SHA-3 instructions => all Keccak is software.',
    shake256MBps: 140,
    sha256MBps: 769,
  },
  aesBeforeAfter: {
    note: 'AES-128-CBC encrypt at 16 KiB, A-B-A-B, 2026-09-26. Same crate, with vs without the build flag that enables the ARMv8 AES instructions. Before the fix, AES ran in software on every board (peak 75 MB/s on the MX95).',
    speedup: { m4pro: '10.8–12.9×', mx95: '7.8–9.1×', kv260: '7.4–10.0×' } as Record<
      PlatformId,
      string
    >,
    gcmSpeedup: '3–6×',
  },
  rsaWrongKernel: {
    note: 'Cortex-A55, AWS-LC, 2026-09-16. AWS-LC picked a NEON/Karatsuba Montgomery kernel tuned for Neoverse cores; on the A55 it LOST to the plain scalar kernel. Forcing the scalar kernel:',
    rows: [
      { key: 'RSA-2048', before: 137.7, after: 177.5, gain: '+29%' },
      { key: 'RSA-3072', before: 33.8, after: 54.8, gain: '+62%' },
      { key: 'RSA-4096', before: 20.5, after: 25.0, gain: '+22%' },
    ],
  },
  keccakAsmOff: {
    note: 'Build audit, 2026-09-27: the M4 Pro reports FEAT_SHA3, but our engine builds the Rust `keccak` crate (used by SLH-DSA) without its `asm` feature, so SLH-DSA’s SHAKE runs the portable software permutation even there. (AWS-LC’s own Keccak, used by ML-DSA/ML-KEM, already uses the instructions.) Measured A/B on the M4 Pro, same engine with the feature switched on: SHAKE 1.17–1.20×, SLH-DSA-SHAKE-128s signing 1.19× — a real but modest gain, far below AES’s 7–13×, because Apple’s wide cores already run the software permutation well.',
  },
}

// ── Dataset 4: KV260 FPGA — ML-DSA-65 (the "+29%" story) ───────────────────
export const FPGA_MLDSA = {
  note: 'KV260, ML-DSA-65 sign, Rust engine, 4 workers. Dual-signer bitstream at 250 MHz vs the same board ARM-only.',
  armOnly: 404.45,
  withFpga: 522.5,
  gainPct: 29.2,
  hlsCeiling: 1316,
  /** What the ARM cores still do on every signature */
  armStillDoes: [
    'decode the private key',
    'expand the public matrix A (ExpandA — SHAKE128)',
    'copy the matrix and secrets into the fabric',
    'flush and invalidate caches around each DMA',
    'the PKCS#11 session and object handling',
  ],
  /** Earlier experiment (2026-09-14): offload only the NTT/matrix step */
  nttOnly: {
    note: 'Earlier NTT-only offload, 100 MHz fabric clock, 2026-09-14. About 5 rejection attempts per signature, so the per-attempt cost is paid ~5 times.',
    cpuPerAttemptMs: 0.44,
    fpgaPerAttemptMs: 0.68,
    fpgaCoreMs: 0.409,
    hostOverheadMs: 0.27,
    armOnlySignPerSec: '108–120',
    fpgaSignPerSec: 96.8,
  },
}

// ── Dataset 5: KV260 FPGA — SLH-DSA hashsig engine (2026-09-25) ─────────────
export const FPGA_HASHSIG = {
  note: 'KV260 hashsig bitstream v12b: 4 Keccak lanes at 240 MHz. Board measurement 2026-09-25, 1 caller. "Shipped software" = engine before the 09-25 CPU work, 1 worker (2026-09-24).',
  rows: [
    { set: 'SLH-DSA-SHAKE-128s', op: 'sign', shipped: '12.3 s', cpu: '2.12 s', fpga: '69.0 ms' },
    { set: 'SLH-DSA-SHAKE-128s', op: 'keygen', shipped: '—', cpu: '258 ms', fpga: '17.8 ms' },
    { set: 'SLH-DSA-SHAKE-192s', op: 'sign', shipped: '—', cpu: '3.65 s', fpga: '117 ms' },
    { set: 'SLH-DSA-SHAKE-256s', op: 'sign', shipped: '17.9 s', cpu: '3.23 s', fpga: '109 ms' },
    {
      set: 'SLH-DSA-SHA2-128s',
      op: 'sign',
      shipped: '9.4 s',
      cpu: '191 ms',
      fpga: 'CPU by design',
    },
  ],
  mx95BestCase: {
    note: 'i.MX 95, same new engine, CPU only: SLH-DSA-SHA2-128s uses the A55 SHA-256 instructions.',
    sha2_128sMs: 95,
    shake128sMs: 1060,
  },
  concurrency: {
    note: 'One engine, shared. Four threads get the same 14.2–14.3 sign/s as one thread; while the engine is busy, the other threads fall back to ARM (~30× slower), which pushes p99 latency to 2.7 s.',
    oneThread: 14.5,
    fourThreads: 14.3,
    p99s: 2.7,
  },
  laneScaling: [
    { lanes: 1, mhz: 250, signMs: 218, source: 'co-simulation' },
    { lanes: 2, mhz: 250, signMs: 114.4, source: 'co-simulation' },
    { lanes: 4, mhz: 240, signMs: 60.3, source: 'co-simulation' },
    { lanes: 4, mhz: 240, signMs: 69.0, source: 'board' },
  ],
}

// ── Dataset 5b: head-to-head AFTER acceleration, SLH-DSA (2026-09-25) ───────
// Both boards on the new engine: i.MX 95 on its best CPU path (all cores, and
// its SHA-256 instructions for the SHA-2 variant); KV260 on its hashsig FPGA
// engine. Source: pqctoday-cacp/docs/kv260-hashsig-board-results-09252026.md.
export const SLH_HEAD_TO_HEAD = {
  note: 'SLH-DSA sign, both boards after acceleration (new engine, 2026-09-25). One caller unless noted.',
  rows: [
    { config: 'i.MX 95 — CPU, SHAKE-128s', p50: '1.06 s', rate: '1.0/s' },
    { config: 'i.MX 95 — CPU, SHAKE-128s, 6 callers', p50: '1.59–1.68 s', rate: '0.93–1.0/s' },
    { config: 'i.MX 95 — CPU, SHA2-128s (SHA-256 instructions)', p50: '95 ms', rate: '9.7–9.9/s' },
    { config: 'KV260 — CPU only, SHAKE-128s', p50: '2.12 s', rate: '0.5/s' },
    { config: 'KV260 — FPGA engine, SHAKE-128s', p50: '69 ms', rate: '14.3–14.5/s' },
  ],
  verdict:
    'KV260 FPGA vs i.MX 95 on SHAKE-128s: ~15× lower latency, ~14× the throughput. Even against the i.MX 95’s best case (SHA2-128s on its SHA-256 instructions) the KV260 is 1.4× faster per signature and 1.45× in throughput — although the KV260’s own CPU is the slower of the two.',
  fpgaOnOff:
    'Same KV260, same image, FPGA on vs off (2026-09-27): SLH-DSA-SHAKE-128s sign 13.0 vs 0.46/s (28.4×), 192s 30.6×, 256s 26.4×. With the FPGA off, the A53 signs SHAKE-s about 2× slower than the A55 — the whole lead is the fabric.',
  bench0926:
    'Confirmed in the 2026-09-26 bench (4 workers): SHAKE-128s KV260 12.97/s vs i.MX 95 0.96/s; SHAKE-256s 8.04/s vs 0.61/s.',
}

// ── Dataset 5c: M4 Pro A/B, 2026-09-27 (PQC Today, this module) ──────────
// hsm main 476f97d1, rust:1-bookworm linux-arm64, opt-level 3; bench container
// on the M4 Pro; --threads 9 (4 workers), tenant 0, A-B-A-B (two rounds, means
// shown); xof probe 4 threads. Background between steps: 83–92% CPU idle.
export const M4_AB_0927 = {
  note: 'M4 Pro, 2026-09-27: same engine source built twice / run with and without the feature; two alternating rounds agreed within ~2%.',
  keccakAsm: [
    { cell: 'SHAKE128 16 KiB (direct)', off: 255_800, on: 298_100, x: 1.17 },
    { cell: 'SHAKE256 1 KiB (direct)', off: 2_681_000, on: 3_190_000, x: 1.19 },
    { cell: 'SLH-DSA-SHAKE-128s sign', off: 14.5, on: 17.25, x: 1.19 },
    { cell: 'SLH-DSA-SHAKE-128f sign', off: 285, on: 345, x: 1.21 },
    { cell: 'SLH-DSA-SHA2-128s sign (control)', off: 126, on: 130, x: 1.03 },
    { cell: 'SHA-256 16 KiB (control)', off: 758_600, on: 757_500, x: 1.0 },
  ],
  awslcNeon: [
    { cell: 'ML-DSA-44 sign', off: 27_370, on: 110_900, x: 4.05 },
    { cell: 'ML-DSA-65 sign', off: 18_160, on: 72_990, x: 4.02 },
    { cell: 'ML-DSA-65 verify', off: 55_900, on: 222_450, x: 3.98 },
    { cell: 'ML-DSA-65 keygen', off: 2_936, on: 22_615, x: 7.7 },
    { cell: 'ML-DSA-87 sign', off: 16_780, on: 56_700, x: 3.38 },
    { cell: 'ML-KEM-768 decapsulate', off: 122_230, on: 183_940, x: 1.5 },
    { cell: 'ML-KEM-768 encapsulate (stays on Rust)', off: 118_660, on: 118_640, x: 1.0 },
  ],
}

// ── Dataset 6: FPGA resources, clocks and the offload round trip ────────────
export const FPGA_DEVICE = {
  part: 'Zynq UltraScale+ K26 (KV260)',
  luts: 117120,
  flipFlops: 234240,
  bramTiles: 144,
  uram: 64,
  dsp: 1248,
  source: 'Vivado utilization report, KV260 builds (2026-09)',
}

export interface FpgaBuild {
  name: string
  luts: number
  bram?: number
  dsp?: number
  mhz: number
  note: string
}

export const FPGA_BUILDS: FpgaBuild[] = [
  {
    name: 'ML-DSA-65 dual signer + monitor',
    luts: 94630,
    bram: 137,
    dsp: 104,
    mhz: 250,
    note: '80.8% of LUTs, 95% of block RAM — memory ran out before logic did.',
  },
  {
    name: 'SLH-DSA hashsig, 4 Keccak lanes',
    luts: 64600,
    mhz: 240,
    note: '55% of LUTs. 250 MHz missed timing by 0.010 ns, so it ships at 240 MHz.',
  },
  {
    name: 'NTT/matrix engine (early)',
    luts: 17305,
    bram: 17.5,
    dsp: 7,
    mhz: 142.857,
    note: 'Asked for 150 MHz; the PS clock divider can only give 142.857 MHz (7.000 ns).',
  },
]

export const FPGA_LANE_COST = {
  earlyLaneLuts: '25–32k',
  redesignedLaneLuts: '~14k',
  keccakRoundLuts: '~6.5k',
  eightLaneEstimateLuts: '~130k (more than the whole 117k device)',
  sha2DroppedNote:
    'SHA-2 cores were built and closed timing at 250 MHz, then dropped: one cost as much area as a Keccak lane (~33k LUT), and the A53 with its SHA-256 instructions was faster (FPGA SHA2-128s ≈ 1.45 s vs CPU 191 ms).',
}

export const FPGA_TIMING = {
  note: 'Static timing: every register-to-register path must settle inside one clock period. WNS = worst negative slack; positive means every path met timing.',
  examples: [
    { target: '100 MHz (10 ns)', wnsNs: 3.111, longestPathNs: 6.889, met: true },
    { target: '142.857 MHz (7 ns)', wnsNs: 0.62, longestPathNs: 6.38, met: true },
    { target: '250 MHz (4 ns), 4 lanes', wnsNs: -0.01, longestPathNs: 4.01, met: false },
    { target: '240 MHz (4.167 ns), 4 lanes', wnsNs: 0.003, longestPathNs: 4.164, met: true },
  ],
}

export const OFFLOAD_ROUND_TRIP = {
  note: 'KV260 Keccak batch engine (2026-09-13): each call cost 1,481 µs fixed plus 58.7 µs per hash job. The A53 does the same 30-job batch in 359 µs.',
  fixedUs: 1481,
  perJobUs: 58.7,
  cpuPerJobUs: 359 / 30,
  referenceBatch: 30,
}

// ── Dataset 6b: how the KV260 fabric is reprogrammed (2026-09-12 → 09-25) ──
export const FPGA_REPROGRAM = {
  models: [
    {
      id: 'boot',
      label: 'One image, loaded at boot',
      plain:
        'The whole fabric is programmed once when the board starts. To change the accelerator you rebuild the image and reboot.',
      ours: 'How our KV260 image ships: one flat bitstream (two ML-DSA signers + the behaviour monitor), loaded by a boot service through Linux’s FPGA Manager and a device-tree overlay.',
      status: 'tested' as const,
    },
    {
      id: 'profiles',
      label: 'Whole images swapped at runtime (“profiles”)',
      plain:
        'Keep several complete images on the board and swap the whole fabric on command — like changing the entire production line between shifts.',
      ours: 'Tested live on the KV260, both directions (2026-09-25): the command “pqc-fpga-profile set mldsa” or “… set hashsig” stops the crypto services, removes the overlay, checks the new image’s SHA-256, loads it, re-runs the board and monitor checks and restarts the services, logging an evidence record. mldsa: ML-DSA-65 970–981 sign/s on the fabric; hashsig: SLH-DSA-SHAKE-128s 68.9 ms. Cost: every accelerator — including the behaviour monitor — goes away during the switch, and services restart.',
      status: 'tested' as const,
    },
    {
      id: 'dfx',
      label: 'Partial reconfiguration (AMD DFX)',
      plain:
        'Keep the base of the line running and swap just one station — the rest of the factory never stops.',
      ours: 'Documented for the K26 but not used: our profiles are full bitstreams. It would let the behaviour monitor keep running while the crypto slot changes, at the price of a harder design: each slot has a fixed size and position, every module must fit it and meet timing inside it, and the shell’s interface is frozen.',
      status: 'not tested' as const,
    },
  ],
}

// ── Dataset 7: GPU batching (Apple Metal, ML-DSA-65) ────────────────────────
// A separate, dedicated GPU study (2026-06-13) on the M5 Max's 40-core GPU;
// all kernels bit-exact against the pq-crystals reference. This is NOT the
// 2026-09-24 CPU bench (whose M5 Max column is excluded as contaminated).
export const GPU_BATCH = {
  note: 'PQC Today Metal study, ML-DSA-65 key generation, Apple M5 Max 40-core GPU vs its own CPU cores, 2026-06-13. Millions of keys per second; every output bit-exact vs the reference.',
  keygen: [
    { batch: 256, cpu1: 0.014, cpuAll: 0.152, gpu: 0.082 },
    { batch: 4096, cpu1: 0.017, cpuAll: 0.166, gpu: 0.975 },
    { batch: 65536, cpu1: 0.017, cpuAll: 0.184, gpu: 1.705 },
  ],
  crossover: '~1,000–2,000 keys',
  signAt16k: {
    note: 'At a batch of 16,384 the first GPU signing version LOST (0.87× the all-core CPU) because one straggler signature needed 59 rejection rounds and every round re-launched the whole batch. Letting finished signatures exit early fixed it.',
    naiveVsCpu: 0.87,
    fixedVsCpu: 1.83,
  },
}
