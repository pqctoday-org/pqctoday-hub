// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { libraryData, type LibraryItem } from '@/data/libraryData'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  researchTopicCounts,
  resolveResearchTopicParam as resolveTopicParam,
} from '@/data/researchTopics'
import { ResearchTopicFilter } from './ResearchTopicFilter'
import { matchesLibraryFilters, type LibraryFilterState } from './useLibraryPipeline'
import { libraryWideningFor } from './libraryDeepLink'
import { LibraryViewRedesign } from './LibraryViewRedesign'

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

const COUNTS = [
  { id: 'cryptanalysis', label: 'Cryptanalysis', count: 3 },
  { id: 'quantum-threat', label: 'Quantum threat', count: 1 },
]

describe('resolveTopicParam', () => {
  it('returns the id when the Library has documents for it (case-insensitive)', () => {
    expect(resolveTopicParam('cryptanalysis', COUNTS)).toBe('cryptanalysis')
    expect(resolveTopicParam(' Cryptanalysis ', COUNTS)).toBe('cryptanalysis')
  })

  it('returns All for a missing, unknown or untagged topic', () => {
    expect(resolveTopicParam(null, COUNTS)).toBe('All')
    expect(resolveTopicParam('', COUNTS)).toBe('All')
    expect(resolveTopicParam('not-a-topic', COUNTS)).toBe('All')
    expect(resolveTopicParam('formal-analysis', COUNTS)).toBe('All')
    expect(resolveTopicParam('cryptanalysis', [])).toBe('All')
  })
})

describe('ResearchTopicFilter', () => {
  it('renders nothing while no document is tagged', () => {
    const { container } = render(
      <ResearchTopicFilter topics={[]} selectedId="All" onSelect={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('lists tagged topics with their document counts and reports the choice', () => {
    const onSelect = vi.fn()
    render(<ResearchTopicFilter topics={COUNTS} selectedId="All" onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByRole('option', { name: 'Cryptanalysis (3)' }))
    expect(onSelect).toHaveBeenCalledWith('cryptanalysis')
  })
})

const neutral: LibraryFilterState = {
  activeOrg: 'All',
  filterText: '',
  geoFilter: [],
  sectorFilter: [],
  tierFilter: [],
  algoFamilyFilter: [],
  showOnlyLibraryBookmarks: false,
  libraryBookmarks: [],
  cswp39Only: false,
  certRelevantOnly: false,
  certRelevantIdSet: new Set(),
  lifecycleBucket: 'All',
  semanticIdSet: null,
}

function withTopics(topics: string[]): LibraryItem {
  return { ...libraryData[0], researchTopics: topics }
}

describe('matchesLibraryFilters — research topic', () => {
  it('passes every item when no topic is selected', () => {
    expect(matchesLibraryFilters(withTopics([]), neutral)).toBe(true)
    expect(matchesLibraryFilters(withTopics([]), { ...neutral, topicFilter: 'All' })).toBe(true)
  })

  it('keeps only items tagged with the selected topic', () => {
    const f = { ...neutral, topicFilter: 'cryptanalysis' }
    expect(matchesLibraryFilters(withTopics(['cryptanalysis', 'formal-analysis']), f)).toBe(true)
    expect(matchesLibraryFilters(withTopics(['formal-analysis']), f)).toBe(false)
    expect(matchesLibraryFilters(withTopics([]), f)).toBe(false)
  })

  it('a deep link to an untagged item drops just the topic filter', () => {
    const w = libraryWideningFor(withTopics([]), {
      ...neutral,
      activePurpose: 'all',
      activeCategory: 'All',
      selectedPersona: null,
      prefsOff: false,
      topicFilter: 'cryptanalysis',
      newOnly: false,
    })
    expect(w?.drop).toEqual(['topic'])
  })
})

// ── Page wiring, against the shipped Library ────────────────────────────────

function LocationProbe() {
  return <output data-testid="loc">{useLocation().search}</output>
}

function renderPage(query: string) {
  return render(
    <MemoryRouter initialEntries={[`/library${query}`]}>
      <LibraryViewRedesign />
      <LocationProbe />
    </MemoryRouter>
  )
}

const shownCount = () => {
  const el = screen.getByText(/^\d+ documents?$/)
  return Number(el.textContent!.split(' ')[0])
}

describe('Library page — research topic facet', { timeout: 90_000 }, () => {
  beforeEach(() => usePersonaStore.getState().setPersona(null))

  const tagged: LibraryItem[] = []
  afterEach(() => {
    for (const item of tagged) item.researchTopics = []
    tagged.length = 0
  })

  it('while nothing is tagged, the facet is hidden and ?topic= filters nothing', () => {
    // Guard: this test describes the untagged Library. Once rows carry topics,
    // the tagged-path test below covers the page instead.
    if (researchTopicCounts(libraryData).length > 0) return
    renderPage('?topic=cryptanalysis')
    fireEvent.click(screen.getByRole('button', { name: /^Advanced$/ }))
    expect(screen.queryAllByRole('button', { name: 'Research topic' })).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Clear Cryptanalysis' })).toBeNull()
  })

  it('with tagged rows, ?topic= filters the list, shows a chip, and the chip clears it', () => {
    const picks = libraryData.filter((d) => d.researchTopics.length === 0).slice(0, 2)
    for (const item of picks) {
      item.researchTopics = ['cryptanalysis']
      tagged.push(item)
    }
    const expected = libraryData.filter((d) => d.researchTopics.includes('cryptanalysis')).length

    renderPage('?topic=cryptanalysis&prefs=off')
    expect(shownCount()).toBe(expected)
    // The facet is shown (Advanced opens by itself while a facet in it is set).
    expect(screen.getByRole('button', { name: 'Research topic' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear Cryptanalysis' }))
    expect(new URLSearchParams(screen.getByTestId('loc').textContent ?? '').has('topic')).toBe(
      false
    )
    expect(shownCount()).toBeGreaterThan(expected)
  })
})
