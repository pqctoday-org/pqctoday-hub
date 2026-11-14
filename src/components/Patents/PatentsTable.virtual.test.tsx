// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The patents table renders only the rows in view (4.208, U-4).
 *
 * The shared test setup replaces @tanstack/react-virtual with a stub that
 * renders every row; this file uses the real library and gives jsdom a fixed
 * layout (a 600 px scroll box, 57 px rows) so the window is real.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils'
import type { PatentItem } from '@/types/PatentTypes'

vi.unmock('@tanstack/react-virtual')

const { PatentsTable } = await import('./PatentsTable')

const SCROLL_BOX_PX = 600
const ROW_PX = 57

function patent(n: number): PatentItem {
  return {
    patentNumber: `US${String(12000000 + n)}`,
    title: `Patent title ${n}`,
    inventors: 'Inventor',
    assignee: 'Holder',
    priorityDate: '2020-01-01',
    issueDate: '2022-06-01',
    filingDate: '2020-01-01',
    cpcCodes: '',
    summary: '',
    primaryInventiveClaim: '',
    cryptoAgilityMode: 'hybrid',
    migrationStrategy: 'hybrid',
    quantumRelevance: 'core_invention',
    quantumSafeBasis: 'pqc_algorithm',
    quantumNotes: '',
    protocols: [],
    classicalAlgorithms: [],
    pqcAlgorithms: [],
    quantumTechnology: [],
    keyManagementOps: [],
    hardwareComponents: [],
    authenticationFactors: [],
    standardsReferenced: [],
    threatModel: [],
    entropySource: [],
    primitiveTypes: [],
    applicationDomain: [],
    independentClaimSubjects: [],
    performanceClaims: [],
    dataTypesProtected: [],
    complianceTargets: [],
    citationGraph: [],
    claimDependencies: [],
    nistRoundStatus: [],
    pqcMigrationScore: 5,
    pqcMigrationReason: '',
    publicationKind: 'granted_patent',
    impactFacts: 25,
    impactMigration: 25,
    impactScore: 50,
    impactLevel: 'Medium',
    priorityYear: 2020,
    filingYear: 2020,
  }
}

const ALL = Array.from({ length: 732 }, (_, i) => patent(i + 1))

const LAYOUT_PROPS = ['offsetHeight', 'clientHeight', 'scrollHeight'] as const
const originals = LAYOUT_PROPS.map(
  (name) => [name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)] as const
)
const isScrollBox = (el: HTMLElement) => el.classList.contains('overflow-auto')

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (this.tagName === 'TR') return ROW_PX
      return isScrollBox(this) ? SCROLL_BOX_PX : 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isScrollBox(this) ? SCROLL_BOX_PX : 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isScrollBox(this) ? ALL.length * ROW_PX : 0
    },
  })
})

afterAll(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
  }
})

function renderTable(selectedId: string | null = null) {
  return renderWithRouter(
    <PatentsTable
      patents={ALL}
      selectedId={selectedId}
      onSelect={() => {}}
      sortKey="issueDate"
      sortDir="desc"
      onSort={() => {}}
      visibleColumns={['num', 'title', 'issueDate']}
      columnPreset="custom"
      onPresetChange={() => {}}
      onColumnsChange={() => {}}
      chrome={false}
    />
  )
}

// The spacer and patent rows carry no accessible name to query by.
function patentRowsIn(root: HTMLElement) {
  return root.querySelectorAll('tbody tr[data-deeplink-id]')
}

function spacerCellIn(root: HTMLElement) {
  return root.querySelector<HTMLElement>('tbody tr[aria-hidden="true"] td')
}

describe('PatentsTable virtualisation', () => {
  it('renders a window of rows, not all 732', () => {
    const { container } = renderTable()
    const rows = patentRowsIn(container)
    expect(rows.length).toBeGreaterThan(0)
    // 600 px of 57 px rows is about 11, plus the overscan on each side.
    expect(rows.length).toBeLessThan(40)
    expect(screen.getByText('Patent title 1')).toBeInTheDocument()
  })

  it('keeps the full scroll height with spacer rows', () => {
    const { container } = renderTable()
    const spacer = spacerCellIn(container)
    if (!spacer) throw new Error('no spacer row')
    const rendered = patentRowsIn(container).length
    expect(parseInt(spacer.style.height, 10)).toBe((ALL.length - rendered) * ROW_PX)
  })

  it('brings a selected patent outside the window into range (deep link)', async () => {
    const target = ALL[500]!.patentNumber
    const scrollTo = vi.fn()
    const origScrollTo = HTMLElement.prototype.scrollTo
    HTMLElement.prototype.scrollTo = scrollTo as unknown as typeof HTMLElement.prototype.scrollTo
    try {
      renderTable(target)
      // The virtualiser asks its scroll box to move so row 501 sits mid-view.
      const lastTop = () =>
        Math.max(0, ...scrollTo.mock.calls.map((c) => (c[0] as ScrollToOptions).top ?? 0))
      await vi.waitFor(() => expect(lastTop()).toBeGreaterThan(0))
      const top = lastTop()
      expect(top).toBeGreaterThan(400 * ROW_PX)
      expect(top).toBeLessThan(501 * ROW_PX)
    } finally {
      HTMLElement.prototype.scrollTo = origScrollTo
    }
  })
})
