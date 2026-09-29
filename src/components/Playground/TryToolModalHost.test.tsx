// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { TryToolModalHost } from './TryToolModalHost'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

vi.mock('./workshopRegistry', () => ({
  WORKSHOP_TOOLS: [
    { id: 'sab-tool', name: 'SAB Tool', category: 'Protocols', requires: ['sab'] },
    { id: 'plain-tool', name: 'Plain Tool', category: 'Protocols', requires: [] },
  ],
  ONBACK_COMPONENTS: {},
  TOOL_COMPONENTS: {
    'sab-tool': () => <div>sab tool body</div>,
    'plain-tool': () => <div>plain tool body</div>,
  },
}))

function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname}</output>
}

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <TryToolModalHost />
      <Where />
    </MemoryRouter>
  )
}

describe('TryToolModalHost — SharedArrayBuffer tools on a non-isolated page', () => {
  afterEach(() => {
    delete (window as { crossOriginIsolated?: boolean }).crossOriginIsolated
  })

  it('sends a SAB tool to its real route when the page is not cross-origin isolated', async () => {
    Object.defineProperty(window, 'crossOriginIsolated', { value: false, configurable: true })
    renderAt('/threats?try=sab-tool')
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('/playground/sab-tool')
    )
    expect(screen.queryByText('sab tool body')).not.toBeInTheDocument()
  })

  it('still opens a SAB tool in place on an isolated page, and a plain tool anywhere', async () => {
    Object.defineProperty(window, 'crossOriginIsolated', { value: true, configurable: true })
    renderAt('/threats?try=sab-tool')
    expect(await screen.findByText('sab tool body')).toBeInTheDocument()
  })

  it('opens a tool without SAB needs in place on a non-isolated page', async () => {
    Object.defineProperty(window, 'crossOriginIsolated', { value: false, configurable: true })
    renderAt('/threats?try=plain-tool')
    expect(await screen.findByText('plain tool body')).toBeInTheDocument()
  })
})

describe('TryToolModalHost — Share inside the modal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it("Copy link shares the tool's own page, not the host page, and leaves the modal open", async () => {
    renderAt('/threats?industry=Finance&try=plain-tool')
    await screen.findByText('plain tool body')
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Share Plain Tool/ }))
    const menu = screen.getByRole('menu')
    expect(dialog.contains(menu)).toBe(false)
    fireEvent.click(within(menu).getByRole('button', { name: /Copy link/ }))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/playground/plain-tool`
      )
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/threats')
  })
})

describe('TryToolModalHost — layer in the phone shell', () => {
  afterEach(() => mockUseIsMobileShell.mockReturnValue(false))

  it('uses the sheet layers (above the z-nav phone header) only in the mobile shell', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderAt('/threats?try=plain-tool')
    await screen.findByText('plain tool body')
    expect(screen.getByTestId('try-tool-modal-layer')).toHaveClass('z-dialog')
    expect(screen.getByTestId('try-tool-modal-layer')).not.toHaveClass('z-50')
  })

  it('keeps z-50 on desktop', async () => {
    renderAt('/threats?try=plain-tool')
    await screen.findByText('plain tool body')
    expect(screen.getByTestId('try-tool-modal-layer')).toHaveClass('z-50')
  })
})
