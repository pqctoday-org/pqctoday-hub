// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { AutomotivePQCExercises } from './AutomotivePQCExercises'
import {
  computeCampaignMetrics,
  DEFAULT_CAMPAIGN_TARGETS,
  SIGNATURE_OVERHEADS,
} from '../data/otaOrchestrationData'

describe('OTA exercise default-model scope', () => {
  it('independently computes the six-target teaching fixture', () => {
    const mlDsa = SIGNATURE_OVERHEADS.find((entry) => entry.algorithm === 'ML-DSA-65')!
    const metrics = computeCampaignMetrics(DEFAULT_CAMPAIGN_TARGETS, 1, mlDsa)
    expect(DEFAULT_CAMPAIGN_TARGETS).toHaveLength(6)
    expect(metrics.totalFirmwareSizeMB).toBe(32 + 64 + 256 + 512 + 16 + 8)
    expect(metrics.signatureOverheadMB).toBe((107.8 * 6) / 1024)
    expect(metrics.signatureOverheadMB).toBe(0.631640625)
    expect(metrics.criticalPathMinutes).toBe(15 + 45)
  })
  it('describes only the default fixture while preserving the step-only callback', () => {
    const configure = vi.fn()
    const navigate = vi.fn()
    render(
      <MemoryRouter>
        <AutomotivePQCExercises onSetWorkshopConfig={configure} onNavigateToWorkshop={navigate} />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /^4\. Fleet OTA Campaign/ })).toBeInTheDocument()
    expect(screen.getByText(/Open the OTA Orchestration Planner/)).toHaveTextContent(
      'without resetting your current fleet size or signature selection'
    )
    const observation = screen.getByText(/For the default 6-target sample/)
    const mlDsa = SIGNATURE_OVERHEADS.find((entry) => entry.algorithm === 'ML-DSA-65')!
    const actual = computeCampaignMetrics(DEFAULT_CAMPAIGN_TARGETS, 1, mlDsa)
    expect(observation).toHaveTextContent(`${actual.totalFirmwareSizeMB} MB of firmware`)
    expect(observation).toHaveTextContent(
      `${actual.signatureOverheadMB.toFixed(3)} MB of signature overhead per vehicle`
    )
    expect(observation).toHaveTextContent(`${actual.criticalPathMinutes} minutes`)
    expect(observation).toHaveTextContent('illustrative calculations, not measured benchmarks')
    expect(observation).not.toHaveTextContent(
      /1M-vehicle|200 MB|<0.01%|72 bytes|gates all downstream/
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[4])
    expect(configure).toHaveBeenCalledExactlyOnceWith({ step: 3 })
    expect(navigate).toHaveBeenCalledExactlyOnceWith()
  })
})
