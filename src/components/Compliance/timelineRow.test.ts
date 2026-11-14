// SPDX-License-Identifier: AGPL-3.0-only
// The record the shared timeline panel shows carries the event's id, binding force, status,
// mandate and compliance refs, so the panel shows them and finds revisions by the event id.
import { describe, it, expect } from 'vitest'
import type { TimelineEvent } from '@/types/timeline'
import { timelineEventToRow } from './timelineRow'

const event = {
  eventId: 'EVT-EU-2026-001',
  countryName: 'European Union',
  orgName: 'ENISA',
  phase: 'Migration',
  type: 'Milestone',
  title: 'Migration milestone',
  description: 'A dated milestone.',
  startYear: 2026,
  endYear: 2026,
  sourceUrl: 'https://example.test/source',
  sourceDate: '2026-01-15',
  status: 'Active',
  reviewStatus: 'Reviewed',
  bindingForce: 'binding',
  mandateType: 'HARD',
  complianceRefs: ['EU-REC-2024-1101'],
} as unknown as TimelineEvent

describe('timelineEventToRow', () => {
  it('passes the event id, binding force, status, mandate and compliance refs', () => {
    const row = timelineEventToRow(event)
    expect(row.eventId).toBe('EVT-EU-2026-001')
    expect(row.bindingForce).toBe('binding')
    expect(row.reviewStatus).toBe('Reviewed')
    expect(row.mandateType).toBe('HARD')
    expect(row.complianceRefs).toEqual(['EU-REC-2024-1101'])
    expect(row.org).toBe('ENISA')
    expect(row.countryName).toBe('European Union')
    expect(row.status).toBe('Active')
  })

  it('leaves a field absent when the event has none', () => {
    const row = timelineEventToRow({
      ...event,
      eventId: undefined,
      bindingForce: undefined,
    } as TimelineEvent)
    expect(row.eventId).toBeUndefined()
    expect(row.bindingForce).toBeUndefined()
  })
})
