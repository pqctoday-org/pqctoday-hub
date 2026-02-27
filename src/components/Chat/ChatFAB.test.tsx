import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatFAB } from './ChatFAB'
import '@testing-library/jest-dom'

const mockToggle = vi.fn()
let mockIsOpen = false

vi.mock('@/store/useRightPanelStore', () => ({
  useRightPanelStore: (selector: (s: { isOpen: boolean; toggle: typeof mockToggle }) => unknown) =>
    selector({ isOpen: mockIsOpen, toggle: mockToggle }),
}))

// Mock framer-motion using the project's shared mock
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

describe('ChatFAB', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOpen = false
  })

  it('renders the FAB button when the panel is closed', () => {
    render(<ChatFAB />)
    const button = screen.getByRole('button', { name: 'Open PQC Assistant' })
    expect(button).toBeInTheDocument()
  })

  it('does not render when the panel is open', () => {
    mockIsOpen = true
    const { container } = render(<ChatFAB />)
    expect(container.innerHTML).toBe('')
  })

  it('calls toggle when the button is clicked', () => {
    render(<ChatFAB />)

    const button = screen.getByRole('button', { name: 'Open PQC Assistant' })
    fireEvent.click(button)

    expect(mockToggle).toHaveBeenCalledOnce()
  })

  it('has the correct aria-label', () => {
    render(<ChatFAB />)
    expect(screen.getByRole('button', { name: 'Open PQC Assistant' })).toBeInTheDocument()
  })

  it('renders the MessageCircle icon', () => {
    render(<ChatFAB />)
    const button = screen.getByRole('button', { name: 'Open PQC Assistant' })
    // lucide-react renders an SVG inside the button
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
