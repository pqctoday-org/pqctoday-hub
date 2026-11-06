// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AssetInventoryBuilder } from './AssetInventoryBuilder'
import type { DataAsset } from '../data/sensitivityConstants'

const asset = (id: string, retentionPeriod: DataAsset['retentionPeriod']): DataAsset => ({
  id,
  name: `Asset ${id}`,
  assetType: 'data-store',
  sensitivityTier: 'high',
  retentionPeriod,
  currentEncryption: 'RSA-2048 envelope',
  businessOwner: 'Owner',
  industry: 'Healthcare',
  complianceFlags: [],
})

describe('HNDL threshold year explanation', () => {
  it('describes newly captured data and the threshold inequality, not data already taken', () => {
    render(
      <AssetInventoryBuilder
        assets={[asset('short', '5-10y'), asset('long', '25-plus')]}
        onAssetsChange={() => {}}
        crqcYear={2034}
      />
    )
    const note = screen.getByText(/threshold year for/i).closest('div')!.textContent!
    expect(note).toMatch(/newly captured data/)
    expect(note).toMatch(/captured 2027 \+ 7 years = 2034/)
    expect(note).toMatch(/cannot show that anything is already in an adversary/)
    expect(note).not.toMatch(/were collected before/)
    expect(note).not.toMatch(/may already be in adversary archives/)
  })

  it('shows the 7-year sample threshold as 2027 and the 30-year one as already reached', () => {
    render(
      <AssetInventoryBuilder
        assets={[asset('short', '5-10y'), asset('long', '25-plus')]}
        onAssetsChange={() => {}}
        crqcYear={2034}
      />
    )
    const future = screen.getByText('2027')
    expect(future.getAttribute('title')).toMatch(/captured from this year on/)
    const reached = screen.getByText(/2004 \(at risk\)/).closest('span[title]')!
    expect(reached.getAttribute('title')).toMatch(/captured now/)
    for (const el of [future, reached]) {
      expect(el.getAttribute('title')).not.toMatch(/adversary archives/)
      expect(el.getAttribute('title')).not.toMatch(/Data encrypted before/)
    }
  })
})
