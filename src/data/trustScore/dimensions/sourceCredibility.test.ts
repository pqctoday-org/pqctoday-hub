// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guards for the source-credibility scoring tables.
 *
 * TIER_SCORES / MATCH_PENALTY are keyed on string vocabularies that live in
 * CSV data files (trusted_sources_*.csv trust_tier column and
 * trusted_source_xref_*.csv match_method column). A vocabulary change in the
 * data must fail these tests loudly instead of silently falling back to the
 * "unknown" scores (tier 20 / method -10) — that exact drift previously left
 * every 2_Core source scoring below 3_Supporting.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { TIER_SCORES, MATCH_PENALTY, scoreSourceCredibility } from './sourceCredibility'
import type { ScoringContext } from '../types'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

/** Resolve the latest dated CSV (MMDDYYYY, optional _rN) for a prefix. */
function latestCsvPath(prefix: string): string {
  const re = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const candidates = fs
    .readdirSync(DATA_DIR)
    .map((f) => {
      const m = f.match(re)
      if (!m) return null
      const [, mm, dd, yyyy, rev] = m
      return { f, date: Number(yyyy + mm + dd), rev: rev ? Number(rev) : 0 }
    })
    .filter((c): c is { f: string; date: number; rev: number } => c !== null)
    .sort((a, b) => b.date - a.date || b.rev - a.rev)
  if (candidates.length === 0) throw new Error(`No ${prefix}_*.csv found in ${DATA_DIR}`)
  return path.join(DATA_DIR, candidates[0].f)
}

/** Distinct non-empty values of one column in a CSV file. */
function distinctColumnValues(csvPath: string, column: string): string[] {
  const raw = fs.readFileSync(csvPath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })
  expect(parsed.errors.filter((e) => e.code !== 'TooFewFields')).toEqual([])
  const values = new Set<string>()
  for (const row of parsed.data) {
    const v = row[column]?.trim()
    if (v) values.add(v)
  }
  expect(values.size).toBeGreaterThan(0)
  return [...values]
}

function emptyContext(): ScoringContext {
  return {
    trustedSources: new Map(),
    xrefsByResource: new Map(),
    libraryEnrichments: {},
    timelineEnrichments: {},
    threatsEnrichments: {},
    manifestStatuses: new Map(),
    complianceLibraryRefs: new Map(),
    complianceTimelineRefs: new Map(),
    libraryDependencies: new Map(),
    threatModuleRefs: new Map(),
    demonstrableAlgorithms: new Set(),
    communitySignals: new Map(),
  }
}

function scoreForTier(tier: string): number {
  const ctx = emptyContext()
  // Academic has a 0 type bonus, so the result isolates the tier score.
  ctx.trustedSources.set('src', { trustTier: tier, sourceType: 'Academic' })
  ctx.xrefsByResource.set('res', [{ sourceId: 'src', matchMethod: 'direct' }])
  return scoreSourceCredibility('res', ctx).rawScore
}

describe('TIER_SCORES ↔ trusted-sources registry drift guard', () => {
  it('every distinct trust_tier in the registry CSV is a key of TIER_SCORES', () => {
    const registryTiers = distinctColumnValues(latestCsvPath('trusted_sources'), 'trust_tier')
    const missing = registryTiers.filter((t) => !(t in TIER_SCORES))
    expect(
      missing,
      `Registry trust_tier value(s) ${JSON.stringify(missing)} are not keyed in TIER_SCORES ` +
        `(sourceCredibility.ts) — they would silently score as unknown (20). ` +
        `Update TIER_SCORES to match the registry vocabulary.`
    ).toEqual([])
  })

  it('tier scores decrease monotonically from 1_Authoritative to 4_Contextual', () => {
    expect(TIER_SCORES['1_Authoritative']).toBeGreaterThan(TIER_SCORES['2_Core'])
    expect(TIER_SCORES['2_Core']).toBeGreaterThan(TIER_SCORES['3_Supporting'])
    expect(TIER_SCORES['3_Supporting']).toBeGreaterThan(TIER_SCORES['4_Contextual'])
    // Every known tier must beat the unknown-tier fallback (20).
    for (const [tier, score] of Object.entries(TIER_SCORES)) {
      expect(score, `${tier} must score above the unknown-tier fallback`).toBeGreaterThan(20)
    }
  })

  it('a 2_Core source outscores a 3_Supporting source end-to-end', () => {
    expect(scoreForTier('2_Core')).toBeGreaterThan(scoreForTier('3_Supporting'))
  })
})

describe('MATCH_PENALTY ↔ xref match_method drift guard', () => {
  it('every distinct match_method in the xref CSV is a key of MATCH_PENALTY', () => {
    const methods = distinctColumnValues(latestCsvPath('trusted_source_xref'), 'match_method')
    const missing = methods.filter((m) => !(m in MATCH_PENALTY))
    expect(
      missing,
      `Xref match_method value(s) ${JSON.stringify(missing)} are not keyed in MATCH_PENALTY ` +
        `(sourceCredibility.ts) — they would silently take the unknown penalty (-10).`
    ).toEqual([])
    expect(methods).toContain('exact')
  })

  it('locks the weight ordering: exact ≥ direct > mapped > inferred > category-inferred', () => {
    expect(MATCH_PENALTY['exact']).toBeGreaterThanOrEqual(MATCH_PENALTY['direct'])
    expect(MATCH_PENALTY['direct']).toBeGreaterThan(MATCH_PENALTY['mapped'])
    expect(MATCH_PENALTY['mapped']).toBeGreaterThan(MATCH_PENALTY['inferred'])
    expect(MATCH_PENALTY['inferred']).toBeGreaterThan(MATCH_PENALTY['category-inferred'])
    // 'exact' is at least as good as the best method in the table.
    const best = Math.max(...Object.values(MATCH_PENALTY))
    expect(MATCH_PENALTY['exact']).toBe(best)
    // 'exact' must not be penalized like an unknown method.
    expect(MATCH_PENALTY['exact']).toBeGreaterThan(-10)
  })

  it('an exact match scores at least as well as a direct match end-to-end', () => {
    const score = (matchMethod: string): number => {
      const ctx = emptyContext()
      ctx.trustedSources.set('src', { trustTier: '2_Core', sourceType: 'Academic' })
      ctx.xrefsByResource.set('res', [{ sourceId: 'src', matchMethod }])
      return scoreSourceCredibility('res', ctx).rawScore
    }
    expect(score('exact')).toBeGreaterThanOrEqual(score('direct'))
    expect(score('exact')).toBeGreaterThan(score('inferred'))
  })
})
