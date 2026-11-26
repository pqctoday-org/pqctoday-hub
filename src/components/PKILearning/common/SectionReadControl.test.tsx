// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The tick at the end of each required lesson section: it is the manual way to record a section as
 * read now that the progress box is gone. Ticking every required section completes the lesson, and
 * a journey step that holds that lesson then reads as done.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { LearnStepper, type LearnStep } from '../LearnStepper'
import { LEARN_SECTIONS } from '../moduleData'
import { requiredLearnSectionIdsFor } from '../manifest/learnPathScope'
import { useModuleStore } from '@/store/useModuleStore'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useIsDone } from '@/hooks/useJourney'
import { lessonByTag } from '@/services/journey/lessons'
import { barSteps } from '@/services/journey/stepRules'
import { resetJourneyWorld, saveTlsObjective } from '@/components/Journey/journeyTestUtils'

function IsDone({ tag }: { tag: string }) {
  const isDone = useIsDone()
  return <p data-testid="done">{isDone(tag) ? 'done' : 'not done'}</p>
}

const renderLesson = (moduleId: string, extra?: React.ReactNode) => {
  const steps: LearnStep[] = LEARN_SECTIONS[moduleId].map((s) => ({
    id: s.id,
    label: s.label,
    content: <p>{`body of ${s.id}`}</p>,
  }))
  return render(
    <MemoryRouter initialEntries={[`/learn/${moduleId}`]}>
      <LearnStepper steps={steps} />
      {extra}
    </MemoryRouter>
  )
}

describe('SectionReadControl', () => {
  beforeEach(() => {
    resetJourneyWorld()
    useModuleStore.getState().resetProgress()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('is one named checkbox per required section, and it shows the ticked state', async () => {
    const user = userEvent.setup()
    const id = 'pqc-business-case'
    renderLesson(id)
    const required = requiredLearnSectionIdsFor(id, undefined)
    const boxes = screen.getAllByRole('checkbox', { name: /^Mark section as read/ })
    expect(boxes).toHaveLength(required.length)
    expect(boxes[0]).not.toBeChecked()
    await user.click(boxes[0])
    expect(boxes[0]).toBeChecked()
    expect(useModuleStore.getState().modules[id]?.learnSectionChecks?.[required[0]]).toBe(true)
    await user.click(boxes[0])
    expect(boxes[0]).not.toBeChecked()
  })

  it('works from the keyboard', async () => {
    const user = userEvent.setup()
    renderLesson('pqc-business-case')
    const box = screen.getAllByRole('checkbox', { name: /^Mark section as read/ })[0]
    box.focus()
    await user.keyboard(' ')
    expect(box).toBeChecked()
  })

  it('ticking every required section completes the lesson and the journey step reads as done', async () => {
    const user = userEvent.setup()
    const objectiveId = saveTlsObjective()
    const lessonStep = barSteps(useJourneyStore.getState().objectives[objectiveId]).find(
      (s) => s.kind === 'module'
    )!
    const lesson = lessonByTag(lessonStep.resourceTag)!
    renderLesson(lesson.id, <IsDone tag={lessonStep.resourceTag} />)
    expect(screen.getByTestId('done')).toHaveTextContent('not done')

    const boxes = screen.getAllByRole('checkbox', { name: /^Mark section as read/ })
    expect(boxes.length).toBe(requiredLearnSectionIdsFor(lesson.id, undefined).length)
    for (const box of boxes) await user.click(box)

    expect(useModuleStore.getState().modules[lesson.id]?.status).toBe('completed')
    expect(screen.getByTestId('done')).toHaveTextContent('done')
    expect(screen.getByTestId('done')).not.toHaveTextContent('not done')
    // The lesson's own end-of-page state says so too.
    expect(screen.getByText('Reading Complete!')).toBeInTheDocument()
  })
})
