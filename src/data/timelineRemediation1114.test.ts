// SPDX-License-Identifier: AGPL-3.0-only
/**
 * /timeline remediation, 2026-11-14 — checks against the live dataset:
 * every lane is in a region, search reaches record text, deadlines count at
 * their end year, retired event links open their successor, country aliases
 * match in any case, renamed/CNSA events keep their enrichment, and the trust
 * score reads timeline enrichment and compliance citations.
 */
import { describe, it, expect } from 'vitest'
import {
  timelineData,
  transformToGanttData,
  findTimelineEvent,
  resolveCountryParam,
  buildRetiredEventSuccessors,
  retiredTimelineEventSuccessor,
} from './timelineData'
import {
  TIMELINE_REGION_COUNTRIES,
  TIMELINE_UNREGIONED_LANES,
  timelineRegionCountries,
} from './timelineRegionCountries'
import {
  filterGanttView,
  eventsInView,
  deadlineYear,
  timelineRowDomId,
  phaseOrgs,
} from './timelineViewFilter'
import { getTimelineEnrichment, timelineLibraryLinks } from './timelineEnrichmentData'
import { getTrustScore } from './trustScore/trustScoreData'
import { libraryData } from './libraryData'

const lanes = timelineData.map((c) => c.countryName)
const gantt = transformToGanttData(timelineData)
const allEvents = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events))
const byId = (id: string) => allEvents.find((e) => e.eventId === id)

describe('timeline regions', () => {
  it('puts every lane in exactly one region, apart from the named exceptions', () => {
    for (const lane of lanes) {
      const regions = Object.entries(TIMELINE_REGION_COUNTRIES)
        .filter(([, countries]) => countries.includes(lane))
        .map(([r]) => r)
      if (TIMELINE_UNREGIONED_LANES.includes(lane)) expect(regions, lane).toEqual([])
      else expect(regions, lane).toHaveLength(1)
    }
  })

  it('shows the NSA CNSA 2.0 lane under Americas', () => {
    expect(timelineRegionCountries('americas')).toContain('United States (CNSA)')
    const view = filterGanttView(gantt, { region: 'americas' })
    expect(view.map((d) => d.country.countryName)).toContain('United States (CNSA)')
  })

  it('narrows to the international bodies for an explicit Global region', () => {
    const view = filterGanttView(gantt, { region: 'global' })
    expect(view.length).toBeGreaterThan(0)
    for (const d of view) expect(timelineRegionCountries('global')).toContain(d.country.countryName)
  })
})

describe('timeline search', () => {
  it('finds records by their own title, not only by country or body name', () => {
    const view = filterGanttView(gantt, { query: 'FIPS 203' })
    const events = eventsInView(view)
    expect(events.length).toBeGreaterThan(0)
    expect(events.some((e) => /FIPS 203/i.test(`${e.title} ${e.description}`))).toBe(true)
    // Only the rows holding a match stay, not the whole United States lane.
    const us = view.find((d) => d.country.countryName === 'United States')
    const fullUs = gantt.find((d) => d.country.countryName === 'United States')
    expect(us && fullUs && us.phases.length < fullUs.phases.length).toBe(true)
  })

  it('still keeps a whole lane when its name matches', () => {
    const view = filterGanttView(gantt, { query: 'canada' })
    const full = gantt.find((d) => d.country.countryName === 'Canada')
    expect(view.find((d) => d.country.countryName === 'Canada')?.phases).toHaveLength(
      full?.phases.length ?? -1
    )
  })
})

describe('deadline year', () => {
  it('uses the end of a stated range', () => {
    expect(deadlineYear({ startYear: 2026, endYear: 2031 })).toBe(2031)
    expect(deadlineYear({ startYear: 2030, endYear: 2030 })).toBe(2030)
  })

  it('reads Germany and Sweden range deadlines at 2031 and 2035', () => {
    const de = byId('germany-bsi-hybrid-ipsec-and-ssh-required')
    const se = byId('sweden-ncsc-national-recommendations-for-quantum-safe-crypto')
    expect(de && deadlineYear(de)).toBe(2031)
    expect(se && deadlineYear(se)).toBe(2035)
  })
})

describe('row organization and DOM ids', () => {
  it('names each row after its own issuers', () => {
    const us = gantt.find((d) => d.country.countryName === 'United States')
    const std = us?.phases.find((p) => p.phase === 'Standardization')
    expect(std && phaseOrgs(std).map((o) => o.name)).toContain('NIST')
    expect(std && phaseOrgs(std).map((o) => o.name)).not.toContain('White House')
  })

  it('makes a valid id for the CNSA lane', () => {
    expect(timelineRowDomId('United States (CNSA)')).toBe('timeline-row-united-states-cnsa')
  })
})

