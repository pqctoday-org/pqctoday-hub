// SPDX-License-Identifier: GPL-3.0-only
/**
 * Registry-derived search entries for the Crypto Lab and Command Center tools.
 *
 * Why this file exists (WS6a, 2026-08-02):
 *   Before this, no individual tool was a global ⌘K result. `SOURCE_LABELS` in
 *   src/data/searchRoutes.ts indexed `playground-guide` and `business-center` —
 *   *guide prose* — and neither `workshopRegistry` nor `businessToolsRegistry`
 *   was imported by the global palette or by the corpus. A visitor typing
 *   "ROI calculator" or "SLH-DSA sign" hit guide text, never the tool. 71
 *   browser-runnable tools were invisible to the product's primary search
 *   surface, which is the most plausible single explanation for the tool
 *   tier's discoverability score being the lowest of any axis in the product.
 *
 * Scope — browser-only:
 *   Sandbox scenarios (`WorkshopTool.sandbox === true`) are DELIBERATELY
 *   excluded. They run in an access-gated Docker container, so a browser
 *   visitor cannot execute them; surfacing 24 non-executable results in the
 *   primary search surface would make discoverability worse for the tools that
 *   do run. `toolSearchEntries.driftguard.test.ts` asserts both directions.
 *
 * These are lightweight registry-derived entries, NOT corpus chunks: nothing
 * here is written to public/data/rag-corpus.json. The registries stay the
 * single source of truth and the index is derived from them at load time, so a
 * renamed tool cannot drift out of search.
 */
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import type { RAGChunk } from '@/types/ChatTypes'

/**
 * Bump when the shape or population of these entries changes. Participates in
 * the ⌘K MiniSearch cache key so a stale serialized index built without (or
 * with an older set of) tool entries is discarded rather than served.
 */
export const TOOL_ENTRIES_VERSION = '1'

export const WORKSHOP_TOOL_SOURCE = 'workshop-tool'
export const BUSINESS_TOOL_SOURCE = 'business-tool'

/** Space-joined, de-duplicated, lower-cased keyword blob for MiniSearch. */
function keywordBlob(...groups: (string[] | undefined)[]): string {
  const seen = new Set<string>()
  for (const group of groups) {
    for (const raw of group ?? []) {
      const key = raw.trim().toLowerCase()
      if (key) seen.add(key)
    }
  }
  return Array.from(seen).join(' ')
}

/**
 * The 34 native, in-browser Crypto Lab tools as search entries.
 * Sandbox scenarios are filtered out — see the scope note above.
 */
export function workshopToolEntries(): RAGChunk[] {
  return WORKSHOP_TOOLS.filter((tool) => !tool.sandbox).map((tool) => ({
    id: `${WORKSHOP_TOOL_SOURCE}:${tool.id}`,
    source: WORKSHOP_TOOL_SOURCE,
    title: tool.name,
    // Keywords and algorithms go into `content` because MINISEARCH_CONFIG
    // indexes title/content/category only — an algorithm name a tool
    // implements has to be searchable, that is half the point of this file.
    content: [
      tool.description,
      keywordBlob(tool.keywords, tool.algorithms),
      tool.opensourceTool?.name ?? '',
    ]
      .filter(Boolean)
      .join(' — '),
    category: tool.category,
    deepLink: `/playground/${tool.id}`,
    metadata: {
      toolId: tool.id,
      ptId: tool.pt_id,
      difficulty: tool.difficulty,
      recommendedPersonas: tool.recommendedPersonas.join(','),
      wip: tool.wip ? 'true' : 'false',
    },
  }))
}

/** The 37 Command Center business tools as search entries. */
export function businessToolEntries(): RAGChunk[] {
  return BUSINESS_TOOLS.map((tool) => ({
    id: `${BUSINESS_TOOL_SOURCE}:${tool.id}`,
    source: BUSINESS_TOOL_SOURCE,
    title: tool.name,
    content: [tool.description, keywordBlob(tool.keywords)].filter(Boolean).join(' — '),
    category: tool.category,
    deepLink: `/business/tools/${tool.id}`,
    metadata: {
      toolId: tool.id,
      audience: tool.audience ?? 'business',
    },
  }))
}

/** Both registries, ready to append to the loaded corpus before indexing. */
export function toolSearchEntries(): RAGChunk[] {
  return [...workshopToolEntries(), ...businessToolEntries()]
}
