// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useUrlPersonaOverride } from './useUrlPersonaOverride'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/utils/analytics', () => ({
  logPersonaSelected: vi.fn(),
}))

function Probe({ onLocation }: { onLocation: (path: string, search: string) => void }) {
  useUrlPersonaOverride()
  const loc = useLocation()
  onLocation(loc.pathname, loc.search)
  return null
}

const renderWith = (route: string, onLocation: (p: string, s: string) => void) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="*" element={<Probe onLocation={onLocation} />} />
      </Routes>
    </MemoryRouter>
  )

describe('useUrlPersonaOverride', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: null })
    vi.clearAllMocks()
  })

  it('sets persona from ?persona=<valid-id> and strips the param', async () => {
    const { logPersonaSelected } = await import('@/utils/analytics')
    let lastSearch = '?persona=architect'
    renderWith('/migrate?persona=architect', (_p, s) => {
      lastSearch = s
    })
    expect(usePersonaStore.getState().selectedPersona).toBe('architect')
    expect(logPersonaSelected).toHaveBeenCalledWith('architect', 'switch')
    expect(lastSearch).not.toContain('persona=')
  })

  it('ignores invalid persona values but still strips the param', () => {
    let lastSearch = '?persona=ceo'
    renderWith('/business?persona=ceo', (_p, s) => {
      lastSearch = s
    })
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
    expect(lastSearch).not.toContain('persona=')
  })

  it('preserves other query params while stripping persona', () => {
    let lastSearch = ''
    renderWith('/algorithms?persona=executive&tab=transition', (_p, s) => {
      lastSearch = s
    })
    expect(usePersonaStore.getState().selectedPersona).toBe('executive')
    expect(lastSearch).toContain('tab=transition')
    expect(lastSearch).not.toContain('persona=')
  })

  it('is a no-op when no persona param is present', () => {
    renderWith('/library', () => {})
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })
})
