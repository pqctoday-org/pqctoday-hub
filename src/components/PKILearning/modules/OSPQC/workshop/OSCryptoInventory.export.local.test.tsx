// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { OSCryptoInventory } from './OSCryptoInventory'
import manifest from '../manifest'
import { EDUCATION_NOTICE } from '@/data/educationNotice'

const blobs: Blob[] = []
let anchorClick: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  blobs.length = 0
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:sample-summary'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
function open() {
  return render(
    <MemoryRouter>
      <OSCryptoInventory />
    </MemoryRouter>
  )
}
async function download() {
  fireEvent.click(screen.getByRole('button', { name: 'Export Summary (.json)' }))
  return JSON.parse(await blobs.at(-1)!.text())
}
function filter(label: string, value: string) {
  fireEvent.click(screen.getByRole('button', { name: `${label}:` }))
  fireEvent.click(screen.getByRole('option', { name: value }))
}
describe('OS inventory faithful sample download', () => {
  it('downloads every displayed row in order with actual module version, original strings and separate catalogue totals', async () => {
    open()
    const rows = screen.getAllByRole('row').slice(1)
    const expected = rows.map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    )
    const summary = await download()
    expect(blobs[0].type).toBe('application/json;charset=utf-8')
    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(anchorClick.mock.instances[0]).toHaveAttribute(
      'download',
      'os-crypto-inventory-summary.json'
    )
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:sample-summary')
    expect(summary.schemaVersion).toBe(1)
    expect(summary.notice).toBe(EDUCATION_NOTICE)
    expect(summary.module).toEqual({
      id: manifest.id,
      title: manifest.title,
      contentVersion: manifest.contentVersion,
    })
    expect(summary.scope).toEqual({
      riskFilter: 'All',
      effortFilter: 'All',
      displayedCount: 8,
      totalSampleCount: 8,
    })
    expect(summary.components.map((row: { id: string }) => row.id)).toEqual([
      'system-tls',
      'ssh-daemon',
      'package-manager',
      'kernel-module-signing',
      'cert-store',
      'curl-wget',
      'git',
      'container-runtime',
    ])
    summary.components.forEach(
      (
        row: {
          component: string
          category: string
          notes: string
          currentAlgorithm: string
          osDependency: string
        },
        index: number
      ) => {
        expect(expected.at(index)?.[0]).toBe(row.component + row.category + row.notes)
        expect(expected.at(index)?.[1]).toBe(row.currentAlgorithm)
        expect(expected.at(index)?.[2]).toBe(row.osDependency)
      }
    )
    expect(summary.catalogueSummary).toMatchObject({
      components: 8,
      criticalRisk: 2,
      highRisk: 3,
      lowEffort: 3,
    })
    expect(summary.references.learningResource).toBe('/learn/os-pqc')
    expect(screen.getByRole('link', { name: 'Migrate catalog →' })).toHaveAttribute(
      'href',
      summary.references.relatedCatalogue
    )
    expect(summary.references.rowSourceStatus).toContain('not recorded')
    expect(summary.sampleAssumptions.inventory).toContain(
      'no OS discovery or inspection was executed'
    )
    expect(summary.limitations[0]).toContain(
      'does not discover software or verify installed versions'
    )
    expect(screen.queryByText('Exported!')).not.toBeInTheDocument()
  })
  it('exports only the current risk/effort intersection and preserves the explicit empty result', async () => {
    open()
    filter('Risk', 'Critical')
    filter('Effort', 'Medium Effort')
    const selected = await download()
    expect(selected.components.map((row: { id: string }) => row.id)).toEqual([
      'system-tls',
      'ssh-daemon',
    ])
    expect(selected.scope).toMatchObject({
      riskFilter: 'critical',
      effortFilter: 'medium',
      displayedCount: 2,
    })
    expect(selected.catalogueSummary.components).toBe(8)
    filter('Risk', 'Low')
    expect(screen.getByText('No components match the selected filters.')).toBeVisible()
    const empty = await download()
    expect(empty.components).toEqual([])
    expect(empty.scope).toMatchObject({
      riskFilter: 'low',
      effortFilter: 'medium',
      displayedCount: 0,
    })
    expect(empty.catalogueSummary.components).toBe(8)
  })
  it('reports creation/start failures and permits a real retry, cleaning an allocated URL when click fails', async () => {
    open()
    vi.mocked(URL.createObjectURL).mockImplementationOnce(() => {
      throw new Error('sample creation failure')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Export Summary (.json)' }))
    expect(screen.getByRole('alert')).toHaveTextContent('could not be started')
    expect(anchorClick).not.toHaveBeenCalled()
    anchorClick.mockImplementationOnce(() => {
      throw new Error('sample start failure')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Export Summary (.json)' }))
    expect(screen.getByRole('alert')).toBeVisible()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:sample-summary')
    const retry = await download()
    expect(retry.components).toHaveLength(8)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
