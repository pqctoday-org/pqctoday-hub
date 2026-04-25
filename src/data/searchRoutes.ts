// SPDX-License-Identifier: GPL-3.0-only
import type { SearchChunk } from '@/services/search/SearchIndex'

/**
 * Maps a rag-corpus chunk to the in-app navigation path that surfaces it.
 * Falls back to the chunk's own `deepLink` when no mapping is defined.
 */
export function chunkToRoute(chunk: SearchChunk): string {
  const { source, deepLink, metadata } = chunk

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
}

/** Sources hidden from curious persona when advancedViewsUnlocked is false */
export const ADVANCED_SOURCES = new Set(['openssl-guide', 'playground-guide', 'certifications'])
