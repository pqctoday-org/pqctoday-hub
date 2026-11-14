// SPDX-License-Identifier: AGPL-3.0-only
// Each tab's page-level Export CSV writes the rows that tab lists, under a file name
// that carries the tab name and the date (pqc-compliance-<tab label>-<date>.csv).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { downloadCsv } from '@/utils/csvExport'
import { forYouShowsDerived } from './views/forYouSelection'
import {
  exportTabFor,
  forYouRowsFor,
  tabExportFileName,
  buildTabCsv,
  type TabExportInput,
} from './tabExport'

vi.mock('@/utils/csvExport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/csvExport')>()
  return { ...actual, downloadCsv: vi.fn() }
})
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
// One stable empty list: a new array per call would re-report the table's rows on every render.
const NO_RECORDS = vi.hoisted(() => [] as never[])
vi.mock('./services', () => ({
  useComplianceRefresh: () => ({
    data: NO_RECORDS,
    loading: false,
    error: null,
    lastUpdated: new Date('2026-02-17'),
    meta: null,
    refresh: vi.fn(),
  }),
}))
vi.mock('../../utils/analytics', () => ({
  logComplianceFilter: vi.fn(),
  logPreviewBannerShown: vi.fn(),
  logPreviewBannerDismissed: vi.fn(),
}))

const FW =
  complianceFrameworks.find((f) => f.bindingStatus === 'binding') ?? complianceFrameworks[0]
const NOW = new Date(2026, 10, 14) // 14 Nov 2026, local date

const emptyInput: TabExportInput = {
  forYou: [],
  landscape: [],
  obligations: [],
  progress: [],
  records: [],
  meta: null,
  scope: 'current',
  newestRecordDate: null,
}

describe('tab export: which tab exports, and the file name', () => {
  it.each([
    ['foryou', 'pqc-compliance-for-you-2026-11-14.csv'],
    ['landscape', 'pqc-compliance-landscape-2026-11-14.csv'],
    ['obligations', 'pqc-compliance-rules-and-standards-2026-11-14.csv'],
    ['progress', 'pqc-compliance-progress-2026-11-14.csv'],
    ['records', 'pqc-compliance-product-records-2026-11-14.csv'],
  ] as const)('%s exports as %s', (tab, name) => {
    expect(exportTabFor(tab)).toBe(tab)
    expect(tabExportFileName(tab, NOW)).toBe(name)
  })

  it('tabs that list no rows have no page export', () => {
    for (const tab of ['products', 'cswp39', 'requirements']) {
      expect(exportTabFor(tab)).toBeUndefined()
    }
  })
})

describe('For You export: derived rows only where the persona view shows them', () => {
  it('includes them for the default panel and the Executive, GRC and Researcher views', () => {
    expect(forYouShowsDerived(null)).toBe(true)
    expect(forYouShowsDerived('executive')).toBe(true)
    expect(forYouShowsDerived('grc')).toBe(true)
    expect(forYouShowsDerived('researcher')).toBe(true)
  })

  it('leaves them out for the views that list different rows', () => {
    for (const persona of ['architect', 'developer', 'ops', 'cert-engineer', 'curious']) {
      expect(forYouShowsDerived(persona), persona).toBe(false)
    }
  })
})

