// SPDX-License-Identifier: GPL-3.0-only
import type { SearchChunk } from '@/services/search/SearchIndex'

/**
 * Maps a rag-corpus chunk to the in-app navigation path that surfaces it.
 * Falls back to the chunk's own `deepLink` when no mapping is defined.
 */
export function chunkToRoute(chunk: SearchChunk): string {
  const { source, deepLink, metadata } = chunk

  // Protocol Support matrix: repair the corpus's stale deepLink
  // (`?tab=protocol&highlight=` — a non-existent tab + wrong param) to the real
  // Protocol Support tab + `?protocol=<id>` detail deep link. Handled before the
  // generic explicit-deepLink fallthrough since that link is known-bad.
  if (source === 'protocol-matrix') {
    const protocolId = (metadata?.protocolId as string | undefined) ?? ''
    return protocolId
      ? `/algorithms?tab=support&protocol=${encodeURIComponent(protocolId)}`
      : '/algorithms?tab=support'
  }

  // Use explicit deepLink when available and well-formed
  if (deepLink && deepLink.startsWith('/')) return deepLink

  switch (source) {
    case 'glossary':
      return `/learn/pqc-101`

    case 'library': {
      const ref = (metadata?.referenceId as string | undefined) ?? ''
      return ref ? `/library?ref=${encodeURIComponent(ref)}` : '/library'
    }

    case 'compliance':
    case 'certifications': {
      const cert = (metadata?.certId as string | undefined) ?? ''
      return cert ? `/compliance?cert=${encodeURIComponent(cert)}` : '/compliance'
    }

    case 'migrate': {
      const sw = (metadata?.softwareName as string | undefined) ?? ''
      return sw ? `/migrate?q=${encodeURIComponent(sw)}&from_search=1` : '/migrate'
    }

    case 'algorithms': {
      const algo = (metadata?.algoName as string | undefined) ?? chunk.title
      return `/algorithms?highlight=${encodeURIComponent(algo)}&from_search=1`
    }

    case 'timeline': {
      const event = (metadata?.eventId as string | undefined) ?? ''
      return event ? `/timeline?event=${encodeURIComponent(event)}` : '/timeline'
    }

    case 'threats':
      return '/threats'

    case 'leaders':
      return '/leaders'

    case 'modules':
    case 'module-content':
    case 'module-summaries':
    case 'module-topic-summaries':
    case 'module-curious':
    case 'module-qa': {
      const mod = (metadata?.moduleId as string | undefined) ?? ''
      return mod ? `/learn/${mod}` : '/learn'
    }

    case 'transitions': {
      const mod = (metadata?.moduleId as string | undefined) ?? ''
      const term = (metadata?.termId as string | undefined) ?? ''
      if (mod && term) return `/learn/${mod}?tab=transition&highlight=${encodeURIComponent(term)}`
      return mod ? `/learn/${mod}` : '/learn'
    }

    case 'quiz':
      return '/learn/quiz'

    case 'playground-guide':
      return '/playground'

    case 'openssl-guide':
      return '/openssl'

    case 'user-manual':
    case 'documentation':
      return '/about'

    case 'authoritative-sources':
      return '/compliance'

    case 'business-center':
      return '/business'

    case 'assessment':
      return '/assess'

    case 'right-panel':
    case 'guided-tour':
    case 'achievements':
    case 'changelog':
    case 'priority-matrix':
      return '/'

    case 'cswp39':
      return '/compliance?tab=cswp39'

    case 'document-enrichment': {
      // Source-dependent fallback when chunk has no explicit deepLink. Generator now
      // emits one for all collections (library/threats/timeline/catalog), so this is
      // mostly a safety net.
      const collection = (metadata?.collection as string | undefined) ?? ''
      const refId = (metadata?.refId as string | undefined) ?? ''
      if (collection === 'library' && refId) return `/library?ref=${encodeURIComponent(refId)}`
      if (collection === 'threats' && refId) return `/threats?id=${encodeURIComponent(refId)}`
      if (collection === 'timeline') return '/timeline'
      if (collection === 'catalog' && refId) return `/migrate?q=${encodeURIComponent(refId)}`
      return '/library'
    }

    case 'governance-maturity': {
      const refId = (metadata?.refId as string | undefined) ?? ''
      return refId
        ? `/compliance?tab=cswp39&evref=${encodeURIComponent(refId)}`
        : '/compliance?tab=cswp39'
    }

    case 'patents': {
      const patent = (metadata?.patentNum as string | undefined) ?? ''
      return patent ? `/patents?patent=${encodeURIComponent(patent)}` : '/patents'
    }

    case 'personas':
      return '/learn'

    case 'tracks':
      return '/learn'

    case 'trusted-sources':
      return '/compliance'

    case 'vendors': {
      const vendor = (metadata?.vendorName as string | undefined) ?? chunk.title
      return `/migrate?vendor=${encodeURIComponent(vendor)}`
    }

    case 'nice':
      return '/learn'

    case 'protocol-matrix':
      return '/algorithms?tab=protocol'

    case 'concept-registry':
      return '/library'

    case 'concept-xwalk':
    case 'counter-claims':
    case 'regulatory-timeline':
      return '/compliance'

    case 'algo-product-xref':
    case 'implementation-attacks':
    case 'standard-algo-xref':
      return '/algorithms'

    case 'vendor-roadmap':
      return '/migrate'

    // WS6a — registry-derived tool entries. These always carry an explicit
    // `deepLink`, so the fallthrough above normally handles them; these cases
    // exist so a tool whose deepLink is ever dropped still lands on its own
    // route from `metadata.toolId` rather than silently falling back to '/'.
    case 'workshop-tool': {
      const toolId = (metadata?.toolId as string | undefined) ?? ''
      return toolId ? `/playground/${encodeURIComponent(toolId)}` : '/playground'
    }

    case 'business-tool': {
      const toolId = (metadata?.toolId as string | undefined) ?? ''
      return toolId ? `/business/tools/${encodeURIComponent(toolId)}` : '/business/tools'
    }

    default:
      return '/'
  }
}

