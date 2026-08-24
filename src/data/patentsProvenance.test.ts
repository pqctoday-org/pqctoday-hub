// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { getSourcesForView, authoritativeSources } from './authoritativeSourcesData'
import { getSourcesForView as trustedForView, trustedSources } from './trustedSourcesData'
import { ROUTE_VIEW_TYPE } from './routePageMeta'

/**
 * /patents provenance (2026-08-07).
 *
 * WHY THIS EXISTS. /patents was the only data page with no Sources button.
 * The cause was not a missing route entry — it was that NEITHER source
 * registry contained a single patent authority. No USPTO, no EPO, no WIPO,
 * across 845 trusted-sources rows and 697 authoritative-sources rows; the
 * only "google" entries were Google the company and Google Quantum AI. A
 * 'Patents' ViewType added before that would have filtered to zero rows and
 * rendered an empty modal, which looks like a bug and reads like a lie.
 *
 * So the assertion that matters is NOT "the ViewType exists" — it is "the
 * ViewType resolves to real, registered sources". A count of zero here means
 * the registry lost its patent authorities, and the button should go with
 * them.
 */
describe('patents provenance', () => {
  it('/patents maps to the Patents ViewType', () => {
    expect(ROUTE_VIEW_TYPE['/patents']).toBe('Patents')
  })

  it('resolves to at least one authoritative source', () => {
    const sources = getSourcesForView('Patents')
    expect(sources.length).toBeGreaterThan(0)
    expect(sources.map((s) => s.id)).toContain('uspto-patent-public-search')
  })

  it('resolves to at least one trusted source', () => {
    const sources = trustedForView('Patents')
    expect(sources.length).toBeGreaterThan(0)
  })

  it('registers the issuing authority in BOTH registries', () => {
    // trusted_source_id is resolved against the UNION of the two registries,
    // and different validators check different ones. A source present in only
    // one resolves for some checks and dangles for others.
    expect(authoritativeSources.some((s) => s.id === 'uspto-patent-public-search')).toBe(true)
    expect(trustedSources.some((s) => s.sourceId === 'uspto-patent-public-search')).toBe(true)
  })

  it('does not mark the index as an issuing authority', () => {
    // Google Patents is the retrieval path the harvester queries. It indexes
    // USPTO/EPO/WIPO records; it does not issue them, and the registry's own
    // type/tier matrix forbids Vendor + 1_Authoritative for exactly this
    // reason. Conflating the two would overstate the trust chain.
    const google = trustedSources.find((s) => s.sourceId === 'google-patents')
    expect(google).toBeDefined()
    expect(google?.trustTier).not.toBe('1_Authoritative')
  })

  it('does not leak patents sources into other views', () => {
    // The two new rows carry No on every other per-view flag. If one leaked,
    // /library or /migrate would silently start citing a patent office.
    for (const view of ['Library', 'Timeline', 'Migrate', 'Compliance'] as const) {
      const ids = getSourcesForView(view).map((s) => s.id)
      expect(ids).not.toContain('uspto-patent-public-search')
      expect(ids).not.toContain('google-patents')
    }
  })
})
