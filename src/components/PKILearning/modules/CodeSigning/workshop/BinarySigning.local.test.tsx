// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BinarySigning } from './BinarySigning'
const sample = vi.hoisted(() => ({
  ready: false,
  verify: vi.fn(),
  sign: vi.fn(),
  generate: vi.fn(),
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: sample.ready,
    engine: 'rust',
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    registerKey: vi.fn(),
    clearLog: vi.fn(),
    clearKeys: vi.fn(),
    keys: [],
    log: [],
  }),
}))
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateMLDSAKeyPair: sample.generate,
  hsm_extractKeyValue: () => new Uint8Array([1, 2]),
  hsm_digest: () => new Uint8Array(32),
  hsm_sign: sample.sign,
  hsm_verify: sample.verify,
  CKM_SHA256: 0x250,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  vi.clearAllMocks()
  sample.ready = false
  sample.generate.mockReturnValue({ pubHandle: 1, privHandle: 2 })
  sample.sign.mockReturnValue(new Uint8Array([3, 4]))
  sample.verify.mockReturnValue(true)
})
const generateLive = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Generate (Live WASM)' }))
const signLive = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Sign and check sample' }))

describe('Binary Signing separates walkthroughs from executed sample checks', () => {
  it('labels placeholder bytes and walkthrough completion without a cryptographic pass', async () => {
    render(<BinarySigning />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Keypair' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Show example signing output' }))
    expect(await screen.findByText('Signing walkthrough completed')).toBeInTheDocument()
    expect(screen.getByText('No cryptographic signature check was executed.')).toBeInTheDocument()
    expect(screen.getByText('Illustrative digest — placeholder')).toBeInTheDocument()
    expect(screen.queryByText('Sample signature check passed')).not.toBeInTheDocument()
    expect(sample.verify).not.toHaveBeenCalled()
    expect(sample.sign).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Data to sign'), { target: { value: 'Changed sample' } })
    expect(screen.queryByText('Signing walkthrough completed')).not.toBeInTheDocument()
  })
  it('shows live success only after verification, clears it on edits and keeps false distinct from errors', () => {
    sample.ready = true
    render(<BinarySigning />)
    generateLive()
    signLive()
    expect(screen.getByText('Sample signature check passed')).toBeInTheDocument()
    expect(sample.verify).toHaveBeenCalledWith(
      {},
      1,
      1,
      'Hello, Post-Quantum World!',
      new Uint8Array([3, 4])
    )
    fireEvent.change(screen.getByLabelText('Data to sign'), {
      target: { value: 'Another message' },
    })
    expect(screen.queryByText('Sample signature check passed')).not.toBeInTheDocument()
    sample.verify.mockReturnValue(false)
    signLive()
    expect(screen.getByText('Sample signature check did not pass')).toBeInTheDocument()
    expect(screen.queryByText('Sample signature check passed')).not.toBeInTheDocument()
    sample.verify.mockImplementation(() => {
      throw new Error('sample session unavailable')
    })
    signLive()
    expect(screen.getByRole('alert')).toHaveTextContent('Sample operation could not complete')
    expect(screen.getByRole('alert')).toHaveTextContent('sample session unavailable')
    expect(screen.queryByText('Sample signature check did not pass')).not.toBeInTheDocument()
    sample.verify.mockReturnValue(true)
    signLive()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Sample signature check passed')).toBeInTheDocument()
  })
  it('clears keys and results on mode/session changes instead of relabelling them', () => {
    sample.ready = true
    const view = render(<BinarySigning />)
    generateLive()
    signLive()
    sample.ready = false
    view.rerender(<BinarySigning />)
    expect(screen.queryByText('Sample signature check passed')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Data to sign')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Keypair' })).toBeInTheDocument()
  })
  it('discards a delayed illustrative key generation if live mode is enabled before it finishes', async () => {
    const view = render(<BinarySigning />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Keypair' }))
    sample.ready = true
    view.rerender(<BinarySigning />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 850))
    })
    expect(screen.queryByLabelText('Data to sign')).not.toBeInTheDocument()
    expect(screen.queryByText(/Example public-key display/)).not.toBeInTheDocument()
    generateLive()
    expect(screen.getByRole('button', { name: 'Sign and check sample' })).toBeInTheDocument()
  })
  it('shows key-generation errors and permits a retry without a successful result', () => {
    sample.ready = true
    sample.generate.mockImplementation(() => {
      throw new Error('sample key generation failed')
    })
    render(<BinarySigning />)
    generateLive()
    expect(screen.getByRole('alert')).toHaveTextContent('sample key generation failed')
    expect(screen.queryByLabelText('Data to sign')).not.toBeInTheDocument()
    sample.generate.mockReturnValue({ pubHandle: 1, privHandle: 2 })
    generateLive()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign and check sample' })).toBeEnabled()
  })
})
