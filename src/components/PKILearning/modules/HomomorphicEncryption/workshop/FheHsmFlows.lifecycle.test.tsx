// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FheHsmFlows } from './FheHsmFlows'
import { FHE_HSM_FLOWS, engineStatusOf } from '../data/fheHsmFlows'
import { FLOOD_ID3 } from '../data/fheFloodSizing'

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

  it('the corrected flood sizing is stated once on the decrypt step, with the Mac and board results', () => {
    const decrypt = flow('single-hsm').steps.find((s) => s.id === 'decrypt-under-policy')!
    expect(decrypt.engineNote).toContain('pqctoday-hsm #355')
    expect(decrypt.engineNote).toContain('on a Mac and with the token on both MX95 boards')
    expect(decrypt.engineNote).toContain(
      `${FLOOD_ID3.rangeLow}–${FLOOD_ID3.rangeHigh} bits against a bar of 10`
    )
    expect(decrypt.engineNote).not.toMatch(/not yet measured/)
  })

  it('"What can run in the HSM?": the steps the merged engine does are in the engine, nothing is planned', () => {
    const f = flow('hsm-compute-limits')
    const status = Object.fromEntries(f.steps.map((s) => [s.id, engineStatusOf(f, s)]))
    expect(status).toEqual({
      'key-generation-fits': 'engine',
      'eval-keygen-in-hsm': 'engine',
      // the HSM cannot run homomorphic evaluation: that step stays "refused", it is not "planned"
      'evaluation-in-hsm': 'refused',
      'evaluation-on-accelerators': 'outside',
      'return-encrypted-result': 'outside',
      'app-requests-decrypt': 'engine',
      'decrypt-in-hsm': 'engine',
      'release-result': 'engine',
    })
    expect(Object.values(status)).not.toContain('planned')
  })

  it('"What can run in the HSM?": the engine notes cite the merge commits, not pull request heads', () => {
    const f = flow('hsm-compute-limits')
    const notes = (id: string) => f.steps.find((s) => s.id === id)!.engineNote ?? ''
    const keys = notes('eval-keygen-in-hsm')
    for (const sha of [
      'f4924a034641c44e00a8565c200cc9f7d179f895', // #351 streamed export, registry ID 3, rotation key
      '3c3954741bc8f2ccab8cf0e18f6d8d48e53fe905', // #353 generator frozen
      '3cad9d3ba628522c1e3d150a3ed2570bfac825d6', // #354 retirement record
    ])
      expect(keys).toContain(sha)
    expect(keys).toContain('registry ID 3')
    expect(keys).toContain('rotation key')
    expect(notes('key-generation-fits')).toBe(keys)
    const decrypt = notes('decrypt-in-hsm')
    expect(decrypt).toContain('d6b23452d92e4250069db9b993f818e65712b7b1') // #355 flood width
    expect(decrypt).toContain('f4924a034641c44e00a8565c200cc9f7d179f895')
    for (const id of ['app-requests-decrypt', 'release-result']) expect(notes(id)).toBe(decrypt)
    // the streaming step says what the second set and the rotation key cost (merged measurements)
    const detail = f.steps.find((s) => s.id === 'eval-keygen-in-hsm')!.detail
    expect(detail).toContain('4.41 GB in 1,201 calls')
    expect(detail).toContain('31.5 MB')
    expect(detail).toContain('frozen')
  })

  it('shared decryption and the replication steps stay planned: nothing of them is built', () => {
    const shared = flow('ckks-shared-decrypt')
    for (const st of shared.steps.filter((s) => /^token-/.test(s.id)))
      expect(engineStatusOf(shared, st), st.id).toBe('planned')
    const single = flow('single-hsm')
    for (const id of ['live-clone-peer-hsm', 'offline-backup-restore'])
      expect(
        engineStatusOf(
          single,
          single.steps.find((s) => s.id === id)!
        )
      ).toBe('planned')
  })
})
