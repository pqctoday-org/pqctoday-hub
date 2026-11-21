// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { parseCitations } from './parseCitations'
import { resolveCitationEvidence, verifyCitations } from './citationVerification'
import { finalizeGroundedResponse } from './responseFinalization'
import { keepVerifiedStatements } from './groundingPolicy'
import { buildLocalSystemPrompt } from './promptBuilder'
import {
  chunkSentences,
  formatNumberedSentences,
  parseEvidenceRef,
  resolveEvidenceRef,
  splitSentences,
} from './sentenceIndex'

const chunk = (id: string, content: string, extra: Partial<RAGChunk> = {}): RAGChunk => ({
  id,
  source: 'algorithms',
  title: id,
  content,
  category: 'algorithm',
  metadata: {},
  ...extra,
})

const KEM = chunk(
  'algo-ml-kem-768',
  'Term: ML-KEM-768\nML-KEM-768 is a lattice-based key encapsulation mechanism standardised in FIPS 203. It provides NIST security level 3. Public keys are 1184 bytes.\nStatus: Final'
)
const SIG = chunk(
  'algo-ml-dsa-65',
  'ML-DSA-65 is a lattice-based signature scheme specified in FIPS 204. It targets NIST security level 3.'
)
const chunks = [KEM, SIG]
const byId = new Map(chunks.map((c) => [c.id, c]))

describe('splitSentences', () => {
  it('treats each line as a unit and splits sentences within a line', () => {
    expect(chunkSentences(KEM)).toEqual([
      'Term: ML-KEM-768',
      'ML-KEM-768 is a lattice-based key encapsulation mechanism standardised in FIPS 203.',
      'It provides NIST security level 3.',
      'Public keys are 1184 bytes.',
      'Status: Final',
    ])
  })

  it('does not split on abbreviations, initials, decimals or lower-case continuations', () => {
    expect(
      splitSentences('Use e.g. ML-KEM, vs. RSA, etc. as examples. Version 1.2 is out.')
    ).toEqual(['Use e.g. ML-KEM, vs. RSA, etc. as examples.', 'Version 1.2 is out.'])
    expect(splitSentences('Designed by D. J. Bernstein and others.')).toEqual([
      'Designed by D. J. Bernstein and others.',
    ])
    expect(splitSentences('FIPS 203. NIST selected it.')).toEqual([
      'FIPS 203.',
      'NIST selected it.',
    ])
  })

  it('keeps a numbered list marker with its item', () => {
    expect(
      splitSentences('1. Data Protection Analyzer — audit crypto.\n2. Model Vault. It wraps keys.')
    ).toEqual(['1. Data Protection Analyzer — audit crypto.', '2. Model Vault.', 'It wraps keys.'])
  })

  it('skips blank lines and rule lines, and is deterministic', () => {
    const text = 'One thing.\r\n\r\n---\nAnother thing. Third thing!'
    expect(splitSentences(text)).toEqual(['One thing.', 'Another thing.', 'Third thing!'])
    expect(splitSentences(text)).toEqual(splitSentences(text))
  })
})

describe('formatNumberedSentences', () => {
  it('numbers from 1 and keeps numbers contiguous when the budget cuts', () => {
    const full = formatNumberedSentences(KEM)
    expect(full.split('\n')[1]).toBe(
      '[2] ML-KEM-768 is a lattice-based key encapsulation mechanism standardised in FIPS 203.'
    )
    const cut = formatNumberedSentences(KEM, 140)
    const numbers = cut.split('\n').map((line) => Number(line.match(/^\[(\d+)\]/)?.[1]))
    expect(numbers).toEqual(numbers.map((_, i) => i + 1))
    expect(cut.length).toBeLessThanOrEqual(140)
    expect(numbers.length).toBeLessThan(5)
  })
})

describe('parseEvidenceRef / resolveEvidenceRef', () => {
  it('parses ids that contain spaces and hashes', () => {
    expect(parseEvidenceRef('gov-maturity-NSA CNSA 2.0 FAQ-L3-3#4')).toEqual({
      chunkId: 'gov-maturity-NSA CNSA 2.0 FAQ-L3-3',
      n: 4,
    })
    expect(parseEvidenceRef('a#b#12')).toEqual({ chunkId: 'a#b', n: 12 })
    expect(parseEvidenceRef('no-number')).toBeNull()
    expect(parseEvidenceRef('x#0')).toBeNull()
    expect(parseEvidenceRef('x#2a')).toBeNull()
    expect(parseEvidenceRef('#3')).toBeNull()
  })

  it('resolves to the same sentence the prompt numbered', () => {
    const resolved = resolveEvidenceRef('algo-ml-kem-768#3', byId)
    expect(resolved).toEqual({
      ok: true,
      chunkId: 'algo-ml-kem-768',
      sentence: 'It provides NIST security level 3.',
    })
    expect(formatNumberedSentences(KEM)).toContain('[3] It provides NIST security level 3.')
  })
})

