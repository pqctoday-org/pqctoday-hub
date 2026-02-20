import { describe, it, expect } from 'vitest'
import { computeAssessment } from './useAssessmentEngine'

describe('useAssessmentEngine / computeAssessment', () => {
  it('computes legacy assessment (no extended inputs)', () => {
    const input = {
      industry: 'Technology',
      currentCrypto: ['RSA-2048', 'AES-256'],
      dataSensitivity: ['medium'],
      complianceRequirements: ['HIPAA'],
      migrationStatus: 'unknown' as const,
    }

    const result = computeAssessment(input)
    expect(result.riskScore).toBeGreaterThan(0)
    expect(result.algorithmMigrations).toHaveLength(2)
    expect(result.executiveSummary).toBeUndefined()
  })

  it('computes extended assessment with critical values', () => {
    const input = {
      industry: 'Government & Defense',
      currentCrypto: ['RSA-2048', 'secp256k1', 'SHA-256', 'Kyber-768'],
      dataSensitivity: ['critical', 'high'],
      complianceRequirements: ['CNSA 2.0', 'FIPS 140-3'],
      migrationStatus: 'not-started' as const,
      dataRetention: ['10-25y', 'indefinite', '75y-plus', 'permanent'],
      cryptoAgility: 'hardcoded' as const,
      infrastructure: [
        'Cloud Storage',
        'HSM / Hardware security modules',
        'Legacy systems (10+ years old)',
      ],
      systemCount: '200-plus' as const,
      teamSize: '1-10' as const,
      vendorDependency: 'heavy-vendor' as const,
      timelinePressure: 'within-1y' as const,
      cryptoUseCases: ['TLS/HTTPS', 'Data-at-rest encryption', 'Satellite link encryption'],
    }

    const result = computeAssessment(input)
    expect(result.riskScore).toBeGreaterThan(70)
    expect(result.categoryScores).toBeDefined()
    expect(result.hndlRiskWindow?.isAtRisk).toBe(true)
    expect(result.migrationEffort).toBeDefined()
    expect(result.executiveSummary).toBeDefined()
  })

  it('computes extended assessment with low risk values', () => {
    const input = {
      industry: 'Other',
      currentCrypto: ['AES-256'],
      dataSensitivity: ['low'],
      complianceRequirements: [],
      migrationStatus: 'started' as const,
      dataRetention: ['under-1y', '2y'],
      cryptoAgility: 'fully-abstracted' as const,
      infrastructure: ['Mobile applications'],
      systemCount: '1-10' as const,
      teamSize: '200-plus' as const,
      vendorDependency: 'in-house' as const,
      timelinePressure: 'no-deadline' as const,
      cryptoUseCases: ['DNS/DNSSEC'],
    }

    const result = computeAssessment(input)
    expect(result.riskScore).toBeLessThan(50)
    expect(result.hndlRiskWindow?.isAtRisk).toBe(false)
  })

  it('triggers all default / fallback branch paths for ?? operators', () => {
    const input = {
      industry: 'Unknown-Industry',
      currentCrypto: ['made-up-algo'], // triggers algo ?? default
      dataSensitivity: ['made-up-sensitivity'], // triggers maxSensitivity fallback to 'low' and ?? 0
      complianceRequirements: ['made-up-framework'], // triggers framework missing list
      migrationStatus: 'unknown' as const,
      dataRetention: ['fake-retention-time'], // triggers DATA_RETENTION_YEARS ?? 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional invalid input for fallback testing
      cryptoAgility: 'fake-agility' as any, // triggers AGILITY ?? 0.7
      infrastructure: ['made-up-infra-123'], // triggers INFRA_COMPLEXITY ?? 5
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional invalid input for fallback testing
      systemCount: 'fake-system' as any, // triggers SCALE ?? 1.3
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional invalid input for fallback testing
      teamSize: 'fake-team' as any, // triggers TEAM ?? 0.6
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional invalid input for fallback testing
      vendorDependency: 'fake-vendor' as any, // triggers VENDOR ?? 10
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional invalid input for fallback testing
      timelinePressure: 'fake-timeline' as any, // triggers TIMELINE ?? 1.1
      cryptoUseCases: ['fake-use-case'], // triggers USE_CASE_WEIGHTS ?? 5
    }

    const result = computeAssessment(input)
    expect(result.categoryScores?.quantumExposure).toBeDefined()
    expect(result.categoryScores?.migrationComplexity).toBeDefined()
    expect(result.categoryScores?.regulatoryPressure).toBeDefined()
    expect(result.categoryScores?.organizationalReadiness).toBeDefined()
  })

  it('handles empty arrays / undefined extended inputs gracefully', () => {
    const input = {
      industry: 'Technology',
      currentCrypto: [],
      dataSensitivity: [],
      complianceRequirements: [],
      migrationStatus: 'planning' as const,
      dataRetention: [], // empty retention array
      infrastructure: [], // empty infra
      cryptoUseCases: [], // empty use cases
      // completely omitted timeline, systemCount, teamSize, agility
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional partial input for fallback testing
    const result = computeAssessment(input as any)
    expect(result.hndlRiskWindow).toBeUndefined()
  })

  it('tests various migration status branches', () => {
    const statuses = ['not-started', 'planning', 'started', 'unknown'] as const
    for (const st of statuses) {
      const result = computeAssessment({
        industry: 'Finance',
        currentCrypto: ['RSA-2048'],
        dataSensitivity: ['high'],
        complianceRequirements: ['PCI-DSS'],
        migrationStatus: st,
        systemCount: '51-200',
        teamSize: '11-50',
        timelinePressure: 'internal-deadline',
        vendorDependency: 'mixed',
      })
      expect(result.categoryScores?.organizationalReadiness).toBeDefined()
    }
  })

  it('tests remaining specific system scales and dependencies', () => {
    const result = computeAssessment({
      industry: 'Healthcare',
      currentCrypto: ['RSA-4096', 'ECDSA P-256', 'ECDSA P-384'],
      dataSensitivity: ['medium'],
      complianceRequirements: ['GDPR'],
      migrationStatus: 'started',
      systemCount: '11-50',
      teamSize: '51-200',
      vendorDependency: 'open-source',
      timelinePressure: 'within-2-3y',
      cryptoAgility: 'partially-abstracted',
      dataRetention: ['5-10y', '6y', '7y'],
    })
    expect(result.migrationEffort).toBeDefined()
    expect(result.categoryScores?.migrationComplexity).toBeDefined()
  })
})
