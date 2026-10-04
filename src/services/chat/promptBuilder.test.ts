// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildLocalSystemPrompt,
  buildGeminiSystemPrompt,
  buildModuleLinkList,
  buildBusinessToolIdList,
  buildLinkValueLists,
  buildMainPageList,
  countPlaygroundTools,
  MAIN_PAGES,
  THREAT_CRITICALITY_LEVELS,
} from './promptBuilder'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import {
  CRYPTO_FAMILY_ITEMS,
  FUNCTION_ITEMS,
  LEVEL_ITEMS,
  REGION_ITEMS,
  STATUS_ITEMS,
} from '@/components/Algorithms/algorithmFilterOptions'
import { TIMELINE_REGION_LABELS } from '@/components/Timeline/timelineRegions'
import { LEADER_CATEGORIES } from '@/components/Leaders/leadersConstants'
import {
  CLASS_PARAM_VALUES,
  DETAIL_TAB_VALUES,
  THREATS_VIEW_MODES,
  resolveProtocolParam,
} from '@/components/Threats/threatsUrlParams'
import { INTERACTIVE_TAB_IDS } from '@/components/Playground/contexts/interactiveTabs'
import { OPENSSL_CATEGORIES } from '@/components/OpenSSLStudio/categories'
import {
  CRITICALITY_ORDER,
  UNRATED_CRITICALITY,
  criticalityLevelsPresent,
} from '@/data/threatRowRules'
import { threatsData } from '@/data/threatsData'
import { lensProtocolsFor } from '@/data/threatProtocolLens'
import { ROUTE_META, isNoindexRoute } from '@/seo/routeMeta'
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
      // Wrong or incomplete values the Algorithms, Threats and Timeline lines used to carry.
      'fn=<sig|kem>',
      'level=<1|3|5>',
      '/algorithms?family=<name>',
      '/algorithms?region=<name>',
      'class=<hndl|hnfl>',
      'region=<americas|eu|apac|global>',
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

