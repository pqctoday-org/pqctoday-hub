// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeAssessment } from './orchestrator'
import { computeMoscaResult, estimateMigrationYears } from './mosca'
import { getUrgencyTier, URGENCY_TIER_ORDER, URGENCY_TIERS } from './urgencyTiers'
import { buildTwoTrackPlan } from './twoTrack'
import { buildQRA } from './qra'
import type { AssessmentInput } from '../assessmentTypes'

/**
 * Regression tests for the Wave-4 A-Assess framework gap-closers:
 *   1. Mosca's Inequality (X + Y > Z)
 *   2. Urgency Tiers 1–4
 *   3. Two-Track sequencing (A: KEM/HNDL · B: signatures/PKI/HNFL)
 *   4. QRA structured builder + Maturity L0–4 self-rating
 *
 * All four are additive reads over the engine's existing AssessmentResult, so
 * the tests assert (a) correct derivation and (b) graceful degradation on
 * sparse inputs.
 */

const URGENT_INPUT: AssessmentInput = {
  industry: 'Government & Defense',
  currentCrypto: ['RSA-2048', 'ECDSA P-256', 'ECDH P-256'],
  dataSensitivity: ['critical'],
  dataRetention: ['25-plus'], // 30 years
  credentialLifetime: ['10-25y'], // 25 years
  complianceRequirements: ['CNSA 2.0'],
  migrationStatus: 'not-started',
  cryptoAgility: 'hardcoded',
  infrastructure: ['Hardware'],
  systemCount: '200-plus',
  country: 'United States',
}

const QUICK_INPUT: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: ['RSA-2048'],
  dataSensitivity: ['medium'],
  complianceRequirements: [],
  migrationStatus: 'started',
}

describe('Mosca inequality (gap-closer #1)', () => {
  it('returns a named X+Y>Z result with X, Y, Z and an urgent verdict for long-life secrets', () => {
    const m = computeMoscaResult(URGENT_INPUT)
    expect(m).toBeDefined()
    expect(m!.hndl).toBeDefined()
    // X = 30y retention, Y >= 1, Z = effective threat year
    expect(m!.hndl!.x).toBe(30)
    expect(m!.hndl!.y).toBeGreaterThanOrEqual(1)
    expect(m!.z).toBeGreaterThan(2024)
    expect(m!.hndl!.inequalityHolds).toBe(true)
    expect(m!.verdict).toBe('urgent')
    expect(m!.summary).toContain('X + Y > Z')
  })

  it('classifies short shelf-life + ready org as a regular adopter', () => {
    const m = computeMoscaResult({
      ...QUICK_INPUT,
      dataRetention: ['under-1y'],
    })
    expect(m).toBeDefined()
    expect(m!.verdict).toBe('regular')
    expect(m!.hndl!.inequalityHolds).toBe(false)
  })

  it('returns undefined when there is no shelf-life signal at all', () => {
    expect(computeMoscaResult(QUICK_INPUT)).toBeUndefined()
  })

  it('estimateMigrationYears is clamped to [1,5] and responds to readiness', () => {
    const fast = estimateMigrationYears({ ...QUICK_INPUT, cryptoAgility: 'fully-abstracted' })
    const slow = estimateMigrationYears(URGENT_INPUT)
    expect(fast).toBeGreaterThanOrEqual(1)
    expect(slow).toBeLessThanOrEqual(5)
    expect(slow).toBeGreaterThan(fast)
  })
})

