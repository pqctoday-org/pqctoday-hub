import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AboutView } from './AboutView'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock window.location.href for mailto links
const mockAssign = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    href: '',
    assign: mockAssign,
  },
  writable: true,
})

describe('AboutView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  it('renders the main sections', () => {
    render(<AboutView />)
    // There might be multiple due to mobile/desktop views
    const titles = screen.getAllByText('About PQC Today')
    expect(titles.length).toBeGreaterThan(0)
    expect(titles[0]).toBeInTheDocument()

    expect(screen.getAllByText('Submit Change Request').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Give Kudos').length).toBeGreaterThan(0)
    expect(screen.getByText('Software Bill of Materials (SBOM)')).toBeInTheDocument()
    expect(screen.getByText('Open Source License')).toBeInTheDocument()
  })

  it('renders the SBOM list correctly', () => {
    render(<AboutView />)
    // Verify a few key packages from the SBOM list
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Vite')).toBeInTheDocument()
    expect(screen.getByText('liboqs (ML-DSA, ML-KEM)')).toBeInTheDocument()
    expect(screen.getByText('OpenSSL WASM')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument()
  })

  it('handles Change Request form submission', () => {
    render(<AboutView />)

    // Fill out form
    const featureSelect = screen.getByLabelText('Feature')
    fireEvent.change(featureSelect, { target: { value: 'Timeline' } })

    const descInput = screen.getByLabelText('Description')
    fireEvent.change(descInput, { target: { value: 'Test request' } })

    const submitBtn = screen.getByText('Send Request')
    fireEvent.click(submitBtn)

    // Check if mailto link was triggered
    expect(window.location.href).toContain('mailto:submitchangerequest@pqctoday.com')
    expect(window.location.href).toContain('Test%20request')
  })

  it('handles Kudos form interactions', () => {
    render(<AboutView />)

    // Toggle a like
    // We need to find the specific checkbox or label. The labels contain the text.
    // The structure is label > input[type=checkbox] + span.
    // We can click the text.

    // Find "Timeline" under "What do you like?"
    // Since there are multiple "Timeline" texts (in features list, in change request, etc), be specific.
    // The Kudos section has specific headings.

    const likeTimeline = screen.getAllByText('Timeline')[1] // Crude index access, but effective given the structure
    fireEvent.click(likeTimeline)

    const msgInput = screen.getByLabelText('Message')
    fireEvent.change(msgInput, { target: { value: 'Great job!' } })

    const sendBtn = screen.getByText('Send Kudos')
    fireEvent.click(sendBtn)

    expect(window.location.href).toContain('mailto:kudos@pqctoday.com')
    expect(window.location.href).toContain('Great%20job!')
  })

  it('verifies License section link', () => {
    render(<AboutView />)
    const licenseLink = screen.getByText('View Full License')
    expect(licenseLink.closest('a')).toHaveAttribute(
      'href',
      'https://github.com/pqctoday/pqc-timeline-app/blob/main/LICENSE'
    )
  })
})
