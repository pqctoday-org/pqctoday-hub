// SPDX-License-Identifier: GPL-3.0-only
/**
 * Route-derived search entries for the page tier.
 *
 * Why this file exists (WS12 gap 4 / WS22 Phase 1 Stage 3, 2026-08-21):
 *   `toolSearchEntries.ts` fixed exactly this problem one tier down. Its own
 *   doc comment names the root cause: 71 browser-runnable tools "were invisible
 *   to the product's primary search surface". The page tier has the identical
 *   hole. Checked directly against public/data/rag-corpus.json (16,322 chunks,
 *   generated 2026-08-18), FOUR routed pages had ZERO chunks pointing at them
 *   by deepLink:
 *
 *       /revisions   /editorial-independence   /sponsor   /simulation
 *
 *   and five more were represented by one or two incidental chunks (/explore 1,
 *   /terms 1, /report 2, /faq 2, /about 3). They are not badly ranked — several
 *   are simply absent, so no query can reach them.
 *
 * Source of truth — no new data:
 *   `ROUTE_META` (src/seo/routeMeta.ts) is already the canonical list of real,
 *   indexable routes: the prerender step and the sitemap generator both derive
 *   from it, so a page cannot exist here and not there. Title and one line of
 *   description come from that same entry. Nothing is authored in this file.
 *
 * Scope:
 *   - `/learn/*` module routes are excluded — the corpus already carries 64
 *     `modules` + 907 `module-content` + 64 `module-summaries` chunks for them,
 *     and duplicating each module as a "page" would crowd its own results.
 *   - `isNoindexRoute` routes (`/embed`, `/*\/legacy`) are excluded, matching
 *     the sitemap's own filter.
 *
 * Like the tool entries, these are registry-derived at load time and are NEVER
 * written to rag-corpus.json — a renamed or retired route cannot drift out of
 * search, and the 24 MB corpus does not grow.
 */
import type { RAGChunk } from '@/types/ChatTypes'

/**
 * Bump when the shape or population of these entries changes. Participates in
 * the ⌘K MiniSearch cache key so a stale serialized index built without them is
 * discarded rather than served.
 */
export const PAGE_ENTRIES_VERSION = '1'

export const PAGE_SOURCE = 'page'

/**
 * Trim the trailing site name so the palette row reads as the page, not as the
 * SEO title. Purely mechanical — a title with the site name anywhere but the
 * end (e.g. "Changelog — PQC Today Version History") is left untouched.
 */
export function pageEntryTitle(title: string): string {
  const trimmed = title.replace(/\s*[|—–-]\s*PQC Today\s*$/, '').trim()
  return trimmed || title
}

/**
 * Every indexable non-module route as a search entry.
 *
 * `routeMeta` is pulled in with a DYNAMIC import on purpose. It is statically
 * imported by `PageMeta`, which lives in the eager App chunk; a second STATIC
 * import from the lazily-loaded search stack makes it a shared module and
 * Rollup then folds ~2.1 MB of the search stack into the eager bucket with it.
 * Measured 2026-08-21: eager JS 14.14 MB with the dynamic import, 16.25 MB with
 * a static one — over the 15.00 MB `gate:precache` cap, i.e. a failed build.
 * The corpus is fetched asynchronously anyway, so awaiting here costs nothing.
 */
export async function pageSearchEntries(): Promise<RAGChunk[]> {
  const { ROUTE_META, isNoindexRoute } = await import('@/seo/routeMeta')
  return Object.entries(ROUTE_META)
    .filter(([route]) => !route.startsWith('/learn/') && !isNoindexRoute(route))
    .map(([route, meta]) => ({
      id: `${PAGE_SOURCE}:${route}`,
      source: PAGE_SOURCE,
      title: pageEntryTitle(meta.title),
      // The route itself goes into `content` alongside the description because
      // MINISEARCH_CONFIG indexes title/content/category only, and "sponsor" /
      // "revisions" are the words a visitor actually types.
      content: [meta.description, route].filter(Boolean).join(' — '),
      category: 'Page',
      deepLink: route,
      metadata: { route },
    }))
}
