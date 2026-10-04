// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  CLAIM_STATES,
  CLAIM_TOPICS,
  claimsWithTopic,
  OPEN_CLAIMS,
  OpenClaimsFileError,
  getOpenClaim,
  getOpenClaims,
  latestInChain,
  openQuestions,
  parseOpenClaims,
} from './openClaimsData'

const source = {
  name: 'Example Agency',
  url: 'https://example.org/report',
  states: 'The figure.',
  quote: 'the exact words',
}

const claim = (over: Record<string, unknown> = {}) => ({
  id: 'a',
  claim: 'A statement.',
  madeBy: 'Example Agency',
  state: 'Settled',
  reason: 'It matches the record.',
  lastChecked: '2026-10-03',
  sources: [source],
  ...over,
})

const file = (...claims: unknown[]) => ({ version: 1, claims })

describe('parseOpenClaims', () => {
  it('accepts a valid file and keeps the optional fields', () => {
    const parsed = parseOpenClaims(
      file(
        claim({
          id: 'old',
          state: 'Superseded',
          supersededBy: 'new',
          newerStatements: [{ claim: 'new', relation: 'replaces' }],
        }),
        claim({
          id: 'new',
          state: 'Open',
          inConflict: true,
          derivedBy: 'this site',
          earlier: [
            {
              claim: 'old',
              relation: 'replaces',
              detail: 'The newer figure is lower.',
              madeBy: 'Example Agency',
              url: null,
              changes: [
                {
                  point: 'Qubits',
                  before: { text: '20 million', quote: 'twenty million' },
                  after: { text: 'under 1 million', quote: 'fewer than one million' },
                },
              ],
            },
          ],
        })
      )
    )
    expect(parsed.map((c) => c.id)).toEqual(['old', 'new'])
    expect(parsed[1].inConflict).toBe(true)
    expect(parsed[1].derivedBy).toBe('this site')
    expect(parsed[1].earlier?.[0].changes?.[0].point).toBe('Qubits')
    expect(parsed[0].supersededBy).toBe('new')
  })

  it('refuses the whole file when any claim is invalid', () => {
    expect(() => parseOpenClaims(file(claim(), claim({ id: 'b', state: 'Probably' })))).toThrow(
      OpenClaimsFileError
    )
  })

  it.each([
    ['an unsupported version', { version: 2, claims: [] }, /version 2/],
    ['no list of claims', { version: 1 }, /no list of claims/],
    ['an unknown state', file(claim({ state: 'Maybe' })), /unknown state/],
    ['a settled claim with no source', file(claim({ sources: [] })), /needs at least one source/],
    ['a source with no quote', file(claim({ sources: [{ ...source, quote: '' }] })), /no quote/],
    [
      'a link that is not https',
      file(claim({ sources: [{ ...source, url: 'http://example.org' }] })),
      /not https/,
    ],
    [
      'a script link',
      file(claim({ sources: [{ ...source, url: 'javascript:alert(1)' }] })),
      /not https/,
    ],
    ['a date that is not a date', file(claim({ lastChecked: 'yesterday' })), /not a date/],
    ['a repeated id', file(claim(), claim()), /appears twice/],
    [
      'a pointer to a claim that is not there',
      file(claim({ newerStatements: [{ claim: 'zzz', relation: 'updates' }] })),
      /not in the file/,
    ],
    [
      'a superseded claim naming no newer claim',
      file(claim({ state: 'Superseded' })),
      /names no newer claim/,
    ],
    [
      'an unknown relation',
      file(claim({ newerStatements: [{ claim: 'a', relation: 'cancels' }] })),
      /unknown relation/,
    ],
  ])('refuses %s', (_label, input, message) => {
    expect(() => parseOpenClaims(input)).toThrow(message)
  })

  it.each([
    'status',
    'decision',
    'draftedBy',
    'evidenceFile',
    'evidenceSha256',
    'evidencePath',
    'retrieved',
    'basis',
    'note',
    'relatesTo',
  ])('refuses the production field "%s" on a claim or a source', (key) => {
    expect(() => parseOpenClaims(file(claim({ [key]: 'x' })))).toThrow(
      /does not belong in the public file/
    )
    expect(() => parseOpenClaims(file(claim({ sources: [{ ...source, [key]: 'x' }] })))).toThrow(
      /does not belong in the public file/
    )
  })

  it('keeps valid topics and refuses an unknown or empty one', () => {
    expect(
      parseOpenClaims(file(claim({ topics: ['estimates', 'migration-deadline'] })))[0].topics
    ).toEqual(['estimates', 'migration-deadline'])
    expect(() => parseOpenClaims(file(claim({ topics: ['gossip'] })))).toThrow(/unknown topic/)
    expect(() => parseOpenClaims(file(claim({ topics: [] })))).toThrow(/not a list of tags/)
    expect(() => parseOpenClaims(file(claim({ topics: 'estimates' })))).toThrow(
      /not a list of tags/
    )
  })

  it('lets an open claim stand without a source when the site derived it', () => {
    expect(() =>
      parseOpenClaims(file(claim({ state: 'Open', sources: [], derivedBy: 'this site' })))
    ).not.toThrow()
  })
})

