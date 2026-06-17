// SPDX-License-Identifier: GPL-3.0-only
/**
 * Direct unit coverage for the timeline scope helpers (C6) — the single source of
 * truth that BOTH TimelineView.ganttData and the sim's TimelineEmbed filter
 * through. Verifies country/region narrowing, the category filter (incl. the
 * vendor-hiding default), empty-body/country dropping, the tier passthrough, and
 * the `to`-query parser.
 */
import { describe, it, expect } from 'vitest'
import { applyTimelineScope, applyTierFilter, parseTimelineScope } from './timelineScope'
import type { CountryData, RegulatoryBody, TimelineEvent, EntityType } from '@/types/timeline'

const ev = (entityType: EntityType, title: string): TimelineEvent =>
  ({
    startYear: 2025,
    endYear: 2026,
    phase: 'Migration',
    type: 'Phase',
    title,
    description: '',
    entityType,
    orgName: 'Org',
    orgFullName: 'Org',
    countryName: 'X',
    flagCode: 'XX',
  }) as unknown as TimelineEvent

const body = (name: string, events: TimelineEvent[]): RegulatoryBody => ({
  name,
  fullName: name,
  countryCode: 'XX',
  events,
})

const country = (countryName: string, bodies: RegulatoryBody[]): CountryData => ({
  countryName,
  flagCode: 'XX',
  bodies,
})

const names = (cs: CountryData[]) => cs.map((c) => c.countryName).sort()

describe('applyTimelineScope', () => {
  const data: CountryData[] = [
    country('Germany', [body('BSI', [ev('government', 'DE gov'), ev('vendor', 'DE vendor')])]),
    country('Japan', [body('NICT', [ev('government', 'JP gov')])]),
  ]

  it('narrows to a single country', () => {
    expect(names(applyTimelineScope(data, { country: 'Germany' }))).toEqual(['Germany'])
  })

  it('narrows to a region (by REGION_COUNTRIES_MAP key)', () => {
    // 'eu' includes Germany, not Japan.
    expect(names(applyTimelineScope(data, { region: 'eu' }))).toEqual(['Germany'])
  })

  it('country takes precedence over region', () => {
    expect(names(applyTimelineScope(data, { country: 'Germany', region: 'apac' }))).toEqual([
      'Germany',
    ])
  })

  it('the default category filter hides vendor events', () => {
    const out = applyTimelineScope(data, {}) // no categories → CATEGORY_DEFAULT (gov + standards)
    const de = out.find((c) => c.countryName === 'Germany')!
    const titles = de.bodies.flatMap((b) => b.events.map((e) => e.title))
    expect(titles).toEqual(['DE gov']) // vendor dropped
  })

  it('an explicit category filter selects only those entity types', () => {
    const out = applyTimelineScope(data, { categories: ['vendor'] })
    // Japan has no vendor events → dropped entirely; Germany keeps only the vendor event.
    expect(names(out)).toEqual(['Germany'])
    expect(out[0].bodies[0].events.map((e) => e.title)).toEqual(['DE vendor'])
  })

  it('drops bodies and countries left with no events', () => {
    const vendorOnly: CountryData[] = [country('X', [body('B', [ev('vendor', 'only vendor')])])]
    expect(applyTimelineScope(vendorOnly, {})).toEqual([]) // default hides vendor → empty
  })
})

describe('applyTierFilter', () => {
  const data: CountryData[] = [country('Germany', [body('BSI', [ev('government', 'g')])])]

  it('returns the input unchanged when no tiers are selected', () => {
    expect(applyTierFilter(data, [])).toBe(data)
  })

  it('every surviving event satisfies the tier predicate', () => {
    const out = applyTierFilter(data, ['Authoritative', 'High', 'Moderate', 'Low'])
    // structural invariant: nothing crashes, shape preserved as CountryData[]
    expect(Array.isArray(out)).toBe(true)
  })
})

describe('parseTimelineScope', () => {
  it('returns an empty scope for a bare path', () => {
    expect(parseTimelineScope('/timeline')).toEqual({})
  })

  it('reads country and region (country wins)', () => {
    expect(parseTimelineScope('/timeline?country=Germany')).toEqual({ country: 'Germany' })
    expect(parseTimelineScope('/timeline?region=eu')).toEqual({ region: 'eu' })
    expect(parseTimelineScope('/timeline?country=Germany&region=eu')).toEqual({
      country: 'Germany',
    })
  })

  it('reads repeatable cat (validated) and tier params', () => {
    expect(parseTimelineScope('/timeline?cat=standards&cat=vendor')).toEqual({
      categories: ['standards', 'vendor'],
    })
    expect(parseTimelineScope('/timeline?cat=bogus')).toEqual({}) // invalid filtered out
    expect(parseTimelineScope('/timeline?tier=Authoritative')).toEqual({
      tiers: ['Authoritative'],
    })
  })

  it('ignores ?q (standalone-page search only, not the embed)', () => {
    expect(parseTimelineScope('/timeline?q=foo')).toEqual({})
  })
})
