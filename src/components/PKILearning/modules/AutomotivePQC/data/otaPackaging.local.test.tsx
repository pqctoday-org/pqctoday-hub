// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  SIGNATURE_OVERHEADS,
  DEFAULT_CAMPAIGN_TARGETS,
  computeCampaignMetrics,
} from './otaOrchestrationData'
import { OTAOrchestrationPlanner } from '../workshop/OTAOrchestrationPlanner'

const expectedBytes = [2081, 8448, 78752, 107840, 80440, 22209]

describe('common illustrative OTA packaging policy', () => {
  it('applies the approved component totals to every algorithm without intermediate rounding', () => {
    expect(SIGNATURE_OVERHEADS).toHaveLength(expectedBytes.length)
    SIGNATURE_OVERHEADS.forEach((entry, index) => {
      expect(entry.signaturesPerPackage).toBe(32)
      expect(entry.totalOverheadKB * 1024).toBe(expectedBytes[index])
    })
  })

  it.each([1, 2])(
    'uses the same selected estimate for %i target packages and fleet scaling',
    (count) => {
      const targets = DEFAULT_CAMPAIGN_TARGETS.slice(0, count)
      const selected = SIGNATURE_OVERHEADS[3]
      const perVehicleMiB = (107840 * count) / (1024 * 1024)
      for (const fleet of [1, 100000]) {
        const actual = computeCampaignMetrics(targets, fleet, selected)
        expect(actual.signatureOverheadMB).toBe(perVehicleMiB)
        const firmwareMiB = targets.reduce((sum, target) => sum + target.firmwareSizeMB, 0)
        expect(actual.totalBandwidthGB).toBe(((firmwareMiB + perVehicleMiB) * fleet) / 1024)
      }
    }
  )

  it('shows the common assumption in both comparison views and retains selection and fleet controls', () => {
    render(<OTAOrchestrationPlanner />)
    expect(screen.getAllByText(/Illustrative component model: 32 signatures/)).toHaveLength(2)
    for (const bytes of expectedBytes) {
      expect(screen.getAllByText(`${(bytes / 1024).toFixed(2)} KiB`).length).toBeGreaterThanOrEqual(
        2
      )
    }
    fireEvent.click(screen.getByRole('button', { name: /RSA-2048/ }))
    // The campaign summary uses the same exact component model.
    expect(
      screen.getByText(`${((8448 * DEFAULT_CAMPAIGN_TARGETS.length) / 1024).toFixed(1)} KiB`)
    ).toBeVisible()
    expect(screen.getByRole('slider', { name: 'Fleet size' })).toBeVisible()
    expect(screen.getByText(/Illustrative ideal transfer estimate/)).toBeVisible()
  })
})
