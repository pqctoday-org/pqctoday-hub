// SPDX-License-Identifier: GPL-3.0-only
/**
 * Local-gate suite for the role-board CTA audit.
 *
 * `.local.test.ts` by directive (2026-07-01): new suites run on the local gate,
 * never in GitHub CI. Run via `npm run test:local`.
 *
 * These exist because a gate that cannot fail is worse than no gate — it reports
 * green and is believed. Every finding code below is driven from a fixture that
 * reproduces the real defect it was written for, so the audit is proven to bite
 * rather than assumed to.
 */
import { describe, it, expect } from 'vitest'
import {
  auditCtas,
  extractBoardHrefs,
  extractAppRoutes,
  extractPlaygroundToolIds,
  resolvesToRealRoute,
  parseCtaRegistry,
  daysSince,
  VERIFICATION_MAX_AGE_DAYS,
  type CtaRegistryRow,
} from './audit-role-board-ctas'

const NOW = new Date('2026-08-02T00:00:00Z')

const row = (over: Partial<CtaRegistryRow> = {}): CtaRegistryRow => ({
  href: '/assess',
  resolves_to: 'AssessView',
  capability_claim: 'Runs an 8-question assessment.',
  verified_on: '2026-08-01',
  verified_by: 'claude',
  status: 'active',
  ...over,
})

const SEGMENTS = new Set(['assess', 'report', 'playground', 'hsm', 'cacp', 'migrate', 'library'])
const TOOL_IDS = new Set(['hsm-capacity', 'tls-simulator'])

describe('extractBoardHrefs', () => {
  const csv = [
    'role_id,variant_id,slot,slot_index,content,status,deprecated_at,deprecated_reason,last_reviewed,notes',
    'executive,default,cta_primary_href,,/assess,active,,,2026-08-02,',
    'executive,default,cta_secondary_href,,/report?example=1,active,,,2026-08-02,',
    'ops,default,cta_primary_href,,/playground/hsm-capacity,active,,,2026-08-02,',
    'ops,default,headline,,Not an href at all,active,,,2026-08-02,',
  ].join('\n')

  it('picks up both primary and secondary CTA hrefs, and nothing else', () => {
    expect(new Set(extractBoardHrefs(csv))).toEqual(
      new Set(['/assess', '/report?example=1', '/playground/hsm-capacity'])
    )
  })

  it('skips deprecated rows — a retired CTA should not keep demanding a fresh claim', () => {
    const withRetired =
      csv +
      '\ncurious,default,cta_primary_href,,/retired-route,deprecated,2026-07-01,replaced,2026-08-02,'
    expect(extractBoardHrefs(withRetired)).not.toContain('/retired-route')
  })

  /**
   * REGRESSION (2026-08-02). This function used to scrape `ctaPrimaryHref: '…'`
   * out of personaConfig.ts. The CSV migration moved those literals into the
   * generated module, so the scrape silently began returning zero hrefs and the
   * whole gate went blind while still exiting 0. Feeding it the OLD input shape
   * must now produce nothing, which is what makes main()'s "refuse to pass over
   * zero CTAs" guard the thing that catches a future repeat.
   */
  it('returns nothing for personaConfig-style TS source — the input that silently blinded this gate', () => {
    const tsSource = `
      ctaPrimaryHref: '/assess',
      ctaSecondaryHref: '/report?example=1',
    `
    expect(extractBoardHrefs(tsSource)).toEqual([])
  })
})

describe('extractAppRoutes', () => {
  // Regression: the first implementation returned FULL paths and resolved the
  // nested `<Route path="cacp" />` to `/cacp`, so three real routes were
  // reported unresolved. The second corrupted its nesting stack on
  // `element={<ErrorBoundary>` and failed even `/assess`. Segments avoid both.
  it('collects nested segments without needing to model nesting', () => {
    const src = `
      <Route path="playground" element={<ErrorBoundary><PlaygroundShell /></ErrorBoundary>}>
        <Route path="cacp" element={<KmipPlaygroundView />} />
        <Route path=":toolId" element={<PlaygroundToolRoute />} />
      </Route>
      <Route path="assess" element={<AssessView />} />
    `
    const segs = extractAppRoutes(src)
    expect(segs.has('playground')).toBe(true)
    expect(segs.has('cacp')).toBe(true)
    expect(segs.has('assess')).toBe(true)
    // Params and wildcards are not routable segments.
    expect(segs.has(':toolId')).toBe(false)
  })
})

describe('extractPlaygroundToolIds', () => {
  it('reads workshop ids', () => {
    const src = [
      '  {',
      "    id: 'hsm-capacity',",
      "    name: 'HSM Capacity Calculator',",
      '  },',
    ].join('\n')
    expect(extractPlaygroundToolIds(src).has('hsm-capacity')).toBe(true)
  })
})

