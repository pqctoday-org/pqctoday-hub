// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { broadMatch, makeRow } from '@/test/fixtures/assistantAnswers'
import type { RenderableAnswer } from './answerRules'
import { homeLessonRow } from './homeLesson'
import { HomeLessonLink } from './HomeLessonLink'
import { RecordViewer } from './RecordViewer'
import { ResourceStepper } from './ResourceStepper'
import { buildResourceTabs, START_NAV } from './resourceTabs'

const home = { tag: 'LM-005', title: 'Standards Bodies', link: '/learn/standards-bodies' }

describe('the home lesson of a row', () => {
  it('is a row that opens the lesson the way a Learn row does', () => {
    expect(homeLessonRow({ homeLesson: home })).toMatchObject({
      tag: 'LM-005',
      title: 'Standards Bodies',
      kind: 'Module',
      action: 'Go to module',
      link: '/learn/standards-bodies',
      goLink: '/go/LM-005',
      group: 'Learn',
    })
  })
  it('is none for a row without one, or from an answer saved before the field existed', () => {
    expect(homeLessonRow({ homeLesson: null })).toBeNull()
    expect(homeLessonRow({})).toBeNull()
  })
})

describe('the "Lesson: <title>" link', () => {
  it('reads "Lesson: <title>" and opens the lesson', async () => {
    const onOpen = vi.fn()
    render(<HomeLessonLink row={{ homeLesson: home }} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Lesson: Standards Bodies' }))
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'LM-005', action: 'Go to module' })
    )
  })
  it('shows nothing for a record with no home lesson', () => {
    const { container } = render(<HomeLessonLink row={{}} onOpen={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('is left out when that lesson is already offered on the card', () => {
    const { container } = render(
      <HomeLessonLink row={{ homeLesson: home }} onOpen={() => {}} hideLesson="LM-005" />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

const leader = makeRow({
  kind: 'Leader',
  tag: 'LDR:jane',
  title: 'Jane Leader',
  link: '/leaders?leader=jane',
  action: 'Go to page',
  group: 'Data pages',
  homeLesson: home,
})

describe('in the record viewer', () => {
  it('shows the lesson link under the record, on the desktop and the pinned phone card', async () => {
    for (const variant of ['drawer', 'pinned'] as const) {
      const onOpenPage = vi.fn()
      const { unmount } = render(
        <RecordViewer
          row={leader}
          mode="record"
          variant={variant}
          onClose={() => {}}
          onOpenPage={onOpenPage}
        />
      )
      await userEvent.click(screen.getByRole('button', { name: 'Lesson: Standards Bodies' }))
      expect(onOpenPage).toHaveBeenCalledWith(expect.objectContaining({ tag: 'LM-005' }))
      unmount()
    }
  })
  it('has none for a record without a home lesson', () => {
    render(
      <RecordViewer
        row={{ ...leader, homeLesson: null }}
        mode="record"
        variant="drawer"
        onClose={() => {}}
        onOpenPage={() => {}}
      />
    )
    expect(screen.queryByRole('button', { name: /^Lesson:/ })).toBeNull()
  })
})

describe('in the stepper', () => {
  const answer = {
    ...(broadMatch as RenderableAnswer),
    groups: [{ name: 'Data pages' as const, rows: [leader], more: [] }],
  } as RenderableAnswer
  const built = buildResourceTabs(answer)
  const show = (onAction = vi.fn()) => {
    render(
      <ResourceStepper
        tabs={built.tabs}
        rankOf={built.rankOf}
        nav={START_NAV}
        onNav={() => {}}
        panelId="p"
        tabId={(k) => `t-${k}`}
        question="Q"
        onAction={onAction}
      />
    )
    return onAction
  }
  it('shows the lesson link under the resource and opens it with the card action', async () => {
    const onAction = show()
    await userEvent.click(screen.getByRole('button', { name: 'Lesson: Standards Bodies' }))
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'LM-005', action: 'Go to module' })
    )
  })
})
