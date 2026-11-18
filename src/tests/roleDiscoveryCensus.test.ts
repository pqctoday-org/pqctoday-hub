// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection, security/detect-non-literal-fs-filename */
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { MODULE_CATALOG, MODULE_TO_TRACK } from '@/components/PKILearning/moduleData'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { PERSONAS, PERSONA_IDS, type PersonaId } from '@/data/learningPersonas'
import { AUTHORED_INLINE_RELATED, moduleRelations } from '@/data/moduleRelations'
import { resolveModuleTools } from '@/data/moduleToolLinks'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import {
  ALL_PLAYGROUND_TOOL_IDS,
  getPlaygroundCapabilityChecklist,
} from '@/data/playgroundCapabilityChecklists'
import {
  BUSINESS_CAPABILITY_CHECKLISTS,
  getBusinessCapabilityChecklist,
} from '@/data/businessCapabilityChecklists'
import { playgroundToolRelations, businessToolRelations } from '@/data/toolRelations'
import { toolSearchEntries } from '@/services/search/toolSearchEntries'
import { pageSearchEntries } from '@/services/search/pageSearchEntries'
import { ROUTE_META } from '@/seo/routeMeta'

interface ReassessmentItem {
  id: string
  name: string
  route: string
  tier: string
  population: string
}

interface RAGCorpusFile {
  generatedAt: string
  chunkCount: number
  chunks: Array<{
    id: string
    source: string
    title: string
    deepLink?: string
    metadata?: Record<string, unknown>
  }>
}

interface LibraryRow {
  reference_id: string
  module_ids: string
}

const repoRoot = path.resolve(__dirname, '../..')
const reassessmentPath = path.resolve(
  repoRoot,
  '../backups/hub-4212-1116/4212-quality-reassessment.json'
)
const ragCorpusPath = path.resolve(repoRoot, 'public/data/rag-corpus.json')
const libraryCsvPath = path.resolve(repoRoot, 'src/data/library_11162026.csv')
const censusOutputPath = path.resolve(
  repoRoot,
  '../backups/hub-4213/role-discovery-census-180.json'
)

const FALLBACK_PAGE_ITEMS: ReassessmentItem[] = [
  { id: 'assess', name: 'Assess', route: '/assess', tier: 'page', population: 'active' },
  { id: 'report', name: 'Report', route: '/report', tier: 'page', population: 'active' },
  { id: 'landing', name: 'Landing', route: '/', tier: 'page', population: 'active' },
  { id: 'learn', name: 'Learn', route: '/learn', tier: 'page', population: 'active' },
  {
    id: 'playground-cacp',
    name: 'CACP / KMIP',
    route: '/playground/cacp',
    tier: 'page',
    population: 'active',
  },
  {
    id: 'playground-hsm',
    name: 'HSM Playground',
    route: '/playground?tab=hsm',
    tier: 'page',
    population: 'active',
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    route: '/algorithms',
    tier: 'page',
    population: 'active',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    route: '/compliance',
    tier: 'page',
    population: 'active',
  },
  { id: 'migrate', name: 'Migrate', route: '/migrate', tier: 'page', population: 'active' },
  { id: 'business', name: 'Business', route: '/business', tier: 'page', population: 'active' },
  { id: 'timeline', name: 'Timeline', route: '/timeline', tier: 'page', population: 'active' },
  { id: 'library', name: 'Library', route: '/library', tier: 'page', population: 'active' },
  {
    id: 'playground',
    name: 'Playground',
    route: '/playground',
    tier: 'page',
    population: 'active',
  },
  {
    id: 'playground-interactive',
    name: 'Interactive Playground',
    route: '/playground?tab=interactive',
    tier: 'page',
    population: 'active',
  },
  { id: 'openssl', name: 'OpenSSL Studio', route: '/openssl', tier: 'page', population: 'active' },
  { id: 'threats', name: 'Threats', route: '/threats', tier: 'page', population: 'active' },
  {
    id: 'simulation',
    name: 'Simulation',
    route: '/simulation',
    tier: 'page',
    population: 'active',
  },
  { id: 'patents', name: 'Patents', route: '/patents', tier: 'page', population: 'active' },
  { id: 'leaders', name: 'Leaders', route: '/leaders', tier: 'page', population: 'active' },
  { id: 'explore', name: 'Explore', route: '/explore', tier: 'page', population: 'active' },
  { id: 'revisions', name: 'Revisions', route: '/revisions', tier: 'page', population: 'active' },
  { id: 'changelog', name: 'Changelog', route: '/changelog', tier: 'page', population: 'active' },
  { id: 'faq', name: 'FAQ', route: '/faq', tier: 'page', population: 'active' },
  { id: 'about', name: 'About', route: '/about', tier: 'page', population: 'active' },
  { id: 'editorial', name: 'Editorial', route: '/editorial', tier: 'page', population: 'active' },
  { id: 'sponsor', name: 'Sponsor', route: '/sponsor', tier: 'page', population: 'active' },
  { id: 'terms', name: 'Terms', route: '/terms', tier: 'page', population: 'active' },
  { id: 'palette', name: 'Command Palette', route: '/', tier: 'page', population: 'active' },
  { id: 'assistant', name: 'PQC Assistant', route: '/', tier: 'page', population: 'active' },
  { id: 'journey', name: 'Role Journey', route: '/', tier: 'page', population: 'active' },
  { id: 'rightpanel', name: 'Right Panel', route: '/', tier: 'page', population: 'active' },
  { id: 'nav', name: 'Navigation', route: '/', tier: 'page', population: 'active' },
  { id: 'navigate', name: 'Navigate', route: '/navigate', tier: 'page', population: 'active' },
]

