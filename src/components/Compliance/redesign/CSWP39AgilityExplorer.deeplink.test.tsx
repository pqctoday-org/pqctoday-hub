// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 2 (2026-09-29): `?cswpview=`, `?step=`, `?mtier=`, `?dossier=`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { CSWP39AgilityExplorer } from './CSWP39AgilityExplorer'
import { resolveCswp39View } from './cswp39RedesignData'
import type { Cswp39Params } from '../useComplianceUrlState'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('../MaturityEvidenceGrid', () => ({
  MaturityEvidenceGrid: () => <div data-testid="evidence-grid-stub" />,
}))

describe('resolveCswp39View', () => {
  it('defaults to the cycle, step 1, tier 2, no dossier', () => {
    expect(resolveCswp39View({})).toEqual({
      view: 'cycle',
      step: 'govern',
      tier: 2,
      dossier: null,
    })
  })
  it('lets each param pick its view when cswpview is absent', () => {
    expect(resolveCswp39View({ mtier: '3' }).view).toBe('maturity')
    expect(resolveCswp39View({ dossier: 'pci' }).view).toBe('evidence')
    expect(resolveCswp39View({}, 'CMMC-2.0-MODEL').view).toBe('evidence')
    expect(resolveCswp39View({ step: 'inventory' }).view).toBe('cycle')
  })
  it('an explicit cswpview wins', () => {
    expect(resolveCswp39View({ cswpview: 'cycle', dossier: 'pci' }, 'X').view).toBe('cycle')
  })
  it('ignores unknown values', () => {
    expect(
      resolveCswp39View({ cswpview: 'nope', step: 'nope', mtier: '9', dossier: 'nope' })
    ).toEqual({ view: 'cycle', step: 'govern', tier: 2, dossier: null })
  })
})

function mountExplorer(params: Cswp39Params, onParamsChange = vi.fn(), evref?: string) {
  render(
    <MemoryRouter>
      <CSWP39AgilityExplorer params={params} onParamsChange={onParamsChange} evref={evref} />
    </MemoryRouter>
  )
  return onParamsChange
}

describe('CSWP39AgilityExplorer URL state', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: null })
  })

  it('opens the linked step', () => {
    mountExplorer({ step: 'inventory' })
    expect(screen.getByRole('heading', { level: 3, name: 'Inventory' })).toBeInTheDocument()
  })

  it('writes the step and the sub-view (replace)', () => {
    const spy = mountExplorer({})
    fireEvent.click(screen.getByRole('button', { name: /Identify Gaps/ }))
    expect(spy).toHaveBeenLastCalledWith({ step: 'identify-gaps' }, undefined)
    fireEvent.click(screen.getByRole('tab', { name: 'Maturity self-check' }))
    expect(spy).toHaveBeenLastCalledWith({ cswpview: 'maturity' }, undefined)
  })

  it('opens the maturity tier from ?mtier= and writes a tier pick', () => {
    const spy = mountExplorer({ cswpview: 'maturity', mtier: '4' })
    expect(screen.getByText('Top tier reached')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tier 1/ }))
    expect(spy).toHaveBeenLastCalledWith({ mtier: '1' }, undefined)
  })

  it('opens a linked dossier; opening pushes, closing replaces', () => {
    const spy = mountExplorer({ dossier: 'pci' })
    const pci = screen.getByRole('button', { name: /PCI DSS 4.0/ })
    expect(pci).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(pci)
    expect(spy).toHaveBeenLastCalledWith({ dossier: null }, { push: false })
    fireEvent.click(screen.getByRole('button', { name: /NIS2/ }))
    expect(spy).toHaveBeenLastCalledWith({ dossier: 'nis2', cswpview: 'evidence' }, { push: true })
  })

  it('evref still shows the evidence view (PR 1)', () => {
    mountExplorer({}, vi.fn(), 'CMMC-2.0-MODEL')
    expect(screen.getByRole('tab', { name: 'Evidence map' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('keeps working without URL wiring', () => {
    render(
      <MemoryRouter>
        <CSWP39AgilityExplorer />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Maturity self-check' }))
    expect(screen.getByRole('tab', { name: 'Maturity self-check' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })
})

describe('CSWP39AgilityExplorer — "Frameworks tagged for this step"', () => {
  it('opens the framework drawer by id instead of filtering one pillar by label', () => {
    // Those rows span every pillar; the old jump (tab=compliance, lq=<label>)
    // landed on an empty table for standards and certification bodies.
    const onOpenFramework = vi.fn()
    const onNavigateToFramework = vi.fn()
    render(
      <MemoryRouter>
        <CSWP39AgilityExplorer
          params={{}}
          onParamsChange={vi.fn()}
          onOpenFramework={onOpenFramework}
          onNavigateToFramework={onNavigateToFramework}
        />
      </MemoryRouter>
    )
    const heading = screen.getByRole('heading', {
      level: 4,
      name: /Frameworks tagged for this step/,
    })
    const list = heading.nextElementSibling as HTMLElement
    const first = within(list).getAllByRole('button')[0]
    fireEvent.click(first)
    expect(onOpenFramework).toHaveBeenCalledTimes(1)
    expect(onOpenFramework.mock.calls[0][0]).toMatch(/\S/)
    expect(onNavigateToFramework).not.toHaveBeenCalled()
  })
})
