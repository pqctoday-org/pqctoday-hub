import { describe, it, expect } from 'vitest'
import {
  computeAssessment,
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
  VULNERABLE_ALGORITHMS,
} from './useAssessmentEngine'
import type { AssessmentInput } from './useAssessmentEngine'

const baseInput: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: ['AES-256'],
  dataSensitivity: ['low'],
  complianceRequirements: [],
  migrationStatus: 'started',
}

describe('computeAssessment', () => {
  describe('risk score calculation', () => {
    it('returns low risk for a safe baseline', () => {
      // Technology (15) + AES-256 (not vulnerable, +0) + low (0) + no compliance + started (-20) = -5 → clamped to 0
      const result = computeAssessment(baseInput)
      expect(result.riskScore).toBeGreaterThanOrEqual(0)
      expect(result.riskScore).toBeLessThanOrEqual(30)
      expect(result.riskLevel).toBe('low')
    })

    it('adds points per vulnerable algorithm with weighted scoring', () => {
      const withNone = computeAssessment({
        ...baseInput,
        currentCrypto: ['AES-256'],
        migrationStatus: 'planning',
      })
      const withOne = computeAssessment({
        ...baseInput,
        currentCrypto: ['AES-256', 'RSA-2048'],
        migrationStatus: 'planning',
      })
      const withTwo = computeAssessment({
        ...baseInput,
        currentCrypto: ['AES-256', 'RSA-2048', 'ECDSA P-256'],
        migrationStatus: 'planning',
      })
      expect(withOne.riskScore).toBeGreaterThan(withNone.riskScore)
      expect(withTwo.riskScore).toBeGreaterThan(withOne.riskScore)
    })

    it('applies industry-specific base scores', () => {
      const gov = computeAssessment({ ...baseInput, industry: 'Government & Defense' })
      const edu = computeAssessment({ ...baseInput, industry: 'Education' })
      expect(gov.riskScore).toBeGreaterThan(edu.riskScore)
    })

    it('defaults unknown industry to 10', () => {
      const result = computeAssessment({ ...baseInput, industry: 'SomeNewIndustry' })
      const other = computeAssessment({ ...baseInput, industry: 'Other' })
      expect(result.riskScore).toBe(other.riskScore)
    })

    it('adds data sensitivity scores correctly', () => {
      // Use a higher baseline so scores don't clamp to 0
      const sensInput = { ...baseInput, migrationStatus: 'planning' as const }
      const low = computeAssessment({ ...sensInput, dataSensitivity: ['low'] })
      const medium = computeAssessment({ ...sensInput, dataSensitivity: ['medium'] })
      const high = computeAssessment({ ...sensInput, dataSensitivity: ['high'] })
      const critical = computeAssessment({ ...sensInput, dataSensitivity: ['critical'] })
      expect(medium.riskScore).toBeGreaterThan(low.riskScore)
      expect(high.riskScore).toBeGreaterThan(medium.riskScore)
      expect(critical.riskScore).toBeGreaterThan(high.riskScore)
    })

    it('adds 8 points per PQC-required compliance framework', () => {
      // Use a higher baseline so scores don't clamp to 0
      const compInput = { ...baseInput, migrationStatus: 'planning' as const }
      const none = computeAssessment({ ...compInput, complianceRequirements: [] })
      const one = computeAssessment({ ...compInput, complianceRequirements: ['FIPS 140-3'] })
      const two = computeAssessment({
        ...compInput,
        complianceRequirements: ['FIPS 140-3', 'CNSA 2.0'],
      })
      expect(one.riskScore - none.riskScore).toBe(8)
      expect(two.riskScore - one.riskScore).toBe(8)
    })

    it('does not add score for frameworks that do not require PQC', () => {
      const none = computeAssessment({ ...baseInput, complianceRequirements: [] })
      const pci = computeAssessment({ ...baseInput, complianceRequirements: ['PCI DSS'] })
      expect(pci.riskScore).toBe(none.riskScore)
    })

    it('applies migration status adjustments', () => {
      const started = computeAssessment({ ...baseInput, migrationStatus: 'started' })
      const planning = computeAssessment({ ...baseInput, migrationStatus: 'planning' })
      const notStarted = computeAssessment({ ...baseInput, migrationStatus: 'not-started' })
      const unknown = computeAssessment({ ...baseInput, migrationStatus: 'unknown' })
      expect(started.riskScore).toBeLessThan(planning.riskScore)
      expect(planning.riskScore).toBeLessThan(notStarted.riskScore)
      expect(notStarted.riskScore).toBeLessThan(unknown.riskScore)
    })

    it('clamps score to max 100', () => {
      const maxInput: AssessmentInput = {
        industry: 'Government & Defense',
        currentCrypto: AVAILABLE_ALGORITHMS,
        dataSensitivity: ['critical'],
        complianceRequirements: AVAILABLE_COMPLIANCE,
        migrationStatus: 'unknown',
      }
      const result = computeAssessment(maxInput)
      expect(result.riskScore).toBe(100)
    })

    it('clamps score to min 0', () => {
      const result = computeAssessment(baseInput)
      expect(result.riskScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('risk level thresholds', () => {
    it('returns low for scores 0-30', () => {
      const result = computeAssessment(baseInput)
      expect(result.riskScore).toBeLessThanOrEqual(30)
      expect(result.riskLevel).toBe('low')
    })

    it('returns medium for scores 31-60', () => {
      // Technology (15) + RSA-2048 (12) + medium (5) + planning (-10) = 22 — still low
      // Technology (15) + RSA-2048 (12) + RSA-4096 (12) + medium (5) + not-started (10) = 54
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048', 'RSA-4096'],
        dataSensitivity: ['medium'],
        migrationStatus: 'not-started',
      })
      expect(result.riskScore).toBeGreaterThan(30)
      expect(result.riskScore).toBeLessThanOrEqual(60)
      expect(result.riskLevel).toBe('medium')
    })

    it('returns high for scores 61-80', () => {
      // Government (30) + RSA-2048 (12) + ECDSA P-256 (12) + high (15) + not-started (10) = 79
      const result = computeAssessment({
        ...baseInput,
        industry: 'Government & Defense',
        currentCrypto: ['RSA-2048', 'ECDSA P-256'],
        dataSensitivity: ['high'],
        migrationStatus: 'not-started',
      })
      expect(result.riskScore).toBeGreaterThan(60)
      expect(result.riskScore).toBeLessThanOrEqual(80)
      expect(result.riskLevel).toBe('high')
    })

    it('returns critical for scores above 80', () => {
      const result = computeAssessment({
        ...baseInput,
        industry: 'Government & Defense',
        currentCrypto: ['RSA-2048', 'ECDSA P-256', 'ECDH'],
        dataSensitivity: ['critical'],
        migrationStatus: 'unknown',
      })
      expect(result.riskScore).toBeGreaterThan(80)
      expect(result.riskLevel).toBe('critical')
    })
  })

  describe('algorithm migrations', () => {
    it('marks vulnerable algorithms correctly', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048', 'AES-256'],
      })
      const rsa = result.algorithmMigrations.find((a) => a.classical === 'RSA-2048')
      const aes = result.algorithmMigrations.find((a) => a.classical === 'AES-256')
      expect(rsa?.quantumVulnerable).toBe(true)
      expect(rsa?.urgency).toBe('immediate')
      expect(aes?.quantumVulnerable).toBe(false)
      expect(aes?.urgency).toBe('long-term')
    })

    it('provides PQC replacement for each algorithm', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048'],
      })
      expect(result.algorithmMigrations[0].replacement).toContain('ML-KEM')
    })

    it('handles unknown algorithms gracefully', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['UnknownAlgo'],
      })
      expect(result.algorithmMigrations[0].quantumVulnerable).toBe(false)
      expect(result.algorithmMigrations[0].notes).toContain('not in database')
      expect(result.algorithmMigrations[0].replacement).toContain('review manually')
    })

    it('returns one migration entry per selected algorithm', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048', 'ECDSA P-256', 'AES-256'],
      })
      expect(result.algorithmMigrations).toHaveLength(3)
    })
  })

  describe('compliance impacts', () => {
    it('identifies frameworks requiring PQC', () => {
      const result = computeAssessment({
        ...baseInput,
        complianceRequirements: ['CNSA 2.0', 'PCI DSS'],
      })
      const cnsa = result.complianceImpacts.find((c) => c.framework === 'CNSA 2.0')
      const pci = result.complianceImpacts.find((c) => c.framework === 'PCI DSS')
      expect(cnsa?.requiresPQC).toBe(true)
      expect(pci?.requiresPQC).toBe(false)
    })

    it('includes deadline information', () => {
      const result = computeAssessment({
        ...baseInput,
        complianceRequirements: ['FIPS 140-3'],
      })
      expect(result.complianceImpacts[0].deadline).toContain('2030')
    })

    it('handles unknown frameworks gracefully', () => {
      const result = computeAssessment({
        ...baseInput,
        complianceRequirements: ['UnknownFramework'],
      })
      expect(result.complianceImpacts[0].requiresPQC).toBe(false)
      expect(result.complianceImpacts[0].notes).toContain('not in database')
    })
  })

  describe('recommended actions', () => {
    it('recommends migration when vulnerable algorithms present', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048', 'ECDSA P-256'],
      })
      const migrationAction = result.recommendedActions.find((a) =>
        a.action.includes('quantum-vulnerable')
      )
      expect(migrationAction).toBeDefined()
      expect(migrationAction?.category).toBe('immediate')
      expect(migrationAction?.action).toContain('2')
    })

    it('recommends HNDL protection for high/critical sensitivity', () => {
      const result = computeAssessment({
        ...baseInput,
        dataSensitivity: ['critical'],
      })
      const hndlAction = result.recommendedActions.find((a) => a.action.includes('HNDL'))
      expect(hndlAction).toBeDefined()
      expect(hndlAction?.category).toBe('immediate')
    })

    it('does not recommend HNDL for low/medium sensitivity', () => {
      const result = computeAssessment({
        ...baseInput,
        dataSensitivity: ['low'],
      })
      const hndlAction = result.recommendedActions.find((a) => a.action.includes('HNDL'))
      expect(hndlAction).toBeUndefined()
    })

    it('recommends compliance review when PQC frameworks present', () => {
      const result = computeAssessment({
        ...baseInput,
        complianceRequirements: ['FIPS 140-3', 'CNSA 2.0'],
      })
      const complianceAction = result.recommendedActions.find((a) =>
        a.action.includes('FIPS 140-3')
      )
      expect(complianceAction).toBeDefined()
      expect(complianceAction?.action).toContain('CNSA 2.0')
    })

    it('recommends crypto inventory when migration not started', () => {
      const result = computeAssessment({
        ...baseInput,
        migrationStatus: 'not-started',
      })
      const inventoryAction = result.recommendedActions.find((a) =>
        a.action.includes('cryptographic asset inventory')
      )
      expect(inventoryAction).toBeDefined()
    })

    it('always includes awareness and evaluation actions', () => {
      const result = computeAssessment(baseInput)
      const awareness = result.recommendedActions.find((a) => a.action.includes('awareness'))
      const evaluate = result.recommendedActions.find((a) => a.action.includes('Evaluate'))
      expect(awareness).toBeDefined()
      expect(evaluate).toBeDefined()
    })

    it('assigns sequential priority numbers', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048'],
        dataSensitivity: ['critical'],
        complianceRequirements: ['FIPS 140-3'],
        migrationStatus: 'not-started',
      })
      const priorities = result.recommendedActions.map((a) => a.priority)
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBe(priorities[i - 1] + 1)
      }
    })
  })

  describe('narrative generation', () => {
    it('includes industry name and score', () => {
      const result = computeAssessment(baseInput)
      expect(result.narrative).toContain('Technology')
      expect(result.narrative).toContain('/100')
    })

    it('mentions vulnerable algorithms when present', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['RSA-2048'],
      })
      expect(result.narrative).toContain('quantum-vulnerable')
    })

    it('mentions safe algorithms when none are vulnerable', () => {
      const result = computeAssessment({
        ...baseInput,
        currentCrypto: ['AES-256'],
      })
      expect(result.narrative).toContain('do not include quantum-vulnerable')
    })

    it('mentions HNDL for high sensitivity data', () => {
      const result = computeAssessment({
        ...baseInput,
        dataSensitivity: ['critical'],
      })
      expect(result.narrative).toContain('Harvest Now, Decrypt Later')
    })

    it('mentions compliance frameworks when PQC is required', () => {
      const result = computeAssessment({
        ...baseInput,
        complianceRequirements: ['FIPS 140-3'],
      })
      expect(result.narrative).toContain('compliance framework')
      expect(result.narrative).toContain('PQC adoption')
    })

    it('includes migration status context', () => {
      const started = computeAssessment({ ...baseInput, migrationStatus: 'started' })
      expect(started.narrative).toContain('already begun')

      const notStarted = computeAssessment({ ...baseInput, migrationStatus: 'not-started' })
      expect(notStarted.narrative).toContain('not yet started')
    })
  })

  describe('generatedAt timestamp', () => {
    it('returns a valid ISO 8601 timestamp', () => {
      const result = computeAssessment(baseInput)
      expect(result.generatedAt).toBeDefined()
      expect(() => new Date(result.generatedAt)).not.toThrow()
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt)
    })
  })

  describe('exported constants', () => {
    it('exports all industry names', () => {
      expect(AVAILABLE_INDUSTRIES).toContain('Finance & Banking')
      expect(AVAILABLE_INDUSTRIES).toContain('Government & Defense')
      expect(AVAILABLE_INDUSTRIES).toContain('Education')
      expect(AVAILABLE_INDUSTRIES.length).toBeGreaterThanOrEqual(10)
    })

    it('exports all algorithm names', () => {
      expect(AVAILABLE_ALGORITHMS).toContain('RSA-2048')
      expect(AVAILABLE_ALGORITHMS).toContain('AES-256')
      expect(AVAILABLE_ALGORITHMS).toContain('SHA-3')
    })

    it('exports all compliance framework names', () => {
      expect(AVAILABLE_COMPLIANCE).toContain('FIPS 140-3')
      expect(AVAILABLE_COMPLIANCE).toContain('HIPAA')
    })

    it('exports vulnerable algorithms derived from the DB', () => {
      expect(VULNERABLE_ALGORITHMS.has('RSA-2048')).toBe(true)
      expect(VULNERABLE_ALGORITHMS.has('ECDSA P-256')).toBe(true)
      expect(VULNERABLE_ALGORITHMS.has('AES-256')).toBe(false)
      expect(VULNERABLE_ALGORITHMS.has('SHA-256')).toBe(false)
      expect(VULNERABLE_ALGORITHMS.size).toBe(9)
    })
  })
})
