// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
const { execute } = vi.hoisted(() => ({ execute: vi.fn() }))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute } }))
import { KeyGenWorkshop } from './KeyGenWorkshop'
const file = (name: string, body: string) => ({ name, data: new TextEncoder().encode(body) })
const priv = file('private.key', '-----BEGIN PRIVATE KEY-----\nAQ==\n-----END PRIVATE KEY-----')
const pub = file('public.key', '-----BEGIN PUBLIC KEY-----\nAQI=\n-----END PUBLIC KEY-----')
const result = (files: (typeof priv)[] = [], error?: string) => ({
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
describe('KeyGen exact decoded-container counts and run identity', () => {
  beforeEach(() => {
    execute.mockReset()
  })
  it('counts one/two padding bytes exactly and distinguishes measured containers', async () => {
    execute.mockImplementation(async (cmd: string) =>
      result([cmd.includes('-pubout') ? pub : priv])
    )
    const complete = vi.fn()
    render(<KeyGenWorkshop onComplete={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Both & Compare' }))
    await waitFor(() => expect(screen.getAllByText('1 bytes')).toHaveLength(2))
    expect(screen.getAllByText('2 bytes')).toHaveLength(2)
    expect(
      screen.getByRole('heading', { name: 'Decoded Key Container Size Comparison' })
    ).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('not raw algorithm key-size references')
    expect(complete).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(4)
  })
  it.each(['resolve', 'reject'] as const)(
    'keeps the lane busy after A→B until old keygen %s settles, then retries current B',
    async (outcome) => {
      const old = pending()
      execute.mockReturnValueOnce(old.promise)
      const complete = vi.fn()
      render(<KeyGenWorkshop onComplete={complete} />)
      fireEvent.click(screen.getByRole('button', { name: 'Generate Ed25519' }))
      choose('ECDSA P-256')
      const current = screen.getByRole('button', { name: 'Generate EC-P256' })
      expect(current).toBeDisabled()
      fireEvent.click(current)
      expect(execute).toHaveBeenCalledTimes(1)
      await act(async () => {
        if (outcome === 'resolve') old.resolve(result([priv]))
        else old.reject(new Error('obsolete error'))
        await old.promise.catch(() => {})
      })
      await waitFor(() => expect(current).toBeEnabled())
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(complete).not.toHaveBeenCalled()
      expect(screen.queryByText('1 bytes')).not.toBeInTheDocument()
      expect(execute).toHaveBeenCalledTimes(1)
      execute.mockResolvedValueOnce(result([priv])).mockResolvedValueOnce(result([pub]))
      fireEvent.click(current)
      await screen.findByText('1 bytes')
      expect(screen.getByText('2 bytes')).toBeInTheDocument()
      expect(execute.mock.calls[1][0]).toContain('ec_paramgen_curve:P-256')
      expect(execute.mock.calls[2][1]).toEqual([priv])
      expect(complete).toHaveBeenCalledTimes(1)
      choose('Ed25519')
      expect(screen.queryByText('1 bytes')).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Selection changed—run again')
    }
  )
  it('discards a late public-key extraction after selection change, then permits a current retry', async () => {
    const old = pending()
    execute.mockResolvedValueOnce(result([priv])).mockReturnValueOnce(old.promise)
    const complete = vi.fn()
    render(<KeyGenWorkshop onComplete={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Ed25519' }))
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2))
    choose('ECDSA P-256')
    expect(screen.getByRole('button', { name: 'Generate EC-P256' })).toBeDisabled()
    await act(async () => {
      old.resolve(result([pub]))
      await old.promise
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Generate EC-P256' })).toBeEnabled()
    )
    expect(screen.queryByText('1 bytes')).not.toBeInTheDocument()
    expect(complete).not.toHaveBeenCalled()
    execute.mockResolvedValueOnce(result([priv])).mockResolvedValueOnce(result([pub]))
    fireEvent.click(screen.getByRole('button', { name: 'Generate EC-P256' }))
    await screen.findByText('2 bytes')
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it.each(['missing private', 'missing public', 'public error', 'invalid base64'])(
    'leaves %s incomplete with visible recovery',
    async (kind) => {
      if (kind === 'missing private') execute.mockResolvedValueOnce(result())
      else if (kind === 'invalid base64')
        execute.mockResolvedValueOnce(
          result([file('private.key', '-----BEGIN PRIVATE KEY-----\n?\n-----END PRIVATE KEY-----')])
        )
      else
        execute
          .mockResolvedValueOnce(result([priv]))
          .mockResolvedValueOnce(
            kind === 'public error' ? result([pub], 'public extraction failed') : result()
          )
      const complete = vi.fn()
      render(<KeyGenWorkshop onComplete={complete} />)
      fireEvent.click(screen.getByRole('button', { name: 'Generate Ed25519' }))
      await screen.findByRole('alert')
      expect(complete).not.toHaveBeenCalled()
      expect(screen.queryByText('1 bytes')).not.toBeInTheDocument()
      execute.mockResolvedValueOnce(result([priv])).mockResolvedValueOnce(result([pub]))
      fireEvent.click(screen.getByRole('button', { name: 'Generate Ed25519' }))
      await screen.findByText('2 bytes')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(complete).toHaveBeenCalledTimes(1)
    }
  )
})
