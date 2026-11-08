// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { Buffer } from 'node:buffer'
import { TokenSizeAnalyzer } from './TokenSizeAnalyzer'

// Exercise actual header/payload serializers and rendered calculations. Only the
// async signature-byte input is controlled; this suite makes no crypto claim.
vi.mock('../jwtUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../jwtUtils')>()
  const { JOSE_SIGNING_ALGORITHMS } = await import('../constants')
  return {
    ...actual,
    generateJwsKeyPair: async () => ({}),
    signJWS: async ({ alg }: { alg: string }) => {
      const bytes = JOSE_SIGNING_ALGORITHMS.find((item) => item.jose === alg)?.sigBytes
      if (bytes === undefined) throw new Error('No signature-size fixture for selected algorithm')
      return { signature: new Uint8Array(bytes) }
    },
  }
})

const claims = {
  sub: '1234567890',
  name: 'Alice Engineer',
  iat: 1735689600,
  exp: 1735776000,
  iss: 'https://auth.example.com',
  aud: 'https://api.example.com',
  roles: ['developer', 'admin'],
}
function independentLine(alg: string, payload: Record<string, unknown>, sigBytes: number) {
  const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' }), 'utf8').toString('base64url')
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = Buffer.alloc(sigBytes).toString('base64url')
  const compact = [header, body, signature].join('.')
  return {
    compactBytes: Buffer.byteLength(compact),
    lineBytes: Buffer.byteLength(`Authorization: Bearer ${compact}\r\n`),
  }
}
async function ready() {
  render(<TokenSizeAnalyzer />)
  await waitFor(() =>
    expect(screen.queryByText('Measuring real signature sizes…')).not.toBeInTheDocument()
  )
}
const row = (algorithm: string) => {
  const matches = screen
    .getAllByRole('row')
    .filter((element) => within(element).queryByRole('cell', { name: algorithm }))
  expect(matches).toHaveLength(1)
  const element = matches.at(0)
  if (!element) throw new Error('Algorithm row not found')
  return within(element)
}
const budget = () =>
  screen.getByRole('spinbutton', {
    name: 'Illustrative HTTP/1 Authorization field-line budget (bytes)',
  })
const payload = () => screen.getByRole('textbox', { name: 'JWT payload (editable JSON)' })

describe('Complete Authorization field-line sizing', () => {
  it('counts the existing full ML-DSA-65 and ES256 lines and shows their exact headroom', async () => {
    await ready()
    expect(independentLine('ML-DSA-65', claims, 3309).lineBytes).toBe(4711)
    expect(independentLine('ES256', claims, 64).lineBytes).toBe(379)
    expect(row('ML-DSA-65').getByRole('cell', { name: '4,711 B' })).toBeInTheDocument()
    expect(row('ES256').getByRole('cell', { name: '379 B' })).toBeInTheDocument()
    expect(row('ML-DSA-65').getByRole('cell', { name: '3,481 B headroom' })).toBeInTheDocument()
    expect(row('ES256').getByRole('cell', { name: '7,813 B headroom' })).toBeInTheDocument()
    expect(screen.getByText(/22-byte prefix and 2-byte CRLF/)).toBeInTheDocument()
  })
  it('recalculates the larger existing claims example instead of declaring every PQC token over budget', async () => {
    await ready()
    const larger = { ...claims, notes: 'x'.repeat(3000) }
    expect(independentLine('ML-DSA-65', larger, 3309).lineBytes).toBe(8726)
    fireEvent.change(payload(), { target: { value: JSON.stringify(larger) } })
    expect(row('ML-DSA-65').getByRole('cell', { name: '8,726 B' })).toBeInTheDocument()
    expect(row('ML-DSA-65').getByRole('cell', { name: '534 B over budget' })).toBeInTheDocument()
  })
  it.each([
    ['4711', '0 B headroom (exact boundary)'],
    ['4710', '1 B over budget'],
    ['4712', '1 B headroom'],
  ])(
    'compares the complete line with an illustrative %s-byte budget',
    async (value, comparison) => {
      await ready()
      fireEvent.change(budget(), { target: { value } })
      expect(row('ML-DSA-65').getByRole('cell', { name: '4,711 B' })).toBeInTheDocument()
      expect(row('ML-DSA-65').getByRole('cell', { name: comparison })).toBeInTheDocument()
    }
  )
  it.each(['', '0', '-1', '1.5'])(
    'keeps actual line bytes visible while invalid budget %s is not assessed',
    async (value) => {
      await ready()
      fireEvent.change(budget(), { target: { value } })
      expect(row('ML-DSA-65').getByRole('cell', { name: '4,711 B' })).toBeInTheDocument()
      expect(
        row('ML-DSA-65').getByRole('cell', { name: 'Budget not assessed' })
      ).toBeInTheDocument()
      expect(budget()).toHaveAttribute('aria-invalid', 'true')
    }
  )
  it('includes framing when a compact token alone is below the same budget', async () => {
    await ready()
    const nearBoundary = { ...claims, notes: 'x'.repeat(2601) }
    const expected = independentLine('ML-DSA-65', nearBoundary, 3309)
    expect(expected).toEqual({ compactBytes: 8170, lineBytes: 8194 })
    fireEvent.change(payload(), { target: { value: JSON.stringify(nearBoundary) } })
    expect(row('ML-DSA-65').getByRole('cell', { name: '8,194 B' })).toBeInTheDocument()
    expect(row('ML-DSA-65').getByRole('cell', { name: '2 B over budget' })).toBeInTheDocument()
  })
  it('counts UTF-8 claims through actual base64url serialization, not JavaScript text length', async () => {
    await ready()
    const unicode = { ...claims, name: '工程师 🚀' }
    const expected = independentLine('ML-DSA-65', unicode, 3309)
    fireEvent.change(payload(), { target: { value: JSON.stringify(unicode) } })
    expect(
      row('ML-DSA-65').getByRole('cell', { name: `${expected.lineBytes.toLocaleString()} B` })
    ).toBeInTheDocument()
  })
})
