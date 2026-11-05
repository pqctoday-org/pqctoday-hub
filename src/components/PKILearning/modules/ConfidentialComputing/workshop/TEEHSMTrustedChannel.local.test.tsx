// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TEEHSMTrustedChannel } from './TEEHSMTrustedChannel'
import {
  hsm_verify,
  hsm_decapsulate,
  hsm_unwrapKeyMech,
  hsm_extractKeyValue,
  hsm_ecdsaVerify,
} from '@/wasm/softhsm'

vi.mock('@/components/PKILearning/common/HsmCapabilityEvidence', () => ({
  HsmCapabilityEvidence: () => null,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
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
  hsm_generateECKeyPair: vi.fn(() => ({ pubHandle: 11, privHandle: 12 })),
  hsm_ecdsaSign: vi.fn(() => new Uint8Array(64)),
  hsm_ecdsaVerify: vi.fn(() => true),
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

const runSample = (pqc = true) => {
  render(
    <MemoryRouter>
      <TEEHSMTrustedChannel />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Intel SGX + Thales Luna' }))
  if (pqc) fireEvent.click(screen.getByRole('button', { name: 'PQC' }))
  fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
}

const runPqc = () => runSample(true)

describe('TEE sample provisioning verification gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hsm_ecdsaVerify).mockReset().mockReturnValue(true)
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
    expect(screen.queryByText(/(?:Protocol|Sample sequence) complete/)).not.toBeInTheDocument()
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

describe('classical TEE verification gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hsm_ecdsaVerify).mockReset().mockReturnValue(true)
  })

  it('requires successful verification before classical unwrap', async () => {
    runSample(false)
    await waitFor(() => expect(hsm_unwrapKeyMech).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/Sample sequence complete \(classical\)/)).toBeInTheDocument()
  })

  it('blocks unwrap on an invalid classical attestation', async () => {
    vi.mocked(hsm_ecdsaVerify).mockReturnValue(false)
    runSample(false)
    await screen.findAllByText(
      /Sample ECDSA attestation signature verification failed; provisioning stopped/
    )
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
    expect(screen.queryByText(/(?:Protocol|Sample sequence) complete/)).not.toBeInTheDocument()
  })

  it('keeps an operational verification error incomplete', async () => {
    vi.mocked(hsm_ecdsaVerify).mockImplementation(() => {
      throw new Error('Injected verification operation error')
    })
    runSample(false)
    await screen.findAllByText(/Injected verification operation error/)
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
    expect(screen.queryByText(/(?:Protocol|Sample sequence) complete/)).not.toBeInTheDocument()
  })

  it('does not retain a successful result when a later attempt fails', async () => {
    runSample(false)
    await waitFor(() => expect(hsm_unwrapKeyMech).toHaveBeenCalledTimes(1))
    vi.mocked(hsm_ecdsaVerify).mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
    await screen.findAllByText(
      /Sample ECDSA attestation signature verification failed; provisioning stopped/
    )
    expect(hsm_unwrapKeyMech).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/(?:Protocol|Sample sequence) complete/)).not.toBeInTheDocument()
  })
})

describe('Architecture properties are not executed checks', () => {
  it('labels the example panel and its unexecuted vendor-chain and session-binding checks before any run', () => {
    vi.clearAllMocks()
    render(
      <MemoryRouter>
        <TEEHSMTrustedChannel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Intel SGX + Thales Luna' }))
    expect(screen.getByText('Attestation architecture considerations')).toBeInTheDocument()
    expect(
      screen.getByText(
        /These markers describe the selected architecture example, not checks executed/
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/does not validate a vendor hardware quote/)).toBeInTheDocument()
    expect(
      screen.getByText(/does not validate a vendor device certificate chain/)
    ).toBeInTheDocument()
    expect(screen.getByText(/does not execute a TLS channel-binding check/)).toBeInTheDocument()
    expect(hsm_ecdsaVerify).not.toHaveBeenCalled()
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
  })
})
