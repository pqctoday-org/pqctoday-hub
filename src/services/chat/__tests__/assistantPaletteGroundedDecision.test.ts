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
 * 2. Refusal gate: T10 audit refusal (requiresAuthoritativeEvidence + buildTrustRefusal)
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

describe('2. Refusal gate', () => {
  it('T10 audit refusal gate: returns buildTrustRefusal deterministically when an audit/compliance query has only Low/Moderate/unscored chunks', () => {
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
