// SPDX-License-Identifier: GPL-3.0-only
/**
 * URL state of the Migrate Replace tab's in-domain text filter and facets.
 *
 *   ?rq=<text>                          the "Filter products…" box
 *   ?facet=pqc:available,certified:linked
 *                                       population / pqc / certified facets
 *                                       (only non-default facets are written)
 *
 * Deliberately NOT ?q= / ?search= / ?highlight= / ?layer= / ?cat= … — those
 * are the legacy inbound link params resolveMigrateLink() consumes (and drops
 * once the reader moves on); these two are the reader's own view state and
 * persist across reloads and shares. Written with replace-navigation.
 */
import { NO_FACETS, type ProductFacets } from './workbenchCatalog'

export const REPLACE_FILTER_PARAM = 'rq'
export const REPLACE_FACET_PARAM = 'facet'

const FACET_VALUES: { [K in keyof ProductFacets]: ReadonlyArray<ProductFacets[K]> } = {
  population: ['pqc_relevant', 'migration_baseline'],
  pqc: ['available', 'partial', 'planned', 'none', 'unknown'],
  certified: ['linked', 'none'],
}
const FACET_KEYS = Object.keys(FACET_VALUES) as (keyof ProductFacets)[]

/** Facets → `?facet=` value, or null when every facet is at its default. */
export function serializeFacets(facets: ProductFacets): string | null {
  const parts = FACET_KEYS.filter((k) => facets[k] !== 'all').map((k) => `${k}:${facets[k]}`)
  return parts.length > 0 ? parts.join(',') : null
}

/** `?facet=` → facets. Unknown keys/values are ignored (degrade to 'all'). */
export function parseFacets(raw: string | null | undefined): ProductFacets {
  const facets: ProductFacets = { ...NO_FACETS }
  if (!raw) return facets
  for (const part of raw.split(',')) {
    const [key, value] = part.split(':').map((s) => s.trim())
    if (!FACET_KEYS.includes(key as keyof ProductFacets)) continue
    const k = key as keyof ProductFacets
    if (!(FACET_VALUES[k] as ReadonlyArray<string>).includes(value)) continue
    ;(facets as unknown as Record<string, string>)[k] = value
  }
  return facets
}

/** What a Replace-tab view change carries back to the URL (undefined = untouched). */
export interface ReplaceViewState {
  filter?: string
  facets?: ProductFacets
}

/** Apply a ReplaceViewState to a mutable param set. */
export function writeReplaceViewState(sp: URLSearchParams, state: ReplaceViewState): void {
  if (state.filter !== undefined) {
    if (state.filter) sp.set(REPLACE_FILTER_PARAM, state.filter)
    else sp.delete(REPLACE_FILTER_PARAM)
  }
  if (state.facets !== undefined) {
    const v = serializeFacets(state.facets)
    if (v) sp.set(REPLACE_FACET_PARAM, v)
    else sp.delete(REPLACE_FACET_PARAM)
  }
}
