// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObjectiveChanges, ObjectiveChangesList } from './ObjectiveChanges'
import { UpdatesMount, useUpdatesCount, MyWorkMount } from './mountPoints'
import { renderAt, resetJourneyWorld } from './journeyTestUtils'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { usePanelObjectives, useRoleObjectives } from '@/hooks/useJourney'
import { buildBuiltOn, sectionsOfLesson, takeFirstTags } from '@/services/journey/curriculum'
import { lessonByTag } from '@/services/journey/lessons'
import { barSteps } from '@/services/journey/stepRules'
import type { Objective, Step } from '@/services/journey/types'

const TLS = 'LM-008'
const tls = lessonByTag(TLS)!
const sections = sectionsOfLesson(tls.id)
const prereqs = takeFirstTags(TLS)

const step = (tag: string, n: number, extra: Partial<Step> = {}): Step => ({
  id: `o-s${n}`,
  position: n,
  kind: 'module',
  resourceTag: tag,
  required: true,
  origin: { type: 'match' },
  ...extra,
})

function seed(
  tags: string[],
  tweak: (o: Objective) => void = () => {},
  state: Objective['state'] = 'active'
) {
  const steps = tags.map((t, i) => step(t, i + 1))
  steps.push({ ...step(`o/outcome`, tags.length + 1), kind: 'self-assessed' })
  const o: Objective = {
    id: 'o',
    role: 'architect',
    goal: 'Review TLS',
    state,
    steps,
    checkpoint: { path: [], stepId: null },
    createdAt: 1,
    updatedAt: 1,
    builtOn: buildBuiltOn(steps, 'created', 1),
    ...(state === 'completed' ? { completedAt: new Date(2026, 9, 2, 12).getTime() } : {}),
  }
  o.builtOn!.prerequisites[TLS] = prereqs
  tweak(o)
  useJourneyStore.setState({ objectives: { o }, order: ['o'], focus: { architect: 'o' } })
}
const current = () => useJourneyStore.getState().objectives.o

beforeEach(() => {
  resetJourneyWorld()
  useMyWorkStore.setState({ comments: [], outputs: [], answers: [], references: [] })
  usePersonaStore.setState({ selectedPersona: 'architect', experienceLevel: 'basics' })
})

function Live({ stepId }: { stepId?: string }) {
  const objective = useJourneyStore((s) => s.objectives.o)
  return <ObjectiveChanges objective={objective} stepId={stepId} />
}
const show = (stepId?: string) => renderAt(<Live stepId={stepId} />)

