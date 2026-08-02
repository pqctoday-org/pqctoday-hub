// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoverageByRegion } from './CoverageByRegion'
import type { GanttCountryData } from '../../types/timeline'

vi.mock('../../data/personaConfig', () => ({
  REGION_COUNTRIES_MAP: {
    americas: ['United States', 'Canada'],
    eu: [],
    mena: [],
    apac: [],
    global: [],
  },
}))

function makeCountry(name: string, phases: string[]): GanttCountryData {
  return {
    country: { countryName: name, flagCode: '', bodies: [] },
    phases: phases.map((phase) => ({
      startYear: 2025,
      endYear: 2026,
      phase,
      type: 'phase' as GanttCountryData['phases'][number]['type'],
      title: phase,
      description: '',
      events: [],
    })),
  }
}

describe('CoverageByRegion — "at Migration+" stat', () => {
  it('counts only countries with a Migration or Standardization phase', () => {
    const data: GanttCountryData[] = [
      makeCountry('United States', ['Discovery', 'Migration']),
      makeCountry('Canada', ['Discovery', 'Testing']),
    ]
    render(<CoverageByRegion data={data} selectedRegion="All" onSelectRegion={() => {}} />)
    expect(screen.getByText('1 of 2 at Migration+')).toBeInTheDocument()
  })

  it('omits the stat line for a region with zero countries', () => {
    const data: GanttCountryData[] = []
    render(<CoverageByRegion data={data} selectedRegion="All" onSelectRegion={() => {}} />)
    expect(screen.queryByText(/at Migration\+/)).not.toBeInTheDocument()
  })
})
