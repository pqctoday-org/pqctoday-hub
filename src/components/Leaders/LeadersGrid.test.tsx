import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LeadersGrid } from './LeadersGrid'
import type { Leader } from '../../data/leadersData'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('../../data/leadersData', () => ({
  leadersData: [
    {
      name: 'Alice Quant',
      country: 'USA',
      title: 'Chief Scientist',
      organizations: ['Quantum Corp'],
      type: 'Private',
      category: 'Research',
      bio: 'Leading PQC research.',
      imageUrl: 'alice.jpg',
      websiteUrl: 'https://alice.com',
      linkedinUrl: 'https://linkedin.com/alice',
    },
    {
      name: 'Bob Cyber',
      country: 'UK',
      title: 'Director',
      organizations: ['NCSC'],
      type: 'Public',
      category: 'Government',
      bio: 'Securing national infrastructure.',
      imageUrl: '', // Test fallback icon
    },
    {
      name: 'Charlie Prof',
      country: 'Canada',
      title: 'Professor',
      organizations: ['Waterloo'],
      type: 'Academic',
      category: 'Education',
      bio: 'Teaching crypto.',
    },
  ] as Leader[],
  leadersMetadata: {
    filename: 'leaders_test.csv',
    lastUpdate: new Date('2025-02-01'),
  },
}))

vi.mock('../common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    onSelect,
    label,
    defaultLabel,
    selectedId,
  }: {
    items: { id: string; label: string }[]
    onSelect: (id: string) => void
    label?: string
    defaultLabel?: string
    selectedId: string
  }) => {
    const effectiveLabel = label || defaultLabel || 'dropdown'
    return (
      <div data-testid={`filter-${effectiveLabel}`}>
        <button onClick={() => onSelect('All')} aria-label={effectiveLabel}>
          {effectiveLabel}: {items.find((i) => i.id === selectedId)?.label || selectedId}
        </button>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button onClick={() => onSelect(item.id)}>{item.label}</button>
            </li>
          ))}
        </ul>
      </div>
    )
  },
}))

vi.mock('../common/CountryFlag', () => ({
  CountryFlag: ({ code }: { code: string }) => <span data-testid={`flag-${code}`}>Flag</span>,
}))

vi.mock('../../utils/analytics', () => ({
  logEvent: vi.fn(),
}))

// Mock Framer Motion
// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: ({ children, alt, ...props }: any) => (
      <img alt={alt || 'mock image'} {...props}>
        {children}
      </img>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('LeadersGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header and description', () => {
    render(<LeadersGrid />)
    expect(screen.getByText('Transformation Leaders')).toBeInTheDocument()
    expect(screen.getByText(/Meet the visionaries/)).toBeInTheDocument()
  })

  it('renders a grid of leaders', () => {
    render(<LeadersGrid />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)

    expect(screen.getByText('Alice Quant')).toBeInTheDocument()
    expect(screen.getByText('Bob Cyber')).toBeInTheDocument()
  })

  it('displays leader details correctly', () => {
    render(<LeadersGrid />)

    // Alice details
    expect(screen.getByText('Chief Scientist')).toBeInTheDocument()
    expect(screen.getByText('Quantum Corp')).toBeInTheDocument()
    expect(screen.getByText('"Leading PQC research."')).toBeInTheDocument()
    expect(screen.getByText('Private Sector')).toBeInTheDocument()

    // Check for social links
    expect(screen.getByText('Website')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })

  it('renders fallback icon when no image url provided', () => {
    render(<LeadersGrid />)

    // Alice has image. Since alt is empty, getByRole('img') might skip it.
    // Use checking for src attribute on the article.
    // eslint-disable-next-line testing-library/no-node-access
    const aliceArticle = screen.getByText('Alice Quant').closest('article')
    // eslint-disable-next-line testing-library/no-node-access
    const img = aliceArticle?.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'alice.jpg')

    // Bob has no image, should show User icon (SVG)
    // eslint-disable-next-line testing-library/no-node-access
    const bobArticle = screen.getByText('Bob Cyber').closest('article')
    // eslint-disable-next-line testing-library/no-node-access
    const fallbackIcon = bobArticle?.querySelector('svg')
    // Or just look for an SVG since we mocked User icon?
    // Actually we didn't mock User icon specifically, we just let it render.
    // Lucide icons usually render <svg ... class="lucide lucide-user">
    // But since we didn't mock Lucide, it renders the real SVG.
    expect(fallbackIcon).toBeInTheDocument()
  })

  it('filters by Country', () => {
    render(<LeadersGrid />)

    // Initial: 3 leaders
    expect(screen.getAllByRole('article')).toHaveLength(3)

    // Filter to USA
    const dropdown = screen.getByTestId('filter-Select Region') // label="Select Region"
    fireEvent.click(within(dropdown).getByText('USA'))

    // Should behave like filter
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(1)
    expect(screen.getByText('Alice Quant')).toBeInTheDocument()
    expect(screen.queryByText('Bob Cyber')).not.toBeInTheDocument()
  })
})
