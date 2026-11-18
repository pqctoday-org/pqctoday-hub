// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TokenMigrationLab } from './TokenMigrationLab'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () =>
    failure.live
      ? {
          isReady: true,
          phase: 'session_open',
          moduleRef: { current: {} },
          hSessionRef: { current: 1 },
          log: [],
          keys: [],
        }
      : { isReady: false, phase: 'idle', moduleRef: { current: null } },
}))
const failure = vi.hoisted(() => ({ live: false }))
vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_generateRSAKeyPair: () => {
    throw new Error('Sample key generation failed')
  },
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

describe('Unrun token sizing model', () => {
  it('shows encoded totals for native algorithm selections without signing or claiming transport fit', () => {
    render(<TokenMigrationLab />)
    expect(screen.getByText('755')).toBeInTheDocument()
    expect(
      screen.getByText(/Encoded header 87 \+ payload 324 \+ signature 342 \+ 2 separators = 755/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm:' }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-DSA-65 (NIST Level 3)' }))
    expect(screen.getByText('4,832')).toBeInTheDocument()
    expect(
      screen.getByText(/Encoded header 94 \+ payload 324 \+ signature 4412 \+ 2 separators = 4832/)
    ).toBeInTheDocument()
    expect(screen.getByText(/does not establish a valid, interoperable token/)).toBeInTheDocument()
    expect(screen.getByText(/Token length alone does not establish fit/)).toBeInTheDocument()
    expect(screen.queryByText(/must use ML-DSA-44 or switch/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show Signature Illustration' })).toBeEnabled()
  })

  it('shows the live signing error and keeps verification disabled', async () => {
    failure.live = true
    try {
      render(<TokenMigrationLab />)
      fireEvent.click(screen.getByRole('button', { name: 'Sign Token (Live WASM)' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Sample key generation failed')
      expect(screen.queryByText('Illustrative signature bytes')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Verify Signature (Live WASM)' })).toBeDisabled()
    } finally {
      failure.live = false
    }
  })
})
