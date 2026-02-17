import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelinePhase } from '../../types/timeline'

// Mock portal rendering to document.body for tests
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

describe('GanttDetailPopover', () => {
  const mockPhase: TimelinePhase = {
    startYear: 2024,
    endYear: 2026,
    phase: 'Discovery',
    type: 'Phase',
    title: 'Quantum-Safe Discovery',
    description: 'Initial assessment of quantum threats',
    events: [
      {
        startYear: 2024,
        endYear: 2026,
        phase: 'Discovery',
        type: 'Phase',
        title: 'Quantum-Safe Discovery',
        description: 'Initial assessment',
        orgName: 'Test Agency',
        countryName: 'Test Country',
        flagCode: 'tc',
        sourceUrl: 'https://example.com/source',
        sourceDate: '2024-01-15',
      },
    ],
  }

  const mockPhaseWithStatus: TimelinePhase = {
    ...mockPhase,
    status: 'New',
  }

  const mockOnClose = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Popover Visibility', () => {
    it('renders when isOpen is true', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.getByText('Quantum-Safe Discovery')).toBeInTheDocument()
      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('End')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<GanttDetailPopover isOpen={false} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.queryByText('Quantum-Safe Discovery')).not.toBeInTheDocument()
    })

    it('does not render when phase is null', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={null} />)

      expect(screen.queryByText('Start')).not.toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('displays phase title', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.getByText('Quantum-Safe Discovery')).toBeInTheDocument()
    })

    it('displays year range', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.getByText('2024')).toBeInTheDocument()
      expect(screen.getByText('2026')).toBeInTheDocument()
    })

    it('displays description', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.getByText('Initial assessment of quantum threats')).toBeInTheDocument()
    })

    it('displays source URL when present', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      const sourceLink = screen.getByRole('link', { name: 'View' })
      expect(sourceLink).toBeInTheDocument()
      expect(sourceLink).toHaveAttribute('href', 'https://example.com/source')
      expect(sourceLink).toHaveAttribute('target', '_blank')
      expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('displays source date when present', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    })

    it('handles missing source URL', () => {
      const phaseWithoutSource: TimelinePhase = {
        ...mockPhase,
        events: [
          {
            ...mockPhase.events[0],
            sourceUrl: undefined,
          },
        ],
      }

      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={phaseWithoutSource} />)

      expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
      // Check for dash "-" which is used when sourceUrl is missing
      const sourceCell = screen.getAllByText('-')[0]
      expect(sourceCell).toBeInTheDocument()
    })

    it('handles missing source date', () => {
      const phaseWithoutDate: TimelinePhase = {
        ...mockPhase,
        events: [
          {
            ...mockPhase.events[0],
            sourceDate: undefined,
          },
        ],
      }

      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={phaseWithoutDate} />)

      // Check for dash "-" which is used when sourceDate is missing (second dash in table)
      const dashes = screen.getAllByText('-')
      expect(dashes.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Status Badge Rendering', () => {
    it('displays status badge when status is present', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhaseWithStatus} />)

      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('does not display status badge when status is undefined', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.queryByText('New')).not.toBeInTheDocument()
      expect(screen.queryByText('Updated')).not.toBeInTheDocument()
    })
  })

  describe('Keyboard Interactions', () => {
    it('calls onClose when Escape key is pressed', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose for other keys', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Click Outside Detection', () => {
    it('calls onClose when clicking outside popover', () => {
      const { container } = render(
        <GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />
      )

      // Click outside the popover (on container)
      fireEvent.mouseDown(container)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when clicking inside popover', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      // Click inside the popover
      const title = screen.getByText('Quantum-Safe Discovery')
      fireEvent.mouseDown(title)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Event Listener Cleanup', () => {
    it('removes event listeners when popover closes', () => {
      const { rerender } = render(
        <GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />
      )

      // Close popover
      rerender(<GanttDetailPopover isOpen={false} onClose={mockOnClose} phase={mockPhase} />)

      // Try to trigger events - should not call onClose since listeners removed
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('removes event listeners on unmount', () => {
      const { unmount } = render(
        <GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />
      )

      unmount()

      // Try to trigger events - should not call onClose since component unmounted
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Type Distinction', () => {
    it('displays correct information for Phase type', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      expect(screen.getByText('Initial assessment of quantum threats')).toBeInTheDocument()
    })

    it('displays correct information for Milestone type', () => {
      const milestonePhase: TimelinePhase = {
        ...mockPhase,
        type: 'Milestone',
        title: 'RSA 2048 Deprecated',
      }

      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={milestonePhase} />)

      expect(screen.getByText('RSA 2048 Deprecated')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('has fixed positioning for centering', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      // CSS class assertions require DOM traversal — no semantic role on outer wrapper
      // eslint-disable-next-line testing-library/no-node-access
      const popover = screen.getByText('Quantum-Safe Discovery').closest('.fixed')
      expect(popover).toBeInTheDocument()
      expect(popover?.className).toContain('left-1/2')
      expect(popover?.className).toContain('top-1/2')
      expect(popover?.className).toContain('-translate-x-1/2')
      expect(popover?.className).toContain('-translate-y-1/2')
    })

    it('applies shadow and border styling', () => {
      render(<GanttDetailPopover isOpen={true} onClose={mockOnClose} phase={mockPhase} />)

      // eslint-disable-next-line testing-library/no-node-access
      const popover = screen.getByText('Quantum-Safe Discovery').closest('.fixed')
      expect(popover?.className).toContain('shadow-2xl')
      expect(popover?.className).toContain('border')
      expect(popover?.className).toContain('rounded-xl')
    })
  })
})
