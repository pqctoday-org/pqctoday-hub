// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  CLAIM_MATRIX_SCHEMA,
  CLAIM_STATUSES,
  checkClaimMatrix,
  claimMatrixMarkdown,
  claimMatrixSaveRequest,
  emptyClaimMatrix,
  newClaim,
  nextClaimId,
  parseRecordIds,
  readClaimMatrix,
  type MatrixClaim,
} from './claimMatrix'

const claim = (over: Partial<MatrixClaim>): MatrixClaim => ({
  ...newClaim([]),
  claim: 'ML-KEM-768 is standardised in FIPS 203',
  ...over,
})

describe('claim matrix', () => {
  it('uses the same four claim statuses as the other packs', () => {
    expect(CLAIM_STATUSES).toEqual(['fact', 'estimate', 'scenario', 'recommendation'])
  })

  it('a fact needs at least one supporting record id', () => {
    const m = { ...emptyClaimMatrix(), claims: [claim({ status: 'fact' })] }
    expect(checkClaimMatrix(m).errors.map((e) => e.claimId)).toEqual(['C1'])
    const ok = { ...m, claims: [claim({ status: 'fact', supporting: ['FIPS 203'] })] }
    expect(checkClaimMatrix(ok).errors).toEqual([])
  })

  it('does not infer a status: an unsupported estimate is allowed', () => {
    const m = { ...emptyClaimMatrix(), claims: [claim({ status: 'estimate' })] }
    expect(checkClaimMatrix(m)).toEqual({ errors: [], warnings: [] })
  })

  it('flags a blank claim, ids on both sides and unknown ids', () => {
    const m = {
      ...emptyClaimMatrix(),
      claims: [
        claim({ claim: ' ' }),
        claim({ id: 'C2', supporting: ['A', 'NOPE'], contrary: ['A'] }),
      ],
    }
    const r = checkClaimMatrix(m, (id) => id === 'A')
    expect(r.errors.map((e) => e.message)).toEqual(['C1: the claim is blank.'])
    expect(r.warnings.map((e) => e.message)).toEqual([
      'C2: A is listed as both supporting and contrary.',
      'C2: NOPE is not a Library record id.',
    ])
  })

  it('parses typed record ids and numbers rows', () => {
    expect(parseRecordIds('FIPS 203; RFC 9629,\nFIPS 203 ,')).toEqual(['FIPS 203', 'RFC 9629'])
    expect(nextClaimId([claim({ id: 'C1' }), claim({ id: 'C3' })])).toBe('C4')
    expect(nextClaimId([claim({ id: 'C2' })])).toBe('C3')
  })

  it('renders a table with counts per status', () => {
    const md = claimMatrixMarkdown(
      {
        ...emptyClaimMatrix(),
        title: 'KEM claims',
        claims: [claim({ status: 'fact', supporting: ['FIPS 203'] })],
      },
      'Is ML-KEM final?'
    )
    expect(md).toContain('# KEM claims')
    expect(md).toContain('Answers: Is ML-KEM final?')
    expect(md).toContain('1 claim (1 fact (with source), 0 estimate, 0 scenario, 0 recommendation)')
    expect(md).toContain(
      '| C1 | ML-KEM-768 is standardised in FIPS 203 | Fact (with source) | FIPS 203 | — | — | — |'
    )
  })

  it('reads a saved matrix back with safe defaults', () => {
    const m = readClaimMatrix({
      type: 'claim-matrix',
      inputs: {
        schema: CLAIM_MATRIX_SCHEMA,
        claims: [{ id: 'C1', status: 'bogus', supporting: ['A', 3] }, { nope: true }],
      },
    })
    expect(m).toEqual({
      schema: CLAIM_MATRIX_SCHEMA,
      title: '',
      questionModuleId: null,
      claims: [
        {
          id: 'C1',
          claim: '',
          status: 'estimate',
          supporting: ['A'],
          contrary: [],
          confidence: '',
          openQuestions: '',
        },
      ],
    })
    expect(readClaimMatrix({ type: 'claim-matrix', inputs: {} })).toBeNull()
  })

  it('save request', () => {
    const r = claimMatrixSaveRequest(emptyClaimMatrix(), 'claim-matrix:1', { edited: true })
    expect(r).toMatchObject({
      type: 'claim-matrix',
      title: 'Claim matrix',
      revisionSummary: 'Claim matrix edited',
    })
  })
})
