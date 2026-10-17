// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { loadPQCAlgorithmsData, type AlgorithmDetail } from '@/data/pqcAlgorithmsData'
import { AlgorithmFilters } from './AlgorithmFilters'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'

vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({ revisions: [] }),
  byRecord: () => [],
}))

let data: AlgorithmDetail[] = []
const pick = (name: string) => {
  const a = data.find((d) => d.name === name)
  if (!a) throw new Error(`missing ${name}`)
  return a
}
beforeAll(async () => {
  data = await loadPQCAlgorithmsData()
})

function mountFilters(
  props: Partial<React.ComponentProps<typeof AlgorithmFilters>> = {}
): Record<string, ReturnType<typeof vi.fn>> {
  const handlers = {
    onCryptoFamilyChange: vi.fn(),
    onFunctionGroupChange: vi.fn(),
    onSecurityLevelChange: vi.fn(),
    onRegionChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSearchChange: vi.fn(),
    onQuickView: vi.fn(),
  }
  render(
    <AlgorithmFilters
      cryptoFamily="All"
      functionGroup="All"
      securityLevel="All"
      region="All"
      status="All"
      searchQuery=""
      filteredCount={47}
      totalCount={122}
      quickView="none"
      {...handlers}
      {...props}
    />
  )
  return handlers
}

describe('AlgorithmFilters — role default and "Everything"', () => {
  it('shows a role default chip with a clear button, and "Everything" is not pressed', () => {
    const h = mountFilters({ persona: 'executive', status: 'published-standard' })
    const chip = screen.getByTestId('role-default-filters')
    expect(chip).toHaveTextContent('Role default: Published standard')
    expect(screen.getByRole('button', { name: /Everything/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    fireEvent.click(
      within(chip).getByRole('button', { name: 'Clear role default filter: Published standard' })
    )
    expect(h.onStatusChange).toHaveBeenCalledWith('All')
  })

  it('"Everything" is pressed only when no filter hides rows', () => {
    mountFilters({ persona: 'developer' })
    expect(screen.queryByTestId('role-default-filters')).toBeNull()
    expect(screen.getByRole('button', { name: /Everything/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('search examples are ones that work, with no drop-in wording', () => {
    mountFilters()
    const input = screen.getByRole('textbox', { name: 'Search algorithms' })
    expect(input.getAttribute('placeholder')).toContain('lattice KEM')
    expect(input.getAttribute('placeholder')).not.toMatch(/replaces/i)
  })
})

function renderCompare(names: string[], selectionLimit = 3) {
  const algos = names.map(pick)
  return render(
    <MemoryRouter>
      <AlgorithmDetailedComparison
        filteredAlgorithms={data}
        compareSet={new Set(names)}
        compareType="KEM"
        maxCompareReached
        selectionLimit={selectionLimit}
        onToggleCompare={() => {}}
        detailMode="compare"
        onDetailModeChange={() => {}}
        comparisonAlgos={algos}
        baselineAlgo={pick('ECDH P-256')}
      />
    </MemoryRouter>
  )
}

describe('phone compare', () => {
  it('names the picks beyond three instead of dropping them silently', () => {
    renderCompare(['ML-KEM-768', 'ML-KEM-1024', 'FrodoKEM-640', 'HQC-128', 'HQC-192'])
    expect(screen.getByTestId('phone-compare-hidden')).toHaveTextContent(
      'Showing 3 of 5 — hidden: HQC-128, HQC-192'
    )
  })

  it('shows maturity in reader words, never the internal tier id', () => {
    renderCompare(['ML-KEM-768', 'HQC-128'])
    const cards = screen.getAllByRole('article')
    expect(cards[0]).toHaveTextContent('Published standard')
    expect(cards[1]).toHaveTextContent('Selected; standard pending')
    for (const c of cards) expect(c.textContent).not.toMatch(/fips-draft|round2-candidate|final/)
  })

  it('does not claim "5 of 3 selected" in Browse', () => {
    const names = ['ML-KEM-768', 'ML-KEM-1024', 'FrodoKEM-640', 'HQC-128', 'HQC-192']
    render(
      <MemoryRouter>
        <AlgorithmDetailedComparison
          filteredAlgorithms={data.slice(0, 3)}
          compareSet={new Set(names)}
          compareType="KEM"
          maxCompareReached
          selectionLimit={3}
          onToggleCompare={() => {}}
          detailMode="browse"
          onDetailModeChange={() => {}}
          comparisonAlgos={names.map(pick)}
          baselineAlgo={null}
          hideCompareToggle
        />
      </MemoryRouter>
    )
    expect(screen.queryByText(/of 3 selected/)).toBeNull()
    expect(screen.getByText(/first 3/)).toBeInTheDocument()
  })

  it('gives compare checkboxes at least a 24px tap size on phones', () => {
    render(
      <MemoryRouter>
        <AlgorithmDetailedComparison
          filteredAlgorithms={[pick('ML-KEM-768')]}
          compareSet={new Set()}
          compareType={null}
          maxCompareReached={false}
          onToggleCompare={() => {}}
          detailMode="browse"
          onDetailModeChange={() => {}}
          comparisonAlgos={[]}
          baselineAlgo={null}
        />
      </MemoryRouter>
    )
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box.className).toMatch(/\bh-6 w-6\b/)
    }
  })
})

describe('desktop comparison panel', () => {
  it('names its icon-only close button and keeps the RAM estimate marker', () => {
    render(
      <MemoryRouter>
        <AlgorithmComparisonPanel
          algorithms={[pick('ML-KEM-768'), pick('HPKE-PQ')]}
          baseline={pick('ECDH P-256')}
          activeTab="detailed"
          onClose={() => {}}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'Close comparison' })).toBeInTheDocument()
    expect(screen.getAllByText(/~6,000 B/).length).toBeGreaterThan(0)
    // HPKE-PQ: a stated public key shows even though its private key is missing.
    expect(screen.getAllByText(/1,184 B/).length).toBeGreaterThan(0)
    // ECDH P-256 baseline: no ciphertext exists, so it is not a research gap.
    expect(screen.getAllByText('Not applicable').length).toBeGreaterThan(0)
  })
})
