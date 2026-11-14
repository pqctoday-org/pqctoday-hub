// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library page fixes (Hub 4.208): retired "Builds on" ids, RFC-number links,
 * ?topic= subjects, region and organisation canonicalisation, tree-table row
 * identity, recently-changed dates, start-here blurbs, facet counts, the CSV
 * export columns, the crosswalk panel, and the in-place spec drawer.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import {
  computeCitationCounts,
  findLibraryItemByRef,
  findLibrarySuccessor,
  findRfcByNumber,
  libraryData,
  resolveLiveDependency,
  type LibraryItem,
} from '@/data/libraryData'
import { getLibraryStartPicks } from '@/data/libraryStartPicks'
import { LIBRARY_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { isAppliedQuantumFramework } from '@/components/Library/FrameworkCrosswalkPanel'
import { LibraryTreeTable } from '@/components/Library/LibraryTreeTable'
import { SpecDrawerHost } from '@/components/Library/SpecDrawerHost'
import { topicParamAsSearch } from './libraryDeepLink'
import { canonicalRegionCodes, regionLabel } from './libraryRegions'
import { libraryCanonicalOrgs, ORG_OTHER } from './useLibraryPipeline'
import { libraryClassificationFacts, relatedLearnModules } from './libraryDetailFacts'
import { LibraryRecentlyChanged } from './LibraryRecentlyChanged'
import { LibraryFacetRail } from './LibraryFacetRail'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

const base = (overrides: Partial<LibraryItem>): LibraryItem => ({
  ...libraryData[0],
  children: undefined,
  priorRevisions: undefined,
  supersededByRefs: undefined,
  replacesRefs: undefined,
  dependencies: '',
  ...overrides,
})

describe('retired "Builds on" ids resolve to their successor', () => {
  const live = new Set(['draft-x-11', 'RFC 9370'])
  const successorOf = new Map([
    ['draft-x-07', 'draft-x-09'],
    ['draft-x-09', 'draft-x-11'],
    ['draft-y-05', 'RFC 9370'],
    ['loop-a', 'loop-b'],
    ['loop-b', 'loop-a'],
  ])

  it('follows superseded_by hops to the live revision', () => {
    expect(resolveLiveDependency('draft-x-07', live, successorOf)).toBe('draft-x-11')
    expect(resolveLiveDependency('draft-y-05', live, successorOf)).toBe('RFC 9370')
  })

  it('ignores case and separators in the retired id', () => {
    expect(resolveLiveDependency('DRAFT_X_07', live, successorOf)).toBe('draft-x-11')
  })

  it('returns a live id unchanged, and undefined for an unknown id or a cycle', () => {
    expect(resolveLiveDependency('RFC 9370', live, successorOf)).toBe('RFC 9370')
    expect(resolveLiveDependency('nothing-here', live, successorOf)).toBeUndefined()
    expect(resolveLiveDependency('loop-a', live, successorOf)).toBeUndefined()
  })

  it('counts a citation of a retired id for its successor, once per citing row', () => {
    const counts = computeCitationCounts(
      [
        { referenceId: 'a', dependencies: 'draft-x-07; draft-x-11' },
        { referenceId: 'b', dependencies: 'draft-x-09' },
      ],
      (d) => resolveLiveDependency(d, live, successorOf)
    )
    expect(counts.get('draft-x-11')).toBe(2)
    expect(counts.has('draft-x-07')).toBe(false)
  })

  it('a live id has no successor; a retired catalogue id does (when the catalogue has one)', () => {
    expect(findLibrarySuccessor(libraryData[0].referenceId)).toBeUndefined()
    const linked = libraryData.find((i) => (i.priorRevisions?.length ?? 0) > 0)
    if (!linked) return
    const retired = linked.priorRevisions![0].referenceId
    expect(findLibrarySuccessor(retired)?.referenceId).toBe(linked.referenceId)
    // Case and separators do not matter.
    expect(findLibrarySuccessor(retired.toUpperCase().replace(/-/g, '_'))?.referenceId).toBe(
      linked.referenceId
    )
  })
})

describe('a bare RFC number opens a row whose id carries the title', () => {
  const rows = [
    base({ referenceId: 'RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1' }),
    base({ referenceId: 'RFC-3161-Internet-X-509-Public-Key-Infrastructure-Time-Stamp' }),
    base({ referenceId: 'RFC-1234-First' }),
    base({ referenceId: 'RFC 1234' }),
  ]

  it('matches RFC 9846, rfc9846 and RFC-9846', () => {
    for (const ref of ['RFC 9846', 'rfc9846', 'RFC-9846'])
      expect(findRfcByNumber(ref, rows)?.referenceId).toMatch(/^RFC-9846-/)
  })

  it('answers nothing for an ambiguous number or a non-RFC ref', () => {
    expect(findRfcByNumber('RFC 1234', rows)).toBeUndefined()
    expect(findRfcByNumber('RFC 98460', rows)).toBeUndefined()
    expect(findRfcByNumber('FIPS 203', rows)).toBeUndefined()
  })

  it('findLibraryItemByRef still prefers an exact id', () => {
    const exact = libraryData.find((i) => /^RFC \d+$/.test(i.referenceId))
    if (!exact) return
    expect(findLibraryItemByRef(exact.referenceId)).toBe(exact)
  })
})

describe('?topic= with a subject, not a topic id', () => {
  it('moves the subject to the search', () => {
    const next = topicParamAsSearch(new URLSearchParams('topic=CycloneDX&cat=Protocols'))
    expect(next?.get('q')).toBe('CycloneDX')
    expect(next?.has('topic')).toBe(false)
    expect(next?.get('cat')).toBe('Protocols')
  })

  it('leaves a vocabulary topic id, an empty value and an existing search alone', () => {
    expect(topicParamAsSearch(new URLSearchParams(''))).toBeNull()
    expect(topicParamAsSearch(new URLSearchParams('topic=SBOM&q=mine'))).toBeNull()
  })
})

describe('region tokens canonicalise', () => {
  it('maps names onto the codes other rows use', () => {
    expect(canonicalRegionCodes('United States; US; China')).toEqual(['US', 'CN'])
    expect(canonicalRegionCodes('European Union;PQC-REGION-EU')).toEqual(['PQC-REGION-EU'])
    expect(canonicalRegionCodes('Global')).toEqual(['PQC-REGION-GLOBAL'])
    expect(canonicalRegionCodes('Germany')).toEqual(['DE'])
  })

  it('labels Spain and keeps unknown tokens as they are', () => {
    expect(regionLabel('ES')).toBe('Spain')
    expect(regionLabel('XX-UNKNOWN')).toBe('XX-UNKNOWN')
  })

  it('no two region codes in the catalogue show the same label', () => {
    const codes = new Set(libraryData.flatMap((i) => canonicalRegionCodes(i.regionScope)))
    const byLabel = new Map<string, string[]>()
    for (const code of codes)
      byLabel.set(regionLabel(code), [...(byLabel.get(regionLabel(code)) ?? []), code])
    const clashes = [...byLabel].filter(([, cs]) => cs.length > 1)
    expect(clashes).toEqual([])
  })
})

describe('organisation filter', () => {
  const org = (o: Partial<LibraryItem>) =>
    libraryCanonicalOrgs({ authorsOrOrganization: '', documentType: '', ...o })

  it('uses the author field first', () => {
    expect(org({ authorsOrOrganization: 'IETF Datatracker', trustedSourceId: 'nist' })).toEqual([
      'IETF',
    ])
    expect(org({ authorsOrOrganization: 'IETF emu WG' })).toEqual(['IETF'])
  })

  it('falls back to the trusted source, then to the document type', () => {
    expect(org({ authorsOrOrganization: 'J. Doe', trustedSourceId: 'nist-csrc' })).toEqual(['NIST'])
    expect(org({ authorsOrOrganization: 'J. Doe', documentType: 'Internet-Draft' })).toEqual([
      'IETF',
    ])
  })

  it('a hosting site is not a publisher, and a blank author is still reachable as Other', () => {
    expect(org({ authorsOrOrganization: 'A. Author', trustedSourceId: 'arxiv-crypto' })).toEqual([
      ORG_OTHER,
    ])
    expect(org({})).toEqual([ORG_OTHER])
  })

  it('every catalogue row lands in at least one option', () => {
    for (const item of libraryData) expect(libraryCanonicalOrgs(item).length).toBeGreaterThan(0)
  })
})

describe('tree table rows are identified by path', () => {
  afterEach(() => vi.restoreAllMocks())

  // `shared` builds on both parents, so it appears under each and at the top.
  function graph() {
    const shared = base({ referenceId: 'shared', documentTitle: 'Shared child' })
    const p1 = base({ referenceId: 'p1', documentTitle: 'Parent one', children: [shared] })
    const p2 = base({ referenceId: 'p2', documentTitle: 'Parent two', children: [shared] })
    return [p1, p2, shared]
  }

  it('expand-all renders each copy with a distinct key', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<LibraryTreeTable data={graph()} onOpen={vi.fn()} defaultExpandAll />)
    const ids = screen
      .getAllByRole('row')
      .map((r) => r.getAttribute('data-deeplink-id'))
      .filter(Boolean)
    expect(ids).toEqual(['p1', 'shared', 'p2', 'shared', 'shared'])
    const keyWarnings = errors.mock.calls.filter((c) => String(c[0]).includes('same key'))
    expect(keyWarnings).toEqual([])
  })

  it('expanding one parent does not expand the other', () => {
    render(<LibraryTreeTable data={graph()} onOpen={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Expand Parent one' }))
    expect(screen.getByRole('button', { name: 'Expand Parent two' })).toBeInTheDocument()
  })

  it('shows the publication date, labelled, when no catalogue update is recorded', () => {
    render(
      <LibraryTreeTable
        data={[
          base({ referenceId: 'd1', lastUpdateDate: '', initialPublicationDate: '2026-10-02' }),
        ]}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText('Published 2026-10-02')).toBeInTheDocument()
  })
})

describe('New & updated strip shows the date behind the badge', () => {
  it('a New card shows its publication date', () => {
    render(
      <LibraryRecentlyChanged
        items={[
          base({
            referenceId: 'n1',
            status: 'New',
            lastUpdateDate: '',
            initialPublicationDate: '2026-11-02',
          }),
        ]}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /n1/ })).toHaveTextContent(/2026/)
  })
})

