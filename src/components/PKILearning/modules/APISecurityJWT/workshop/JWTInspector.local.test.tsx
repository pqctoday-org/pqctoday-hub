// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { JWTInspector } from './JWTInspector'
import { verifyJWS } from '../jwtUtils'
vi.mock('../jwtUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../jwtUtils')>()),
  verifyJWS: vi.fn(),
}))
beforeEach(() => vi.resetAllMocks())
const start = () => {
  render(<JWTInspector />)
  fireEvent.click(screen.getByRole('button', { name: 'ML-DSA-65' }))
  fireEvent.click(screen.getByRole('button', { name: 'Verify against IETF KAT public key' }))
}
describe('JWT verification result identity', () => {
  it('clears a previous result after manual edits', async () => {
    vi.mocked(verifyJWS).mockResolvedValue({ valid: true } as Awaited<ReturnType<typeof verifyJWS>>)
    start()
    await screen.findByText(/Signature valid/)
    fireEvent.change(screen.getByLabelText('JWT Token'), {
      target: { value: 'changed.token.bytes' },
    })
    expect(screen.queryByText(/Signature valid/)).not.toBeInTheDocument()
  })
  it('does not restore a stale result when an old verification finishes after editing', async () => {
    let finish!: (value: Awaited<ReturnType<typeof verifyJWS>>) => void
    vi.mocked(verifyJWS).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    start()
    fireEvent.change(screen.getByLabelText('JWT Token'), {
      target: { value: 'changed.token.bytes' },
    })
    await act(async () => finish({ valid: true } as Awaited<ReturnType<typeof verifyJWS>>))
    expect(screen.queryByText(/Signature valid/)).not.toBeInTheDocument()
  })
})
