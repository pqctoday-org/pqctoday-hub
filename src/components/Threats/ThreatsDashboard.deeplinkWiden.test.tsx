// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link remediation PR 1: ?id= for a draft/unknown threat says so; a
 * threat hidden by the page's scoping (persona default, "My threats only",
 * link filters) widens exactly those filters with Undo; removing ?id closes
 * the dialog; and the row is scrolled to once the dialog closes. Real data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { draftThreatIndustries, threatsData } from '@/data/threatsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { PERSONA_THREATS_DEFAULT_INDUSTRIES, INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'
import { ThreatsDashboard } from './ThreatsDashboard'
import { Button } from '@/components/ui/button'

vi.mock('./ThreatDetailDialog', () => ({
  ThreatDetailDialog: ({
    threat,
    onClose,
  }: {
    threat: { threatId: string }
    onClose: () => void
  }) => (
    <div role="dialog">
      {threat.threatId}
      <Button onClick={onClose}>close dialog</Button>
    </div>
  ),
}))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

const probe = { search: '', navigate: null as ReturnType<typeof useNavigate> | null }
function Probe() {
  const { search } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    probe.search = search
    probe.navigate = navigate
  }, [search, navigate])
  return null
}
const renderAt = (qs: string) =>
  render(
    <MemoryRouter initialEntries={[`/threats${qs}`]}>
      <ThreatsDashboard />
      <Probe />
    </MemoryRouter>
  )
const param = (k: string) => new URLSearchParams(probe.search).get(k)

describe('ThreatsDashboard ?id= deep links', () => {
  const scrollIntoView = vi.fn()
  beforeEach(() => {
    scrollIntoView.mockReset()
    Element.prototype.scrollIntoView = scrollIntoView
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      {} as DOMRect,
    ] as unknown as DOMRectList)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    usePersonaStore.getState().setPersona(null)
    useBookmarkStore.setState({ showOnlyThreats: false })
  })

  it('a draft id shows a not-found notice that says it is unpublished', async () => {
    const draftId = [...draftThreatIndustries.keys()][0]
    expect(draftId, 'fixture: no drafted threat in the CSV').toBeDefined()
    renderAt(`?id=${encodeURIComponent(draftId)}`)
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent(
      /isn't published yet/
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('an unknown id shows a not-found notice', async () => {
    renderAt('?id=NOPE-999')
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('NOPE-999')
  })

  it('widens link filters that exclude the threat, and Undo restores them', async () => {
    const t = threatsData[0]
    const other = threatsData.find((x) => x.criticality !== t.criticality)!
    renderAt(`?id=${t.threatId}&criticality=${encodeURIComponent(other.criticality)}&q=zzzzzz`)
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent(t.threatId)
    await waitFor(() => expect(param('q')).toBeNull())
    expect(param('criticality')).toBeNull()
    expect(param('id')).toBe(t.threatId)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(param('q')).toBe('zzzzzz'))
    expect(param('id')).toBeNull()
  })

  it('turns off a saved "My threats only" that hides the threat', async () => {
    useBookmarkStore.setState({ showOnlyThreats: true, myThreats: [] })
    const t = threatsData[0]
    renderAt(`?id=${t.threatId}`)
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent(
      /My threats only/
    )
    expect(useBookmarkStore.getState().showOnlyThreats).toBe(false)
  })

  it("adds the threat's industry to the persona-default scope", async () => {
    usePersonaStore.getState().setPersona('executive')
    usePersonaStore.setState({ selectedIndustries: [] })
    const scope = (PERSONA_THREATS_DEFAULT_INDUSTRIES.executive ?? []).flatMap(
      (k) => INDUSTRY_TO_THREATS_MAP[k] ?? []
    )
    const outside = threatsData.find((t) => !scope.includes(t.industry))!
    renderAt(`?id=${outside.threatId}`)
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent(/default scope/)
  })

  it('removing ?id on the same route closes the dialog', async () => {
    const t = threatsData[0]
    renderAt(`?id=${t.threatId}`)
    expect(await screen.findByRole('dialog', {}, { timeout: 15_000 })).toHaveTextContent(t.threatId)
    await act(async () => {
      probe.navigate?.('/threats', { replace: true })
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('scrolls to the linked row once the dialog closes', async () => {
    const t = threatsData[0]
    renderAt(`?id=${t.threatId}`)
    fireEvent.click(
      await screen.findByRole('button', { name: 'close dialog' }, { timeout: 15_000 })
    )
    await waitFor(() =>
      expect(
        (scrollIntoView.mock.contexts as HTMLElement[]).some(
          (el) => el.getAttribute('data-deeplink-id') === t.threatId
        )
      ).toBe(true)
    )
  })
})
