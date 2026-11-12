// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { webcrypto } from 'node:crypto'
import { ProtocolIntegrationDemo } from './ProtocolIntegrationDemo'
import * as reference from './sshExchangeHashSample'
const oldCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => Object.defineProperty(window, 'crypto', { configurable: true, value: webcrypto }))
afterEach(() => {
  vi.restoreAllMocks()
  if (oldCrypto) Object.defineProperty(window, 'crypto', oldCrypto)
})
const run = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Run Complete SSH Exchange-Hash Sample' }))
const hash = () => screen.getByLabelText('Current SSH exchange hash').textContent
const session = () => screen.getByLabelText('First SSH session identifier').textContent

describe('actual complete SSH exchange-hash sample UI', () => {
  it('executes all eight fields and real host signature; changed identification rejects and restoration verifies', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ssh" />)
    run()
    await screen.findByText('Host signature VALID for this complete transcript')
    for (const field of ['V_C', 'V_S', 'I_C', 'I_S', 'K_S', 'Q_C', 'Q_S', 'K'])
      expect(
        screen.getByText((text) => text.startsWith(`${field}: `) && text.includes('encoded bytes'))
      ).toBeInTheDocument()
    expect(
      screen.getByText(/K: \d+ encoded bytes \(canonical positive mpint\)/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Cookies are inside KEXINIT/)).toBeInTheDocument()
    expect(screen.getByText(/does not consume a QKD key/)).toBeInTheDocument()
    const firstHash = hash(),
      firstSession = session()
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/)
    expect(firstSession).toBe(firstHash)
    fireEvent.click(screen.getByRole('button', { name: 'Change Client Identification' }))
    expect(
      await screen.findByText('Host signature REJECTED for the changed transcript')
    ).toBeInTheDocument()
    expect(hash()).not.toBe(firstHash)
    expect(session()).toBe(firstSession)
    fireEvent.click(screen.getByRole('button', { name: 'Restore Original Transcript' }))
    expect(
      await screen.findByText('Host signature VALID for this complete transcript')
    ).toBeInTheDocument()
    expect(hash()).toBe(firstHash)
    expect(screen.queryByText(/Local HKDF output|SSH session-id/)).not.toBeInTheDocument()
  })
  it('rekeys with fresh local values and valid signature while preserving first H', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ssh" />)
    run()
    await screen.findByText('Host signature VALID for this complete transcript')
    const firstHash = hash(),
      firstSession = session()
    fireEvent.click(screen.getByRole('button', { name: 'Rekey Local Sample' }))
    await screen.findByText('Host signature VALID for this complete transcript')
    expect(hash()).not.toBe(firstHash)
    expect(session()).toBe(firstSession)
  })
  it('clears stale output on operational failure and permits a genuine retry', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ssh" />)
    run()
    await screen.findByText('Host signature VALID for this complete transcript')
    const fail = vi.spyOn(reference, 'createSshExchangeSample').mockImplementationOnce(() => {
      throw new Error('local sample entropy unavailable')
    })
    run()
    expect(await screen.findByRole('alert')).toHaveTextContent('local sample entropy unavailable')
    expect(screen.queryByLabelText('Current SSH exchange hash')).not.toBeInTheDocument()
    fail.mockRestore()
    run()
    await screen.findByText('Host signature VALID for this complete transcript')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