/** Human-readable label for each source type, used in the palette group headers. */
export const SOURCE_LABELS: Record<string, string> = {
  glossary: 'Glossary',
  library: 'Library',
  compliance: 'Compliance',
  certifications: 'Certifications',
  migrate: 'Products',
  algorithms: 'Algorithms',
  timeline: 'Timeline',
  threats: 'Threats',
  leaders: 'Leaders',
  'module-content': 'Learn',
  'module-summaries': 'Learn',
  'module-topic-summaries': 'Learn',
  modules: 'Learn',
  'module-curious': 'Learn',
  'module-qa': 'Learn',
  transitions: 'Learn',
  quiz: 'Quiz',
  'playground-guide': 'Playground',
  'openssl-guide': 'OpenSSL',
  'user-manual': 'Guide',
  documentation: 'Docs',
  'authoritative-sources': 'Sources',
  'business-center': 'Business Center',
  assessment: 'Assessment',
  changelog: 'Changelog',
  achievements: 'Achievements',
  'right-panel': 'Assistant',
  'guided-tour': 'Tour',
  'priority-matrix': 'Matrix',
  cswp39: 'CSWP.39',
  'document-enrichment': 'Document Analysis',
  'governance-maturity': 'Governance Maturity',
  patents: 'Patents',
  personas: 'Personas',
  tracks: 'Learning Tracks',
  'trusted-sources': 'Authoritative Sources',
  vendors: 'Vendors',
  'algo-product-xref': 'Algorithm Implementations',
  'concept-registry': 'Concept Registry',
  'concept-xwalk': 'Concept Relationships',
  'counter-claims': 'Policy Disagreements',
  'implementation-attacks': 'Implementation Attacks',
  nice: 'NICE Framework',
  'protocol-matrix': 'Protocol Matrix',
  'regulatory-timeline': 'Regulatory Timeline',
  'standard-algo-xref': 'Standards Map',
  'vendor-roadmap': 'Vendor Roadmaps',
  // WS6a (2026-08-02) — the tools themselves, not their guide prose. Before
  // this, `playground-guide` and `business-center` were the only tool-adjacent
  // sources, so no individual tool was ever a search result. Populated from
  // the two registries by services/search/toolSearchEntries.ts.
  'workshop-tool': 'Crypto Lab Tools',
  'business-tool': 'Business Tools',
  // WS22 Stage 3 (2026-08-21) — the pages themselves. /revisions, /sponsor,
  // /editorial-independence and /simulation had zero corpus chunks pointing at
  // them, so no query could reach them. Populated from ROUTE_META by
  // services/search/pageSearchEntries.ts.
  page: 'Pages',
}

/**
 * Sources the ⌘K palette guarantees a grouped-UI slot to (`ensureSources`).
 *
 * These are narrow, registry-derived sources in a corpus of thousands of prose
 * chunks, so on a broad query they never reach the global top-60 and vanish
 * from their own group. WS6a proved the lever on the two tool sources; WS22
 * Stage 3 adds the page tier for the same reason — four routed pages had zero
 * corpus chunks at all (see services/search/pageSearchEntries.ts).
 *
 * Declared as literals here so the eager palette does not have to import the
 * entry generators; `pageSearchEntries.driftguard.test.ts` asserts this array
 * matches the real WORKSHOP_TOOL_SOURCE / BUSINESS_TOOL_SOURCE / PAGE_SOURCE
 * constants, so a rename cannot silently unwire the guarantee.
 */
export const PALETTE_ENSURE_SOURCES = ['workshop-tool', 'business-tool', 'page'] as const

/** Sources hidden from curious persona when advancedViewsUnlocked is false */
export const ADVANCED_SOURCES = new Set(['openssl-guide', 'playground-guide', 'certifications'])
