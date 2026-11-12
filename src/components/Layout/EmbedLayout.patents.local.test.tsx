// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { EmbedLayout } from './EmbedLayout'
const { config, roots, noop } = vi.hoisted(() => ({
  config: {
    vendorId: 'sample',
    allowedRoutes: ['/learn', '/patents'],
    allowedOrigins: ['*'],
    policy: { features: { hideAbout: true, assistantEnabled: false }, theme: { navLayout: 'top' } },
  },
  roots: [] as (HTMLElement | null)[],
  noop: vi.fn(),
}))
vi.mock('../../embed/EmbedProvider', () => ({ useEmbed: () => config }))
vi.mock('../../embed/useEmbedPersistence', () => ({ useEmbedPersistence: () => {} }))
vi.mock('../../embed/useHostCheck', () => ({ useHostCheck: () => true }))
vi.mock('../../embed/platform', () => ({ isIframeEmbed: () => false }))
vi.mock('../../store/useThemeStore', () => ({ useThemeStore: () => ({ setTheme: noop }) }))
vi.mock('../../store/usePersonaStore', () => ({
  usePersonaStore: () => ({ setPersona: noop, setRegion: noop, setIndustries: noop }),
}))
vi.mock('../../store/useRightPanelStore', () => ({ useRightPanelStore: () => ({ isOpen: false }) }))
vi.mock('../../utils/analytics', () => ({ logEmbedPolicyApplied: () => {} }))
vi.mock('../ui/PoweredByBadge', () => ({ PoweredByBadge: () => null }))
vi.mock('../ui/WhatsNewModal', () => ({ WhatsNewModal: () => null }))
vi.mock('../../hooks/useFocusableScrollRegions', () => ({
  useFocusableScrollRegions: (ref: { current: HTMLElement | null }) => {
    useEffect(() => {
      roots.push(ref.current)
    }, [ref])
  },
}))
describe('Licensed patent route in embedded navigation', () => {
  function mount(layout: string, includePatents: boolean) {
    config.allowedRoutes = includePatents ? ['/learn', '/patents'] : ['/learn']
    config.policy.theme.navLayout = layout
    render(
      <MemoryRouter initialEntries={['/embed/learn?sample=1']}>
        <Routes>
          <Route path="/embed" element={<EmbedLayout />}>
            <Route path="learn" element={<p>Sample Learn content</p>} />
            <Route path="patents" element={<p>Sample patent content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }
  it.each(['top', 'sidebar'])(
    'links the authorized patent route by keyboard in %s layout',
    async (layout) => {
      const user = userEvent.setup()
      mount(layout, true)
      const learn = screen.getByRole('link', { name: 'Learn view' })
      const patents = screen.getByRole('link', { name: 'Patents view' })
      expect(patents).toHaveAttribute('href', '/embed/patents?sample=1')
      learn.focus()
      await user.tab()
      expect(patents).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(screen.getByText('Sample patent content')).toBeInTheDocument()
      expect(patents).toHaveAttribute('aria-current', 'page')
    }
  )
  it.each(['top', 'sidebar'])(
    'does not offer an unlicensed patent route in %s layout',
    (layout) => {
      mount(layout, false)
      expect(screen.getByRole('link', { name: 'Learn view' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Patents view' })).not.toBeInTheDocument()
    }
  )
})
