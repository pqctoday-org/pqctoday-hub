// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  BeltScoreMount,
  ModuleCommentsMount,
  MyWorkMount,
  ObjectiveWorkLine,
  StepNotesMount,
  UpdatesMount,
  useUpdatesCount,
} from './mountPoints'
import { ObjectiveHeaderSlot } from '@/components/Assistant/ObjectiveHeaderSlot'
import { renderAt, resetJourneyWorld, saveObjective, saveTlsObjective } from './journeyTestUtils'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { setAssistantEngineLoader } from '@/components/Assistant/assistantClient'
import { usePersonaStore } from '@/store/usePersonaStore'
import { usePanelObjectives } from '@/hooks/useJourney'
import { barSteps } from '@/services/journey/stepRules'
import { lessonById } from '@/services/journey/lessons'

beforeEach(() => {
  resetJourneyWorld()
  useMyWorkStore.setState({ comments: [], outputs: [], answers: [], references: [] })
  usePersonaStore.setState({ selectedPersona: 'architect', experienceLevel: 'basics' })
})

function Probe({ onValue }: { onValue: (v: ReturnType<typeof usePanelObjectives>) => void }) {
  onValue(usePanelObjectives())
  return null
}

describe('the objectives as My work and Updates read them', () => {
  it("gives lesson steps only, with the tag, and the status from the learner's completions", () => {
    const id = saveTlsObjective()
    const first = barSteps(useJourneyStore.getState().objectives[id])[0]
    useJourneyStore.getState().markStepComplete(id, first.id)
    let got: ReturnType<typeof usePanelObjectives> | undefined
    renderAt(<Probe onValue={(v) => (got = v)} />)
    const work = got!.work[0]
    const updates = got!.updates[0]
    expect(work.id).toBe(id)
    expect(work.steps.length).toBe(updates.steps.length)
    expect(work.steps.every((s) => /^LM-\d+$/.test(s.tag))).toBe(true)
    expect(updates.steps[0]).toMatchObject({
      tag: first.resourceTag,
      status: 'completed',
      required: true,
    })
    expect(updates.steps.filter((s) => s.status === 'now')).toHaveLength(1)
    expect(updates.state).toBe('active')
  })

  it("gives only the learner's own role's objectives", () => {
    saveObjective('Brief the board on quantum risk', 'executive')
    let got: ReturnType<typeof usePanelObjectives> | undefined
    renderAt(<Probe onValue={(v) => (got = v)} />)
    expect(got!.work).toHaveLength(0)
  })
})

describe('mount points hold the real panels', () => {
  it('My work shows a comment written on a lesson of the objective, filed under it', async () => {
    const id = saveTlsObjective()
    const tag = barSteps(useJourneyStore.getState().objectives[id])[1].resourceTag
    act(() => {
      useMyWorkStore.getState().addComment({ id: 'c1', tag, body: 'Check the hybrid group list' })
    })
    renderAt(<MyWorkMount objectiveId={id} />)
    expect(await screen.findByText('Check the hybrid group list')).toBeInTheDocument()
    expect(document.querySelector('[data-mount="my-work"]')).not.toBeNull()
    expect(screen.getByText(/Stored on this device only/)).toBeInTheDocument()
  })

  it('"Open the answer" asks the saved question again in the drawer', async () => {
    const user = userEvent.setup()
    setAssistantEngineLoader(() => import('@/test/fixtures/assistantFixtureEngine'))
    useAssistantSessionStore.getState().reset()
    useAchievementStore.getState().resetAchievements()
    useRightPanelStore.setState({ isOpen: false })
    act(() => {
      useMyWorkStore.getState().saveAnswer({
        id: 'ans-1',
        question: 'What is ML-KEM?',
        savedAt: '2026-11-25T10:00:00.000Z',
        payload: { answerText: 'A key encapsulation mechanism.', note: '', rowTags: ['GL:ml-kem'] },
      })
    })
    renderAt(<MyWorkMount />)
    await user.click(await screen.findByRole('button', { name: 'Open the answer' }))
    expect(useRightPanelStore.getState().isOpen).toBe(true)
    expect(useRightPanelStore.getState().activeTab).toBe('chat')
    expect(useAssistantSessionStore.getState().turns.map((t) => t.question)).toEqual([
      'What is ML-KEM?',
    ])
    // The saved copy is untouched.
    expect(useMyWorkStore.getState().answers).toHaveLength(1)
    // Asking it again is a question sent: counted once, as a number.
    expect(useAchievementStore.getState().assistantQuestionCount).toBe(1)
    setAssistantEngineLoader()
    useAssistantSessionStore.getState().reset()
  })

  it("counts the objective's work the way My work does", () => {
    const id = saveTlsObjective()
    const tag = barSteps(useJourneyStore.getState().objectives[id])[0].resourceTag
    renderAt(<ObjectiveWorkLine objectiveId={id} />)
    expect(screen.getByText('Work: 0 comments · 0 artifacts')).toBeInTheDocument()
    act(() => {
      useMyWorkStore.getState().addComment({ id: 'c2', tag, body: 'one' })
    })
    expect(screen.getByText('Work: 1 comment · 0 artifacts')).toBeInTheDocument()
  })

  it('Updates shows the up-to-date line with nothing new', async () => {
    saveTlsObjective()
    renderAt(<UpdatesMount />)
    expect(document.querySelector('[data-mount="updates"]')).not.toBeNull()
    expect(await screen.findByText(/up to date/i)).toBeInTheDocument()
  })

  it("the module comment box saves a comment on the lesson's tag", async () => {
    const user = userEvent.setup()
    renderAt(<ModuleCommentsMount moduleId="tls-basics" />)
    await user.click(screen.getByRole('button', { name: /add a comment/i }))
    await user.type(screen.getByLabelText(/add a comment on/i), 'Remember the downgrade case')
    await user.click(screen.getByRole('button', { name: /save comment/i }))
    const saved = useMyWorkStore.getState().comments
    expect(saved).toHaveLength(1)
    expect(saved[0].tag).toBe(lessonById('tls-basics')!.lmId)
  })

  it("the step notes are comments on the objective's last lesson, so they show in My work", async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    const o = useJourneyStore.getState().objectives[id]
    const last = barSteps(o)
      .filter((s) => s.kind === 'module')
      .at(-1)!
    renderAt(<StepNotesMount objectiveId={id} stepId={barSteps(o).at(-1)!.id} outline={[]} />)
    await user.click(screen.getByRole('button', { name: /add a comment/i }))
    await user.type(screen.getByLabelText(/add a comment on/i), 'My outcome notes')
    await user.click(screen.getByRole('button', { name: /save comment/i }))
    expect(useMyWorkStore.getState().comments[0]).toMatchObject({ tag: last.resourceTag })
  })

  it('the belt strip mount holds the progress strip', () => {
    renderAt(<BeltScoreMount />)
    expect(screen.getByRole('region', { name: 'Your progress' })).toBeInTheDocument()
  })
})

