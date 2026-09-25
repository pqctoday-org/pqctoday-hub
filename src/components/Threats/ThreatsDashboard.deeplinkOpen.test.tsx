// SPDX-License-Identifier: GPL-3.0-only
/**
 * UX-13: on the live site a /threats?id=… dialog was seen to open, close and
 * reopen on every fresh load. That cycle was not produced by this component —
 * it was a full page reload (index.html's cross-origin-isolation guard
 * reloaded every route once the PWA service worker took control; now scoped
 * to the routes that need it, src/utils/crossOriginIsolation.ts). This pins
 * the React side: for a given ?id the dialog mounts exactly once and is never
 * torn down while the page settles, including across a same-route URL update.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { threatsData } from '@/data/threatsData'
import { ThreatsDashboard } from './ThreatsDashboard'

const lifecycle = vi.hoisted(() => ({ mounts: [] as string[], unmounts: [] as string[] }))

vi.mock('./ThreatDetailDialog', () => ({
  ThreatDetailDialog: ({ threat }: { threat: { threatId: string } }) => {
    useEffect(() => {
      lifecycle.mounts.push(threat.threatId)
      return () => {
        lifecycle.unmounts.push(threat.threatId)
      }
    }, [threat.threatId])
    return <div role="dialog">{threat.threatId}</div>
  },
}))

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

let navigateRef: ReturnType<typeof useNavigate> | null = null
function NavigateProbe() {
  const navigate = useNavigate()
  useEffect(() => {
    navigateRef = navigate
  }, [navigate])
  return null
}

describe('ThreatsDashboard — ?id= opens the dialog once', () => {
  beforeEach(() => {
    lifecycle.mounts.length = 0
    lifecycle.unmounts.length = 0
  })

  it('mounts the dialog exactly once for a given ?id, and a same-route URL update does not reopen it', async () => {
    const id = threatsData[0].threatId
    render(
      <MemoryRouter initialEntries={[`/threats?id=${encodeURIComponent(id)}`]}>
        <ThreatsDashboard />
        <NavigateProbe />
      </MemoryRouter>
    )
    expect(await screen.findByRole('dialog', {}, { timeout: 15_000 })).toHaveTextContent(id)
    // Let every pending effect / lazy resolution settle.
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(lifecycle.mounts).toEqual([id])
    expect(lifecycle.unmounts).toEqual([])

    // A same-route link that keeps ?id= (e.g. adds a filter) re-runs the URL
    // sync effect; the open dialog must stay mounted, not close and reopen.
    await act(async () => {
      navigateRef?.(`/threats?id=${encodeURIComponent(id)}&criticality=High`, { replace: true })
    })
    expect(lifecycle.mounts).toEqual([id])
    expect(lifecycle.unmounts).toEqual([])
  })
})
