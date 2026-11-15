// SPDX-License-Identifier: AGPL-3.0-only
// The reader's country and industry are part of the page, not of one tab. A country
// picked on Rules & Standards, Requirements or Progress must reach the URL (so it can
// be shared, and Back restores it), and a direct link must keep it on every tab.
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useComplianceUrlState } from './useComplianceUrlState'
import { usePersonaStore } from '@/store/usePersonaStore'

function at(url: string) {
  return renderHook(
    () => ({
      state: useComplianceUrlState(),
      location: useLocation(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      ),
    }
  )
}

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
})

describe('country and industry survive on every tab', () => {
  for (const tab of ['obligations', 'requirements', 'progress']) {
    it(`writes the country picked on ?tab=${tab} to the URL`, () => {
      const { result } = at(`/compliance?tab=${tab}`)
      act(() => {
        result.current.state.handleLsCountryChange('Germany')
      })
      const params = new URLSearchParams(result.current.location.search)
      expect(params.get('tab')).toBe(tab)
      expect(params.get('country')).toBe('Germany')
    })
  }

  it('keeps a country from a direct link on a default tab', () => {
    const { result } = at('/compliance?tab=obligations&country=Germany')
    act(() => {
      result.current.state.handleLsCountryChange('Germany')
    })
    expect(new URLSearchParams(result.current.location.search).get('country')).toBe('Germany')
  })
})
