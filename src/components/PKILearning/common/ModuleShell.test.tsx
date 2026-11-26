// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmbedProvider } from '../../../embed/EmbedProvider'
import { EmbeddedLearnProvider } from '../embeddedLearnContext'
import { ModuleShell } from './ModuleShell'
import { resolveModuleQuizCategory } from '@/data/moduleQuizCategory'
import { useModuleProgress } from './useModuleProgress'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { ResolvedModuleManifest } from '../manifest/types'

const renderShell = (ui: React.ReactNode) =>
  render(
    <EmbedProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </EmbedProvider>
  )

const base: ResolvedModuleManifest = {
  id: 'hsm-pqc',
  title: 'Test Module',
  description: 'Catalog description',
  duration: '10 min',
  frameworkPhase: 'p0',
}

// useSyncDeepLink reads/writes window.location (shared across tests in jsdom),
// so reset to a clean URL before each test to keep them isolated. Also clear the
// persisted persona so the persona-aware sim CTA starts from a known state.
beforeEach(() => {
  window.history.replaceState(null, '', '/')
  usePersonaStore.getState().setPersona(null)
})

describe('ModuleShell', () => {
  it('renders the header, the Learn slot, and standard tabs', () => {
    renderShell(<ModuleShell manifest={base} learn={<div>LEARN BODY</div>} />)
    expect(screen.getByRole('heading', { name: 'Test Module' })).toBeInTheDocument()
    expect(screen.getByText('Catalog description')).toBeInTheDocument()
    expect(screen.getByText('LEARN BODY')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Learn' })).toBeInTheDocument()
  })

  // Moved here from PKILearningView's utility row (2026-08-02), which was
  // removed as a duplicate of the global top bar. The link sits on the chip
  // row now, so it must actually render — and must stay out of both embed
  // contexts, neither of which has a Learn dashboard to return to.
  it('renders the back-to-dashboard link in the chip row, pointing at /learn', () => {
    renderShell(<ModuleShell manifest={base} learn={<div>L</div>} />)
    const back = screen.getByRole('link', { name: /back to dashboard/i })
    expect(back).toHaveAttribute('href', '/learn')
  })

  it('hides the back-to-dashboard link when embedded in the simulation', () => {
    renderShell(
      <EmbeddedLearnProvider>
        <ModuleShell manifest={base} learn={<div>L</div>} />
      </EmbeddedLearnProvider>
    )
    expect(screen.queryByRole('link', { name: /back to dashboard/i })).not.toBeInTheDocument()
  })

  // 'foundations' is the one numberless phase, so its chip label is bare
  // "Foundations" — identical to the Foundations track's chip. Modules in both
  // rendered the word twice; numbered phases can't collide, so they still show.
  it('drops the phase chip when it merely repeats the track chip', () => {
    renderShell(
      <ModuleShell
        manifest={{ ...base, id: 'pqc-101', frameworkPhase: 'foundations' }}
        learn={<div>L</div>}
      />
    )
    expect(screen.getAllByText(/^foundations$/i)).toHaveLength(1)
  })

  it('keeps a numbered phase chip alongside the track chip', () => {
    renderShell(
      <ModuleShell
        manifest={{ ...base, id: 'pqc-101', frameworkPhase: 'p4' }}
        learn={<div>L</div>}
      />
    )
    expect(screen.getByText(/^phase 4 ·/i)).toBeInTheDocument()
    expect(screen.getByText(/^foundations$/i)).toBeInTheDocument()
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

  it('shows the tools intro above the Tools & Products list, and nothing when it is not given', () => {
    const openTools = () => {
      const tab = screen.getByRole('tab', { name: 'Tools & Products' })
      fireEvent.mouseDown(tab)
      fireEvent.click(tab)
    }
    const { unmount } = renderShell(
      <ModuleShell manifest={base} learn={<div>L</div>} toolsIntro="These products were tested." />
    )
    openTools()
    expect(screen.getByTestId('tools-intro')).toHaveTextContent('These products were tested.')
    unmount()
    renderShell(<ModuleShell manifest={base} learn={<div>L</div>} />)
    openTools()
    expect(screen.queryByTestId('tools-intro')).not.toBeInTheDocument()
  })

  it('respects a reduced (divergent) tab set', () => {
    const reduced: ResolvedModuleManifest = {
      ...base,
      tabs: [
        { value: 'learn', label: 'Learn' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'exercises', label: 'Exercises' },
      ],
    }
    renderShell(<ModuleShell manifest={reduced} learn={<div>L</div>} exercises={<div>E</div>} />)
    expect(screen.getByRole('tab', { name: 'Learn' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Workshop' })).toBeInTheDocument()
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
    expect(screen.getByRole('tab', { name: 'Workshop' })).toBeInTheDocument()
  })

  it('says how many workshop steps there are, and marks the "Start here" step (release 5, workshop detail)', () => {
    const parts = [
      { id: 's1', title: 'Step 1: One', description: 'd1', icon: FlaskConical },
      { id: 's2', title: 'Step 2: Two', description: 'd2', icon: FlaskConical },
    ]
    window.history.replaceState(null, '', '/?tab=workshop')
    renderShell(
      <ModuleShell
        manifest={{
          ...base,
          workshopSteps: [
            { id: 's1', label: 'One' },
            { id: 's2', label: 'Two' },
          ],
          startHere: { step: 's2', text: 'Start with step two' },
        }}
        learn={<div>L</div>}
        workshopParts={parts}
        renderWorkshopStep={(i) => <div>STEP BODY {i}</div>}
      />
    )
    expect(screen.getByTestId('workshop-steps-line')).toHaveTextContent(
      '2 workshop steps. Each one opens here, in the module.'
    )
    expect(screen.getByRole('button', { name: /Step 2: Two · Start here/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Step 1: One/ })).not.toHaveTextContent('Start here')
  })

  it('returns to where the learner started: Your journey or All modules, else the dashboard', () => {
    const at = (state: unknown) =>
      render(
        <EmbedProvider>
          <MemoryRouter initialEntries={[{ pathname: '/learn/hsm-pqc', state }]}>
            <ModuleShell manifest={base} learn={<div>L</div>} />
          </MemoryRouter>
        </EmbedProvider>
      )
    const { unmount: leaveFirst } = at({ journeyOrigin: 'journey' })
    expect(screen.getByRole('link', { name: /back to your journey/i })).toHaveAttribute(
      'href',
      '/learn?mode=journey'
    )
    leaveFirst()
    const { unmount: leaveSecond } = at({ journeyOrigin: 'all-modules' })
    expect(screen.getByRole('link', { name: /back to all modules/i })).toHaveAttribute(
      'href',
      '/learn?mode=browse'
    )
    leaveSecond()
    at(undefined)
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/learn'
    )
  })

  it('passes a nav api to function slots (goToWorkshop switches tab)', () => {
    const parts = [{ id: 's1', title: 'Step 1: One', description: 'd', icon: FlaskConical }]
    renderShell(
      <ModuleShell
        manifest={base}
        learn={(api) => <Button onClick={() => api.goToWorkshop()}>GO WORKSHOP</Button>}
        workshopParts={parts}
        renderWorkshopStep={(i) => <div>STEP BODY {i}</div>}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'GO WORKSHOP' }))
    expect(screen.getByText('STEP BODY 0')).toBeInTheDocument()
  })

  it('goToWorkshop(step) jumps to a specific workshop step', () => {
    const parts = [
      { id: 's1', title: 'Step 1: One', description: 'd', icon: FlaskConical },
      { id: 's2', title: 'Step 2: Two', description: 'd', icon: FlaskConical },
    ]
    renderShell(
      <ModuleShell
        manifest={base}
        learn={(api) => <Button onClick={() => api.goToWorkshop(1)}>GO STEP 2</Button>}
        workshopParts={parts}
        renderWorkshopStep={(i) => <div>AT STEP {i}</div>}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'GO STEP 2' }))
    expect(screen.getByText('AT STEP 1')).toBeInTheDocument()
  })

  it('Reset clears the exercise prefill (config), matching the originals', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const parts = [{ id: 's1', title: 'Step 1: One', description: 'd', icon: FlaskConical }]
    renderShell(
      <ModuleShell
        manifest={base}
        learn={(api) => (
          <Button
            onClick={() => {
              api.goToWorkshop()
              api.openWorkshopStep(0, { sample: 'PREFILL' })
            }}
          >
            PREFILL
          </Button>
        )}
        workshopParts={parts}
        renderWorkshopStep={(_i, _k, config) => (
          <div>VAL:{String((config as { sample?: string } | undefined)?.sample ?? 'default')}</div>
        )}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'PREFILL' }))
    expect(screen.getByText('VAL:PREFILL')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('VAL:default')).toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  const onResetTree = (onReset: () => void) => {
    const parts = [{ id: 's1', title: 'Step 1: One', description: 'd', icon: FlaskConical }]
    return (
      <ModuleShell
        manifest={base}
        learn={(api) => <Button onClick={() => api.goToWorkshop()}>GO WORKSHOP</Button>}
        onReset={onReset}
        workshopParts={parts}
        renderWorkshopStep={(i) => <div>AT STEP {i}</div>}
      />
    )
  }

  it('fires onReset (to clear FC-held cross-tab state) once on a CONFIRMED reset', () => {
    const ok = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onReset = vi.fn()
    renderShell(onResetTree(onReset))
    fireEvent.click(screen.getByRole('button', { name: 'GO WORKSHOP' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
    ok.mockRestore()
  })

  it('does NOT fire onReset when the reset confirm is cancelled', () => {
    const cancel = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onReset = vi.fn()
    renderShell(onResetTree(onReset))
    fireEvent.click(screen.getByRole('button', { name: 'GO WORKSHOP' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).not.toHaveBeenCalled()
    cancel.mockRestore()
  })

  it('exposes resetWorkshop to a non-stepper workshop slot (fires onReset on confirm)', () => {
    const ok = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onReset = vi.fn()
    renderShell(
      <ModuleShell
        manifest={base}
        learn={<div>L</div>}
        onReset={onReset}
        workshop={(api) => <Button onClick={api.resetWorkshop}>RESET WORKSHOP</Button>}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESET WORKSHOP' }))
    expect(onReset).toHaveBeenCalledTimes(1)
    ok.mockRestore()
  })

  it('does NOT clear the exercise prefill when the reset confirm is cancelled', () => {
    const cancel = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const parts = [{ id: 's1', title: 'Step 1: One', description: 'd', icon: FlaskConical }]
    renderShell(
      <ModuleShell
        manifest={base}
        learn={(api) => (
          <Button
            onClick={() => {
              api.goToWorkshop()
              api.openWorkshopStep(0, { sample: 'PREFILL' })
            }}
          >
            PREFILL
          </Button>
        )}
        workshopParts={parts}
        renderWorkshopStep={(_i, _k, config) => (
          <div>VAL:{String((config as { sample?: string } | undefined)?.sample ?? 'default')}</div>
        )}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'PREFILL' }))
    expect(screen.getByText('VAL:PREFILL')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    // confirm cancelled -> prefill survives (reset is a no-op)
    expect(screen.getByText('VAL:PREFILL')).toBeInTheDocument()
    cancel.mockRestore()
  })

  it('shows no "Practice in the Simulation" button, for any role or none', () => {
    for (const persona of ['executive', 'architect', 'developer', null] as const) {
      usePersonaStore.getState().setPersona(persona)
      const { unmount } = renderShell(<ModuleShell manifest={base} learn={<div>L</div>} />)
      expect(screen.queryByRole('link', { name: /Simulation/i })).not.toBeInTheDocument()
      unmount()
    }
  })

  it('routes mapped custody modules to the digital-assets quiz category on completion', () => {
    expect(resolveModuleQuizCategory('custody-threats-controls')).toBe('digital-assets')
    expect(resolveModuleQuizCategory('hsm-pqc')).toBe('hsm-pqc')

    useModuleStore.getState().updateModuleProgress('custody-threats-controls', {
      status: 'completed',
    })

    renderShell(
      <ModuleShell
        manifest={{
          ...base,
          id: 'custody-threats-controls',
          title: 'Custody Key Threats & Controls',
          frameworkPhase: 'p5',
        }}
        learn={<div>L</div>}
      />
    )
    const quizLink = screen.getByRole('link', {
      name: /Take the Custody Key Threats & Controls quiz/i,
    })
    expect(quizLink).toHaveAttribute('href', '/learn/quiz?category=digital-assets')
    useModuleStore.getState().resetModuleProgress('custody-threats-controls')
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