describe('Urgency Tiers (gap-closer #2)', () => {
  it('maps scores to the four tiers at the riskLevel cut-points', () => {
    expect(getUrgencyTier(90).tier).toBe(1)
    expect(getUrgencyTier(70).tier).toBe(2)
    expect(getUrgencyTier(40).tier).toBe(3)
    expect(getUrgencyTier(10).tier).toBe(4)
  })

  it('clamps out-of-range scores', () => {
    expect(getUrgencyTier(150).tier).toBe(1)
    expect(getUrgencyTier(-5).tier).toBe(4)
  })

  it('tier score bands are contiguous and cover 0–100', () => {
    const ranges = URGENCY_TIER_ORDER.map((t) => URGENCY_TIERS[t].scoreRange)
    // Tier1 76-100, Tier2 56-75, Tier3 26-55, Tier4 0-25
    expect(ranges[0]).toEqual([76, 100])
    expect(ranges[3]).toEqual([0, 25])
    // No gaps between adjacent bands
    for (let i = 0; i < ranges.length - 1; i++) {
      expect(ranges[i][0]).toBe(ranges[i + 1][1] + 1)
    }
  })

  it('tier never contradicts the engine riskLevel', () => {
    const result = computeAssessment(URGENT_INPUT)
    const tier = getUrgencyTier(result.riskScore)
    if (result.riskLevel === 'critical') expect(tier.tier).toBe(1)
    if (result.riskLevel === 'low') expect(tier.tier).toBe(4)
  })
})

describe('Two-Track sequencing (gap-closer #4)', () => {
  it('splits effort into Track A (KEM) and Track B (signatures)', () => {
    const result = computeAssessment(URGENT_INPUT)
    const plan = buildTwoTrackPlan(URGENT_INPUT, result)
    expect(plan).toBeDefined()
    // ECDSA P-256 is a signing algo → Track B; RSA-2048/ECDH KEM-side → Track A.
    const trackBAlgos = plan!.trackB.effort.map((e) => e.algorithm)
    expect(trackBAlgos).toContain('ECDSA P-256')
    const trackAAlgos = plan!.trackA.effort.map((e) => e.algorithm)
    expect(trackAAlgos).toContain('ECDH P-256') // KEM-side → Track A
  })

  it('leads with Track A when HNDL is at risk', () => {
    const result = computeAssessment(URGENT_INPUT)
    const plan = buildTwoTrackPlan(URGENT_INPUT, result)!
    expect(plan.trackA.isAtRisk).toBe(true)
    expect(plan.leadTrack).toBe('A')
  })

  it('degrades to actions-only on quick-mode results', () => {
    const result = computeAssessment(QUICK_INPUT)
    const plan = buildTwoTrackPlan(QUICK_INPUT, result)
    expect(plan).toBeDefined()
    // Both tracks still receive cross-cutting actions even without effort items.
    expect(plan!.trackA.actions.length + plan!.trackB.actions.length).toBeGreaterThan(0)
  })
})

describe('QRA builder (gap-closer #3)', () => {
  it('assembles all five sections from a comprehensive result', () => {
    const result = computeAssessment(URGENT_INPUT)
    const qra = buildQRA(URGENT_INPUT, result)
    // 1. exec summary + tier
    expect(qra.execSummary.riskScore).toBe(result.riskScore)
    expect(qra.execSummary.tier.tier).toBeGreaterThanOrEqual(1)
    expect(qra.execSummary.text).toContain('Government & Defense')
    // 2. heatmap by domain
    expect(qra.heatmap.length).toBe(4)
    expect(qra.heatmap.map((c) => c.domain)).toContain('quantumExposure')
    // 3. prioritised backlog with owner assignment
    expect(qra.backlog.length).toBeGreaterThan(0)
    expect(qra.backlog[0].ownerLabel).toBeTruthy()
    // 4 + 5. regulatory gaps + compliance mapping
    expect(qra.complianceMapping.length).toBe(result.complianceImpacts.length)
    // bundled gap-closers
    expect(qra.mosca).toBeDefined()
    expect(qra.twoTrack).toBeDefined()
  })

  it('quick-mode results now produce a coarse heatmap (#2 assess→sim) without throwing', () => {
    const result = computeAssessment(QUICK_INPUT)
    const qra = buildQRA(QUICK_INPUT, result)
    // The legacy/quick path now emits coarse category scores, so the QRA heatmap
    // populates (previously empty) — the sim & report get a usable risk view even
    // from a short assessment.
    expect(qra.heatmap.length).toBeGreaterThan(0)
    expect(qra.backlog.length).toBeGreaterThan(0)
  })
})
