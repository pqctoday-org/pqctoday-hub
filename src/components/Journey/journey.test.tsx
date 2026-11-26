// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from 'react-router'
import { JourneyStepBar } from './JourneyStepBar'
import { CompletePanel } from './CompletePanel'
import { NewObjectiveFlow } from './NewObjectiveFlow'
import { RoleSwitchDialog, RoleSwitchNotice } from './RoleSwitch'
import { RoleMapView } from './RoleMapView'
import { YourJourneyView } from './YourJourneyView'
import {
  renderAt,
  resetJourneyWorld,
  saveObjective,
  saveTlsObjective,
  TLS_GOAL,
  Where,
} from './journeyTestUtils'
import { useJourneyStore } from '@/store/useJourneyStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { rolePathForPersona, rolePathForWorkRole } from '@/services/journey/rolePaths'
import { validateDeepLink } from '@/services/search/deepLinkGrammar'
import { lessonByTag } from '@/services/journey/lessons'
import { barSteps } from '@/services/journey/stepRules'
import { COPY } from '@/services/journey/stepRules'

beforeEach(() => {
  resetJourneyWorld()
  usePersonaStore.setState({ selectedPersona: 'architect', experienceLevel: 'basics' })
})

const objective = (id: string) => useJourneyStore.getState().objectives[id]

