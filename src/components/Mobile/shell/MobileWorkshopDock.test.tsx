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
})
