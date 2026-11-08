// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  buildListingStageTrend,
  buildProductStageTimeline,
  currentStage,
  fipsTrackLine,
  FIPS_STAGE_LABEL,
  shipsPqc,
  type InProcessMatch,
  type StagePoint,
  unestablishedCaption,
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
    classicalOnly: false,
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

  it('does not count a pre-shared-key-only product as shipping PQC', () => {
    const psk = product({ productId: 'psk', pqcStatusCanonical: 'psk' })
    expect(shipsPqc(psk)).toBe(false)
    expect(shipsPqc(product({ pqcStatusCanonical: 'available' }))).toBe(true)
    expect(shipsPqc(product({ pqcStatusCanonical: 'partial' }))).toBe(true)
    const { universe } = buildProductStageTimeline(
      [product({ productId: 'a', pqcStatusCanonical: 'available' }), psk],
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

  it('never treats a Common Criteria evaluation as FIPS module validation', () => {
    const p = product({ pqcCertified: 'yes' })
    const certs = new Map([
      ['p', [cert({ certType: 'Common Criteria', certId: 'CC1', pqcAlgorithms: 'ML-KEM' })]],
    ])
    const { points, undated } = buildProductStageTimeline([p], certs, [], REF, '2025-01')
    expect(undated).toBe(1)
    expect(at(points, '2026-09').certified).toBe(0)
  })
})

describe('fipsTrackLine', () => {
  it("prints the Products view's latest-month counts under the chart's own stage labels", () => {
    const timeline = buildProductStageTimeline(
      [
        product({ productId: 'a', pqcCertified: 'cavp' }),
        product({ productId: 'b', pqcCertified: 'cavp' }),
        product({ productId: 'c', pqcCertified: 'in_progress' }),
        product({ productId: 'd', pqcCertified: 'yes' }),
        product({ productId: 'e', pqcCertified: 'none' }),
      ],
      new Map([
        ['a', [cert({ productId: 'a', certDate: '2025-02-01' })]],
        ['b', [cert({ productId: 'b', certDate: '2026-09-02' })]],
        ['c', [cert({ productId: 'c', certDate: '2025-02-01' })]],
        [
          'd',
          [
            cert({ productId: 'd', certDate: '2025-02-01' }),
            cert({ productId: 'd', certType: 'FIPS 140-3', certId: '1', certDate: '2025-06-01' }),
          ],
        ],
      ]),
      [{ product_id: 'c', list: 'IUT', module: 'M', date: '2025-08-01' }],
      REF,
      '2025-01'
    )
    // Sep 2026: a and b at CAVP (b's validation is in the month), c in progress, d certified,
    // e (no validation) is the 'none' the line leaves out.
    expect(timeline.points[timeline.points.length - 1]).toMatchObject({
      none: 1,
      cavp: 2,
      in_progress: 1,
      certified: 1,
    })
    expect(fipsTrackLine(timeline)).toBe(
      'FIPS 140-3 track: prerequisite met (CAVP) 2 · in progress (NIST IUT / MIP) 1 · certified 1.'
    )
  })

  it('uses the shared Products labels, and omits the none stage', () => {
    const line = fipsTrackLine({
      points: [{ month: '2026-09', none: 500, cavp: 61, in_progress: 5, certified: 20 }],
      undated: 0,
      universe: 586,
    })
    expect(line).toBe(
      'FIPS 140-3 track: prerequisite met (CAVP) 61 · in progress (NIST IUT / MIP) 5 · certified 20.'
    )
    const lower = (label: string) => `${label.charAt(0).toLowerCase()}${label.slice(1)} `
    expect(line).toContain(lower(FIPS_STAGE_LABEL.products.cavp))
    expect(line).toContain(lower(FIPS_STAGE_LABEL.products.in_progress))
    expect(line).toContain(lower(FIPS_STAGE_LABEL.products.certified))
    expect(line).not.toContain(FIPS_STAGE_LABEL.products.none.toLowerCase())
    expect(line).not.toContain('500')
  })

  it('is null when there is no timeline or it has no month', () => {
    expect(fipsTrackLine(null)).toBeNull()
    expect(fipsTrackLine({ points: [], undated: 0, universe: 0 })).toBeNull()
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

  it('keeps unread, pending, name-match, flag-only and unrecognised-name certificates out of both FIPS bands', () => {
    // Only a read algorithm list that names no PQC may count as "no PQC", and
    // only a named algorithm in the validated scope may count as "with PQC".
    const { points, unestablished } = buildListingStageTrend(
      [
        rec({ type: 'FIPS 140-3', pqcCoverage: 'No PQC Mechanisms Detected' }), // reviewed, no PQC
        rec({ type: 'FIPS 140-3', pqcCoverage: 'ML-KEM' }), // reviewed, PQC named
        rec({ type: 'FIPS 140-3', pqcCoverage: '' }), // not read
        rec({ type: 'FIPS 140-3', pqcCoverage: 'Not Yet Analyzed' }), // not read
        rec({ type: 'FIPS 140-3', pqcCoverage: 'Pending Check...' }), // pending
        rec({ type: 'FIPS 140-3', pqcCoverage: 'Potentially PQC (Name Match)' }), // heuristic
        rec({ type: 'FIPS 140-3', pqcCoverage: true }), // flag, no names
        rec({ type: 'FIPS 140-3', pqcCoverage: 'HQC' }), // named, not a recognised PQC name
      ],
      null,
      REF,
      '2026-01'
    )
    expect(at(points, '2026-03')).toMatchObject({ none: 1, certified: 1 })
    expect(unestablished).toEqual({
      'not-read': 2,
      pending: 1,
      heuristic: 1,
      flag: 1,
      'unlisted-name': 1,
    })
  })

  it('does not count a keyword inside a name-match string as confirmed PQC', () => {
    const { points, unestablished } = buildListingStageTrend(
      [
        rec({ type: 'FIPS 140-3', pqcCoverage: 'Potentially PQC (Name Match: ML-KEM)' }),
        rec({ type: 'ACVP', pqcCoverage: 'Potentially PQC (Name Match: ML-DSA)' }),
      ],
      null,
      REF,
      '2026-01'
    )
    expect(at(points, '2026-03')).toMatchObject({ none: 0, cavp: 0, certified: 0 })
    expect(unestablished.heuristic).toBe(1)
  })

  it('only counts unestablished certificates that fall inside the charted months', () => {
    const { unestablished } = buildListingStageTrend(
      [
        rec({ type: 'FIPS 140-3', pqcCoverage: '', date: '2020-05-01' }),
        rec({ type: 'FIPS 140-3', pqcCoverage: '', date: undefined }),
        rec({ type: 'FIPS 140-3', pqcCoverage: '' }),
      ],
      null,
      REF,
      '2026-01'
    )
    expect(unestablished['not-read']).toBe(1)
  })

  it('labels the no-PQC band as a read algorithm list that names none', () => {
    expect(FIPS_STAGE_LABEL.listings.none).toMatch(/no PQC algorithm listed/)
  })
})

describe('unestablishedCaption', () => {
  const none = { 'not-read': 0, pending: 0, heuristic: 0, flag: 0, 'unlisted-name': 0 }

  it('is empty when every certificate falls in a band', () => {
    expect(unestablishedCaption(none)).toBe('')
  })

  it('names the count and the reason of each kind that is present, and skips the rest', () => {
    const text = unestablishedCaption({ ...none, 'not-read': 3, pending: 1 })
    expect(text).toContain('4 FIPS 140-3 certificates in these months are in neither band')
    expect(text).toContain('3 where its algorithm list is not read')
    expect(text).toContain('1 where its check is pending')
    expect(text).not.toContain('matched by name only')
  })

  it('uses the singular for one certificate', () => {
    expect(unestablishedCaption({ ...none, flag: 1 })).toContain(
      '1 FIPS 140-3 certificate in these months is in neither band'
    )
  })
})
