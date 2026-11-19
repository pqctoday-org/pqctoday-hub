// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { CITE_PROTO_DEFAULT, citeProtoFlags } from './citeProtoFlags'
import { assessClaimSupport, extractTerms } from './citationRelevance'
import { repairCitationIds, resolveNearMissChunkId } from './citationIds'
import { verifyCitations } from './citationVerification'
import { enforceGrounding, salvageGroundedClaims } from './groundingPolicy'
import { finalizeGroundedResponse } from './responseFinalization'
import { buildLocalSystemPrompt } from './promptBuilder'
import type { ClaimCitation } from './parseCitations'

const chunk = (id: string, content: string, extra: Partial<RAGChunk> = {}): RAGChunk => ({
  id,
  source: 'library',
  title: id,
  content,
  category: 'library',
  metadata: {},
  ...extra,
})

// Real corpus chunks (content abridged) behind the two weak citations that passed under change A.
const SSH = chunk(
  'library-RFC 9941',
  [
    'Reference: RFC 9941',
    'Title: Streamlined NTRU Prime sntrup761 Key Exchange for SSH',
    'Description: Specifies sntrup761x25519-sha512 hybrid key exchange for SSH; supersedes draft-ietf-sshm-ntruprime-ssh.',
    'Type: RFC | Status: Released (Informational RFC)',
  ].join('\n'),
  { title: 'Streamlined NTRU Prime sntrup761 Key Exchange for SSH' }
)
const CNSA = chunk(
  'compliance-CNSA-2',
  [
    'Framework: CNSA 2.0',
    'Description: NSA requirements for national security systems (NSS) and their vendors',
    'Industries: Government & Defense',
    'Countries: 92',
    'Requires PQC: US',
    'Deadline: yes',
  ].join('\n'),
  { source: 'compliance', title: 'CNSA 2.0' }
)
const CMP = chunk(
  'mc-pkienrollmentprotocols-cmpkemkeyupdate-0',
  [
    'Module: PKI Enrollment Protocols (EST & CMP)',
    'Component: CmpKemKeyUpdate',
    '',
    'The sample server encrypts a newly issued certificate to the fresh ML-KEM-768 key. The client must recover and validate it, then confirm its hash before the server completes the transaction.',
  ].join('\n'),
  { source: 'module-content', title: 'PKI Enrollment Protocols (EST & CMP) — CmpKemKeyUpdate' }
)
// Eight retrieved chunks share the source name the model wrote in the second real near miss.
const CAP = (slug: string) =>
  chunk(
    `cap-${slug}`,
    `Capability checklist for ${slug}\n1. Collection and immutable retention of technical migration evidence.`,
    { source: 'capability-checklist', title: `Capability ${slug}` }
  )
const CAP_MIGRATION = chunk(
  'cap-business-migration-verification',
  'Business Planning Tool Capability Checklist: Migration Verification & Closure\nProduction Tool Category: Continuous Verification\nRequired Enterprise Tool Capabilities:\n  1. Collection and immutable retention of 5-point technical migration evidence per system: observed wire negotiation, negative tamper/downgrade test, PQC cert-chain verification, documented fallback policy, and archived dossier.',
  {
    source: 'capability-checklist',
    title: 'Enterprise Tool Capability Requirements: Migration Verification',
  }
)
const BUSINESS_TOOL = chunk(
  'business-tool-migration-verification',
  'Migration Verification & Closure (Command Center planning tool)\nCategory: Migration Planning\nIt generates artifacts that appear in the dashboard.',
  { source: 'business-center', title: 'Migration Verification & Closure — Migration Planning' }
)

const ref = (c: RAGChunk, n: number) => `${c.id}#${n}`
const cite = (claim: string, refs: string[]): ClaimCitation => ({
  claimExcerpt: claim,
  chunkId: refs[0].slice(0, refs[0].lastIndexOf('#')),
  evidenceRefs: refs,
})

