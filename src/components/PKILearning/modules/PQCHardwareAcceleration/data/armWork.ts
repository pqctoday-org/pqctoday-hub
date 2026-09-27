// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every Arm acceleration PQC Today actually implemented in its engine
 * (pqctoday-hsm `softhsmrustv3`) and appliance images (pqctoday-cacp), with
 * the measured before → after. Sources are the hsm commit messages/PRs and
 * the bench result files; checked against the commits on 2026-09-27.
 *
 * `where` says what the number was measured on — many engine-level A/Bs ran
 * in an arm64 Linux container on a Mac, NOT on the boards; the boards only
 * have bundled before/after figures. `status`:
 *   shipped  = in the flashed appliance images (KV260 reflashed 2026-09-27
 *              to hsm 37de2892, the i.MX 95 boards the same day)
 *   merged   = merged in the engine, not yet in a flashed image
 *   review   = implemented and measured on the boards, PR under review
 *   planned  = designed or tested as an A/B build, not in the engine
 */

import type { ModelId } from './models'

export type WorkStatus = 'shipped' | 'merged' | 'review' | 'planned'

export interface ArmWork {
  area: 'AES' | 'ML-DSA' | 'SLH-DSA' | 'AWS-LC (RSA)'
  what: string
  model: ModelId | 'software'
  mechanism: string
  measured: string
  where: string
  status: WorkStatus
  ref: string
}

