// SPDX-License-Identifier: GPL-3.0-only
/**
 * Phase 10 item 2 (2026 pages design-plan audit) — the CSWP.39 Fig 3 zone map
 * was missing a functional "step N of 6 — iterative loop" prev/next control;
 * zone selection only worked by clicking a zone card directly. These tests
 * cover the stepper's wraparound behaviour (the master plan explicitly calls
 * this "a loop, not a linear wizard — Migration can loop back to Governance")
 * and the "no zone open" edge case.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CommandCenterStrategicPlan } from './CommandCenterStrategicPlan'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import { CSWP39_ZONE_ORDER, type ZoneId } from '@/data/cswp39ZoneData'

// The stepper and zone tiles only ever read `metrics.artifactsByPillar` (via
// getArtifactsForZone / flattenAllArtifacts) — every other BusinessMetrics
// field is irrelevant to this component, so the fixture stays minimal.
const EMPTY_METRICS = {
  artifactsByPillar: {
    risk: [],
    compliance: [],
    governance: [],
    vendor: [],
    inventory: [],
    architecture: [],
  },
} as unknown as BusinessMetrics

function renderPlan(activeZone: ZoneId | null) {
  const onZoneSelect = vi.fn()
  render(
    <CommandCenterStrategicPlan
      metrics={EMPTY_METRICS}
      activeZone={activeZone}
      onZoneSelect={onZoneSelect}
    />
  )
  return { onZoneSelect }
}

describe('CommandCenterStrategicPlan — iterative-loop stepper', () => {
  it('shows the correct step number for the active zone', () => {
    renderPlan('management-tools')
    // management-tools is index 2 in CSWP39_ZONE_ORDER → step 3 of 6.
    expect(screen.getByTestId('zone-stepper-label')).toHaveTextContent('Step 3 of 6')
  })

  it('wraps forward from the last zone (Migration) to the first (Governance)', () => {
    const { onZoneSelect } = renderPlan('migration')
    fireEvent.click(screen.getByTestId('zone-stepper-next'))
    expect(onZoneSelect).toHaveBeenCalledWith('governance')
  })

  it('wraps backward from the first zone (Governance) to the last (Migration)', () => {
    const { onZoneSelect } = renderPlan('governance')
    fireEvent.click(screen.getByTestId('zone-stepper-prev'))
    expect(onZoneSelect).toHaveBeenCalledWith('migration')
  })

  // One `it` per zone (via it.each) rather than a manual render loop inside a
  // single test — RTL's own afterEach auto-cleanup then handles unmounting
  // between cases, so no manual `cleanup()` call is needed.
  it.each(
    CSWP39_ZONE_ORDER.map((zone, i) => [
      zone,
      CSWP39_ZONE_ORDER[(i + 1) % CSWP39_ZONE_ORDER.length],
    ])
  )(
    'advances from %s to %s (CSWP39_ZONE_ORDER sequence, with wraparound)',
    (current, expectedNext) => {
      const { onZoneSelect } = renderPlan(current as ZoneId)
      fireEvent.click(screen.getByTestId('zone-stepper-next'))
      expect(onZoneSelect).toHaveBeenCalledWith(expectedNext)
    }
  )

  it('shows "No zone open" and still opens a sensible zone when nothing is active', () => {
    const { onZoneSelect } = renderPlan(null)
    expect(screen.getByTestId('zone-stepper-label')).toHaveTextContent('No zone open')

    fireEvent.click(screen.getByTestId('zone-stepper-next'))
    expect(onZoneSelect).toHaveBeenCalledWith('governance')
  })

  it('prev from "no zone open" opens Migration (the loop\'s last step)', () => {
    const { onZoneSelect } = renderPlan(null)
    fireEvent.click(screen.getByTestId('zone-stepper-prev'))
    expect(onZoneSelect).toHaveBeenCalledWith('migration')
  })

  it('reuses the same onZoneSelect callback the zone cards use directly', () => {
    const { onZoneSelect } = renderPlan('governance')
    fireEvent.click(screen.getByText('ASSETS'))
    expect(onZoneSelect).toHaveBeenCalledWith('assets')
    fireEvent.click(screen.getByTestId('zone-stepper-next'))
    expect(onZoneSelect).toHaveBeenCalledWith('assets')
  })
})