afterEach(() => {
  delete process.env.CITE_PROTO
})

describe('citeProtoFlags', () => {
  it('defaults to A + guard + id check with B off', () => {
    expect(CITE_PROTO_DEFAULT).toBe('a+guard+id')
    expect(citeProtoFlags()).toEqual({
      bySentence: true,
      partial: false,
      relevanceGuard: true,
      idRepair: true,
    })
  })

  it('keeps the legacy values: a is A alone, none is everything off, ab is A and B', () => {
    process.env.CITE_PROTO = 'a'
    expect(citeProtoFlags()).toEqual({
      bySentence: true,
      partial: false,
      relevanceGuard: false,
      idRepair: false,
    })
    process.env.CITE_PROTO = 'none'
    expect(citeProtoFlags()).toEqual({
      bySentence: false,
      partial: false,
      relevanceGuard: false,
      idRepair: false,
    })
    process.env.CITE_PROTO = 'ab'
    expect(citeProtoFlags()).toMatchObject({
      bySentence: true,
      partial: true,
      relevanceGuard: false,
    })
  })
})

describe('extractTerms', () => {
  it('keeps number runs whole, removes thousands commas and plural endings', () => {
    const t = extractTerms('FIPS 203 keys are ~1,184 bytes in TLS 1.3 libraries and ML-KEM-768.')
    expect(t.numbers.sort()).toEqual(['1.3', '1184', '203', '768'])
    expect(t.words).toEqual(expect.arrayContaining(['key', 'byte', 'tls', 'library', 'kem']))
    expect(t.words).not.toContain('are')
    expect(t.words).not.toContain('keys')
  })

  it('does not strip the s from words that merely end in s', () => {
    expect(extractTerms('class status analysis').words.sort()).toEqual([
      'analysis',
      'class',
      'status',
    ])
  })
})

describe('assessClaimSupport', () => {
  const ctx = { titles: ['RFC 9881'], ids: ['library-RFC 9881'] }

  it('accepts a verbatim or lightly reworded claim', () => {
    const sentence =
      'Definition: IETF standard defining how to use ML-DSA digital signatures in X.509 certificates and Certificate Revocation Lists (CRLs).'
    expect(
      assessClaimSupport(
        'RFC 9881 standardizes how to use ML-DSA digital signatures in X.509 certificates and Certificate Revocation Lists (CRLs).',
        [sentence],
        ctx
      ).supported
    ).toBe(true)
  })

  it('rejects a number that is nowhere in the evidence', () => {
    const a = assessClaimSupport(
      'The standard is a Proposed Standard and was published in 2025.',
      ['Document Status: Proposed Standard'],
      ctx
    )
    expect(a).toMatchObject({
      supported: false,
      reason: 'missing-number',
      missingNumbers: ['2025'],
    })
  })

  it('takes a number from the chunk id or title (NIST IR 8547 is the chunk, not the sentence)', () => {
    const a = assessClaimSupport(
      'NIST IR 8547 requires that quantum-vulnerable public-key algorithms be disallowed after 2035.',
      [
        'Every quantum-vulnerable public-key algorithm is deprecated after 2030 and disallowed after 2035.',
      ],
      {
        titles: ['Transition to Post-Quantum Cryptography Standards'],
        ids: ['library-NIST IR 8547'],
      }
    )
    expect(a.missingNumbers).toEqual([])
    expect(a.supported).toBe(true)
  })

  it('treats 1,184 and 1184 as the same number', () => {
    expect(
      assessClaimSupport('Public keys are 1184 bytes.', ['ML-KEM public keys are ~1,184 bytes.'], {
        titles: [],
        ids: [],
      }).supported
    ).toBe(true)
  })

  it('rejects a title that carries the claim: title words cannot replace the sentence', () => {
    // Every claim word is in the title, but only one is in the cited sentence.
    const a = assessClaimSupport('Hybrid key exchange deployment guidance.', ['Status: Draft'], {
      titles: ['Hybrid Key Exchange Deployment Guidance'],
      ids: [],
    })
    expect(a).toMatchObject({ supported: false, reason: 'title-only', inSentences: 0 })
  })

  it('pools several cited sentences', () => {
    const claim = 'The scheme combines lattice signatures with Ed25519 for X.509 certificates.'
    const one = assessClaimSupport(
      claim,
      ['It combines lattice signatures with a classical scheme.'],
      {
        titles: [],
        ids: [],
      }
    )
    const both = assessClaimSupport(
      claim,
      [
        'It combines lattice signatures with a classical scheme.',
        'The classical scheme is Ed25519, used in X.509 certificates.',
      ],
      { titles: [], ids: [] }
    )
    expect(one.supported).toBe(false)
    expect(both.supported).toBe(true)
  })

  it('does not judge a claim that has no content words, only its numbers', () => {
    expect(
      assessClaimSupport('It is 2035.', ['Deadline 2035.'], { titles: [], ids: [] }).supported
    ).toBe(true)
  })
})

