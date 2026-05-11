// SPDX-License-Identifier: GPL-3.0-only
/**
 * Phase 2 acceptance measurement — captures the current trust-tier
 * distribution and writes it to `reports/trust-tier-snapshot.json`.
 *
 * Why this is a test file: trustScoreData.ts loads CSV data through
 * Vite's `import.meta.glob`, which isn't available in plain tsx
 * scripts. Vitest runs through Vite's transformer, so it's the
 * lightest harness that can run this code outside the browser.
 *
 * Run with:
 *   npx vitest run src/data/trustScore/__tests__/measure-tier-distribution.test.ts
 *
 * The asserted invariants are intentionally weak — this file's job
 * is to capture the snapshot, not gate CI on a target distribution.
 * Snapshot survives in the repo as the "before SME triage" baseline
 * for the roadmap's "5–8% records move up one tier" claim.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { trustScores } from '../trustScoreData'

interface TierCounts {
  Authoritative: number
  High: number
  Moderate: number
  Low: number
  total: number
}

function blank(): TierCounts {
  return { Authoritative: 0, High: 0, Moderate: 0, Low: 0, total: 0 }
}

describe('Phase 2 — trust tier distribution snapshot', () => {
  it('captures the current tier distribution and writes a JSON snapshot', () => {
    const overall = blank()
    const byType: Record<string, TierCounts> = {}

    for (const score of trustScores.values()) {
      overall[score.tier]++
      overall.total++
      if (!byType[score.resourceType]) byType[score.resourceType] = blank()
      byType[score.resourceType][score.tier]++
      byType[score.resourceType].total++
    }

    const snapshot = {
      measuredAt: new Date().toISOString(),
      note: 'Pre-SME-triage baseline for Phase 2 acceptance — re-run after admin-portal queues land to compare.',
      overall,
      byResourceType: byType,
    }

    const reportsDir = path.join(process.cwd(), 'reports')
    fs.mkdirSync(reportsDir, { recursive: true })
    const outPath = path.join(reportsDir, 'trust-tier-snapshot.json')
    fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2))

    // Weak sanity invariants:
    expect(overall.total).toBeGreaterThan(0)
    expect(overall.Authoritative + overall.High + overall.Moderate + overall.Low).toBe(
      overall.total
    )
    console.warn(`Wrote ${path.relative(process.cwd(), outPath)}`)
    console.warn(
      `Overall: Authoritative=${overall.Authoritative} High=${overall.High} ` +
        `Moderate=${overall.Moderate} Low=${overall.Low} total=${overall.total}`
    )
  })
})
