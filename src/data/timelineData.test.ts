import { describe, it, expect } from 'vitest'
import { timelineData, computeTimelineConfidence, phaseColors } from './timelineData'
import type { Phase, EntityType } from '../types/timeline'
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
})