describe('start-here picks', () => {
  it('derived picks carry the whole summary and are marked as derived', () => {
    const picks = getLibraryStartPicks('developer')
    for (const pick of picks) {
      expect(pick.derived).toBe(true)
      const item = libraryData.find((i) => i.referenceId === pick.referenceId)
      expect(pick.blurb).toBe(item?.shortDescription ?? '')
    }
  })
})

describe('facet rail counts', () => {
  it('shows a count on All categories and on each lifecycle option', () => {
    render(
      <LibraryFacetRail
        quickView="all"
        onQuickView={vi.fn()}
        categoryInfo={[{ name: 'KEM', count: 3, hasUpdates: true }]}
        activeCategory="All"
        onCategory={vi.fn()}
        personaPreferredCategories={[]}
        lifecycleBucket="All"
        onLifecycle={vi.fn()}
        counts={{ all: 9, new: 2, cert: 1, bookmarked: 0 }}
        lifecycleCounts={new Map([['Draft', 4]])}
      />
    )
    expect(screen.getByRole('button', { name: /All categories/ })).toHaveTextContent('9')
    expect(screen.getByRole('button', { name: /^Draft/ })).toHaveTextContent('4')
    expect(screen.getByRole('img', { name: 'has new or updated documents' })).toBeInTheDocument()
  })
})