describe('the drawer header objective area', () => {
  it('says No objective yet without one, and offers Start an objective', async () => {
    const user = userEvent.setup()
    renderAt(<ObjectiveHeaderSlot />, '/playground')
    expect(screen.getByText('No objective yet')).toBeInTheDocument()
    const start = screen.getByRole('link', { name: 'Start an objective' })
    expect(start).toHaveAttribute('href', '/learn?mode=journey&new=1')
    await user.click(start)
    expect(screen.getByTestId('where')).toHaveTextContent('/learn?mode=journey&new=1')
  })

  it('on a phone, Start an objective closes the sheet so the form is in view', async () => {
    const user = userEvent.setup()
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query === '(max-width: 1023px)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
    useRightPanelStore.setState({ isOpen: true, activeTab: 'chat' })
    renderAt(<ObjectiveHeaderSlot />, '/playground')
    try {
      await user.click(screen.getByRole('link', { name: 'Start an objective' }))
      expect(useRightPanelStore.getState().isOpen).toBe(false)
    } finally {
      window.matchMedia = original
    }
  })

  it('offers New objective beside Manage objectives once objectives exist', async () => {
    const user = userEvent.setup()
    saveTlsObjective()
    renderAt(<ObjectiveHeaderSlot />, '/playground')
    const slot = screen.getByTestId('objective-header-slot')
    expect(within(slot).queryByRole('link', { name: 'Start an objective' })).not.toBeInTheDocument()
    await user.click(within(slot).getByRole('button', { name: 'Switch' }))
    const fresh = within(slot).getByRole('link', { name: 'New objective' })
    expect(fresh).toHaveAttribute('href', '/learn?mode=journey&new=1')
    expect(within(slot).getByRole('link', { name: 'Manage objectives' })).toBeInTheDocument()
  })

  it('shows the objective in focus, offers Switch and Manage objectives, and Go to your current step', async () => {
    const user = userEvent.setup()
    const a = saveTlsObjective()
    const b = saveObjective('Secure boot and firmware signing for our devices')
    renderAt(<ObjectiveHeaderSlot />, '/playground')
    const slot = screen.getByTestId('objective-header-slot')
    expect(
      within(slot).getByText('Secure boot and firmware signing for our devices')
    ).toBeInTheDocument()
    expect(
      within(slot).getByRole('button', { name: 'Go to your current step' })
    ).toBeInTheDocument()
    await user.click(within(slot).getByRole('button', { name: 'Switch' }))
    expect(within(slot).getByRole('link', { name: 'Manage objectives' })).toBeInTheDocument()
    await user.click(within(slot).getByRole('button', { name: 'Review our TLS migration design' }))
    expect(useJourneyStore.getState().focus.architect).toBe(a)
    void b
  })

  it("hides Go to your current step on that step's own page", () => {
    saveTlsObjective()
    const o = Object.values(useJourneyStore.getState().objectives)[0]
    const now = barSteps(o)[0]
    const lesson = lessonById('pqc-101')
    void now
    renderAt(<ObjectiveHeaderSlot />, `/learn/${lesson!.id}`)
    expect(
      screen.queryByRole('button', { name: 'Go to your current step' })
    ).not.toBeInTheDocument()
  })

  it('counts the changes in an objective in its update link, with the same number as the Updates tab', () => {
    const id = saveTlsObjective()
    // A retired step is a change the Updates tab counts; no release notice is involved.
    useJourneyStore.setState((s) => {
      const o = s.objectives[id]
      return {
        objectives: {
          ...s.objectives,
          [id]: {
            ...o,
            steps: [
              ...o.steps,
              {
                id: `${id}-s90`,
                position: o.steps.length + 1,
                kind: 'module',
                resourceTag: 'LM-032',
                required: true,
                origin: { type: 'match' },
              },
            ],
          },
        },
      }
    })
    function Tab() {
      return <p data-testid="tab-count">{useUpdatesCount()}</p>
    }
    renderAt(
      <>
        <Tab />
        <ObjectiveHeaderSlot />
      </>,
      '/playground'
    )
    expect(screen.getByTestId('tab-count')).toHaveTextContent('1')
    expect(
      screen.getByRole('link', { name: /1 update affects this objective/ })
    ).toBeInTheDocument()
  })

  it('shows a paused objective as Paused', () => {
    const id = saveTlsObjective()
    useJourneyStore.getState().pauseObjective(id)
    renderAt(<ObjectiveHeaderSlot />)
    expect(screen.getByText('Paused')).toBeInTheDocument()
  })
})
