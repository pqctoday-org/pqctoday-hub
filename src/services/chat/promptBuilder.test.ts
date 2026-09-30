// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildLocalSystemPrompt, buildGeminiSystemPrompt } from './promptBuilder'
import type { RAGChunk } from '@/types/ChatTypes'
import { validateDeepLink } from '@/services/search/deepLinkGrammar'

let structuredCitationsEnabled = false
vi.mock('@/services/featureFlags', () => ({
  useStructuredCitations: () => structuredCitationsEnabled,
  useEmbeddingRetrieval: () => false,
}))

/** Minimal RAGChunk for tests that need context blocks */
const mockChunk: RAGChunk = {
  id: 'test-1',
  source: 'algorithms',
  title: 'ML-KEM Overview',
  content: 'ML-KEM is a lattice-based key encapsulation mechanism standardized in FIPS 203.',
  category: 'algorithms',
  metadata: { family: 'lattice' },
  deepLink: '/algorithms?highlight=ml-kem',
}

// The local (WebLLM) prompt is a token-budget-constrained condensation of
// buildGeminiSystemPrompt (see GeminiService.systemPrompt.test.ts) — every
// constraint category the Gemini prompt enumerates individually needs to
// survive that condensation in at least a compact form, on the provider
// already documented (WebLLMService.ts, ProviderSetup.tsx) as more prone to
// hallucinate. These tests pin the categories a 2026-08-18 audit found had
// been silently dropped rather than compacted: certification-status claims,
// product-algorithm-support claims, and source-specific (not generic) hedging.
describe('buildLocalSystemPrompt', () => {
  beforeEach(() => {
    structuredCitationsEnabled = false
  })

  it('includes "PQC Today Assistant" identity text', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toContain('PQC Today Assistant')
  })

  it('includes the context-only knowledge boundary instruction', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toMatch(/Answer ONLY from context/i)
  })

  it('prohibits inventing certification status', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toMatch(/certification status/i)
    expect(result).toContain('FIPS validated')
  })

  it('prohibits claiming a product supports an algorithm not stated in context', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toMatch(/product supports an algorithm/i)
  })

  it('uses the exact corpus-insufficient refusal', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toContain(
      "Based on the PQC Today database, I don't have enough information about [topic]."
    )
  })

  it('answers partial corpus coverage without inviting remembered facts', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toMatch(/then answer from what IS supported/i)
    expect(result).toContain('Do not use general knowledge or training-memory facts')
  })

  it('surfaces conflicting sources instead of silently picking one', () => {
    const result = buildLocalSystemPrompt([])
    expect(result).toMatch(/sources conflict/i)
  })

  it('includes the entity inventory when chunks are provided', () => {
    const result = buildLocalSystemPrompt([mockChunk])
    expect(result).toContain('ENTITY INVENTORY')
    expect(result).toContain(
      'If the user asks about an item not in this inventory, say it is not in the current database'
    )
  })

  it('includes retrieved chunk content in the context block', () => {
    const result = buildLocalSystemPrompt([mockChunk])
    expect(result).toContain('ML-KEM is a lattice-based key encapsulation mechanism')
  })
})

// Structured citations (§7.1 of the hallucination-reduction plan) are gated
// behind useStructuredCitations() — required in corpus-only mode. These tests pin both
// halves of that contract: zero prompt change when off (so the flag is
// truly a no-op today), and the citation instruction + chunk-id context
// header present when on, for BOTH providers.
describe('structured citations (useStructuredCitations flag)', () => {
  beforeEach(() => {
    structuredCitationsEnabled = false
  })

  it('local prompt: omits the citations instruction and chunk ids when off', () => {
    const result = buildLocalSystemPrompt([mockChunk])
    expect(result).not.toMatch(/```citations/)
    expect(result).not.toContain('id: test-1')
  })

  it('gemini prompt: omits the citations instruction and chunk ids when off', () => {
    const result = buildGeminiSystemPrompt([mockChunk])
    expect(result).not.toMatch(/```citations/)
    expect(result).not.toContain('id: test-1')
  })

  it('local prompt: includes the citations instruction and chunk id when on', () => {
    structuredCitationsEnabled = true
    const result = buildLocalSystemPrompt([mockChunk])
    expect(result).toMatch(/```citations/)
    expect(result).toContain('id: test-1')
    expect(result).toMatch(/claimExcerpt/)
    expect(result).toMatch(/chunkId/)
  })

  it('gemini prompt: includes the citations instruction and chunk id when on', () => {
    structuredCitationsEnabled = true
    const result = buildGeminiSystemPrompt([mockChunk])
    expect(result).toMatch(/```citations/)
    expect(result).toContain('id: test-1')
    expect(result).toMatch(/claimExcerpt/)
    expect(result).toMatch(/chunkId/)
    expect(result).not.toContain('```followups')
  })
})

// Every `/<route>?key=` the prompts advertise must be a key the target page
// reads (per deepLinkGrammar) — otherwise sanitizeDeepLink strips it at click
// time and the link silently lands on the bare page.
describe('advertised deep-link params match the grammar', () => {
  const PAGE_ROUTES = [
    'algorithms',
    'timeline',
    'library',
    'migrate',
    'leaders',
    'compliance',
    'threats',
    'patents',
  ]
  function advertisedKeys(prompt: string): Array<{ route: string; key: string }> {
    const out: Array<{ route: string; key: string }> = []
    const re = new RegExp(`/(${PAGE_ROUTES.join('|')})\\?([^\\s)\`,]+)`, 'g')
    for (const m of prompt.matchAll(re)) {
      for (const part of m[2].split('&')) {
        const key = part.split('=')[0]
        if (key) out.push({ route: `/${m[1]}`, key })
      }
    }
    return out
  }

  it('gemini prompt advertises only grammar-valid keys', () => {
    const pairs = advertisedKeys(buildGeminiSystemPrompt([]))
    expect(pairs.length).toBeGreaterThan(10)
    const bad = pairs.filter(({ route, key }) => validateDeepLink(`${route}?${key}=x`) !== null)
    expect(bad).toEqual([])
  })

  it('local prompt delegates deep links to deterministic post-processing', () => {
    const prompt = buildLocalSystemPrompt([])
    expect(advertisedKeys(prompt)).toEqual([])
    expect(prompt).toContain('application appends validated deep links')
  })

  it('no longer advertises the dead forms', () => {
    const prompt = buildGeminiSystemPrompt([])
    for (const dead of [
      '/migrate?q=',
      '/library?ind=',
      '/leaders?view=',
      'tab=<insights|patents>',
      'pqc=<true|false>',
      '/timeline?event=<title>',
    ])
      expect(prompt).not.toContain(dead)
  })
})
