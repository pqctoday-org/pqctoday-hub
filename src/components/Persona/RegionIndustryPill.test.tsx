// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RegionIndustryPill } from './RegionIndustryPill'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/utils/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/analytics')>()
  return {
    ...actual,
    logRegionSelected: vi.fn(),
    logIndustrySelected: vi.fn(),
  }
})

function getPillButton() {
  return screen.getByRole('button', { name: /region and industry/i })
}

describe('RegionIndustryPill', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: null,
      selectedRegion: 'global',
      selectedIndustries: [],
    })
    vi.clearAllMocks()
  })

  it('falls back to "Global" with no persona and no custom region/industry set', () => {
    render(<RegionIndustryPill />)
    expect(getPillButton()).toHaveTextContent('Global')
  })

  it('falls back to the persona default region and industries when the store is untouched', () => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    render(<RegionIndustryPill />)
    // PERSONA_TIMELINE_REGION.executive = 'americas';
    // PERSONA_THREATS_DEFAULT_INDUSTRIES.executive includes 'Finance & Banking'.
    expect(getPillButton()).toHaveTextContent('Americas')
    expect(getPillButton()).toHaveTextContent('Finance & Banking')
  })

  it('reads a LIVE selectedRegion from the store instead of the persona default once customized', () => {
    usePersonaStore.setState({ selectedPersona: 'executive', selectedRegion: 'apac' })
    render(<RegionIndustryPill />)
    expect(getPillButton()).toHaveTextContent('APAC')
    expect(getPillButton()).not.toHaveTextContent('Americas')
  })

  it('reads LIVE selectedIndustries from the store instead of the persona default once customized', () => {
    usePersonaStore.setState({ selectedPersona: 'executive', selectedIndustries: ['Healthcare'] })
    render(<RegionIndustryPill />)
    expect(getPillButton()).toHaveTextContent('Healthcare')
    expect(getPillButton()).not.toHaveTextContent('Finance & Banking')
  })

  it('opens an editor with Region and Industry pickers on click', () => {
    render(<RegionIndustryPill />)
    fireEvent.click(getPillButton())
    const dialog = screen.getByRole('dialog', { name: /edit region and industry/i })
    expect(within(dialog).getByText('Region')).toBeInTheDocument()
    expect(within(dialog).getByText('Industry')).toBeInTheDocument()
  })

  it('closes the editor on Escape', () => {
    render(<RegionIndustryPill />)
    fireEvent.click(getPillButton())
    expect(screen.getByRole('dialog', { name: /edit region and industry/i })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.queryByRole('dialog', { name: /edit region and industry/i })
    ).not.toBeInTheDocument()
  })

  it('closes the editor when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside" />
        <RegionIndustryPill />
      </div>
    )
    fireEvent.click(getPillButton())
    expect(screen.getByRole('dialog', { name: /edit region and industry/i })).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(
      screen.queryByRole('dialog', { name: /edit region and industry/i })
    ).not.toBeInTheDocument()
  })

  it('selecting a region in the editor writes it to the store via setRegion', () => {
    render(<RegionIndustryPill />)
    fireEvent.click(getPillButton())
    const dialog = screen.getByRole('dialog', { name: /edit region and industry/i })
    const [regionTrigger] = within(dialog).getAllByTestId('filter-dropdown')
    fireEvent.click(regionTrigger)
    fireEvent.click(screen.getByRole('option', { name: /europe/i }))
    expect(usePersonaStore.getState().selectedRegion).toBe('eu')
  })

  it('selecting an industry in the editor writes it to the store via setIndustries', () => {
    render(<RegionIndustryPill />)
    fireEvent.click(getPillButton())
    const dialog = screen.getByRole('dialog', { name: /edit region and industry/i })
    const [, industryTrigger] = within(dialog).getAllByTestId('filter-dropdown')
    fireEvent.click(industryTrigger)
    fireEvent.click(screen.getByRole('option', { name: /healthcare/i }))
    expect(usePersonaStore.getState().selectedIndustries).toEqual(['Healthcare'])
  })

  it('the pill re-renders live after a selection — no page reload needed', () => {
    render(<RegionIndustryPill />)
    fireEvent.click(getPillButton())
    const dialog = screen.getByRole('dialog', { name: /edit region and industry/i })
    const [regionTrigger] = within(dialog).getAllByTestId('filter-dropdown')
    fireEvent.click(regionTrigger)
    fireEvent.click(screen.getByRole('option', { name: /europe/i }))
    expect(getPillButton()).toHaveTextContent('EU')
  })
})
