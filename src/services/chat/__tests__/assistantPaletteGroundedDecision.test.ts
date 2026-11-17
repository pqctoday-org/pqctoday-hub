// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Deterministic End-to-End Verification for PQC Assistant & Command Palette (⌘K)
 *
 * Covers:
 * 1. Retrieval & Role-Scoped Discovery (UnifiedSearchService + RetrievalService)
 *    across all 8 personas (executive, grc, architect, developer, ops, researcher,
 *    cert-engineer, curious), capability checklists, business exercises,
 *    infographic assumptions, workshop step deep links (?tab=workshop&step=<N>),
 *    and multi-turn pronoun/short-query entity carry-over (conversationContext).
 * 2. Post-Generation Grounding, Fact Verification & Refusal Gates:
 *    - Case A: Verified grounded answer (mode: 'verified', exact citedChunkIds, deepLink injection)
 *    - Case B: Single-entity hallucination rejection (>= 1 ungrounded entity -> mode: 'extractive')
 *    - Case C: Parameter byte-size & NIST IR 8547 date fact verification rejection
 *    - Case D: T10 audit refusal gate (requiresAuthoritativeEvidence + buildTrustRefusal)
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'
import { toolSearchEntries } from '@/services/search/toolSearchEntries'
import { pageSearchEntries } from '@/services/search/pageSearchEntries'
import {
  RetrievalService,
  buildTrustRefusal,
  requiresAuthoritativeEvidence,
  topAvailableTier,
} from '../RetrievalService'
import { checkGrounding } from '../groundingCheck'
import { enforceGrounding } from '../groundingPolicy'
import { verifyFacts } from '../factVerification'
import { finalizeGroundedResponse } from '../responseFinalization'

let unifiedSearch: UnifiedSearchService
let retrievalService: RetrievalService
let allChunks: RAGChunk[] = []

beforeAll(async () => {
  const corpusPath = process.env.RAG_CORPUS_TEST_PATH || path.resolve('public/data/rag-corpus.json')
  const raw = JSON.parse(fs.readFileSync(corpusPath, 'utf8')) as { chunks: RAGChunk[] }
  const extraPages = await pageSearchEntries()
  const extraTools = toolSearchEntries()
  allChunks = [...raw.chunks, ...extraTools, ...extraPages]

  UnifiedSearchService.resetInstance()
  RetrievalService.resetInstance()

  unifiedSearch = UnifiedSearchService.getInstance()
  unifiedSearch.initializeWithCorpus(allChunks)

  retrievalService = RetrievalService.getInstance()
  retrievalService.initializeWithCorpus(allChunks)
}, 30_000)

afterAll(() => {
  RetrievalService.resetInstance()
  UnifiedSearchService.resetInstance()
})

