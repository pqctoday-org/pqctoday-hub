// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 1 (2026-09-28): the Standardize-tab bounce, bare `?evref=`,
// and two-way `?framework=`.
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate, useNavigationType } from 'react-router'
import type { ReactNode } from 'react'
import { useComplianceUrlState } from './useComplianceUrlState'

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

const params = (search: string) => new URLSearchParams(search)

describe('tab=standards round-trip (no bounce)', () => {
  it('keeps tab=standards in the URL and on screen after a Landscape filter change', () => {
    const { result } = at('/compliance?tab=standards')
    expect(result.current.state.activeTab).toBe('standards')
    act(() => result.current.state.handleLsOrgChange('NIST'))
    expect(params(result.current.location.search).get('tab')).toBe('standards')
    expect(params(result.current.location.search).get('org')).toBe('NIST')
    expect(result.current.state.activeTab).toBe('standards')
  })

  it('writes tab=standards when the Standardize pillar is selected from elsewhere', () => {
    const { result } = at('/compliance?tab=obligations')
    act(() => {
      result.current.state.setActiveTab('standards')
      result.current.state.syncFiltersToUrl({ tab: 'standards' })
    })
    expect(params(result.current.location.search).get('tab')).toBe('standards')
    expect(result.current.state.activeTab).toBe('standards')
  })

  it('still resolves an old link without tab through the default', () => {
    const { result } = at('/compliance')
    expect(result.current.state.activeTab).not.toBe('standards')
  })
})

describe('?evref= without ?tab=', () => {
  it('opens CSWP.39 (the form the Assistant is taught)', () => {
    const { result } = at('/compliance?evref=CMMC-2.0-MODEL')
    expect(result.current.state.activeTab).toBe('cswp39')
    expect(result.current.state.evref).toBe('CMMC-2.0-MODEL')
  })

  it('cert still outranks evref', () => {
    const { result } = at('/compliance?cert=5528&evref=X')
    expect(result.current.state.activeTab).toBe('records')
  })
})

describe('?framework= is two-way', () => {
  it('follows a second framework link on the same mounted route', () => {
    const { result } = at('/compliance?framework=NIST')
    expect(result.current.state.frameworkParam).toBe('NIST')
    expect(result.current.state.highlightFrameworkId).toBe('NIST')
    act(() => result.current.navigate('/compliance?framework=CNSA-2'))
    expect(result.current.state.frameworkParam).toBe('CNSA-2')
    expect(result.current.state.highlightFrameworkId).toBe('CNSA-2')
  })

  it('opening pushes ?framework=, closing replaces it away', () => {
    const { result } = at('/compliance?tab=standards')
    act(() => result.current.state.openFrameworkParam('NIST'))
    expect(params(result.current.location.search).get('framework')).toBe('NIST')
    expect(result.current.navType).toBe('PUSH')
    act(() => result.current.state.clearFrameworkParam())
    expect(params(result.current.location.search).get('framework')).toBeNull()
    expect(params(result.current.location.search).get('tab')).toBe('standards')
    expect(result.current.navType).toBe('REPLACE')
  })
})
