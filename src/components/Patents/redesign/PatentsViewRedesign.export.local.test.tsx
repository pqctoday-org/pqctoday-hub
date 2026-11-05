// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Papa from 'papaparse'
import { PatentsViewRedesign } from './PatentsViewRedesign'
import { patentsData } from '@/data/patentsData'
import { downloadCsv } from '@/utils/csvExport'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/data/patentsData', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/data/patentsData')>()
  return {
    ...original,
    patentsData: original.patentsData.slice(0, 3).map((p, i) => ({
      ...p,
      patentNumber: `US9999000${i}`,
      title: i < 2 ? 'Needlefixture, "same title"\nsecond line' : 'Different catalogue entry',
      assignee: i < 2 ? 'Sample, "supplier"' : 'Other sample supplier',
      summary: 'Sample export fixture only',
      primaryInventiveClaim: '',
      issueDate: `2026-01-0${i + 1}`,
    })),
  }
})
vi.mock('@/utils/csvExport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/csvExport')>()),
  downloadCsv: vi.fn(),
}))
vi.mock('@/services/search/useSemanticSearch', () => {
  const result = { hits: [], mode: 'idle', loading: false }
  return { useSemanticSearch: () => result }
})

function renderRoute(query: string) {
  return render(
    <MemoryRouter initialEntries={[`/patents?scope=all&${query}`]}>
      <PatentsViewRedesign />
    </MemoryRouter>
  )
}
function exportRows() {
  act(() => usePageActionsStore.getState().current?.onExport?.())
  const csv = vi.mocked(downloadCsv).mock.lastCall?.[0]
  expect(csv).toBeDefined()
  const parsed = Papa.parse<Record<string, string>>(csv!, { header: true, skipEmptyLines: true })
  expect(parsed.errors).toEqual([])
  return parsed.data
}

beforeEach(() => {
  localStorage.clear()
  usePersonaStore.getState().setPersona(null)
  vi.mocked(downloadCsv).mockClear()
})

describe('Patents active-result CSV scope', () => {
  it('exports exactly the filtered Explore IDs in visible sort order, preserving CSV text', () => {
    renderRoute('tab=explore&assignee=' + encodeURIComponent('Sample, "supplier"'))
    const rows = exportRows()
    expect(rows.map((r) => r['Patent Number'])).toEqual(['US99990001', 'US99990000'])
    expect(rows.map((r) => r.Title)).toEqual([patentsData[1].title, patentsData[0].title])
    expect(rows[0].Assignee).toBe('Sample, "supplier"')
  })

  it('exports the actual ranked Search hits instead of the corpus', async () => {
    renderRoute('tab=search&sq=Needlefixture')
    await waitFor(() => {
      vi.mocked(downloadCsv).mockClear()
      expect(exportRows().map((r) => r['Patent Number'])).toEqual([
        'US99990000',
        'US99990001',
      ])
    })
    const rows = exportRows()
    expect(rows.every((r) => r.Title === patentsData[0].title)).toBe(true)
  })

  it.each(['tab=explore&patentIds=US00000000', 'tab=search&sq=zzzznomatch'])(
    'exports headers without unrelated fallback rows for empty results: %s',
    (query) => {
      renderRoute(query)
      expect(exportRows()).toEqual([])
    }
  )

  it('keeps Insights export scoped to its displayed catalogue', () => {
    renderRoute('tab=insights')
    expect(exportRows().map((r) => r['Patent Number'])).toEqual(
      patentsData.map((p) => p.patentNumber)
    )
  })
})
