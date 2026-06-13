// SPDX-License-Identifier: GPL-3.0-only
/**
 * Unit coverage for the deadline-buffer / Regulatory Horizon layer
 * (PER-PAGE-CHANGES.md Compliance #4). Asserts the KRI tiering cascade
 * (<6mo red / <12mo amber / overdue) and the closest-first ordering, using an
 * injected `now` for determinism.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RegulatoryHorizonLayer } from './RegulatoryHorizonLayer'
import type { ComplianceFramework } from '@/data/complianceData'

const NOW = new Date('2026-06-13T00:00:00Z')

const fwStub = (overrides: Partial<ComplianceFramework>): ComplianceFramework => ({
  id: 'fw',
  label: 'FW',
  description: '',
  industries: [],
  countries: [],
  requiresPQC: true,
  pqcRequirement: 'yes',
  deadline: '2027',
  deadlinePhase: 'near',
  notes: '',
  enforcementBody: '',
  libraryRefs: [],
  timelineRefs: [],
  bodyType: 'regulatory_body',
  ...overrides,
})

describe('RegulatoryHorizonLayer', () => {
  it('renders an empty-state when no frameworks carry a dated mandate', () => {
    render(
      <RegulatoryHorizonLayer
        frameworks={[fwStub({ id: 'ongoing', deadline: 'Ongoing' })]}
        now={NOW}
      />
    )
    expect(screen.getByTestId('horizon-empty')).toBeInTheDocument()
  })

  it('tiers a deadline 7 months out as amber (<12 mo) and one a year+ out as green', () => {
    render(
      <RegulatoryHorizonLayer
        frameworks={[
          // Jan 2027 from June 2026 = +7 months → amber (<12 mo).
          fwStub({ id: 'amber', label: 'Amber Mandate', deadline: '2027' }),
          // Jan 2028 from June 2026 = +19 months → green (12 mo+).
          fwStub({ id: 'green', label: 'Green Mandate', deadline: '2028' }),
        ]}
        now={NOW}
      />
    )
    const amberItem = screen.getByText('Amber Mandate').closest('li') as HTMLElement
    expect(within(amberItem).getByText('< 12 mo')).toBeInTheDocument()
    const greenItem = screen.getByText('Green Mandate').closest('li') as HTMLElement
    expect(within(greenItem).getByText('12 mo+')).toBeInTheDocument()
  })

  it('tiers a deadline under 6 months out as red', () => {
    // Jan 2027 from Sept 2026 = +4 months → red (<6 mo).
    render(
      <RegulatoryHorizonLayer
        frameworks={[fwStub({ id: 'red', label: 'Red Mandate', deadline: '2027' })]}
        now={new Date('2026-09-13T00:00:00Z')}
      />
    )
    const item = screen.getByText('Red Mandate').closest('li') as HTMLElement
    expect(within(item).getByText('< 6 mo')).toBeInTheDocument()
  })

  it('flags an already-past deadline year as overdue', () => {
    render(
      <RegulatoryHorizonLayer
        frameworks={[fwStub({ id: 'past', label: 'Past Mandate', deadline: '2024' })]}
        now={NOW}
      />
    )
    const item = screen.getByText('Past Mandate').closest('li') as HTMLElement
    expect(within(item).getByText('Overdue')).toBeInTheDocument()
  })

  it('orders items closest-deadline first', () => {
    render(
      <RegulatoryHorizonLayer
        frameworks={[
          fwStub({ id: 'far', label: 'Far Mandate', deadline: '2033' }),
          fwStub({ id: 'soon', label: 'Soon Mandate', deadline: '2027' }),
        ]}
        now={NOW}
      />
    )
    const labels = screen.getAllByText(/Mandate$/).map((el) => el.textContent)
    expect(labels.indexOf('Soon Mandate')).toBeLessThan(labels.indexOf('Far Mandate'))
  })
})
