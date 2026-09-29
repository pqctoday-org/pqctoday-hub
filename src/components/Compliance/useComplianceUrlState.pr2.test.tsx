// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 2 (2026-09-29): tab-scoped item params (`reqfw`, `prod`, the
// CSWP.39 sub-view params), the stuck `?industry=` alias, Landscape's own
// `lq` / `lsort`, legacy `?tab=` values, and the dead `?page=`.
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate, useNavigationType } from 'react-router'
import type { ReactNode } from 'react'
import { impliedTabFor, normalizeTab, useComplianceUrlState } from './useComplianceUrlState'
import { usePersonaStore } from '@/store/usePersonaStore'

function at(url: string) {
  return renderHook(
    () => ({
      state: useComplianceUrlState(),
      location: useLocation(),
      navType: useNavigationType(),
      navigate: useNavigate(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      ),
    }
  )
}

type Rendered = ReturnType<typeof at>['result']
const url = (r: Rendered) => new URLSearchParams(r.current.location.search)

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
})

describe('impliedTabFor / normalizeTab', () => {
  it('maps each item param to its tab', () => {
    expect(impliedTabFor(new URLSearchParams('reqfw=DORA'))).toBe('requirements')
    expect(impliedTabFor(new URLSearchParams('prod=p1'))).toBe('products')
    for (const k of ['cswpview=maturity', 'step=inventory', 'mtier=3', 'dossier=pci']) {
      expect(impliedTabFor(new URLSearchParams(k))).toBe('cswp39')
    }
    expect(impliedTabFor(new URLSearchParams('q=x'))).toBeNull()
  })

  it('maps legacy tab names to the Landscape pillar and drops unknown ones', () => {
    expect(normalizeTab('landscape')).toBe('standards')
    expect(normalizeTab('frameworks')).toBe('standards')
    expect(normalizeTab('records')).toBe('records')
    expect(normalizeTab('bogus')).toBeNull()
    expect(normalizeTab(null)).toBeNull()
  })
})

describe('?reqfw=', () => {
  it('implies the Requirements tab when ?tab= is absent', () => {
    const { result } = at('/compliance?reqfw=DORA')
    expect(result.current.state.activeTab).toBe('requirements')
    expect(result.current.state.reqfwParam).toBe('DORA')
  })

  it('an explicit ?tab= still wins', () => {
    const { result } = at('/compliance?tab=records&reqfw=DORA')
    expect(result.current.state.activeTab).toBe('records')
  })

  it('is written with replace on pick, cleared by null, and dropped on tab change', () => {
    const { result } = at('/compliance?tab=requirements')
    act(() => result.current.state.setReqfwParam('ANSSI'))
    expect(url(result).get('reqfw')).toBe('ANSSI')
    expect(url(result).get('tab')).toBe('requirements')
    expect(result.current.navType).toBe('REPLACE')
    act(() => result.current.state.setReqfwParam(null))
    expect(url(result).get('reqfw')).toBeNull()

    act(() => result.current.state.setReqfwParam('ANSSI'))
    act(() => result.current.state.syncFiltersToUrl({ tab: 'progress' }))
    expect(url(result).get('reqfw')).toBeNull()
  })

  it('follows a second link on the same mounted route', () => {
    const { result } = at('/compliance?reqfw=DORA')
    act(() => result.current.navigate('/compliance?reqfw=ANSSI'))
    expect(result.current.state.reqfwParam).toBe('ANSSI')
  })
})

describe('?prod=', () => {
  it('implies the Products tab', () => {
    const { result } = at('/compliance?prod=p1')
    expect(result.current.state.activeTab).toBe('products')
    expect(result.current.state.prodParam).toBe('p1')
  })

  it('opening pushes, closing replaces, leaving the tab drops it', () => {
    const { result } = at('/compliance?tab=products')
    act(() => result.current.state.openProdParam('p1'))
    expect(url(result).get('prod')).toBe('p1')
    expect(result.current.navType).toBe('PUSH')
    act(() => result.current.state.clearProdParam())
    expect(url(result).get('prod')).toBeNull()
    expect(result.current.navType).toBe('REPLACE')

    act(() => result.current.state.openProdParam('p1'))
    act(() => result.current.state.syncFiltersToUrl({ tab: 'records' }))
    expect(url(result).get('prod')).toBeNull()
  })
})