// The prompt's value lists for the filters that take a fixed set come from the
// pages' own lists (see buildLinkValueLists), so a value the page accepts is one
// the assistant can link, and a value it does not accept is never offered. They
// were typed by hand: `fn=<sig|kem>` made the Algorithms table come out empty
// (the page compares the exact strings KEM and Signature), and several lists
// were missing values the pages accept.
describe('buildGeminiSystemPrompt — link value lists match the pages', () => {
  const prompt = buildGeminiSystemPrompt([])
  const ids = (items: ReadonlyArray<{ id: string }>) =>
    items.map((item) => item.id).filter((id) => id !== 'All')

  /** The `a|b|c` list after `route?...param=<` in the prompt, each value decoded as the page reads it. */
  function listed(route: string, param: string): string[] {
    // eslint-disable-next-line security/detect-non-literal-regexp -- fixed route and parameter names
    const match = new RegExp(`${route}\\?(?:[^\\s,)]*&)?${param}=<([^>]*)>`).exec(prompt)
    expect(match, `${route}?${param}=<…> is in the prompt`).not.toBeNull()
    expect(match![1], `${route}?${param} values stay one token each`).not.toMatch(/\s/)
    return match![1].split('|').map((value) => decodeURIComponent(value))
  }

  describe('Algorithms', () => {
    it('fn is exactly KEM and Signature — the page compares those strings, so sig and kem match nothing', () => {
      expect(listed('/algorithms', 'fn')).toEqual(['KEM', 'Signature'])
      expect(listed('/algorithms', 'fn')).toEqual(ids(FUNCTION_ITEMS))
    })

    it('status offers Certified, Candidate and To Be Checked (the space written as %20)', () => {
      expect(listed('/algorithms', 'status')).toEqual(['Certified', 'Candidate', 'To Be Checked'])
      expect(listed('/algorithms', 'status')).toEqual(ids(STATUS_ITEMS))
      expect(prompt).toContain('status=<Certified|Candidate|To%20Be%20Checked>')
    })

    it('level offers 1 to 5', () => {
      expect(listed('/algorithms', 'level')).toEqual(['1', '2', '3', '4', '5'])
      expect(listed('/algorithms', 'level')).toEqual(ids(LEVEL_ITEMS))
    })

    it('family names every family the page lists', () => {
      expect(listed('/algorithms', 'family')).toEqual(ids(CRYPTO_FAMILY_ITEMS))
      expect(listed('/algorithms', 'family')).toHaveLength(7)
    })

    it('region names every region the page lists, BSI/ANSSI and Global included', () => {
      const regions = listed('/algorithms', 'region')
      expect(regions).toEqual(ids(REGION_ITEMS))
      expect(regions).toHaveLength(16)
      expect(regions).toEqual(expect.arrayContaining(['BSI/ANSSI', 'KpqC', 'CACR', 'Global']))
    })
  })

  it('Timeline: region includes mena', () => {
    expect(listed('/timeline', 'region')).toEqual(['americas', 'eu', 'mena', 'apac', 'global'])
    expect(listed('/timeline', 'region')).toEqual(Object.keys(TIMELINE_REGION_LABELS))
  })

  it('Leaders: cat lists all eight categories, Skeptic/Critic included', () => {
    const match = /\/leaders\?cat=<category — singular: ([^>]*)>/.exec(prompt)
    expect(match).not.toBeNull()
    const categories = match![1].split(', ')
    expect(categories).toEqual([...LEADER_CATEGORIES])
    expect(categories).toHaveLength(8)
    expect(categories).toContain('Skeptic/Critic')
  })

  describe('Threats', () => {
    it('class includes both', () => {
      expect(listed('/threats', 'class')).toEqual(['hndl', 'hnfl', 'both'])
      expect(listed('/threats', 'class')).toEqual([...CLASS_PARAM_VALUES])
    })

    it('mode is cards or table', () => {
      expect(listed('/threats', 'mode')).toEqual(['cards', 'table'])
      expect(listed('/threats', 'mode')).toEqual([...THREATS_VIEW_MODES])
    })

    it('threattab is detection or response', () => {
      expect(listed('/threats', 'threattab')).toEqual(['detection', 'response'])
      expect(listed('/threats', 'threattab')).toEqual([...DETAIL_TAB_VALUES])
    })

    it('criticality is the levels the threats carry, most severe first', () => {
      const advertised = listed('/threats', 'criticality')
      expect(advertised).toEqual(['Critical', 'High', 'Medium', 'Low'])
      expect(advertised).toEqual([...THREAT_CRITICALITY_LEVELS])
      expect(advertised).toEqual(
        criticalityLevelsPresent(threatsData).filter((level) => level !== UNRATED_CRITICALITY)
      )
      for (const level of advertised) expect(CRITICALITY_ORDER).toContain(level)
    })

    it('protocol gives example slugs that switch the protocol lens on', () => {
      const match = /\/threats\?protocol=<protocol slug, e\.g\. ([^>]*)>/.exec(prompt)
      expect(match).not.toBeNull()
      const lens = lensProtocolsFor(threatsData)
      for (const slug of match![1].split(', ')) {
        expect(resolveProtocolParam(slug, lens), `protocol=${slug}`).not.toBeNull()
      }
    })

    it('does not offer threat=, a legacy alias the link grammar strips', () => {
      // eslint-disable-next-line security/detect-unsafe-regex -- one fixed prompt string
      expect(prompt).not.toMatch(/\/threats\?(?:[^\s,)]*&)?threat=/)
    })
  })

  it('Playground: the interactive lab tab is one of its seven tabs', () => {
    expect(listed('/playground/interactive', 'tab')).toEqual([
      'data',
      'kem_ops',
      'sign_verify',
      'keystore',
      'logs',
      'symmetric',
      'hashing',
    ])
    expect(listed('/playground/interactive', 'tab')).toEqual([...INTERACTIVE_TAB_IDS])
    expect(prompt).not.toContain('key_wrap')
  })

  it('OpenSSL: cmd lists all fifteen categories, including version, files, configutl and pkcs11', () => {
    const match = /\/openssl\?cmd=<category> \(([^)]*)\)/.exec(prompt)
    expect(match).not.toBeNull()
    const categories = match![1].split(', ')
    expect(categories).toEqual([...OPENSSL_CATEGORIES])
    expect(categories).toHaveLength(15)
    expect(categories).toEqual(expect.arrayContaining(['version', 'files', 'configutl', 'pkcs11']))
  })

  it('buildLinkValueLists agrees with the prompt', () => {
    const lists = buildLinkValueLists()
    expect(listed('/algorithms', 'region').map((r) => r.replace(/ /g, '%20'))).toEqual(
      lists.algorithmRegion
    )
    expect(listed('/timeline', 'region')).toEqual(lists.timelineRegion)
    expect(listed('/threats', 'class')).toEqual(lists.threatClass)
    expect(listed('/playground/interactive', 'tab')).toEqual(lists.playgroundTab)
  })
})

