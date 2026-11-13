// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimulationView } from './SimulationView'
import { loadSampleOrganisation } from './sampleOrganisation'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { SIM_TREES, flattenTree, isGatingStep, type TreeStep } from '@/simulation'
import { SCENARIO_OPERATION_CASES } from '@/data/simOperationCapabilities'
import { ARCHITECTURES } from '@/data/simArchitecture'
import { planningForArchitecture } from '@/simulation/edgePlanningProgress'

// Only the shell choice is mocked. Assessment, trees, completion, decisions,
// effort, eligibility and the inline UI all use their actual implementation.
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => true }))

const originalOperationCases = { ...SCENARIO_OPERATION_CASES.small }
afterEach(() => Object.assign(SCENARIO_OPERATION_CASES.small, originalOperationCases))

const p5Steps = flattenTree(SIM_TREES.p5!).filter(isGatingStep)
const correctLabels = new Set(
  Object.values(SIM_TREES).flatMap((tree) =>
    tree!.levels.flatMap((band) =>
      band.activities.flatMap((activity) => [
        ...(activity.decision ? [activity.decision] : []),
        ...activity.steps.map((step) => step.label),
      ])
    )
  )
)

function completePrecedingStep(step: TreeStep) {
  const sim = useSimulationStore.getState()
  switch (step.kind) {
    case 'learn':
      if (step.moduleId)
        useModuleStore.getState().updateModuleProgress(step.moduleId, { status: 'completed' })
      break
    case 'catalog':
      if (step.catalogId) sim.markCatalogStepDone(step.catalogId)
      break
    case 'reference':
      if (step.refId) sim.markRefVisited(step.refId)
      break
    case 'workshop':
      if (step.workshopId) sim.markWorkshopVisited(step.workshopId)
      break
    case 'activity':
      if (step.artifactType)
        useModuleStore.getState().addExecutiveDocument({
          id: `edge-fixture-${step.artifactType}`,
          moduleId: 'edge-test-setup',
          type: step.artifactType,
          title: 'Fictional preceding P5 work',
          data: '# Sample plan',
          createdAt: Date.now(),
        })
      break
    case 'architecture':
      // The second-step fixture satisfies its first architecture predecessor
      // with actual saved choices, never an auto-completion or mocked predicate.
      expect(
        planningForArchitecture(ARCHITECTURES.small, 1, sim.edgeDecisions).selectedKeys.length
      ).toBeGreaterThanOrEqual(step.minDecisions!)
      break
    default:
      throw new Error(`Unexpected preceding P5 step requires a real fixture: ${step.kind}`)
  }
}

function prepareArchitecture(minDecisions: number) {
  const index = p5Steps.findIndex(
    (step) => step.kind === 'architecture' && step.minDecisions === minDecisions
  )
  expect(index).toBeGreaterThan(0)
  for (const step of p5Steps.slice(0, index)) completePrecedingStep(step)
  expect(useSimulationStore.getState().auto).toEqual([])
  return index / p5Steps.length
}

function priorWork() {
  const sim = useSimulationStore.getState(),
    modules = useModuleStore.getState()
  return JSON.parse(
    JSON.stringify({
      modules: modules.modules,
      documents: modules.artifacts.executiveDocuments,
      catalog: sim.catalogCompleted,
      refs: sim.visitedRefs,
      workshops: sim.visitedWorkshops,
      auto: sim.auto,
    })
  )
}

function openPilots() {
  render(
    <MemoryRouter initialEntries={['/simulation']}>
      <SimulationView />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /(Play|Resume) Pilots/i }))
  return screen.getByTestId('sim-mobile-decide')
}

