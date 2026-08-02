// SPDX-License-Identifier: GPL-3.0-only
import type { ReactElement } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimpleGanttChart } from './SimpleGanttChart'
import { logEvent } from '../../utils/analytics'
import type { GanttCountryData } from '../../types/timeline'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'

// SimpleGanttChart now reads ?event= via useSearchParams, so it needs a Router.
const renderG = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

// Mock dependencies
vi.mock('./GanttDetailPopover', () => ({
  GanttDetailPopover: ({ isOpen, phase }: { isOpen: boolean; phase: { title?: string } | null }) =>
    isOpen ? <div data-testid="detail-popover">Popover: {phase?.title}</div> : null,
}))

vi.mock('../common/CountryFlag', () => ({
  CountryFlag: ({ code }: { code: string }) => <div data-testid={`flag-${code}`}>Flag</div>,
}))

// Mock FilterDropdown since it's used for the region selector
vi.mock('../common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    onSelect,
    label,
  }: {
    items: { id: string; label: string }[]
    onSelect: (id: string) => void
    label: string
  }) => (
    <div data-testid="filter-dropdown">
      <Button onClick={() => onSelect('All')} aria-label={label}>
        Dropdown: {label}
      </Button>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Button onClick={() => onSelect(item.id)}>{item.label}</Button>
          </li>
        ))}
      </ul>
    </div>
  ),
}))

// Mock Analytics
vi.mock('../../utils/analytics', () => ({
  logEvent: vi.fn(),
}))

const mockData: GanttCountryData[] = [
  {
    country: {
      countryName: 'United States',
      flagCode: 'US',
      bodies: [
        {
          name: 'NIST',
          fullName: 'National Institute of Standards and Technology',
          countryCode: 'US',
          events: [],
        },
      ],
    },
    phases: [
      {
        phase: 'Research',
        type: 'Phase',
        title: 'PQC Research',
        startYear: 2024,
        endYear: 2026,
        description: 'Research phase',
        events: [],
      },
      {
        phase: 'Policy',
        type: 'Milestone',
        title: 'US Policy Milestone',
        startYear: 2025,
        endYear: 2025,
        description: 'Policy milestone',
        events: [],
      },
    ],
  },
  {
    country: {
      countryName: 'Canada',
      flagCode: 'CA',
      bodies: [
        {
          name: 'CSE',
          fullName: 'Communications Security Establishment',
          countryCode: 'CA',
          events: [],
        },
      ],
    },
    phases: [
      {
        phase: 'Testing',
        type: 'Phase',
        title: 'Canada Testing',
        startYear: 2026,
        endYear: 2027,
        description: 'Testing phase',
        events: [],
      },
    ],
  },
]

const mockCountryItems = [
  { id: 'United States', label: 'United States', icon: null },
  { id: 'Canada', label: 'Canada', icon: null },
]

