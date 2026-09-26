import { describe, it, expect, vi, afterEach } from 'vitest'
import Papa from 'papaparse'
import {
  timelineData,
  computeTimelineConfidence,
  parseTimelineCSV,
  phaseColors,
  getCountryLastVerified,
} from './timelineData'
import type { CountryData, Phase, EntityType } from '../types/timeline'
import { CATEGORY_DEFAULT, matchesCategoryFilter } from '../components/Timeline/CategoryFilter'

describe('timelineData', () => {
  it('loads without error', () => {
    expect(timelineData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of timelineData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of timelineData) {
      expect(item.countryName).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = timelineData.map((item) => item.countryName)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })

  it('every loaded event maps to a known Gantt phase color', () => {
    // Guards against out-of-union Category values silently rendering colorless.
    for (const country of timelineData) {
      for (const body of country.bodies) {
        for (const event of body.events) {
          expect(phaseColors[event.phase as Phase]).toBeDefined()
        }
      }
    }
  })

  it('confidence is graded (not the legacy binary 60/85) and in 0–100', () => {
    const scores = timelineData.flatMap((c) =>
      c.bodies.flatMap((b) => b.events.map((e) => e.confidenceScore))
    )
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
    // More than two distinct values ⇒ no longer the old binary scheme.
    const distinct = new Set(scores)
    expect(distinct.size).toBeGreaterThan(2)
  })
})

describe('entity-type category classification (FR-T-06)', () => {
  const events = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events))
  const valid = new Set<EntityType>(['government', 'standards', 'vendor'])

  it('every event has a valid entityType', () => {
    for (const e of events) expect(valid.has(e.entityType)).toBe(true)
  })

  it('the public timeline has government and standards events and no vendor events (scope decision T2)', () => {
    const present = new Set(events.map((e) => e.entityType))
    expect(present.has('government')).toBe(true)
    expect(present.has('standards')).toBe(true)
    expect(present.has('vendor')).toBe(false)
  })

  it('default filter hides vendor events but keeps gov + standards', () => {
    expect(CATEGORY_DEFAULT).toEqual(['government', 'standards'])
    expect(matchesCategoryFilter(CATEGORY_DEFAULT, 'government')).toBe(true)
    expect(matchesCategoryFilter(CATEGORY_DEFAULT, 'vendor')).toBe(false)
    // Opting vendor in shows it.
    expect(matchesCategoryFilter(['government', 'standards', 'vendor'], 'vendor')).toBe(true)
  })
})

describe('computeTimelineConfidence', () => {
  const base = {
    Country: 'United States',
    FlagCode: 'US',
    OrgName: 'NIST',
    OrgFullName: '',
    OrgLogoUrl: '',
    Type: 'Milestone',
    Category: 'Standardization',
    StartYear: '2025',
    EndYear: '2025',
    Title: 't',
    Description: '',
    SourceUrl: '',
    SourceDate: '',
    Status: '',
    trusted_source_id: '',
    local_file: '',
    peer_reviewed: '',
    vetting_body: '',
    source_url_quality: '',
    trusted_source_id_status: '',
    data_quality_notes: '',
  }

  it('scores a fully-evidenced recent point event at 100', () => {
    const recent = new Date()
    const ymd = `${recent.getFullYear()}-01-01`
    expect(
      computeTimelineConfidence({
        ...base,
        source_url_quality: 'url_authoritative',
        peer_reviewed: 'yes',
        vetting_body: 'NIST',
        SourceDate: ymd,
        local_file: 'public/timeline/x.html',
        StartYear: String(recent.getFullYear()),
        EndYear: String(recent.getFullYear()),
      })
    ).toBe(100)
  })

  it('scores a bare, unsourced multi-year row low', () => {
    expect(computeTimelineConfidence({ ...base, StartYear: '2025', EndYear: '2030' })).toBe(5) // date specificity (range) only
  })

  it('credits partial peer review and needs-review source quality', () => {
    expect(
      computeTimelineConfidence({
        ...base,
        source_url_quality: 'url_needs_review', // 15
        peer_reviewed: 'partial', // 10
        StartYear: '2025',
        EndYear: '2025', // 10
      })
    ).toBe(35)
  })

  // Recency must be scored against the CSV's own snapshot date (referenceDate),
  // not real wall-clock time — otherwise the same row's score silently drifts
  // downward as calendar time passes with no underlying data change.
  it('scores recency against the supplied referenceDate, not real time', () => {
    const row = { ...base, source_url_quality: '', peer_reviewed: '', SourceDate: '2026-01-01' }
    // 6 months after the source date, relative to a fixed snapshot reference — within
    // the ≤12mo bucket regardless of when the test itself actually runs.
    expect(computeTimelineConfidence(row, new Date('2026-07-01'))).toBe(20 + 10) // recency + date-specificity
    // 20 months after the source date — falls into the ≤36mo (10pt) bucket instead.
    expect(computeTimelineConfidence(row, new Date('2027-09-01'))).toBe(10 + 10)
    // 40 months after — too stale for any recency credit.
    expect(computeTimelineConfidence(row, new Date('2029-05-01'))).toBe(0 + 10)
  })
})