describe('the published claims file', () => {
  it('loads, and every claim is in a known state', () => {
    expect(OPEN_CLAIMS.length).toBeGreaterThan(0)
    for (const c of OPEN_CLAIMS) expect(CLAIM_STATES).toContain(c.state)
  })

  it('has no repeated ids and every link points to a claim in the file', () => {
    expect(new Set(OPEN_CLAIMS.map((c) => c.id)).size).toBe(OPEN_CLAIMS.length)
    for (const c of OPEN_CLAIMS) {
      for (const n of c.newerStatements ?? [])
        expect(getOpenClaim(n.claim), `${c.id} -> ${n.claim}`).toBeDefined()
      for (const e of c.earlier ?? [])
        expect(getOpenClaim(e.claim), `${c.id} -> ${e.claim}`).toBeDefined()
    }
  })

  it('shows its proof: every settled, broken or superseded claim has a quote and an https link', () => {
    for (const c of OPEN_CLAIMS.filter((x) => x.state !== 'Open')) {
      expect(c.sources.length, c.id).toBeGreaterThan(0)
      for (const s of c.sources) {
        expect(s.quote.length, c.id).toBeGreaterThan(10)
        expect(s.url, c.id).toMatch(/^https:\/\//)
      }
    }
  })

  it('keeps the older statement and links it to the newer one', () => {
    const older = getOpenClaim('crqc-rsa2048-physical-qubits-20m')
    expect(older?.state).toBe('Superseded')
    expect(older?.supersededBy).toBe('crqc-rsa2048-physical-qubits-2025')
    expect(latestInChain('crqc-rsa2048-physical-qubits-20m')?.id).toBe(
      'crqc-rsa2048-physical-qubits-2025'
    )
    expect(latestInChain('crqc-rsa2048-physical-qubits-2025')?.id).toBe(
      'crqc-rsa2048-physical-qubits-2025'
    )
  })

  it('carries the point-by-point changes of an update, each side with its own quote', () => {
    const newer = getOpenClaim('crqc-nsa-cnsa2-faq-v21-dates')
    const changes = newer?.earlier?.[0].changes ?? []
    expect(changes.length).toBeGreaterThan(0)
    for (const ch of changes) {
      expect(ch.before.quote.length).toBeGreaterThan(5)
      expect(ch.after.quote.length).toBeGreaterThan(5)
    }
  })

  it('tags every claim with known topics, and the six estimate rows are tagged `estimates`', () => {
    for (const c of OPEN_CLAIMS) {
      expect(c.topics?.length, c.id).toBeGreaterThan(0)
      for (const topic of c.topics ?? []) expect(CLAIM_TOPICS).toContain(topic)
    }
    expect(
      claimsWithTopic('estimates')
        .map((c) => c.id)
        .sort()
    ).toEqual(
      [
        'crqc-gri-2025-timeline',
        'crqc-nist-ir8547-dates',
        'crqc-nsa-cnsa2-dates',
        'crqc-anssi-phase3',
        'crqc-bsi-tr02102-2026-dates',
        'crqc-google-ef-secp256k1-resources',
      ].sort()
    )
  })

  it('every `estimate-update` claim is reached from an `estimates` claim', () => {
    const rows = new Set(claimsWithTopic('estimates').map((c) => c.id))
    for (const update of claimsWithTopic('estimate-update')) {
      const parents = OPEN_CLAIMS.filter((c) =>
        c.newerStatements?.some((n) => n.claim === update.id)
      )
      expect(
        parents.some((p) => rows.has(p.id)),
        update.id
      ).toBe(true)
    }
  })

  it('every claim tagged `open-questions` is Open', () => {
    expect(claimsWithTopic('open-questions').every((c) => c.state === 'Open')).toBe(true)
  })

  it('lists the open questions, and an unknown id returns nothing', () => {
    expect(openQuestions().every((c) => c.state === 'Open')).toBe(true)
    expect(getOpenClaims(['crqc-gri-2025-timeline', 'nope']).map((c) => c.id)).toEqual([
      'crqc-gri-2025-timeline',
    ])
    expect(getOpenClaim('nope')).toBeUndefined()
    expect(latestInChain('nope')).toBeUndefined()
  })

  it('contains no field that describes how a claim was produced', () => {
    const text = JSON.stringify(OPEN_CLAIMS)
    for (const word of ['evidenceSha256', 'evidenceFile', 'evidencePath', 'draftedBy']) {
      expect(text).not.toContain(word)
    }
  })
})
