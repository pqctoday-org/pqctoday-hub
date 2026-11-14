// SPDX-License-Identifier: AGPL-3.0-only
/**
 * NAV-1 (4.208): removing ?industry= on the same route (Back, or a link to
 * plain /threats) clears the industry filter, while a sector seeded from the
 * persona store on mount — which never writes the URL — is left alone.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { knownThreatIndustries, threatsData } from '@/data/threatsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ThreatsDashboard } from './ThreatsDashboard'

vi.mock('./ThreatDetailDialog', () => ({ ThreatDetailDialog: () => null }))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

let navigate: ReturnType<typeof useNavigate> | null = null
function Probe() {
  const nav = useNavigate()
  useEffect(() => {
    navigate = nav
  }, [nav])
  return null
}

const shownCount = () => {
  const el = screen.getByText(/^Showing/, { selector: 'span' })
  return Number(el.querySelector('span')?.textContent)
}

describe('ThreatsDashboard ?industry= sync (NAV-1)', () => {
  afterEach(() => {
    act(() => {
      usePersonaStore.getState().setPersona(null)
      usePersonaStore.getState().setIndustries?.([])
    })
  })

  it('clears the industry filter when a same-route navigation drops ?industry=', async () => {
    const industry = threatsData[0].industry
    const inIndustry = threatsData.filter((t) => t.industry === industry).length
    render(
      <MemoryRouter initialEntries={[`/threats?industry=${encodeURIComponent(industry)}`]}>
        <ThreatsDashboard />
        <Probe />
      </MemoryRouter>
    )
    expect(shownCount()).toBe(inIndustry)
    await act(async () => {
      navigate?.('/threats')
    })
    expect(shownCount()).toBe(threatsData.length)
  })
})

describe('ThreatsDashboard sectors awaiting a source (NAV-2)', () => {
  const awaiting = [...knownThreatIndustries].filter(
    (ind) => !threatsData.some((t) => t.industry === ind)
  )

  it.runIf(awaiting.length > 0)(
    'a link to a sector with no published threat says so instead of silently showing all',
    () => {
      render(
        <MemoryRouter initialEntries={[`/threats?industry=${encodeURIComponent(awaiting[0])}`]}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(
        `No published threats for ${awaiting[0]} yet`
      )
      expect(shownCount()).toBe(threatsData.length)
    }
  )

  it('a link to a sector with published threats shows no such notice', () => {
    render(
      <MemoryRouter
        initialEntries={[`/threats?industry=${encodeURIComponent(threatsData[0].industry)}`]}
      >
        <ThreatsDashboard />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('deeplink-notice-not-found')).toBeNull()
  })
})
