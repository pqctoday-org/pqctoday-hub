// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmbedProvider } from '../../../embed/EmbedProvider'
import { ModuleShell } from './ModuleShell'
import { useModuleProgress } from './useModuleProgress'
import type { ModuleManifest } from '../manifest/types'

const renderShell = (ui: React.ReactNode) =>
  render(
    <EmbedProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </EmbedProvider>
  )

const base: ModuleManifest = {
  id: 'hsm-pqc',
  title: 'Test Module',
  description: 'Catalog description',
  duration: '10 min',
  frameworkPhase: 'p0',
}

// useSyncDeepLink reads/writes window.location (shared across tests in jsdom),
// so reset to a clean URL before each test to keep them isolated.
beforeEach(() => window.history.replaceState(null, '', '/'))

describe('ModuleShell', () => {
  it('renders the header, the Learn slot, and standard tabs', () => {
    renderShell(<ModuleShell manifest={base} learn={<div>LEARN BODY</div>} />)
    expect(screen.getByRole('heading', { name: 'Test Module' })).toBeInTheDocument()
    expect(screen.getByText('Catalog description')).toBeInTheDocument()
    expect(screen.getByText('LEARN BODY')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument()
  })

  it('lets the header description be overridden (it often differs from the catalog)', () => {
    renderShell(
      <ModuleShell manifest={base} description="Overridden header" learn={<div>L</div>} />
    )
    expect(screen.getByText('Overridden header')).toBeInTheDocument()
    expect(screen.queryByText('Catalog description')).not.toBeInTheDocument()
  })

  it('custom modules render their own body with no tab chrome', () => {
    renderShell(
      <ModuleShell manifest={{ ...base, custom: true }}>
        <div>CUSTOM BODY</div>
      </ModuleShell>
    )
    expect(screen.getByText('CUSTOM BODY')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Test Module' })).not.toBeInTheDocument()
  })

  it('respects a reduced (divergent) tab set', () => {
    const reduced: ModuleManifest = {
      ...base,
      tabs: [
        { value: 'learn', label: 'Learn' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'exercises', label: 'Exercises' },
      ],
    }
    renderShell(<ModuleShell manifest={reduced} learn={<div>L</div>} exercises={<div>E</div>} />)
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Workshop' })).toBeInTheDocument()
    // Visual is the 2nd standard tab (always inline) — its absence proves exclusion.
    expect(screen.queryByRole('button', { name: 'Visual' })).not.toBeInTheDocument()
  })

  it('mounts the workshop stepper body when parts are supplied', () => {
    const parts = [
      { id: 's1', title: 'Step 1: One', description: 'd1', icon: FlaskConical },
      { id: 's2', title: 'Step 2: Two', description: 'd2', icon: FlaskConical },
    ]
    renderShell(
      <ModuleShell
        manifest={base}
        learn={<div>L</div>}
        workshopParts={parts}
        renderWorkshopStep={(i) => <div>STEP BODY {i}</div>}
      />
    )
    expect(screen.getByRole('button', { name: 'Workshop' })).toBeInTheDocument()
  })

  it('passes a nav api to function slots (goToWorkshop switches tab)', () => {
    const parts = [{ id: 's1', title: 'Step 1: One', description: 'd', icon: FlaskConical }]
    renderShell(
      <ModuleShell
        manifest={base}
        learn={(api) => <Button onClick={api.goToWorkshop}>GO WORKSHOP</Button>}
        workshopParts={parts}
        renderWorkshopStep={(i) => <div>STEP BODY {i}</div>}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'GO WORKSHOP' }))
    expect(screen.getByText('STEP BODY 0')).toBeInTheDocument()
  })
})

describe('useModuleProgress', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  )

  it('starts on learn / step 0 and advances workshop steps and tabs', () => {
    const { result } = renderHook(
      () => useModuleProgress('test-mod', { steps: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }),
      { wrapper }
    )
    expect(result.current.activeTab).toBe('learn')
    expect(result.current.currentPart).toBe(0)
    expect(result.current.workshopDot).toBe(false)

    act(() => result.current.handlePartChange(2))
    expect(result.current.currentPart).toBe(2)

    act(() => result.current.handleTabChange('workshop'))
    expect(result.current.activeTab).toBe('workshop')
  })
})
