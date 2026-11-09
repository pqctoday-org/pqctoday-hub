// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MeasuredChainExample } from './MeasuredChainExample'
import type { MeasuredChain } from './measuredChainSample'

// Markup fixture only: these placeholder byte strings are not certificates. The test checks how
// the results table is labelled for assistive technology, not any measurement.
const fixture = vi.hoisted(() => {
  const certificate = (role: 'root' | 'intermediate' | 'leaf', length: number) => ({
    role,
    pem: '',
    der: new Uint8Array(length),
    subject: role,
    issuer: role,
    serial: '1',
  })
  const chain = (algorithm: 'ML-DSA-65' | 'RSA-2048'): MeasuredChain => ({
    algorithm,
    certificates: [certificate('root', 4), certificate('intermediate', 3), certificate('leaf', 2)],
    certificateDerBytes: 5,
    certificateBody: new Uint8Array(19),
    handshakeMessage: new Uint8Array(23),
    verification: 'OpenSSL sample chain/hostname check passed',
  })
  return { results: [chain('ML-DSA-65'), chain('RSA-2048')] }
})
vi.mock('./measuredChainSample', async (original) => ({
  ...(await original<typeof import('./measuredChainSample')>()),
  generateMeasuredChains: vi.fn().mockResolvedValue(fixture.results),
}))

describe('Measured chain results table headings', () => {
  it('scopes each column heading to its column and each profile name to its row', async () => {
    render(<MeasuredChainExample onBusyChange={vi.fn()} onInspect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate measured sample chains' }))
    const region = await screen.findByRole('region', {
      name: 'Measured certificate-chain results',
    })
    const columns = within(region).getAllByRole('columnheader')
    expect(columns).toHaveLength(7)
    for (const heading of columns) expect(heading).toHaveAttribute('scope', 'col')
    const rows = within(region).getAllByRole('rowheader')
    expect(rows.map((heading) => heading.textContent)).toEqual(['ML-DSA-65', 'RSA-2048'])
    for (const heading of rows) expect(heading).toHaveAttribute('scope', 'row')
  })
})
