// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DataAssetExercises } from './DataAssetExercises'
import {
  DEFAULT_SCORING_WEIGHTS,
  computeHndlRiskYear,
  getPriorityBand,
  scoreAsset,
  type DataAsset,
} from '../data/sensitivityConstants'

describe('illustrative asset observations', () => {
  it('asks learners to inspect current results without asserting captured records or guaranteed scores', () => {
    const setConfig = vi.fn()
    const navigate = vi.fn()
    render(
      <MemoryRouter>
        <DataAssetExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={setConfig} />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('heading', { level: 3, name: /^[1-4]\./ })).toHaveLength(4)
    expect(screen.getByText(/For this sample, assume a 30-year retention period/)).toBeVisible()
    expect(screen.getByText(/does not establish when records were collected/)).toBeVisible()
    expect(
      screen.getByText(/not a guaranteed Critical result or a compliance finding/)
    ).toBeVisible()
    expect(screen.getByText(/an illustrative Low result does not establish/)).toBeVisible()
    expect(
      screen.queryByText(/already in adversary archives|composite score ≥ 85|below 33/)
    ).toBeNull()
    const buttons = screen.getAllByRole('button', { name: 'Load & Run' })
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[3])
    expect(setConfig.mock.calls).toEqual([[{ step: 0 }], [{ step: 0 }]])
    expect(navigate).toHaveBeenCalledTimes(2)
  })

  it('exhibits scoped High results and a changed-weight Critical result using the unchanged real model', () => {
    const asset: DataAsset = {
      id: 'explicit-fictional-hospital',
      name: 'Sample records',
      assetType: 'data-store',
      sensitivityTier: 'high',
      retentionPeriod: '25-plus',
      currentEncryption: 'RSA-2048',
      businessOwner: 'Sample owner',
      industry: 'Healthcare',
      complianceFlags: ['HIPAA'],
    }
    // Independent hand arithmetic: 75×.30 +95×.25 +20×.25 +100×.20 =71.25.
    const oneFlag = scoreAsset(asset, DEFAULT_SCORING_WEIGHTS, 2034)
    expect(oneFlag.compositeScore).toBe(71)
    expect(getPriorityBand(oneFlag.compositeScore).label).toBe('High')
    // A second non-urgent flag changes only20→40 in the compliance contribution:76.25.
    const twoFlags = scoreAsset(
      { ...asset, complianceFlags: ['HIPAA', 'NIST-IR-8547'] },
      DEFAULT_SCORING_WEIGHTS,
      2034
    )
    expect(twoFlags.compositeScore).toBe(76)
    expect(getPriorityBand(twoFlags.compositeScore).label).toBe('High')
    const changedWeights = scoreAsset(
      asset,
      { sensitivity: 0, retention: 50, compliance: 0, hndlWindow: 50 },
      2034
    )
    expect(changedWeights.compositeScore).toBe(98) //95×.5+100×.5=97.5, rounded.
    expect(getPriorityBand(changedWeights.compositeScore).label).toBe('Critical')
    expect(computeHndlRiskYear('25-plus', 2034)).toBe(2004)
    expect(computeHndlRiskYear('25-plus', 2044)).toBe(2014)
    // These input records contain no collection timestamp or evidence of capture.
  })
})
