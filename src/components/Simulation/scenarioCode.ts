// SPDX-License-Identifier: GPL-3.0-only
/**
 * scenarioCode (PR7) — encode/decode the run seed as a short shareable "scenario
 * code". Because the engine is fully seeded (quarterRng(seed, year, q) is
 * byte-stable), two players who load the same code get the same run. Pure.
 */

/** Encode a uint32 seed as an uppercase base36 scenario code (e.g. "1Z3F9K"). */
export function encodeScenario(seed: number): string {
  const u = Math.floor(seed) >>> 0 // coerce to uint32
  return u.toString(36).toUpperCase()
}

/** Decode a scenario code back to a uint32 seed, or null if malformed. */
export function decodeScenario(code: string): number | null {
  const trimmed = code.trim()
  if (!/^[0-9A-Za-z]{1,7}$/.test(trimmed)) return null
  const n = parseInt(trimmed, 36)
  if (!Number.isFinite(n) || n < 0 || n > 0xffffffff) return null
  return n >>> 0
}
