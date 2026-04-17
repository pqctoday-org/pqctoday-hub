import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
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
    render(
      <MemoryRouter>
        <AboutView />
      </MemoryRouter>
    )
    // There might be multiple due to mobile/desktop views
    const titles = screen.getAllByText('About PQC Today')
    expect(titles.length).toBeGreaterThan(0)
    expect(titles[0]).toBeInTheDocument()

    expect(screen.getAllByText('Community').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Platform Data').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Software Bill of Materials (SBOM)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Open Source License').length).toBeGreaterThan(0)
  })

  it('renders the SBOM list correctly', () => {
    render(
      <MemoryRouter>
        <AboutView />
      </MemoryRouter>
    )
    // SBOM is collapsed by default — expand it first
    const sbomHeader = screen.getAllByText('Software Bill of Materials (SBOM)')[0]
    fireEvent.click(sbomHeader)
    // Verify a few key packages from the SBOM list
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Vite')).toBeInTheDocument()
    expect(screen.getByText('OpenSSL WASM')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument()
  })

  it('renders community discussion links', () => {
    render(
      <MemoryRouter>
        <AboutView />
      </MemoryRouter>
    )

    expect(screen.getAllByText('Community').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Join the conversation on GitHub Discussions').length
    ).toBeGreaterThan(0)

    // First 2 discussion categories visible by default
    expect(screen.getAllByText('Contribute').length).toBeGreaterThan(0)
    // 'Ideas' is collapsed by default — expand via "Show all" toggle
    const showAllBtn = screen.getAllByText(/Show all \d+ more/)[0]
    fireEvent.click(showAllBtn)
    expect(screen.getAllByText('Ideas').length).toBeGreaterThan(0)

    // All community links should open in a new tab
    const communityLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.includes('github.com/pqctoday'))
    expect(communityLinks.length).toBeGreaterThan(0)
    communityLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders platform data section', () => {
    render(
      <MemoryRouter>
        <AboutView />
      </MemoryRouter>
    )

    expect(screen.getAllByText('Platform Data').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Curated datasets powering every page').length).toBeGreaterThan(0)
  })

  it('verifies License section link', () => {
    render(
      <MemoryRouter>
        <AboutView />
      </MemoryRouter>
    )
    const licenseLink = screen.getByRole('link', { name: /View Full License/i })
    expect(licenseLink).toHaveAttribute(
      'href',
      'https://github.com/pqctoday/pqctoday-hub/blob/main/LICENSE'
    )

    const repoLink = screen.getByRole('link', { name: /View GitHub Repository/i })
    expect(repoLink).toHaveAttribute('href', 'https://github.com/pqctoday/pqctoday-hub')
  })
})
