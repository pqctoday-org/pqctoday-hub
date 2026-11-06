// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { MarkdownView } from '@/components/ui/MarkdownView'
import type { CryptoLibrary } from '../data/cryptoLibraries'
import { downloadCbomJson } from '@/services/cbom/cycloneDx'

const fixtures = vi.hoisted(() => ({ libraries: null as CryptoLibrary[] | null }))
vi.mock('../data/cryptoLibraries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/cryptoLibraries')>()
  return {
    ...actual,
    get CRYPTO_LIBRARIES() {
      return fixtures.libraries ?? actual.CRYPTO_LIBRARIES
    },
  }
})
const realLibraries = (
  await vi.importActual<typeof import('../data/cryptoLibraries')>('../data/cryptoLibraries')
).CRYPTO_LIBRARIES
let savedInputs: { mode?: string; selectedSbom?: string } | undefined
const save = vi.fn()
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => [],
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [] }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => savedInputs }))
vi.mock('@/hooks/useLiveCmvpStatus', () => ({
  useLiveCmvpStatus: () => ({ matchById: () => null }),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (s: unknown) => unknown) => selector({ addExecutiveDocument: save }),
}))
vi.mock('@/services/cbom/cycloneDx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/cbom/cycloneDx')>()),
  downloadCbomJson: vi.fn(),
}))
const markdown = () => {
  fireEvent.click(screen.getByRole('button', { name: /^Save(?:d(?: · edited since)?)?$/ }))
  return save.mock.lastCall![0].data as string
}
const download = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
  return JSON.parse(vi.mocked(downloadCbomJson).mock.lastCall![0])
}
beforeEach(() => {
  fixtures.libraries = null
  savedInputs = undefined
  save.mockClear()
  vi.mocked(downloadCbomJson).mockClear()
})

describe('library Markdown follows the displayed catalogue', () => {
  it('retains every stable identity and complete source association/notes beside unchanged JSON identities', () => {
    render(<LibraryCBOMBuilder />)
    const md = markdown(),
      doc = download()
    expect(md).toContain(`## Library catalogue — ${realLibraries.length} components`)
    const view = render(<MarkdownView content={md} />)
    const rows = within(view.container).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(realLibraries.length)
    for (const lib of realLibraries) {
      const row = rows.find((r) => within(r).getAllByRole('cell')[0].textContent === lib.id)!
      expect(row).toBeDefined()
      const values = within(row)
        .getAllByRole('cell')
        .map((c) => c.textContent)
      expect(values[1]).toBe(lib.name)
      expect(values[2]).toBe(lib.vendor)
      expect(values[3]).toBe(lib.latestVersion)
      expect(values[6]).toBe(lib.cmvpCertNumber ?? '—')
      expect(values[8]).toBe(lib.pqcSupport)
      expect(values[11]).toBe(lib.notes)
      const component = doc.components.find(
        (c: { 'bom-ref': string }) => c['bom-ref'] === `pkg:${lib.id}`
      )
      expect(component).toMatchObject({
        name: lib.name,
        publisher: lib.vendor,
        version: lib.latestVersion,
        description: lib.notes,
      })
    }
    expect(md).not.toContain('## CBOM slice')
  })
  it('keeps duplicate names distinct and safely preserves commas, pipes, line breaks and Unicode', () => {
    const base = realLibraries[0]
    fixtures.libraries = [
      {
        ...base,
        id: 'fixture-first',
        name: 'Same, library',
        vendor: 'Fictional | vendor',
        cmvpCertNumber: '#1, #2 | complete Ω',
        notes: 'First | line\nSecond, Ω **literal** <text> \\ path',
        openCveHigh: 0,
      },
      {
        ...base,
        id: 'fixture-second',
        name: 'Same, library',
        latestVersion: '2.0',
        notes: 'Different record',
      },
    ]
    render(<LibraryCBOMBuilder />)
    const md = markdown()
    expect(md.split('\n').filter((l) => l.startsWith('|'))).toHaveLength(4)
    const view = render(<MarkdownView content={md} />)
    const rows = within(view.container).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    const values = rows.map((r) =>
      within(r)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    )
    expect(values[0][0]).toBe('fixture-first')
    expect(values[1][0]).toBe('fixture-second')
    expect(values[0][1]).toBe(values[1][1])
    expect(values[0][2]).toBe('Fictional | vendor')
    expect(values[0][6]).toBe('#1, #2 | complete Ω')
    expect(values[0][9]).toBe('0')
    expect(values[0][11]).toBe(fixtures.libraries[0].notes)
    expect(values[1][11]).toBe('Different record')
  })
  it('shows missing catalogue values without inventing certification or availability', () => {
    fixtures.libraries = [
      {
        ...realLibraries[0],
        id: 'minimal-fixture',
        name: 'Minimal sample',
        vendor: '',
        latestVersion: '',
        eolDate: undefined,
        cmvpCertNumber: null,
        pqcSupport: '',
        openCveHigh: undefined,
        notes: '',
      } as unknown as CryptoLibrary,
    ]
    render(<LibraryCBOMBuilder />)
    const view = render(<MarkdownView content={markdown()} />)
    const values = within(within(view.container).getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(values.slice(0, 5)).toEqual(['minimal-fixture', 'Minimal sample', '—', '—', '—'])
    expect(values[6]).toBe('—')
    expect(values[8]).toBe('—')
    expect(values[9]).toBe('—')
    expect(values[11]).toBe('—')
  })
  it('keeps the active SBOM Markdown and selection unchanged across library mode, save and reopen', () => {
    const view = render(<LibraryCBOMBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'SBOM → CBOM' }))
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Or paste your own CycloneDX / SPDX JSON' }),
      {
        target: {
          value: JSON.stringify({ components: [{ name: 'SBOM-only row', version: '9' }] }),
        },
      }
    )
    const sbom = markdown()
    expect(sbom).toContain(
      '| SBOM-only row | 9 | not-validated | not-validated | — | yellow | No posture record — add to inventory and research. |'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Library posture' }))
    const libs = markdown()
    expect(libs).toContain('Library catalogue')
    expect(libs).not.toContain('SBOM-only row')
    savedInputs = save.mock.lastCall![0].inputs
    fireEvent.click(screen.getByRole('button', { name: 'SBOM → CBOM' }))
    expect(markdown()).toBe(sbom)
    view.unmount()
    render(<LibraryCBOMBuilder />)
    expect(markdown()).toBe(libs)
    expect(save.mock.lastCall![0].inputs.mode).toBe('libs')
  })
})
