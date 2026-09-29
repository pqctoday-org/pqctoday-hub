// SPDX-License-Identifier: GPL-3.0-only
// Share inside every Compliance item overlay (deep-link PR 4): the icon sits in
// the open overlay's header and Copy link writes the CLEAN canonical link —
// never the reader's filters — without closing the overlay.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { complianceFrameworks } from '@/data/complianceData'
import { ComplianceDetailDrawer } from './redesign/ComplianceDetailDrawer'
import { FrameworkDetailPopover } from './FrameworkDetailPopover'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import { FrameworkConceptGraphModal } from './FrameworkConceptGraphModal'
import type { ComplianceRecord } from './types'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('./FrameworkConceptGraph', () => ({ FrameworkConceptGraph: () => null }))

const FILTERED = '/compliance?tab=landscape&q=tls&industry=Finance'

async function copyFromOverlay(shareName: RegExp, expectedPath: string, onClose: () => void) {
  const dialog = screen.getAllByRole('dialog').at(-1)!
  fireEvent.click(within(dialog).getByRole('button', { name: shareName }))
  const menu = screen.getByRole('menu')
  expect(dialog.contains(menu)).toBe(false)
  const copy = within(menu).getByRole('button', { name: /Copy link/ })
  fireEvent.pointerDown(copy)
  fireEvent.mouseDown(copy)
  fireEvent.mouseUp(copy)
  fireEvent.click(copy)
  await vi.waitFor(() =>
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}${expectedPath}`
    )
  )
  expect(onClose).not.toHaveBeenCalled()
  expect(dialog).toBeInTheDocument()
}

describe('Compliance overlays — Share in the header', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  const fw = complianceFrameworks[0]!

  it('ComplianceDetailDrawer shares /compliance?framework=<id>', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={[FILTERED]}>
        <ComplianceDetailDrawer framework={fw} pillar="comply" onClose={onClose} />
      </MemoryRouter>
    )
    await copyFromOverlay(/^Share /, `/compliance?framework=${encodeURIComponent(fw.id)}`, onClose)
  })

  it('FrameworkDetailPopover shares /compliance?framework=<id>', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={[FILTERED]}>
        <FrameworkDetailPopover isOpen framework={fw} onClose={onClose} />
      </MemoryRouter>
    )
    await copyFromOverlay(/^Share /, `/compliance?framework=${encodeURIComponent(fw.id)}`, onClose)
  })

  it('FrameworkConceptGraphModal shares its parent framework link', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={[FILTERED]}>
        <FrameworkConceptGraphModal
          isOpen
          onClose={onClose}
          centerConceptId="guidance:cnsa-2"
          title="CNSA 2.0"
          frameworkId="CNSA 2"
        />
      </MemoryRouter>
    )
    await copyFromOverlay(/^Share CNSA 2\.0/, '/compliance?framework=CNSA%202', onClose)
  })

  it('ComplianceDetailPopover shares /compliance?cert=<id>, surviving its outside-click handler', async () => {
    const onClose = vi.fn()
    const record = {
      id: 'A 8273',
      source: 'NIST',
      type: 'FIPS 140-3',
      status: 'Active',
      date: '2024-09-24',
      link: '',
      pqcCoverage: '',
      productName: 'Test Module',
      productCategory: 'Other',
      vendor: 'Acme',
      certificationLevel: '',
    } as unknown as ComplianceRecord
    render(
      <MemoryRouter initialEntries={['/compliance?tab=records&status=Active&cert=A%208273']}>
        <ComplianceDetailPopover isOpen onClose={onClose} record={record} />
      </MemoryRouter>
    )
    await copyFromOverlay(/^Share Test Module/, '/compliance?cert=A%208273', onClose)
  })
})
