// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  getSoftHSMRustModule,
  hsm_finalize,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_sign,
  hsm_verify,
  hsm_generateMLDSAKeyPair,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { BinarySigning } from './BinarySigning'
const live = vi.hoisted(() => ({
  module: null as unknown,
  session: 0,
  keys: [] as { handle: number; role: string }[],
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    engine: 'rust',
    moduleRef: { current: live.module },
    hSessionRef: { current: live.session },
    registerKey: (_module: unknown, _session: number, key: { handle: number; role: string }) =>
      live.keys.push(key),
    clearLog: vi.fn(),
    clearKeys: vi.fn(),
    keys: [],
    log: [],
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeAll(async () => {
  const engine = (await getSoftHSMRustModule()) as SoftHSMModule
  live.module = engine
  hsm_finalize(engine, 0)
  hsm_initialize(engine)
  const slot = hsm_initToken(engine, hsm_getFirstSlot(engine), '12345678', 'BinarySigningChecks')
  live.session = hsm_openUserSession(engine, slot, '12345678', 'user1234')
}, 30_000)
afterAll(() => {
  if (live.module) hsm_finalize(live.module as SoftHSMModule, live.session)
})
describe('Binary Signing live sample uses the existing Rust engine', () => {
  it('shows success for the sample and rejects altered messages or unrelated verification keys', async () => {
    render(<BinarySigning />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate (Live WASM)' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sign and check sample' }))
    expect(await screen.findByText('Sample signature check passed')).toBeInTheDocument()
    const engine = live.module as SoftHSMModule
    const publicKey = live.keys.find((key) => key.role === 'public')!.handle
    const privateKey = live.keys.find((key) => key.role === 'private')!.handle
    const message = 'Hello, Post-Quantum World!'
    // Additional engine negatives use the same generated keys. Component false/error
    // presentation is covered separately with injected operation outcomes.
    const signature = hsm_sign(engine, live.session, privateKey, message)
    expect(hsm_verify(engine, live.session, publicKey, message, signature)).toBe(true)
    expect(hsm_verify(engine, live.session, publicKey, message + ' altered', signature)).toBe(false)
    const unrelated = hsm_generateMLDSAKeyPair(engine, live.session, 65)
    expect(hsm_verify(engine, live.session, unrelated.pubHandle, message, signature)).toBe(false)
  })
})
