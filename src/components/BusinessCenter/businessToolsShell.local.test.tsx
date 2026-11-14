// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Business tools catalogue shell: the start-here strip only on the unfiltered
 * view, the tool page's back button returning to the filtered catalogue it came
 * from, and the phone catalogue matching desktop (worked example, persona order).
 */
import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import { BusinessToolsGrid } from './BusinessToolsGrid'
import { BusinessToolRoute } from './BusinessToolRoute'
import { BUSINESS_TOOLS } from './businessToolsRegistry'
import { businessToolsBackHref } from './lib/businessToolsBackLink'
import { businessToolRank } from '@/data/businessToolRank'
import { MobileBusinessToolsView } from '@/components/Mobile/screens/MobileBusinessToolsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getBusinessRoleSequence } from '@/data/businessRoleConfig'

vi.mock('@/utils/analytics', () => ({
  logBusinessToolsSearch: vi.fn(),
  logBusinessToolsFilter: vi.fn(),
  logBusinessToolOpen: vi.fn(),
}))

const START_HEADING = getBusinessRoleSequence(null).heading

const UrlProbe = () => {
  const loc = useLocation()
  return <output data-testid="url">{`${loc.pathname}${loc.search}`}</output>
}

function renderShell(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/business/tools" element={<BusinessToolsGrid />} />
        <Route path="/business/tools/:toolId" element={<BusinessToolRoute />} />
      </Routes>
      <UrlProbe />
    </MemoryRouter>
  )
}

afterEach(() => {
  act(() => usePersonaStore.setState({ selectedPersona: null }))
})

describe('start-here strip', () => {
  it('shows on the unfiltered catalogue', () => {
    renderShell('/business/tools')
    expect(screen.getByText(START_HEADING)).toBeInTheDocument()
  })

  it.each(['zone=governance', 'phase=p0', 'audience=architect'])(
    'is hidden when the %s filter is active',
    (query) => {
      renderShell(`/business/tools?${query}`)
      expect(screen.queryByText(START_HEADING)).not.toBeInTheDocument()
    }
  )
})

describe('back to the catalogue', () => {
  it('returns to the filtered view the tool was opened from', () => {
    renderShell('/business/tools?audience=business&group=phase')
    const raci = BUSINESS_TOOLS.find((t) => t.id === 'raci-builder')!
    fireEvent.click(screen.getAllByRole('link', { name: new RegExp(raci.name) })[0]!)
    expect(screen.getByTestId('url').textContent).toBe('/business/tools/raci-builder')
    fireEvent.click(screen.getByRole('button', { name: /All Tools/ }))
    expect(screen.getByTestId('url').textContent).toBe(
      '/business/tools?audience=business&group=phase'
    )
  })

  it('goes to the plain catalogue for a deep link', () => {
    renderShell('/business/tools/raci-builder')
    fireEvent.click(screen.getByRole('button', { name: /All Tools/ }))
    expect(screen.getByTestId('url').textContent).toBe('/business/tools')
  })

  it('accepts only a query string from router state', () => {
    expect(businessToolsBackHref({ fromToolsSearch: '?cat=x' })).toBe('/business/tools?cat=x')
    expect(businessToolsBackHref({ fromToolsSearch: '//evil.example' })).toBe('/business/tools')
    expect(businessToolsBackHref({ fromToolsSearch: 42 })).toBe('/business/tools')
    expect(businessToolsBackHref(null)).toBe('/business/tools')
  })
})

describe('phone catalogue parity', () => {
  it('shows the worked example in the tool detail sheet', () => {
    render(
      <MemoryRouter>
        <MobileBusinessToolsView />
      </MemoryRouter>
    )
    const tool = BUSINESS_TOOLS.find((t) => t.id === 'raci-builder')!
    expect(tool.workedExample).toBeTruthy()
    fireEvent.click(screen.getByText(tool.name).closest('button')!)
    const sheet = screen.getByTestId('business-tool-detail-sheet')
    expect(within(sheet).getByText(/Worked example:/)).toBeInTheDocument()
    expect(
      within(sheet).getByText((c) => c.includes(tool.workedExample!.slice(0, 40)))
    ).toBeInTheDocument()
  })

  it('orders tools by the same persona rank as the desktop grid', () => {
    act(() => usePersonaStore.setState({ selectedPersona: 'executive' }))
    render(
      <MemoryRouter>
        <MobileBusinessToolsView />
      </MemoryRouter>
    )
    const sequence = getBusinessRoleSequence('executive')
    const names = Array.from(document.querySelectorAll('article button span.font-bold')).map(
      (el) => el.textContent
    )
    const ranks = names.map((name) =>
      businessToolRank(
        BUSINESS_TOOLS.find((t) => t.name === name)!,
        'executive',
        sequence
      )
    )
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(names[0]).toBe(BUSINESS_TOOLS.find((t) => t.id === sequence.steps[0]!.id)!.name)
  })
})
