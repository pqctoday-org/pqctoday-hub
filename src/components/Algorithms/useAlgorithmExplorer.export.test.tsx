// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { getAlgorithmDefaults } from '@/data/personaConfig'

const downloads: Array<{ csv: string; filename: string }> = []
vi.mock('../../utils/csvExport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/csvExport')>()
  return {
    ...actual,
    downloadCsv: (csv: string, filename: string) => downloads.push({ csv, filename }),
  }
})

import { useAlgorithmExplorer } from './useAlgorithmExplorer'

const wrapperFor =
  (url: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  )

async function explorer(url: string, persona: Parameters<typeof getAlgorithmDefaults>[0]) {
  const defaults = getAlgorithmDefaults(persona)
  const view = renderHook(() => useAlgorithmExplorer(defaults), { wrapper: wrapperFor(url) })
  await waitFor(() => expect(view.result.current.isLoading).toBe(false))
  return view
}

beforeEach(() => {
  downloads.length = 0
})

describe('role default filters', () => {
  it('apply on a plain visit, and are reported', async () => {
    const { result } = await explorer('/algorithms?tab=detailed', 'executive')
    expect(result.current.filterStatus).toBe('published-standard')
    expect(result.current.roleDefaultFilters).toEqual([
      { key: 'status', value: 'published-standard', label: 'Published standard' },
    ])
  })

  it('do not apply under an explicit quickview=none, so "Everything" shows everything', async () => {
    const { result } = await explorer('/algorithms?tab=detailed&quickview=none', 'executive')
    expect(result.current.filterStatus).toBe('All')
    expect(result.current.roleDefaultFilters).toEqual([])
    expect(result.current.filteredAlgorithms.length).toBe(result.current.algorithmData.length)
  })

  it('stay cleared after the reader clears one (explicit All in the URL)', async () => {
    const { result } = await explorer('/algorithms?tab=detailed', 'executive')
    act(() => result.current.handleStatusChange('All'))
    expect(result.current.searchParams.get('status')).toBe('All')
    expect(result.current.roleDefaultFilters).toEqual([])
  })

  it('are recorded in the export preamble', async () => {
    const { result } = await explorer('/algorithms?tab=detailed', 'executive')
    act(() => result.current.handleExportCsv())
    expect(downloads[0].csv).toContain(
      'Role default filter applied (not chosen on the page): maturity=Published standard'
    )
  })
})

describe('CSV export', () => {
  it('exports the visible transition rows with transition columns on the Transition tab', async () => {
    const { result } = await explorer(
      '/algorithms?tab=transition&fn=KEM&quickview=none',
      'developer'
    )
    act(() => result.current.handleExportCsv())
    const { csv, filename } = downloads[0]
    expect(filename).toMatch(/^pqc-transition-guide-/)
    const n = result.current.filteredTransitions.length
    expect(csv).toContain(
      `Scope: ${n} of ${result.current.transitionData.length} transition guide rows`
    )
    const lines = csv.split('\n')
    const header = lines.findIndex((l) => l.startsWith('Function,Classical Algorithm'))
    expect(header).toBeGreaterThan(-1)
    expect(lines.length - header - 1).toBe(n)
    expect(csv).toContain('KEM (key establishment)')
    expect(csv).toContain('Key agreement')
  })

  it('labels the catalogue export as the catalogue and quotes search text as CSV', async () => {
    const { result } = await explorer(
      '/algorithms?tab=detailed&quickview=none&q=%3D1%2B1',
      'developer'
    )
    act(() => result.current.handleExportCsv())
    const { csv } = downloads[0]
    expect(csv).toContain('algorithm catalogue rows visible under the active filters')
    // The cell starts with "Filters:", so the typed text cannot run as a formula.
    expect(csv).toContain('search=""=1+1""')
    expect(csv).not.toMatch(/\\"/)
  })

  it('writes human tier labels and keeps the RAM estimate marker', async () => {
    const { result } = await explorer(
      '/algorithms?tab=detailed&quickview=none&q=ML-KEM-768',
      'developer'
    )
    act(() => result.current.handleExportCsv())
    const row = downloads[0].csv.split('\n').find((l) => l.startsWith('ML-KEM-768,'))
    expect(row).toBeDefined()
    expect(row).toContain('~6000')
    expect(row).toContain('Published standard')
    expect(row).not.toContain(',final,')
    expect(row).not.toMatch(/,,/)
  })
})

describe('search', () => {
  it('matches a family word and a function word together ("lattice KEM")', async () => {
    const { result } = await explorer(
      '/algorithms?tab=detailed&quickview=none&q=lattice%20KEM',
      'developer'
    )
    expect(result.current.filteredAlgorithms.length).toBeGreaterThan(0)
    for (const a of result.current.filteredAlgorithms) {
      expect(a.cryptoFamily).toMatch(/Lattice/)
      expect(a.family).toMatch(/KEM/)
    }
    expect(result.current.filteredTransitions.length).toBeGreaterThan(0)
  })
})
