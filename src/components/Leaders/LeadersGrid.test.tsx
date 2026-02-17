import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LeadersGrid } from './LeadersGrid'
import type { Leader } from '../../data/leadersData'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('../../data/leadersData', () => ({
  leadersData: [
    {
      id: 'alice-1',
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
      id: 'bob-2',
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
      id: 'charlie-3',
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
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

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
    const dropdown = screen.getByTestId('filter-Region') // label="Region"
    fireEvent.click(within(dropdown).getByText('USA'))

    // Should behave like filter
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(1)
    expect(screen.getByText('Alice Quant')).toBeInTheDocument()
    expect(screen.queryByText('Bob Cyber')).not.toBeInTheDocument()
  })

  it('filters by search query', () => {
    render(<LeadersGrid />)

    // Initial: 3 leaders
    expect(screen.getAllByRole('article')).toHaveLength(3)

    // Search for "Scientist" (matches Alice)
    const searchInput = screen.getByPlaceholderText('Search leaders...')
    fireEvent.change(searchInput, { target: { value: 'Scientist' } })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Alice Quant')).toBeInTheDocument()
    expect(screen.queryByText('Bob Cyber')).not.toBeInTheDocument()
  })

  it('filters by search query (case insensitive)', () => {
    render(<LeadersGrid />)

    // Search for "ncsc" (matches Bob's org)
    const searchInput = screen.getByPlaceholderText('Search leaders...')
    fireEvent.change(searchInput, { target: { value: 'ncsc' } })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Bob Cyber')).toBeInTheDocument()
  })

  it('combines country filter and search', () => {
    render(<LeadersGrid />)

    // All countries
    expect(screen.getAllByRole('article')).toHaveLength(3)

    // Filter to USA
    const dropdown = screen.getByTestId('filter-Region') // label="Region"
    fireEvent.click(within(dropdown).getByText('USA'))
    expect(screen.getAllByRole('article')).toHaveLength(1)

    // Search for something that matches Alice
    const searchInput = screen.getByPlaceholderText('Search leaders...')
    fireEvent.change(searchInput, { target: { value: 'Quant' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Alice Quant')).toBeInTheDocument()

    // Search for something that does NOT match Alice
    fireEvent.change(searchInput, { target: { value: 'Waterloo' } })
    expect(screen.queryByRole('article')).not.toBeInTheDocument() // No results
  })

  it('filters by Sector', () => {
    render(<LeadersGrid />)

    // Initial: 3 leaders
    expect(screen.getAllByRole('article')).toHaveLength(3)

    // Filter to Private (Alice only)
    const dropdown = screen.getByTestId('filter-Sector')
    fireEvent.click(within(dropdown).getByText('Private'))

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Alice Quant')).toBeInTheDocument()
    expect(screen.queryByText('Bob Cyber')).not.toBeInTheDocument()
  })

  it('combines Sector, Country and Search', () => {
    render(<LeadersGrid />)

    // Filter to Public (Bob)
    const sectorDropdown = screen.getByTestId('filter-Sector')
    fireEvent.click(within(sectorDropdown).getByText('Public'))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Bob Cyber')).toBeInTheDocument()

    // Filter to UK (Bob matches)
    const regionDropdown = screen.getByTestId('filter-Region')
    fireEvent.click(within(regionDropdown).getByText('UK'))
    expect(screen.getAllByRole('article')).toHaveLength(1)

    // Search for "Securing" (matches Bob's bio)
    const searchInput = screen.getByPlaceholderText('Search leaders...')
    fireEvent.change(searchInput, { target: { value: 'Securing' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Bob Cyber')).toBeInTheDocument()

    // Search for "Quantum" (Alice, but filtered out by Sector/Region)
    fireEvent.change(searchInput, { target: { value: 'Quantum' } })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
