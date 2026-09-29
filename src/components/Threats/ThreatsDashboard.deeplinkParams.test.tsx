// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link remediation PR 2: the developer protocol lens (`?protocol=`), the
 * dialog's Detection / Response tab (`?threattab=`) and the Industries TOC
 * anchors (`#industry-<slug>`) are read on load, written on click, and cleared
 * when their state resets. Real data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { threatsData } from '@/data/threatsData'
import { lensProtocolsFor, threatTouchesProtocol } from '@/data/threatProtocolLens'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ThreatsDashboard } from './ThreatsDashboard'
import { industryAnchorSlug, protocolLensSlug } from './threatsUrlParams'
import { Button } from '@/components/ui/button'

vi.mock('./ThreatDetailDialog', () => ({
  ThreatDetailDialog: ({
    threat,
    onClose,
    detailTab,
    onDetailTabChange,
  }: {
    threat: { threatId: string }
    onClose: () => void
    detailTab?: string
    onDetailTabChange?: (tab: 'detection' | 'response') => void
  }) => (
    <div role="dialog">
      {threat.threatId}
      <span data-testid="detail-tab">{detailTab}</span>
      <Button onClick={() => onDetailTabChange?.('response')}>response tab</Button>
      <Button onClick={() => onDetailTabChange?.('detection')}>detection tab</Button>
      <Button onClick={onClose}>close dialog</Button>
    </div>
  ),
}))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

const probe = {
  search: '',
  hash: '',
  navigate: null as ReturnType<typeof useNavigate> | null,
}
function Probe() {
  const { search, hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    probe.search = search
    probe.hash = hash
    probe.navigate = navigate
  }, [search, hash, navigate])
  return null
}
const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[`/threats${url}`]}>
      <ThreatsDashboard />
      <Probe />
    </MemoryRouter>
  )
const param = (k: string) => new URLSearchParams(probe.search).get(k)

const [firstLens, secondLens] = lensProtocolsFor(threatsData)

describe('ThreatsDashboard deep-link params (PR 2)', () => {
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
  })

  describe('?protocol=', () => {
    it('reads the lens on load — shown and pressed even for a non-developer', () => {
      renderAt(`?protocol=${protocolLensSlug(firstLens)}`)
      expect(screen.getByRole('button', { name: firstLens })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      // The basis line ("TLS / HTTPS: n records name it directly…") is the lens's own.
      expect(screen.getByText(`${firstLens}:`)).toBeInTheDocument()
    })

    it('writes the lens on click, switches it, and clears it on toggle-off and "clear"', async () => {
      usePersonaStore.getState().setPersona('developer')
      renderAt('')
      fireEvent.click(screen.getByRole('button', { name: firstLens }))
      await waitFor(() => expect(param('protocol')).toBe(protocolLensSlug(firstLens)))
      fireEvent.click(screen.getByRole('button', { name: secondLens }))
      await waitFor(() => expect(param('protocol')).toBe(protocolLensSlug(secondLens)))
      fireEvent.click(screen.getByRole('button', { name: secondLens }))
      await waitFor(() => expect(param('protocol')).toBeNull())
      fireEvent.click(screen.getByRole('button', { name: firstLens }))
      await waitFor(() => expect(param('protocol')).not.toBeNull())
      fireEvent.click(screen.getByRole('button', { name: 'clear' }))
      await waitFor(() => expect(param('protocol')).toBeNull())
      expect(screen.getByRole('button', { name: firstLens })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })

    it('follows a same-route link that adds or removes ?protocol=', async () => {
      usePersonaStore.getState().setPersona('developer')
      renderAt('')
      await act(async () => {
        probe.navigate?.(`/threats?protocol=${protocolLensSlug(secondLens)}`)
      })
      expect(screen.getByRole('button', { name: secondLens })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      await act(async () => {
        probe.navigate?.('/threats')
      })
      expect(screen.getByRole('button', { name: secondLens })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })

    it('ignores an unknown protocol (lens stays off, not offered to a non-developer)', () => {
      renderAt('?protocol=carrier-pigeon')
      expect(screen.queryByText(/By protocol:/)).not.toBeInTheDocument()
    })

    it('a linked threat outside the lens clears ?protocol=', async () => {
      const outside = threatsData.find((t) => !threatTouchesProtocol(t, firstLens))!
      renderAt(`?id=${outside.threatId}&protocol=${protocolLensSlug(firstLens)}`)
      expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent(
        /protocol lens/
      )
      await waitFor(() => expect(param('protocol')).toBeNull())
    })
  })

  describe('?threattab=', () => {
    const t = threatsData[0]

    it('reads the tab when the dialog opens from a link', async () => {
      renderAt(`?id=${t.threatId}&threattab=response`)
      expect(await screen.findByTestId('detail-tab', {}, { timeout: 15_000 })).toHaveTextContent(
        'response'
      )
    })

    it('falls back to detection for an unknown value', async () => {
      renderAt(`?id=${t.threatId}&threattab=bogus`)
      expect(await screen.findByTestId('detail-tab', {}, { timeout: 15_000 })).toHaveTextContent(
        'detection'
      )
    })

    it('writes the tab on click (replace) and drops it with ?id on close', async () => {
      renderAt(`?id=${t.threatId}`)
      fireEvent.click(
        await screen.findByRole('button', { name: 'response tab' }, { timeout: 15_000 })
      )
      await waitFor(() => expect(param('threattab')).toBe('response'))
      expect(screen.getByTestId('detail-tab')).toHaveTextContent('response')
      fireEvent.click(screen.getByRole('button', { name: 'close dialog' }))
      await waitFor(() => expect(param('id')).toBeNull())
      expect(param('threattab')).toBeNull()
    })
  })

  describe('#industry-<slug>', () => {
    const industry = threatsData[0].industry
    const slug = industryAnchorSlug(industry)
    const scrolledToAnchor = () =>
      (scrollIntoView.mock.contexts as HTMLElement[]).some((el) => el.id === `industry-${slug}`)

    it('scrolls an arriving industry hash into view', async () => {
      renderAt(`#industry-${slug}`)
      await waitFor(() => expect(scrolledToAnchor()).toBe(true))
    })

    it('is a no-op for an industry with no section', async () => {
      renderAt('#industry-no-such-sector')
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('the Industries TOC writes the hash', async () => {
      renderAt('')
      const tocButton = document.querySelector<HTMLElement>(
        `[data-workshop-target="threats-toc-${slug}"]`
      )
      expect(tocButton).not.toBeNull()
      fireEvent.click(tocButton!)
      await waitFor(() => expect(probe.hash).toBe(`#industry-${slug}`))
    })
  })
})
