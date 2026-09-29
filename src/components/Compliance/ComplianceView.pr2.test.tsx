// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 2 (2026-09-29): For You's framework pop-up is `?framework=`,
// and its cross-references link to their own pages' params.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceView } from './ComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { complianceFrameworks } from '@/data/complianceData'
import { libraryData } from '@/data/libraryData'

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

vi.mock('./services', () => ({
  useComplianceRefresh: () => ({
    data: [],
    loading: false,
    error: null,
    lastUpdated: new Date('2026-02-17'),
    meta: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('../../utils/analytics', () => ({
  logComplianceFilter: vi.fn(),
  logPreviewBannerShown: vi.fn(),
  logPreviewBannerDismissed: vi.fn(),
}))

// A framework with a linked library document, so the "Open in Library" link renders.
const FW = complianceFrameworks.find((f) =>
  libraryData.some((d) => f.libraryRefs.includes(d.referenceId))
)!

vi.mock('../applicability/ApplicabilityPanel', async () => {
  const { Button } = await import('@/components/ui/button')
  return {
    ApplicabilityPanel: ({
      onSelectFramework,
    }: {
      onSelectFramework: (fw: (typeof complianceFrameworks)[number]) => void
    }) => (
      <Button type="button" onClick={() => onSelectFramework(FW)}>
        stub-open-framework
      </Button>
    ),
  }
})

function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}
const urlParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ComplianceView />
      <LocationProbe />
    </MemoryRouter>
  )
}

const popoverTitle = () => document.getElementById('framework-popover-title')

describe('For You framework pop-up', () => {
  beforeEach(() => {
    window.localStorage.clear()
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
  })

  it('opening pushes ?framework= and shows the pop-up (not the Landscape drawer)', () => {
    renderAt('/compliance?tab=foryou')
    fireEvent.click(screen.getByRole('button', { name: 'stub-open-framework' }))
    expect(urlParams().get('framework')).toBe(FW.id)
    expect(popoverTitle()).toHaveTextContent(FW.label)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  }, 15000)

  it('a shared link reopens it, and closing clears the param', () => {
    renderAt(`/compliance?tab=foryou&framework=${encodeURIComponent(FW.id)}`)
    expect(popoverTitle()).toHaveTextContent(FW.label)
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(urlParams().get('framework')).toBeNull()
    expect(popoverTitle()).toBeNull()
  }, 15000)

  it('links each library cross-reference to /library?ref=', () => {
    renderAt(`/compliance?tab=foryou&framework=${encodeURIComponent(FW.id)}`)
    const doc = libraryData.find((d) => FW.libraryRefs.includes(d.referenceId))!
    const link = screen.getByRole('link', { name: `Open ${doc.documentTitle} in Library` })
    expect(link).toHaveAttribute('href', `/library?ref=${encodeURIComponent(doc.referenceId)}`)
  }, 15000)
})

describe('Requirements / Products params through the page', () => {
  beforeEach(() => {
    window.localStorage.clear()
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
  })

  it('?reqfw= alone opens the Requirements tab; leaving the tab drops it', () => {
    renderAt(`/compliance?reqfw=${encodeURIComponent(FW.id)}`)
    expect(screen.getByRole('tab', { name: /Requirements/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    fireEvent.click(screen.getByRole('tab', { name: /Progress/ }))
    expect(urlParams().get('reqfw')).toBeNull()
    expect(urlParams().get('tab')).toBe('progress')
  }, 15000)

  it('?prod= alone opens the Products tab', () => {
    renderAt('/compliance?prod=no-such-product')
    expect(screen.getByRole('tab', { name: /Products/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-product')
  }, 15000)
})
