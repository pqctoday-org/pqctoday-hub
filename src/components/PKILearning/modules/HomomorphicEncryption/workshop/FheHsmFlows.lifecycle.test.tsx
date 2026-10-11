// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FheHsmFlows } from './FheHsmFlows'
import { FHE_HSM_FLOWS, engineStatusOf } from '../data/fheHsmFlows'

const flow = (id: string) => FHE_HSM_FLOWS.find((f) => f.id === id)!

describe('FHE + HSM flows: the key-lifecycle scenarios', () => {
  it('lists eight scenarios, the two new ones last', () => {
    render(<FheHsmFlows />)
    expect(FHE_HSM_FLOWS).toHaveLength(8)
    expect(screen.getByRole('button', { name: /CKKS key rotation/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /CKKS shared \(2-of-2\) decryption/ })
    ).toBeInTheDocument()
  })

  it('rotation: HSM steps are in the engine, server steps outside; refusals can be tried', () => {
    const f = flow('ckks-key-rotation')
    const status = Object.fromEntries(f.steps.map((s) => [s.id, engineStatusOf(f, s)]))
    expect(status['so-starts-rotation']).toBe('engine')
    expect(status['stream-rotation-key']).toBe('engine')
    expect(status['so-retires-old-secret']).toBe('engine')
    expect(status['server-switches-ciphertexts']).toBe('outside')
    render(<FheHsmFlows initialFlowId="ckks-key-rotation" />)
    expect(screen.getByRole('heading', { name: 'CKKS key rotation' })).toBeInTheDocument()
    // measured numbers in the scenario banner and the linked evidence
    expect(
      screen.getByText(/31\.5 MB \(15\.7 MB streamed in 4 calls of 8 limbs/)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rotation run/ })).toHaveAttribute(
      'href',
      expect.stringContaining('ckks-rotation-ab8b1c3')
    )
    const attempt = screen.getByTestId('rotation-attempt')
    const who = within(attempt).getByRole('group', { name: 'Who starts the rotation' })
    fireEvent.click(within(who).getByRole('button', { name: 'User session' }))
    expect(within(attempt).getByRole('status')).toHaveTextContent('CKR_USER_TYPE_INVALID')
  })

  it('shared decryption: the HSM steps are planned and the switches show the measured outcome', () => {
    const f = flow('ckks-shared-decrypt')
    const status = Object.fromEntries(f.steps.map((s) => [s.id, engineStatusOf(f, s)]))
    expect(status['token-a-makes-share']).toBe('planned')
    expect(status['token-b-partial-decrypt']).toBe('planned')
    expect(status['combiner-joins-key-shares']).toBe('outside')
    render(<FheHsmFlows initialFlowId="ckks-shared-decrypt" />)
    expect(
      screen.getByRole('heading', { name: 'CKKS shared (2-of-2) decryption' })
    ).toBeInTheDocument()
    const sw = screen.getByTestId('shared-switches')
    expect(within(sw).getByTestId('shared-requester')).toHaveTextContent(
      /one share alone decrypts nothing/
    )
    fireEvent.click(within(sw).getByRole('button', { name: /Not independent/ }))
    expect(within(sw).getByTestId('shared-requester')).toHaveTextContent(/add up to the secret/)
    expect(screen.getByRole('link', { name: /threshold study/ })).toHaveAttribute(
      'href',
      expect.stringContaining('ckks-threshold-2of2-8beec58')
    )
  })

  it('single-HSM CKKS: the merged mechanisms are in the engine, replication stays planned', () => {
    const f = flow('single-hsm')
    const status = Object.fromEntries(f.steps.map((s) => [s.id, engineStatusOf(f, s)]))
    for (const id of [
      'generate-fhe-secret',
      'export-evaluation-keys',
      'publish-public-key',
      'owner-requests-decrypt',
      'decrypt-under-policy',
      'release-result',
    ])
      expect(status[id], id).toBe('engine') // eslint-disable-line security/detect-object-injection
    expect(status['live-clone-peer-hsm']).toBe('planned')
    expect(status['offline-backup-restore']).toBe('planned')
  })

  it('the corrected flood sizing is stated once on the decrypt step, with the board marker', () => {
    const decrypt = flow('single-hsm').steps.find((s) => s.id === 'decrypt-under-policy')!
    expect(decrypt.engineNote).toContain('pqctoday-hsm #355')
    expect(decrypt.engineNote).toContain('not yet measured on the boards with the corrected sizing')
    expect(decrypt.engineNote).toContain('11.10–11.34 bits against a bar of 10')
  })
})
