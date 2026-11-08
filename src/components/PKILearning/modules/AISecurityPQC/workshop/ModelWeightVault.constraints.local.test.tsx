// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { DEPLOYMENT_MODES } from '../data/aiModelData'
import { ModelWeightVault } from './ModelWeightVault'

function pick(control: string, option: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name: `${control}:` }))
  fireEvent.click(screen.getByRole('option', { name: option }))
}
const capacity = () => screen.getByRole('status', { name: 'Sample file-size capacity' })
const manifest = () => within(screen.getByRole('region', { name: 'Sample selection manifest' }))
const originalLimits = DEPLOYMENT_MODES.map((profile) => profile.maxModelSizeGB)
afterEach(() => {
  DEPLOYMENT_MODES.forEach((profile, index) => {
    profile.maxModelSizeGB = originalLimits[index]
  })
})

describe('selected model file size versus explicit sample deployment assumptions', () => {
  it('computes Edge 2/4 GB within and 14/4 GB exceeding, updating the manifest without a protection grade', () => {
    render(<ModelWeightVault />)
    pick('Deployment', 'Edge Device')
    pick('Model Size', '1B Parameters')
    expect(capacity()).toHaveTextContent('Within stated sample file-size limit')
    expect(capacity()).toHaveTextContent('2 GB model file ≤ 4 GB stated profile limit')
    expect(manifest().getByText(/^File-size screen:/)).toHaveTextContent(
      'Within stated sample file-size limit'
    )
    pick('Model Size', '7B Parameters')
    expect(capacity()).toHaveTextContent('Exceeds stated sample file-size limit')
    expect(capacity()).toHaveTextContent('14 GB model file > 4 GB stated profile limit')
    expect(manifest().getByText(/^File-size screen:/)).toHaveTextContent(
      'Exceeds stated sample file-size limit'
    )
    expect(manifest().getByText(/^Attestation:/)).toHaveTextContent(
      'assumed available in this sample profile — not verified'
    )
    expect(manifest().getByText(/^In-use encryption:/)).toHaveTextContent(
      'Not assumed by this sample profile'
    )
    expect(screen.queryByRole('row', { name: /Quantum Safe/ })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Selected example' })).toBeInTheDocument()
  })

  it('rejects 810/256 GB even with both PQC primitives and updates back to 14/256 GB', () => {
    render(<ModelWeightVault />)
    pick('Model Size', '405B Parameters')
    expect(capacity()).toHaveTextContent('810 GB model file > 256 GB stated profile limit')
    expect(capacity()).toHaveTextContent('Exceeds stated sample file-size limit')
    expect(manifest().getByText(/^Key Wrapping:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    expect(manifest().getByText(/^Model Signing:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    pick('Model Size', '7B Parameters')
    expect(capacity()).toHaveTextContent('14 GB model file ≤ 256 GB stated profile limit')
    expect(capacity()).toHaveTextContent('does not establish runtime working-set memory')
    expect(screen.getByText(/No attestation report, certificate chain/)).toHaveTextContent(
      'availability alone is not evidence that the model is protected'
    )
  })

  it.each(['On-Premises HSM', 'Federated Deployment'])(
    'does not treat the %s null limit or capability flags as established protection',
    (deployment) => {
      render(<ModelWeightVault />)
      pick('Deployment', deployment)
      expect(capacity()).toHaveTextContent('Limit not supplied — capacity not assessed')
      expect(capacity()).toHaveTextContent('supplies no numeric capacity limit')
      expect(manifest().getByText(/^Attestation:/)).toHaveTextContent(
        'Capability not included in this sample profile — not verified'
      )
      expect(screen.queryByText('Unlimited')).not.toBeInTheDocument()
      if (deployment === 'Federated Deployment') {
        expect(manifest().getByText(/^In-use encryption:/)).toHaveTextContent(
          'Assumed by this sample profile — not executed or verified'
        )
        expect(
          screen.getByText(
            /This fictional profile is not a general definition of federated learning/
          )
        ).toHaveTextContent('does not establish update confidentiality')
      } else {
        expect(manifest().getByText(/^In-use encryption:/)).toHaveTextContent(
          'Not assumed by this sample profile'
        )
      }
    }
  )

  it('keeps primitive properties independent of capacity and of each other', () => {
    render(<ModelWeightVault />)
    pick('Deployment', 'Edge Device')
    pick('Key Wrapping', 'RSA-2048 OAEP (wrapped DEK)')
    expect(manifest().getByText(/^Key Wrapping:/)).toHaveTextContent(
      'Classical primitive selected — no PQC category'
    )
    expect(manifest().getByText(/^Model Signing:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    expect(capacity()).toHaveTextContent('14 GB model file > 4 GB stated profile limit')
    pick('Key Wrapping', /^ML-KEM-768 \(KEM ciphertext/)
    pick('Signing', 'ECDSA P-256')
    expect(manifest().getByText(/^Key Wrapping:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    expect(manifest().getByText(/^Model Signing:/)).toHaveTextContent(
      'Classical primitive selected — no PQC category'
    )
    expect(capacity()).toHaveTextContent('14 GB model file > 4 GB stated profile limit')
    expect(screen.queryByText(/NIST Level 0|FULL PQC PROTECTION/)).not.toBeInTheDocument()
  })

  it('includes equality in the stated numerical limit for a controlled fictional boundary', () => {
    // In-memory fixture only. No source/data file or real hardware limit changes.
    DEPLOYMENT_MODES[0].maxModelSizeGB = 14
    render(<ModelWeightVault />)
    expect(capacity()).toHaveTextContent('14 GB model file ≤ 14 GB stated profile limit')
    expect(capacity()).toHaveTextContent('Within stated sample file-size limit')
    expect(capacity()).toHaveTextContent('does not establish runtime working-set memory')
  })

  it('treats a finite zero limit as zero capacity, not missing or unlimited', () => {
    DEPLOYMENT_MODES[0].maxModelSizeGB = 0
    render(<ModelWeightVault />)
    expect(capacity()).toHaveTextContent('14 GB model file > 0 GB stated profile limit')
    expect(capacity()).toHaveTextContent('Exceeds stated sample file-size limit')
  })

  it.each([Number.NaN, -1, Number.POSITIVE_INFINITY])(
    'keeps invalid fixture limit %s unassessed',
    (limit) => {
      DEPLOYMENT_MODES[0].maxModelSizeGB = limit
      render(<ModelWeightVault />)
      expect(capacity()).toHaveTextContent('Invalid profile limit — capacity not assessed')
      expect(capacity()).not.toHaveTextContent('Within stated sample file-size limit')
      expect(capacity()).not.toHaveTextContent('Exceeds stated sample file-size limit')
    }
  )
})