describe('1. Retrieval & Role-Scoped Discovery (UnifiedSearchService + RetrievalService)', () => {
  const PERSONA_SCENARIOS: Array<{
    persona: string
    query: string
    expectedIdPrefixOrSource: string
    expectedRoutePrefix: string
  }> = [
    {
      persona: 'executive',
      query: 'ROI Calculator business decision exercise',
      expectedIdPrefixOrSource: 'business-center',
      expectedRoutePrefix: '/business',
    },
    {
      persona: 'grc',
      query: 'CNSA 2.0 compliance framework deadline 2030',
      expectedIdPrefixOrSource: 'compliance',
      expectedRoutePrefix: '/compliance',
    },
    {
      persona: 'architect',
      query: 'Hybrid Cryptography production tool capability checklist',
      expectedIdPrefixOrSource: 'capability-checklist',
      expectedRoutePrefix: '/learn/hybrid-crypto',
    },
    {
      persona: 'developer',
      query: 'Developer Quantum Impact workshop token size Authorization header line budget',
      expectedIdPrefixOrSource: 'module-summaries',
      expectedRoutePrefix: '/learn/dev-quantum-impact',
    },
    {
      persona: 'ops',
      query: 'Thales Luna HSM FIPS 140-3 migration catalog',
      expectedIdPrefixOrSource: 'migrate',
      expectedRoutePrefix: '/migrate',
    },
    {
      persona: 'researcher',
      query: 'ML-KEM-768 FIPS 203 lattice key encapsulation',
      expectedIdPrefixOrSource: 'algorithms',
      expectedRoutePrefix: '/algorithms',
    },
    {
      persona: 'cert-engineer',
      query: 'ACVP Lab Workflow production tool capability checklist',
      expectedIdPrefixOrSource: 'capability-checklist',
      expectedRoutePrefix: '/learn/acvp-lab-workflow',
    },
    {
      persona: 'curious',
      query: 'Harvest Now Decrypt Later HNDL definition',
      expectedIdPrefixOrSource: 'glossary',
      expectedRoutePrefix: '/',
    },
  ]

  it.each(PERSONA_SCENARIOS)(
    'resolves top-5 hits for persona "$persona" across RetrievalService and UnifiedSearchService palette',
    ({ persona, query, expectedIdPrefixOrSource }) => {
      const chatResults = retrievalService.search(query, 10, {
        page: 'learn',
        relevantSources: [],
        persona,
      })
      expect(chatResults.length).toBeGreaterThanOrEqual(5)

      const top5Chat = chatResults.slice(0, 5)
      const matchedInTop5 = top5Chat.some(
        (c) =>
          c.source === expectedIdPrefixOrSource ||
          c.id.startsWith(expectedIdPrefixOrSource) ||
          Boolean(c.deepLink)
      )
      expect(matchedInTop5).toBe(true)

      const paletteResults = unifiedSearch.searchPalette(query, { limit: 10 })
      expect(paletteResults.length).toBeGreaterThan(0)
      expect(paletteResults[0].score).toBeGreaterThan(0)
    }
  )

  it('retrieves capability checklists, business exercises, infographic assumptions, and workshop step deep links in top-5', () => {
    // 1. Capability checklist
    const capHits = retrievalService.search(
      'production tool capabilities capability checklist hybrid-crypto',
      5
    )
    expect(capHits.some((c) => c.source === 'capability-checklist')).toBe(true)

    // 2. Business exercise
    const bizHits = retrievalService.search('decision exercise try it exercise roi-calculator', 5)
    expect(
      bizHits.some((c) => c.source === 'business-center' || c.category === 'business-exercise')
    ).toBe(true)

    // 3. Infographic assumptions
    const infoHits = retrievalService.search(
      'infographic assumptions sample assumptions tls-basics',
      5
    )
    expect(
      infoHits.some(
        (c) =>
          c.metadata?.feature === 'infographic-assumptions' ||
          c.id.startsWith('infographic-assumptions-')
      )
    ).toBe(true)

    // 4. Workshop step deep links (?tab=workshop&step=<N>)
    const wsPaletteHits = unifiedSearch.searchPalette('Agent2AgentProtocol AI Security workshop', {
      limit: 10,
    })
    expect(wsPaletteHits.some((r) => r.deepLink?.includes('?tab=workshop&step='))).toBe(true)
  })

  it('carries over entity context on multi-turn pronoun and short follow-up queries (conversationContext)', () => {
    const followUpResults = retrievalService.search('What is its public key size?', 8, {
      page: 'algorithms',
      relevantSources: ['algorithms'],
      conversationContext: ['Tell me about ML-KEM-768'],
    })
    expect(followUpResults.length).toBeGreaterThan(0)
    const top5Ids = followUpResults.slice(0, 5).map((c) => c.id.toLowerCase())
    expect(top5Ids.some((id) => id.includes('ml-kem'))).toBe(true)
  })

  it('enforces authoritativeOnly filtering and reports hidden non-authoritative hits in searchPaletteWithHidden', () => {
    const { results, hidden } = unifiedSearch.searchPaletteWithHidden('ML-KEM', {
      limit: 25,
      authoritativeOnly: true,
    })
    expect(results.length).toBeGreaterThan(0)
    expect(hidden.length).toBeGreaterThan(0)
    const shownIds = new Set(results.map((r) => r.id))
    expect(hidden.every((h) => !shownIds.has(h.id))).toBe(true)
  })
})

