// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileWorkshopDock } from './MobileWorkshopDock'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { _resetCachesForTest } from '@/services/workshopFlowLoader'
import type { WorkshopFlow, WorkshopStep } from '@/types/Workshop'
import type { WorkshopFlowManifest } from '@/services/workshopFlowLoader'

// Synthetic flow fixture, same shape as workshopRegistry.test.ts's own —
// real public/workshop/*.json is not fetchable in a unit test, so
// loadManifest/loadFlow's fetch calls are stubbed to serve this instead.
function step(id: string, overrides: Partial<WorkshopStep> = {}): WorkshopStep {
  return {
    id,
    chapter: 'foundations',
    title: `Step ${id}`,
    estMinutes: 3,
    whyItMatters: `Why ${id} matters`,
    page: { route: '/compliance' },
    tasks: [`Do the ${id} thing`],
    expectedOutput: `${id} expected output`,
    narration: 'narration filler text long enough to pass validator',
    ...overrides,
  }
}

const FIXTURE_FLOW: WorkshopFlow = {
  id: 'fixture-flow',
  title: 'Fixture Flow',
  match: { roles: '*', proficiencies: '*', industries: '*', regions: '*' },
  whatToExpect: ['a'],
  totalEstMinutes: 10,
  intro: { id: 'intro', title: 'Intro', estMinutes: 1, steps: [step('intro-01')] },
  prerequisites: { id: 'prereq', title: 'Prereq', estMinutes: 1, steps: [] },
  common: [
    {
      id: 'foundations',
      title: 'Foundations',
      estMinutes: 3,
      steps: [
        step('p-compliance', {
          completionSignal: { kind: 'bookmark-added', surface: 'compliance' },
        }),
      ],
    },
    {
      id: 'action',
      title: 'Action',
      estMinutes: 3,
      steps: [step('a1'), step('a2', { page: { route: '/assess' } })],
    },
  ],
  close: { id: 'close', title: 'Close', estMinutes: 1, steps: [step('close-01')] },
}

const FIXTURE_MANIFEST: WorkshopFlowManifest = {
  version: '1',
  generatedAt: '2026-08-23T00:00:00Z',
  flows: [
    {
      id: 'fixture-flow',
      file: 'fixture-flow.json',
      title: 'Fixture Flow',
      match: FIXTURE_FLOW.match,
      totalEstMinutes: 10,
      stepCount: 5,
      date: '2026-08-23',
    },
  ],
}

function renderDock() {
  return render(
    <MemoryRouter initialEntries={['/compliance']}>
      <MobileWorkshopDock />
    </MemoryRouter>
  )
}