describe('?event= and ?country= links', () => {
  it('opens the successor of a retired event that names one', () => {
    expect(retiredTimelineEventSuccessor('south-korea-msit-full-pqc-roadmap-complete')).toBe(
      'south-korea-msit-k-pqc-master-plan-to-2035'
    )
    expect(findTimelineEvent(timelineData, 'bis-bis-paper-158-quantum-roadmap')?.eventId).toBe(
      'international-bis-paper-158-quantum-roadmap'
    )
  })

  it('leaves a retired event with no successor unresolved', () => {
    expect(
      findTimelineEvent(timelineData, 'de-bsi-germany-quantum-secure-id-card-demonstrator')
    ).toBeNull()
  })

  it('derives successors only from the retirement records', () => {
    const csv = [
      'Country,OrgName,Title,StartYear,EndYear,Status,status,deprecated_reason,event_id',
      'X,A,Kept,2025,2025,Validated,active,,x-a-kept-record',
      'X,A,Other,2025,2025,Validated,active,,x-a-other-record',
      'X,A,Old,2024,2024,Validated,deprecated,superseded:timeline:x-a-kept-record,x-a-old-record',
      'X,A,Two,2024,2024,Validated,deprecated,x-a-kept-record or x-a-other-record,x-a-two-record',
      'X,A,Other,2024,2024,Validated,deprecated,duplicate,x-a-dupe-record',
    ].join('\n')
    const map = buildRetiredEventSuccessors(csv)
    expect(map.get('x-a-old-record')).toBe('x-a-kept-record')
    expect(map.has('x-a-two-record')).toBe(false)
    expect(map.get('x-a-dupe-record')).toBe('x-a-other-record')
  })

  it('matches country aliases in any case, and the CNSA lane by name', () => {
    for (const [param, want] of [
      ['usa', 'United States'],
      ['uk', 'United Kingdom'],
      ['eu', 'European Union'],
      ['CNSA', 'United States (CNSA)'],
      ['us-cnsa', 'United States (CNSA)'],
    ]) {
      expect(resolveCountryParam(param, lanes)).toEqual({ resolved: want, wasUnknown: false })
    }
  })
})

describe('enrichment and Library links', () => {
  it('finds the enrichment of CNSA-lane and renamed events by event_id', () => {
    for (const id of [
      'united-states-nsa-cnsa-2-0-published',
      'european-union-ec-cryptographic-inventory-mandate',
    ]) {
      const e = byId(id)
      expect(e, id).toBeDefined()
      expect(
        getTimelineEnrichment(e!.eventId, e!.countryName, e!.orgName, e!.title),
        id
      ).toBeTruthy()
    }
  })

  it('resolves curated library_refs to Library records', () => {
    const withRefs = allEvents.filter((e) => (e.libraryRefs ?? []).length > 0)
    expect(withRefs.length).toBeGreaterThan(50)
    const libIds = new Set(libraryData.map((l) => l.referenceId))
    const linked = withRefs.flatMap((e) => timelineLibraryLinks(e))
    expect(linked.length).toBeGreaterThan(0)
    for (const l of linked) expect(libIds.has(l.referenceId)).toBe(true)
  })
})

describe('trust score for timeline events', () => {
  const dim = (title: string, d: string) =>
    getTrustScore('timeline', title)?.dimensions.find((x) => x.dimension === d)?.rawScore

  it('reads enrichment completeness from the enrichment lookup', () => {
    const enriched = allEvents.filter((e) =>
      getTimelineEnrichment(e.eventId, e.countryName, e.orgName, e.title)
    )
    expect(enriched.length).toBeGreaterThan(100)
    const scored = enriched.filter((e) => (dim(e.title, 'enrichmentCompleteness') ?? 0) > 0)
    expect(scored.length).toBeGreaterThan(enriched.length * 0.9)
  })

  it('counts compliance frameworks that cite the issuing body', () => {
    const cited = allEvents.filter((e) => (e.complianceRefs ?? []).length > 0)
    expect(cited.length).toBeGreaterThan(0)
    const e = cited[0]
    // 10 is the floor the dimension gives with no references at all.
    expect(dim(e.title, 'crossRefDensity') ?? 0).toBeGreaterThan(10)
  })
})
