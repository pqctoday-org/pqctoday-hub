// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TEEHSMTrustedChannel } from './TEEHSMTrustedChannel'
import { hsm_verify, hsm_decapsulate, hsm_unwrapKeyMech, hsm_extractKeyValue } from '@/wasm/softhsm'

vi.mock('@/components/PKILearning/common/HsmCapabilityEvidence', () => ({
  HsmCapabilityEvidence: () => null,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
vi.mock('@/utils/cryptoErrorHint', () => ({ translateCryptoError: (message: string) => message }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    clearLog: vi.fn(),
    clearKeys: vi.fn(),
    registerKey: vi.fn(),
    keys: [],
    hsmLog: [],
  }),
}))
vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_generateMLDSAKeyPair: vi.fn(() => ({ pubHandle: 1, privHandle: 2 })),
  hsm_generateMLKEMKeyPair: vi.fn(() => ({ pubHandle: 3, privHandle: 4 })),
  hsm_generateAESKey: vi.fn(() => 5),
  hsm_extractKeyValue: vi.fn(() => new Uint8Array(32).fill(1)),
  hsm_encapsulate: vi.fn(() => ({ ciphertextBytes: new Uint8Array(1088), secretHandle: 6 })),
  hsm_importGenericSecret: vi.fn(() => 7),
  hsm_hkdf: vi.fn(() => new Uint8Array(32)),
  hsm_importAESKey: vi.fn(() => 8),
  hsm_aesWrapKey: vi.fn(() => new Uint8Array(40)),
  hsm_sign: vi.fn(() => new Uint8Array(3309)),
  hsm_verify: vi.fn(() => true),
  hsm_decapsulate: vi.fn(() => 9),
  hsm_unwrapKeyMech: vi.fn(() => 10),
}))

const runPqc = () => {
  render(
    <MemoryRouter>
      <TEEHSMTrustedChannel />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Intel SGX + Thales Luna' }))
  fireEvent.click(screen.getByRole('button', { name: 'PQC' }))
  fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
}

describe('TEE sample provisioning verification gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hsm_verify).mockReturnValue(true)
    vi.mocked(hsm_extractKeyValue).mockReturnValue(new Uint8Array(32).fill(1))
  })

  it('stops before receiver decapsulation and unwrap when attestation fails', async () => {
    vi.mocked(hsm_verify).mockReturnValue(false)
    runPqc()
    await screen.findAllByText(
      /Sample attestation signature verification failed; provisioning stopped\./
    )
    expect(hsm_decapsulate).not.toHaveBeenCalled()
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
    expect(screen.queryByText(/Protocol complete/)).not.toBeInTheDocument()
  })

  it('stops before unwrap when recovered secrets differ, including unequal lengths', async () => {
    vi.mocked(hsm_extractKeyValue).mockImplementation((_m, _s, handle) =>
      handle === 9 ? new Uint8Array(0) : new Uint8Array(32).fill(1)
    )
    runPqc()
    await screen.findAllByText(/Recovered sample secret does not match; key unwrap stopped\./)
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
  })

  it('allows unwrap after both checks succeed', async () => {
    runPqc()
    await waitFor(() => expect(hsm_unwrapKeyMech).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/Protocol complete/)).toBeInTheDocument()
  })
})
