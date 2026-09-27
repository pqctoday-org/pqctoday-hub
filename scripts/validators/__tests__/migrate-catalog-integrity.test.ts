// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  checkApprovedBoundaryClaims,
  checkCertificationVerdicts,
  checkColumnNameCells,
  checkNoPqcConsistency,
  checkProductIdUniqueness,
  checkReleaseDates,
  checkRenamesKeepFormerNames,
  checkNameShape,
  checkRetiredDuplicateVerdicts,
} from '../migrate-catalog-integrity'

describe('MC-1 product_id uniqueness', () => {
  it('flags a case-only collision that an exact-match check misses', () => {
    const f = checkProductIdUniqueness(
      [
        { product_id: 'Cryptographic-library-NESLIB-6-11-3-on-S', status: 'active' },
        { product_id: 'Cryptographic-Library-NesLib-6-11-3-on-S', status: 'active' },
      ],
      'cat.csv'
    )
    expect(f).toHaveLength(1)
    expect(f[0].message).toContain('differs only by case')
  })

  it('flags an exact duplicate and ignores deprecated rows', () => {
    expect(
      checkProductIdUniqueness(
        [
          { product_id: 'a', status: 'active' },
          { product_id: 'a', status: '' },
        ],
        'c'
      )
    ).toHaveLength(1)
    expect(
      checkProductIdUniqueness(
        [
          { product_id: 'a', status: 'active' },
          { product_id: 'A', status: 'deprecated' },
        ],
        'c'
      )
    ).toHaveLength(0)
  })
})

describe('MC-2 release dates', () => {
  it('flags future and non-date values, accepts partial dates', () => {
    const f = checkReleaseDates(
      [
        { product_id: 'x', release_date: '2027-01-01' },
        { product_id: 'y', release_date: 'Continuous' },
        { product_id: 'z', release_date: '2025-06' },
        { product_id: 'w', release_date: '2026-09-24' },
      ],
      'c',
      '2026-09-24'
    )
    expect(f.map((x) => x.value)).toEqual(['2027-01-01', 'Continuous'])
  })
})

describe('MC-3 no-PQC consistency', () => {
  it('flags VALIDATED_NO_PQC with a PQC-claiming status only', () => {
    const f = checkNoPqcConsistency(
      [
        { product_id: 'a', validation_result: 'VALIDATED_NO_PQC', pqc_status_canonical: 'roadmap' },
        { product_id: 'b', validation_result: 'VALIDATED_NO_PQC', pqc_status_canonical: 'none' },
        { product_id: 'c', validation_result: 'VALIDATED', pqc_status_canonical: 'available' },
      ],
      'c'
    )
    expect(f.map((x) => x.value)).toEqual(['roadmap'])
  })
})

describe('MC-4 renames keep former names', () => {
  const prev = [{ product_id: 'x', software_name: 'GitHub - aws/aws-lc-rs' }]
  it('fails a rename without former_names', () => {
    expect(
      checkRenamesKeepFormerNames(prev, [{ product_id: 'x', software_name: 'aws-lc-rs' }], 'c')
    ).toHaveLength(1)
  })
  it('passes when the old name is kept', () => {
    expect(
      checkRenamesKeepFormerNames(
        prev,
        [{ product_id: 'x', software_name: 'aws-lc-rs', former_names: 'GitHub - aws/aws-lc-rs' }],
        'c'
      )
    ).toHaveLength(0)
  })
})

describe('MC-5 certification verdicts', () => {
  const row = (pc: string, hc: string, status = 'active') => ({
    product_id: 'p',
    pqc_certified: pc,
    has_certification: hc,
    status,
  })

  it('accepts every legitimate pairing, including classical-only and component', () => {
    for (const [pc, hc] of [
      ['yes', 'yes'],
      ['no', 'yes'], // FIPS-validated for classical algorithms only
      ['none', 'unknown'],
      ['none', 'component'], // a validated module inside, the product itself not
      ['no', 'component'],
    ]) {
      expect(checkCertificationVerdicts([row(pc, hc)], 'c'), `${pc}/${hc}`).toHaveLength(0)
    }
  })

  it('rejects values outside either vocabulary', () => {
    expect(checkCertificationVerdicts([row('maybe', 'unknown')], 'c')).toHaveLength(1)
    expect(checkCertificationVerdicts([row('none', 'probably')], 'c')).toHaveLength(1)
  })

  it('rejects a PQC-certification claim when no certificate exists', () => {
    expect(checkCertificationVerdicts([row('yes', 'no')], 'c')).toHaveLength(1)
    expect(checkCertificationVerdicts([row('partial', 'no')], 'c')).toHaveLength(1)
  })

  it('rejects a PQC-certification claim when only an embedded module is validated', () => {
    // pqc_certified describes the PRODUCT's own certification; `component`
    // says it holds none. A cloud KMS is not PQC-certified because its HSM is.
    const f = checkCertificationVerdicts([row('yes', 'component')], 'c')
    expect(f).toHaveLength(1)
    expect(f[0].message).toMatch(/embedded module/)
    expect(checkCertificationVerdicts([row('partial', 'component')], 'c')).toHaveLength(1)
  })

  it('ignores deprecated rows', () => {
    expect(checkCertificationVerdicts([row('yes', 'no', 'deprecated')], 'c')).toHaveLength(0)
  })

  it('accepts the FIPS 140-3 track stages', () => {
    for (const [pc, hc] of [
      ['cavp', 'cavp'], // algorithms validated, no certificate
      ['cavp', 'yes'], // certified module, PQC only CAVP-validated (the K7 case)
      ['none', 'in_progress'], // NIST lists the module as in process
    ]) {
      expect(checkCertificationVerdicts([row(pc, hc)], 'c'), `${pc}/${hc}`).toHaveLength(0)
    }
  })

  it('rejects a PQC-certification claim resting on a stage, not a certificate', () => {
    for (const hc of ['cavp', 'in_progress']) {
      const f = checkCertificationVerdicts([row('yes', hc)], 'c')
      expect(f, hc).toHaveLength(1)
      expect(f[0].message).toMatch(/not a certificate/)
    }
  })
})