describe('verifyCitations with the relevance guard (the two weak citations from the bench)', () => {
  const chunks = [SSH, CNSA]

  it('rejects the SSH forward-secrecy claim cited to the description line', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const weak = cite(
      'This approach ensures forward secrecy and resistance to quantum computing attacks while maintaining compatibility with existing SSH protocols.',
      [ref(SSH, 3)]
    )
    const violations = verifyCitations([weak], chunks)
    expect(violations.map((v) => v.reason)).toEqual(['weak-evidence'])
    expect(violations[0].support?.coverage).toBeLessThan(0.3)
  })

  it('rejects the CNSA claim cited to "Requires PQC: US"', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const weak = cite(
      'CNSA 2.0 allows pure PQC for national security systems at General Authority (GA) but mandates ML-KEM as the sole approved KEM for NSS.',
      [ref(CNSA, 5)]
    )
    expect(verifyCitations([weak], chunks).map((v) => v.reason)).toEqual(['weak-evidence'])
  })

  it('still accepts a claim that the same sentence supports', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const good = cite(
      'RFC 9941 specifies the sntrup761x25519-sha512 hybrid key exchange for SSH.',
      [ref(SSH, 3)]
    )
    expect(verifyCitations([good], chunks)).toEqual([])
  })

  it('without the guard (change A alone) both weak citations pass, as measured', () => {
    process.env.CITE_PROTO = 'a'
    const weak = cite(
      'This approach ensures forward secrecy and resistance to quantum computing attacks.',
      [ref(SSH, 3)]
    )
    expect(verifyCitations([weak], chunks)).toEqual([])
  })

  it('leaves legacy evidenceExcerpt citations alone', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const legacy: ClaimCitation = {
      claimExcerpt: 'Something far from the excerpt entirely, with many other words.',
      evidenceExcerpt: 'Requires PQC: US',
      chunkId: CNSA.id,
    }
    expect(verifyCitations([legacy], chunks)).toEqual([])
  })

  it('reports invalid references before weak ones', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const bad = cite('Anything at all.', ['library-RFC 9941#99'])
    expect(verifyCitations([bad], chunks).map((v) => v.reason)).toEqual(['sentence-not-found'])
  })
})

