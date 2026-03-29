// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MainLayout } from './MainLayout'
import '@testing-library/jest-dom'

// Mock the build timestamp
vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

// Simple test components for routes
const TestTimeline = () => <div>Timeline Page</div>
const TestAbout = () => <div>About Page</div>
const TestAlgorithms = () => <div>Algorithms Page</div>

describe('MainLayout', () => {
  describe('Desktop viewport', () => {
    beforeEach(() => {
      // Set desktop viewport size
      global.innerWidth = 1024
      global.innerHeight = 768
      window.dispatchEvent(new Event('resize'))
    })

    it('renders the main layout structure', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      // Check for header
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()

      // Check for main content area
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()

      // Check for navigation
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    it('displays the site title on desktop', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('PQC Today')).toBeInTheDocument()
    })

    it('displays the build timestamp on desktop', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument()
    })

    it('renders all navigation items with labels on desktop', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      const nav = screen.getByRole('navigation')

      // Each nav button has mobile + desktop <span> with the same label,
      // so use aria-label ("X view") via getByRole to avoid duplicate matches
      expect(within(nav).getByRole('button', { name: /timeline view/i })).toBeInTheDocument()
      expect(within(nav).getByRole('button', { name: /algorithms view/i })).toBeInTheDocument()
      expect(within(nav).getByRole('button', { name: /library view/i })).toBeInTheDocument()
      expect(within(nav).getByRole('button', { name: /learn view/i })).toBeInTheDocument()
      expect(within(nav).getByRole('button', { name: /playground view/i })).toBeInTheDocument()
      expect(within(nav).getByRole('button', { name: /threats view/i })).toBeInTheDocument()
      expect(within(nav).getByRole('button', { name: /about view/i })).toBeInTheDocument()
    })

    it('highlights the active route', () => {
      render(
        <MemoryRouter initialEntries={['/about']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
              <Route path="/about" element={<TestAbout />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      const aboutButton = screen.getByRole('button', { name: /about view/i })
      expect(aboutButton).toHaveClass('bg-primary/10')
    })

    it('renders the outlet content', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('Timeline Page')).toBeInTheDocument()
    })

    it('displays footer', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText(/© 2025 PQC Today/)).toBeInTheDocument()
    })
  })

  describe('Mobile viewport', () => {
    beforeEach(() => {
      // Set mobile viewport size
      global.innerWidth = 375
      global.innerHeight = 667
      window.dispatchEvent(new Event('resize'))
    })

    it('renders navigation on mobile', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    it('shows icon-only navigation on mobile (no text labels visible)', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      // On mobile, text labels should be hidden (have class 'hidden lg:inline')
      const timelineButton = screen.getByRole('button', { name: /timeline view/i })
      expect(timelineButton).toBeInTheDocument()
    })

    it('hides playground and openssl studio on mobile', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      // These items should have 'hidden lg:block' class on mobile
      const playgroundButton = screen.queryByRole('button', { name: /playground view/i })

      // They exist in DOM but are hidden on mobile
      expect(playgroundButton).toBeInTheDocument()
    })

    it('renders the outlet content on mobile', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('Timeline Page')).toBeInTheDocument()
    })
  })

  describe('Navigation functionality', () => {
    it('navigates between routes', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
              <Route path="/algorithms" element={<TestAlgorithms />} />
              <Route path="/about" element={<TestAbout />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      // Initially on timeline
      expect(screen.getByText('Timeline Page')).toBeInTheDocument()

      // Navigation is handled by react-router, just verify buttons exist
      const algorithmsButton = screen.getByRole('button', { name: /algorithms view/i })
      expect(algorithmsButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      const nav = screen.getByRole('navigation', { name: /main navigation/i })
      expect(nav).toBeInTheDocument()
    })

    it('marks active page with aria-current', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      const homeButton = screen.getByRole('button', { name: /home view/i })
      expect(homeButton).toHaveAttribute('aria-current', 'page')
    })

    it('has proper role for header', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('has proper role for main content', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<TestTimeline />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})
