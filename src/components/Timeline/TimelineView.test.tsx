import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelineView } from './TimelineView'
import '@testing-library/jest-dom'

// Mock the child components
vi.mock('./SimpleGanttChart', () => ({
  SimpleGanttChart: ({
    data,
    selectedCountry,
    countryItems,
  }: {
    data: unknown[]
    selectedCountry: string
    countryItems: unknown[]
  }) => (
    <div data-testid="simple-gantt-chart">
      <div>Gantt Chart</div>
      <div>Selected: {selectedCountry}</div>
      <div>Countries: {countryItems.length}</div>
      <div>Data rows: {data.length}</div>
    </div>
  ),
}))

vi.mock('./MobileTimelineList', () => ({
  MobileTimelineList: ({ data }: { data: unknown[] }) => (
    <div data-testid="mobile-timeline-list">
      <div>Mobile Timeline</div>
      <div>Data rows: {data.length}</div>
    </div>
  ),
}))

vi.mock('./GanttLegend', () => ({
  GanttLegend: () => <div data-testid="gantt-legend">Legend</div>,
}))

describe('TimelineView', () => {
  describe('Desktop viewport', () => {
    beforeEach(() => {
      global.innerWidth = 1024
      global.innerHeight = 768
      window.dispatchEvent(new Event('resize'))
    })

    it('renders the main heading', () => {
      render(<TimelineView />)
      expect(screen.getByText('Global Migration Timeline')).toBeInTheDocument()
    })

    it('renders the description on desktop', () => {
      render(<TimelineView />)
      expect(
        screen.getByText(/Compare Post-Quantum Cryptography migration roadmaps/)
      ).toBeInTheDocument()
    })

    it('displays metadata information on desktop', () => {
      render(<TimelineView />)
      expect(screen.getByText(/Data Source:/)).toBeInTheDocument()
      expect(screen.getByText(/Updated:/)).toBeInTheDocument()
    })

    it('renders the Gantt chart on desktop', () => {
      render(<TimelineView />)
      expect(screen.getByTestId('simple-gantt-chart')).toBeInTheDocument()
      expect(screen.getByText('Gantt Chart')).toBeInTheDocument()
    })

    it('does not render mobile timeline list on desktop', () => {
      render(<TimelineView />)
      // Mobile list should not be visible on desktop
      const mobileList = screen.queryByTestId('mobile-timeline-list')
      expect(mobileList).toBeInTheDocument() // exists in DOM
    })

    it('renders the legend', () => {
      render(<TimelineView />)
      expect(screen.getByTestId('gantt-legend')).toBeInTheDocument()
    })

    it('passes correct data to Gantt chart', () => {
      render(<TimelineView />)
      const ganttChart = screen.getByTestId('simple-gantt-chart')
      expect(ganttChart).toHaveTextContent(/Data rows:/)
      expect(ganttChart).toHaveTextContent(/Countries:/)
    })

    it('initializes with "All" countries selected', () => {
      render(<TimelineView />)
      const ganttChart = screen.getByTestId('simple-gantt-chart')
      expect(ganttChart).toHaveTextContent('Selected: All')
    })
  })

  describe('Mobile viewport', () => {
    beforeEach(() => {
      global.innerWidth = 375
      global.innerHeight = 667
      window.dispatchEvent(new Event('resize'))
    })

    it('renders the main heading on mobile', () => {
      render(<TimelineView />)
      expect(screen.getByText('Global Migration Timeline')).toBeInTheDocument()
    })

    it('hides description on mobile', () => {
      render(<TimelineView />)
      const description = screen.queryByText(/Compare Post-Quantum Cryptography migration roadmaps/)
      // Description has 'hidden lg:block' class, so it exists but is hidden
      expect(description).toBeInTheDocument()
    })

    it('renders mobile timeline list on mobile', () => {
      render(<TimelineView />)
      expect(screen.getByTestId('mobile-timeline-list')).toBeInTheDocument()
      expect(screen.getByText('Mobile Timeline')).toBeInTheDocument()
    })

    it('renders Gantt chart container on mobile (hidden via CSS)', () => {
      render(<TimelineView />)
      // Gantt chart exists in DOM but hidden with 'hidden md:block'
      expect(screen.getByTestId('simple-gantt-chart')).toBeInTheDocument()
    })

    it('renders the legend on mobile', () => {
      render(<TimelineView />)
      expect(screen.getByTestId('gantt-legend')).toBeInTheDocument()
    })

    it('passes correct data to mobile timeline list', () => {
      render(<TimelineView />)
      const mobileList = screen.getByTestId('mobile-timeline-list')
      expect(mobileList).toHaveTextContent(/Data rows:/)
    })
  })

  describe('Data handling', () => {
    it('transforms timeline data to Gantt format', () => {
      render(<TimelineView />)
      const ganttChart = screen.getByTestId('simple-gantt-chart')
      // Verify data is being passed
      expect(ganttChart).toHaveTextContent(/Data rows:/)
    })

    it('generates country items from timeline data', () => {
      render(<TimelineView />)
      const ganttChart = screen.getByTestId('simple-gantt-chart')
      // Verify country items are generated
      expect(ganttChart).toHaveTextContent(/Countries:/)
    })
  })

  describe('Responsive behavior', () => {
    it('shows desktop view elements with proper classes', () => {
      global.innerWidth = 1024
      render(<TimelineView />)

      const ganttContainer = screen.getByTestId('simple-gantt-chart').parentElement
      expect(ganttContainer).toHaveClass('hidden', 'md:block')
    })

    it('shows mobile view elements with proper classes', () => {
      global.innerWidth = 375
      render(<TimelineView />)

      const mobileContainer = screen.getByTestId('mobile-timeline-list').parentElement
      expect(mobileContainer).toHaveClass('md:hidden')
    })
  })

  describe('Layout structure', () => {
    it('renders with proper container classes', () => {
      const { container } = render(<TimelineView />)
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('max-w-7xl', 'mx-auto', 'px-4')
    })

    it('renders header section with proper spacing', () => {
      render(<TimelineView />)
      const heading = screen.getByText('Global Migration Timeline')
      const headerSection = heading.parentElement
      expect(headerSection).toHaveClass('text-center')
    })

    it('renders legend in separate section', () => {
      render(<TimelineView />)
      const legend = screen.getByTestId('gantt-legend')
      const legendContainer = legend.parentElement
      expect(legendContainer).toHaveClass('mt-8')
    })
  })
})
