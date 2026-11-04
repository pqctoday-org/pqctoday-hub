// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Pkcs11Error } from '@/wasm/softhsm'
import { HpkeWorkshop } from './HpkeWorkshop'
const sample = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_extractKeyValue: sample.read,
}))
vi.mock('../services/hpkeService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/hpkeService')>()),
  hybridEncap: () => ({ sharedSecretHandle: 9, enc: new Uint8Array([1, 2, 3]) }),
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    addStepLog: vi.fn(),
    clearLog: vi.fn(),
    clearKeys: vi.fn(),
    keys: [],
    log: [],
  }),
}))
// Start directly at the audited probe. The actual wizard execute/error/completion
// logic is retained; crypto setup is stubbed, not conformance evidence.
vi.mock(
  '@/components/PKILearning/modules/DigitalAssets/hooks/useStepWizard',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/components/PKILearning/modules/DigitalAssets/hooks/useStepWizard')
      >()
    return {
      useStepWizard: (props: Parameters<typeof actual.useStepWizard>[0]) =>
        actual.useStepWizard({ ...props, initialStep: 2 }),
    }
  }
)
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  vi.clearAllMocks()
})
describe('HPKE probe controls dependent wizard steps', () => {
  it('allows Next for the measured expected refusal', async () => {
    sample.read.mockImplementation(() => {
      throw new Pkcs11Error(0x11, 'C_GetAttributeValue(len)')
    })
    render(<HpkeWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: 'Encapsulate' }))
    expect(await screen.findByText(/Sample plaintext-read refusal observed:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next Step' })).toBeEnabled()
  })
  it('keeps a session error incomplete and does not unlock Next', async () => {
    sample.read.mockImplementation(() => {
      throw new Pkcs11Error(0xb3, 'C_GetAttributeValue(len)')
    })
    render(<HpkeWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: 'Encapsulate' }))
    expect(
      (await screen.findAllByText(/Protected-key read check incomplete:/)).length
    ).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip to next step' })).toBeDisabled()
    expect(screen.queryByText(/Sample plaintext-read refusal observed:/)).not.toBeInTheDocument()
  })
  it('keeps an unexpectedly readable key failed and does not unlock Next', async () => {
    sample.read.mockReturnValue(new Uint8Array(32))
    render(<HpkeWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: 'Encapsulate' }))
    expect(
      (await screen.findAllByText(/reading CKA_VALUE unexpectedly succeeded/)).length
    ).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip to next step' })).toBeDisabled()
  })
})
