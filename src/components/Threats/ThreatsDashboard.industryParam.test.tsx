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
import { INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'
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
      usePersonaStore.getState().setIndustries([])
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

describe('ThreatsDashboard Cross-Industry toggle (UX-4)', () => {
  const sector = threatsData.find((t) => t.industry !== 'Cross-Industry')!.industry
  const inSector = threatsData.filter((t) => t.industry === sector).length
  const cross = threatsData.filter((t) => t.industry === 'Cross-Industry').length

  it.runIf(cross > 0)(
    'adds the Cross-Industry records to a sector view, and ?cross=1 keeps it',
    () => {
      render(
        <MemoryRouter initialEntries={[`/threats?industry=${encodeURIComponent(sector)}`]}>
          <ThreatsDashboard />
        </MemoryRouter>
      )
      expect(shownCount()).toBe(inSector)
      act(() => {
        screen.getByRole('button', { name: new RegExp(`Include ${cross} Cross-Industry`) }).click()
      })
      expect(shownCount()).toBe(inSector + cross)
    }
  )

  it.runIf(cross > 0)('?cross=1 on arrival includes them', () => {
    render(
      <MemoryRouter initialEntries={[`/threats?industry=${encodeURIComponent(sector)}&cross=1`]}>
        <ThreatsDashboard />
      </MemoryRouter>
    )
    expect(shownCount()).toBe(inSector + cross)
  })
})

describe('ThreatsDashboard follows the top-bar sector (UX-2)', () => {
  it('narrows to a sector picked in the store after load', () => {
    const [sector, mapped] = Object.entries(INDUSTRY_TO_THREATS_MAP).find(([, inds]) =>
      inds.some((ind) => threatsData.some((t) => t.industry === ind))
    )!
    const expected = threatsData.filter((t) => mapped.includes(t.industry)).length
    render(
      <MemoryRouter initialEntries={['/threats']}>
        <ThreatsDashboard />
      </MemoryRouter>
    )
    expect(shownCount()).toBe(threatsData.length)
    act(() => usePersonaStore.getState().setIndustries([sector]))
    expect(shownCount()).toBe(expected)
  })
})

describe('ThreatsDashboard review fixes', () => {
  afterEach(() => act(() => usePersonaStore.getState().setIndustries([])))

  it('a mixed ?industry= list filters to the published sector with no notice', () => {
    const awaiting = [...knownThreatIndustries].find(
      (ind) => !threatsData.some((t) => t.industry === ind)
    )
    if (!awaiting) return
    const published = threatsData[0].industry
    render(
      <MemoryRouter
        initialEntries={[`/threats?industry=${encodeURIComponent(`${published},${awaiting}`)}`]}
      >
        <ThreatsDashboard />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('deeplink-notice-not-found')).toBeNull()
    expect(shownCount()).toBe(threatsData.filter((t) => t.industry === published).length)
  })

  it('a ?cross=1 link to a Cross-Industry threat is not "widened"', () => {
    const crossThreat = threatsData.find((t) => t.industry === 'Cross-Industry')
    const sector = threatsData.find((t) => t.industry !== 'Cross-Industry')!.industry
    if (!crossThreat) return
    render(
      <MemoryRouter
        initialEntries={[
          `/threats?industry=${encodeURIComponent(sector)}&cross=1&id=${crossThreat.threatId}`,
        ]}
      >
        <ThreatsDashboard />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('deeplink-notice-widened')).toBeNull()
  })

  it('Undo after a deep-link widen keeps a sector seeded from the store', async () => {
    const [sector, mapped] = Object.entries(INDUSTRY_TO_THREATS_MAP).find(([, inds]) =>
      inds.some((ind) => threatsData.some((t) => t.industry === ind))
    )!
    const outside = threatsData.find((t) => !mapped.includes(t.industry))!
    const seeded = threatsData.filter((t) => mapped.includes(t.industry)).length
    act(() => usePersonaStore.getState().setIndustries([sector]))
    render(
      <MemoryRouter initialEntries={[`/threats?id=${outside.threatId}`]}>
        <ThreatsDashboard />
      </MemoryRouter>
    )
    const undo = await screen.findByRole('button', { name: 'Undo' })
    act(() => undo.click())
    expect(shownCount()).toBe(seeded)
  })
})
