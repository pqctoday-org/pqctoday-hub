// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
const { execute } = vi.hoisted(() => ({ execute: vi.fn() }))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute } }))
import { SignatureDemo } from './SignatureDemo'
const key = { name: 'sign.key', data: new TextEncoder().encode('fictional test key') }
const signature = { name: 'signature.bin', data: new Uint8Array([255, 0, 127]) }
const result = (files: (typeof key)[] = [], error?: string) => ({
  stdout: '',
  stderr: '',
  files,
  error,
})
function pending() {
  let resolve!: (value: ReturnType<typeof result>) => void
  let reject!: (error: Error) => void
  const promise = new Promise<ReturnType<typeof result>>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function choose(label: string) {
  fireEvent.click(screen.getAllByRole('button', { name: 'Algorithm:' })[0])
  fireEvent.click(screen.getByRole('option', { name: label }))
}
describe('SignatureDemo current-input failures and sign-only recovery', () => {
  beforeEach(() => {
    execute.mockReset()
  })
  it.each([
    'key error',
    'missing key',
    'empty key',
    'key exception',
    'sign error',
    'missing signature',
    'empty signature',
    'sign exception',
  ])('rejects %s and permits a valid current-input retry', async (kind) => {
    if (kind === 'key error') execute.mockResolvedValueOnce(result([key], 'key failed'))
    else if (kind === 'missing key') execute.mockResolvedValueOnce(result())
    else if (kind === 'empty key')
      execute.mockResolvedValueOnce(result([{ ...key, data: new Uint8Array() }]))
    else if (kind === 'key exception')
      execute.mockRejectedValueOnce(new Error('key operation failed'))
    else {
      execute.mockResolvedValueOnce(result([key]))
      if (kind === 'sign exception')
        execute.mockRejectedValueOnce(new Error('sign operation failed'))
      else if (kind === 'sign error')
        execute.mockResolvedValueOnce(result([signature], 'sign failed'))
      else if (kind === 'empty signature')
        execute.mockResolvedValueOnce(result([{ ...signature, data: new Uint8Array() }]))
      else execute.mockResolvedValueOnce(result())
    }
    const complete = vi.fn()
    render(<SignatureDemo onComplete={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign with Ed25519' }))
    await screen.findByRole('alert')
    expect(complete).not.toHaveBeenCalled()
    expect(screen.queryByText('ff007f')).not.toBeInTheDocument()
    const callCount = execute.mock.calls.length
    execute.mockResolvedValueOnce(result([key])).mockResolvedValueOnce(result([signature]))
    fireEvent.click(screen.getByRole('button', { name: 'Sign with Ed25519' }))
    await screen.findByText('ff007f')
    expect(screen.getByText('3 bytes')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(complete).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls.at(callCount)?.[0]).toBe(
      'openssl genpkey -algorithm ED25519 -out sign.key'
    )
    expect(execute.mock.calls.at(callCount + 1)?.[0]).toBe(
      'openssl pkeyutl -sign -inkey sign.key -rawin -in message.txt -out signature.bin'
    )
    expect(execute.mock.calls.at(callCount + 1)?.[1]).toEqual([
      key,
      { name: 'message.txt', data: new TextEncoder().encode('Hello, PKI World!') },
    ])
    expect(execute.mock.calls.every(([cmd]) => !cmd.includes('-verify'))).toBe(true)
    expect(screen.getByRole('note')).toHaveTextContent('does not run verification')
  })
  it('ignores obsolete algorithm keygen, remains busy, then signs with the selected algorithm', async () => {
    const old = pending()
    execute.mockReturnValueOnce(old.promise)
    const complete = vi.fn()
    render(<SignatureDemo onComplete={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign with Ed25519' }))
    choose('ECDSA P-256')
    expect(screen.getByRole('button', { name: 'Sign with EC-P256' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Sign with EC-P256' }))
    expect(execute).toHaveBeenCalledTimes(1)
    await act(async () => {
      old.resolve(result([key]))
      await old.promise
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign with EC-P256' })).toBeEnabled()
    )
    expect(execute).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
    execute.mockResolvedValueOnce(result([key])).mockResolvedValueOnce(result([signature]))
    fireEvent.click(screen.getByRole('button', { name: 'Sign with EC-P256' }))
    await screen.findByText('ff007f')
    expect(execute.mock.calls[1][0]).toContain('ec_paramgen_curve:P-256')
    expect(complete).toHaveBeenCalledTimes(1)
    choose('Ed25519')
    expect(screen.queryByText('ff007f')).not.toBeInTheDocument()
  })
  it.each(['resolve', 'reject'] as const)(
    'does not attribute stale signing %s to an edited message and preserves exact retry UTF-8',
    async (outcome) => {
      const old = pending()
      execute.mockResolvedValueOnce(result([key])).mockReturnValueOnce(old.promise)
      const complete = vi.fn()
      render(<SignatureDemo onComplete={complete} />)
      fireEvent.click(screen.getByRole('button', { name: 'Sign with Ed25519' }))
      await waitFor(() => expect(execute).toHaveBeenCalledTimes(2))
      fireEvent.change(screen.getByRole('textbox', { name: 'Message to Sign' }), {
        target: { value: 'Sample café 🔑' },
      })
      expect(screen.getByRole('button', { name: 'Sign with Ed25519' })).toBeDisabled()
      await act(async () => {
        if (outcome === 'resolve') old.resolve(result([signature]))
        else old.reject(new Error('obsolete sign error'))
        await old.promise.catch(() => {})
      })
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Sign with Ed25519' })).toBeEnabled()
      )
      expect(screen.queryByText('ff007f')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(complete).not.toHaveBeenCalled()
      execute.mockResolvedValueOnce(result([key])).mockResolvedValueOnce(result([signature]))
      fireEvent.click(screen.getByRole('button', { name: 'Sign with Ed25519' }))
      await screen.findByText('ff007f')
      expect(execute.mock.calls[3][1]).toEqual([
        key,
        { name: 'message.txt', data: new TextEncoder().encode('Sample café 🔑') },
      ])
      expect(complete).toHaveBeenCalledTimes(1)
      fireEvent.change(screen.getByRole('textbox', { name: 'Message to Sign' }), {
        target: { value: 'Changed after run' },
      })
      expect(screen.queryByText('ff007f')).not.toBeInTheDocument()
    }
  )
  it('keeps PQC variant identity separate while old signing settles', async () => {
    const old = pending()
    execute.mockResolvedValueOnce(result([key])).mockReturnValueOnce(old.promise)
    const complete = vi.fn()
    render(<SignatureDemo onComplete={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign with ML-DSA-65' }))
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getAllByRole('button', { name: 'Algorithm:' })[1])
    fireEvent.click(screen.getByRole('option', { name: 'ML-DSA-44 (FIPS 204)' }))
    expect(screen.getByRole('button', { name: 'Sign with ML-DSA-44' })).toBeDisabled()
    await act(async () => {
      old.resolve(result([signature]))
      await old.promise
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign with ML-DSA-44' })).toBeEnabled()
    )
    expect(screen.queryByText('ff007f')).not.toBeInTheDocument()
    expect(complete).not.toHaveBeenCalled()
    execute.mockResolvedValueOnce(result([key])).mockResolvedValueOnce(result([signature]))
    fireEvent.click(screen.getByRole('button', { name: 'Sign with ML-DSA-44' }))
    await screen.findByText('ff007f')
    expect(execute.mock.calls[2][0]).toBe('openssl genpkey -algorithm ML-DSA-44 -out sign.key')
    expect(execute.mock.calls[3][0]).toBe(
      'openssl pkeyutl -sign -inkey sign.key -in message.txt -out signature.bin'
    )
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('credits two successful sign-only samples once without adding verification', async () => {
    execute.mockImplementation(async (cmd: string) =>
      result([cmd.includes('-sign -inkey') ? signature : key])
    )
    const complete = vi.fn()
    render(<SignatureDemo onComplete={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign with Both & Compare' }))
    await screen.findByRole('heading', { name: 'Signature Size Comparison' })
    expect(complete).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(4)
  })
})