describe('resolvesToRealRoute', () => {
  it('accepts a nested playground tool id', () => {
    expect(resolvesToRealRoute('/playground/hsm-capacity', SEGMENTS, TOOL_IDS)).toBe(true)
  })
  it('ignores query strings — /migrate?tab=roadmaps resolves iff /migrate does', () => {
    expect(resolvesToRealRoute('/migrate?tab=roadmaps', SEGMENTS, TOOL_IDS)).toBe(true)
  })
  it('rejects a segment that exists nowhere (the typo case it is built for)', () => {
    expect(resolvesToRealRoute('/playgroud/hsm', SEGMENTS, TOOL_IDS)).toBe(false)
  })
  it('rejects a route that was renamed away', () => {
    expect(resolvesToRealRoute('/trust-engine', SEGMENTS, TOOL_IDS)).toBe(false)
  })
})

describe('auditCtas — each finding is driven by the defect it was written for', () => {
  it('UNREGISTERED: a CTA rendered on a board with no registry row', () => {
    const f = auditCtas(['/assess', '/brand-new'], [row()], SEGMENTS, TOOL_IDS, NOW)
    expect(f.map((x) => x.code)).toContain('UNREGISTERED')
    expect(f.find((x) => x.code === 'UNREGISTERED')?.href).toBe('/brand-new')
  })

  it('UNRESOLVED_ROUTE: the "Size my fleet" class of defect — a real-looking path that does not exist', () => {
    const f = auditCtas(
      ['/playground/hsm-capacitee'],
      [row({ href: '/playground/hsm-capacitee' })],
      SEGMENTS,
      TOOL_IDS,
      NOW
    )
    expect(f.map((x) => x.code)).toContain('UNRESOLVED_ROUTE')
  })

  it('MISSING_CLAIM: registered but nothing records what the destination does', () => {
    const f = auditCtas(['/assess'], [row({ capability_claim: '   ' })], SEGMENTS, TOOL_IDS, NOW)
    expect(f.map((x) => x.code)).toContain('MISSING_CLAIM')
  })

  it('STALE_VERIFICATION: a claim nobody has re-read inside the window', () => {
    const f = auditCtas(['/assess'], [row({ verified_on: '2020-01-01' })], SEGMENTS, TOOL_IDS, NOW)
    const stale = f.find((x) => x.code === 'STALE_VERIFICATION')
    expect(stale).toBeDefined()
    expect(stale?.detail).toMatch(/Re-read the claim/)
  })

  it('STALE_VERIFICATION: an unparseable date is a failure, not a pass', () => {
    const f = auditCtas(['/assess'], [row({ verified_on: 'soon' })], SEGMENTS, TOOL_IDS, NOW)
    expect(f.map((x) => x.code)).toContain('STALE_VERIFICATION')
  })

  it('a claim verified one day inside the window passes', () => {
    const justInside = new Date(NOW)
    justInside.setDate(justInside.getDate() - (VERIFICATION_MAX_AGE_DAYS - 1))
    const f = auditCtas(
      ['/assess'],
      [row({ verified_on: justInside.toISOString().slice(0, 10) })],
      SEGMENTS,
      TOOL_IDS,
      NOW
    )
    expect(f).toEqual([])
  })

  it('ORPHAN_REGISTRY_ROW: a claim left behind after its CTA was repointed', () => {
    // Exactly what happened when "Size my fleet" moved from /playground/hsm to
    // /playground/hsm-capacity — the old destination's claim would otherwise
    // linger and read as current.
    const f = auditCtas(
      ['/playground/hsm-capacity'],
      [row({ href: '/playground/hsm-capacity' }), row({ href: '/playground/hsm' })],
      SEGMENTS,
      TOOL_IDS,
      NOW
    )
    expect(f.map((x) => x.code)).toContain('ORPHAN_REGISTRY_ROW')
  })

  it('deprecated rows are ignored rather than reported as orphans', () => {
    const f = auditCtas(
      ['/assess'],
      [row(), row({ href: '/playground/hsm', status: 'deprecated', deprecated_at: '2026-08-02' })],
      SEGMENTS,
      TOOL_IDS,
      NOW
    )
    expect(f).toEqual([])
  })

  it('a fully healthy registry produces no findings', () => {
    expect(auditCtas(['/assess'], [row()], SEGMENTS, TOOL_IDS, NOW)).toEqual([])
  })
})

describe('parseCtaRegistry', () => {
  it('keeps commas inside a quoted capability_claim intact', () => {
    const csv = [
      'href,resolves_to,capability_claim,verified_on,verified_by,status',
      '/assess,AssessView,"Sizes storage, network and CPU, then reports.",2026-08-01,claude,active',
    ].join('\n')
    expect(parseCtaRegistry(csv)[0].capability_claim).toBe(
      'Sizes storage, network and CPU, then reports.'
    )
  })
})

describe('daysSince', () => {
  it('returns null for an unparseable date rather than throwing or coercing to 0', () => {
    expect(daysSince('not-a-date', NOW)).toBeNull()
  })
})
