// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildLocalSystemPrompt,
  buildGeminiSystemPrompt,
  buildModuleLinkList,
  buildBusinessToolIdList,
  countPlaygroundTools,
} from './promptBuilder'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
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

// The prompt's list of Learn modules is built from the module catalog, so the
// assistant can link to every module that exists and states the same total the
// site shows. It used to be typed by hand: it said "51 total" while the catalog
// had 73, and the newest modules had no link at all.
describe('buildGeminiSystemPrompt — Learn module list parity', () => {
  const modules = Object.values(MODULE_CATALOG).filter((m) => m.id !== 'quiz')
  const prompt = buildGeminiSystemPrompt([])
  const listLine = prompt.split('\n').find((l) => l.startsWith('5. Learning modules (')) ?? ''
  const linkedIds = [...listLine.matchAll(/\]\(\/learn\/([a-z0-9-]+)\)/g)].map((m) => m[1])

  it('has the module list line', () => {
    expect(listLine).not.toBe('')
  })

  it('states the catalog total, without the synthetic Quiz entry', () => {
    expect(listLine).toContain(`5. Learning modules (${modules.length} total):`)
    expect(modules.length).toBe(Object.keys(MODULE_CATALOG).length - 1)
  })

  it('links every module in the catalog — none is missing from the prompt', () => {
    const missing = modules.map((m) => m.id).filter((id) => !linkedIds.includes(id))
    expect(missing).toEqual([])
  })

  it('links nothing that is not a module, and lists each module once', () => {
    const known = new Set(modules.map((m) => m.id))
    expect(linkedIds.filter((id) => !known.has(id))).toEqual([])
    expect(new Set(linkedIds).size).toBe(linkedIds.length)
    expect(linkedIds).toHaveLength(modules.length)
  })

  it("uses each module's catalog title as its link text", () => {
    for (const m of modules) {
      expect(listLine).toContain(`[${m.title}](/learn/${m.id})`)
    }
  })

  it('buildModuleLinkList agrees with the prompt', () => {
    const { count, links } = buildModuleLinkList()
    expect(count).toBe(modules.length)
    expect(listLine).toContain(links)
  })
})

// Like the module list, the planning-tool ids and the playground tool count in
// the prompt come from their registries. They were typed by hand: 17 of the 37
// planning tools were named, and "63+" playground tools were claimed against 58.
describe('buildGeminiSystemPrompt — business tool list parity', () => {
  const prompt = buildGeminiSystemPrompt([])
  const listLine =
    prompt.split('\n').find((l) => l.includes('/business/tools/<toolId> — actual toolIds:')) ?? ''
  const promptIds = (listLine.split('actual toolIds:')[1] ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const registryIds = BUSINESS_TOOLS.map((tool) => tool.id)

  it('has the tool id line', () => {
    expect(listLine).not.toBe('')
  })

  it('names every business tool in the registry — none is missing from the prompt', () => {
    expect(registryIds.filter((id) => !promptIds.includes(id))).toEqual([])
  })

  it('names nothing that is not a registered tool, and each tool once', () => {
    expect(promptIds.filter((id) => !registryIds.includes(id))).toEqual([])
    expect(new Set(promptIds).size).toBe(promptIds.length)
    expect(promptIds).toHaveLength(registryIds.length)
  })

  it('buildBusinessToolIdList agrees with the prompt', () => {
    expect(listLine).toContain(`actual toolIds: ${buildBusinessToolIdList()}`)
  })
})

describe('buildGeminiSystemPrompt — playground tool count parity', () => {
  const prompt = buildGeminiSystemPrompt([])
  const line =
    prompt.split('\n').find((l) => l.includes('/playground/<toolId> (one page per tool')) ?? ''
  const claim = /one page per tool — (\d+) tools: (\d+) native \+ (\d+) Docker-sandbox/.exec(line)

  it('states the total, native and sandbox counts', () => {
    expect(claim).not.toBeNull()
  })

  it('matches the playground registry', () => {
    const sandbox = WORKSHOP_TOOLS.filter((tool) => tool.sandbox).length
    expect(Number(claim?.[1])).toBe(WORKSHOP_TOOLS.length)
    expect(Number(claim?.[2])).toBe(WORKSHOP_TOOLS.length - sandbox)
    expect(Number(claim?.[3])).toBe(sandbox)
    expect(countPlaygroundTools()).toEqual({
      total: WORKSHOP_TOOLS.length,
      native: WORKSHOP_TOOLS.length - sandbox,
      sandbox,
    })
  })

  it('native plus sandbox adds up to the total', () => {
    expect(Number(claim?.[2]) + Number(claim?.[3])).toBe(Number(claim?.[1]))
  })

  it('no longer carries a typed "63+" style count', () => {
    expect(line).not.toMatch(/\d+\+ native/)
  })
})
