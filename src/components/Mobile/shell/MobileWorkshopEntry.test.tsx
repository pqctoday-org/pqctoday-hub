// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileWorkshopEntry } from './MobileWorkshopEntry'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { _resetCachesForTest } from '@/services/workshopFlowLoader'
import type { WorkshopFlow, WorkshopStep } from '@/types/Workshop'
import type { WorkshopFlowManifest } from '@/services/workshopFlowLoader'

// Same synthetic fixture shape as MobileWorkshopDock.test.tsx / workshopRegistry.test.ts.
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
    { id: 'foundations', title: 'Foundations', estMinutes: 3, steps: [step('p-compliance')] },
    { id: 'action', title: 'Action', estMinutes: 3, steps: [step('a1'), step('a2')] },
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

function renderEntry() {
  return render(
    <MemoryRouter>
      <MobileWorkshopEntry />
    </MemoryRouter>
  )
}

describe('MobileWorkshopEntry', () => {
  beforeEach(() => {
    _resetCachesForTest()
    useWorkshopStore.getState().reset()
    usePersonaStore.setState({
      selectedPersona: 'executive',
      experienceLevel: 'basics',
      selectedRegion: 'americas',
      selectedIndustry: 'Finance & Banking',
    })
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

  it('renders nothing while the manifest is still loading', () => {
    const { container } = renderEntry()
    expect(container).toBeEmptyDOMElement()
  })

  it('idle: shows a Start card once the flow resolves, and starting it calls the real start() + navigates to the first step', async () => {
    renderEntry()
    const card = await screen.findByText('Fixture Flow')
    expect(screen.getByText(/Start a guided workshop · ~10 min/i)).toBeInTheDocument()
    fireEvent.click(card)
    await waitFor(() => {
      expect(useWorkshopStore.getState().mode).toBe('running')
      expect(useWorkshopStore.getState().currentFlowId).toBe('fixture-flow')
      expect(useWorkshopStore.getState().currentStepId).toBe('intro-01')
    })
  })

  it('renders nothing while a workshop is actively running — the dock owns that state', () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    const { container } = renderEntry()
    expect(container).toBeEmptyDOMElement()
  })

  it('paused: shows a Resume card naming the real current step, and resuming calls the real resume()', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'p-compliance', 'US')
    useWorkshopStore.getState().pause()
    renderEntry()
    const card = await screen.findByText('Step p-compliance')
    // Flattened order: intro-01, p-compliance, a1, a2, close-01 — p-compliance
    // is index 1 (0-based) → "step 2 of 5".
    expect(screen.getByText(/Resume workshop · step 2 of 5/i)).toBeInTheDocument()
    fireEvent.click(card)
    await waitFor(() => {
      expect(useWorkshopStore.getState().mode).toBe('running')
    })
    // Resuming preserves exactly where the user left off.
    expect(useWorkshopStore.getState().currentStepId).toBe('p-compliance')
  })

  it('paused: uses the region the workshop actually started with, not the live persona region, so step lookup stays correct even if the persona region changed since', async () => {
    useWorkshopStore.getState().start('fixture-flow', 'a1', 'US')
    useWorkshopStore.getState().pause()
    // Persona region changes after the workshop started — a real scenario
    // (switching role/region on the fly). The dock's own resume must still
    // resolve against 'US' (workshopRegion), not whatever persona now says.
    usePersonaStore.setState({ selectedRegion: 'apac' })
    renderEntry()
    expect(await screen.findByText('Step a1')).toBeInTheDocument()
  })
})
