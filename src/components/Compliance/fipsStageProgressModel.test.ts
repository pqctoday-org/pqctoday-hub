// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  buildListingStageTrend,
  buildProductStageTimeline,
  currentStage,
  type InProcessMatch,
  type StagePoint,
} from './fipsStageProgressModel'
import type { CertificationXref, SoftwareItem } from '@/types/MigrateTypes'
import type { ComplianceRecord } from './types'

const REF = new Date(2026, 8, 26) // Sep 2026

function product(over: Partial<SoftwareItem>): SoftwareItem {
  return {
    productId: 'p',
    softwareName: 'P',
    pqcStatusCanonical: 'available',
    pqcCertified: 'none',
    ...over,
  } as SoftwareItem
}

function cert(over: Partial<CertificationXref>): CertificationXref {
  return {
    productId: 'p',
    softwareName: 'P',
    certType: 'ACVP',
    certId: 'A1',
    certVendor: 'V',
    certProduct: 'P',
    pqcAlgorithms: 'ML-KEM',
    certificationLevel: '',
    status: 'Active',
    certDate: '2025-03-10',
    certLink: '',
    ...over,
  }
}

const at = (points: StagePoint[], month: string): StagePoint =>
  points.find((p) => p.month === month) as StagePoint

describe('currentStage', () => {
  it('maps each verdict to its stage; CAVP is never "in progress"', () => {
    expect(currentStage('yes')).toBe('certified')
    expect(currentStage('in_progress')).toBe('in_progress')
    expect(currentStage('cavp')).toBe('cavp')
    expect(currentStage('none')).toBe('none')
    expect(currentStage('partial')).toBe('none')
  })
})

describe('buildProductStageTimeline', () => {
  it('moves a product up a band on each dated stage — the Luna K7 path', () => {
    const p = product({ productId: 'luna', softwareName: 'Luna', pqcCertified: 'in_progress' })
    const certs = new Map([['luna', [cert({ productId: 'luna', certDate: '2025-02-14' })]]])
    const matches: InProcessMatch[] = [
      { product_id: 'luna', list: 'IUT', module: 'Luna K7', date: '2025-07-29' },
    ]
    const { points, undated, universe } = buildProductStageTimeline(
      [p],
      certs,
      matches,
      REF,
      '2025-01'
    )
    expect(universe).toBe(1)
    expect(undated).toBe(0)
    expect(at(points, '2025-01').none).toBe(1)
    expect(at(points, '2025-02').cavp).toBe(1)
    expect(at(points, '2025-06').cavp).toBe(1)
    expect(at(points, '2025-07').in_progress).toBe(1)
    expect(at(points, '2026-09').in_progress).toBe(1)
  })

  it('never draws a product past its current verdict', () => {
    // A PQC certificate is linked, but the verdict is only `cavp` (e.g. the
    // certificate belongs to a sibling model): the chart must not say certified.
    const p = product({ pqcCertified: 'cavp' })
    const certs = new Map([
      [
        'p',
        [
          cert({ certDate: '2025-01-05' }),
          cert({ certType: 'FIPS 140-3', certId: '5450', certDate: '2025-05-01' }),
        ],
      ],
    ])
    const { points } = buildProductStageTimeline([p], certs, [], REF, '2025-01')
    expect(at(points, '2026-09').cavp).toBe(1)
    expect(at(points, '2026-09').certified).toBe(0)
  })

  it('counts a stage it cannot date instead of inventing a date', () => {
    const p = product({ pqcCertified: 'yes' }) // claims certified, no dated certificate
    const { points, undated } = buildProductStageTimeline([p], new Map(), [], REF, '2026-01')
    expect(undated).toBe(1)
    expect(at(points, '2026-09').none).toBe(1)
  })

  it('uses the earlier of NIST stage date and first sighting for a MIP entry', () => {
    const p = product({ pqcCertified: 'in_progress' })
    const matches: InProcessMatch[] = [
      { product_id: 'p', list: 'MIP', module: 'M', date: '2026-09-20', firstSeen: '2026-09-01' },
    ]
    const { points } = buildProductStageTimeline([p], new Map(), matches, REF, '2026-08')
    expect(at(points, '2026-08').none).toBe(1)
    expect(at(points, '2026-09').in_progress).toBe(1)
  })

  it('leaves out products that do not ship PQC', () => {
    const { universe } = buildProductStageTimeline(
      [
        product({ pqcStatusCanonical: 'none' }),
        product({ productId: 'q', pqcStatusCanonical: 'partial' }),
      ],
      new Map(),
      [],
      REF
    )
    expect(universe).toBe(1)
  })

  it('ignores a CAVP validation that covers no PQC', () => {
    const p = product({ pqcCertified: 'cavp' })
    const certs = new Map([['p', [cert({ pqcAlgorithms: 'No PQC Mechanisms Detected' })]]])
    const { undated } = buildProductStageTimeline([p], certs, [], REF, '2025-01')
    expect(undated).toBe(1)
  })
})

describe('buildListingStageTrend', () => {
  const rec = (over: Partial<ComplianceRecord>) =>
    ({ id: 'x', date: '2026-03-02', ...over }) as ComplianceRecord

  it('buckets NIST listings by stage and month', () => {
    const { points } = buildListingStageTrend(
      [
        rec({ type: 'ACVP', pqcCoverage: 'ML-DSA' }),
        rec({ type: 'ACVP', pqcCoverage: 'No PQC Mechanisms Detected' }), // not stage 1
        rec({ type: 'FIPS 140-3', pqcCoverage: 'No PQC Mechanisms Detected' }),
        rec({ type: 'FIPS 140-3', pqcCoverage: 'ML-KEM, ML-DSA' }),
        rec({ type: 'Common Criteria', pqcCoverage: 'ML-KEM' }), // not the FIPS track
      ],
      {
        iut: [
          { module: 'Luna K7', vendor: 'Thales', standard: 'FIPS 140-3', iutDate: '2026-03-15' },
        ],
        mip: [
          {
            module: 'M',
            vendor: 'V',
            standard: 'FIPS 140-3',
            stage: 'Review',
            stageDate: '2026-03-20',
          },
        ],
      },
      REF,
      '2026-01'
    )
    expect(at(points, '2026-03')).toEqual({
      month: '2026-03',
      none: 1,
      cavp: 1,
      in_progress: 2,
      certified: 1,
    })
    expect(at(points, '2026-02')).toEqual({
      month: '2026-02',
      none: 0,
      cavp: 0,
      in_progress: 0,
      certified: 0,
    })
  })
})
