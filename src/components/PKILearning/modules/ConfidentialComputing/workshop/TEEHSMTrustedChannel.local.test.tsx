// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TEEHSMTrustedChannel } from './TEEHSMTrustedChannel'
import { MEMORY_ENCRYPTION_ENGINES } from '../data/attestationData'
import {
  hsm_verify,
  hsm_decapsulate,
  hsm_unwrapKeyMech,
  hsm_extractKeyValue,
  hsm_ecdsaVerify,
  hsm_sign,
  hsm_encapsulate,
  hsm_generateMLKEMKeyPair,
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

// Pick which key handle is the ML-KEM public key (handle 3), a second ML-KEM key (31) or any other.
const kemPub = (fill: number) => new Uint8Array(1184).fill(fill)
const extractDefault = (_m: unknown, _s: unknown, handle: number) =>
  handle === 3 ? kemPub(1) : handle === 31 ? kemPub(2) : new Uint8Array(32).fill(1)

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
    vi.mocked(hsm_verify).mockReset().mockReturnValue(true)
    vi.mocked(hsm_extractKeyValue)
      .mockReset()
      .mockImplementation(extractDefault as never)
    vi.mocked(hsm_sign).mockReset().mockReturnValue(new Uint8Array(3309))
    vi.mocked(hsm_encapsulate)
      .mockReset()
      .mockReturnValue({ ciphertextBytes: new Uint8Array(1088), secretHandle: 6 })
    vi.mocked(hsm_generateMLKEMKeyPair).mockReset().mockReturnValue({ pubHandle: 3, privHandle: 4 })
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
    vi.mocked(hsm_extractKeyValue).mockImplementation(((m: unknown, s: unknown, handle: number) =>
      handle === 9 ? new Uint8Array(0) : extractDefault(m, s, handle)) as never)
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

describe('channel statement and binding checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hsm_verify).mockReset().mockReturnValue(true)
    vi.mocked(hsm_sign).mockReset().mockReturnValue(new Uint8Array(3309))
    vi.mocked(hsm_extractKeyValue)
      .mockReset()
      .mockImplementation(extractDefault as never)
    vi.mocked(hsm_generateMLKEMKeyPair).mockReset().mockReturnValue({ pubHandle: 3, privHandle: 4 })
    vi.mocked(hsm_encapsulate)
      .mockReset()
      .mockReturnValue({ ciphertextBytes: new Uint8Array(1088), secretHandle: 6 })
  })
  const chooseFault = (label: RegExp) => {
    render(
      <MemoryRouter>
        <TEEHSMTrustedChannel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Intel SGX + Thales Luna' }))
    fireEvent.click(screen.getByRole('button', { name: 'PQC' }))
    fireEvent.click(screen.getByLabelText(label))
    fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
  }

  it('signs report_data and the ciphertext digest, not the ciphertext length or a handle', async () => {
    runPqc()
    await waitFor(() => expect(hsm_unwrapKeyMech).toHaveBeenCalledTimes(1))
    const signed = vi.mocked(hsm_sign).mock.calls[0][3]
    expect(signed).toMatch(
      /^tee-hsm-channel-v1\|report_data=[0-9a-f]{128}\|ct_sha256=[0-9a-f]{64}$/
    )
    expect(signed).not.toMatch(/ks-handle|kem-ct=/)
    expect(vi.mocked(hsm_verify).mock.calls[0][3]).toBe(signed)
  })

  it('labels the binding as simulated on the page', async () => {
    runPqc()
    await waitFor(() => expect(hsm_unwrapKeyMech).toHaveBeenCalledTimes(1))
    expect(
      (await screen.findAllByText(/simulated: a recorded report cannot carry this page's key/))
        .length
    ).toBeGreaterThan(0)
  })

  it('stops before decapsulation when the receiver gets a different ciphertext of the same length', async () => {
    const other = new Uint8Array(1088).fill(5)
    vi.mocked(hsm_encapsulate)
      .mockReset()
      .mockReturnValueOnce({ ciphertextBytes: new Uint8Array(1088), secretHandle: 6 })
      .mockReturnValueOnce({ ciphertextBytes: other, secretHandle: 16 })
    chooseFault(/different ciphertext of the same length/)
    await screen.findAllByText(
      /Channel binding failed \(ciphertext-binding\); provisioning stopped\./
    )
    expect(hsm_decapsulate).not.toHaveBeenCalled()
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
  })

  it('stops before decapsulation when the statement names a different recipient key', async () => {
    vi.mocked(hsm_generateMLKEMKeyPair)
      .mockReset()
      .mockReturnValueOnce({ pubHandle: 3, privHandle: 4 })
      .mockReturnValueOnce({ pubHandle: 31, privHandle: 32 })
    chooseFault(/different recipient ML-KEM key/)
    await screen.findAllByText(/Channel binding failed \(key-binding\); provisioning stopped\./)
    expect(hsm_decapsulate).not.toHaveBeenCalled()
    expect(hsm_unwrapKeyMech).not.toHaveBeenCalled()
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

describe('sealing key size and memory engine wording', () => {
  it('does not state a sealing key size the platform does not fix', () => {
    render(
      <MemoryRouter>
        <TEEHSMTrustedChannel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Intel SGX + Thales Luna' }))
    const next = screen.getByRole('button', { name: /Next/ })
    while (!(next as HTMLButtonElement).disabled) fireEvent.click(next)
    expect(
      screen.getByText('AES-GCM sealing (hardware-derived key; key size per platform)')
    ).toBeVisible()
    expect(screen.queryByText(/AES-256-GCM sealing/)).toBeNull()
    expect(screen.getByText(/sgx_get_key returns a 128-bit key/)).toBeVisible()
    expect(screen.queryByText(/next-gen CPUs will require AES-256/)).toBeNull()
  })

  it('frames the 128-bit key as a model margin, not a demonstrated break', () => {
    render(
      <MemoryRouter>
        <TEEHSMTrustedChannel />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/This lesson.s sample uses a 128-bit key \(NIST Category 1\)/)
    ).toHaveTextContent('about 2^64 iterations, a thinner model margin than AES-256')
    expect(screen.queryByText(/halves to 64-bit effective post-quantum security/)).toBeNull()
  })

  it('does not call an engine with no documented AES key quantum safe', () => {
    render(
      <MemoryRouter>
        <TEEHSMTrustedChannel />
      </MemoryRouter>
    )
    const noneEngines = MEMORY_ENCRYPTION_ENGINES.filter((e) => e.quantumImpact === 'none')
    expect(noneEngines.length).toBeGreaterThan(0)
    expect(screen.getAllByText('No AES key documented')).toHaveLength(noneEngines.length)
    expect(screen.getAllByText(/key size not documented/)).toHaveLength(noneEngines.length)
    expect(screen.queryByText('Quantum Safe')).toBeNull()
  })
})
