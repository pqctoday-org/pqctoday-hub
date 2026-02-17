import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useExecutiveData } from './useExecutiveData'
import type { ComplianceRecord } from '../components/Compliance/types'
import type { AssessmentResult } from './useAssessmentEngine'

vi.mock('../data/threatsData', () => ({
  threatsData: [
    { industry: 'Finance', criticality: 'Critical', threatId: 'T1' },
    { industry: 'Finance', criticality: 'High', threatId: 'T2' },
    { industry: 'Healthcare', criticality: 'Medium', threatId: 'T3' },
    { industry: 'Government', criticality: 'Low', threatId: 'T4' },
  ],
}))

vi.mock('../data/algorithmsData', () => ({
  algorithmsData: [
    { classical: 'RSA-2048', pqc: 'ML-KEM-768' },
    { classical: 'ECDSA', pqc: 'ML-DSA-65' },
    { classical: 'N/A', pqc: 'ML-KEM-512' },
  ],
}))

vi.mock('../data/migrateData', () => ({
  softwareData: [{ softwareName: 'Tool1' }, { softwareName: 'Tool2' }],
}))

describe('useExecutiveData', () => {
  it('computes baseline metrics from static data', () => {
    const { result } = renderHook(() => useExecutiveData())

    expect(result.current.totalThreats).toBe(4)
    expect(result.current.criticalThreats).toBe(2)
    expect(result.current.totalAlgorithms).toBe(3)
    expect(result.current.algorithmsAtRisk).toBe(2)
    expect(result.current.migrationToolsAvailable).toBe(2)
  })

  it('falls back to 3 active standards when no compliance data provided', () => {
    const { result } = renderHook(() => useExecutiveData())

    expect(result.current.activeStandards).toBe(3)
  })

  it('counts distinct active compliance framework types', () => {
    const complianceData: ComplianceRecord[] = [
      {
        id: '1',
        source: 'NIST',
        date: '2025-01-01',
        link: '',
        type: 'FIPS 140-3',
        status: 'Active',
        pqcCoverage: false,
        productName: 'P1',
        productCategory: 'C1',
        vendor: 'V1',
      },
      {
        id: '2',
        source: 'NIST',
        date: '2025-01-01',
        link: '',
        type: 'ACVP',
        status: 'Active',
        pqcCoverage: false,
        productName: 'P2',
        productCategory: 'C2',
        vendor: 'V2',
      },
      {
        id: '3',
        source: 'Common Criteria',
        date: '2025-01-01',
        link: '',
        type: 'Common Criteria',
        status: 'Active',
        pqcCoverage: false,
        productName: 'P3',
        productCategory: 'C3',
        vendor: 'V3',
      },
      {
        id: '4',
        source: 'ENISA',
        date: '2025-01-01',
        link: '',
        type: 'EUCC',
        status: 'Revoked',
        pqcCoverage: false,
        productName: 'P4',
        productCategory: 'C4',
        vendor: 'V4',
      },
    ]

    const { result } = renderHook(() => useExecutiveData(complianceData))

    // Only 3 types are Active (FIPS 140-3, ACVP, Common Criteria); EUCC is Revoked
    expect(result.current.activeStandards).toBe(3)
  })

  it('generates static priority actions without assessment', () => {
    const { result } = renderHook(() => useExecutiveData())

    expect(result.current.topActions).toHaveLength(5)
    expect(result.current.topActions[0].link).toBe('/threats')
    expect(result.current.topActions[1].action).toContain('2 classical algorithms')
  })

  it('generates risk narrative', () => {
    const { result } = renderHook(() => useExecutiveData())

    expect(result.current.riskNarrative).toContain('2 critical')
    expect(result.current.riskNarrative).toContain('3 industries')
    expect(result.current.riskNarrative).toContain('2 PQC-ready software tools')
  })

  it('returns null org metrics without assessment', () => {
    const { result } = renderHook(() => useExecutiveData())

    expect(result.current.orgRiskScore).toBeNull()
    expect(result.current.orgRiskLevel).toBeNull()
  })

  it('overlays assessment data when provided', () => {
    const assessment: AssessmentResult = {
      riskScore: 72,
      riskLevel: 'high',
      algorithmMigrations: [],
      complianceImpacts: [],
      recommendedActions: [
        { priority: 1, action: 'Migrate RSA', category: 'immediate', relatedModule: 'PKI' },
        { priority: 2, action: 'Review compliance', category: 'short-term', relatedModule: '' },
        { priority: 3, action: 'Train team', category: 'long-term', relatedModule: '' },
      ],
      narrative: 'Your org risk is high.',
    }

    const { result } = renderHook(() => useExecutiveData(undefined, assessment))

    expect(result.current.orgRiskScore).toBe(72)
    expect(result.current.orgRiskLevel).toBe('high')
    expect(result.current.topActions).toHaveLength(3)
    expect(result.current.topActions[0].action).toBe('Migrate RSA')
    expect(result.current.riskNarrative).toContain('Your org risk is high.')
  })
})