describe('the four kinds of change to a lesson, in words', () => {
  it('names "New section" and "New tool", links to them and can be marked seen', async () => {
    const user = userEvent.setup()
    seed([...prereqs, TLS], (o) => {
      o.builtOn!.lessons[TLS].sections = o.builtOn!.lessons[TLS].sections.slice(1)
      delete o.builtOn!.lessons[TLS].tools['tls-simulator']
    })
    show()
    const cards = screen.getAllByTestId('objective-change')
    expect(cards.map((c) => c.getAttribute('data-kind')).sort()).toEqual([
      'new-section',
      'new-tool',
    ])
    const section = cards.find((c) => c.dataset.kind === 'new-section')!
    expect(within(section).getByText('New section')).toBeInTheDocument()
    expect(
      within(section).getByRole('link', { name: `Open ${sections[0].label}` })
    ).toHaveAttribute('href', `/learn/${tls.id}?section=${sections[0].id}`)
    const tool = cards.find((c) => c.dataset.kind === 'new-tool')!
    expect(within(tool).getByText('New tool')).toBeInTheDocument()
    expect(within(tool).getByRole('link', { name: /^Open KMIP|^Open TLS/ })).toHaveAttribute(
      'href',
      '/playground/tls-simulator'
    )
    // Nothing changed in the path.
    expect(barSteps(current()).map((s) => s.resourceTag)).toEqual([...prereqs, TLS, 'o/outcome'])

    await user.click(within(section).getByRole('button', { name: 'Mark seen' }))
    expect(screen.getAllByTestId('objective-change')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('is marked seen')
  })

  it('names "Tool updated" and "Section updated"', () => {
    seed([...prereqs, TLS], (o) => {
      o.builtOn!.lessons[TLS].tools['tls-simulator'] = '0.9.0'
      o.builtOn!.lessons[TLS].version = 0
    })
    useMyWorkStore.setState({
      comments: [
        {
          id: 'c1',
          tag: `${TLS}/s:${sections[0].id}`,
          body: 'note',
          contentVersion: (tls.contentVersion ?? 1) - 1,
        } as never,
      ],
    })
    show()
    expect(screen.getByText('Tool updated')).toBeInTheDocument()
    expect(screen.getByText('Section updated')).toBeInTheDocument()
    expect(screen.getByText(/was version 0\.9\.0/)).toBeInTheDocument()
  })

  it('shows only the changes about one step when given a step', () => {
    seed([...prereqs, TLS], (o) => {
      o.builtOn!.lessons[TLS].sections = o.builtOn!.lessons[TLS].sections.slice(1)
    })
    show(current().steps[0].id)
    expect(screen.queryByTestId('objective-change')).toBeNull()
  })
})

describe('"Curriculum changed": a lesson now lists a lesson to take first', () => {
  it('tells what changed, changes nothing, and Keep my path leaves the objective as it is', async () => {
    const user = userEvent.setup()
    const [needed, ...rest] = prereqs
    seed([...rest, TLS], (o) => {
      o.builtOn!.prerequisites[TLS] = rest
    })
    show()
    const card = screen.getByTestId('objective-change')
    expect(within(card).getByText('Curriculum changed')).toBeInTheDocument()
    expect(within(card).getByText(/now lists .* to take first/)).toBeInTheDocument()
    expect(within(card).getByText(/Nothing has changed in your objective/)).toBeInTheDocument()
    expect(current().steps.some((s) => s.resourceTag === needed)).toBe(false)

    await user.click(within(card).getByRole('button', { name: 'Keep my path' }))
    expect(current().steps.some((s) => s.resourceTag === needed)).toBe(false)
    expect(screen.queryByTestId('objective-change')).toBeNull()
  })

  it('"Add it to my objective" adds the step before the one that needs it, by the learner’s action only', async () => {
    const user = userEvent.setup()
    const [needed, ...rest] = prereqs
    seed([...rest, TLS], (o) => {
      o.builtOn!.prerequisites[TLS] = rest
    })
    show()
    await user.click(screen.getByRole('button', { name: 'Add it to my objective' }))
    const order = barSteps(current()).map((s) => s.resourceTag)
    expect(order.indexOf(needed)).toBe(order.indexOf(TLS) - 1)
  })

  it('on a completed objective shows the completion date and reopens only on the explicit button', async () => {
    const user = userEvent.setup()
    const [needed, ...rest] = prereqs
    seed(
      [...rest, TLS],
      (o) => {
        o.builtOn!.prerequisites[TLS] = rest
      },
      'completed'
    )
    show()
    expect(screen.getByText(/You completed this objective on 2 October 2026/)).toBeInTheDocument()
    expect(current().state).toBe('completed')
    await user.click(screen.getByRole('button', { name: 'Add it and reopen the objective' }))
    expect(current().state).toBe('active')
    expect(current().steps.some((s) => s.resourceTag === needed)).toBe(true)
  })
})

describe('a retired step', () => {
  const seedRetired = (state: Objective['state'] = 'active') =>
    seed([prereqs[0], 'LM-032'], () => {}, state)

  it('names the former step, the reason and the date, and offers the replacement', () => {
    seedRetired()
    show(current().steps[1].id)
    const card = screen.getByTestId('objective-change')
    expect(within(card).getByText('Retired step')).toBeInTheDocument()
    expect(
      within(card).getByText(/IoT & OT Security was retired on 1 October 2026/)
    ).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: /^Swap in / })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Put this step off' })).toBeInTheDocument()
  })

  it('swaps only on the learner’s press, keeping work filed under the objective', async () => {
    const user = userEvent.setup()
    seedRetired()
    useMyWorkStore.setState({
      comments: [{ id: 'c', tag: 'LM-032', body: 'my note', contentVersion: 1 } as never],
    })
    renderAt(
      <>
        <Live />
        <MyWorkMount />
      </>
    )
    expect(current().steps[1].resourceTag).toBe('LM-032')
    await user.click(screen.getByRole('button', { name: /^Swap in / }))
    expect(current().steps[1].resourceTag).toBe('LM-074')
    expect(current().steps[1].formerTags).toEqual(['LM-032'])
    expect(await screen.findByText('my note')).toBeInTheDocument()
  })

  it('"Put this step off" is the way to keep the path with no replacement taken', async () => {
    const user = userEvent.setup()
    seedRetired()
    show()
    await user.click(screen.getByRole('button', { name: 'Put this step off' }))
    expect(current().steps[1].deferred).toBe(true)
    expect(current().steps[1].resourceTag).toBe('LM-032')
  })

  it('on a completed objective offers the swap with an explicit reopen, and no silent change', async () => {
    const user = userEvent.setup()
    seedRetired('completed')
    show()
    expect(screen.queryByRole('button', { name: 'Put this step off' })).toBeNull()
    expect(current().state).toBe('completed')
    await user.click(screen.getByRole('button', { name: /^Swap in .* and reopen$/ }))
    expect(current().state).toBe('active')
    expect(current().steps[1].resourceTag).toBe('LM-074')
  })
})

