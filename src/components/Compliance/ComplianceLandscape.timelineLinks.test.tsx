// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link gap (2026-10-02 audit §3): timeline event titles were plain text
// and every Timeline chip linked the whole country, although the event ids
// are known. Event titles now open the event; a chip whose ref resolves to a
// single event opens that event.
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceLandscape } from './ComplianceLandscape'
import type { ComplianceFramework } from '@/data/complianceData'
import { timelineData, timelineEventPageUrl, eventLinkKey } from '@/data/timelineData'
import { resolveTimelineRef } from '@/utils/timelineResolver'

const refs = timelineData.flatMap((c) => c.bodies.map((b) => `${c.countryName}:${b.name}`))
const multiRef = refs.find((r) => resolveTimelineRef(r).events.length > 1)!
const singleRef = refs.find((r) => resolveTimelineRef(r).events.length === 1)

function framework(overrides: Partial<ComplianceFramework>): ComplianceFramework {
  return {
    id: 'tl-framework',
    label: 'Timeline Link Framework',
    description: 'A framework used for testing.',
    industries: [],
    countries: [],
    requiresPQC: false,
    pqcRequirement: 'guidance',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: 'Some notes',
    enforcementBody: '',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...overrides,
  }
}

function renderCard(fw: ComplianceFramework, viewMode: 'cards' | 'table' = 'cards') {
  return render(
    <MemoryRouter>
      <ComplianceLandscape frameworks={[fw]} viewMode={viewMode} />
    </MemoryRouter>
  )
}

describe('ComplianceLandscape timeline links', () => {
  it('links each listed timeline event title to that event', () => {
    expect(multiRef, 'fixture: no country:org with several events').toBeDefined()
    const resolved = resolveTimelineRef(multiRef)
    renderCard(framework({ timelineRefs: [multiRef] }))
    fireEvent.click(screen.getByRole('button', { name: /Notes/ }))
    for (const e of resolved.events.slice(0, 3)) {
      const link = screen.getAllByRole('link', { name: e.title })[0]
      expect(link).toHaveAttribute('href', timelineEventPageUrl(resolved.country, eventLinkKey(e)))
    }
  })

  it('a Timeline chip for a several-event ref links the country', () => {
    const resolved = resolveTimelineRef(multiRef)
    renderCard(framework({ timelineRefs: [multiRef] }))
    const chip = screen.getByRole('link', { name: 'Timeline' })
    expect(chip).toHaveAttribute('href', timelineEventPageUrl(resolved.country))
  })

  it.each(['cards', 'table'] as const)(
    'a Timeline chip for a single-event ref opens that event (%s view)',
    (viewMode) => {
      expect(singleRef, 'fixture: no single-event country:org').toBeDefined()
      if (!singleRef) return
      const resolved = resolveTimelineRef(singleRef)
      renderCard(framework({ timelineRefs: [singleRef] }), viewMode)
      const expected = timelineEventPageUrl(resolved.country, eventLinkKey(resolved.events[0]))
      const links =
        viewMode === 'table'
          ? within(screen.getByRole('table')).getAllByRole('link')
          : screen.getAllByRole('link')
      const chip = links.find((a) => a.getAttribute('href')?.startsWith('/timeline'))
      expect(chip).toHaveAttribute('href', expected)
    }
  )
})
