// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock the CSV imports and softwareData before importing the module
vi.mock('./migrateData', () => ({
  softwareData: [
    {
      softwareName: 'OpenSSL',
      categoryId: 'CSC-001',
      categoryName: 'Cryptographic Libraries',
      infrastructureLayer: 'Libraries',
      pqcSupport: 'Yes (ML-KEM)',
      pqcCapabilityDescription: 'Full PQC support',
      licenseType: 'Open Source',
      license: 'Apache-2.0',
      latestVersion: '3.6.1',
      releaseDate: '2026-01-27',
      fipsValidated: 'Yes (FIPS 140-3)',
      pqcMigrationPriority: 'Critical',
      primaryPlatforms: 'Linux',
      targetIndustries: 'All',
      authoritativeSource: '',
      repositoryUrl: '',
      productBrief: '',
      sourceType: '',
      verificationStatus: 'Verified',
      lastVerifiedDate: '2026-02-13',
      migrationPhases: 'prepare,test,migrate',
    },
    {
      softwareName: 'BoringSSL',
      categoryId: 'CSC-001',
      categoryName: 'Cryptographic Libraries',
      infrastructureLayer: 'Libraries',
      pqcSupport: 'Yes (ML-KEM)',
      pqcCapabilityDescription: 'ML-KEM support',
      licenseType: 'Open Source',
      license: 'ISC',
      latestVersion: 'Latest',
      releaseDate: '2026-01-01',
      fipsValidated: 'No',
      pqcMigrationPriority: 'High',
      primaryPlatforms: 'Linux',
      targetIndustries: 'All',
      authoritativeSource: '',
      repositoryUrl: '',
      productBrief: '',
      sourceType: '',
      verificationStatus: 'Verified',
      lastVerifiedDate: '2026-02-13',
      migrationPhases: 'prepare,test',
    },
    {
      softwareName: 'StrongSwan',
      categoryId: 'CSC-010',
      categoryName: 'VPN and IPsec Software',
      infrastructureLayer: 'Network',
      pqcSupport: 'Yes (ML-KEM)',
      pqcCapabilityDescription: 'PQC VPN',
      licenseType: 'Open Source',
      license: 'GPL-2.0',
      latestVersion: '6.0',
      releaseDate: '2026-01-01',
      fipsValidated: 'No',
      pqcMigrationPriority: 'High',
      primaryPlatforms: 'Linux',
      targetIndustries: 'All',
      authoritativeSource: '',
      repositoryUrl: '',
      productBrief: '',
      sourceType: '',
      verificationStatus: 'Verified',
      lastVerifiedDate: '2026-02-13',
      migrationPhases: 'test,migrate',
    },
  ],
}))

// The module uses import.meta.glob which Vitest handles automatically
// We test the exported functions which consume the real CSV and softwareData via glob

describe('computeGapAnalysis', () => {
  let computeGapAnalysis: typeof import('./migrationWorkflowData').computeGapAnalysis

  beforeAll(async () => {
    const mod = await import('./migrationWorkflowData')
    computeGapAnalysis = mod.computeGapAnalysis
  })

  it('returns gap entries for all matrix categories', () => {
    const gaps = computeGapAnalysis()
    expect(gaps.length).toBeGreaterThan(0)
  })

  it('marks categories with software as having reference', () => {
    const gaps = computeGapAnalysis()
    // CSC-001 has 2 items in mock data (OpenSSL, BoringSSL)
    const cryptoLibs = gaps.find((g) => g.categoryId === 'CSC-001')
    if (cryptoLibs) {
      expect(cryptoLibs.hasSoftwareInReference).toBe(true)
      expect(cryptoLibs.softwareCount).toBe(2)
    }
  })

  it('marks categories with no software as gaps', () => {
    const gaps = computeGapAnalysis()
    // CSC-029 has 0 items in mock data
    const payment = gaps.find((g) => g.categoryId === 'CSC-029')
    if (payment) {
      expect(payment.hasSoftwareInReference).toBe(false)
      expect(payment.softwareCount).toBe(0)
    }
  })

  it('preserves urgency scores from matrix', () => {
    const gaps = computeGapAnalysis()
    const cryptoLibs = gaps.find((g) => g.categoryId === 'CSC-001')
    if (cryptoLibs) {
      expect(cryptoLibs.urgencyScore).toBe(59)
    }
  })

  it('preserves priority and timeline from matrix', () => {
    const gaps = computeGapAnalysis()
    const vpn = gaps.find((g) => g.categoryId === 'CSC-010')
    if (vpn) {
      expect(vpn.pqcPriority).toBe('High')
      expect(vpn.recommendedTimeline).toBe('2026-Q3')
    }
  })
})

describe('MIGRATION_STEPS', () => {
  let MIGRATION_STEPS: typeof import('./migrationWorkflowData').MIGRATION_STEPS

  beforeAll(async () => {
    const mod = await import('./migrationWorkflowData')
    MIGRATION_STEPS = mod.MIGRATION_STEPS
  })

  it('has exactly 7 steps', () => {
    expect(MIGRATION_STEPS).toHaveLength(7)
  })

  it('has sequential step numbers from 1 to 7', () => {
    MIGRATION_STEPS.forEach((step, i) => {
      expect(step.stepNumber).toBe(i + 1)
    })
  })

  it('each step has required fields', () => {
    for (const step of MIGRATION_STEPS) {
      expect(step.id).toBeTruthy()
      expect(step.title).toBeTruthy()
      expect(step.shortTitle).toBeTruthy()
      expect(step.description).toBeTruthy()
      expect(step.tasks.length).toBeGreaterThan(0)
      expect(step.frameworks.length).toBeGreaterThan(0)
      expect(step.relevantSoftwareCategories.length).toBeGreaterThan(0)
      expect(step.estimatedDuration).toBeTruthy()
    }
  })

  it('step IDs match expected values', () => {
    const ids = MIGRATION_STEPS.map((s) => s.id)
    expect(ids).toEqual(['assess', 'plan', 'preparation', 'test', 'migrate', 'launch', 'rampup'])
  })
})

describe('STEP_PHASE_COLORS', () => {
  let STEP_PHASE_COLORS: typeof import('./migrationWorkflowData').STEP_PHASE_COLORS
  let MIGRATION_STEPS: typeof import('./migrationWorkflowData').MIGRATION_STEPS

  beforeAll(async () => {
    const mod = await import('./migrationWorkflowData')
    STEP_PHASE_COLORS = mod.STEP_PHASE_COLORS
    MIGRATION_STEPS = mod.MIGRATION_STEPS
  })

  it('has color mapping for every step ID', () => {
    for (const step of MIGRATION_STEPS) {
      expect(STEP_PHASE_COLORS[step.id]).toBeTruthy()
    }
  })
})

describe('MIGRATION_REFERENCES', () => {
  let MIGRATION_REFERENCES: typeof import('./migrationWorkflowData').MIGRATION_REFERENCES

  beforeAll(async () => {
    const mod = await import('./migrationWorkflowData')
    MIGRATION_REFERENCES = mod.MIGRATION_REFERENCES
  })

  it('has references with valid URLs', () => {
    for (const ref of MIGRATION_REFERENCES) {
      expect(ref.url).toMatch(/^https?:\/\//)
      expect(ref.name).toBeTruthy()
      expect(ref.organization).toBeTruthy()
      expect(['Government', 'Industry']).toContain(ref.type)
    }
  })
})
