// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { AutomotivePQCExercises } from './AutomotivePQCExercises'
import { OTAOrchestrationPlanner } from '../workshop/OTAOrchestrationPlanner'
import { readFileSync } from 'node:fs'
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
    expect(metrics.signatureOverheadMB).toBe((107840 * 6) / (1024 * 1024))
    expect(metrics.signatureOverheadMB).toBe(0.6170654296875)
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
    const observation = screen.getByText(/For the planner’s default target set/)
    expect(observation).toHaveTextContent('read Total Firmware, Sig Overhead, and Critical Path')
    expect(observation).toHaveTextContent('illustrative calculations')
    expect(observation).toHaveTextContent('not measured benchmarks')
    expect(observation).not.toHaveTextContent(/\$\{|defaultOtaMetrics|DEFAULT_CAMPAIGN_TARGETS/)
    // This instructional paragraph is also consumed as plain text; it must be
    // complete without evaluating JavaScript expressions.
    const source = readFileSync(
      'src/components/PKILearning/modules/AutomotivePQC/components/AutomotivePQCExercises.tsx',
      'utf8'
    )
    const ota = source.slice(source.indexOf("id: 'fleet-ota-pqc-campaign'"))
    const literal = ota.match(/observe:\s*'((?:[^'\\]|\\.)+)'/)
    expect(observation.textContent).toBe(`What to observe: ${literal?.[1]}`)
    expect(literal?.[1]).not.toMatch(/\$\{|defaultOtaMetrics|DEFAULT_CAMPAIGN_TARGETS/)
    expect(observation).not.toHaveTextContent(
      /1M-vehicle|200 MB|<0.01%|72 bytes|gates all downstream/
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[4])
    expect(configure).toHaveBeenCalledExactlyOnceWith({ step: 3 })
    expect(navigate).toHaveBeenCalledExactlyOnceWith()
  })
  it('keeps the computed default figures in the existing planner metrics', () => {
    render(<OTAOrchestrationPlanner />)
    const mlDsa = SIGNATURE_OVERHEADS.find((entry) => entry.algorithm === 'ML-DSA-65')!
    const actual = computeCampaignMetrics(DEFAULT_CAMPAIGN_TARGETS, 100_000, mlDsa)
    expect(screen.getByText(String(actual.totalFirmwareSizeMB))).toBeVisible()
    expect(screen.getByText(`${(actual.signatureOverheadMB * 1024).toFixed(1)} KiB`)).toBeVisible()
    expect(screen.getByText(String(actual.criticalPathMinutes))).toBeVisible()
  })
})
