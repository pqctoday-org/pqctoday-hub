// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { TryToolModalHost } from './TryToolModalHost'

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
