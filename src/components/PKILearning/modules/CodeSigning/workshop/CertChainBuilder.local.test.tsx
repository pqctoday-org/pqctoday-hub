// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CertChainBuilder } from './CertChainBuilder'

afterEach(() => vi.useRealTimers())

async function buildChain() {
  vi.useFakeTimers()
  render(<CertChainBuilder />)
  fireEvent.click(screen.getByRole('button', { name: /Build Chain/ }))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500)
  })
}

const fieldAfter = (scope: HTMLElement, label: string) => {
  const el = within(scope)
    .getAllByText(label)
    .map((l) => l.parentElement!)
    .find(Boolean)!
  return el.textContent!.replace(label, '').trim()
}

describe('simulated certificate chain fields', () => {
  it('takes each certificate signature algorithm and size from the issuer, not the subject key', async () => {
    await buildChain()
    // Chain order: Root CA (ML-DSA-87), Intermediate (ML-DSA-65), Code Signing (ML-DSA-44).
    const buttons = screen.getAllByRole('button', { name: /Expand/ })
    expect(buttons).toHaveLength(3)
    const expected = [
      { sig: /^ML-DSA-87/, size: /^4,627 bytes/, key: 'ML-DSA-87' },
      { sig: /^ML-DSA-87/, size: /^4,627 bytes/, key: 'ML-DSA-65' },
      { sig: /^ML-DSA-65/, size: /^3,309 bytes/, key: 'ML-DSA-44' },
    ]
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /Expand|Collapse/ })[i])
      const panel = screen.getByText('Signature Algorithm:').closest('div')!.parentElement!
      expect(fieldAfter(panel, 'Signature Algorithm:')).toMatch(expected[i].sig)
      expect(fieldAfter(panel, 'Public Key Algorithm:')).toBe(expected[i].key)
      expect(fieldAfter(panel, 'Signature:')).toMatch(expected[i].size)
      fireEvent.click(screen.getAllByRole('button', { name: /Expand|Collapse/ })[i])
    }
  })

  it('gives no path length to the end-entity certificate', async () => {
    await buildChain()
    const constraints: string[] = []
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /Expand|Collapse/ })[i])
      const panel = screen.getByText('Basic Constraints:').closest('div')!.parentElement!
      constraints.push(fieldAfter(panel, 'Basic Constraints:'))
      fireEvent.click(screen.getAllByRole('button', { name: /Expand|Collapse/ })[i])
    }
    expect(constraints).toEqual(['CA:TRUE', 'CA:TRUE, pathlen:0', 'CA:FALSE'])
  })

  it('summarizes subject key and issuer signature separately', async () => {
    await buildChain()
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual([
      'Level',
      'Subject Key',
      'Key Size',
      'Signed With',
      'Sig Size',
      'Validity',
    ])
    const rows = screen.getAllByRole('row').slice(1)
    const cells = rows.map((r) =>
      within(r)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    )
    expect(cells[1].slice(1, 5)).toEqual(['ML-DSA-65', '1,952 B', 'ML-DSA-87', '4,627 B'])
    expect(cells[2].slice(1, 5)).toEqual(['ML-DSA-44', '1,312 B', 'ML-DSA-65', '3,309 B'])
  })
})
