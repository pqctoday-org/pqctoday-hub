// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModuleJourneyHeader } from './ModuleJourneyHeader'
import { ModuleFitStrip } from './ModuleFitStrip'
import { renderAt, resetJourneyWorld, saveObjective, saveTlsObjective } from './journeyTestUtils'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_IDS } from '@/data/personaIds'
import { moduleContext } from '@/services/journey/moduleContext'
import { lessonById } from '@/services/journey/lessons'
import { MATRIX_MODULES } from '@/services/journey/fixtures'

beforeEach(() => {
  resetJourneyWorld()
  usePersonaStore.setState({ selectedPersona: 'architect', experienceLevel: 'basics' })
})

describe('the module page header (P4)', () => {
  it('shows the step bar, with no lens, when the module is a step of the objective in focus', () => {
    saveTlsObjective()
    renderAt(<ModuleJourneyHeader moduleId="tls-basics" />, '/learn/tls-basics')
    expect(screen.getByTestId('journey-step-bar')).toBeInTheDocument()
    expect(screen.queryByTestId('other-role-lens')).not.toBeInTheDocument()
  })

  it("records the step the learner is on as the objective's checkpoint", () => {
    const id = saveTlsObjective()
    renderAt(<ModuleJourneyHeader moduleId="tls-basics" />, '/learn/tls-basics')
    const o = useJourneyStore.getState().objectives[id]
    const tls = o.steps.find((s) => s.resourceTag === lessonById('tls-basics')!.lmId)!
    expect(o.checkpoint.stepId).toBe(tls.id)
  })

  it('shows the other-role lens for a module outside the role path, and offers View as and a 3-line summary', async () => {
    const user = userEvent.setup()
    renderAt(<ModuleJourneyHeader moduleId="exec-quantum-impact" />, '/learn/exec-quantum-impact')
    const lens = screen.getByTestId('other-role-lens')
    expect(lens).toHaveTextContent('Outside the Security Architect path')
    expect(lens).toHaveTextContent('Nothing is hidden.')
    expect(screen.queryByTestId('journey-step-bar')).not.toBeInTheDocument()
    await user.click(within(lens).getByRole('button', { name: 'Read a 3-line summary' }))
    expect(screen.getByTestId('lens-summary')).toHaveTextContent(
      lessonById('exec-quantum-impact')!.description
    )
    await user.click(within(lens).getByRole('button', { name: /^View as / }))
    expect(screen.getByRole('dialog', { name: 'Change role' })).toBeInTheDocument()
  })

  it('shows no lens without a role', () => {
    usePersonaStore.setState({ selectedPersona: null })
    renderAt(<ModuleJourneyHeader moduleId="exec-quantum-impact" />, '/learn/exec-quantum-impact')
    expect(screen.queryByTestId('other-role-lens')).not.toBeInTheDocument()
  })

  it('shows the resume line when the module opens with some sections read, and not when a link names a section', async () => {
    const user = userEvent.setup()
    const lesson = lessonById('pqc-101')!
    // read the first section only
    useModuleStore.setState({
      modules: {
        [lesson.id]: {
          status: 'in-progress',
          lastVisited: 1,
          timeSpent: 0,
          completedSteps: [],
          quizScores: {},
          learnSectionChecks: { 'quantum-threat': true },
        },
      },
    })
    const { unmount } = renderAt(<ModuleJourneyHeader moduleId="pqc-101" />, '/learn/pqc-101')
    const line = screen.getByTestId('resume-line')
    expect(line).toHaveTextContent('Opened where you left off:')
    await user.click(within(line).getByRole('button', { name: 'Why this?' }))
    expect(line).toHaveTextContent(/You have read 1 of \d+ sections/)
    await user.click(within(line).getByRole('button', { name: 'Start from the top' }))
    expect(screen.queryByTestId('resume-line')).not.toBeInTheDocument()
    unmount()
    renderAt(<ModuleJourneyHeader moduleId="pqc-101" />, '/learn/pqc-101?section=quantum-threat')
    expect(screen.queryByTestId('resume-line')).not.toBeInTheDocument()
  })

  it('shows no resume line for a module with nothing read, or all read', () => {
    renderAt(<ModuleJourneyHeader moduleId="pqc-101" />, '/learn/pqc-101')
    expect(screen.queryByTestId('resume-line')).not.toBeInTheDocument()
  })

  it('adds nothing to a page that is not a lesson (the quiz)', () => {
    renderAt(<ModuleJourneyHeader moduleId="quiz" />, '/learn/quiz')
    expect(screen.queryByTestId('module-journey-header')).not.toBeInTheDocument()
  })

  it('renders the update strip mount point (the Revised strip) and nothing else for a plain visit', () => {
    usePersonaStore.setState({ selectedPersona: null })
    renderAt(<ModuleJourneyHeader moduleId="pqc-101" />, '/learn/pqc-101')
    expect(document.querySelector('[data-mount="module-update-strip"]')).not.toBeNull()
  })

  it("shows the step bar of the focused objective only for the learner's own role", () => {
    saveObjective('Brief the board on quantum risk', 'executive')
    renderAt(<ModuleJourneyHeader moduleId="tls-basics" />, '/learn/tls-basics')
    // the architect has no objective: the executive one is not shown
    expect(screen.queryByTestId('journey-step-bar')).not.toBeInTheDocument()
  })
})

