// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { ProtocolDetailModal } from './ProtocolDetailModal'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const protocol = PROTOCOL_MATRIX[0]

describe('ProtocolDetailModal — Share inside the modal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('Copy link copies the clean protocol link; Esc closes only the menu', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/algorithms?tab=support&matrixQ=tls&protocol=x']}>
        <ProtocolDetailModal isOpen onClose={onClose} protocol={protocol} />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    const share = within(dialog).getByRole('button', {
      name: new RegExp(`^Share ${protocol.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    })
    fireEvent.click(share)
    const menu = screen.getByRole('menu')
    expect(dialog.contains(menu)).toBe(false)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(share)
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ }))
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/algorithms?tab=support&protocol=${encodeURIComponent(protocol.id)}`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('traps focus inside the open modal', async () => {
    render(
      <MemoryRouter>
        <Button type="button">outside</Button>
        <ProtocolDetailModal isOpen onClose={vi.fn()} protocol={protocol} />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    await vi.waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    screen.getByRole('button', { name: 'outside', hidden: true }).focus()
    await vi.waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })
})
