// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LmsConfig } from './LmsConfig'
import { useOpenSSLStore } from '../../store'

const operations = vi.hoisted(() => ({ sign: vi.fn(), verify: vi.fn() }))
vi.mock('../../../../wasm/LmsService', () => ({ lmsService: operations }))
const originalAdd = useOpenSSLStore.getState().addFile
const pub = Uint8Array.from({ length: 64 }, (_, i) => i + 1)
const priv = Uint8Array.from({ length: 128 }, (_, i) => 255 - i)
const oid = [0x30, 0x0b, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x07, 0x02, 0x01]
// Fixed existing wrapper structure, independent of the component's encoder.
const armor = (label: string, bytes: number[]) =>
  `-----BEGIN ${label}-----\n${btoa(String.fromCharCode(...bytes))}\n-----END ${label}-----`
const pubPem = armor('PUBLIC KEY', [0x30, 80, ...oid, 0x03, 65, 0, ...pub])
const privPem = armor('PRIVATE KEY', [
  0x30,
  0x81,
  147,
  0x02,
  1,
  0,
  ...oid,
  0x04,
  0x81,
  128,
  ...priv,
])
const props = {
  setMode: vi.fn(),
  lmsKeyFile: 'sample.key',
  setLmsKeyFile: vi.fn(),
  lmsSigFile: 'sample.sig',
  setLmsSigFile: vi.fn(),
  lmsDataFile: 'sample.txt',
  setLmsDataFile: vi.fn(),
}
function put(name: string, content: string | Uint8Array) {
  originalAdd({
    name,
    content,
    type: typeof content === 'string' ? 'text' : 'binary',
    size: content.length,
    timestamp: 1,
  })
}
function show(mode: 'sign' | 'verify', key: string | Uint8Array) {
  const name = mode === 'sign' ? 'sample.key' : 'sample.pub'
  put(name, key)
  put('sample.txt', 'sample message')
  put('sample.sig', Uint8Array.of(7, 8, 9))
  render(
    <MemoryRouter>
      <LmsConfig {...props} mode={mode} lmsKeyFile={name} />
    </MemoryRouter>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  useOpenSSLStore.getState().resetStore()
  useOpenSSLStore.setState({ addFile: originalAdd })
  operations.sign.mockResolvedValue({ signature: Uint8Array.of(7, 8, 9), updatedPrivateKey: priv })
  operations.verify.mockResolvedValue(true)
})
afterEach(() => {
  act(() => useOpenSSLStore.getState().resetStore())
})

describe('Stored PEM text and UTF-8 bytes consume the same existing LMS key', () => {
  it.each(['text', 'utf8', 'raw'] as const)(
    'passes exact private bytes from %s to the existing signer',
    async (kind) => {
      show(
        'sign',
        kind === 'text' ? privPem : kind === 'utf8' ? new TextEncoder().encode(privPem) : priv
      )
      fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
      await waitFor(() => expect(operations.sign).toHaveBeenCalledTimes(1))
      expect(operations.sign.mock.calls[0][0]).toEqual(priv)
      expect(operations.sign.mock.calls[0][1]).toEqual(new TextEncoder().encode('sample message'))
      await waitFor(() => expect(props.setLmsSigFile).toHaveBeenCalledTimes(1))
    }
  )
  it.each(['text', 'utf8', 'raw'] as const)(
    'passes exact public bytes from %s to the existing verifier',
    async (kind) => {
      show(
        'verify',
        kind === 'text' ? pubPem : kind === 'utf8' ? new TextEncoder().encode(pubPem) : pub
      )
      fireEvent.click(screen.getByRole('button', { name: 'Verify (WASM)' }))
      await waitFor(() => expect(operations.verify).toHaveBeenCalledTimes(1))
      expect(operations.verify.mock.calls[0]).toEqual([
        pub,
        new TextEncoder().encode('sample message'),
        Uint8Array.of(7, 8, 9),
      ])
      await waitFor(() =>
        expect(
          useOpenSSLStore
            .getState()
            .logs.some((log) => log.message === 'SUCCESS: Signature is VALID!')
        ).toBe(true)
      )
    }
  )
  it.each(['text', 'utf8'] as const)(
    'does not send malformed %s PEM to the signer',
    async (kind) => {
      const bad = '-----BEGIN PRIVATE KEY-----\n%%%\n-----END PRIVATE KEY-----'
      show('sign', kind === 'text' ? bad : new TextEncoder().encode(bad))
      fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Sample signing did not complete')
      expect(operations.sign).not.toHaveBeenCalled()
      expect(props.setLmsSigFile).not.toHaveBeenCalled()
    }
  )
  it.each(['text', 'utf8'] as const)(
    'does not send malformed %s PEM to the verifier',
    async (kind) => {
      const bad = '-----BEGIN PUBLIC KEY-----\n%%%\n-----END PUBLIC KEY-----'
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        show('verify', kind === 'text' ? bad : new TextEncoder().encode(bad))
        fireEvent.click(screen.getByRole('button', { name: 'Verify (WASM)' }))
        await waitFor(() =>
          expect(
            useOpenSSLStore
              .getState()
              .logs.some((log) => log.message.startsWith('Verification failed:'))
          ).toBe(true)
        )
        expect(operations.verify).not.toHaveBeenCalled()
        expect(
          useOpenSSLStore
            .getState()
            .logs.some((log) => log.message === 'SUCCESS: Signature is VALID!')
        ).toBe(false)
      } finally {
        error.mockRestore()
      }
    }
  )
})
