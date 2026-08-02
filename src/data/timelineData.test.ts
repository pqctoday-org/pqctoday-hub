import { describe, it, expect, vi, afterEach } from 'vitest'
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

  it('all three categories are represented', () => {
    const present = new Set(events.map((e) => e.entityType))
    expect(present.has('government')).toBe(true)
    expect(present.has('standards')).toBe(true)
    expect(present.has('vendor')).toBe(true)
  })

  it('default filter hides vendor events but keeps gov + standards', () => {
    expect(CATEGORY_DEFAULT).toEqual(['government', 'standards'])
    const govEvent = events.find((e) => e.entityType === 'government')!
    const vendorEvent = events.find((e) => e.entityType === 'vendor')!
    expect(matchesCategoryFilter(CATEGORY_DEFAULT, govEvent.entityType)).toBe(true)
    expect(matchesCategoryFilter(CATEGORY_DEFAULT, vendorEvent.entityType)).toBe(false)
    // Opting vendor in shows it.
    expect(
      matchesCategoryFilter(['government', 'standards', 'vendor'], vendorEvent.entityType)
    ).toBe(true)
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
