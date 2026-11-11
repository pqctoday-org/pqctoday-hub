// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { algorithmsData } from './algorithmsData'
import { standardizationDateEvidence, deprecationDateEvidence } from './transitionDates'
import { transitionDateSource } from '@/components/Algorithms/transitionGuidance'
import { selectTransitionsForCrypto } from '@/hooks/useAlgorithmTransitionsForAssessment'

describe('Transition event semantics and source precision', () => {
  it.each(['203', '204', '205'])(
    'uses the published FIPS%s day rather than an imputed January1',
    (fips) => {
      const date = standardizationDateEvidence(
        `2024-08-13 (FIPS ${fips} publication)`,
        '2024-08-13'
      )
      expect(date).toMatchObject({ precision: 'day', event: 'publication', iso: '2024-08-13' })
      expect(standardizationDateEvidence(`2024 (FIPS ${fips})`, '2024-01-01').iso).toBeUndefined()
    }
  )
  it('keeps year-only status useful without pretending it supplies an exact publication day', () => {
    expect(
      standardizationDateEvidence('Draft submitted 2025 (Final ~2027)', '2025-01-01')
    ).toMatchObject({
      precision: 'year',
      label: 'Draft submitted 2025 (Final ~2027)',
      iso: undefined,
    })
    expect(
      standardizationDateEvidence('2025-01-01 (declared publication)', '2025-01-01')
    ).toMatchObject({ precision: 'day', iso: '2025-01-01' })
  })
  it('represents NIST after-year boundaries without borrowing them for another region', () => {
    const date = deprecationDateEvidence(
      'After 2030 (Deprecated) / After 2035 (Disallowed)',
      undefined,
      'NIST'
    )
    expect(date.iso).toBeUndefined()
    expect(date.precision).toBe('year')
    expect(date.boundaries).toEqual([
      { event: 'deprecated', afterYear: 2030, effectiveFrom: '2031-01-01' },
      { event: 'disallowed', afterYear: 2035, effectiveFrom: '2036-01-01' },
    ])
    expect('2030-12-31' < date.boundaries![0].effectiveFrom).toBe(true)
    expect('2035-12-31' < date.boundaries![1].effectiveFrom).toBe(true)
    expect(transitionDateSource(date.label, 'NIST')).toBe('nist-ir-8547')
    expect(deprecationDateEvidence('2035 (Disallowed)', '2035-01-01', 'IETF').event).toBe(
      'source-label'
    )
    expect(
      deprecationDateEvidence('2035 (Disallowed)', '2035-01-01', 'IETF').boundaries
    ).toBeUndefined()
    expect(
      deprecationDateEvidence('2030-12-31 (will not be approved beyond)', '2030-12-31', 'ASD').iso
    ).toBe('2030-12-31')
  })
  it('never exposes imputed January1 days through the actual loader and assessment export objects', () => {
    for (const row of algorithmsData) {
      if (row.standardizationDateEvidence?.precision === 'year')
        expect(row.standardizationDateISO).toBeUndefined()
      if (
        row.deprecationDateEvidence?.precision === 'year' &&
        row.deprecationDateEvidence.event !== 'after-year-policy'
      )
        expect(row.deprecationDateISO?.endsWith('-01-01') ?? false).toBe(false)
    }
    const assessment = selectTransitionsForCrypto(['RSA-2048'], algorithmsData)
    expect(assessment).toHaveLength(1)
    expect(assessment[0].deprecationDate).toBe(
      algorithmsData.find((r) => r.classical === 'RSA' && r.keySize === '2048-bit')!.deprecationDate
    )
  })
})