describe('weak-evidence in grounding', () => {
  const chunks = [SSH]
  const claim =
    'This approach ensures forward secrecy and resistance to quantum computing attacks while maintaining compatibility.'
  const weak = cite(claim, [ref(SSH, 3)])

  it('blocks a verified answer with its own reason, separate from invalid-evidence', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const decision = enforceGrounding(claim, [weak], chunks)
    expect(decision.approved).toBe(false)
    expect(decision.reasons).toContain('weak-evidence')
    expect(decision.reasons).not.toContain('invalid-evidence')
  })

  it('is handled like invalid evidence when salvaging and finalising', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    expect(salvageGroundedClaims(claim, [weak], chunks)).toBeNull()
    const result = finalizeGroundedResponse(`- ${claim}`, [weak], chunks)
    expect(result.mode).toBe('extractive')
    expect(result.content).not.toContain('forward secrecy')
  })

  it('keeps the supported claim when a weak one sits next to it (salvage)', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const good = 'RFC 9941 specifies the sntrup761x25519-sha512 hybrid key exchange for SSH.'
    const result = finalizeGroundedResponse(
      `- ${good}\n- ${claim}`,
      [cite(good, [ref(SSH, 3)]), weak],
      chunks
    )
    expect(result.mode).toBe('salvaged')
    expect(result.content).toContain('sntrup761x25519-sha512')
    expect(result.content).not.toContain('forward secrecy')
  })
})

describe('resolveNearMissChunkId (safe rules only)', () => {
  const chunks = [CMP, CAP('a'), CAP('b'), CAP_MIGRATION, BUSINESS_TOOL, SSH]

  it('repairs the real dropped "-0" suffix (mc-pkienrollmentprotocols-cmpkemkeyupdate)', () => {
    expect(resolveNearMissChunkId('mc-pkienrollmentprotocols-cmpkemkeyupdate', chunks)).toEqual({
      chunkId: 'mc-pkienrollmentprotocols-cmpkemkeyupdate-0',
      rule: 'suffix',
    })
  })

  it('does not repair the real source-name near miss "capability-checklist": it names several chunks', () => {
    expect(resolveNearMissChunkId('capability-checklist', chunks)).toBeNull()
  })

  it('repairs a source name that names exactly one retrieved chunk (business-center)', () => {
    expect(resolveNearMissChunkId('business-center', chunks)).toEqual({
      chunkId: 'business-tool-migration-verification',
      rule: 'source',
    })
  })

  it('repairs case and separator differences', () => {
    expect(resolveNearMissChunkId('LIBRARY_rfc-9941', chunks)).toEqual({
      chunkId: 'library-RFC 9941',
      rule: 'normalised',
    })
  })

  it('repairs an extra suffix', () => {
    expect(resolveNearMissChunkId('library-RFC 9941-2', chunks)).toEqual({
      chunkId: 'library-RFC 9941',
      rule: 'suffix',
    })
  })

  it('stays invalid when several chunks match a suffix or separator form', () => {
    const several = [chunk('glossary-1', 'x'), chunk('glossary-2', 'y')]
    expect(resolveNearMissChunkId('glossary', several)).toBeNull()
    const twins = [chunk('Foo Bar', 'x'), chunk('foo-bar', 'y')]
    expect(resolveNearMissChunkId('FOO_BAR', twins)).toBeNull()
  })

  it('never turns one numbered record into another (glossary-182 is not glossary-168)', () => {
    expect(resolveNearMissChunkId('glossary-182', [chunk('glossary-168', 'x')])).toBeNull()
  })

  it('never resolves to a chunk that was not retrieved this turn', () => {
    // library-RFC 9881 exists in the corpus but is not among this turn's chunks.
    expect(resolveNearMissChunkId('library-RFC 9881', chunks)).toBeNull()
    expect(resolveNearMissChunkId('does-not-exist', chunks)).toBeNull()
    expect(resolveNearMissChunkId('', chunks)).toBeNull()
  })
})

