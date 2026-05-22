// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResumeBanner } from './ResumeBanner'
import { useModuleStore } from '@/store/useModuleStore'

vi.mock('@/components/PKILearning/moduleData', () => ({
  MODULE_CATALOG: {
    'pqc-101': { title: 'PQC 101' },
    'tls-deep-dive': { title: 'TLS Deep Dive' },
  },
}))

vi.mock('@/utils/analytics', () => ({
  logEvent: vi.fn(),
  personaLabel: (l?: string) => l,
}))

type ModuleStatus = 'not-started' | 'in-progress' | 'completed'
const seedModules = (overrides: Record<string, { status: ModuleStatus; lastVisited: number }>) => {
  const baseModules = useModuleStore.getState().modules
  useModuleStore.setState({
    modules: {
      ...Object.fromEntries(
        Object.entries(baseModules).map(([k, v]) => [k, { ...v, status: 'not-started' }])
      ),
      ...Object.fromEntries(
        Object.entries(overrides).map(([id, o]) => [
          id,
          {
            status: o.status,
            lastVisited: o.lastVisited,
            timeSpent: 0,
            completedSteps: [],
            quizScores: {},
          },
        ])
      ),
    },
  })
}

const renderBanner = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ResumeBanner />
    </MemoryRouter>
  )

describe('ResumeBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    useModuleStore.setState({
      modules: {
        'module-1': {
          status: 'not-started',
          lastVisited: Date.now(),
          timeSpent: 0,
          completedSteps: [],
          quizScores: {},
        },
      },
    })
  })

  it('renders nothing when no module is in progress', () => {
    const { container } = renderBanner()
    expect(container.firstChild).toBeNull()
  })

  it('renders the most-recently-visited in-progress module', () => {
    seedModules({
      'pqc-101': { status: 'in-progress', lastVisited: 1_000 },
      'tls-deep-dive': { status: 'in-progress', lastVisited: 5_000 },
    })
    renderBanner()
    expect(screen.getByText('TLS Deep Dive')).toBeInTheDocument()
    expect(screen.queryByText('PQC 101')).not.toBeInTheDocument()
  })

  it('also surfaces completed modules', () => {
    seedModules({
      'pqc-101': { status: 'completed', lastVisited: 9_000 },
    })
    renderBanner()
    expect(screen.getByText('PQC 101')).toBeInTheDocument()
  })

  it('dismiss hides the banner and persists per route key', () => {
    seedModules({ 'pqc-101': { status: 'in-progress', lastVisited: 1_000 } })
    renderBanner('/business')
    fireEvent.click(screen.getByLabelText(/dismiss resume banner/i))
    expect(screen.queryByText('PQC 101')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('resume-banner-dismissed:route:/business')).toBe('1')
  })

  it('does not render when sessionStorage already marks the route dismissed', () => {
    sessionStorage.setItem('resume-banner-dismissed:route:/report', '1')
    seedModules({ 'pqc-101': { status: 'in-progress', lastVisited: 1_000 } })
    const { container } = renderBanner('/report')
    expect(container.firstChild).toBeNull()
  })
})