describe('tab export: each tab writes the rows it lists', () => {
  it('For You writes the applicable frameworks with their tier and binding status', () => {
    const csv = buildTabCsv('foryou', {
      ...emptyInput,
      forYou: forYouRowsFor('', [{ item: FW, tier: 'mandatory', reason: 'In your scope' }], []),
    })
    const [header, row] = csv.split('\n')
    expect(header).toContain('Applicability tier')
    expect(row).toContain(FW.id)
    expect(row).toContain('mandatory')
    expect(csv.split('\n')).toHaveLength(2)
  })

  it('For You includes the trust-path-derived frameworks the tab lists, after the applicable ones', () => {
    const derived = {
      standardId: 'DERIVED-STD',
      standardLabel: 'Derived Standard',
      paths: [],
      bestPath: {} as never,
      derivedTier: 'derived' as const,
    }
    const rows = forYouRowsFor(
      '',
      [{ item: FW, tier: 'mandatory', reason: 'In your scope' }],
      [derived]
    )
    expect(rows.map((r) => r.id)).toEqual([FW.id, 'DERIVED-STD'])
    expect(rows[1].tier).toBe('derived')
    const csv = buildTabCsv('foryou', { ...emptyInput, forYou: rows })
    expect(csv).toContain('Derived Standard')
    expect(csv.split('\n')).toHaveLength(3)
  })

  it('Landscape writes exactly the framework rows it was given', () => {
    const rows: ComplianceFramework[] = complianceFrameworks.slice(0, 3)
    const lines = buildTabCsv('landscape', { ...emptyInput, landscape: rows }).split('\n')
    expect(lines).toHaveLength(rows.length + 1)
    for (const fw of rows) expect(lines.join('\n')).toContain(fw.id)
  })

  it('Rules & Standards writes its obligation rows with tier and milestones', () => {
    const csv = buildTabCsv('obligations', {
      ...emptyInput,
      obligations: [
        {
          framework: FW,
          tier: 'recognized',
          reason: 'Recognised for your sector',
          requirementCount: 0,
          requirementSources: [],
          milestones: [{ year: 2030, label: 'Full migration' }],
        },
      ],
    })
    const [header, row] = csv.split('\n')
    expect(header).toContain('Milestones')
    expect(row).toContain('2030: Full migration')
  })

  it('Progress writes one line per milestone entry', () => {
    const csv = buildTabCsv('progress', {
      ...emptyInput,
      progress: [{ framework: FW, year: 2028, label: 'Phase two', bucket: 'ahead' }],
    })
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('Phase two')
    expect(lines[1]).toContain('2028')
  })

  it('Records writes the filtered rows with the scope preamble', () => {
    const csv = buildTabCsv('records', { ...emptyInput, scope: 'all' })
    expect(csv.trim().length).toBeGreaterThan(0)
  })
})

// The page's own Export CSV: the handler the top bar runs for the tab on screen.
const SLUG: Record<string, string> = {
  foryou: 'for-you',
  landscape: 'landscape',
  obligations: 'rules-and-standards',
  progress: 'progress',
  records: 'product-records',
}

describe('ComplianceView page Export CSV, per tab', () => {
  beforeEach(() => {
    vi.mocked(downloadCsv).mockClear()
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
    usePageActionsStore.getState().clearPageActions()
  })

  it.each(['foryou', 'landscape', 'obligations', 'progress', 'records'] as const)(
    'the %s tab exports its file and the top bar offers the export',
    async (tab) => {
      const { ComplianceView } = await import('./ComplianceView')
      render(
        <MemoryRouter initialEntries={[`/compliance?tab=${tab}`]}>
          <ComplianceView />
        </MemoryRouter>
      )
      const onExport = usePageActionsStore.getState().current?.onExport
      expect(onExport, `${tab} offers Export CSV in the top bar`).toBeDefined()
      onExport?.()
      expect(downloadCsv).toHaveBeenCalledTimes(1)
      const [, filename] = vi.mocked(downloadCsv).mock.calls[0]
      expect(filename).toMatch(
        new RegExp(`^pqc-compliance-${SLUG[tab]}-\\d{4}-\\d{2}-\\d{2}\\.csv$`)
      )
    },
    60000
  )

  it('a tab with no rows of its own offers no export', async () => {
    const { ComplianceView } = await import('./ComplianceView')
    render(
      <MemoryRouter initialEntries={['/compliance?tab=products']}>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(usePageActionsStore.getState().current?.onExport).toBeUndefined()
  }, 60000)
})