describe('MC-6 approved-boundary claims', () => {
  it('flags pqc_certified=yes whose own note puts PQC outside the approved mode', () => {
    const f = checkApprovedBoundaryClaims(
      [
        {
          product_id: 'ls2',
          pqc_certified: 'yes',
          pqc_support: 'Yes (ML-KEM, ML-DSA in non-FIPS operating mode)',
          status: 'active',
        },
      ],
      'c'
    )
    expect(f).toHaveLength(1)
  })

  it('leaves partial claims and clean yes claims alone', () => {
    expect(
      checkApprovedBoundaryClaims(
        [
          {
            product_id: 'a',
            pqc_certified: 'partial',
            pqc_support: 'Partial (non-Approved services only)',
            status: 'active',
          },
          {
            product_id: 'b',
            pqc_certified: 'yes',
            pqc_support: 'Yes (ML-KEM approved, CMVP #5497)',
            status: 'active',
          },
        ],
        'c'
      )
    ).toHaveLength(0)
  })
})

describe('MC-7 column-name cells', () => {
  it('flags a cell holding its own column name (the 4.124.1 R3-16 parser defect)', () => {
    const f = checkColumnNameCells(
      [
        { product_id: 'aws-kms', pqc_support: 'pqc_support', status: 'active' },
        { product_id: 'boringssl', pqc_support: 'Yes (ML-KEM)', status: 'active' },
      ],
      'c'
    )
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ field: 'pqc_support', row: 2 })
  })

  it('leaves a column name mentioned inside a real value alone', () => {
    expect(
      checkColumnNameCells(
        [{ product_id: 'a', pqc_support: 'Yes (see pqc_support note)', status: 'active' }],
        'c'
      )
    ).toHaveLength(0)
  })
})

describe('MC-8 name shape', () => {
  it('flags scraped page titles', () => {
    const rows = [
      { product_id: 'a', software_name: 'Dashboard - PQProbe' },
      { product_id: 'b', software_name: 'PQConnect: Intro' },
      { product_id: 'c', software_name: 'SMAUG-T & HAETAE - HAETAE' },
      { product_id: 'd', software_name: 'Lean Consensus Roadmap' },
    ]
    expect(checkNameShape(rows, 'c')).toHaveLength(4)
  })
  it('passes product names and skips retired rows', () => {
    const rows = [
      { product_id: 'a', software_name: 'PQProbe' },
      { product_id: 'b', software_name: 'Alibaba Cloud ESA (Edge Security Acceleration)' },
      { product_id: 'c', software_name: 'What is PQC', status: 'deprecated' },
    ]
    expect(checkNameShape(rows, 'c')).toHaveLength(0)
  })
})

describe('MC-9 retired duplicates never out-rank their survivor', () => {
  const keep = {
    product_id: 'k',
    status: 'active',
    has_certification: 'cavp',
    pqc_certified: 'cavp',
  }
  const dup = (over: Record<string, string>) => ({
    product_id: 'd',
    status: 'deprecated',
    deprecated_reason: 'duplicate of k: same crate',
    has_certification: 'cavp',
    pqc_certified: 'cavp',
    ...over,
  })
  it('flags a stronger has_certification or pqc_certified (the two _r9 cases)', () => {
    expect(
      checkRetiredDuplicateVerdicts([keep, dup({ has_certification: 'yes' })], 'c')
    ).toHaveLength(1)
    expect(checkRetiredDuplicateVerdicts([keep, dup({ pqc_certified: 'yes' })], 'c')).toHaveLength(
      1
    )
  })
  it('passes an equal or weaker verdict', () => {
    expect(checkRetiredDuplicateVerdicts([keep, dup({})], 'c')).toEqual([])
    expect(
      checkRetiredDuplicateVerdicts(
        [keep, dup({ has_certification: 'unknown', pqc_certified: 'none' })],
        'c'
      )
    ).toEqual([])
  })
  it('flags a survivor that is itself retired, and skips a reason that names no row', () => {
    expect(
      checkRetiredDuplicateVerdicts([{ ...keep, status: 'deprecated' }, dup({})], 'c')
    ).toHaveLength(1)
    expect(
      checkRetiredDuplicateVerdicts(
        [keep, dup({ deprecated_reason: 'Duplicate of existing row' })],
        'c'
      )
    ).toEqual([])
  })
})