describe('MobileWorkshopDock', () => {
  beforeEach(() => {
    _resetCachesForTest()
    useWorkshopStore.getState().reset()
    usePersonaStore.setState({ selectedPersona: 'executive', experienceLevel: 'basics' })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === '/workshop/index.json') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(FIXTURE_MANIFEST),
          } as Response)
        }
        if (url === '/workshop/fixture-flow.json') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(FIXTURE_FLOW),
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch: ${url}`))
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useWorkshopStore.getState().reset()
  })

  it('renders nothing when no workshop is running', () => {
    const { container } = renderDock()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the flow is still hydrating, then shows the collapsed bar once it resolves', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    renderDock()
    // Flattened order: intro-01, p-compliance, a1, a2, close-01 — 5 steps,
    // p-compliance at index 1 (0-based) → "Step 2 of 5".
    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument()
    })
    expect(screen.getByText('Step p-compliance')).toBeInTheDocument()
  })

  it('expands into the full sheet on tap, showing why-it-matters and tasks', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    renderDock()
    const collapsedBar = await screen.findByText('Step p-compliance')
    fireEvent.click(collapsedBar)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Why p-compliance matters')).toBeInTheDocument()
    expect(screen.getByText('Do the p-compliance thing')).toBeInTheDocument()
    expect(
      screen.getByText(/Completes when a bookmark is added on compliance/i)
    ).toBeInTheDocument()
  })

  it('shows the "on this step\'s page" confirmation only when the current route matches', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'a1', 'US')
    renderDock()
    fireEvent.click(await screen.findByText('Step a1'))
    // a1's route is /compliance (the step() default) and the test navigates
    // there via initialEntries, so this should read as "on the page".
    expect(await screen.findByText(/You're on this step's page/i)).toBeInTheDocument()
  })

  it('omits the "on this step\'s page" confirmation when the current route does not match', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'a2', 'US')
    renderDock()
    // a2's route is /assess, but the test is rendered at /compliance.
    fireEvent.click(await screen.findByText('Step a2'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText(/You're on this step's page/i)).not.toBeInTheDocument()
  })

  it('marks the current step complete and reflects it as a checked task', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    renderDock()
    fireEvent.click(await screen.findByText('Step p-compliance'))
    const markDone = await screen.findByRole('button', { name: /mark this step done/i })
    fireEvent.click(markDone)
    expect(useWorkshopStore.getState().completedStepIds).toContain('p-compliance')
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /mark this step done/i })).not.toBeInTheDocument()
    })
  })

  it('advances via Next and disables Back on the first step', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'intro-01', 'US')
    renderDock()
    fireEvent.click(await screen.findByText('Step intro-01'))
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(useWorkshopStore.getState().currentStepId).toBe('p-compliance')
  })

  // 2026-08-24 audit R5: the collapsed bar's "Next" used to be a
  // role="button" span nested inside the outer <Button> — invalid HTML (a
  // button inside a button). Now two real sibling <button>s: tapping Next
  // must advance WITHOUT also opening the sheet (the old nested-span
  // version relied on stopPropagation to fake that; a real sibling doesn't
  // need it — this proves the outer "open" button never fires).
  it('Next in the collapsed bar is a real button that advances without opening the sheet', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'intro-01', 'US')
    renderDock()
    await screen.findByText('Step intro-01')
    const next = screen.getByRole('button', { name: 'Next' })
    expect(next.tagName).toBe('BUTTON')
    fireEvent.click(next)
    expect(useWorkshopStore.getState().currentStepId).toBe('p-compliance')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // 2026-08-24 audit R5: restores the spec's "n of N tasks · tap to open"
  // sub-line (README §Workshop dock) — previously bare "tap to open".
  // Completion is tracked per STEP (completedStepIds), not per task, so n
  // is honestly 0 or the full task count — never invented partial progress.
  it('collapsed bar sub-line shows the real task count, 0 of N before completion', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    renderDock()
    expect(await screen.findByText(/0 of 1 tasks · tap to open/i)).toBeInTheDocument()
  })

  it('collapsed bar sub-line shows the full count once the step is marked complete', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    useWorkshopStore.getState().markStepComplete('p-compliance')
    renderDock()
    expect(await screen.findByText(/1 of 1 tasks · tap to open/i)).toBeInTheDocument()
  })

  it('pauses (not exits) on "Leave the workshop", preserving progress and hiding the dock', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    useWorkshopStore.getState().markStepComplete('p-compliance')
    const { container } = renderDock()
    fireEvent.click(await screen.findByText('Step p-compliance'))
    fireEvent.click(screen.getByRole('button', { name: /leave the workshop/i }))
    expect(useWorkshopStore.getState().mode).toBe('paused')
    expect(useWorkshopStore.getState().currentFlowId).toBe('fixture-flow')
    expect(useWorkshopStore.getState().completedStepIds).toContain('p-compliance')
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  // 2026-08-24 audit R4.5: flattenFlow is recomputed live from
  // persona/industry/experience — if a reader changes any of those
  // mid-workshop, the remembered currentStepId can stop resolving in the
  // newly-flattened list. Previously this made both the dock (`mode !==
  // 'running'` check never fires — it's still 'running') AND
  // MobileWorkshopEntry (only shows for idle/paused) return null: the
  // workshop simply vanished, with running mode stuck and no way back.
  // 'nonexistent-step' is not a real step in FIXTURE_FLOW — the same
  // structural situation a context change produces, reached directly.
  describe('stranded running state (audit R4.5)', () => {
    it('shows a recovery bar instead of vanishing when currentStepId no longer resolves', async () => {
      useWorkshopStore.getState().start('fixture-flow', 'nonexistent-step', 'US')
      renderDock()
      expect(await screen.findByText('Workshop paused')).toBeInTheDocument()
      expect(screen.getByText(/your context changed/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Resume from start' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument()
    })

    it('"Resume from start" sets currentStepId to the real first step of the live-flattened flow', async () => {
      useWorkshopStore.getState().start('fixture-flow', 'nonexistent-step', 'US')
      renderDock()
      fireEvent.click(await screen.findByRole('button', { name: 'Resume from start' }))
      // Flattened order: intro-01, p-compliance, a1, a2, close-01.
      expect(useWorkshopStore.getState().currentStepId).toBe('intro-01')
      expect(useWorkshopStore.getState().mode).toBe('running')
    })

    it('"Leave" fully exits (not pauses) — there is no valid step to keep a place at', async () => {
      useWorkshopStore.getState().start('fixture-flow', 'nonexistent-step', 'US')
      const { container } = renderDock()
      fireEvent.click(await screen.findByRole('button', { name: 'Leave' }))
      expect(useWorkshopStore.getState().mode).toBe('idle')
      expect(useWorkshopStore.getState().currentFlowId).toBeNull()
      await waitFor(() => expect(container).toBeEmptyDOMElement())
    })
  })
})