describe('parseCitations with evidenceRef', () => {
  const fence = (json: string) => `Answer text.\n\`\`\`citations\n${json}\n\`\`\``

  it('accepts a single ref and derives chunkId from it', () => {
    const { citations, cleanContent } = parseCitations(
      fence('[{"claimExcerpt":"It provides level 3.","evidenceRef":"algo-ml-kem-768#3"}]')
    )
    expect(cleanContent).toBe('Answer text.')
    expect(citations).toEqual([
      {
        claimExcerpt: 'It provides level 3.',
        chunkId: 'algo-ml-kem-768',
        evidenceRefs: ['algo-ml-kem-768#3'],
      },
    ])
  })

  it('accepts several refs as an array or a comma separated string', () => {
    const arr = parseCitations(
      fence('[{"claimExcerpt":"c","evidenceRef":["algo-ml-kem-768#2","algo-ml-dsa-65#1"]}]')
    ).citations[0]
    expect(arr.evidenceRefs).toEqual(['algo-ml-kem-768#2', 'algo-ml-dsa-65#1'])
    const str = parseCitations(
      fence('[{"claimExcerpt":"c","evidenceRef":"algo-ml-kem-768#2, algo-ml-dsa-65#1"}]')
    ).citations[0]
    expect(str.evidenceRefs).toEqual(['algo-ml-kem-768#2', 'algo-ml-dsa-65#1'])
  })

  it('still accepts the legacy evidenceExcerpt + chunkId shape', () => {
    const { citations } = parseCitations(
      fence('[{"claimExcerpt":"c","evidenceExcerpt":"Status: Final","chunkId":"algo-ml-kem-768"}]')
    )
    expect(citations).toEqual([
      { claimExcerpt: 'c', evidenceExcerpt: 'Status: Final', chunkId: 'algo-ml-kem-768' },
    ])
  })

  it('drops an entry with neither a chunk id nor a ref', () => {
    expect(parseCitations(fence('[{"claimExcerpt":"c"}]')).citations).toEqual([])
  })
})

describe('verifyCitations with evidenceRefs', () => {
  const cite = (refs: string[], claimExcerpt = 'It provides NIST security level 3.') => ({
    claimExcerpt,
    chunkId: refs[0].slice(0, refs[0].lastIndexOf('#')),
    evidenceRefs: refs,
  })

  it('accepts a valid ref and resolves the evidence sentence', () => {
    const c = cite(['algo-ml-kem-768#3'])
    expect(verifyCitations([c], chunks)).toEqual([])
    expect(resolveCitationEvidence(c, chunks)).toBe('It provides NIST security level 3.')
  })

  it('rejects a chunk that was not retrieved this turn', () => {
    const v = verifyCitations([cite(['algo-unknown#1'])], chunks)
    expect(v.map((x) => x.reason)).toEqual(['unknown-chunk'])
  })

  it('rejects a sentence number that does not exist', () => {
    expect(verifyCitations([cite(['algo-ml-kem-768#9'])], chunks).map((x) => x.reason)).toEqual([
      'sentence-not-found',
    ])
    expect(verifyCitations([cite(['algo-ml-kem-768#0'])], chunks).map((x) => x.reason)).toEqual([
      'malformed-ref',
    ])
  })

  it('needs every ref of a multi-ref citation to resolve', () => {
    const ok = cite(['algo-ml-kem-768#2', 'algo-ml-dsa-65#1'], 'Both schemes are lattice-based.')
    expect(verifyCitations([ok], chunks)).toEqual([])
    expect(resolveCitationEvidence(ok, chunks)).toContain('FIPS 203')
    expect(resolveCitationEvidence(ok, chunks)).toContain('FIPS 204')
    const bad = cite(['algo-ml-kem-768#2', 'algo-ml-dsa-65#7'])
    expect(verifyCitations([bad], chunks).map((x) => x.reason)).toEqual(['sentence-not-found'])
    expect(resolveCitationEvidence(bad, chunks)).toBeNull()
  })

  it('uses the ref, not a stale excerpt, when both are present', () => {
    const c = { ...cite(['algo-ml-kem-768#3']), evidenceExcerpt: 'text that is not in the chunk' }
    expect(verifyCitations([c], chunks)).toEqual([])
  })
})