function decisionOption(board: HTMLElement, correct: boolean) {
  const option = within(board)
    .getAllByRole('button', { name: /^Option [A-Z]:/ })
    .find((button) => {
      const label = button.getAttribute('aria-label')!.replace(/^Option [A-Z]: /, '')
      return correctLabels.has(label) === correct
    })
  expect(option).toBeDefined()
  return option!
}

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState(useModuleStore.getInitialState(), true)
  useAssessmentResultStore.getState().reset()
  useAssessmentFormStore.getState().reset()
  loadSampleOrganisation()
  // Use the existing fictional sample assessment with a small estate so the
  // real 3-edge topology supplies a bounded, named case for the inline controls.
  const sample = useAssessmentResultStore.getState().lastResult!
  useAssessmentResultStore.setState({
    lastResult: {
      ...sample,
      assessmentProfile: { ...sample.assessmentProfile!, systemScale: '1-10' },
    },
  })
  useSimulationStore.setState({ sel: 'p5', size: 'small', tourSeen: true })
})

describe('SimulationView actual phone edge planning', () => {
  it('does not count a signing-only endpoint as key-establishment capable in the actual phone step', () => {
    const key = 'user-cdn-TLS 1.3',
      original = originalOperationCases['user-cdn-TLS 1.3']
    Object.assign(SCENARIO_OPERATION_CASES.small, {
      [key]: {
        ...original,
        to: {
          ...original.to,
          capabilities: { 'produce-signature-through-provider-api': 'available' },
        },
      },
    })
    useSimulationStore.setState({ edgeDecisions: { [key]: 'hybrid', 'outside-case': 'pure' } })
    prepareArchitecture(2)
    const work = priorWork(),
      board = openPilots()
    fireEvent.click(decisionOption(board, true))
    expect(within(board).getByText(/0\/2 decisions — pick Hybrid or Pure PQC/)).toBeInTheDocument()
    expect(within(board).getAllByRole('button', { name: /^Hybrid$/ })).toHaveLength(2)
    fireEvent.click(within(board).getByText('Scenario endpoint capabilities'))
    expect(within(board).getByText(/cdn: key establishment unknown/)).toBeVisible()
    expect(
      within(board).getByText(/explicit fictional assumptions, not vendor claims/)
    ).toBeVisible()
    fireEvent.click(within(board).getByRole('button', { name: 'Undo user to cdn (TLS 1.3)' }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'outside-case': 'pure' })
    expect(priorWork()).toEqual(work)
  })

  it('never skips an architecture step when all required operation capabilities are missing', () => {
    for (const [key, original] of Object.entries(originalOperationCases)) {
      Object.assign(SCENARIO_OPERATION_CASES.small, {
        [key]: {
          ...original,
          from: { ...original.from, capabilities: {} },
          to: { ...original.to, capabilities: {} },
        },
      })
    }
    prepareArchitecture(2)
    const board = openPilots()
    fireEvent.click(decisionOption(board, true))
    expect(
      within(board).getByText(
        'No operation-eligible links in this case. This step is not complete.'
      )
    ).toBeVisible()
    expect(
      within(board).queryByText(/migration decisions made — this step is credited/)
    ).not.toBeInTheDocument()
    expect(within(board).queryByRole('button', { name: /^Hybrid$/ })).not.toBeInTheDocument()
    expect(planningForArchitecture(ARCHITECTURES.small, 1, {}).creditedKeys).toEqual([])
  })

  it('does not skip min2 architecture for stale, malformed or unavailable keys, and removes only the chosen saved input', () => {
    useSimulationStore.setState({
      edgeDecisions: {
        'user-cdn-TLS 1.3': 'invalid' as 'hybrid',
        'app-db-TLS (wire)': 'hybrid',
        'previous-case-link': 'pure',
      },
    })
    const effort = prepareArchitecture(2)
    const work = priorWork()
    const board = openPilots()
    fireEvent.click(decisionOption(board, true))
    expect(within(board).getByText(/Right call/)).toBeInTheDocument()
    expect(within(board).getByText(/0\/2 decisions — pick Hybrid or Pure PQC/)).toBeInTheDocument()
    expect(
      within(board).getByText(/Unavailable or invalid saved choices receive no credit/)
    ).toBeInTheDocument()

    fireEvent.click(within(board).getByRole('button', { name: 'Undo app to db (TLS (wire))' }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({
      'user-cdn-TLS 1.3': 'invalid',
      'previous-case-link': 'pure',
    })
    fireEvent.click(
      within(board).getByRole('button', {
        name: 'Remove saved choice for unknown link previous-case-link',
      })
    )
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'user-cdn-TLS 1.3': 'invalid' })
    fireEvent.click(within(board).getByRole('button', { name: 'Undo user to cdn (TLS 1.3)' }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({})
    expect(priorWork()).toEqual(work)
    expect(within(board).getByText(/0\/2 decisions — pick Hybrid or Pure PQC/)).toBeInTheDocument()
    fireEvent.click(within(board).getAllByRole('button', { name: /^Hybrid$/ })[0])
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'user-cdn-TLS 1.3': 'hybrid' })
    expect(
      planningForArchitecture(
        ARCHITECTURES.small,
        effort,
        useSimulationStore.getState().edgeDecisions
      ).creditedKeys
    ).toEqual(['user-cdn-TLS 1.3'])
    expect(within(board).getByText(/1\/2 decisions — pick Hybrid or Pure PQC/)).toBeInTheDocument()
  })

  it('Undo on the real wave picker preserves unknown history and preceding work as the earlier step reopens', () => {
    useSimulationStore.setState({
      edgeDecisions: {
        'user-cdn-TLS 1.3': 'hybrid',
        'cdn-app-TLS': 'pure',
        'earlier-case-choice': 'hybrid',
      },
    })
    prepareArchitecture(4)
    // Do not infer effort from the preceding-step index: these two choices
    // also satisfy the later >=40% decision-coverage measure. Its real extra
    // completion raises effort to >=15/22, so this is not an overcapacity
    // fixture. Effort-loss warning coverage lives in ArchitecturePanel's
    // actual rerender test; no progress predicate is mocked here to force it.
    const work = priorWork()
    const board = openPilots()
    fireEvent.click(decisionOption(board, true))
    expect(within(board).getByText(/2\/3 decisions — pick Hybrid or Pure PQC/)).toBeInTheDocument()
    fireEvent.click(within(board).getByRole('button', { name: 'Undo cdn to app (TLS)' }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({
      'user-cdn-TLS 1.3': 'hybrid',
      'earlier-case-choice': 'hybrid',
    })
    expect(priorWork()).toEqual(work)
    fireEvent.click(decisionOption(board, true))
    expect(within(board).getByText(/1\/2 decisions — pick Hybrid or Pure PQC/)).toBeInTheDocument()
    fireEvent.click(
      within(board).getByRole('button', {
        name: 'Remove saved choice for unknown link earlier-case-choice',
      })
    )
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'user-cdn-TLS 1.3': 'hybrid' })
    expect(priorWork()).toEqual(work)
  })

  it('a real P5 wrong-decision setback removes the last current valid choice, preserving later stale inputs', () => {
    useSimulationStore.setState({
      edgeDecisions: {
        'user-cdn-TLS 1.3': 'hybrid',
        'admin-vpn-IKEv2': 'pure',
        'cdn-app-TLS': 'invalid' as 'hybrid',
        'app-db-TLS (wire)': 'hybrid',
        'last-inserted-old-case': 'pure',
      },
    })
    const before = useSimulationStore.getState()
    const quarter = before.year * 4 + before.q
    const work = priorWork()
    const board = openPilots()
    fireEvent.click(decisionOption(board, false))
    expect(within(board).getByText('✕ Common failure')).toBeInTheDocument()
    const after = useSimulationStore.getState()
    expect(after.year * 4 + after.q - quarter).toBe(2)
    expect(after.edgeDecisions).toEqual({
      'user-cdn-TLS 1.3': 'hybrid',
      'cdn-app-TLS': 'invalid',
      'app-db-TLS (wire)': 'hybrid',
      'last-inserted-old-case': 'pure',
    })
    expect(after.events[0].txt).toContain('rolled back link admin-vpn-IKEv2')
    expect(priorWork()).toEqual(work)
  })
})