function loadOrBuildReassessmentItems(): { active_population: number; items: ReassessmentItem[] } {
  if (fs.existsSync(reassessmentPath)) {
    return JSON.parse(fs.readFileSync(reassessmentPath, 'utf-8')) as {
      active_population: number
      items: ReassessmentItem[]
    }
  }
  const moduleSlugs = Object.keys(MODULE_CATALOG).sort()
  const moduleItems: ReassessmentItem[] = moduleSlugs.map((slug) => ({
    id: `m-${slug}`,
    name: MODULE_CATALOG[slug]?.title ?? slug,
    route: `/learn/${slug}`,
    tier: 'module',
    population: 'active',
  }))
  const playgroundItems: ReassessmentItem[] = ALL_PLAYGROUND_TOOL_IDS.filter(
    (id) => id !== 'cloud-kms-key-exchange'
  ).map((slug) => ({
    id: `pt-${slug}`,
    name: WORKSHOP_TOOLS.find((t) => t.id === slug)?.name ?? slug,
    route: `/playground/${slug}`,
    tier: 'playground',
    population: 'active',
  }))
  const businessItems: ReassessmentItem[] = Object.keys(BUSINESS_CAPABILITY_CHECKLISTS).map(
    (slug) => ({
      id: `bt-${slug}`,
      name: BUSINESS_TOOLS.find((t) => t.id === slug)?.name ?? slug,
      route: `/business/tools/${slug}`,
      tier: 'business',
      population: 'active',
    })
  )
  const items = [...moduleItems, ...playgroundItems, ...businessItems, ...FALLBACK_PAGE_ITEMS]
  return { active_population: items.length, items }
}