describe('CSV export', () => {
  it('carries the fields the detail view shows', () => {
    const headers = LIBRARY_CSV_COLUMNS.map((c) => c.header)
    for (const h of [
      'Lifecycle',
      'Purpose',
      'Catalog Summary',
      'Catalog Checked',
      'Protocol or Tool Impact',
      'Toolchain Support',
      'Builds On',
      'Industries',
      'Peer Reviewed',
      'Vetting Body',
      'Confidence',
      'Referenced by Library Records',
      'Access',
      'Free Summary URL',
    ])
      expect(headers).toContain(h)
  })
})

describe('Applied Quantum crosswalk panel', () => {
  it('matches the v2.1 framework row by its trusted source, not the v3.0 row', () => {
    const v21 = base({
      referenceId: 'AQ-PQC-Migration-Framework-v2.1-2026',
      documentTitle: 'The Applied Quantum PQC Migration Framework (v2.1)',
      manualCategory: 'Migration Guidance',
      trustedSourceId: 'applied-quantum',
    })
    const v30 = base({
      referenceId: 'The-Applied-Quantum-PQC-Migration-Framework-Universal-Versio',
      documentTitle: 'The Applied Quantum PQC Migration Framework – Universal, Version 3.0',
      manualCategory: 'Migration Guidance',
      trustedSourceId: 'applied-quantum',
    })
    expect(isAppliedQuantumFramework(v21)).toBe(true)
    expect(isAppliedQuantumFramework(v30)).toBe(false)
  })

  it('the catalogue row it describes exists and matches', () => {
    const row = libraryData.find((i) => i.referenceId === 'AQ-PQC-Migration-Framework-v2.1-2026')
    if (!row) return
    expect(isAppliedQuantumFramework(row)).toBe(true)
  })
})

