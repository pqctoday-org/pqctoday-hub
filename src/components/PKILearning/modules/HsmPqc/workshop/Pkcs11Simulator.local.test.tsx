// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Pkcs11Simulator, runStep, type LiveState } from './Pkcs11Simulator'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const engine = vi.hoisted(() => ({
  verify: vi.fn(),
  extract: vi.fn(),
  decapsulate: vi.fn(),
  keygen: vi.fn(),
}))
vi.mock('@/wasm/softhsm', () => ({
  hsm_verify: engine.verify,
  hsm_extractKeyValue: engine.extract,
  hsm_decapsulate: engine.decapsulate,
  hsm_generateMLKEMKeyPair: engine.keygen,
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    clearKeys: vi.fn(),
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
const state = (): LiveState => ({
  mlKemPubHandle: 1,
  mlKemPrivHandle: 2,
  mlKemCiphertext: new Uint8Array([3]),
  mlKemSecretHandle: 4,
  mlDsaPubHandle: 5,
  mlDsaPrivHandle: 6,
  mlDsaSigBytes: new Uint8Array([7]),
  mlDsaMessage: 'sample',
  aesWrapHandle: 0,
})
const module = {} as SoftHSMModule
beforeEach(() => {
  vi.clearAllMocks()
  engine.verify.mockReturnValue(true)
  engine.extract.mockReturnValue(new Uint8Array(32).fill(1))
  engine.decapsulate.mockReturnValue(8)
  engine.keygen.mockReturnValue({ pubHandle: 1, privHandle: 2 })
})
describe('HSM workshop step outcome gates', () => {
  it('accepts matching secrets and successful verification', async () => {
    expect(await runStep(3, module, 1, state())).toContain('Secrets Match:        YES')
    expect(await runStep(5, module, 1, state())).toContain('Verification:    VALID')
  })
  it('rejects a wrong recovered secret and empty extracted values', async () => {
    engine.extract
      .mockReturnValueOnce(new Uint8Array(32).fill(1))
      .mockReturnValueOnce(new Uint8Array(32).fill(2))
    await expect(runStep(3, module, 1, state())).rejects.toThrow(/does not match/)
    engine.extract.mockReturnValue(new Uint8Array())
    await expect(runStep(3, module, 1, state())).rejects.toThrow(/32-byte/)
  })
  it('rejects an invalid signature and retains operational errors as errors', async () => {
    engine.verify.mockReturnValue(false)
    await expect(runStep(5, module, 1, state())).rejects.toThrow(/did not pass/)
    engine.verify.mockImplementation(() => {
      throw new Error('invalid sample key handle')
    })
    await expect(runStep(5, module, 1, state())).rejects.toThrow('invalid sample key handle')
  })
  it('shows a fresh failed step immediately and keeps Next blocked', async () => {
    engine.keygen.mockImplementation(() => {
      throw new Error('sample key-generation error')
    })
    render(
      <MemoryRouter>
        <Pkcs11Simulator />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('sample key-generation error')
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    expect(screen.getByText('0 / 8 completed')).toBeInTheDocument()
    engine.keygen.mockReturnValue({ pubHandle: 1, privHandle: 2 })
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('1 / 8 completed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
  })
})
