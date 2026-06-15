// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deterministic PRNG for the simulation (mulberry32). Pure and seedable so a
 * given seed + turn reproduces a quarter byte-for-byte — which makes the quarter
 * engine testable and enables "replay last quarter". RNG never runs in a render
 * body (the React Compiler purity rule); callers derive an `Rng` and pass it into
 * the engine.
 */

export type Rng = () => number

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded coin flip: true with probability `p`. */
export const chanceWith = (rng: Rng, p: number): boolean => rng() < p

/** Seeded uniform pick from a non-empty array. */
export const sampleWith = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]

/**
 * Derive a per-quarter RNG from the run seed and the turn (year, quarter). The
 * same seed + same turn always yields the same stream — so a quarter is
 * reproducible and replayable.
 */
export function quarterRng(seed: number, year: number, quarter: number): Rng {
  const turn = Math.imul(year * 4 + quarter, 0x9e3779b1)
  return mulberry32((seed ^ turn) >>> 0)
}

/** A fresh random run seed (event-time only — never call from a render body). */
export const newSeed = (): number => Math.floor(Math.random() * 0xffffffff) >>> 0