// The "Main pages" line is a typed list (the route metadata that names every
// page is too large to import into the assistant's code), so this checks it
// against that metadata: a page added to the site must be in the line or named
// below as left out on purpose. Four real pages — Sponsor, Editorial
// Independence, Revisions and Navigate — had been missing.
describe('buildGeminiSystemPrompt — Main pages list matches the site routes', () => {
  const prompt = buildGeminiSystemPrompt([])
  const line = prompt.split('\n').find((l) => l.startsWith('4. Main pages:')) ?? ''
  const linked = [...line.matchAll(/\[([^\]]+)\]\((\/[^)]*)\)/g)].map((m) => ({
    label: m[1],
    path: m[2],
  }))
  const paths = linked.map((page) => page.path)

  // Linked on its own line of the prompt as "/ (Landing)", not in this list.
  const LEFT_OUT_ON_PURPOSE = ['/']

  // Learn modules, Playground tools and planning tools have their own lists in the prompt.
  const indexable = Object.keys(ROUTE_META).filter(
    (route) =>
      !route.startsWith('/learn/') &&
      !route.startsWith('/playground/') &&
      !route.startsWith('/business/tools/') &&
      !isNoindexRoute(route)
  )

  it('has the main pages line', () => {
    expect(line).not.toBe('')
    expect(paths.length).toBeGreaterThan(20)
  })

  it('links every indexable page, or names it as left out on purpose', () => {
    const missing = indexable.filter(
      (route) => !paths.includes(route) && !LEFT_OUT_ON_PURPOSE.includes(route)
    )
    expect(missing).toEqual([])
  })

  it('links only pages that exist and are indexed, each once', () => {
    expect(
      paths.filter((path) => !Object.hasOwn(ROUTE_META, path) || isNoindexRoute(path))
    ).toEqual([])
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('links the four pages it used to leave out', () => {
    expect(linked).toEqual(
      expect.arrayContaining([
        { label: 'Sponsor', path: '/sponsor' },
        { label: 'Editorial Independence', path: '/editorial-independence' },
        { label: 'Revisions', path: '/revisions' },
        { label: 'Navigate', path: '/navigate' },
      ])
    )
  })

  it('leaves out only pages that are linked elsewhere in the prompt', () => {
    for (const route of LEFT_OUT_ON_PURPOSE) {
      expect(Object.hasOwn(ROUTE_META, route)).toBe(true)
      expect(paths).not.toContain(route)
    }
    expect(prompt).toContain('/ (Landing)')
  })

  it('buildMainPageList agrees with the prompt', () => {
    expect(line).toBe(`4. Main pages: ${buildMainPageList()}`)
    expect(MAIN_PAGES).toHaveLength(paths.length)
  })
})
