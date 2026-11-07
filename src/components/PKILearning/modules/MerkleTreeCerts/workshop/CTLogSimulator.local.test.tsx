// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CTLogSimulator } from './CTLogSimulator'
import { hsm_verifyBytes } from '@/wasm/softhsm'

const engine = vi.hoisted(() => ({ ready: false }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: engine.ready,
    moduleRef: { current: engine.ready ? {} : null },
    hSessionRef: { current: 1 },
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/wasm/softhsm', () => ({ hsm_verifyBytes: vi.fn() }))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  engine.ready = false
  vi.clearAllMocks()
})
describe('CT unsigned sample batches', () => {
  it('keeps a batch unsigned after the engine becomes ready, without a false audit pass', async () => {
    const view = render(<CTLogSimulator />)
    fireEvent.click(screen.getByRole('button', { name: 'Load 5 samples' }))
    expect(await screen.findByText(/Unsigned sample tree head/)).toBeInTheDocument()
    expect(screen.getByText('No CA signature created')).toBeInTheDocument()
    engine.ready = true
    view.rerender(<CTLogSimulator />)
    fireEvent.click(screen.getByRole('button', { name: '3. Misissuance Audit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Re-audit Batch' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'signature authentication is incomplete (unsigned)'
    )
    expect(screen.queryByText('Audit Passed')).not.toBeInTheDocument()
    expect(hsm_verifyBytes).not.toHaveBeenCalled()
  })
})
