// SPDX-License-Identifier: AGPL-3.0-only
// The timeline milestones shown on a framework card come from its timeline_refs.
// Before this join read those refs, most frameworks with a resolvable ref had no milestones.
import { describe, expect, it } from 'vitest'
import { complianceFrameworks } from '@/data/complianceData'
import { timelineData } from '@/data/timelineData'
import type { TimelineEvent } from '@/types/timeline'
import { resolveTimelineRef } from '@/utils/timelineResolver'
import { linkTimelineToFrameworks, type ApplicabilityResult } from './applicabilityEngine'
import type { ComplianceFramework } from '@/data/complianceData'

const allEvents: ApplicabilityResult<TimelineEvent>[] = timelineData.flatMap((country) =>
  country.bodies.flatMap((body) =>
    body.events.map((ev) => ({ item: ev, tier: 'mandatory' as const, reason: '' }))
  )
)

const active = complianceFrameworks.filter((f) => f.status !== 'deprecated')
const frameworkResults: ApplicabilityResult<ComplianceFramework>[] = active.map((f) => ({
  item: f,
  tier: 'mandatory' as const,
  reason: '',
}))

const linked = linkTimelineToFrameworks(allEvents, frameworkResults).byFrameworkId

describe('linkTimelineToFrameworks uses timeline_refs', () => {
  it.each([
    'EIDAS',
    'DORA',
    'GDPR',
    'NIS2',
    'EU-CRA',
    'FEDRAMP',
    'CMMC',
    'FISMA',
    'EUCC',
    'CNSA-2',
  ])('links the timeline milestones of %s', (id) => {
    const fw = active.find((f) => f.id === id)
    expect(fw, `${id} should be an active framework`).toBeDefined()
    const resolvable = (fw?.timelineRefs ?? []).some(
      (ref) => resolveTimelineRef(ref).events.length > 0
    )
    expect(resolvable).toBe(true)
    expect(linked.get(id)?.length ?? 0).toBeGreaterThan(0)
  })

  it('links every framework that has a resolvable timeline_refs entry', () => {
    const missed = active
      .filter((f) => (f.timelineRefs ?? []).some((r) => resolveTimelineRef(r).events.length > 0))
      .filter((f) => !linked.has(f.id))
      .map((f) => f.id)
    expect(missed).toEqual([])
  })

  it('never lists one event twice under the same framework', () => {
    for (const [, events] of linked) {
      const titles = events.map(
        (e) => `${e.item.countryName}|${e.item.orgName}|${e.item.title}|${e.item.startYear}`
      )
      expect(new Set(titles).size).toBe(titles.length)
    }
  })
})