describe('parseTimelineCSV — malformed year hardening', () => {
  const header =
    'Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status,trusted_source_id,local_file,peer_reviewed,vetting_body,source_url_quality,trusted_source_id_status,data_quality_notes,confidence_score,status,deprecated_at,deprecated_reason,related_standards,entity_type,is_sim_deadline,sim_milestone,mandate_type'

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('excludes a row with a malformed StartYear and logs a loud warning instead of injecting NaN', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const csv = [
      header,
      'Testland,TL,Agency,Agency Full,,Phase,Research,Q1 2030,2031,Bad Row,desc,,,,,,,,,,,,,,,,,,',
      'Testland,TL,Agency,Agency Full,,Phase,Research,2026,2027,Good Row,desc,,,,,,,,,,,,,,,,,,',
    ].join('\n')

    const parsed = parseTimelineCSV(csv)
    const events = parsed.flatMap((c) => c.bodies.flatMap((b) => b.events))

    expect(events.map((e) => e.title)).toEqual(['Good Row'])
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Malformed year value'))
  })

  it('excludes a row with an out-of-range year (e.g. a typo like 20030)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const csv = [
      header,
      'Testland,TL,Agency,Agency Full,,Phase,Research,20030,20031,Typo Row,desc,,,,,,,,,,,,,,,,,,',
    ].join('\n')

    const parsed = parseTimelineCSV(csv)
    const events = parsed.flatMap((c) => c.bodies.flatMap((b) => b.events))

    expect(events).toHaveLength(0)
    expect(errorSpy).toHaveBeenCalled()
  })

  // Three real rows in the live CSV have one empty year boundary, and each is a
  // DELIBERATE record of what its source does and does not say — not an oversight.
  // Updated 2026-09-26 (timeline r11): the membership of this set changed wholesale.
  //   • france-anssi-phase-2-hybridization-required — EndYear BLANKED in r11.
  //     ANSSI says "This phase should last until at least 2030", a minimum; the
  //     previous EndYear=2030 inverted that floor into a terminus.
  //   • france-anssi-phase-3-standalone-pqc-optional — EndYear BLANKED in r11.
  //     "2035" appears nowhere in any ANSSI source; the only Phase 3 bound is the
  //     floor "probably not earlier than 2030".
  //   • singapore-csa-mas-financial-sector-planning — EndYear genuinely open-ended.
  // Left this set in r11: france-anssi-phase-1-pre-quantum-security gained
  // EndYear=2025 (the roadmap figure's "≈ 2025" boundary), and
  // canada-cccs-remaining-systems-migration (blank StartYear) was merged away
  // into canada-cccs-high-priority-migration-phase's Transition Phase row.
  it('the live CSV has exactly the three deliberate empty-year-boundary rows', async () => {
    const { DATA_FILENAMES } = await import('./generated/dataFilenames.generated')
    const name = DATA_FILENAMES.timeline
    if (!name) throw new Error('DATA_FILENAMES.timeline is not set — run generate:data-filenames')
    const modules = import.meta.glob('./timeline_*.csv', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>
    const raw = modules[`./${name}`]
    expect(raw, `${name} not found in src/data/`).toBeTruthy()

    const { data: rows } = Papa.parse<Record<string, string>>(raw.trim(), {
      header: true,
      skipEmptyLines: true,
    })
    const blanks = rows
      .filter((r) => (r['status'] ?? 'active').trim().toLowerCase() !== 'deprecated')
      .filter((r) => !(r['StartYear'] ?? '').trim() || !(r['EndYear'] ?? '').trim())
      .map((r) => r['event_id'])
      .sort()

    expect(blanks).toEqual([
      'france-anssi-phase-2-hybridization-required',
      'france-anssi-phase-3-standalone-pqc-optional',
      'singapore-csa-mas-financial-sector-planning',
    ])
  })
})

