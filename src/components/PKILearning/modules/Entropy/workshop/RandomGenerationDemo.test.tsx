// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/utils/webCrypto', () => ({
  getRandomBytes: (count: number) =>
    Uint8Array.from({ length: count }, (_, index) => (index * 73 + 19) & 0xff),
  arrayBufferToHex: (buffer: ArrayBuffer) =>
    Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join(''),
}))

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn() },
}))

import { RandomGenerationDemo } from './RandomGenerationDemo'

describe('RandomGenerationDemo guided experiment', () => {
  it('moves from an appearance prediction to seed recovery and the correct conclusion', async () => {
    render(
      <MemoryRouter>
        <RandomGenerationDemo />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: 'Toggle source: Web Crypto API' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Toggle source: Timestamp LCG' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.queryByRole('button', { name: 'Toggle source: OpenSSL WASM' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cannot tell from appearance' }))
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))

    expect(await screen.findByTestId('visual-similarity-callout')).toHaveTextContent(
      'The pictures may look alike. That is the result.'
    )
    for (const id of ['source-results-grid', 'frequency-grid', 'lag-plot-grid']) {
      expect(screen.getByTestId(id)).toHaveClass('md:grid-cols-2')
      expect(screen.getByTestId(id)).not.toHaveClass('xl:grid-cols-4')
    }

    fireEvent.click(screen.getByRole('button', { name: 'Recover Seed from First 4 Bytes' }))
    expect(await screen.findByTestId('lcg-seed-recovered')).toHaveTextContent('Recovered seed')

    fireEvent.click(screen.getByRole('button', { name: 'Predict Next 4 Bytes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Advance Same State and Verify' }))
    expect(await screen.findByTestId('lcg-prediction-verified')).toHaveTextContent('Exact match')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Appearance alone cannot establish unpredictability',
      })
    )
    await waitFor(() =>
      expect(screen.getByTestId('experiment-conclusion')).toHaveTextContent(
        'Security depends on the generator design'
      )
    )
  })

  it('reveals optional sources without allowing four-column plot layouts', () => {
    render(
      <MemoryRouter>
        <RandomGenerationDemo />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Explore more sources' }))
    expect(screen.getByRole('button', { name: 'Toggle source: OpenSSL WASM' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle source: Math.random()' })).toBeInTheDocument()
  })
})
