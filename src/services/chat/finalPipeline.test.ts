// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The one production grounding pipeline, for every provider: parse, derive, id check,
 * relevance guard, per-claim drop, reader note. Gemini-shaped drafts are replayed
 * through the same functions the hook calls (parseCitations, parseFollowUps,
 * deriveCorpusCitations, finalizeGroundedResponse), without a network call.
 */
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { parseCitations } from './parseCitations'
import { parseFollowUps } from './parseFollowUps'
import { deriveCorpusCitations } from './groundingPolicy'
import { finalizeGroundedResponse } from './responseFinalization'
import { removedStatementsNote } from './removedStatementsNote'
import { conversationToMarkdown } from './exportConversation'
import { buildGeminiSystemPrompt } from './promptBuilder'
import { verifyCitations } from './citationVerification'

const chunk = (id: string, content: string, extra: Partial<RAGChunk> = {}): RAGChunk => ({
  id,
  source: 'library',
  title: id,
  content,
  category: 'library',
  metadata: {},
  ...extra,
})

const KEM = chunk(
  'algo-ml-kem-768',
  [
    'Term: ML-KEM-768',
    'ML-KEM-768 is a lattice-based key encapsulation mechanism standardized in FIPS 203.',
    'It provides NIST security level 3.',
    'Public keys are 1184 bytes.',
  ].join('\n'),
  { source: 'algorithms', title: 'ML-KEM-768', deepLink: '/algorithms?highlight=ml-kem-768' }
)
const SSH = chunk(
  'library-RFC 9941',
  [
    'Reference: RFC 9941',
    'Description: Specifies sntrup761x25519-sha512 hybrid key exchange for SSH; supersedes draft-ietf-sshm-ntruprime-ssh.',
    'Type: RFC | Status: Released (Informational RFC)',
  ].join('\n'),
  { title: 'Streamlined NTRU Prime sntrup761 Key Exchange for SSH' }
)
const chunks = [KEM, SSH]

/** A Gemini-style draft: prose, a citations fence by sentence number, a follow-ups fence. */
function geminiDraft(
  bullets: string[],
  cites: Array<{ claim: string; ref: string | string[] }>,
  followUps = ['What else?']
): string {
  const json = JSON.stringify(cites.map((c) => ({ claimExcerpt: c.claim, evidenceRef: c.ref })))
  return `${bullets.join('\n')}\n\n\`\`\`citations\n${json}\n\`\`\`\n\n\`\`\`followups\n${JSON.stringify(followUps)}\n\`\`\``
}

/** What useChatSend does with a raw provider draft. */
function run(raw: string) {
  const { cleanContent: afterCitations, citations } = parseCitations(raw)
  const { cleanContent } = parseFollowUps(afterCitations)
  const effective = deriveCorpusCitations(cleanContent, citations, chunks)
  return finalizeGroundedResponse(cleanContent, effective, chunks)
}

describe('removedStatementsNote', () => {
  it('says nothing when nothing was removed', () => {
    expect(removedStatementsNote(0)).toBeNull()
    expect(removedStatementsNote(-1)).toBeNull()
    expect(removedStatementsNote(Number.NaN)).toBeNull()
  })

  it('is short, plain and neutral, singular and plural', () => {
    expect(removedStatementsNote(1)).toBe(
      '1 statement from the draft was left out because the retrieved sources did not support it.'
    )
    expect(removedStatementsNote(3)).toBe(
      '3 statements from the draft were left out because the retrieved sources did not support them.'
    )
  })

  it('appears in an exported conversation next to the answer it belongs to', () => {
    const md = conversationToMarkdown({
      id: 'c',
      title: 'T',
      createdAt: 0,
      updatedAt: 0,
      messages: [
        { id: 'a', role: 'assistant', content: 'Kept text.', timestamp: 0, removedStatements: 2 },
      ],
    })
    expect(md).toContain('Kept text.')
    expect(md).toContain('2 statements from the draft were left out')
  })
})