describe('six-module matrix, rendered: every persona, every module', () => {
  for (const persona of PERSONA_IDS) {
    it(`${persona}: lens and step bar match the rules on all six modules`, () => {
      usePersonaStore.setState({ selectedPersona: persona })
      for (const moduleId of MATRIX_MODULES) {
        const expected = moduleContext({ moduleId, persona, focused: null })
        const { unmount } = renderAt(
          <ModuleJourneyHeader moduleId={moduleId} />,
          `/learn/${moduleId}`
        )
        const lens = screen.queryAllByTestId('other-role-lens').length === 1
        expect(lens, `${persona} · ${moduleId} lens`).toBe(expected.lens)
        expect(screen.queryByTestId('journey-step-bar')).not.toBeInTheDocument()
        unmount()
      }
    })

    it(`${persona}: a step of the objective in focus shows the step bar on its module`, () => {
      usePersonaStore.setState({ selectedPersona: persona })
      for (const moduleId of MATRIX_MODULES) {
        const tag = lessonById(moduleId)!.lmId
        const goalWords = `${lessonById(moduleId)!.title} ${persona}`
        resetJourneyWorld()
        usePersonaStore.setState({ selectedPersona: persona })
        // an objective for this role whose step is the module
        useJourneyStore.getState().createObjective({
          state: 'ready',
          goal: goalWords,
          role: persona,
          steps: [
            { tag, kind: 'module', required: true, origin: { type: 'match' }, alreadyDone: false },
          ],
          mapped: [tag],
          notCovered: [],
          alreadyDone: [],
          duplicateOf: null,
          firstStepTag: tag,
        })
        const { unmount } = renderAt(
          <ModuleJourneyHeader moduleId={moduleId} />,
          `/learn/${moduleId}`
        )
        expect(
          screen.getByTestId('journey-step-bar'),
          `${persona} · ${moduleId}`
        ).toBeInTheDocument()
        expect(screen.queryByTestId('other-role-lens')).not.toBeInTheDocument()
        unmount()
      }
    })
  }
})

describe('one strip under the title', () => {
  it('joins the learning-order line and the NICE line in one container, each once', () => {
    renderAt(<ModuleFitStrip moduleId="tls-basics" />)
    const strip = screen.getByTestId('module-fit-strip')
    expect(within(strip).getAllByRole('navigation', { name: 'Where this fits' })).toHaveLength(1)
    expect(within(strip).getAllByTestId('nice-coverage-panel')).toHaveLength(1)
    expect(screen.getAllByTestId('module-fit-strip')).toHaveLength(1)
    // stage, take first and next are shown once
    expect(within(strip).getAllByText(/^Stage \d/)).toHaveLength(1)
    expect(within(strip).getAllByText('Next:')).toHaveLength(1)
  })

  it('shows nothing for a page with neither', () => {
    renderAt(<ModuleFitStrip moduleId="quiz" />)
    expect(screen.queryByTestId('module-fit-strip')).not.toBeInTheDocument()
  })
})