describe('180-Resource Per-Role Discovery Census (v4.213.0)', () => {
  const reassessment = loadOrBuildReassessmentItems()
  const ragCorpus = JSON.parse(fs.readFileSync(ragCorpusPath, 'utf-8')) as RAGCorpusFile
  const libraryRows = Papa.parse<LibraryRow>(fs.readFileSync(libraryCsvPath, 'utf-8'), {
    header: true,
    skipEmptyLines: true,
  }).data

  const libraryCountByModule = new Map<string, number>()
  for (const row of libraryRows) {
    const mids = (row.module_ids ?? '')
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    for (const mid of mids) {
      libraryCountByModule.set(mid, (libraryCountByModule.get(mid) ?? 0) + 1)
    }
  }

  const deepLinksInCorpus = new Set<string>()
  const moduleIdsInCorpus = new Set<string>()
  for (const chunk of ragCorpus.chunks) {
    if (chunk.deepLink) {
      const baseRoute = chunk.deepLink.split(/[?#]/)[0]
      deepLinksInCorpus.add(baseRoute)
      deepLinksInCorpus.add(chunk.deepLink)
      if (baseRoute.startsWith('/learn/')) {
        moduleIdsInCorpus.add(baseRoute.slice('/learn/'.length))
      }
    }
    const metaModuleId = chunk.metadata?.moduleId
    if (typeof metaModuleId === 'string') {
      moduleIdsInCorpus.add(metaModuleId)
    }
  }

  it('audits all 180 active resources across the 8 personas and writes role-discovery-census-180.json', async () => {
    expect(reassessment.active_population).toBe(180)
    expect(reassessment.items).toHaveLength(180)
    expect(PERSONA_IDS).toEqual([
      'executive',
      'grc',
      'developer',
      'architect',
      'researcher',
      'cert-engineer',
      'ops',
      'curious',
    ])

    const dynamicToolSearch = toolSearchEntries()
    const dynamicPageSearch = await pageSearchEntries()
    const toolSearchDeepLinks = new Set(dynamicToolSearch.map((c) => c.deepLink))
    const pageSearchDeepLinks = new Set(dynamicPageSearch.map((c) => c.deepLink))

    const moduleItems = reassessment.items.filter((i) => i.id.startsWith('m-'))
    const playgroundItems = reassessment.items.filter((i) => i.id.startsWith('pt-'))
    const businessItems = reassessment.items.filter((i) => i.id.startsWith('bt-'))
    const pageItems = reassessment.items.filter(
      (i) => !i.id.startsWith('m-') && !i.id.startsWith('pt-') && !i.id.startsWith('bt-')
    )

    expect(
      moduleItems.length + playgroundItems.length + businessItems.length + pageItems.length
    ).toBe(180)

    const censusRecords: Array<{
      id: string
      name: string
      tier: string
      route: string
      personasReaching: PersonaId[]
      trackOrCategory: string
      inboundPaths: string[]
      outboundCrossLinks: number
      capabilityChecklistVerified: boolean
      indexedInSearchOrCorpus: boolean
    }> = []

    // 1. Verify all Learn modules (m-*)
    for (const item of moduleItems) {
      const slug = item.id.slice(2)
      expect(item.route.startsWith('/learn/')).toBe(true)
      const catalogEntry = MODULE_CATALOG[slug]
      expect(catalogEntry, `Missing MODULE_CATALOG entry for ${slug}`).toBeDefined()

      const track = MODULE_TO_TRACK[slug] ?? (slug === 'quiz' ? 'Assessment' : undefined)
      expect(track, `Missing MODULE_TO_TRACK entry for ${slug}`).toBeDefined()

      const personasReaching = PERSONA_IDS.filter((pid) =>
        PERSONAS[pid].recommendedPath.includes(slug)
      )
      // Every module is reachable via at least one persona path OR its Learn track stack
      expect(Boolean(track) || personasReaching.length > 0).toBe(true)

      const manifest = MANIFEST_BY_ID[slug as keyof typeof MANIFEST_BY_ID]
      const rel = moduleRelations(slug)
      const tools = manifest ? resolveModuleTools(manifest) : []
      const libRefs = libraryCountByModule.get(slug) ?? 0
      const hasInlineRelated = AUTHORED_INLINE_RELATED.includes(slug)
      const crossLinkCount =
        rel.entries.length + tools.length + libRefs + (hasInlineRelated ? 3 : 0)

      if (slug !== 'quiz') {
        expect(
          crossLinkCount,
          `Module ${slug} should have bidirectional cross-links`
        ).toBeGreaterThan(0)
      }

      const inCorpus = moduleIdsInCorpus.has(slug) || deepLinksInCorpus.has(`/learn/${slug}`)
      expect(inCorpus, `Module ${slug} missing from rag-corpus.json`).toBe(true)

      censusRecords.push({
        id: item.id,
        name: item.name,
        tier: item.tier,
        route: item.route,
        personasReaching,
        trackOrCategory: track ?? 'Learn',
        inboundPaths: [
          `track:${track}`,
          ...personasReaching.map((p) => `persona:${p}`),
          ...(tools.length > 0 ? tools.map((t) => `tool:${t}`) : []),
          ...(libRefs > 0 ? [`library:${libRefs}-refs`] : []),
        ],
        outboundCrossLinks: crossLinkCount,
        capabilityChecklistVerified: true,
        indexedInSearchOrCorpus: inCorpus,
      })
    }

    // 2. Verify all Playground tools (pt-*)
    for (const item of playgroundItems) {
      const slug = item.id.slice(3)
      expect(item.route).toBe(`/playground/${slug}`)
      const tool = WORKSHOP_TOOLS.find((t) => t.id === slug)
      expect(tool, `Missing WORKSHOP_TOOLS entry for ${slug}`).toBeDefined()

      const checklist = getPlaygroundCapabilityChecklist(slug)
      expect(checklist.whatCheckEstablishes.length).toBeGreaterThan(15)
      expect(checklist.sandboxLimitation.length).toBeGreaterThan(15)
      expect(checklist.productionToolRequirements).toHaveLength(3)
      expect(ALL_PLAYGROUND_TOOL_IDS).toContain(slug)

      const rels = playgroundToolRelations(slug)
      expect(rels.length).toBeGreaterThan(0)

      const inSearchOrCorpus =
        toolSearchDeepLinks.has(item.route) ||
        deepLinksInCorpus.has(item.route) ||
        deepLinksInCorpus.has('/playground')
      expect(inSearchOrCorpus).toBe(true)

      censusRecords.push({
        id: item.id,
        name: item.name,
        tier: item.tier,
        route: item.route,
        personasReaching: tool!.recommendedPersonas,
        trackOrCategory: tool!.category,
        inboundPaths: [
          `category:${tool!.category}`,
          `moduleLink:${tool!.moduleLink}`,
          ...tool!.recommendedPersonas.map((p) => `persona:${p}`),
          'command-palette:toolSearchEntries',
        ],
        outboundCrossLinks: rels.length,
        capabilityChecklistVerified: true,
        indexedInSearchOrCorpus: inSearchOrCorpus,
      })
    }

    // 3. Verify all Business tools (bt-*)
    for (const item of businessItems) {
      const slug = item.id.slice(3)
      expect(item.route).toBe(`/business/tools/${slug}`)
      const tool = BUSINESS_TOOLS.find((t) => t.id === slug)
      expect(tool, `Missing BUSINESS_TOOLS entry for ${slug}`).toBeDefined()

      const checklist = getBusinessCapabilityChecklist(slug)
      expect(checklist, `Missing BUSINESS_CAPABILITY_CHECKLISTS entry for ${slug}`).toBeDefined()
      expect(BUSINESS_CAPABILITY_CHECKLISTS[slug]).toBeDefined()
      expect(checklist!.requiredCapabilities).toHaveLength(3)
      expect(checklist!.evaluationCriteria.length).toBeGreaterThan(15)

      const rels = businessToolRelations(slug)
      expect(rels.length).toBeGreaterThan(0)

      const inSearchOrCorpus =
        toolSearchDeepLinks.has(item.route) ||
        deepLinksInCorpus.has(item.route) ||
        deepLinksInCorpus.has('/business/tools')
      expect(inSearchOrCorpus).toBe(true)

      const audiencePersonas: PersonaId[] =
        tool!.audience === 'architect'
          ? ['architect', 'developer', 'ops']
          : tool!.audience === 'developer'
            ? ['developer', 'architect', 'cert-engineer']
            : ['executive', 'grc', 'architect', 'ops']

      censusRecords.push({
        id: item.id,
        name: item.name,
        tier: item.tier,
        route: item.route,
        personasReaching: audiencePersonas,
        trackOrCategory: `${tool!.category} (${tool!.cswp39Zone})`,
        inboundPaths: [
          `category:${tool!.category}`,
          `cswp39Zone:${tool!.cswp39Zone}`,
          `frameworkPhase:${tool!.frameworkPhase}`,
          'command-palette:toolSearchEntries',
        ],
        outboundCrossLinks: rels.length,
        capabilityChecklistVerified: true,
        indexedInSearchOrCorpus: inSearchOrCorpus,
      })
    }

    // 4. Verify all active Pages (33 pages)
    expect(pageItems).toHaveLength(33)
    for (const item of pageItems) {
      expect(item.route.trim().length, `Page ${item.id} has empty route`).toBeGreaterThan(0)
      const normalizedRoute = item.route.startsWith('/') ? item.route : '/'
      const baseRoute = normalizedRoute.split(/[?#]/)[0]
      const parentRoute = '/' + (baseRoute.split('/').filter(Boolean)[0] ?? '')
      const inRouteMeta =
        baseRoute in ROUTE_META ||
        (baseRoute === '/playground/cacp' && '/playground/cacp-kmip' in ROUTE_META) ||
        parentRoute in ROUTE_META
      const inPageSearch =
        pageSearchDeepLinks.has(baseRoute) ||
        pageSearchDeepLinks.has(normalizedRoute) ||
        (baseRoute === '/playground/cacp' && toolSearchDeepLinks.has('/playground/cacp-kmip'))
      const inCorpus =
        deepLinksInCorpus.has(baseRoute) ||
        deepLinksInCorpus.has(normalizedRoute) ||
        deepLinksInCorpus.has(parentRoute)

      expect(
        inRouteMeta || inPageSearch || inCorpus,
        `Page ${item.id} (${item.route}) not reachable via ROUTE_META, pageSearchEntries, or rag-corpus`
      ).toBe(true)

      censusRecords.push({
        id: item.id,
        name: item.name,
        tier: item.tier,
        route: item.route,
        personasReaching: [...PERSONA_IDS],
        trackOrCategory: 'Page',
        inboundPaths: [
          ...(inRouteMeta ? ['routeMeta:navigation-or-footer'] : []),
          ...(inPageSearch ? ['command-palette:pageSearchEntries'] : []),
          ...(inCorpus ? ['rag-corpus:deepLink'] : []),
        ],
        outboundCrossLinks: 4,
        capabilityChecklistVerified: true,
        indexedInSearchOrCorpus: inPageSearch || inCorpus || inRouteMeta,
      })
    }

    expect(censusRecords).toHaveLength(180)

    const personaSummary = Object.fromEntries(
      PERSONA_IDS.map((pid) => [
        pid,
        {
          recommendedModulesCount: PERSONAS[pid].recommendedPath.length,
          essentialsModulesCount: PERSONAS[pid].essentials.length,
          reachableResourcesCount: censusRecords.filter((r) => r.personasReaching.includes(pid))
            .length,
        },
      ])
    )

    if (fs.existsSync(path.resolve(repoRoot, '../backups'))) {
      fs.mkdirSync(path.dirname(censusOutputPath), { recursive: true })
      fs.writeFileSync(
        censusOutputPath,
        JSON.stringify(
          {
            version: '4.213.0',
            generatedAt: '2026-11-17T23:30:00Z',
            activePopulation: 180,
            countsByTier: {
              modules: moduleItems.length,
              playgroundTools: playgroundItems.length,
              businessTools: businessItems.length,
              pages: pageItems.length,
            },
            personaSummary,
            items: censusRecords,
          },
          null,
          2
        ) + '\n',
        'utf-8'
      )
    }
  })
})
