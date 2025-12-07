import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SimpleGanttChart } from './SimpleGanttChart'
import { logEvent } from '../../utils/analytics'
import type { GanttCountryData } from '../../types/timeline'
import '@testing-library/jest-dom'

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
      <button onClick={() => onSelect('All')} aria-label={label}>
        Dropdown: {label}
      </button>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button onClick={() => onSelect(item.id)}>{item.label}</button>
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
    render(<SimpleGanttChart {...defaultProps} />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // Check headers
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Organization')).toBeInTheDocument()
    // Check years range (2024 - 2035)
    expect(screen.getByText('<2024')).toBeInTheDocument()
    expect(screen.getByText('2035')).toBeInTheDocument()
  })

  it('renders country and organization data', () => {
    render(<SimpleGanttChart {...defaultProps} />)
    const table = screen.getByRole('table')

    // Use getAllByText because names appear in dropdown too, so scope to table
    expect(within(table).getByText('United States')).toBeInTheDocument()
    expect(within(table).getByText('NIST')).toBeInTheDocument()
    expect(within(table).getByText('Canada')).toBeInTheDocument()
    expect(within(table).getByText('CSE')).toBeInTheDocument()
  })

  it('renders phase bars correctly', () => {
    render(<SimpleGanttChart {...defaultProps} />)

    // US Research phase spans multiple years, so multiple buttons with same label exist
    const researchPhases = screen.getAllByLabelText(/Research: PQC Research/i)
    expect(researchPhases.length).toBeGreaterThan(0)

    // Canada Testing phase
    const testingPhases = screen.getAllByLabelText(/Testing: Canada Testing/i)
    expect(testingPhases.length).toBeGreaterThan(0)
  })

  it('renders milestone markers (flags)', () => {
    render(<SimpleGanttChart {...defaultProps} />)
    // Milestones are single points in time but may still have label
    const milestones = screen.getAllByLabelText(/Policy: US Policy Milestone/i)
    expect(milestones.length).toBeGreaterThan(0)

    // Check the first one for the SVG icon
    expect(milestones[0].querySelector('svg')).toBeInTheDocument()
  })

  it('filters data by search text', () => {
    render(<SimpleGanttChart {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/Filter by country.../i)
    fireEvent.change(searchInput, { target: { value: 'Canada' } })

    const table = screen.getByRole('table')
    expect(within(table).getByText('Canada')).toBeInTheDocument()
    expect(within(table).queryByText('United States')).not.toBeInTheDocument()
  })

  it('sorts data when clicking headers', () => {
    render(<SimpleGanttChart {...defaultProps} />)

    const countryHeader = screen.getByText('Country').closest('th')
    expect(countryHeader).toBeInTheDocument()

    // Click to sort descending
    fireEvent.click(countryHeader!)

    expect(vi.mocked(logEvent)).toHaveBeenCalledWith('Timeline', 'Sort country', 'desc')
  })

  it('opens popover when clicking a phase', () => {
    render(<SimpleGanttChart {...defaultProps} />)

    const phases = screen.getAllByLabelText(/Research: PQC Research/i)
    // Click any of the phase segments
    fireEvent.click(phases[0])

    expect(screen.getByTestId('detail-popover')).toBeInTheDocument()
    expect(screen.getByText('Popover: PQC Research')).toBeInTheDocument()
  })

  it('updates parent filter when region dropdown is used', () => {
    render(<SimpleGanttChart {...defaultProps} />)

    const dropdown = screen.getByTestId('filter-dropdown')
    const button = within(dropdown).getByText('Canada')

    fireEvent.click(button)
    expect(defaultProps.onCountrySelect).toHaveBeenCalledWith('Canada')
  })
})
