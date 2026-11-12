// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AerospaceExercises } from './AerospaceExercises'
import { AvionicsProtocolAnalyzer } from '../workshop/AvionicsProtocolAnalyzer'
import { SatelliteLinkBudgetCalculator } from '../workshop/SatelliteLinkBudgetCalculator'
import { FleetInteroperabilityMatrix } from '../workshop/FleetInteroperabilityMatrix'
import { MissionCryptoLifecyclePlanner } from '../workshop/MissionCryptoLifecyclePlanner'
import { AIRCRAFT_TYPES } from '../data/fleetData'
import { AVIONICS_PROTOCOLS } from '../data/aerospaceProtocolData'
import { ORBIT_PROFILES, calculateKeyRefreshInterval } from '../data/orbitData'

vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
function exercises() {
  return render(
    <MemoryRouter>
      <AerospaceExercises onNavigateToWorkshop={vi.fn()} />
    </MemoryRouter>
  )
}

describe('Aerospace exercises match their actual sample models', () => {
  it('keeps signature-only ACARS block counts and no unsupported LMS ranking', () => {
    const acars = AVIONICS_PROTOCOLS.find((p) => p.id === 'acars')!
    const view = render(<AvionicsProtocolAnalyzer />)
    for (const [name, bytes] of [
      ['ML-DSA-65', acars.pqcOverhead.mldsa65Bytes],
      ['ML-DSA-44', acars.pqcOverhead.mldsa44Bytes],
      ['LMS (H10/W4)', acars.pqcOverhead.lmsBytes],
    ] as const) {
      expect(screen.getByText(name)).toBeInTheDocument()
      expect(
        screen.getByText(`${Math.ceil(bytes / acars.maxPayloadBytes)} blocks`)
      ).toBeInTheDocument()
    }
    expect(acars.pqcOverhead.mldsa44Bytes).toBeLessThan(acars.pqcOverhead.lmsBytes)
    view.unmount()
    exercises()
    expect(
      screen.getByText(/16 blocks for ML-DSA-65, 11 for ML-DSA-44 and 12 for LMS/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/LMS.*most practical/i)).not.toBeInTheDocument()
  })
  it('compares actual GEO propagation and sub-hour solar-maximum refresh outcomes', () => {
    const geo = ORBIT_PROFILES.find((p) => p.id === 'geo')!
    const bound = calculateKeyRefreshInterval(geo.seuRatePerBitDay, 1184 * 8)
    const view = render(<SatelliteLinkBudgetCalculator />)
    expect(screen.getByText(`≈${bound.toFixed(2)} hours`)).toBeInTheDocument()
    expect(screen.getByText(String(Math.ceil(24 / bound)))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Solar:/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Solar Maximum' }))
    expect(screen.getByText('≈15 min 12.2 s')).toBeInTheDocument()
    expect(screen.getByText(String(Math.ceil(24 / (bound / 10))))).toBeInTheDocument()
    expect(3 * geo.typicalRTTms).toBe(1800)
    view.unmount()
    exercises()
    expect(screen.getByText(/3 x 600 ms gives a 1.8-second/)).toBeInTheDocument()
    expect(
      screen.getByText(/rather than substituting fixed 4-8-hour intervals/)
    ).toBeInTheDocument()
  })
  it('matches the three-model fleet denominator, with zero and full-capable counterexamples', () => {
    const selected = AIRCRAFT_TYPES.filter((a) => ['b737-800', 'a320neo', 'a350'].includes(a.id))
    const total = selected.reduce((n, a) => n + a.fleetSizeEstimate, 0)
    const capable = selected
      .filter((a) => ['native', 'retrofit'].includes(a.pqcUpgradeFeasibility))
      .reduce((n, a) => n + a.fleetSizeEstimate, 0)
    expect([total, capable, Math.round(capable * 0.3)]).toEqual([8600, 4100, 1230])
    const view = render(<FleetInteroperabilityMatrix />)
    const share = Math.round((Math.round(capable * 0.3) / total) * 100)
    expect(screen.getByText(`${share}%`)).toBeInTheDocument()
    expect(screen.getByText(`${100 - share}%`)).toBeInTheDocument()
    fireEvent.change(
      screen.getByRole('slider', { name: 'PQC deployment, percent of capable fleet' }),
      { target: { value: '0' } }
    )
    expect(screen.getByText('100%')).toBeInTheDocument()
    fireEvent.change(
      screen.getByRole('slider', { name: 'PQC deployment, percent of capable fleet' }),
      { target: { value: '100' } }
    )
    expect(screen.getByText(`${Math.round((capable / total) * 100)}%`)).toBeInTheDocument()
    view.unmount()
    exercises()
    expect(screen.getByText(/1,230.*14%.*86%/)).toBeInTheDocument()
    expect(screen.queryByText(/70% of air-ground messages/)).not.toBeInTheDocument()
  })
  it('uses the actual mission selection window and operational overlap for the stated inputs', () => {
    const view = render(<MissionCryptoLifecyclePlanner />)
    fireEvent.change(screen.getByRole('slider', { name: 'Assumed CRQC Year' }), {
      target: { value: '2035' },
    })
    expect(screen.getByText('8 yr modeled overlap')).toBeInTheDocument()
    expect(screen.getByText('Algorithm Selection (2025–2026)')).toBeInTheDocument()
    expect(screen.getByText('Crypto Library Integration (2026–2027)')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'Launch / Delivery Year' }), {
      target: { value: '2029' },
    })
    expect(screen.getByText('Algorithm Selection (2026–2027)')).toBeInTheDocument()
    expect(screen.getByText('9 yr modeled overlap')).toBeInTheDocument()
    view.unmount()
    exercises()
    expect(
      screen.getByText(/algorithm selection.*2025-2026.*integration.*2026-2027/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/All crypto must be PQC from launch day/)).not.toBeInTheDocument()
  })
  it('preserves the existing step-only Load & Run callbacks', () => {
    const navigate = vi.fn(),
      config = vi.fn()
    render(
      <MemoryRouter>
        <AerospaceExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={config} />
      </MemoryRouter>
    )
    const buttons = screen.getAllByRole('button', { name: /Load & Run/ })
    buttons.forEach((button, step) => {
      if (![0, 1, 3, 5].includes(step)) return
      fireEvent.click(button)
      expect(config).toHaveBeenLastCalledWith({ step })
    })
    expect(navigate).toHaveBeenCalledTimes(4)
  })
})
