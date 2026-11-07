// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SensitivityScoringEngine } from './SensitivityScoringEngine'
import type { DataAsset, ScoredAsset } from '../data/sensitivityConstants'

vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

const unscoped: DataAsset = {
  id: 'new-1',
  name: 'Newly added asset',
  assetType: 'data-store',
  sensitivityTier: 'medium',
  retentionPeriod: '1-5y',
  currentEncryption: 'Not specified',
  businessOwner: 'Unassigned',
  industry: 'Technology',
  complianceFlags: [],
}

describe('assets with no stated applicability', () => {
  it('are scored with no mandates even when the estate has selected several', () => {
    let latest: ScoredAsset[] = []
    render(
      <SensitivityScoringEngine
        assets={[unscoped]}
        selectedMandates={['GDPR', 'PCI-DSS', 'CNSA-2.0', 'FIPS-140-3']}
        onScoredAssetsChange={(s) => {
          latest = s
        }}
      />
    )
    expect(latest).toHaveLength(1)
    expect(latest[0].complianceFlags).toEqual([])
    expect(latest[0].complianceScore).toBe(0)
    // And the algorithm choice is not narrowed to a suite nobody said applies.
    expect(latest[0].pqcRecommendation.signature).not.toMatch(/ML-DSA-87/)

    fireEvent.click(screen.getByRole('button', { name: 'Show breakdown' }))
    expect(screen.getByText(/Applicability not stated/)).toBeInTheDocument()
  })

  it('keep the mandates that the asset itself states', () => {
    let latest: ScoredAsset[] = []
    render(
      <SensitivityScoringEngine
        assets={[{ ...unscoped, complianceFlags: ['GDPR'] }]}
        selectedMandates={['GDPR', 'PCI-DSS', 'CNSA-2.0']}
        onScoredAssetsChange={(s) => {
          latest = s
        }}
      />
    )
    expect(latest[0].complianceFlags).toEqual(['GDPR'])
    expect(latest[0].complianceScore).toBe(20)
  })
})
