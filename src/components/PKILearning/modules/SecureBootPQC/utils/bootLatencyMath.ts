// SPDX-License-Identifier: GPL-3.0-only
/**
 * Boot-time signature verification latency model for a microcontroller
 * root of trust (moved from the IoT/OT module's Hardware Constraints
 * simulator, 2026-10-01, with the cycle counts corrected and sourced).
 *
 * Model: total delay = time to read signature + public key from SPI flash
 * + software verify time on the MCU core. It deliberately leaves out the
 * firmware-image hash (identical for every algorithm), flash wait states,
 * cache effects and any crypto accelerator — outputs are a model estimate.
 */

export interface BootVerifyAlgorithm {
  name: string
  /** Signature size in bytes, as the standard states it */
  sigBytes: number
  /** Public key size in bytes, as the standard states it */
  pubBytes: number
  /** Software verify cost on an ARM Cortex-M4, in CPU cycles */
  verifyCycles: number
  /** Where the sizes come from */
  sizeSource: string
  /** Where the cycle count comes from */
  cycleSource: string
}

/**
 * Cortex-M4 verify cycle counts, checked 2026-10-01.
 *
 * - ECDSA P-256: optimized Cortex-M4 assembly verifies in ~0.98 M cycles;
 *   portable C libraries land at 1–2 M. The model uses the optimized figure.
 * - RSA-3072: Oryx Embedded benchmark on STM32G4 — 149 ms at 170 MHz,
 *   i.e. 149e-3 × 170e6 ≈ 25.3 M cycles.
 * - ML-DSA-44: pqm4 benchmark (m4f implementation), ~1.42 M cycles.
 * - LMS H10/W4: Cortex-M4 measurement from IACR ePrint 2020/470, ~2.66 M.
 *   Sizes are plain LMS (RFC 8554, LMS_SHA256_M32_H10 + LMOTS_SHA256_N32_W4):
 *   56-byte public key, 2,508-byte signature. Wrapping it in HSS with L=1 adds
 *   4 bytes to each (60 / 2,512).
 */
export const BOOT_VERIFY_ALGORITHMS: BootVerifyAlgorithm[] = [
  {
    name: 'ECDSA P-256',
    sigBytes: 64,
    pubBytes: 64,
    verifyCycles: 980_000,
    sizeSource: 'FIPS 186-5 (raw r‖s, uncompressed x‖y)',
    cycleSource: 'Optimized Cortex-M4 assembly ~0.98 M cycles; portable C libraries 1–2 M',
  },
  {
    name: 'RSA-3072',
    sigBytes: 384,
    pubBytes: 384,
    verifyCycles: 25_330_000,
    sizeSource: 'RFC 8017 (3072-bit modulus)',
    cycleSource: 'Oryx Embedded, STM32G4: 149 ms @ 170 MHz ≈ 25.3 M cycles',
  },
  {
    name: 'ML-DSA-44',
    sigBytes: 2420,
    pubBytes: 1312,
    verifyCycles: 1_420_000,
    sizeSource: 'FIPS 204',
    cycleSource: 'pqm4 benchmark, m4f implementation (Cortex-M4) ~1.42 M cycles',
  },
  {
    name: 'LMS H10/W4',
    sigBytes: 2508,
    pubBytes: 56,
    verifyCycles: 2_660_000,
    sizeSource: 'RFC 8554 / SP 800-208, LMS_SHA256_M32_H10 + LMOTS W4 (HSS L=1: 60 / 2,512 B)',
    cycleSource: 'IACR ePrint 2020/470, Cortex-M4 ~2.66 M cycles',
  },
]

/** Illustrative boot budget for the calculator — a teaching value, not a standard. */
export const ILLUSTRATIVE_BOOT_BUDGET_MS = 100

export interface SecureBootResult {
  loadTimeMs: number
  verifyTimeMs: number
  totalBootDelayMs: number
  payloadSizeBytes: number
  exceedsBudget: boolean
}

/**
 * Latency of loading and verifying one boot signature.
 * @param sigBytes signature size in bytes
 * @param pubBytes public key size in bytes
 * @param verifyCycles CPU cycles to verify (software, no accelerator)
 * @param spiSpeedMBps SPI flash read speed in megabytes per second
 * @param mcuClockMHz MCU core clock in megahertz
 * @param budgetMs boot budget to compare against (illustrative default 100 ms)
 */
export function calculateSecureBootLatency(
  sigBytes: number,
  pubBytes: number,
  verifyCycles: number,
  spiSpeedMBps: number,
  mcuClockMHz: number,
  budgetMs: number = ILLUSTRATIVE_BOOT_BUDGET_MS
): SecureBootResult {
  if (spiSpeedMBps <= 0 || mcuClockMHz <= 0 || sigBytes < 0 || pubBytes < 0 || verifyCycles < 0) {
    throw new Error('Invalid hardware parameters')
  }

  const payloadSizeBytes = sigBytes + pubBytes
  // (bytes / (MB/s × 10^6)) × 1000 = ms
  const loadTimeMs = (payloadSizeBytes / (spiSpeedMBps * 1_000_000)) * 1000
  // (cycles / (MHz × 10^6)) × 1000 = ms
  const verifyTimeMs = (verifyCycles / (mcuClockMHz * 1_000_000)) * 1000
  const totalBootDelayMs = loadTimeMs + verifyTimeMs

  return {
    loadTimeMs,
    verifyTimeMs,
    totalBootDelayMs,
    payloadSizeBytes,
    exceedsBudget: totalBootDelayMs > budgetMs,
  }
}
