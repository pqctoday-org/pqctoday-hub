// SPDX-License-Identifier: GPL-3.0-only
/**
 * Migration readiness (WS-04) — per-edge, continuous, attributable.
 *
 * Readiness is the share of the estate's quantum-vulnerable, migratable edges
 * that have actually been moved. It is driven by the FRACTION of P5 (Pilots /
 * Production) activities completed, so it rises smoothly with each activity —
 * unlike the old 4-step function of the P5 maturity level — and every point
 * traces to a specific edge + the activity that migrated it.
 *
 * Pure function (no React); the caller supplies the P5 completion fraction.
 */
import { ARCHITECTURES } from '@/data/simArchitecture'

export interface Readiness {
  /** 0–100 — percent of migratable vulnerable edges moved. */
  pct: number
  /** Count of vulnerable edges migrated so far. */
  migrated: number
  /** Total quantum-vulnerable edges that have a PQC path (the migratable set). */
  vulnerable: number
}

/**
 * @param size       org size preset (selects the architecture topology)
 * @param p5Frac     fraction (0–1) of P5 activities completed
 */
export function computeReadiness(size: string, p5Frac: number): Readiness {
  const edges = (ARCHITECTURES[size as keyof typeof ARCHITECTURES] ?? ARCHITECTURES.mid).edges
  // Migratable = vulnerable AND has a PQC path (no-path edges are compensate-only).
  const vulnerable = edges.filter((e) => e.vulnerable && e.pqcPath !== 'none').length
  const frac = Math.max(0, Math.min(1, p5Frac))
  // Each completed P5 activity migrates the next vulnerable edge.
  const migrated = Math.round(vulnerable * frac)
  return { pct: Math.round((migrated / Math.max(1, vulnerable)) * 100), migrated, vulnerable }
}