describe('finalizeGroundedResponse by sentence ref', () => {
  it('verifies an answer whose citations are all refs and exposes resolved evidence', () => {
    const claim = 'ML-KEM-768 provides NIST security level 3.'
    const result = finalizeGroundedResponse(
      `- ${claim}`,
      [{ claimExcerpt: claim, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] }],
      chunks
    )
    expect(result.mode).toBe('verified')
    expect(result.citations[0].evidenceExcerpt).toBe('It provides NIST security level 3.')
    expect(result.citedChunkIds).toEqual(['algo-ml-kem-768'])
  })
})

describe('per-claim drop (partially verified answers)', () => {
  const good = 'ML-KEM-768 provides NIST security level 3.'
  const good2 = 'ML-DSA-65 is a lattice-based signature scheme.'
  const badClaim = 'ML-DSA-65 was withdrawn by NIST in 2026.'
  const answer = `Here is what the database says.\n- ${good}\n- ${badClaim}\n- ${good2}\n- An uncited extra remark about lattices.`
  const cites = [
    { claimExcerpt: good, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] },
    { claimExcerpt: badClaim, chunkId: 'algo-ml-dsa-65', evidenceRefs: ['algo-ml-dsa-65#9'] },
    { claimExcerpt: good2, chunkId: 'algo-ml-dsa-65', evidenceRefs: ['algo-ml-dsa-65#1'] },
  ]

  it('keeps verified bullets, drops invalid and uncited ones, and never shows dropped text', () => {
    const result = finalizeGroundedResponse(answer, cites, chunks)
    expect(result.mode).toBe('partially-verified')
    expect(result.droppedStatements).toBe(3)
    expect(result.content).toContain(`- ${good}`)
    expect(result.content).toContain(`- ${good2}`)
    expect(result.content).not.toContain('withdrawn')
    expect(result.content).not.toContain('uncited extra')
    expect(result.content).not.toContain('Here is what the database says')
    expect(result.citedChunkIds.sort()).toEqual(['algo-ml-dsa-65', 'algo-ml-kem-768'])
  })

  it('keeps original wording and order (nothing is rebuilt from claims)', () => {
    const kept = keepVerifiedStatements(answer, cites, chunks)!
    expect(kept.content.split('\n')).toEqual([`- ${good}`, `- ${good2}`])
    expect(kept.kept).toBe(2)
  })

  it('splits two sentences on one line and keeps only the verified one', () => {
    const line = `${good} ${badClaim}`
    const result = finalizeGroundedResponse(
      line,
      [
        { claimExcerpt: good, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] },
        { claimExcerpt: badClaim, chunkId: 'algo-ml-dsa-65', evidenceRefs: ['algo-ml-dsa-65#9'] },
      ],
      chunks
    )
    expect(result.mode).toBe('partially-verified')
    expect(result.content).toContain(good)
    expect(result.content).not.toContain('withdrawn')
  })

  it('falls back to extractive when nothing verifies', () => {
    const result = finalizeGroundedResponse(
      `- ${badClaim}`,
      [{ claimExcerpt: badClaim, chunkId: 'algo-ml-dsa-65', evidenceRefs: ['algo-ml-dsa-65#9'] }],
      chunks
    )
    expect(result.mode).toBe('extractive')
    expect(result.content).not.toContain('withdrawn')
  })

  it('stays verified when everything verifies', () => {
    const result = finalizeGroundedResponse(`- ${good}`, [cites[0]], chunks)
    expect(result.mode).toBe('verified')
    expect(result.droppedStatements).toBe(0)
  })
})

describe('local prompt (cite by sentence)', () => {
  it('numbers context sentences and asks for evidenceRef ', () => {
    const prompt = buildLocalSystemPrompt([KEM], undefined, 4000, 8)
    expect(prompt).toContain('[3] It provides NIST security level 3.')
    expect(prompt).toContain('evidenceRef')
    expect(prompt).not.toContain('evidenceExcerpt')
  })

  it('counts numbering inside the context budget: fewer sentences fit, none are cut mid-way', () => {
    const long = chunk(
      'c-long',
      Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ')
    )
    const prompt = buildLocalSystemPrompt([long], undefined, 4000, 8)
    const shown = [...prompt.matchAll(/^\[(\d+)\] (.+)$/gm)]
    expect(shown.length).toBeGreaterThan(5)
    expect(shown.length).toBeLessThan(40)
    expect(shown.every((m) => m[2].endsWith('is here.'))).toBe(true)
  })
})
