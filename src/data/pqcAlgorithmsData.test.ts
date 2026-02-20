import { describe, it, expect } from 'vitest'
import {
  getDateFromFilename,
  isPQC,
  isClassical,
  getPerformanceCategory,
  getSecurityLevelColor,
  getPerformanceColor,
  loadPQCAlgorithmsData,
  AlgorithmDetail,
} from './pqcAlgorithmsData'

describe('pqcAlgorithmsData helpers', () => {
  it('getDateFromFilename parses correctly', () => {
    expect(getDateFromFilename('pqc_reference_01102024.csv')).toEqual(new Date(2024, 0, 10))
    expect(getDateFromFilename('invalid_name.csv')).toBeNull()
    expect(getDateFromFilename('pqc_99999999.csv')).toBeNull() // invalid date 99/99/9999 returns null
  })

  it('categorizes PQC algorithms', () => {
    expect(isPQC({ family: 'KEM' } as AlgorithmDetail)).toBe(true)
    expect(isPQC({ family: 'Signature' } as AlgorithmDetail)).toBe(true)
    expect(isPQC({ family: 'Classical KEM' } as AlgorithmDetail)).toBe(false)
  })

  it('categorizes Classical algorithms', () => {
    expect(isClassical({ family: 'Classical KEM' } as AlgorithmDetail)).toBe(true)
    expect(isClassical({ family: 'Classical Sig' } as AlgorithmDetail)).toBe(true)
    expect(isClassical({ family: 'KEM' } as AlgorithmDetail)).toBe(false)
  })

  it('gets performance category', () => {
    expect(getPerformanceCategory('Baseline')).toBe('Moderate')
    expect(getPerformanceCategory('13x baseline')).toBe('Slow')
    expect(getPerformanceCategory('0.5x baseline')).toBe('Fast')
    expect(getPerformanceCategory('10x baseline')).toBe('Moderate')
    expect(getPerformanceCategory('10.0x baseline')).toBe('Moderate')
    expect(getPerformanceCategory('unknown')).toBe('Moderate')
  })

  it('gets security level color', () => {
    expect(getSecurityLevelColor(null)).toContain('bg-muted/50')
    expect(getSecurityLevelColor(1)).toContain('bg-primary/10')
    expect(getSecurityLevelColor(2)).toContain('bg-accent/10')
    expect(getSecurityLevelColor(3)).toContain('bg-success/10')
    expect(getSecurityLevelColor(4)).toContain('bg-warning/10')
    expect(getSecurityLevelColor(5)).toContain('bg-destructive/10')
  })

  it('gets performance color', () => {
    expect(getPerformanceColor('Fast')).toContain('bg-success/10')
    expect(getPerformanceColor('Moderate')).toContain('bg-warning/10')
    expect(getPerformanceColor('Slow')).toContain('bg-destructive/10')
  })

  it('loads PQC algorithms data', async () => {
    const data = await loadPQCAlgorithmsData()
    expect(data.length).toBeGreaterThan(0)
    // Check fields of the first element
    const first = data[0]
    expect(first).toHaveProperty('family')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('optimizationTarget')
    expect(first).toHaveProperty('type')

    // Call again to verify cachedData is returned
    const data2 = await loadPQCAlgorithmsData()
    expect(data2).toBe(data)
  })
})
