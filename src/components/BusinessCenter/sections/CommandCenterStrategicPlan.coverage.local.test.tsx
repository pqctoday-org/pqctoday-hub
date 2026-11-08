// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CommandCenterStrategicPlan } from './CommandCenterStrategicPlan'
import { ZONE_ARTIFACT_TYPES } from '../lib/cswp39StepMapping'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'

function renderCoverage(types: string[]) {
  const onZoneSelect = vi.fn()
  const metrics = {
    artifactsByPillar: {
      risk: types.map((type, i) => ({ id: String(i), type, moduleId: `module-${i}` })),
      compliance: [],
      governance: [],
      vendor: [],
      inventory: [],
      architecture: [],
    },
  } as unknown as BusinessMetrics
  render(
    <CommandCenterStrategicPlan metrics={metrics} activeZone={null} onZoneSelect={onZoneSelect} />
  )
  return { onZoneSelect }
}

describe('zone artifact-type coverage', () => {
  it('counts repeated documents of one type only once without counting unrelated types', () => {
    const [first] = ZONE_ARTIFACT_TYPES.governance
    renderCoverage([first, first, first, ...ZONE_ARTIFACT_TYPES.assets])
    const zone = screen.getByRole('button', { name: /GOVERNANCE/ })
    expect(
      within(zone).getByTitle(
        `1 of ${ZONE_ARTIFACT_TYPES.governance.length} artifact types created`
      )
    ).toBeInTheDocument()
  })
  it('counts each distinct eligible type and preserves zone navigation', () => {
    const { onZoneSelect } = renderCoverage([
      ...ZONE_ARTIFACT_TYPES.governance,
      ...ZONE_ARTIFACT_TYPES.governance,
    ])
    const total = ZONE_ARTIFACT_TYPES.governance.length
    const zone = screen.getByRole('button', { name: /GOVERNANCE/ })
    expect(
      within(zone).getByTitle(`${total} of ${total} artifact types created`)
    ).toBeInTheDocument()
    fireEvent.click(zone)
    expect(onZoneSelect).toHaveBeenCalledWith('governance')
  })
  it('keeps empty coverage at zero', () => {
    renderCoverage([])
    expect(
      within(screen.getByRole('button', { name: /GOVERNANCE/ })).getByTitle(
        `0 of ${ZONE_ARTIFACT_TYPES.governance.length} artifact types created`
      )
    ).toBeInTheDocument()
  })
})