describe('a step whose tag the Hub does not list keeps its wording', () => {
  it('shows no notice', () => {
    seed([prereqs[0], 'LM-999'])
    show()
    expect(screen.queryByTestId('objective-change')).toBeNull()
  })
})

describe('an objective made before the Hub recorded what it was built on', () => {
  it('is recorded as it stands when the Hub first looks at it, with no changes told', () => {
    seed([...prereqs, TLS], (o) => {
      delete o.builtOn
    })
    function Probe() {
      useRoleObjectives()
      return null
    }
    renderAt(<Probe />)
    expect(current().builtOn?.origin).toBe('first-seen')
    expect(current().steps.map((s) => s.resourceTag)).toEqual([...prereqs, TLS, 'o/outcome'])
    show()
    expect(screen.queryByTestId('objective-change')).toBeNull()
  })
})

describe('in Updates', () => {
  it('lists the same cards across objectives and counts them on the tab', () => {
    seed([...prereqs, TLS], (o) => {
      o.builtOn!.lessons[TLS].sections = o.builtOn!.lessons[TLS].sections.slice(1)
    })
    function Count() {
      return <p data-testid="count">{useUpdatesCount()}</p>
    }
    renderAt(
      <>
        <Count />
        <UpdatesMount />
      </>
    )
    const list = screen.getByTestId('objective-changes-list')
    expect(within(list).getByText('New section')).toBeInTheDocument()
    expect(within(list).getByText(/\(1 new\)/)).toBeInTheDocument()
    expect(Number(screen.getByTestId('count').textContent)).toBeGreaterThanOrEqual(1)
  })

  it('shows nothing when there is nothing to tell', () => {
    seed([...prereqs, TLS])
    renderAt(<ObjectiveChangesList />)
    expect(screen.queryByTestId('objective-changes-list')).toBeNull()
  })
})

describe('work filed under a swapped step', () => {
  it('the panels read the former tag as part of the step', () => {
    seed([prereqs[0], 'LM-074'], (o) => {
      o.steps[1].formerTags = ['LM-032']
    })
    function Probe() {
      return (
        <p data-testid="tags">
          {usePanelObjectives()
            .work[0].steps.map((s) => s.tag)
            .join(',')}
        </p>
      )
    }
    renderAt(<Probe />)
    const tags = screen.getByTestId('tags').textContent
    expect(tags).toContain('LM-032')
    expect(tags).toContain('LM-074')
  })
})