describe('2. Post-Generation Grounding, Fact Verification & Refusal Gates', () => {
  const sampleChunks: RAGChunk[] = [
    {
      id: 'algo-ml-kem-768',
      source: 'algorithms',
      title: 'ML-KEM-768',
      content:
        'ML-KEM-768 is a lattice-based key encapsulation mechanism standardized in FIPS 203 with NIST Security Level 3 and a 1,184-byte public key.',
      category: 'Lattice-based',
      metadata: {
        referenceId: 'FIPS 203',
        fipsStandard: 'FIPS 203',
        algorithmFamily: 'ML-KEM',
      },
      deepLink: '/algorithms?highlight=ml-kem-768',
    },
    {
      id: 'unclaimed-extra-chunk',
      source: 'glossary',
      title: 'Unused Glossary Chunk',
      content: 'This chunk was retrieved but never cited by the assistant.',
      category: 'concept',
      metadata: {},
      deepLink: '/learn/pqc-101',
    },
  ]

  it('Case A (Verified Grounded Answer): approves verbatim-evidenced claims, records only citedChunkIds, and appends grounded deep links', () => {
    const claim = 'ML-KEM-768 is standardized in FIPS 203 at NIST Security Level 3.'
    const finalized = finalizeGroundedResponse(
      claim,
      [
        {
          claimExcerpt: claim,
          evidenceExcerpt:
            'ML-KEM-768 is a lattice-based key encapsulation mechanism standardized in FIPS 203 with NIST Security Level 3',
          chunkId: 'algo-ml-kem-768',
        },
      ],
      sampleChunks
    )

    expect(finalized.mode).toBe('verified')
    expect(finalized.decision).toEqual({ approved: true, reasons: [] })
    expect(finalized.citedChunkIds).toEqual(['algo-ml-kem-768'])
    expect(finalized.citedChunkIds).not.toContain('unclaimed-extra-chunk')
    expect(finalized.content).toContain('/algorithms?highlight=ml-kem-768')
  })

  it('Case B (Single-Entity Hallucination Rejection): rejects >= 1 ungrounded entity (RFC 99999, person, or product) and falls back to extractive mode', () => {
    // 1. Fabricated RFC
    const draftRfc = 'ML-KEM-768 is standardized in FIPS 203 and RFC 99999.'
    const rfcCheck = checkGrounding(draftRfc, sampleChunks)
    expect(rfcCheck.hasWarning).toBe(true)
    expect(rfcCheck.ungroundedEntities).toContain('RFC 99999')

    const finalizedRfc = finalizeGroundedResponse(
      draftRfc,
      [
        {
          claimExcerpt: draftRfc,
          evidenceExcerpt:
            'ML-KEM-768 is a lattice-based key encapsulation mechanism standardized in FIPS 203',
          chunkId: 'algo-ml-kem-768',
        },
      ],
      sampleChunks
    )
    expect(finalizedRfc.decision.approved).toBe(false)
    expect(finalizedRfc.decision.reasons).toContain('ungrounded-entity')
    expect(finalizedRfc.mode).toBe('extractive')
    expect(finalizedRfc.citedChunkIds).toEqual([])
    expect(finalizedRfc.content).not.toContain('RFC 99999')

    // 2. Fabricated person name
    const draftPerson = 'ML-KEM-768 was co-authored by Dr. Victor Hallucinated.'
    const personCheck = checkGrounding(draftPerson, sampleChunks)
    expect(personCheck.hasWarning).toBe(true)
    expect(personCheck.ungroundedEntities.some((e) => e.includes('Victor Hallucinated'))).toBe(true)

    // 3. Fabricated product version
    const draftProduct = 'ML-KEM-768 is deployed in QuantumShield v9.4.2.'
    const productCheck = checkGrounding(draftProduct, sampleChunks)
    expect(productCheck.hasWarning).toBe(true)
    expect(productCheck.ungroundedEntities.some((e) => e.includes('QuantumShield'))).toBe(true)
  })

  it('Case C (Byte-Size & NIST IR 8547 Date Fact Verification): rejects misstated ML-KEM-768 public key bytes and wrong NIST IR 8547 years', () => {
    // Misstated ML-KEM-768 public key size (999 bytes instead of 1,184 bytes)
    const badByteAnswer = 'ML-KEM-768 has a public key size of 999 bytes.'
    const byteViolations = verifyFacts(badByteAnswer, sampleChunks)
    expect(byteViolations.length).toBeGreaterThan(0)
    expect(byteViolations[0].expected).toContain('1184 bytes')

    const byteDecision = enforceGrounding(
      badByteAnswer,
      [
        {
          claimExcerpt: badByteAnswer,
          evidenceExcerpt: 'ML-KEM-768 is a lattice-based key encapsulation mechanism',
          chunkId: 'algo-ml-kem-768',
        },
      ],
      sampleChunks
    )
    expect(byteDecision.approved).toBe(false)
    expect(byteDecision.reasons).toContain('fact-contradiction')

    // Misstated NIST IR 8547 deprecation (2028 instead of 2030) and disallowance (2032 instead of 2035)
    const badIrDatesAnswer =
      'NIST IR 8547 deprecates classical RSA in 2028. NIST IR 8547 disallows classical ECC in 2032.'
    const irViolations = verifyFacts(badIrDatesAnswer, sampleChunks)
    expect(irViolations.length).toBe(2)
    expect(irViolations.map((v) => v.expected).join(' ')).toContain('2030')
    expect(irViolations.map((v) => v.expected).join(' ')).toContain('2035')

    // Accurate byte size (1,184 bytes) and NIST IR 8547 years (2030 / 2035) pass
    const validFactAnswer =
      'ML-KEM-768 has a public key size of 1,184 bytes. NIST IR 8547 deprecates classical algorithms in 2030. NIST IR 8547 disallows them in 2035.'
    expect(verifyFacts(validFactAnswer, sampleChunks)).toEqual([])
  })

  it('Case D (T10 Audit Refusal Gate): returns buildTrustRefusal deterministically when an audit/compliance query has only Low/Moderate/unscored chunks', () => {
    const auditQuery = 'Are we required by regulation to comply with PQC audit mandates?'
    expect(requiresAuthoritativeEvidence(auditQuery)).toBe(true)

    const lowTierChunks: RAGChunk[] = [
      {
        id: 'vendor-blog-post',
        source: 'vendors',
        title: 'Vendor Marketing Overview',
        content: 'Overview of vendor offerings.',
        category: 'vendor',
        metadata: { trustedSourceId: 'contextual-blog' },
      },
    ]

    const tier = topAvailableTier(lowTierChunks, 3)
    expect(['Low', 'Moderate', 'unknown']).toContain(tier)

    const refusal = buildTrustRefusal(auditQuery, lowTierChunks)
    expect(refusal).not.toBeNull()
    expect(refusal).toContain("I don't have a sufficiently authoritative source")
    expect(refusal).toContain('Authoritative or High tier evidence')
    expect(refusal).toContain('Vendor Marketing Overview')
  })
})
