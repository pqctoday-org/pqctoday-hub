// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The one-line summary for the curious persona describes the dated entries in
 * the current selection. It names a hard deadline only from a record
 * classified as binding, keeps advisory targets and drafts distinct, and never
 * claims that no dated mandates exist anywhere when a filter leaves nothing.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeadlineTimelineGate } from './DeadlineTimelineGate'
import type { ComplianceFramework } from '@/data/complianceData'

const NOW = new Date().getFullYear()

function fw(over: Partial<ComplianceFramework>): ComplianceFramework {
  return {
    id: 'x',
    label: 'Record',
    description: '',
    industries: [],
    countries: [],
    requiresPQC: false,
    pqcRequirement: 'guidance',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'Body',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...over,
  }
}

const narrative = (frameworks: ComplianceFramework[]) => {
  render(<DeadlineTimelineGate persona="curious" frameworks={frameworks} />)
  return screen.getByTestId('deadline-timeline-narrative').textContent ?? ''
}

describe('DeadlineTimelineGate narrative', () => {
  it('does not call an advisory target or a draft a hard deadline', () => {
    const text = narrative([
      fw({
        id: 'advice',
        label: 'Advisory target',
        bindingStatus: 'official_target',
        deadline: String(NOW + 2),
        deadlineDates: [{ year: NOW + 2, label: 'target' }],
      }),
      fw({
        id: 'draft',
        label: 'Draft rule',
        bindingStatus: 'draft',
        deadline: String(NOW + 4),
        deadlineDates: [{ year: NOW + 4, label: 'proposed' }],
      }),
      fw({ id: 'unreviewed', label: 'Unreviewed', deadline: `${NOW + 1}` }),
    ])
    expect(text).toMatch(/^3 entries in the current selection with dates from /)
    expect(text).toMatch(/advisory target or a draft rather than a deadline/)
    expect(text).not.toMatch(/hard deadline|mandates land/)
    expect(text).not.toMatch(/classified as binding/)
  })

  it('names the next milestone only from a binding record and keeps its scope', () => {
    const text = narrative([
      fw({
        id: 'advice',
        label: 'Advisory target',
        bindingStatus: 'recommendation',
        deadlineDates: [{ year: NOW + 1, label: 'target' }],
      }),
      fw({
        id: 'law',
        label: 'Scoped rule',
        bindingStatus: 'mandatory_for_scope',
        deadlineDates: [{ year: NOW + 3, label: 'effective' }],
      }),
    ])
    expect(text).toContain(
      `The next dated milestone in a record classified as binding is Scoped rule (${NOW + 3}); it applies only within its stated scope.`
    )
    // The earlier advisory date is counted in the span but is not named as the deadline.
    expect(text).toContain(`from ${NOW + 1} to ${NOW + 3}`)
    expect(text).not.toContain(`Advisory target (${NOW + 1})`)
  })

  it('does not name a binding record whose dates have all passed', () => {
    const text = narrative([
      fw({
        id: 'law',
        label: 'Old rule',
        bindingStatus: 'binding',
        deadlineDates: [{ year: NOW - 3, label: 'effective' }],
      }),
    ])
    expect(text).toMatch(/^1 entry in the current selection dated /)
    expect(text).not.toMatch(/classified as binding/)
  })

  it('says nothing about the world when the current selection has no dates', () => {
    const text = narrative([fw({ id: 'undated', deadline: 'Ongoing' })])
    expect(text).toBe('No dated entries in the current selection.')
    expect(text).not.toMatch(/worldwide|published yet|check back|PQC mandates/i)
  })

  it('treats an empty selection the same way', () => {
    expect(narrative([])).toBe('No dated entries in the current selection.')
  })
})
