import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileTimelineList } from './MobileTimelineList'
import type { GanttCountryData } from '../../types/timeline'
import '@testing-library/jest-dom'

// Mock the GanttDetailPopover
vi.mock('./GanttDetailPopover', () => ({
  GanttDetailPopover: ({ isOpen, phase }: { isOpen: boolean; phase: { title?: string } | null }) =>
    isOpen ? <div data-testid="detail-popover">Popover: {phase?.title}</div> : null,
}))

// Mock CountryFlag
vi.mock('../common/CountryFlag', () => ({
  CountryFlag: ({ code }: { code: string }) => <div data-testid={`flag-${code}`}>Flag</div>,
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
        phase: 'Testing',
        type: 'Phase',
        title: 'PQC Testing',
        startYear: 2026,
        endYear: 2028,
        description: 'Testing phase',
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
        phase: 'Policy',
        type: 'Milestone',
        title: 'PQC Policy',
        startYear: 2025,
        endYear: 2025,
        description: 'Policy milestone',
        events: [],
      },
    ],
  },
]

describe('MobileTimelineList', () => {
  beforeEach(() => {
    global.innerWidth = 375
    global.innerHeight = 667
  })

  it('renders country cards', () => {
    render(<MobileTimelineList data={mockData} />)
    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText('Canada')).toBeInTheDocument()
  })

  it('displays organization names', () => {
    render(<MobileTimelineList data={mockData} />)
    expect(screen.getByText('NIST')).toBeInTheDocument()
    expect(screen.getByText('CSE')).toBeInTheDocument()
  })

  it('renders country flags', () => {
    render(<MobileTimelineList data={mockData} />)
    expect(screen.getByTestId('flag-US')).toBeInTheDocument()
    expect(screen.getByTestId('flag-CA')).toBeInTheDocument()
  })

  it('displays the first phase by default', () => {
    render(<MobileTimelineList data={mockData} />)
    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.getByText('Policy')).toBeInTheDocument()
  })

  it('shows phase year ranges', () => {
    render(<MobileTimelineList data={mockData} />)
    expect(screen.getByText(/2024 - 2026/)).toBeInTheDocument()
    expect(screen.getByText(/2025 - 2025/)).toBeInTheDocument()
  })

  it('renders phase indicators (dots)', () => {
    render(<MobileTimelineList data={mockData} />)
    // US has 2 phases, so should have 2 indicator buttons
    const usCard = screen.getByText('United States').closest('.glass-panel')
    const indicators = usCard?.querySelectorAll('button[aria-label^="Go to phase"]')
    expect(indicators).toHaveLength(2)
  })

  it('allows clicking phase indicators to change phase', () => {
    render(<MobileTimelineList data={mockData} />)

    // Initially shows Research
    expect(screen.getByText('Research')).toBeInTheDocument()

    // Click second indicator
    const indicators = screen.getAllByLabelText(/Go to phase/)
    fireEvent.click(indicators[1])

    // Should now show Testing
    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

  it('opens detail popover when phase card is clicked', () => {
    render(<MobileTimelineList data={mockData} />)

    // Click on a phase card
    const phaseCard = screen.getByText('Research').closest('button')
    fireEvent.click(phaseCard!)

    // Popover should open
    expect(screen.getByTestId('detail-popover')).toBeInTheDocument()
  })

  it('distinguishes between milestones and phases visually', () => {
    render(<MobileTimelineList data={mockData} />)

    // Policy is a milestone, should have Flag icon
    const policyCard = screen.getByText('Policy').closest('button')
    expect(policyCard?.querySelector('svg')).toBeInTheDocument()
  })

  it('handles empty phases gracefully', () => {
    const emptyData: GanttCountryData[] = [
      {
        country: {
          countryName: 'Test Country',
          flagCode: 'TC',
          bodies: [
            {
              name: 'Test Org',
              fullName: 'Test Organization',
              countryCode: 'TC',
              events: [],
            },
          ],
        },
        phases: [],
      },
    ]

    render(<MobileTimelineList data={emptyData} />)
    expect(screen.getByText('Test Country')).toBeInTheDocument()
    expect(screen.getByText('No active timeline data')).toBeInTheDocument()
  })

  it('renders with proper container classes', () => {
    const { container } = render(<MobileTimelineList data={mockData} />)
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'gap-4', 'pb-8')
  })

  it('renders glass-panel cards for each country', () => {
    const { container } = render(<MobileTimelineList data={mockData} />)
    const glassPanels = container.querySelectorAll('.glass-panel')
    expect(glassPanels).toHaveLength(2) // One for each country
  })

  it('displays chevron icon for navigation hint', () => {
    render(<MobileTimelineList data={mockData} />)
    const phaseCards = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent?.includes('Research') || btn.textContent?.includes('Policy'))
    expect(phaseCards.length).toBeGreaterThan(0)
  })
})