describe('SimpleGanttChart', () => {
  const defaultProps = {
    data: mockData,
    regionFilter: 'All',
    onRegionSelect: vi.fn(),
    regionItems: [
      { id: 'All', label: 'All Regions' },
      { id: 'americas', label: 'Americas' },
      { id: 'eu', label: 'EU' },
      { id: 'apac', label: 'APAC' },
      { id: 'global', label: 'Global' },
    ],
    selectedCountry: 'All',
    onCountrySelect: vi.fn(),
    countryItems: mockCountryItems,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default to desktop size since this component is hidden on mobile in the parent
    global.innerWidth = 1024
    global.innerHeight = 768
  })

  it('renders the table structure', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // Check headers
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Organization')).toBeInTheDocument()
    // Year axis auto-scales to the data in view (mockData spans 2024–2027) with a
    // minimum 6-column span and a "+" overflow bucket on the right edge — see
    // yearRange in SimpleGanttChart.tsx. First column is the "<start" bucket.
    expect(screen.getByText('<2024')).toBeInTheDocument()
    expect(screen.getByText('2030+')).toBeInTheDocument()
  })

  it('renders country and organization data', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)
    const table = screen.getByRole('table')

    // Use getAllByText because names appear in dropdown too, so scope to table
    expect(within(table).getByText('United States')).toBeInTheDocument()
    expect(within(table).getByText('NIST')).toBeInTheDocument()
    expect(within(table).getByText('Canada')).toBeInTheDocument()
    expect(within(table).getByText('CSE')).toBeInTheDocument()
  })

  describe('Per-country last-verified date (Phase 8.4)', () => {
    it('does not render a Verified line when no event has a lastVerified date', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)
      const table = screen.getByRole('table')
      expect(within(table).queryByText(/^Verified /)).not.toBeInTheDocument()
    })

    it('renders the most recent Verified date next to the country name', () => {
      const dataWithVerified: GanttCountryData[] = [
        {
          country: {
            countryName: 'United States',
            flagCode: 'US',
            bodies: [
              {
                name: 'NIST',
                fullName: 'National Institute of Standards and Technology',
                countryCode: 'US',
                events: [
                  {
                    startYear: 2024,
                    endYear: 2026,
                    phase: 'Research',
                    type: 'Phase',
                    title: 'PQC Research',
                    description: 'Research phase',
                    entityType: 'government',
                    orgName: 'NIST',
                    orgFullName: 'National Institute of Standards and Technology',
                    countryName: 'United States',
                    flagCode: 'US',
                    lastVerified: '2026-01-10',
                  },
                  {
                    startYear: 2025,
                    endYear: 2025,
                    phase: 'Policy',
                    type: 'Milestone',
                    title: 'US Policy Milestone',
                    description: 'Policy milestone',
                    entityType: 'government',
                    orgName: 'NIST',
                    orgFullName: 'National Institute of Standards and Technology',
                    countryName: 'United States',
                    flagCode: 'US',
                    lastVerified: '2026-07-16',
                  },
                ],
              },
            ],
          },
          phases: [
            {
              phase: 'Research',
              type: 'Phase',
              title: 'PQC Research',
              startYear: 2024,
              endYear: 2026,
              description: 'Research phase',
              events: [],
            },
          ],
        },
      ]

      renderG(<SimpleGanttChart {...defaultProps} data={dataWithVerified} countryItems={[]} />)
      const table = screen.getByRole('table')
      // getCountryLastVerified reads from country.bodies[].events[] — the
      // most recent of the two dates set above should win.
      expect(within(table).getByText('Verified 2026-07-16')).toBeInTheDocument()
    })
  })

  it('renders phase bars correctly', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)

    // US Research phase spans multiple years, so multiple buttons with same label exist
    const researchPhases = screen.getAllByLabelText(/Research: PQC Research/i)
    expect(researchPhases.length).toBeGreaterThan(0)

    // Canada Testing phase
    const testingPhases = screen.getAllByLabelText(/Testing: Canada Testing/i)
    expect(testingPhases.length).toBeGreaterThan(0)
  })

  it('renders milestone markers (flags)', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)
    // Milestones are single points in time but may still have label
    const milestones = screen.getAllByLabelText(/Policy: US Policy Milestone/i)
    expect(milestones.length).toBeGreaterThan(0)

    // Check the first one for the SVG icon
    expect(within(milestones[0]).getByTestId('milestone-flag')).toBeInTheDocument()
  })

  it('filters data by search text', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/Filter by country.../i)
    fireEvent.change(searchInput, { target: { value: 'Canada' } })

    const table = screen.getByRole('table')
    expect(within(table).getByText('Canada')).toBeInTheDocument()
    expect(within(table).queryByText('United States')).not.toBeInTheDocument()
  })

  it('sorts data when clicking headers', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)

    const countryHeader = screen.getByRole('columnheader', { name: /Country/i })
    expect(countryHeader).toBeInTheDocument()

    // Click to sort descending
    fireEvent.click(countryHeader)

    expect(vi.mocked(logEvent)).toHaveBeenCalledWith('Timeline', 'Sort country', 'desc')
  })

  it('opens popover when clicking a phase', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)

    const phases = screen.getAllByLabelText(/Research: PQC Research/i)
    // Click any of the phase segments
    fireEvent.click(phases[0])

    expect(screen.getByTestId('detail-popover')).toBeInTheDocument()
    expect(screen.getByText('Popover: PQC Research')).toBeInTheDocument()
  })

  it('updates parent filter when country dropdown is used', () => {
    renderG(<SimpleGanttChart {...defaultProps} />)

    const dropdowns = screen.getAllByTestId('filter-dropdown')
    const countryDropdown = dropdowns[1] // Second dropdown is the country filter
    const button = within(countryDropdown).getByText('Canada')

    fireEvent.click(button)
    expect(defaultProps.onCountrySelect).toHaveBeenCalledWith('Canada')
  })

  describe('Advanced Filtering', () => {
    it('renders phase type and event type filter dropdowns', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)
      const dropdowns = screen.getAllByTestId('filter-dropdown')
      // 4 dropdowns: region, country, phase type, event type
      expect(dropdowns).toHaveLength(4)
    })

    it('filters by phase type when phase dropdown is used', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      const dropdowns = screen.getAllByTestId('filter-dropdown')
      const phaseDropdown = dropdowns[2]

      // Click "Research" to filter only Research phases
      fireEvent.click(within(phaseDropdown).getByText('Research'))

      const table = screen.getByRole('table')
      // US has Research phase, should be visible
      expect(within(table).getByText('United States')).toBeInTheDocument()
      // Canada only has Testing, should be filtered out
      expect(within(table).queryByText('Canada')).not.toBeInTheDocument()
    })

    it('filters by event type (Milestones only)', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      const dropdowns = screen.getAllByTestId('filter-dropdown')
      const eventDropdown = dropdowns[3]

      // Click "Milestones" to filter only milestones
      fireEvent.click(within(eventDropdown).getByText('Milestones'))

      // US has a Policy Milestone, should appear
      const table = screen.getByRole('table')
      expect(within(table).getByText('United States')).toBeInTheDocument()
      // Canada has no milestones, should be filtered out
      expect(within(table).queryByText('Canada')).not.toBeInTheDocument()
    })

    it('filters by event type (Phases only)', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      const dropdowns = screen.getAllByTestId('filter-dropdown')
      const eventDropdown = dropdowns[3]

      // Click "Phases" to filter only phase-type events
      fireEvent.click(within(eventDropdown).getByText('Phases'))

      const table = screen.getByRole('table')
      // Both countries have Phase-type events
      expect(within(table).getByText('United States')).toBeInTheDocument()
      expect(within(table).getByText('Canada')).toBeInTheDocument()
      // US Policy Milestone should be gone, only Research Phase remains
      expect(screen.queryAllByLabelText(/Policy: US Policy Milestone/i)).toHaveLength(0)
    })

    it('renders export CSV button', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)
      const exportBtn = screen.getByLabelText('Export filtered timeline as CSV')
      expect(exportBtn).toBeInTheDocument()
      expect(exportBtn).not.toBeDisabled()
    })

    it('disables export button when no data matches filters', () => {
      renderG(<SimpleGanttChart {...defaultProps} data={[]} />)
      const exportBtn = screen.getByLabelText('Export filtered timeline as CSV')
      expect(exportBtn).toBeDisabled()
    })

    it('combines phase type and region filters', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      const dropdowns = screen.getAllByTestId('filter-dropdown')

      // Filter by Research phase type (index 2 = phase type dropdown)
      fireEvent.click(within(dropdowns[2]).getByText('Research'))

      // Also filter by region (search for US)
      const searchInput = screen.getByPlaceholderText(/Filter by country.../i)
      fireEvent.change(searchInput, { target: { value: 'United States' } })

      const table = screen.getByRole('table')
      expect(within(table).getByText('United States')).toBeInTheDocument()
      expect(within(table).queryByText('Canada')).not.toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports ArrowDown to navigate between phase rows', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      // Canada sorts first alphabetically, so Canada Testing is row 0
      // US Research is row 1, US Policy is row 2
      const testingPhases = screen.getAllByLabelText(/Testing: Canada Testing/i)
      testingPhases[0].focus()
      expect(testingPhases[0]).toHaveFocus()

      // Press ArrowDown to navigate to next row (US Research)
      fireEvent.keyDown(testingPhases[0], { key: 'ArrowDown' })

      const researchPhases = screen.getAllByLabelText(/Research: PQC Research/i)
      expect(researchPhases[0]).toHaveFocus()
      expect(researchPhases[0]).toHaveAttribute('data-phase-row', '1')
    })

    it('phase buttons have data-phase attributes for navigation', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      // Canada sorts first (row 0), US Research is row 1
      const testingPhases = screen.getAllByLabelText(/Testing: Canada Testing/i)
      expect(testingPhases[0].getAttribute('data-phase-row')).toBe('0')
      expect(testingPhases[0].getAttribute('data-phase-col')).toBe('0')

      const researchPhases = screen.getAllByLabelText(/Research: PQC Research/i)
      expect(researchPhases[0].getAttribute('data-phase-row')).toBe('1')
      expect(researchPhases[0].getAttribute('data-phase-col')).toBe('0')
    })
  })

  describe('Edge Cases', () => {
    it('renders empty table when data is empty', () => {
      renderG(<SimpleGanttChart {...defaultProps} data={[]} />)
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      // Headers present but no data rows
      expect(screen.getByText('Country')).toBeInTheDocument()
      expect(within(table).queryByText('United States')).not.toBeInTheDocument()
    })

    it('renders single country with many phases', () => {
      const manyPhasesData: GanttCountryData[] = [
        {
          country: {
            countryName: 'Test Country',
            flagCode: 'TC',
            bodies: [{ name: 'Agency', fullName: 'Agency', countryCode: 'TC', events: [] }],
          },
          phases: [
            {
              phase: 'Discovery',
              type: 'Phase',
              title: 'Discovery',
              startYear: 2024,
              endYear: 2025,
              description: 'Discovery',
              events: [],
            },
            {
              phase: 'Testing',
              type: 'Phase',
              title: 'Testing',
              startYear: 2025,
              endYear: 2026,
              description: 'Testing',
              events: [],
            },
            {
              phase: 'Migration',
              type: 'Phase',
              title: 'Migration',
              startYear: 2026,
              endYear: 2030,
              description: 'Migration',
              events: [],
            },
            {
              phase: 'Deadline',
              type: 'Milestone',
              title: 'Final Deadline',
              startYear: 2035,
              endYear: 2035,
              description: 'Deadline',
              events: [],
            },
          ],
        },
      ]

      renderG(<SimpleGanttChart {...defaultProps} data={manyPhasesData} countryItems={[]} />)
      const table = screen.getByRole('table')
      expect(within(table).getByText('Test Country')).toBeInTheDocument()
      // All phase labels should appear
      expect(screen.getAllByLabelText(/Discovery: Discovery/i).length).toBeGreaterThan(0)
      expect(screen.getAllByLabelText(/Testing: Testing/i).length).toBeGreaterThan(0)
      expect(screen.getAllByLabelText(/Migration: Migration/i).length).toBeGreaterThan(0)
      expect(screen.getAllByLabelText(/Deadline: Final Deadline/i).length).toBeGreaterThan(0)
    })

    it('handles phase starting before timeline range', () => {
      const preRangeData: GanttCountryData[] = [
        {
          country: {
            countryName: 'Early Adopter',
            flagCode: 'EA',
            bodies: [{ name: 'Agency', fullName: 'Agency', countryCode: 'EA', events: [] }],
          },
          phases: [
            {
              phase: 'Research',
              type: 'Phase',
              title: 'Early Research',
              startYear: 2020,
              endYear: 2026,
              description: 'Started before timeline',
              events: [],
            },
          ],
        },
      ]

      renderG(<SimpleGanttChart {...defaultProps} data={preRangeData} countryItems={[]} />)
      // Should render without crashing — the axis now auto-scales to include 2020
      // rather than clamping it to a fixed start year.
      expect(screen.getAllByLabelText(/Research: Early Research/i).length).toBeGreaterThan(0)
    })

    it('renders no results when filter matches nothing', () => {
      renderG(<SimpleGanttChart {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/Filter by country.../i)
      fireEvent.change(searchInput, { target: { value: 'NonexistentCountry' } })

      const table = screen.getByRole('table')
      expect(within(table).queryByText('United States')).not.toBeInTheDocument()
      expect(within(table).queryByText('Canada')).not.toBeInTheDocument()
    })

    it('handles overlapping phases from same country', () => {
      const overlappingData: GanttCountryData[] = [
        {
          country: {
            countryName: 'Overlap Country',
            flagCode: 'OC',
            bodies: [{ name: 'Agency', fullName: 'Agency', countryCode: 'OC', events: [] }],
          },
          phases: [
            {
              phase: 'Migration',
              type: 'Phase',
              title: 'System A Migration',
              startYear: 2025,
              endYear: 2030,
              description: 'First migration',
              events: [],
            },
            {
              phase: 'Migration',
              type: 'Phase',
              title: 'System B Migration',
              startYear: 2027,
              endYear: 2033,
              description: 'Overlapping migration',
              events: [],
            },
          ],
        },
      ]

      renderG(<SimpleGanttChart {...defaultProps} data={overlappingData} countryItems={[]} />)
      // Both phases should render as separate rows
      expect(screen.getAllByLabelText(/Migration: System A Migration/i).length).toBeGreaterThan(0)
      expect(screen.getAllByLabelText(/Migration: System B Migration/i).length).toBeGreaterThan(0)
    })
  })
})
