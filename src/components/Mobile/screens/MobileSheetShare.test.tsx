// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 4 (2026-09-29): a phone item sheet covers the header's Share,
// so every sheet that shows ONE item carries its own Share next to Close —
// and it copies the CLEAN canonical link (page + the one param that reopens
// the item), never the reader's filters, tab or sort.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactElement } from 'react'
import '@testing-library/jest-dom'
import { libraryData } from '@/data/libraryData'
import { threatsData } from '@/data/threatsData'
import { patentsData } from '@/data/patentsData'
import { leadersData } from '@/data/leadersData'
import { complianceFrameworks } from '@/data/complianceData'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { algorithmIdFromName } from '@/data/pqcAlgorithmsData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { vendorMap } from '@/data/migrateData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { isPqcPatent } from '@/components/Patents/patentColumns'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import {
  productsForDomain,
  productsForVendor,
} from '@/components/Migrate/Workbench/workbenchCatalog'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MobileLibraryView } from './MobileLibraryView'
import { MobileThreatsView } from './MobileThreatsView'
import { MobileAlgorithmsView } from './MobileAlgorithmsView'
import { MobileProtocolMatrixView } from './MobileProtocolMatrixView'
import { MobilePatentsView } from './MobilePatentsView'
import { MobileCommunityView } from './MobileCommunityView'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
import { MobileMigrateView } from './MobileMigrateView'
import { MobileBusinessToolsView } from './MobileBusinessToolsView'
import { MobilePlaygroundView } from './MobilePlaygroundView'

const writeText = vi.fn<(text: string) => Promise<void>>()

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  window.localStorage.clear()
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
  useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
})
afterEach(() => vi.restoreAllMocks())

function renderAt(path: string, ui: ReactElement) {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
}

/** Clicks the sheet's own Share, then Copy link in the (portaled) menu. */
async function copyLinkFrom(testId: string): Promise<string> {
  const sheet = await screen.findByTestId(testId)
  fireEvent.click(within(sheet).getByRole('button', { name: /^Share / }))
  fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Copy link' }))
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
  return writeText.mock.calls[0][0]
}

const abs = (path: string) => `${window.location.origin}${path}`
const enc = encodeURIComponent