describe('CSWP.39 sub-view params', () => {
  it.each(['cswpview=evidence', 'step=inventory', 'mtier=3', 'dossier=pci'])(
    '%s implies the CSWP.39 tab',
    (q) => {
      const { result } = at(`/compliance?${q}`)
      expect(result.current.state.activeTab).toBe('cswp39')
    }
  )

  it('exposes the params and writes them with the tab', () => {
    const { result } = at('/compliance?tab=cswp39&cswpview=cycle&step=inventory')
    expect(result.current.state.cswp39Params).toMatchObject({
      cswpview: 'cycle',
      step: 'inventory',
      mtier: null,
      dossier: null,
    })
    act(() => result.current.state.setCswp39Params({ mtier: '3', cswpview: 'maturity' }))
    expect(url(result).get('mtier')).toBe('3')
    expect(result.current.navType).toBe('REPLACE')
    act(() => result.current.state.setCswp39Params({ dossier: 'pci' }, { push: true }))
    expect(url(result).get('dossier')).toBe('pci')
    expect(result.current.navType).toBe('PUSH')
  })

  it('does not touch the page-wide ?tier= trust-tier filter', () => {
    const { result } = at('/compliance?tab=cswp39&tier=1')
    act(() => result.current.state.setCswp39Params({ mtier: '4' }))
    expect(url(result).get('tier')).toBe('1')
    expect(url(result).get('mtier')).toBe('4')
  })

  it('leaving the tab drops all four', () => {
    const { result } = at(
      '/compliance?tab=cswp39&cswpview=maturity&step=govern&mtier=3&dossier=pci'
    )
    act(() => result.current.state.syncFiltersToUrl({ tab: 'standards' }))
    for (const k of ['cswpview', 'step', 'mtier', 'dossier']) expect(url(result).get(k)).toBeNull()
  })

  it('evref still opens CSWP.39 (PR 1)', () => {
    const { result } = at('/compliance?evref=CMMC-2.0-MODEL')
    expect(result.current.state.activeTab).toBe('cswp39')
  })
})

describe('inbound industry / sector / geo aliases', () => {
  it('?industry= seeds the sector but is deleted on the next write, so later picks stick', () => {
    const { result } = at('/compliance?tab=standards&industry=Healthcare&sector=X&geo=DE')
    expect(result.current.state.lsIndustry).toBe('Healthcare')
    act(() => result.current.state.handleLsIndustryChange('Energy'))
    const p = url(result)
    expect(p.get('ind')).toBe('Energy')
    expect(p.get('industry')).toBeNull()
    expect(p.get('sector')).toBeNull()
    expect(p.get('geo')).toBeNull()
    expect(result.current.state.lsIndustry).toBe('Energy')
  })
})

describe('Landscape lq / lsort vs Records q / sort', () => {
  it('a Records link does not leak its sort/search into Landscape', () => {
    const { result } = at('/compliance?tab=records&sort=vendor&q=acme')
    expect(result.current.state.recSortCol).toBe('vendor')
    expect(result.current.state.recSearch).toBe('acme')
    expect(result.current.state.lsSort).toBe('deadline')
    expect(result.current.state.lsSearch).toBe('')
  })

  it('an old Landscape link with q / sort still works, and is rewritten as lq / lsort', () => {
    const { result } = at('/compliance?tab=standards&sort=name&q=nist')
    expect(result.current.state.lsSort).toBe('name')
    expect(result.current.state.lsSearch).toBe('nist')
    expect(result.current.state.recSortCol).toBe('date')
    act(() => result.current.state.handleLsOrgChange('NIST'))
    const p = url(result)
    expect(p.get('lsort')).toBe('name')
    expect(p.get('lq')).toBe('nist')
    expect(p.get('sort')).toBeNull()
    expect(p.get('q')).toBeNull()
  })

  it('reads lq / lsort, and falls back from an invalid sort', () => {
    const { result } = at('/compliance?tab=certification&lsort=finish&lq=eucc')
    expect(result.current.state.lsSort).toBe('finish')
    expect(result.current.state.lsSearch).toBe('eucc')
    const { result: bad } = at('/compliance?tab=standards&lsort=vendor')
    expect(bad.current.state.lsSort).toBe('deadline')
  })

  it('writes lsort on a Landscape sort change', () => {
    const { result } = at('/compliance?tab=standards')
    act(() => result.current.state.handleLsSortChange('name'))
    expect(url(result).get('lsort')).toBe('name')
    expect(url(result).get('sort')).toBeNull()
  })
})

describe('legacy / unknown ?tab=', () => {
  it.each(['landscape', 'frameworks'])('tab=%s lands on the Standardize pillar', (tab) => {
    const { result } = at(`/compliance?tab=${tab}&org=NIST`)
    expect(result.current.state.activeTab).toBe('standards')
    expect(result.current.state.lsOrg).toBe('NIST')
    // A later write treats it as Landscape (not the Records branch).
    act(() => result.current.state.handleLsDeadlineChange('All'))
    expect(url(result).get('tab')).toBe('standards')
    expect(url(result).get('org')).toBe('NIST')
  })

  it('an unknown tab falls back to the default instead of the Records branch', () => {
    const { result } = at('/compliance?tab=bogus')
    expect(result.current.state.activeTab).toBe('obligations')
  })
})

describe('?page= is dead', () => {
  it('is ignored on read and never written', () => {
    const { result } = at('/compliance?tab=records&page=3')
    expect(result.current.state.recPage).toBe(1)
    act(() => result.current.state.handleRecPqcChange(['ML-KEM']))
    expect(url(result).get('page')).toBeNull()
    act(() => result.current.state.handleRecPageChange(4))
    expect(result.current.state.recPage).toBe(4)
    expect(url(result).get('page')).toBeNull()
  })
})
