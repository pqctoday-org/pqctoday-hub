// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { assessClaimSupport, extractTerms } from './citationRelevance'
import { repairCitationIds, resolveNearMissChunkId } from './citationIds'
import { verifyCitations } from './citationVerification'
import { enforceGrounding } from './groundingPolicy'
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

describe('extractTerms', () => {
  it('treats a name with its number as one unit, and keeps other numbers bare', () => {
    const t = extractTerms(
      'FIPS 203/204 keys are ~1,184 bytes in TLS 1.3 and ML-KEM-768 after 2035; SP 800-208, FIPS 140-3.'
    )
    expect(t.names.sort()).toEqual(
      ['fips|203', 'fips|204', 'tls|1.3', 'kem|768', 'sp|800-208', 'fips|140-3'].sort()
    )
    expect(t.numbers.sort()).toEqual(['1184', '2035'])
    expect(t.words).toEqual(expect.arrayContaining(['key', 'byte', 'tls', 'kem']))
    expect(t.words).not.toContain('are')
    expect(t.words).not.toContain('keys')
  })

  it('does not turn "of 60 institutions" or "November 2025" into a name', () => {
    const t = extractTerms('A survey of 60 institutions between November 2025 and January 2026.')
    expect(t.names).toEqual([])
    expect(t.numbers.sort()).toEqual(['2025', '2026', '60'])
  })

  it('writes short unit forms after a number in their canonical form', () => {
    for (const text of ['10 min', '10 minutes', '10min']) {
      expect(extractTerms(text).words).toEqual(['minute'])
    }
    expect(extractTerms('1,184 B').words).toEqual(['byte'])
    expect(extractTerms('1.2 KB').words).toEqual(['kilobyte'])
    expect(extractTerms('32 s').words).toEqual(['second'])
    // A bare "b" or "s" that does not follow a number is not a unit.
    expect(extractTerms('signer B').words).toEqual(['signer'])
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
  const ctx = { titles: ['RFC 9881'] }
  const supported = (claim: string, sentences: string[], c: { titles: string[] } = ctx) =>
    assessClaimSupport(claim, sentences, c)

  it('accepts a verbatim or lightly reworded claim', () => {
    const sentence =
      'Definition: IETF standard defining how to use ML-DSA digital signatures in X.509 certificates and Certificate Revocation Lists (CRLs).'
    expect(
      supported(
        'The standard defines how to use ML-DSA digital signatures in X.509 certificates and Certificate Revocation Lists (CRLs).',
        [sentence]
      ).supported
    ).toBe(true)
  })

  it('rejects a number that is nowhere in the cited sentence', () => {
    const a = supported('The standard is a Proposed Standard and was published in 2025.', [
      'Document Status: Proposed Standard',
    ])
    expect(a).toMatchObject({
      supported: false,
      reason: 'missing-identifier',
      missingIdentifiers: ['2025'],
    })
  })

  describe('names with a version number are matched as a unit', () => {
    it('accepts the same name, with or without the space, and from a list', () => {
      expect(
        supported('TLS 1.3 adds a hybrid group.', ['TLS 1.3 adds a hybrid key exchange group.'])
          .supported
      ).toBe(true)
      expect(
        supported('It uses SHA-512 for hashing.', ['The hash is SHA512 for hashing.']).supported
      ).toBe(true)
      expect(
        supported('FIPS 204 defines the signature scheme.', [
          'FIPS 203/204/205 define the lattice schemes and the signature scheme.',
        ]).supported
      ).toBe(true)
      expect(
        supported('ML-KEM-768 gives security level 3.', [
          'ML-KEM-512/768/1024 give security levels 1, 3 and 5; level 3 is the middle.',
        ]).supported
      ).toBe(true)
      expect(
        supported('SP 800-208 covers stateful hash-based signatures.', [
          'NIST SP 800-208 covers stateful hash-based signatures.',
        ]).supported
      ).toBe(true)
      expect(
        supported('FIPS 140-3 validation is required.', [
          'FIPS 140-3 validation is required for the module.',
        ]).supported
      ).toBe(true)
    })

    it('does not demand a bare "1.3" when the sentence names the same thing', () => {
      const a = supported('The TLS 1.3 handshake grows.', ['TLS 1.3 handshake grows with PQC.'])
      expect(a.supported).toBe(true)
      expect(a.missingIdentifiers).toEqual([])
    })

    it('rejects the same word with another number', () => {
      for (const [claim, sentence] of [
        ['TLS 1.3 adds a hybrid group.', 'TLS 1.2 adds a hybrid key exchange group.'],
        [
          'FIPS 203 defines the key encapsulation mechanism.',
          'FIPS 204 defines the key encapsulation mechanism.',
        ],
        ['ML-KEM-768 gives security level 3.', 'ML-KEM-512 gives security level 1.'],
      ]) {
        expect(supported(claim, [sentence]).reason).toBe('missing-identifier')
      }
    })
  })

  describe('units and abbreviations', () => {
    it('treats min/minutes, B/bytes, KB/kilobytes and s/seconds as the same', () => {
      expect(
        supported('This module has a duration of 10 minutes.', ['Duration: 10 min']).supported
      ).toBe(true)
      expect(supported('The key is 1,184 bytes.', ['Key size: 1184 B']).supported).toBe(true)
      expect(supported('The message is 2 kilobytes.', ['Message size: 2 KB']).supported).toBe(true)
      expect(supported('Handshake time is 3 seconds.', ['Handshake time: 3 s']).supported).toBe(
        true
      )
    })

    it('still rejects a different number with the same unit', () => {
      expect(
        supported('This module has a duration of 20 minutes.', ['Duration: 10 min']).supported
      ).toBe(false)
    })
  })

  describe('identifiers come from the cited sentence and its chunk title, never the chunk id', () => {
    // "RFC 9881" names the chunk; the description sentence itself does not repeat it.
    const claim = 'RFC 9881 defines X.509 OIDs and certificate structures for ML-DSA signatures.'
    const sentence =
      'Description: Defines X.509 OIDs and certificate structures for ML-DSA signatures.'

    it('a name that is only in the chunk id does not count', () => {
      const a = supported(claim, [sentence], {
        titles: ['Algorithm Identifiers for ML-DSA in X.509'],
      })
      expect(a).toMatchObject({ supported: false, reason: 'missing-identifier' })
      expect(a.missingIdentifiers).toEqual(['rfc 9881'])
    })

    it('the chunk title may name the subject and its number', () => {
      const a = supported(claim, [sentence], {
        titles: ['RFC 9881: Algorithm Identifiers for ML-DSA'],
      })
      expect(a.supported).toBe(true)
    })

    it('title words still count towards content-word coverage', () => {
      const a = supported(
        'Hybrid key exchange for SSH is specified.',
        ['Specified: sntrup761x25519 for SSH.'],
        {
          titles: ['Hybrid Key Exchange'],
        }
      )
      expect(a.inSentencesOrTitle).toBeGreaterThan(a.inSentences)
    })
  })

  describe('each reference on its own, then pooling for words only', () => {
    // The real "ACVP tests ML-KEM, ML-DSA, SLH-DSA" claim: only the ML-DSA and SLH-DSA
    // specifications are ACVP specifications; the ML-KEM sentence is the FIPS 203 record.
    const acvpClaim =
      'NIST ACVP tests ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205).'
    const sentences = [
      'Description: Specifies ML-KEM (Kyber) with three parameter sets (512, 768, 1024) for quantum-resistant key establishment.',
      'Description: NIST CAVP draft defining the ACVP JSON for testing ML-DSA (FIPS 204) implementations.',
      'Description: NIST CAVP draft defining the ACVP JSON for testing SLH-DSA (FIPS 205) implementations.',
    ]

    it('closes the hole: pooled refs cannot supply the identifier that no cited sentence has', () => {
      const a = supported(acvpClaim, sentences, { titles: ['ACVP JSON Specification'] })
      expect(a.supported).toBe(false)
      expect(a.reason).toBe('missing-identifier')
      expect(a.missingIdentifiers.length).toBeGreaterThan(0)
    })

    it('one sentence must hold every identifier, even when each is in some cited sentence', () => {
      const a = supported('Signer A uses FIPS 204 and signer B uses FIPS 205 here.', [
        'Signer A uses FIPS 204 here.',
        'Signer B uses FIPS 205 here.',
      ])
      expect(a.supported).toBe(false)
      expect(a.reason).toBe('missing-identifier')
    })

    it('pooling still tops up content-word overlap when one sentence holds the identifiers', () => {
      const claim =
        'The scheme combines lattice signatures with Ed25519 for X.509 certificates in enterprise deployments.'
      const one = supported(claim, ['It combines lattice signatures with Ed25519 for X.509 data.'])
      const pooled = supported(claim, [
        'It combines lattice signatures with Ed25519 for X.509 data.',
        'The certificates use the classical scheme in enterprise deployments.',
      ])
      expect(one.supported).toBe(false)
      expect(pooled.supported).toBe(true)
    })
  })

  it('rejects a title that carries the claim: title words cannot replace the sentence', () => {
    // Every claim word is in the title, but only one is in the cited sentence.
    const a = supported('Hybrid key exchange deployment guidance.', ['Status: Draft'], {
      titles: ['Hybrid Key Exchange Deployment Guidance'],
    })
    expect(a).toMatchObject({ supported: false, reason: 'title-only', inSentences: 0 })
  })

  it('does not judge a claim that has no content words, only its numbers', () => {
    expect(supported('It is 2035.', ['Deadline 2035.'], { titles: [] }).supported).toBe(true)
  })
})

describe('verifyCitations with the relevance guard (the two weak citations from the bench)', () => {
  const chunks = [SSH, CNSA]

  it('rejects the SSH forward-secrecy claim cited to the description line', () => {
    const weak = cite(
      'This approach ensures forward secrecy and resistance to quantum computing attacks while maintaining compatibility with existing SSH protocols.',
      [ref(SSH, 3)]
    )
    const violations = verifyCitations([weak], chunks)
    expect(violations.map((v) => v.reason)).toEqual(['weak-evidence'])
    expect(violations[0].support?.coverage).toBeLessThan(0.3)
  })

  it('rejects the CNSA claim cited to "Requires PQC: US"', () => {
    const weak = cite(
      'CNSA 2.0 allows pure PQC for national security systems at General Authority (GA) but mandates ML-KEM as the sole approved KEM for NSS.',
      [ref(CNSA, 5)]
    )
    expect(verifyCitations([weak], chunks).map((v) => v.reason)).toEqual(['weak-evidence'])
  })

  it('still accepts a claim that the same sentence supports', () => {
    const good = cite('The sntrup761x25519-sha512 hybrid key exchange for SSH is specified.', [
      ref(SSH, 3),
    ])
    expect(verifyCitations([good], chunks)).toEqual([])
  })

  it('holds an excerpt citation to the same rule, with the verbatim excerpt as the cited text', () => {
    const weakExcerpt: ClaimCitation = {
      claimExcerpt:
        'This approach ensures forward secrecy and resistance to quantum computing attacks while maintaining compatibility.',
      evidenceExcerpt: 'Type: RFC | Status: Released (Informational RFC)',
      chunkId: SSH.id,
    }
    expect(verifyCitations([weakExcerpt], [SSH]).map((v) => v.reason)).toEqual(['weak-evidence'])
    const goodExcerpt: ClaimCitation = {
      claimExcerpt: 'It specifies the sntrup761x25519-sha512 hybrid key exchange for SSH.',
      evidenceExcerpt:
        'Description: Specifies sntrup761x25519-sha512 hybrid key exchange for SSH; supersedes draft-ietf-sshm-ntruprime-ssh.',
      chunkId: SSH.id,
    }
    expect(verifyCitations([goodExcerpt], [SSH])).toEqual([])
  })

  it('reports invalid references before weak ones', () => {
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
    const decision = enforceGrounding(claim, [weak], chunks)
    expect(decision.approved).toBe(false)
    expect(decision.reasons).toContain('weak-evidence')
    expect(decision.reasons).not.toContain('invalid-evidence')
  })

  it('drops only the weak statement: nothing supported is left, so the sources list is shown', () => {
    const result = finalizeGroundedResponse(`- ${claim}`, [weak], chunks)
    expect(result.mode).toBe('extractive')
    expect(result.content).not.toContain('forward secrecy')
  })

  it('keeps the supported statement and removes the weak one, counting it', () => {
    const good = 'It specifies the sntrup761x25519-sha512 hybrid key exchange for SSH.'
    const result = finalizeGroundedResponse(
      `- ${good}\n- ${claim}`,
      [cite(good, [ref(SSH, 3)]), weak],
      chunks
    )
    expect(result.mode).toBe('partially-verified')
    expect(result.droppedStatements).toBe(1)
    expect(result.content).toContain('sntrup761x25519-sha512')
    expect(result.content).not.toContain('forward secrecy')
    expect(result.citations).toHaveLength(1)
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
    const original = cite(claim, [ref(CMP, 3)])
    expect(repairCitationIds([original], chunks)[0]).toBe(original)
  })

  it('leaves an ambiguous id invalid so verification still rejects it', () => {
    const c = cite(
      'Collection and immutable retention of 5-point technical migration evidence per system is required.',
      ['capability-checklist#3']
    )
    const [same] = repairCitationIds([c], chunks)
    expect(same.idRepaired).toBeUndefined()
    expect(verifyCitations([same], chunks).map((v) => v.reason)).toEqual(['unknown-chunk'])
  })

  it('repairs each ref of a multi-ref citation independently', () => {
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
    const result = finalizeGroundedResponse(
      `- ${claim}`,
      [cite(claim, ['mc-pkienrollmentprotocols-cmpkemkeyupdate#3'])],
      chunks
    )
    expect(result.mode).toBe('verified')
    expect(result.citations[0].idRepaired).toBe(true)
    expect(result.citedChunkIds).toEqual(['mc-pkienrollmentprotocols-cmpkemkeyupdate-0'])
  })
})

describe('local prompt: the id is the only name shown for a chunk', () => {
  it('drops the source name from the header when sentences are numbered', () => {
    const prompt = buildLocalSystemPrompt([CAP_MIGRATION], undefined, 4000, 8)
    expect(prompt).toContain('--- id: cap-business-migration-verification | ')
    expect(prompt).not.toContain('capability-checklist')
    expect(prompt).not.toContain('Source:')
  })
})