export const ARM_WORK: ArmWork[] = [
  // ── AES ──────────────────────────────────────────────────────────────────
  {
    area: 'AES',
    what: 'Switch on the Armv8 AES and PMULL instructions',
    model: 'isa',
    mechanism: 'Build flags for the Rust AES crates (they were silently off)',
    measured:
      'AES-128-CBC 16 KiB: KV260 7.4×, i.MX 95 7.8×, M4 Pro 10.8×; AES-256-CBC up to 12.9×; GCM 3–6×',
    where: 'All three platforms, A-B-A-B, 2026-09-26',
    status: 'shipped',
    ref: 'cacp #36/#38, sandbox #83/#84',
  },
  {
    area: 'AES',
    what: 'Move to the newer AES crates that use the hardware by default',
    model: 'isa',
    mechanism: 'Runtime CPU detection instead of a build flag',
    measured: 'CBC unchanged (0.98–0.99×), GCM 1.15–1.19× — same speed, no flag to forget',
    where: 'M4 Pro, 2026-09-27',
    status: 'merged',
    ref: 'hsm #283',
  },
  {
    area: 'AES',
    what: 'Process GCM a whole block at a time instead of byte by byte',
    model: 'software',
    mechanism: 'Whole-block counter keystream and GHASH',
    measured:
      'AES-128-GCM 16 KiB: KV260 board 6.1–7.6× (5,455 → 35,603/s), i.MX 95 Pro board 6.5–7.0× (11,743 → 76,682/s), M4 Pro 5.6–6.5×',
    where: 'KV260 + i.MX 95 Pro on-board A/B, M4 Pro, 2026-09-27',
    status: 'shipped',
    ref: 'hsm #291',
  },
  {
    area: 'AES',
    what: 'Stop cores queuing on shared engine state',
    model: 'software',
    mechanism: 'Per-session state sharded 64 ways; AES key schedule cached',
    measured:
      'AES-128-CBC 64 B: KV260 board 3.2–3.3× (46k → 150k/s), i.MX 95 Pro board 4.1–4.4× (up to 5.0× at 6 workers, 87k → 435k/s). The old engine did not scale past 1 worker; the new one scales near-linearly. Single worker 5–18% lower (known trade-off, follow-up planned)',
    where: 'KV260 + i.MX 95 Pro on-board A/B, M4 Pro, 2026-09-27',
    status: 'shipped',
    ref: 'hsm #298',
  },
  {
    area: 'AES',
    what: 'Compile the appliance engine at full optimisation',
    model: 'software',
    mechanism: 'opt-level 3 instead of size-optimised',
    measured: 'AES-CBC 16 KiB 1.40–1.53×, 64 B 1.23×',
    where: 'M4 Pro, 2026-09-27',
    status: 'shipped',
    ref: 'cacp recipes',
  },
  // ── ML-DSA ───────────────────────────────────────────────────────────────
  {
    area: 'ML-DSA',
    what: 'Run ML-DSA and ML-KEM on AWS-LC’s hand-written NEON assembly',
    model: 'simd',
    mechanism: 'mldsa-native / mlkem-native AArch64 code inside AWS-LC',
    measured:
      'On/off on the M4 Pro (same engine, AWS-LC path disabled vs enabled): ML-DSA-65 sign 18.2k → 72.7k/s (4.0×), verify 4.0×, keygen 7.7×; ML-DSA-87 sign 3.4×; ML-KEM-768 decapsulate 1.5×. Earlier container test with SHA-3 masked (A53/A55-like): ML-DSA-65 sign 3.8×, verify 3.3×',
    where: 'M4 Pro A-B-A-B, 2026-09-27; container, 2026-09-24',
    status: 'shipped',
    ref: 'hsm #254 (98b67e63)',
  },
  {
    area: 'ML-DSA',
    what: 'Decode each private key and expand its matrix once, not on every signature',
    model: 'software',
    mechanism: 'Per-key expanded signing context, cached',
    measured: 'Host CPU per FPGA-assisted signature 0.252 → 0.041 of a CPU-only signature',
    where: 'arm64 container model',
    status: 'shipped',
    ref: 'hsm #254 (e2246faf)',
  },
  {
    area: 'ML-DSA',
    what: 'Offload whole ML-DSA-65 signatures to two FPGA signers',
    model: 'fpga',
    mechanism: 'DMA + one system call per signature + interrupt',
    measured:
      '404 → 523 sign/s at 4 workers (+29%); later 515 → 975 at 8 threads with the host-path work',
    where: 'KV260 board',
    status: 'shipped',
    ref: 'hsm #254, cacp images',
  },
  // ── SLH-DSA ──────────────────────────────────────────────────────────────
  {
    area: 'SLH-DSA',
    what: 'Use the Armv8 SHA-256/SHA-512 instructions for the SHA-2 variants',
    model: 'isa',
    mechanism: 'Rust sha2 crate “asm” feature, Arm only',
    measured: 'SHA2-128s sign 568 → 102 ms; SHAKE control unchanged (49.0 → 47.4 ms)',
    where: 'arm64 container on a Mac',
    status: 'shipped',
    ref: 'hsm 490988a3',
  },
  {
    area: 'SLH-DSA',
    what: 'Hash the public seed block once per signature, not once per hash call',
    model: 'software',
    mechanism: 'SHA-256/512 midstate cache',
    measured: 'SHA2-128s sign 98.0 → 79.6 ms, SHA2-192s 229.9 → 153.6 ms',
    where: 'arm64 container on a Mac',
    status: 'shipped',
    ref: 'hsm f2e195fa',
  },
  {
    area: 'SLH-DSA',
    what: 'Build the independent subtrees of one signature on all cores',
    model: 'software',
    mechanism: 'Multi-threaded signing with one shared core budget',
    measured: 'SHA2-128s 76.9 → 19.8 ms (4 threads); SHAKE-128s 735.8 → 195.0 ms',
    where: 'arm64 container on a Mac',
    status: 'shipped',
    ref: 'hsm 42291340',
  },
  {
    area: 'SLH-DSA',
    what: 'Use the Armv8.2 SHA-3 instructions for SHAKE (M4-class cores)',
    model: 'isa',
    mechanism: 'Rust keccak crate “asm” feature — tested as an A/B build, not yet in the engine',
    measured:
      'M4 Pro: SHAKE 1.17–1.20×, SLH-DSA-SHAKE-128s sign 14.5 → 17.5/s (1.19×), SHA3-256 digest 1.14–1.15×; SHA-2 controls 1.00×. A55/A53 lack the instructions, so no effect there',
    where: 'M4 Pro A-B-A-B, 2026-09-27 (M5 Max partial run agrees: 1.17–1.22×)',
    status: 'planned',
    ref: 'A/B build of hsm 476f97d1',
  },
  {
    area: 'SLH-DSA',
    what: 'Offload whole SLH-DSA-SHAKE signatures to a 4-lane Keccak engine',
    model: 'fpga',
    mechanism: '4 Keccak lanes at 240 MHz in the KV260 fabric',
    measured:
      'Same board, FPGA on vs off: SLH-DSA-SHAKE-128s sign 0.46 → 13.0/s (28.4×), 192s 30.6×, 256s 26.4×, keygen 14–15×; SHAKE-f and SHA-2 sets unchanged (not routed to the fabric)',
    where: 'KV260 board, 2026-09-27 (re-proves the 09-25 result: 2.12 s → 69 ms)',
    status: 'shipped',
    ref: 'hsm #254, cacp #34',
  },
  // ── AWS-LC for classical (still needed in hybrid deployments) ─────────────
  {
    area: 'AWS-LC (RSA)',
    what: 'Move RSA (and NIST-curve ECDH) onto AWS-LC',
    model: 'software',
    mechanism: 'aws-lc-rs: optimised, constant-time big-number code',
    measured: 'RSA-2048 sign 49.4 → 68.6/s (1 thread), 235.6 → 326.8/s (6 threads)',
    where: 'i.MX 95 board',
    status: 'shipped',
    ref: 'hsm #239',
  },
  {
    area: 'AWS-LC (RSA)',
    what: 'Stop re-parsing the RSA key on every operation',
    model: 'software',
    mechanism: 'Parsed-key cache',
    measured: 'RSA-2048 sign 80.8 → 105.4/s (1 thread), 356 → 481/s (6 threads)',
    where: 'i.MX 95 board, pinned core',
    status: 'shipped',
    ref: 'hsm #240',
  },
  {
    area: 'AWS-LC (RSA)',
    what: 'Answer the decrypt “how big is the output?” query without decrypting',
    model: 'software',
    mechanism: 'Return the size from the key instead of doing a private-key operation',
    measured:
      'RSA-OAEP-2048 decrypt: KV260 board 167 → 347/s (2.05–2.11×), i.MX 95 Pro board 321 → 642/s (2.00×), M4 Pro 4,144 → 8,295/s',
    where: 'KV260 + i.MX 95 Pro on-board A/B, M4 Pro, 2026-09-27',
    status: 'shipped',
    ref: 'hsm #289',
  },
  {
    area: 'AWS-LC (RSA)',
    what: 'Use the scalar Montgomery kernel on Cortex-A5x cores',
    model: 'software',
    mechanism:
      'Patch AWS-LC’s kernel choice (it picks a server-tuned NEON kernel that is slower on A5x)',
    measured:
      'On-board, stock vs patched engine from one commit: RSA-OAEP decrypt 2048/3072/4096 — i.MX 95 (A55) 1.27× / 1.60× / 1.21–1.26×, KV260 (A53) 1.28–1.39× / 1.64–1.69× / 1.22–1.25×. RSA-PSS sign unaffected (pure Rust)',
    where: 'i.MX 95 + KV260 boards, 2026-09-27',
    status: 'review',
    ref: 'AWS-LC dispatch patch (hsm PR in review)',
  },
]

export const ARM_WORK_NOTE =
  'Container and M4 Pro figures isolate one change at a time; the boards only have bundled before/after figures (e.g. KV260 SLH-DSA-SHA2-128s 9.4 s → 191 ms, SHAKE-128s 12.3 s → 2.12 s, all CPU changes together). Items marked “merged” reach the boards with the next image build.'