describe('step bar (A02 to A04, J02, J03)', () => {
  function bar(id: string, currentStepIndex: number, onOpen = () => {}, onComplete = () => {}) {
    const o = objective(id)
    return renderAt(
      <JourneyStepBar
        objective={o}
        currentStepId={barSteps(o)[currentStepIndex].id}
        onOpenStep={onOpen}
        onComplete={onComplete}
      />
    )
  }

  it('shows one step bar with every required step and the position', () => {
    const id = saveTlsObjective()
    bar(id, 0)
    const nav = screen.getByRole('navigation', { name: 'Objective steps list' })
    expect(within(nav).getAllByRole('button')).toHaveLength(barSteps(objective(id)).length)
    expect(within(nav).getByRole('button', { current: 'step' })).toBeInTheDocument()
    expect(screen.getByText(`Step 1 of ${barSteps(objective(id)).length}`)).toBeInTheDocument()
  })

  it('keeps Next off until the step is complete, with the hint, then unlocks it and announces', async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    bar(id, 0)
    expect(screen.getByRole('button', { name: /^Next/ })).toBeDisabled()
    expect(screen.getByTestId('journey-next-hint')).toHaveTextContent(COPY.stepHint)
    await user.click(screen.getByRole('button', { name: 'Mark complete' }))
    expect(screen.getByRole('button', { name: /^Next/ })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 marked complete. Next unlocked.')
  })

  it('opens the following step with Next and the previous one with Prev', async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    const opened: string[] = []
    const o = objective(id)
    useJourneyStore.getState().markStepComplete(id, o.steps[0].id)
    renderAt(
      <JourneyStepBar
        objective={objective(id)}
        currentStepId={o.steps[1].id}
        onOpenStep={(s) => opened.push(s.id)}
        onComplete={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: /^Previous:/ }))
    expect(opened).toEqual([o.steps[0].id])
  })

  it('offers Undo instead of Mark complete on a phone, right after marking', async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    const o = objective(id)
    renderAt(
      <JourneyStepBar
        objective={o}
        currentStepId={o.steps[0].id}
        compact
        onOpenStep={() => {}}
        onComplete={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Mark complete' }))
    expect(screen.queryByRole('button', { name: 'Mark complete' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeInTheDocument()
    expect(useJourneyStore.getState().completions).toEqual({})
  })

  it('becomes "Complete the objective…" on the last step and calls the panel', async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    let called = 0
    const last = barSteps(objective(id)).length - 1
    bar(
      id,
      last,
      () => {},
      () => (called += 1)
    )
    expect(screen.getByTestId('journey-next-hint')).toHaveTextContent(COPY.stepLastBlocked)
    await user.click(screen.getByRole('button', { name: COPY.stepLast }))
    expect(called).toBe(1)
    expect(screen.queryByRole('button', { name: 'Mark complete' })).not.toBeInTheDocument()
  })

  it('says why Next is off on a paused objective and warns about reading ahead', () => {
    const id = saveTlsObjective()
    useJourneyStore.getState().pauseObjective(id)
    bar(id, 0)
    expect(screen.getByTestId('journey-next-hint')).toHaveTextContent(COPY.paused)
    expect(screen.queryByRole('button', { name: 'Mark complete' })).not.toBeInTheDocument()
  })

  it('warns when a step is read ahead of the earlier ones', () => {
    const id = saveTlsObjective()
    bar(id, 2)
    expect(screen.getByText(COPY.stepAhead)).toBeInTheDocument()
  })
})

describe('complete panel (A08, J07)', () => {
  function panel(id: string) {
    return renderAt(
      <CompletePanel objective={objective(id)} open onClose={() => {}} onGoToStep={() => {}} />
    )
  }

  it('is blocked with the module wording, names the first unfinished step and keeps Mark disabled', () => {
    const id = saveTlsObjective()
    panel(id)
    expect(screen.getByTestId('complete-note')).toHaveTextContent(COPY.completeBlockedReview)
    const first = lessonByTag(barSteps(objective(id))[0].resourceTag)!
    expect(screen.getByRole('button', { name: `Go to ${first.title}` })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark objective complete' })).toBeDisabled()
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it("needs the learner's own confirmation, then completes only this objective", async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    const other = saveObjective('Brief the board on quantum risk')
    for (const s of objective(id).steps.filter((x) => x.required && x.kind === 'module')) {
      useJourneyStore.getState().markStepComplete(id, s.id)
    }
    panel(id)
    expect(screen.getByTestId('complete-note')).toHaveTextContent(COPY.completeAllowed)
    const mark = screen.getByRole('button', { name: 'Mark objective complete' })
    expect(mark).toBeDisabled()
    await user.click(screen.getByRole('checkbox'))
    expect(mark).toBeEnabled()
    await user.click(mark)
    expect(objective(id).state).toBe('completed')
    expect(objective(other).state).toBe('active')
  })

  it('states the finish condition and that supporting work never counts', () => {
    const id = saveTlsObjective()
    panel(id)
    expect(screen.getByText(/Finish condition:/)).toBeInTheDocument()
    expect(screen.getByText(/They never count as proof of skill/)).toBeInTheDocument()
  })
})

describe('new objective (A02, T04, T05, X04)', () => {
  const ask = async (goal: string) => {
    const user = userEvent.setup()
    renderAt(<NewObjectiveFlow onCreated={() => {}} onCancel={() => {}} />)
    await user.type(screen.getByLabelText('What do you want to be able to do?'), goal)
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    return user
  }

  it('asks one question first for a broad goal and offers Preview again', async () => {
    await ask('quantum')
    expect(screen.getByText('One question first.')).toBeInTheDocument()
    expect(screen.getByText(/Is it for a decision, a design, or a briefing/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument()
  })

  it('previews without saving anything, then Create saves exactly what was shown', async () => {
    const user = await ask(TLS_GOAL)
    expect(screen.getByText('Preview · nothing is saved yet')).toBeInTheDocument()
    expect(useJourneyStore.getState().order).toHaveLength(0)
    const shown = within(screen.getByTestId('preview-ready'))
      .getAllByRole('listitem')
      .map((li) => li.textContent ?? '')
    await user.click(screen.getByRole('button', { name: 'Create objective' }))
    const saved = Object.values(useJourneyStore.getState().objectives)[0]
    expect(saved.goal).toBe(TLS_GOAL)
    for (const s of barSteps(saved).filter((x) => x.kind === 'module')) {
      const title = lessonByTag(s.resourceTag)!.title
      expect(shown.some((t) => t.includes(title))).toBe(true)
    }
  })

  it('keeps the goal and the preview when the device refuses the save, and Try again saves once (A09)', async () => {
    const user = userEvent.setup()
    const created: string[] = []
    renderAt(<NewObjectiveFlow onCreated={(id) => created.push(id)} onCancel={() => {}} />)
    await user.type(screen.getByLabelText('What do you want to be able to do?'), TLS_GOAL)
    await user.click(screen.getByRole('button', { name: 'Preview' }))

    const quota = Object.assign(new Error('full'), { name: 'QuotaExceededError' })
    const refuse = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota
    })
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await user.click(screen.getByRole('button', { name: 'Create objective' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Your objective was not saved.')
      expect(created).toEqual([])
      expect(useJourneyStore.getState().order).toHaveLength(0)
      expect(screen.getByLabelText('What do you want to be able to do?')).toHaveValue(TLS_GOAL)
      expect(screen.getByTestId('preview-ready')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus()
    } finally {
      refuse.mockRestore()
      quiet.mockRestore()
    }

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(created).toHaveLength(1)
    expect(useJourneyStore.getState().order).toHaveLength(1)
    expect(Object.values(useJourneyStore.getState().objectives)[0].goal).toBe(TLS_GOAL)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('leaving the preview creates nothing', async () => {
    const user = userEvent.setup()
    let cancelled = 0
    renderAt(<NewObjectiveFlow onCreated={() => {}} onCancel={() => (cancelled += 1)} />)
    await user.type(screen.getByLabelText('What do you want to be able to do?'), TLS_GOAL)
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(cancelled).toBe(1)
    expect(useJourneyStore.getState().order).toHaveLength(0)
  })

  it('names a duplicate of an open objective and offers Continue or Create anyway', async () => {
    const existing = saveTlsObjective()
    const user = await ask(TLS_GOAL)
    expect(screen.getByText('Preview · you already have this')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Continue the existing objective' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create anyway' }))
    expect(useJourneyStore.getState().order).toHaveLength(2)
    expect(useJourneyStore.getState().order[0]).toBe(existing)
  })

  it('reports a coverage gap with mapped and not-covered words, and no Create without mapped topics', async () => {
    await ask('xyzzy plugh frobnicate')
    expect(screen.getByText('Preview · coverage gap')).toBeInTheDocument()
    expect(screen.getByText(/Not covered/).closest('p')).toHaveTextContent('xyzzy')
    expect(screen.queryByRole('button', { name: /^Create/ })).not.toBeInTheDocument()
  })

  it('creates with the mapped topics when part of the goal is covered', async () => {
    const user = await ask('TLS banana smoothie recipe')
    expect(screen.getByText('Preview · coverage gap')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create with the mapped topics' }))
    expect(useJourneyStore.getState().order).toHaveLength(1)
  })
})

describe('role switch with preview and undo (A05)', () => {
  it("previews the change, switches on the learner's own act, and Undo restores the earlier role", async () => {
    const user = userEvent.setup()
    saveTlsObjective('architect')
    renderAt(
      <>
        <RoleSwitchDialog open onClose={() => {}} />
        <RoleSwitchNotice />
      </>
    )
    await user.click(screen.getByRole('radio', { name: /Executive/ }))
    const preview = screen.getByTestId('role-switch-preview')
    expect(preview).toHaveTextContent('Role map and suggested questions')
    expect(preview).toHaveTextContent('Default level: Awareness level')
    expect(preview).toHaveTextContent(/your Security Architect objectives stay saved/i)
    expect(usePersonaStore.getState().selectedPersona).toBe('architect')
    await user.click(screen.getByRole('button', { name: 'Switch to Executive / Business Leader' }))
    expect(usePersonaStore.getState().selectedPersona).toBe('executive')
    // evidence and the other role's objectives are untouched
    expect(Object.keys(useJourneyStore.getState().objectives)).toHaveLength(1)
    expect(screen.getByTestId('role-switch-notice')).toHaveTextContent('Now viewing as Executive')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(usePersonaStore.getState().selectedPersona).toBe('architect')
    expect(screen.queryByTestId('role-switch-notice')).not.toBeInTheDocument()
  })

  it('does not switch until a different role is picked, and Cancel changes nothing', async () => {
    const user = userEvent.setup()
    renderAt(<RoleSwitchDialog open onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Switch role' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(usePersonaStore.getState().selectedPersona).toBe('architect')
  })

  it('offers "Choose a role" with no role set, and Undo then clears it', async () => {
    const user = userEvent.setup()
    usePersonaStore.setState({ selectedPersona: null })
    renderAt(
      <>
        <RoleSwitchDialog open onClose={() => {}} />
        <RoleSwitchNotice />
      </>
    )
    expect(screen.getByRole('dialog', { name: 'Choose a role' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Security Architect/ }))
    await user.click(screen.getByRole('button', { name: /^Switch to/ }))
    expect(usePersonaStore.getState().selectedPersona).toBe('architect')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })

  it('closes on Escape', () => {
    let closed = 0
    renderAt(<RoleSwitchDialog open onClose={() => (closed += 1)} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closed).toBe(1)
  })
})

describe('role map (P7, A36)', () => {
  it('lists the computed path: ten rows, the length, "Start here" from the level, and the rest under "more"', async () => {
    const user = userEvent.setup()
    renderAt(<RoleMapView />)
    const path = rolePathForPersona('architect')!
    expect(screen.getAllByTestId('role-map-row')).toHaveLength(path.parts.length)
    // basics starts at stage 2
    const startHere = screen.getByText('Start here', { selector: 'span' })
    expect(startHere).toBeInTheDocument()
    expect(screen.queryByTestId('path-length')).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`more for this role \\(${path.more.length}\\)`, 'i'),
      })
    )
    expect(screen.getAllByTestId('role-map-row')).toHaveLength(path.total)
  })

  it('states the length for a role with fewer than ten lessons', () => {
    usePersonaStore.setState({ selectedPersona: 'researcher' })
    renderAt(<RoleMapView />)
    const path = rolePathForPersona('researcher')!
    expect(path.total).toBeLessThan(10)
    expect(screen.getByTestId('path-length')).toHaveTextContent(`${path.total} modules`)
    expect(screen.queryByRole('button', { name: /more for this role/i })).not.toBeInTheDocument()
  })

  it('gives the curious persona the common-ground lessons, with the practice quiz after them', () => {
    usePersonaStore.setState({ selectedPersona: 'curious', experienceLevel: 'curious' })
    renderAt(<RoleMapView />)
    expect(screen.getByText(/The common-ground lessons/)).toBeInTheDocument()
    const path = rolePathForPersona('curious')!
    expect(screen.getAllByTestId('role-map-row')).toHaveLength(path.parts.length)
    // the practice quiz is the 17th, outside the learning order
    expect(screen.getByRole('link', { name: path.outside[0].title })).toHaveAttribute(
      'href',
      '/learn/quiz'
    )
    expect(screen.queryByRole('button', { name: /more for this role/i })).not.toBeInTheDocument()
  })

  it('links the stages and the NICE areas to the Learn filters', () => {
    renderAt(<RoleMapView />)
    const byStage = screen.getByRole('region', { name: 'Your path by stage' })
    const stageLinks = within(byStage).getAllByRole('link')
    expect(stageLinks.length).toBeGreaterThan(0)
    for (const a of stageLinks) expect(a.getAttribute('href')).toMatch(/^\/learn\?stage=[1-5]$/)
    const byArea = screen.getByRole('region', { name: 'Your path by NICE area' })
    for (const a of within(byArea).getAllByRole('link')) {
      expect(a.getAttribute('href')).toMatch(/^\/learn\?area=CA-[A-Z]+$/)
    }
  })

  it('asks for a role when none is chosen and shows no path', () => {
    usePersonaStore.setState({ selectedPersona: null })
    renderAt(<RoleMapView />)
    expect(screen.getByText(/Choose a role to see its path/)).toBeInTheDocument()
    expect(screen.queryAllByTestId('role-map-row')).toHaveLength(0)
  })

  it('computes nothing it stores: the journey store holds no path', () => {
    renderAt(<RoleMapView />)
    expect(JSON.stringify(useJourneyStore.getState())).not.toMatch(/parts|more for this role/)
  })
})

describe('a link with a role: ?view=journey&role=<persona or work-role id>', () => {
  it('is in the Hub link grammar', () => {
    for (const id of ['architect', 'control-assessor']) {
      expect(validateDeepLink(`/learn?view=journey&role=${id}`)).toBeNull()
    }
  })

  it("opens Role map on that persona's path without switching the learner's role, with a way back", async () => {
    const user = userEvent.setup()
    usePersonaStore.setState({ selectedPersona: 'executive' })
    renderAt(<YourJourneyView />, '/learn?view=journey&role=architect')
    expect(screen.getByTestId('role-map')).toBeInTheDocument()
    expect(screen.getByTestId('role-preview')).toHaveTextContent(
      'Viewing the path for Security Architect.'
    )
    expect(screen.getAllByTestId('role-map-row')).toHaveLength(
      rolePathForPersona('architect')!.parts.length
    )
    expect(usePersonaStore.getState().selectedPersona).toBe('executive')
    await user.click(screen.getByRole('button', { name: /Back to my role/ }))
    expect(screen.queryByTestId('role-preview')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('role-map-row')).toHaveLength(
      rolePathForPersona('executive')!.parts.length
    )
  })

  it('accepts a NICE work-role id', () => {
    renderAt(<YourJourneyView />, '/learn?view=journey&role=control-assessor')
    expect(screen.getByTestId('role-preview')).toHaveTextContent('Viewing the path for ')
    expect(screen.getAllByTestId('role-map-row')).toHaveLength(
      rolePathForWorkRole('control-assessor').parts.length
    )
    expect(usePersonaStore.getState().selectedPersona).toBe('architect')
  })

  it('ignores an unknown id: plain Your journey', () => {
    renderAt(<YourJourneyView />, '/learn?view=journey&role=not-a-role')
    expect(screen.queryByTestId('role-preview')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Objectives', selected: true })).toBeInTheDocument()
  })

  it('leaves the preview when another view is chosen', async () => {
    const user = userEvent.setup()
    renderAt(<YourJourneyView />, '/learn?view=journey&role=architect')
    await user.click(screen.getByRole('tab', { name: 'Objectives' }))
    expect(screen.getByRole('tab', { name: 'Objectives', selected: true })).toBeInTheDocument()
    expect(screen.queryByTestId('role-preview')).not.toBeInTheDocument()
  })
})

describe('Your journey views', () => {
  it('opens on Objectives and keeps the view in the address', async () => {
    const user = userEvent.setup()
    renderAt(<YourJourneyView />, '/learn?mode=journey')
    expect(screen.getByRole('tab', { name: 'Objectives', selected: true })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Role map' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/learn?mode=journey&jview=role-map')
    expect(screen.getByTestId('role-map')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'My work' }))
    expect(document.querySelector('[data-mount="my-work"]')).not.toBeNull()
    await user.click(screen.getByRole('tab', { name: 'Updates' }))
    expect(document.querySelector('[data-mount="updates"]')).not.toBeNull()
    await user.click(screen.getByRole('tab', { name: 'Objectives' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/learn?mode=journey')
  })

  it('moves between the views with the arrow keys', async () => {
    const user = userEvent.setup()
    renderAt(<YourJourneyView />, '/learn?mode=journey')
    screen.getByRole('tab', { name: 'Objectives' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Role map' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Updates' })).toHaveFocus()
  })

  it('shows an objective in focus with its Now step, optional steps and the work-line mount', () => {
    saveTlsObjective()
    renderAt(<YourJourneyView />)
    expect(screen.getByTestId('objective-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('now-box')).toHaveTextContent(/Now · step 1 of/i)
    expect(document.querySelector('[data-mount="objective-work-line"]')).not.toBeNull()
    expect(screen.getByRole('region', { name: 'Active objectives' })).toBeInTheDocument()
    expect(screen.getByText('Paused (0)')).toBeInTheDocument()
    expect(screen.getByText('Completed (0)')).toBeInTheDocument()
  })

  it('pauses, resumes and reopens from the workspace and cards, and moves focus between objectives (A04)', async () => {
    const user = userEvent.setup()
    const a = saveTlsObjective()
    const b = saveObjective('Secure boot and firmware signing for our devices')
    renderAt(<YourJourneyView />)
    // b was created last, so it is in focus; pausing it moves focus to a
    expect(useJourneyStore.getState().focus.architect).toBe(b)
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(objective(b).state).toBe('paused')
    expect(useJourneyStore.getState().focus.architect).toBe(a)
    expect(screen.getByText('Paused (1)')).toBeInTheDocument()
    // Resume from the paused card puts it back in focus
    const paused = within(screen.getByRole('region', { name: 'Paused objectives' }))
    await user.click(paused.getByRole('button', { name: 'Resume' }))
    expect(objective(b).state).toBe('active')
    expect(useJourneyStore.getState().focus.architect).toBe(b)
    // Focus on the other objective from its card
    const active = within(screen.getByRole('region', { name: 'Active objectives' }))
    await user.click(active.getByRole('button', { name: 'Focus on this' }))
    expect(useJourneyStore.getState().focus.architect).toBe(a)
  })

  it('puts a step off in one objective only, lists it, and brings it back (A03)', async () => {
    const user = userEvent.setup()
    const a = saveTlsObjective()
    const b = saveObjective('Secure boot and firmware signing for our devices')
    renderAt(<YourJourneyView />)
    // b is in focus; its Now step is put off
    await user.click(screen.getByRole('button', { name: 'Put this step off in this objective' }))
    expect(objective(b).steps.some((s) => s.deferred)).toBe(true)
    expect(objective(a).steps.some((s) => s.deferred)).toBe(false)
    const list = screen.getByTestId('deferred-steps')
    expect(list).toHaveTextContent('Other objectives that hold the same module still count it.')
    await user.click(within(list).getByRole('button', { name: 'Bring it back' }))
    expect(objective(b).steps.some((s) => s.deferred)).toBe(false)
    expect(screen.queryByTestId('deferred-steps')).not.toBeInTheDocument()
  })

  it('reopens a completed objective from its card', async () => {
    const user = userEvent.setup()
    const id = saveTlsObjective()
    for (const s of objective(id).steps.filter((x) => x.required && x.kind === 'module')) {
      useJourneyStore.getState().markStepComplete(id, s.id)
    }
    useJourneyStore.getState().completeObjective(id, true)
    renderAt(<YourJourneyView />)
    const done = within(screen.getByRole('region', { name: 'Completed objectives' }))
    await user.click(done.getByRole('button', { name: 'Reopen' }))
    expect(objective(id).state).toBe('active')
  })

  it('opens the new-objective flow from ?new=1 and from the button, and shows the empty state with a role', async () => {
    const user = userEvent.setup()
    renderAt(<YourJourneyView />)
    expect(screen.getByTestId('no-objective')).toHaveTextContent('Security Architect')
    expect(screen.getByRole('link', { name: /^Start here:/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start an objective' }))
    expect(screen.getByTestId('new-objective')).toBeInTheDocument()
  })

  it('opens the form with the text box focused from the address, and the grammar accepts that address', () => {
    expect(validateDeepLink('/learn?mode=journey&new=1')).toBeNull()
    renderAt(<YourJourneyView />, '/learn?mode=journey&new=1')
    expect(screen.getByTestId('new-objective')).toBeInTheDocument()
    expect(screen.getByLabelText('What do you want to be able to do?')).toHaveFocus()
  })

  it('opens the form when the address gains new=1 while the view is open, and Cancel clears it', async () => {
    const user = userEvent.setup()
    renderAt(
      <>
        <YourJourneyView />
        <Link to="/learn?mode=journey&new=1">open form</Link>
      </>
    )
    expect(screen.queryByTestId('new-objective')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'open form' }))
    expect(screen.getByTestId('new-objective')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByTestId('new-objective')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('where')[0]).not.toHaveTextContent('new=1')
  })

  it('shows a step page for a self-assessed step opened from the address', () => {
    const id = saveTlsObjective()
    const last = barSteps(objective(id)).at(-1)!
    renderAt(<YourJourneyView />, `/learn?mode=journey&objective=${id}&step=${last.id}`)
    expect(screen.getByTestId('step-page')).toBeInTheDocument()
    expect(screen.getByText(/This last step is self-assessed/)).toBeInTheDocument()
    expect(document.querySelector('[data-mount="step-notes"]')).not.toBeNull()
  })

  it('renders the Where helper (guards the test harness)', () => {
    renderAt(<Where />)
    expect(screen.getAllByTestId('where').length).toBeGreaterThan(0)
  })
})
