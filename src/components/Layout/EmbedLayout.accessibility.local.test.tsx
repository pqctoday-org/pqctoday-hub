// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { EmbedLayout } from './EmbedLayout'
const { config, roots, noop } = vi.hoisted(() => ({
  config: {
    vendorId: 'sample',
    allowedRoutes: ['learn', 'timeline'],
    allowedOrigins: ['*'],
    policy: { features: { hideAbout: true, assistantEnabled: false }, theme: { navLayout: 'top' } },
  },
  roots: [] as (HTMLElement | null)[],
  noop: vi.fn(),
}))
vi.mock('../../embed/EmbedProvider', () => ({ useEmbed: () => config }))
vi.mock('../../embed/routePresets', () => ({ getActivePresets: () => ['learn', 'timeline'] }))
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
describe('Embedded navigation uses one control and shares its scroll-focus root', () => {
  it.each(['top', 'sidebar'])(
    'supports named keyboard links and actual main ref in %s layout',
    async (layout) => {
      config.policy.theme.navLayout = layout
      roots.length = 0
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/embed/learn?sample=1']}>
          <Routes>
            <Route path="/embed" element={<EmbedLayout />}>
              <Route path="learn" element={<p>Sample Learn content</p>} />
              <Route path="timeline" element={<p>Sample Timeline content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
      const main = screen.getByRole('main')
      await waitFor(() => expect(roots).toContain(main))
      const learn = screen.getByRole('link', { name: 'Learn view' })
      const timeline = screen.getByRole('link', { name: 'Timeline view' })
      expect(within(learn).queryByRole('button')).not.toBeInTheDocument()
      expect(within(timeline).queryByRole('button')).not.toBeInTheDocument()
      expect(learn).toHaveAttribute('aria-current', 'page')
      expect(timeline).toHaveAttribute('href', '/embed/timeline?sample=1')
      learn.focus()
      await user.tab()
      expect(timeline).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(screen.getByText('Sample Timeline content')).toBeInTheDocument()
      expect(timeline).toHaveAttribute('aria-current', 'page')
    }
  )
})
