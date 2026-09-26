// SPDX-License-Identifier: GPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, afterEach } from 'vitest'
import { ModuleReferencesTab } from './ModuleReferencesTab'
import { MODULE_CITED_STANDARDS } from '@/data/moduleContentRegistry'
import { getLibraryItemsForModule } from '@/data/libraryData'
import { useModuleStore } from '@/store/useModuleStore'
import { MANIFEST_BY_ID } from '../manifest/registry'
import manifest from '../modules/CryptoProductCertification/manifest'

/**
 * Guards the seam added 2026-08-21.
 *
 * Before it, this tab rendered only `getLibraryItemsForModule()` — the LIBRARY's
 * view of which documents belong to a module, via its `module_ids` column. What
 * the module's own content.ts cited was shown nowhere. Measured across the
 * corpus at the time, 47 of 64 modules cited at least one standard that never
 * appeared in their References tab: 152 documents in total.
 *
 * These assert the module's half is rendered, linked into the Library, and not
 * duplicated by the library half.
 */
function renderTab(moduleId: string) {
  return render(
    <MemoryRouter>
      <ModuleReferencesTab moduleId={moduleId} />
    </MemoryRouter>
  )
}

describe('ModuleReferencesTab — cited standards', () => {
  it('renders every standard the module cites, linked by reference id', () => {
    const cited = MODULE_CITED_STANDARDS['quantum-threats']
    expect(cited?.length ?? 0).toBeGreaterThan(0)
    renderTab('quantum-threats')

    expect(screen.getByText('Cited in this module')).toBeInTheDocument()
    for (const std of cited) {
      const link = screen.getByRole('link', { name: std.title || std.id })
      expect(link).toHaveAttribute('href', `/library?ref=${encodeURIComponent(std.id)}`)
    }
  })

  it('does not repeat a cited standard in the library-derived list below it', () => {
    const moduleId = 'quantum-threats'
    const citedIds = new Set((MODULE_CITED_STANDARDS[moduleId] ?? []).map((s) => s.id))
    const overlap = getLibraryItemsForModule(moduleId).filter((i) => citedIds.has(i.referenceId))
    // The fixture is only meaningful if the two sets actually overlap.
    expect(overlap.length).toBeGreaterThan(0)

    renderTab(moduleId)
    for (const item of overlap) {
      // Once as a cited standard, never a second time as a "further" reference.
      expect(screen.getAllByText(item.documentTitle)).toHaveLength(1)
    }
  })

  it('de-dupes a module citing the same standard twice (soc-implementation-pqc cites both RFC 9846 and NIST IR 8547 twice each)', () => {
    const moduleId = 'soc-implementation-pqc'
    const raw = MODULE_CITED_STANDARDS[moduleId] ?? []
    const rawIds = raw.map((s) => s.id)
    const duplicateIds = rawIds.filter((id, i) => rawIds.indexOf(id) !== i)
    // The fixture is only meaningful if content.ts's own duplicate calls still exist.
    expect(duplicateIds.length).toBeGreaterThan(0)

    renderTab(moduleId)
    for (const id of new Set(duplicateIds)) {
      const std = raw.find((s) => s.id === id)
      expect(screen.getAllByRole('link', { name: std?.title || id })).toHaveLength(1)
    }
  })

  it('still renders for a module with no cited standards', () => {
    const unknown = 'not-a-real-module-id'
    expect(MODULE_CITED_STANDARDS[unknown]).toBeUndefined()
    renderTab(unknown)
    expect(screen.getByText('No references yet')).toBeInTheDocument()
  })
})

/**
 * Path scoping (2026-09-25). The four certification schemes are alternative
 * curricula, so a PCI learner had been shown 21 CMVP documents and 8 Common
 * Criteria ones alongside their own.
 *
 * The rule is PathScoped's: a reference the manifest does not map is shared
 * and shows on every path. The no-path case therefore has to stay byte-for-byte
 * what it was, which is what the first test here pins — a filter that dropped
 * untagged references would still satisfy every test above, since neither
 * module those use declares learnPaths at all.
 */
describe('ModuleReferencesTab — learn-path scoping', () => {
  const CERT = 'crypto-product-certification'
  const titleOf = (id: string) => MODULE_CITED_STANDARDS[CERT]?.find((s) => s.id === id)?.title

  afterEach(() => {
    useModuleStore.getState().setActiveLearnPath(CERT, '')
  })

  it('shows every cited standard when no path is chosen', () => {
    useModuleStore.getState().setActiveLearnPath(CERT, '')
    renderTab(CERT)
    for (const id of ['FIPS-140-3-STANDARD', 'CC-2022-CEM', 'eIDAS-2-Regulation']) {
      expect(screen.getAllByRole('link', { name: titleOf(id) || id }).length).toBeGreaterThan(0)
    }
  })

  it('hides the other schemes when a path is chosen', () => {
    useModuleStore.getState().setActiveLearnPath(CERT, 'pci')
    renderTab(CERT)
    expect(
      screen.getAllByRole('link', {
        name: titleOf('PCI-PTS-Program-Guide-v1-9') || 'PCI-PTS-Program-Guide-v1-9',
      }).length
    ).toBeGreaterThan(0)
    for (const id of ['FIPS-140-3-STANDARD', 'CC-2022-CEM', 'eIDAS-2-Regulation']) {
      expect(screen.queryByRole('link', { name: titleOf(id) || id })).not.toBeInTheDocument()
    }
  })

  it('keeps an unmapped reference visible on every path', () => {
    // FIPS 203/204/205 back the shared PQC section, so they are deliberately
    // absent from referencePaths and must survive every path.
    useModuleStore.getState().setActiveLearnPath(CERT, 'pci')
    renderTab(CERT)
    expect(manifest.referencePaths?.['FIPS 203']).toBeUndefined()
    expect(
      screen.getAllByRole('link', { name: titleOf('FIPS 203') || 'FIPS 203' }).length
    ).toBeGreaterThan(0)
  })

  it('leaves a module that declares no referencePaths unfiltered', () => {
    // The scoping must be inert for the other 64 modules.
    expect(MANIFEST_BY_ID['quantum-threats']?.referencePaths).toBeUndefined()
    renderTab('quantum-threats')
    const cited = MODULE_CITED_STANDARDS['quantum-threats'] ?? []
    expect(cited.length).toBeGreaterThan(0)
    for (const std of cited) {
      expect(screen.getAllByRole('link', { name: std.title }).length).toBeGreaterThan(0)
    }
  })
})
