import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

describe('AboutView', () => {
  it('renders the main sections', () => {
    render(<AboutView />)
    const titles = screen.getAllByText('About PQC Today')
    expect(titles.length).toBeGreaterThan(0)
    expect(titles[0]).toBeInTheDocument()

    expect(screen.getByText('Software Bill of Materials (SBOM)')).toBeInTheDocument()
    expect(screen.getByText('Open Source License')).toBeInTheDocument()
  })

  it('does not render removed sections', () => {
    render(<AboutView />)
    expect(screen.queryByText('Submit Change Request')).not.toBeInTheDocument()
    expect(screen.queryByText('Give Kudos')).not.toBeInTheDocument()
  })

  it('renders the SBOM list correctly', () => {
    render(<AboutView />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Vite')).toBeInTheDocument()
    expect(screen.getByText('OpenSSL WASM')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument()
  })

  it('verifies License section link', () => {
    render(<AboutView />)
    const licenseLink = screen.getByRole('link', { name: /View Full License/i })
    expect(licenseLink).toHaveAttribute(
      'href',
      'https://github.com/pqctoday/pqc-timeline-app/blob/main/LICENSE'
    )

    const repoLink = screen.getByRole('link', { name: /View GitHub Repository/i })
    expect(repoLink).toHaveAttribute('href', 'https://github.com/pqctoday/pqc-timeline-app')
  })
})
