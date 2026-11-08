// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TokenSizeAnalyzer } from './TokenSizeAnalyzer'

// Synthetic byte-length fixtures exercise reference-band boundaries; these
// sizes are not assertions about the named real algorithm or any server.
const { fixture } = vi.hoisted(() => ({ fixture: { bytes: 3060 } }))
vi.mock('../constants', () => ({
  SAMPLE_JWT_PAYLOAD: { sample: true },
  JOSE_SIGNING_ALGORITHMS: [
    {
      jose: 'ML-DSA-44',
      name: 'Fixture signing row',
      sigBytes: 3060,
      category: 'signing',
      broken: false,
    },
  ],
}))
vi.mock('../jwtUtils', () => ({
  createJWTHeader: () => 'HHHH',
  createJWTPayload: () => 'PP',
  generateJwsKeyPair: async () => ({}),
  signJWS: async () => ({ signature: new Uint8Array(fixture.bytes) }),
}))

describe('Fixed compact-token reference bands', () => {
  beforeEach(() => {
    fixture.bytes = 3060
  })
  it.each([
    [3060, 'Below 4 KiB reference'],
    [6135, '4–8 KiB reference band'],
    [6138, 'At or above 8 KiB reference'],
    [6144, 'At or above 8 KiB reference'],
  ])(
    'labels a synthetic %i-byte signature against references, not a server acceptance limit',
    async (bytes, label) => {
      fixture.bytes = bytes
      render(<TokenSizeAnalyzer />)
      await waitFor(() =>
        expect(screen.queryByText('Measuring real signature sizes…')).not.toBeInTheDocument()
      )
      expect(screen.getAllByText('Fixture signing row')).toHaveLength(2)
      // The middle-band legend shares the chart status wording; other legend labels differ.
      expect(screen.getAllByText(label)).toHaveLength(label === '4–8 KiB reference band' ? 2 : 1)
      expect(screen.getByText(/not HTTP or cookie acceptance limits/)).toBeInTheDocument()
      expect(screen.getByText(/fixed sample reference; not a server limit/)).toBeInTheDocument()
      expect(
        screen.queryByText(/common default for Nginx, Apache, Node.js/)
      ).not.toBeInTheDocument()
      expect(screen.queryByText('OK')).not.toBeInTheDocument()
    }
  )
})