describe('getCountryLastVerified (Phase 8.4 — per-country freshness stamp)', () => {
  function buildCountry(lastVerifiedByEvent: Array<string | undefined>): CountryData {
    return {
      countryName: 'Testland',
      flagCode: 'TL',
      bodies: [
        {
          name: 'Agency',
          fullName: 'Agency Full',
          countryCode: 'TL',
          events: lastVerifiedByEvent.map((lastVerified, i) => ({
            startYear: 2024,
            endYear: 2025,
            phase: 'Research',
            type: 'Phase',
            title: `Event ${i}`,
            description: '',
            entityType: 'government',
            orgName: 'Agency',
            orgFullName: 'Agency Full',
            countryName: 'Testland',
            flagCode: 'TL',
            lastVerified,
          })),
        },
      ],
    }
  }

  it('returns undefined when no event has a lastVerified date', () => {
    expect(getCountryLastVerified(buildCountry([undefined, undefined]))).toBeUndefined()
  })

  it('returns the single lastVerified date when only one event has one', () => {
    expect(getCountryLastVerified(buildCountry([undefined, '2026-05-01']))).toBe('2026-05-01')
  })

  it('returns the most recent (max) lastVerified date across multiple events', () => {
    expect(getCountryLastVerified(buildCountry(['2025-01-01', '2026-07-16', '2024-12-31']))).toBe(
      '2026-07-16'
    )
  })

  it('ignores bodies with no events', () => {
    const country: CountryData = {
      countryName: 'Empty',
      flagCode: 'EM',
      bodies: [{ name: 'Agency', fullName: 'Agency Full', countryCode: 'EM', events: [] }],
    }
    expect(getCountryLastVerified(country)).toBeUndefined()
  })
})

describe('parseTimelineCSV — review status (timeline remediation r2 T-B1)', () => {
  const header =
    'Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status,status,event_id'
  const csv = [
    header,
    'Testland,TL,Agency,Agency Full,,Milestone,Deadline,2030,2030,Reviewed Row,d,,,Completed,active,tl-reviewed',
    'Testland,TL,Agency,Agency Full,,Milestone,Deadline,2031,2031,New Row,d,,,New,active,tl-new',
    'Testland,TL,Agency,Agency Full,,Milestone,Deadline,2032,2032,Unverified Row,d,,,Unverified — needs review,active,tl-unverified',
  ].join('\n')
  const titles = (countries: CountryData[]) =>
    countries.flatMap((c) => c.bodies.flatMap((b) => b.events.map((e) => e.title)))

  it('withholds New and Unverified rows from the public output', () => {
    expect(titles(parseTimelineCSV(csv))).toEqual(['Reviewed Row'])
  })

  it('keeps them only when explicitly asked (private review tooling)', () => {
    expect(titles(parseTimelineCSV(csv, new Date(), { includeUnreviewed: true }))).toHaveLength(3)
  })

  it('carries the CSV Status as reviewStatus and leaves the change status unset', () => {
    const [event] = parseTimelineCSV(csv)[0].bodies[0].events
    expect(event.reviewStatus).toBe('Completed')
    expect(event.status).toBeUndefined()
  })

  it('the live dataset exposes no unreviewed row', () => {
    const events = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events))
    const unreviewed = events.filter((e) =>
      ['new', 'unverified — needs review'].includes((e.reviewStatus ?? '').toLowerCase())
    )
    expect(unreviewed).toEqual([])
  })
})

describe('timeline joins keyed the way their data is (timeline remediation r2 W-B)', () => {
  it('attaches compliance frameworks by Country:OrgName', () => {
    const withRefs = timelineData
      .flatMap((c) => c.bodies.flatMap((b) => b.events))
      .filter((e) => (e.complianceRefs ?? []).length > 0)
    expect(withRefs.length).toBeGreaterThan(0)
  })

  it('resolves a concept id from the event_id', async () => {
    const { conceptIdForTimelineEvent } = await import('./timelineData')
    const ev = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).find((e) => e.eventId)
    expect(conceptIdForTimelineEvent({ eventId: ev?.eventId })).toBeTruthy()
    expect(conceptIdForTimelineEvent({})).toBeUndefined()
  })
})
