// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeCompositeScoreWithBoosts, computeQuantumExposure } from './scoring'
import type { AssessmentInput, CategoryScores } from '../assessmentTypes'

/**
 * Regression tests for the scoring engine paths added / modified during the
 * April 2026 audit sweep:
 *   - `computeCompositeScoreWithBoosts` must return each situational boost
 *     that fires (so the Report can attribute score inflation).
 *   - `computeQuantumExposure` must honour the `currentCryptoCategories`
 *     fallback when no specific algorithms were supplied (Fix 3 rev.).
 */

const BASE_CATEGORIES: CategoryScores = {
  quantumExposure: 50,
  migrationComplexity: 50,
  regulatoryPressure: 50,
  organizationalReadiness: 50,
}

describe('computeCompositeScoreWithBoosts', () => {
  it('returns zero boosts for a clean profile', () => {
    const input: AssessmentInput = {
      industry: 'Technology',
      currentCrypto: ['RSA-2048'],
      dataSensitivity: ['medium'],
      complianceRequirements: [],
      migrationStatus: 'started',
    }
    const res = computeCompositeScoreWithBoosts(BASE_CATEGORIES, input)
    expect(res.boosts).toEqual([])
    expect(res.boostFactor).toBe(1.0)
    expect(res.score).toBe(res.preBoostScore)
  })

  it('fires HNDL urgency boost on critical + long retention + not started', () => {
    const input: AssessmentInput = {
      industry: 'Healthcare',
      currentCrypto: ['RSA-2048'],
      dataSensitivity: ['critical'],
      dataRetention: ['25-plus'],
      complianceRequirements: [],
      migrationStatus: 'not-started',
    }
    const res = computeCompositeScoreWithBoosts(BASE_CATEGORIES, input)
    expect(res.boosts.some((b) => b.id === 'hndl-urgency')).toBe(true)
    expect(res.score).toBeGreaterThan(res.preBoostScore)
  })

  it('fires HNFL urgency boost on signing algo + long credential lifetime + not started', () => {
    const input: AssessmentInput = {
      industry: 'Finance & Banking',
      currentCrypto: ['ECDSA P-256'], // signing algo
      dataSensitivity: ['high'],
      credentialLifetime: ['10-25y'],
      complianceRequirements: [],
      migrationStatus: 'not-started',
    }
    const res = computeCompositeScoreWithBoosts(BASE_CATEGORIES, input)
    expect(res.boosts.some((b) => b.id === 'hnfl-urgency')).toBe(true)
  })

  it('fires CNSA regulatory boost for Gov/Defense + CNSA 2.0 + not started', () => {
    const input: AssessmentInput = {
      industry: 'Government & Defense',
      currentCrypto: ['RSA-2048'],
      dataSensitivity: ['high'],
      complianceRequirements: ['CNSA 2.0'],
      migrationStatus: 'not-started',
    }
    const res = computeCompositeScoreWithBoosts(BASE_CATEGORIES, input)
    expect(res.boosts.some((b) => b.id === 'cnsa-regulatory')).toBe(true)
  })

  it('fires migration-inertia boost for hardcoded + HSM/Legacy infra', () => {
    const input: AssessmentInput = {
      industry: 'Finance & Banking',
      currentCrypto: ['RSA-2048'],
      dataSensitivity: ['medium'],
      complianceRequirements: [],
      migrationStatus: 'planning',
      cryptoAgility: 'hardcoded',
      infrastructure: ['HSM / Hardware security modules'],
    }
    const res = computeCompositeScoreWithBoosts(BASE_CATEGORIES, input)
    expect(res.boosts.some((b) => b.id === 'migration-inertia')).toBe(true)
  })

  it('caps cumulative boost factor at 1.20x', () => {
    // Fire all four boost conditions simultaneously
    const input: AssessmentInput = {
      industry: 'Government & Defense',
      currentCrypto: ['ECDSA P-256'],
      dataSensitivity: ['critical'],
      dataRetention: ['25-plus'],
      credentialLifetime: ['25-plus'],
      complianceRequirements: ['CNSA 2.0'],
      migrationStatus: 'not-started',
      cryptoAgility: 'hardcoded',
      infrastructure: ['HSM / Hardware security modules'],
    }
    const res = computeCompositeScoreWithBoosts(BASE_CATEGORIES, input)
    expect(res.boosts.length).toBe(4)
    // Sum of deltas = 0.08 + 0.06 + 0.04 + 0.04 = 0.22, but capped at 0.20
    expect(res.boostFactor).toBeCloseTo(1.2, 5)
  })

  it('never emits a score above 100 even with max boost', () => {
    const topCategories: CategoryScores = {
      quantumExposure: 100,
      migrationComplexity: 100,
      regulatoryPressure: 100,
      organizationalReadiness: 100,
    }
    const input: AssessmentInput = {
      industry: 'Government & Defense',
      currentCrypto: ['ECDSA P-256'],
      dataSensitivity: ['critical'],
      dataRetention: ['25-plus'],
      credentialLifetime: ['25-plus'],
      complianceRequirements: ['CNSA 2.0'],
      migrationStatus: 'not-started',
      cryptoAgility: 'hardcoded',
      infrastructure: ['HSM / Hardware security modules'],
    }
    const res = computeCompositeScoreWithBoosts(topCategories, input)
    expect(res.score).toBeLessThanOrEqual(100)
  })
})

describe('computeQuantumExposure — categories fallback', () => {
  it('uses cryptoCategories when currentCrypto is empty (Fix 3 rev.)', () => {
    const input: AssessmentInput = {
      industry: 'Finance & Banking',
      currentCrypto: [],
      currentCryptoCategories: ['Signatures', 'Key Exchange'],
      dataSensitivity: ['high'],
      complianceRequirements: [],
      migrationStatus: 'planning',
    }
    const exposure = computeQuantumExposure(input, 0)
    // Categories add +10 each for Signatures + Key Exchange → 20 algo-score
    // contribution floor. Plus sensitivity + retention paths.
    expect(exposure).toBeGreaterThan(10)
  })

  it('returns a lower score when only Symmetric + Hash are selected', () => {
    const input: AssessmentInput = {
      industry: 'Technology',
      currentCrypto: [],
      currentCryptoCategories: ['Symmetric Encryption', 'Hash & MAC'],
      dataSensitivity: ['medium'],
      complianceRequirements: [],
      migrationStatus: 'planning',
    }
    const exposure = computeQuantumExposure(input, 0)
    const inputWithSigs: AssessmentInput = {
      ...input,
      currentCryptoCategories: ['Signatures', 'Key Exchange'],
    }
    const exposureWithSigs = computeQuantumExposure(inputWithSigs, 0)
    // Signatures + Key Exchange should push exposure higher than Symmetric + Hash alone
    expect(exposureWithSigs).toBeGreaterThan(exposure)
  })
})
