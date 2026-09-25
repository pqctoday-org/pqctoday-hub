// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  claimsCheckedText,
  formatSourceCaveat,
  getSourceCaveat,
  lineageFor,
  secondSourceLines,
  SOURCE_CAVEAT_TEXT,
  sourceCaveatFor,
  sourceFactLines,
  sourceIdentityText,
  type ThreatClaimStatusFile,
} from './threatClaimStatus'

const FILE: ThreatClaimStatusFile = {
  version: 1,
  rows: {
    'T-SUP': { claims: { threat_description: { verdict: 'supported', decidedAt: '2026-09-16' } } },
    'T-UND': {
      claims: { threat_description: { verdict: 'undeterminable', decidedAt: '2026-09-16' } },
    },
    'T-CON': {
      claims: { threat_description: { verdict: 'contradicted', decidedAt: '2026-09-17' } },
    },
    // Only another claim decided — no verdict on the description.
    'T-OTHER': { claims: { crypto_at_risk: { verdict: 'undeterminable' } } },
  },
}

describe('threat source caveat', () => {
  it('no caveat when the description is supported by the cited source', () => {
    expect(sourceCaveatFor('T-SUP', FILE)).toBeNull()
  })

  it('caveat, with its date, when the verdict is undeterminable', () => {
    const c = sourceCaveatFor('T-UND', FILE)
    expect(c).toEqual({ text: SOURCE_CAVEAT_TEXT, checkedAt: '2026-09-16' })
    expect(formatSourceCaveat(c!)).toBe(`${SOURCE_CAVEAT_TEXT} (checked 2026-09-16)`)
  })

  it('"contradicted" gets exactly the same caveat — the page never says the source disagrees', () => {
    const c = sourceCaveatFor('T-CON', FILE)
    expect(c?.text).toBe(SOURCE_CAVEAT_TEXT)
    expect(formatSourceCaveat(c!)).not.toMatch(/contradict|disagree/i)
  })

  it('no caveat when the row, its description verdict, or the whole file is absent', () => {
    expect(sourceCaveatFor('T-MISSING', FILE)).toBeNull()
    expect(sourceCaveatFor('T-OTHER', FILE)).toBeNull()
    expect(sourceCaveatFor('T-UND', null)).toBeNull()
    expect(sourceCaveatFor('T-UND', {})).toBeNull()
  })

  it('the bundled lookup never throws, whether or not the file is present', () => {
    expect(getSourceCaveat('NO-SUCH-THREAT')).toBeNull()
  })
})

describe('approved second sources', () => {
  it('a second source stating the description replaces the caveat', () => {
    const second = [{ ref: 'RFC 7935', claims: ['threat_description'] }]
    expect(sourceCaveatFor('T-UND', FILE, second)).toBeNull()
  })

  it('a second source for other claims leaves the description caveat in place', () => {
    const second = [{ ref: 'RFC 6605', claims: ['crypto_at_risk'] }]
    expect(sourceCaveatFor('T-UND', FILE, second)?.text).toBe(SOURCE_CAVEAT_TEXT)
  })

  it('names exactly the claims each source was checked to state', () => {
    expect(
      secondSourceLines([
        { ref: 'RFC 6605', claims: ['crypto_at_risk'] },
        { ref: 'draft-x-00', claims: ['crypto_at_risk', 'pqc_replacement', 'threat_description'] },
        { ref: 'RFC 1', claims: ['not_a_claim'] },
      ])
    ).toEqual([
      { ref: 'RFC 6605', text: 'Also stated in RFC 6605: the cryptography at risk.' },
      {
        ref: 'draft-x-00',
        text: 'Also stated in draft-x-00: the cryptography at risk, the replacement and the threat description.',
      },
    ])
    expect(secondSourceLines(undefined)).toEqual([])
  })
})

describe('threat lineage — the Evidence panel (ruling R2)', () => {
  const LEDGER: ThreatClaimStatusFile = {
    rows: {
      'L-1': {
        claims: {
          main_source: { verdict: 'MATCH', decidedAt: '2026-09-24' },
          threat_description: { verdict: 'supported' },
          crypto_at_risk: { verdict: 'undeterminable' },
          pqc_replacement: { verdict: 'contradicted' },
          vetting_body: { verdict: 'FOUND' },
        },
      },
      'L-2': { claims: { main_source: { verdict: 'WEAK' } } },
    },
  }

  it('confirms the source only on MATCH, and counts the three reader-facing claims', () => {
    const l = lineageFor('L-1', LEDGER)
    expect(l).toEqual({
      sourceConfirmed: true,
      sourceCheckedAt: '2026-09-24',
      supported: 1,
      supportedBySecondReader: 0,
      unconfirmed: 2,
    })
    expect(sourceIdentityText(l)).toBe('Source document: confirmed to be the cited document')
    expect(claimsCheckedText(l)).toBe(
      'Claims checked against the cited document: 1 supported · 2 could not be confirmed'
    )
  })

  it('says when an AI second reader (the Codex claim check) confirmed a claim', () => {
    const l = lineageFor('C-1', {
      rows: {
        'C-1': {
          claims: {
            threat_description: { verdict: 'supported', basis: 'codex-review', codexLog: 'cx-1' },
            crypto_at_risk: { verdict: 'supported' },
            pqc_replacement: { verdict: 'undeterminable' },
          },
        },
      },
    })
    expect(l.supportedBySecondReader).toBe(1)
    expect(claimsCheckedText(l)).toBe(
      'Claims checked against the cited document: 2 supported (1 by an AI second reader) · 1 could not be confirmed'
    )
  })

  it('"contradicted" counts as could-not-be-confirmed — never as a disagreement', () => {
    expect(claimsCheckedText(lineageFor('L-1', LEDGER))).not.toMatch(/contradict|disagree/i)
  })

  it('WEAK, an absent row, or an absent file → not yet confirmed, no claims line', () => {
    for (const l of [
      lineageFor('L-2', LEDGER),
      lineageFor('NOPE', LEDGER),
      lineageFor('L-1', null),
    ]) {
      expect(sourceIdentityText(l)).toBe('Source document: not yet confirmed')
      expect(claimsCheckedText(l)).toBeNull()
    }
  })

  it('no text it produces carries a percentage or a confidence number', () => {
    const l = lineageFor('L-1', LEDGER)
    for (const t of [sourceIdentityText(l), claimsCheckedText(l) ?? '']) {
      expect(t).not.toMatch(/%|confidence|accuracy/i)
    }
  })
})

describe('source facts — peer review and vetting body (ruling R2, adjusted)', () => {
  it('states each as a plain fact, only when the row has a value', () => {
    expect(
      sourceFactLines({ peerReviewed: 'partial', vettingBody: ['IETF', ' NIST '] }).map(
        (l) => l.text
      )
    ).toEqual(['Peer reviewed: partial', 'Vetting body: IETF; NIST'])
    expect(sourceFactLines({ peerReviewed: 'no' }).map((l) => l.text)).toEqual([
      'Peer reviewed: no',
    ])
    expect(sourceFactLines({})).toEqual([])
    expect(sourceFactLines({ vettingBody: [] })).toEqual([])
  })
})