describe('a Gemini draft through the shared pipeline', () => {
  const good = 'ML-KEM-768 provides NIST security level 3.'
  const good2 = 'ML-KEM-768 is a lattice-based key encapsulation mechanism.'
  const unsupported = 'ML-KEM-768 was withdrawn by NIST in 2026.'

  it('verifies a fully supported draft and strips both fences', () => {
    const result = run(
      geminiDraft(
        [`- ${good}`, `- ${good2}`],
        [
          { claim: good, ref: 'algo-ml-kem-768#3' },
          { claim: good2, ref: 'algo-ml-kem-768#2' },
        ]
      )
    )
    expect(result.mode).toBe('verified')
    expect(result.droppedStatements).toBe(0)
    expect(result.content).not.toContain('```')
    expect(result.content).toContain(good)
  })

  it('drops only the claim whose citation fails; its text never appears anywhere in the result', () => {
    const result = run(
      geminiDraft(
        [`- ${good}`, `- ${unsupported}`, `- ${good2}`],
        [
          { claim: good, ref: 'algo-ml-kem-768#3' },
          { claim: unsupported, ref: 'algo-ml-kem-768#3' }, // real sentence, but it does not say this
          { claim: good2, ref: 'algo-ml-kem-768#2' },
        ]
      )
    )
    expect(result.mode).toBe('partially-verified')
    expect(result.droppedStatements).toBe(1)
    expect(result.content).toContain(good)
    expect(result.content).toContain(good2)
    expect(result.content).not.toContain('withdrawn')
    expect(JSON.stringify(result.citations)).not.toContain('withdrawn')
    expect(result.citations).toHaveLength(2)
  })

  it('repairs a near-miss chunk id from the model before judging the claim', () => {
    const result = run(geminiDraft([`- ${good}`], [{ claim: good, ref: 'ALGO_ML_KEM_768#3' }]))
    expect(result.mode).toBe('verified')
    expect(result.citations[0].idRepaired).toBe(true)
    expect(result.citedChunkIds).toEqual(['algo-ml-kem-768'])
  })

  it('accepts a reference list: one sentence holds the names, the others top up the words', () => {
    const claim =
      'ML-KEM-768 is a lattice-based key encapsulation mechanism in FIPS 203 that provides NIST security.'
    const result = run(
      geminiDraft([`- ${claim}`], [{ claim, ref: ['algo-ml-kem-768#2', 'algo-ml-kem-768#3'] }])
    )
    expect(result.mode).toBe('verified')
  })

  it('does not let a second reference supply a name that the first sentence lacks', () => {
    const claim = 'ML-KEM-768 is standardized in FIPS 203 and provides NIST security level 3.'
    const result = run(
      geminiDraft([`- ${claim}`], [{ claim, ref: ['algo-ml-kem-768#2', 'algo-ml-kem-768#3'] }])
    )
    expect(result.mode).toBe('extractive')
  })

  it('falls back to the sources list when nothing is supported, and shows no draft text', () => {
    const result = run(
      geminiDraft([`- ${unsupported}`], [{ claim: unsupported, ref: 'algo-ml-kem-768#3' }])
    )
    expect(result.mode).toBe('extractive')
    expect(result.droppedStatements).toBe(0)
    expect(result.content).not.toContain('withdrawn')
  })

  it('holds a legacy excerpt-shaped Gemini answer to the same guard', () => {
    const raw = `${good}\n\n\`\`\`citations\n${JSON.stringify([
      {
        claimExcerpt: good,
        evidenceExcerpt: 'It provides NIST security level 3.',
        chunkId: 'algo-ml-kem-768',
      },
    ])}\n\`\`\``
    expect(run(raw).mode).toBe('verified')
    const weak = `ML-KEM-768 resists every future attack and is mandated worldwide.\n\n\`\`\`citations\n${JSON.stringify(
      [
        {
          claimExcerpt: 'ML-KEM-768 resists every future attack and is mandated worldwide.',
          evidenceExcerpt: 'Public keys are 1184 bytes.',
          chunkId: 'algo-ml-kem-768',
        },
      ]
    )}\n\`\`\``
    expect(run(weak).mode).toBe('extractive')
  })
})

describe('the finaliser cannot reintroduce dropped text', () => {
  const good = 'ML-KEM-768 provides NIST security level 3.'
  const bad = 'ML-KEM-768 was withdrawn by NIST in 2026.'

  it('derived citations are sentence references that go through the guard', () => {
    const derived = deriveCorpusCitations(good, [], chunks)
    expect(derived).toHaveLength(1)
    expect(derived[0].evidenceRefs).toEqual(['algo-ml-kem-768#3'])
    expect(verifyCitations(derived, chunks)).toEqual([])
  })

  it('a derived citation whose best sentence does not support the statement is dropped, not shown', () => {
    const statement = 'ML-KEM-768 public keys are 9999 bytes long in every deployment.'
    const result = finalizeGroundedResponse(
      `- ${good}\n- ${statement}`,
      deriveCorpusCitations(
        `- ${good}\n- ${statement}`,
        [{ claimExcerpt: good, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] }],
        chunks
      ),
      chunks
    )
    expect(result.content).toContain(good)
    expect(result.content).not.toContain('9999')
    expect(result.droppedStatements).toBe(1)
  })

  it('a statement whose model citation was rejected is not re-derived from another sentence', () => {
    const modelCitation = {
      claimExcerpt: bad,
      chunkId: 'algo-ml-kem-768',
      evidenceRefs: ['algo-ml-kem-768#4'],
    }
    const derived = deriveCorpusCitations(`- ${good}\n- ${bad}`, [modelCitation], chunks)
    // Only the uncited sentence gets a derived citation; the model's own citation for `bad` stays as it was.
    expect(derived.filter((c) => c.claimExcerpt === bad)).toEqual([modelCitation])
    const result = finalizeGroundedResponse(`- ${good}\n- ${bad}`, derived, chunks)
    expect(result.content).not.toContain('withdrawn')
    expect(result.droppedStatements).toBe(1)
  })

  it('short fragments no verified claim contains are removed too', () => {
    const answer = `- ${good}\n- It is 2030.\n- ${good.replace('provides', 'offers')}`
    const result = finalizeGroundedResponse(
      answer,
      [{ claimExcerpt: good, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] }],
      chunks
    )
    expect(result.content).not.toContain('2030')
    expect(result.content).toContain(good)
  })

  it('every visible sentence of a partially verified answer lies inside a kept claim', () => {
    const answer = `Intro that nobody cited here.\n- ${good}\n- ${bad}\n\n## Heading\nTrailing uncited remark about lattices.`
    const result = finalizeGroundedResponse(
      answer,
      [
        { claimExcerpt: good, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] },
        { claimExcerpt: bad, chunkId: 'algo-ml-kem-768', evidenceRefs: ['algo-ml-kem-768#3'] },
      ],
      chunks
    )
    expect(result.mode).toBe('partially-verified')
    const visible = result.content.replace(/\n+Related.*$/s, '')
    for (const dropped of ['Intro', 'withdrawn', 'Heading', 'Trailing']) {
      expect(visible).not.toContain(dropped)
    }
    expect(result.droppedStatements).toBe(3)
  })
})

describe('Gemini prompt and pipeline agree', () => {
  it('the example reference in the prompt resolves with the same splitter the verifier uses', () => {
    const prompt = buildGeminiSystemPrompt([KEM])
    expect(prompt).toContain('[3] It provides NIST security level 3.')
    expect(prompt).toContain('"algo-ml-kem-768#2"')
  })
})
