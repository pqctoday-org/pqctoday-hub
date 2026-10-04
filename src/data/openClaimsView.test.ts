// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { OPEN_CLAIMS, getOpenClaim, type OpenClaim } from './openClaimsData'
import { formatClaimDate, headStatement, headStatements, relationLabel } from './openClaimsView'

const claim = (over: Partial<OpenClaim> & { id: string }): OpenClaim => ({
  claim: `Claim ${over.id}`,
  madeBy: 'Someone',
  state: 'Settled',
  reason: 'Because.',
  lastChecked: '2026-10-03',
  sources: [{ name: 'S', url: 'https://example.org/s', states: 'says', quote: 'exact words' }],
  ...over,
})

const lookupOf = (claims: OpenClaim[]) => (id: string) => claims.find((c) => c.id === id)

describe('headStatement: the latest statement of a claim', () => {
  it('follows an update to the newer statement, and leaves a claim with no newer one alone', () => {
    const claims = [
      claim({ id: 'old', newerStatements: [{ claim: 'new', relation: 'updates' }] }),
      claim({ id: 'new' }),
      claim({ id: 'alone' }),
    ]
    expect(headStatement('old', lookupOf(claims))?.id).toBe('new')
    expect(headStatement('alone', lookupOf(claims))?.id).toBe('alone')
    expect(headStatement('missing', lookupOf(claims))).toBeUndefined()
  })

  it('follows a replacement, and a chain of them, to the newest', () => {
    const claims = [
      claim({
        id: 'a',
        state: 'Superseded',
        supersededBy: 'b',
        newerStatements: [{ claim: 'b', relation: 'replaces' }],
      }),
      claim({
        id: 'b',
        state: 'Superseded',
        supersededBy: 'c',
        newerStatements: [{ claim: 'c', relation: 'replaces' }],
      }),
      claim({ id: 'c' }),
    ]
    expect(headStatement('a', lookupOf(claims))?.id).toBe('c')
  })

  it('does not hide an older claim behind a statement that only adds to it', () => {
    const claims = [
      claim({ id: 'base', newerStatements: [{ claim: 'extra', relation: 'adds-to' }] }),
      claim({ id: 'extra' }),
    ]
    expect(headStatement('base', lookupOf(claims))?.id).toBe('base')
  })

  it('cannot loop on a cycle in the data', () => {
    const claims = [
      claim({ id: 'x', newerStatements: [{ claim: 'y', relation: 'updates' }] }),
      claim({ id: 'y', newerStatements: [{ claim: 'x', relation: 'updates' }] }),
    ]
    expect(['x', 'y']).toContain(headStatement('x', lookupOf(claims))?.id)
  })

  it('headStatements shows each latest statement once, in the order asked', () => {
    const claims = [
      claim({ id: 'old', newerStatements: [{ claim: 'new', relation: 'updates' }] }),
      claim({ id: 'new' }),
      claim({ id: 'other' }),
    ]
    expect(
      headStatements(['other', 'old', 'new', 'nope'], lookupOf(claims)).map((c) => c.id)
    ).toEqual(['other', 'new'])
  })
})

describe('the published claims, read through headStatement', () => {
  it('shows the newer NSA and ANSSI statements first and keeps the older ones one link away', () => {
    expect(headStatement('crqc-nsa-cnsa2-dates')?.id).toBe('crqc-nsa-cnsa2-faq-v21-dates')
    expect(headStatement('crqc-anssi-phase3')?.id).toBe('crqc-anssi-faq-2025-buy-after-2030')
    expect(getOpenClaim('crqc-nsa-cnsa2-faq-v21-dates')?.earlier?.[0].claim).toBe(
      'crqc-nsa-cnsa2-dates'
    )
  })

  it('shows the current RSA-2048 estimate, not the replaced one', () => {
    expect(headStatement('crqc-rsa2048-physical-qubits-20m')?.id).toBe(
      'crqc-rsa2048-physical-qubits-2025'
    )
  })

  it('every published claim resolves to a statement that exists', () => {
    for (const c of OPEN_CLAIMS) expect(headStatement(c.id), c.id).toBeDefined()
  })
})

describe('plain wording helpers', () => {
  it('labels each relation in plain words', () => {
    expect(relationLabel('replaces')).toBe('Replaces an earlier statement')
    expect(relationLabel('updates')).toBe('Updates an earlier statement')
    expect(relationLabel('adds-to')).toBe('Adds to an earlier statement')
  })

  it('formats a date without a time zone, and returns null for no date or a bad one', () => {
    expect(formatClaimDate('2026-10-03')).toBe('3 October 2026')
    expect(formatClaimDate('2026-01-31')).toBe('31 January 2026')
    expect(formatClaimDate(null)).toBeNull()
    expect(formatClaimDate('soon')).toBeNull()
  })
})
