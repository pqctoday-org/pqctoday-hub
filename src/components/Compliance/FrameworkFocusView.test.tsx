// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FrameworkFocusView } from './FrameworkFocusView'
import type { ComplianceFramework } from '@/data/complianceData'

const fwStub = (overrides: Partial<ComplianceFramework>): ComplianceFramework => ({
  id: 'fw-test',
  label: 'Test Framework',
  description: 'A short description.',
  industries: [],
  countries: ['United States'],
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

describe('FrameworkFocusView', () => {
  it('renders an empty-state when no frameworks match', () => {
    render(<FrameworkFocusView frameworks={[]} />)
    expect(screen.getByText(/no frameworks match/i)).toBeInTheDocument()
  })

  it('pre-selects the first framework when no initialFrameworkId is passed', () => {
    const frameworks = [
      fwStub({ id: 'a', label: 'Alpha Framework' }),
      fwStub({ id: 'b', label: 'Beta Framework' }),
    ]
    render(<FrameworkFocusView frameworks={frameworks} />)
    expect(screen.getByRole('heading', { name: 'Alpha Framework', level: 3 })).toBeInTheDocument()
  })

  it('honors initialFrameworkId when valid', () => {
    const frameworks = [
      fwStub({ id: 'a', label: 'Alpha Framework' }),
      fwStub({ id: 'b', label: 'Beta Framework' }),
    ]
    render(<FrameworkFocusView frameworks={frameworks} initialFrameworkId="b" />)
    expect(screen.getByRole('heading', { name: 'Beta Framework', level: 3 })).toBeInTheDocument()
  })

  it('clicking a rail entry switches the right pane + calls onSelectFramework', () => {
    const onSelect = vi.fn()
    const frameworks = [
      fwStub({ id: 'a', label: 'Alpha Framework' }),
      fwStub({ id: 'b', label: 'Beta Framework' }),
    ]
    render(<FrameworkFocusView frameworks={frameworks} onSelectFramework={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /Beta Framework/i }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }))
    expect(screen.getByRole('heading', { name: 'Beta Framework', level: 3 })).toBeInTheDocument()
  })

  it('renders the Back to grid button only when onExit is provided', () => {
    const frameworks = [fwStub({})]
    const onExit = vi.fn()
    const { rerender } = render(<FrameworkFocusView frameworks={frameworks} />)
    expect(
      screen.queryByRole('button', { name: /return to framework grid/i })
    ).not.toBeInTheDocument()
    rerender(<FrameworkFocusView frameworks={frameworks} onExit={onExit} />)
    fireEvent.click(screen.getByRole('button', { name: /return to framework grid/i }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('sorts PQC-required frameworks ahead of non-required', () => {
    const frameworks = [
      fwStub({ id: 'no', label: 'No-PQC Framework', pqcRequirement: 'no' }),
      fwStub({ id: 'yes', label: 'PQC Framework', pqcRequirement: 'yes' }),
    ]
    render(<FrameworkFocusView frameworks={frameworks} />)
    expect(screen.getByRole('heading', { name: 'PQC Framework', level: 3 })).toBeInTheDocument()
  })
})
