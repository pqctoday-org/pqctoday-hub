// SPDX-License-Identifier: GPL-3.0-only
/**
 * W6.3 — an embedded hub view adopts the RUN's scenario, and adopting it does
 * not rewrite the visitor's own profile.
 *
 * The audited defect: the sample Simulation displayed US/Financial in its
 * header while the embedded Compliance view asked the learner to choose an
 * industry and country again, because that view reads the global persona
 * store, which a sample run never populates.
 *
 * The fix had to be an adapter. Writing the run's scenario into usePersonaStore
 * would scope the tool correctly inside the simulation while silently changing
 * what the visitor sees everywhere else in the hub — a fictional bank in a
 * teaching scenario must not alter anyone's real preferences.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmbedRunContextProvider, useEmbedRunContext } from './embedRunContext'
import { usePersonaStore } from '@/store/usePersonaStore'
import { complianceRegionForCountry } from '@/data/jurisdictionsData'

const RUN = {
  country: 'US',
  sector: 'financial',
  size: 'mid',
  seat: 'executive',
  phase: 'p3',
  isSample: true,
}

function Probe() {
  const ctx = useEmbedRunContext()
  return <div data-testid="probe">{ctx ? `${ctx.sector}/${ctx.country}` : 'none'}</div>
}

describe('embed run context (W6.3)', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedIndustries: [], selectedRegion: 'global' })
  })

  it('is null outside a run, so a standalone route behaves exactly as before', () => {
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('none')
  })

  it('supplies the run scenario to anything rendered inside it', () => {
    render(
      <EmbedRunContextProvider value={RUN}>
        <Probe />
      </EmbedRunContextProvider>
    )
    expect(screen.getByTestId('probe').textContent).toBe('financial/US')
  })

  it('does NOT write the run scenario into the visitor’s persona store', () => {
    render(
      <EmbedRunContextProvider value={RUN}>
        <Probe />
      </EmbedRunContextProvider>
    )
    // The whole point of the adapter: a teaching scenario about a fictional
    // organisation must not change the visitor's real preferences.
    expect(usePersonaStore.getState().selectedIndustries).toEqual([])
    expect(usePersonaStore.getState().selectedRegion).toBe('global')
  })

  it('maps a run country onto a real compliance bloc', () => {
    // The compliance view filters by bloc, and the run knows a country CODE.
    expect(complianceRegionForCountry('US')).toBeTruthy()
    expect(complianceRegionForCountry('__nope__')).toBeNull()
  })
})