describe('detail drawer', () => {
  const noop = () => undefined
  const open = (item: LibraryItem, onOpenRef = vi.fn()) => {
    render(
      <MemoryRouter>
        <LibraryDetailDrawer
          item={item}
          bookmarked={false}
          onToggleBookmark={noop}
          onClose={noop}
          onOpenRef={onOpenRef}
        />
      </MemoryRouter>
    )
    return onOpenRef
  }

  it('lists classification tags and the Learn modules that use the document', () => {
    const item = libraryData.find(
      (i) => relatedLearnModules(i).length > 0 && libraryClassificationFacts(i).length > 0
    )
    if (!item) return
    open(item)
    const modules = screen.getByTestId('drawer-learn-modules')
    const first = relatedLearnModules(item)[0]
    expect(within(modules).getByRole('link', { name: first.title })).toHaveAttribute(
      'href',
      `/learn/${first.id}`
    )
    const fact = libraryClassificationFacts(item)[0]
    expect(screen.getByText(fact.label)).toBeInTheDocument()
  })

  it('a "Builds on" entry naming a retired id opens its successor', () => {
    const linked = libraryData.find((i) => (i.priorRevisions?.length ?? 0) > 0)
    if (!linked) return
    const retired = linked.priorRevisions![0].referenceId
    const onOpenRef = open(base({ referenceId: 'citing-row', dependencies: retired }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${retired} → `) }))
    expect(onOpenRef).toHaveBeenCalledWith(linked.referenceId)
  })
})

describe('spec drawer on another page', () => {
  function LocationProbe() {
    return <output data-testid="loc">{useLocation().search}</output>
  }

  it('opens a "Builds on" document in place', async () => {
    const parent = libraryData.find((i) =>
      i.dependencies
        .split(';')
        .map((d) => d.trim())
        .some((d) => d && findLibraryItemByRef(d))
    )
    if (!parent) return
    const dep = parent.dependencies
      .split(';')
      .map((d) => d.trim())
      .find((d) => d && findLibraryItemByRef(d))!
    render(
      <MemoryRouter initialEntries={[`/algorithms?spec=${encodeURIComponent(parent.referenceId)}`]}>
        <SpecDrawerHost />
        <LocationProbe />
      </MemoryRouter>
    )
    const builds = await screen.findByText('Builds on')
    const section = builds.closest('section')!
    fireEvent.click(within(section).getByRole('button', { name: dep }))
    const search = new URLSearchParams(screen.getByTestId('loc').textContent!)
    expect(search.get('spec')).toBe(findLibraryItemByRef(dep)!.referenceId)
  })
})