describe('mobile item sheets share their clean canonical link', () => {
  it('Library → /library?ref=', async () => {
    const doc = libraryData[0]
    renderAt(`/library?ref=${enc(doc.referenceId)}&sort=x`, <MobileLibraryView />)
    expect(await copyLinkFrom('library-detail-sheet')).toBe(
      abs(`/library?ref=${enc(doc.referenceId)}`)
    )
  })

  it('Threats → /threats?id=', async () => {
    const t = threatsData[0]
    renderAt(`/threats?id=${enc(t.threatId)}`, <MobileThreatsView />)
    expect(await copyLinkFrom('threat-detail-sheet')).toBe(abs(`/threats?id=${enc(t.threatId)}`))
  })

  it('Algorithms → /algorithms?algo=', async () => {
    renderAt('/algorithms', <MobileAlgorithmsView />)
    fireEvent.click(screen.getByText('RSA-2048').closest('button')!)
    expect(await copyLinkFrom('algorithm-detail-sheet')).toBe(
      abs(`/algorithms?algo=${enc(algorithmIdFromName('RSA-2048'))}`)
    )
  })

  it('Protocol matrix → /algorithms?tab=support&protocol=', async () => {
    const row = PROTOCOL_MATRIX[0]
    renderAt(`/algorithms?tab=support&protocol=${enc(row.id)}`, <MobileProtocolMatrixView />)
    expect(await copyLinkFrom('protocol-matrix-detail-sheet')).toBe(
      abs(`/algorithms?tab=support&protocol=${enc(row.id)}`)
    )
  })

  it('Patents → /patents?patent=US…', async () => {
    const p = patentsData.filter(isPqcPatent)[0]
    renderAt('/patents', <MobilePatentsView />)
    fireEvent.click(screen.getByText(p.title).closest('button')!)
    const url = await copyLinkFrom('patent-detail-sheet')
    expect(url).toBe(abs(`/patents?patent=${enc(p.patentNumber)}`))
    expect(url).toContain('patent=US')
  })

  it('Community → /leaders?leader=<leaderId>', async () => {
    const leader = leadersData.find((l) => l.sourceKind === 'curated')!
    renderAt(`/leaders?leader=${enc(leader.leaderId)}`, <MobileCommunityView />)
    expect(await copyLinkFrom('leader-detail-sheet')).toBe(
      abs(`/leaders?leader=${enc(leader.leaderId)}`)
    )
  })

  it('Compliance framework → /compliance?framework=', async () => {
    const fw = complianceFrameworks[0]
    renderAt(`/compliance?tab=landscape&framework=${enc(fw.id)}`, <MobileComplianceView />)
    expect(await copyLinkFrom('compliance-framework-detail-sheet')).toBe(
      abs(`/compliance?framework=${enc(fw.id)}`)
    )
  })

  it('Compliance record → /compliance?cert=', async () => {
    const records: MobileCertRecord[] = [
      {
        id: '4389',
        source: 'NIST',
        date: '2023-01-01',
        link: 'https://csrc.nist.gov/x',
        type: 'FIPS 140-3',
        status: 'Active',
        productName: 'Linked Module',
        productCategory: 'HSM',
        vendor: 'Acme',
      },
    ]
    renderAt(
      '/compliance?tab=records&cert=4389',
      <MobileComplianceView records={records} recordsLoaded />
    )
    expect(await copyLinkFrom('compliance-record-detail-sheet')).toBe(abs('/compliance?cert=4389'))
  })

  it('Migrate product → /migrate?product=<product_id>', async () => {
    const [p] = productsForDomain('tls')
    renderAt(`/migrate?tab=replace&product=${enc(p.productId)}`, <MobileMigrateView />)
    expect(await copyLinkFrom('migrate-product-detail-sheet')).toBe(
      abs(`/migrate?product=${enc(p.productId)}`)
    )
  })

  it('Migrate vendor roadmap → /migrate?tab=roadmaps&vendor=', async () => {
    const vendorId = [...roadmapByVendorId.keys()][0]
    renderAt(`/migrate?vendor=${enc(vendorId)}`, <MobileMigrateView />)
    expect(await copyLinkFrom('vendor-roadmap-sheet')).toBe(
      abs(`/migrate?tab=roadmaps&vendor=${enc(vendorId)}`)
    )
  })

  it('Migrate vendor products → the same clean vendor link', async () => {
    const ids = [...new Set([...roadmapByVendorId.keys(), ...enrichmentByVendorId.keys()])]
    const vendorId = ids.find((id) => productsForVendor(id).length > 0)!
    const vendorName =
      roadmapByVendorId.get(vendorId)?.[0]?.vendorName ||
      vendorMap.get(vendorId)?.vendorDisplayName ||
      vendorId
    renderAt('/migrate', <MobileMigrateView />)
    fireEvent.click(screen.getByText('Vendors').closest('button')!)
    const card = screen.getByText(vendorName).closest<HTMLElement>('div.rounded-xl')!
    fireEvent.click(
      within(card)
        .getByText(/products? in catalog/)
        .closest('button')!
    )
    expect(await copyLinkFrom('vendor-products-sheet')).toBe(
      abs(`/migrate?tab=roadmaps&vendor=${enc(vendorId)}`)
    )
  })

  it('Business tool → /business/tools/<id>', async () => {
    const tool = BUSINESS_TOOLS.find((t) => t.id !== 'crypto-architecture-diagram')!
    renderAt('/business/tools', <MobileBusinessToolsView />)
    fireEvent.click(screen.getByText(tool.name).closest('button')!)
    expect(await copyLinkFrom('business-tool-detail-sheet')).toBe(
      abs(`/business/tools/${enc(tool.id)}`)
    )
  })

  it('Playground tool → /playground/<id>', async () => {
    const dropped = new Set(['vpn-sim', 'mls-group-messaging', 'openssl-studio'])
    const tool = WORKSHOP_TOOLS.find((t) => !t.sandbox && !dropped.has(t.id))!
    renderAt('/playground', <MobilePlaygroundView />)
    fireEvent.click(screen.getByText(tool.name).closest('button')!)
    expect(await copyLinkFrom('playground-tool-detail-sheet')).toBe(
      abs(`/playground/${enc(tool.id)}`)
    )
  })
})
