// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ValidationGantt } from './ValidationGantt'
import type { ComplianceFramework } from '@/data/complianceData'

const fwStub = (overrides: Partial<ComplianceFramework>): ComplianceFramework => ({
  id: 'test',
  label: 'Test FW',
  description: '',
  industries: [],
  countries: [],
  requiresPQC: true,
  pqcRequirement: 'yes',
  deadline: '2027',
  deadlineYear: 2027,
  deadlinePhase: 'near',
  notes: '',
  enforcementBody: '',
  libraryRefs: [],
  timelineRefs: [],
  bodyType: 'regulatory_body',
  ...overrides,
})

describe('ValidationGantt', () => {
  // Fixed clock so "past" and "next" milestones do not depend on the run date.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when no frameworks are passed', () => {
    const { container } = render(<ValidationGantt frameworks={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a row per dated framework, sorted by year', () => {
    const frameworks = [
      fwStub({ id: 'a', label: 'Later FW', deadlineYear: 2030 }),
      fwStub({ id: 'b', label: 'Sooner FW', deadlineYear: 2027 }),
    ]
    render(<ValidationGantt frameworks={frameworks} />)
    const rows = screen.getAllByTitle(/FW —/)
    expect(rows[0]).toHaveTextContent('Sooner FW')
    expect(rows[1]).toHaveTextContent('Later FW')
  })

  it('counts undated frameworks in the footer', () => {
    const frameworks = [
      fwStub({ id: 'a', label: 'Has year', deadlineYear: 2028 }),
      fwStub({
        id: 'b',
        label: 'Ongoing',
        deadlineYear: undefined,
        deadline: 'Ongoing',
        deadlinePhase: 'ongoing',
      }),
    ]
    render(<ValidationGantt frameworks={frameworks} />)
    expect(screen.getByText(/1 ongoing \/ undated framework/i)).toBeInTheDocument()
  })

  it('caps the bar count at maxRows', () => {
    const frameworks = Array.from({ length: 15 }, (_, i) =>
      fwStub({ id: `fw-${i}`, label: `FW ${i}`, deadlineYear: 2025 + i })
    )
    render(<ValidationGantt frameworks={frameworks} maxRows={5} />)
    expect(screen.getAllByTitle(/FW \d+ —/)).toHaveLength(5)
  })

  it('calls onSelectFramework when a row label is clicked', () => {
    const onSelect = vi.fn()
    const fw = fwStub({ id: 'a', label: 'Clickable FW', deadlineYear: 2027 })
    render(<ValidationGantt frameworks={[fw]} onSelectFramework={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clickable FW' }))
    expect(onSelect).toHaveBeenCalledWith(fw)
  })

  it('returns null when only undated frameworks AND nothing else', () => {
    // Component still renders the legend + undated counter; verify it doesn't crash.
    const frameworks = [
      fwStub({
        id: 'b',
        label: 'Ongoing',
        deadlineYear: undefined,
        deadline: 'Ongoing',
        deadlinePhase: 'ongoing',
      }),
    ]
    const { container } = render(<ValidationGantt frameworks={frameworks} />)
    expect(container.firstChild).not.toBeNull()
    expect(screen.getByText(/1 ongoing \/ undated framework/i)).toBeInTheDocument()
  })
  it('plots a milestone that has already passed at its own year, not at today', () => {
    const frameworks = [
      fwStub({ id: 'old', label: 'Old FW', deadlineYear: 2024, deadlinePhase: 'active' }),
      fwStub({ id: 'new', label: 'New FW', deadlineYear: 2030, deadlinePhase: 'mid' }),
    ]
    render(<ValidationGantt frameworks={frameworks} />)
    // Axis runs 2024..2030, so 2026 ("now") sits a third of the way along.
    const nowPct = (2 / 6) * 100
    const oldBar = screen.getByTitle(/Old FW: active \(2024, passed\)/)
    expect(parseFloat(oldBar.style.left)).toBeLessThan(nowPct)
    expect(parseFloat(oldBar.style.left)).toBeCloseTo(0, 5)
    // The row says outright that the date is in the past.
    expect(screen.getByText('2024 · passed')).toBeInTheDocument()
    // A future milestone still runs from now to its year.
    const newBar = screen.getByTitle(/New FW: mid \(2030\)/)
    expect(parseFloat(newBar.style.left)).toBeCloseTo(nowPct, 5)
  })

  it('plots a phased framework at its next milestone and lists every stated one', () => {
    const phased = fwStub({
      id: 'phased',
      label: 'Phased FW',
      deadlineYear: 2024,
      deadlinePhase: 'active',
      deadlineDates: [
        { year: 2024, label: 'first phase' },
        { year: 2030, label: 'second phase' },
        { year: 2035, label: 'final phase' },
      ],
    })
    render(<ValidationGantt frameworks={[phased]} />)
    expect(screen.getByTitle('Phased FW — next milestone 2030')).toBeInTheDocument()
    const bar = screen.getByTitle(/Phased FW: active \(2030\)/)
    expect(bar.getAttribute('title')).toContain(
      'stated milestones: 2024 first phase, 2030 second phase, 2035 final phase'
    )
    expect(screen.queryByText(/passed/)).not.toBeInTheDocument()
  })

  it('draws a framework whose every milestone has passed at the latest one', () => {
    const done = fwStub({
      id: 'done',
      label: 'Done FW',
      deadlineYear: 2022,
      deadlinePhase: 'active',
      deadlineDates: [
        { year: 2022, label: 'first phase' },
        { year: 2025, label: 'last phase' },
      ],
    })
    render(<ValidationGantt frameworks={[done]} />)
    expect(screen.getByText('2025 · passed')).toBeInTheDocument()
  })

  it('discloses how many dated frameworks the row cap leaves out, and their years', () => {
    const frameworks = Array.from({ length: 15 }, (_, i) =>
      fwStub({ id: `fw-${i}`, label: `FW ${i}`, deadlineYear: 2027 + i })
    )
    render(<ValidationGantt frameworks={frameworks} maxRows={5} />)
    expect(screen.getByText(/Showing 5 of 15 frameworks with a concrete year/)).toBeInTheDocument()
    // 10 frameworks dated 2032..2041 are not drawn; the note says so and does not
    // let the chart pass for a complete deadline list.
    expect(
      screen.getByText(/10 more dated frameworks \(2032–2041\) not plotted/)
    ).toBeInTheDocument()
    expect(screen.getByText(/not a complete deadline list/)).toBeInTheDocument()
  })

  it('shows no omission note when every dated framework is plotted', () => {
    const frameworks = [fwStub({ id: 'a', label: 'Only FW', deadlineYear: 2028 })]
    render(<ValidationGantt frameworks={frameworks} />)
    expect(screen.queryByText(/not plotted/)).not.toBeInTheDocument()
    expect(screen.getByText(/1 framework with a concrete year/)).toBeInTheDocument()
  })
})