describe('repairCitationIds', () => {
  const chunks = [CMP, CAP('a'), CAP('b'), CAP_MIGRATION, BUSINESS_TOOL]
  const claim = 'The sample server encrypts a newly issued certificate to the fresh ML-KEM-768 key.'

  it('rewrites the ref, records idRepaired and keeps what the model wrote', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const [fixed] = repairCitationIds(
      [cite(claim, ['mc-pkienrollmentprotocols-cmpkemkeyupdate#3'])],
      chunks
    )
    expect(fixed.evidenceRefs).toEqual(['mc-pkienrollmentprotocols-cmpkemkeyupdate-0#3'])
    expect(fixed.chunkId).toBe('mc-pkienrollmentprotocols-cmpkemkeyupdate-0')
    expect(fixed.idRepaired).toBe(true)
    expect(fixed.repairedFrom).toEqual(['mc-pkienrollmentprotocols-cmpkemkeyupdate#3'])
  })

  it('leaves exact ids untouched (no idRepaired flag)', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const original = cite(claim, [ref(CMP, 3)])
    expect(repairCitationIds([original], chunks)[0]).toBe(original)
  })

  it('leaves an ambiguous id invalid so verification still rejects it', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const c = cite(
      'Collection and immutable retention of 5-point technical migration evidence per system is required.',
      ['capability-checklist#3']
    )
    const [same] = repairCitationIds([c], chunks)
    expect(same.idRepaired).toBeUndefined()
    expect(verifyCitations([same], chunks).map((v) => v.reason)).toEqual(['unknown-chunk'])
  })

  it('does nothing when the id check is off', () => {
    process.env.CITE_PROTO = 'a'
    const c = cite(claim, ['mc-pkienrollmentprotocols-cmpkemkeyupdate#3'])
    expect(repairCitationIds([c], chunks)[0]).toBe(c)
  })

  it('repairs each ref of a multi-ref citation independently', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const [fixed] = repairCitationIds(
      [
        cite(claim, [
          'mc-pkienrollmentprotocols-cmpkemkeyupdate#3',
          'cap-business-migration-verification#4',
        ]),
      ],
      chunks
    )
    expect(fixed.evidenceRefs).toEqual([
      'mc-pkienrollmentprotocols-cmpkemkeyupdate-0#3',
      'cap-business-migration-verification#4',
    ])
  })

  it('a wrong repair is still caught by the guard when the claim does not match the sentence', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const [fixed] = repairCitationIds(
      [
        cite('The five evidence-reference fields are filled in the dashboard.', [
          'business-center#3',
        ]),
      ],
      chunks
    )
    expect(fixed.idRepaired).toBe(true)
    expect(verifyCitations([fixed], chunks).map((v) => v.reason)).toEqual(['weak-evidence'])
  })

  it('finalises an answer whose only fault was the dropped suffix as verified', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const result = finalizeGroundedResponse(
      `- ${claim}`,
      [cite(claim, ['mc-pkienrollmentprotocols-cmpkemkeyupdate#3'])],
      chunks
    )
    expect(result.mode).toBe('verified')
    expect(result.citations[0].idRepaired).toBe(true)
    expect(result.citedChunkIds).toEqual(['mc-pkienrollmentprotocols-cmpkemkeyupdate-0'])
  })

  it('without the id check the same answer fails as before', () => {
    process.env.CITE_PROTO = 'a+guard'
    const result = finalizeGroundedResponse(
      `- ${claim}`,
      [cite(claim, ['mc-pkienrollmentprotocols-cmpkemkeyupdate#3'])],
      chunks
    )
    expect(result.mode).toBe('extractive')
  })
})

describe('local prompt: the id is the only name shown for a chunk', () => {
  it('drops the source name from the header when sentences are numbered', () => {
    process.env.CITE_PROTO = 'a+guard+id'
    const prompt = buildLocalSystemPrompt([CAP_MIGRATION], undefined, 4000, 8)
    expect(prompt).toContain('--- id: cap-business-migration-verification | ')
    expect(prompt).not.toContain('capability-checklist')
    expect(prompt).not.toContain('Source:')
  })

  it('keeps the source name in the legacy (unnumbered) prompt', () => {
    process.env.CITE_PROTO = 'none'
    const prompt = buildLocalSystemPrompt([CAP_MIGRATION], undefined, 4000, 8)
    expect(prompt).toContain('Source: capability-checklist')
  })
})
