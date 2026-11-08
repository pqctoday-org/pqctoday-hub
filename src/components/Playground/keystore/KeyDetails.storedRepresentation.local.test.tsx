// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KeyDetails } from './KeyDetails'
import type { Key } from '@/types'
vi.mock('framer-motion', async () => (await import('@/test/mocks/framer-motion')).framerMotionMock)
const writeText = vi.fn()
const key = (id: string, bytes: Uint8Array, type: Key['type'] = 'private'): Key => ({
  id,
  name: id,
  algorithm: 'ML-DSA-65',
  type,
  value: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''),
  data: bytes,
  dataType: 'binary',
  timestamp: 1,
})
const pane = () => screen.getByRole('textbox', { name: 'Stored-byte representation' })
describe('KeyDetails stored-byte educational views', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  })
  it.each(['public', 'private'] as const)(
    'preserves 00/FF bytes without inventing a %s container',
    async (type) => {
      const original = new Uint8Array([0, 255, 1])
      render(<KeyDetails selectedKey={key('sample', original, type)} />)
      expect(pane()).toHaveValue('00ff01')
      expect(screen.getByRole('note')).toHaveTextContent('not a PKCS#8/SPKI encoder')
      fireEvent.click(screen.getByRole('button', { name: 'Base64' }))
      expect(pane()).toHaveValue('AP8B')
      fireEvent.click(screen.getAllByTitle('Copy to clipboard')[1])
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
      const copied = writeText.mock.calls[0][0] as string
      expect(copied).toContain('no PKCS#8/SPKI encoding')
      expect(copied).not.toMatch(/-----BEGIN (PRIVATE|PUBLIC) KEY-----/)
      const body = copied
        .split('\n')
        .filter((line) => line && !line.startsWith('#'))
        .join('')
      expect(Array.from(atob(body), (c) => c.charCodeAt(0))).toEqual(Array.from(original))
      expect(Array.from(original)).toEqual([0, 255, 1])
    }
  )
  it('views existing Ed448 PEM-file bytes as stored bytes, without nested invented armor', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nAQI=\n-----END PUBLIC KEY-----\n'
    const original = new TextEncoder().encode(pem)
    render(
      <KeyDetails selectedKey={{ ...key('ed-file', original, 'public'), algorithm: 'Ed448' }} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Base64' }))
    const body = (pane() as HTMLTextAreaElement).value
    expect(new TextDecoder().decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0)))).toBe(pem)
    expect(body).not.toContain('BEGIN')
    expect(screen.queryByText('PKCS#8 Preview')).not.toBeInTheDocument()
  })
  it.each(['public', 'private'] as const)(
    'uses the retained exported hex of a %s CryptoKey without creating a new format',
    (type) => {
      render(
        <KeyDetails
          selectedKey={{
            ...key('browser-export', new Uint8Array()),
            type,
            data: {} as CryptoKey,
            dataType: 'cryptokey',
            value: '00ff',
          }}
        />
      )
      expect(pane()).toHaveValue('00ff')
      fireEvent.click(screen.getByRole('button', { name: 'Base64' }))
      expect(pane()).toHaveValue('AP8=')
    }
  )
  it('does not invent byte output from missing or malformed retained hex', () => {
    const { rerender } = render(
      <KeyDetails
        selectedKey={{
          ...key('browser-export', new Uint8Array()),
          data: {} as CryptoKey,
          dataType: 'cryptokey',
          value: '0fz',
        }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Base64' }))
    expect(pane()).toHaveValue(
      'Stored byte export unavailable: no complete hexadecimal byte representation'
    )
    rerender(
      <KeyDetails
        selectedKey={{ ...key('mock', new Uint8Array()), data: undefined, value: 'mock value' }}
      />
    )
    expect(pane()).toHaveValue('Stored-byte view unavailable in mock mode')
  })
  it('does not carry edited display values across keys, source changes or view modes', () => {
    const a = key('a', new Uint8Array([0, 255]))
    const { rerender } = render(<KeyDetails selectedKey={a} />)
    fireEvent.change(pane(), { target: { value: 'edited illustration' } })
    expect(screen.getByRole('status')).toHaveTextContent('stored key is unchanged')
    expect(Array.from(a.data as Uint8Array)).toEqual([0, 255])
    rerender(<KeyDetails selectedKey={key('b', new Uint8Array([1, 2]))} />)
    expect(pane()).toHaveValue('0102')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.change(pane(), { target: { value: 'old source' } })
    rerender(<KeyDetails selectedKey={key('b', new Uint8Array([3, 4]))} />)
    expect(pane()).toHaveValue('0304')
    fireEvent.change(pane(), { target: { value: 'hex edit' } })
    fireEvent.click(screen.getByRole('button', { name: 'Base64' }))
    expect(pane()).toHaveValue('AwQ=')
    fireEvent.click(screen.getAllByRole('button', { name: 'HEX' })[1])
    expect(pane()).toHaveValue('0304')
  })
})
