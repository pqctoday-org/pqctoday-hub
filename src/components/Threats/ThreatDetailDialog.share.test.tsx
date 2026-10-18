// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ThreatItem } from '@/data/threatsData'
import { ThreatDetailDialog } from './ThreatDetailDialog'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const threat: ThreatItem = {
  industry: 'Finance & Banking',
  threatId: 'FIN 001',
  description: 'A test threat.',
  criticality: 'High',
  cryptoAtRisk: 'TLS',
  pqcReplacement: 'ML-KEM-768',
  mainSource: 'Test Source',
  sourceUrl: '',
  relatedModules: [],
  threatClass: 'hndl',
}

describe('ThreatDetailDialog — Share inside the focus-locked dialog', () => {
  it('Copy link copies the clean threat link and leaves the dialog open', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    const onClose = vi.fn()
    // Rendered on a filtered URL: the shared link must NOT carry these params.
    render(
      <MemoryRouter initialEntries={['/threats?industry=Finance&q=tls&id=FIN%20001']}>
        <ThreatDetailDialog threat={threat} onClose={onClose} />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Share FIN 001/ }))

    const menu = screen.getByRole('menu')
    expect(dialog.contains(menu)).toBe(false)
    const copy = within(menu).getByRole('button', { name: /Copy link/ })
    // Full pointer sequence, as a real click would deliver it.
    await user.click(copy)

    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/threats?id=FIN%20001`)
    )
    expect(onClose).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('Escape with the menu open closes only the menu', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <ThreatDetailDialog threat={threat} onClose={onClose} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /^Share FIN 001/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
