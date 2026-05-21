// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
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
  bodyType: 'regulator',
  ...overrides,
})

describe('ValidationGantt', () => {
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
})
