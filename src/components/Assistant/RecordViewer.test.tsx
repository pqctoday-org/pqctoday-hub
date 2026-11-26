// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { RecordViewer } from './RecordViewer'
import { glossaryMlKem, fips203Row } from '@/test/fixtures/assistantAnswers'

const lesson = {
  lessonTitle: 'Post-Quantum Algorithms',
  link: '/learn/pqc-algorithms?section=ml-kem-fips-203',
  tag: 'LM-088/s:ml-kem-fips-203',
}

const view = (props: Partial<React.ComponentProps<typeof RecordViewer>> & { row: never }) =>
  render(
    <RecordViewer
      mode="record"
      variant="drawer"
      onClose={() => {}}
      onOpenPage={() => {}}
      {...props}
    />
  )

describe('RecordViewer: a glossary term', () => {
  it('with a lesson link, the main action opens the lesson and the quiet one opens the glossary', async () => {
    const onOpenLesson = vi.fn()
    const onOpenPage = vi.fn()
    view({ row: glossaryMlKem as never, lessons: [lesson], onOpenLesson, onOpenPage })
    expect(screen.queryByRole('button', { name: 'Open full page' })).toBeNull()
    await userEvent.click(
      screen.getByRole('button', { name: 'Open the lesson: Post-Quantum Algorithms' })
    )
    expect(onOpenLesson).toHaveBeenCalledWith(lesson)
    await userEvent.click(screen.getByRole('button', { name: 'Open in the glossary' }))
    expect(onOpenPage).toHaveBeenCalledWith(glossaryMlKem)
  })

  it('takes the first of several lessons, in the order given', () => {
    view({
      row: glossaryMlKem as never,
      lessons: [lesson, { ...lesson, lessonTitle: 'Other lesson', tag: 'LM-1' }],
      onOpenLesson: () => {},
    })
    expect(screen.getAllByRole('button', { name: /^Open the lesson:/ })).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Open the lesson: Post-Quantum Algorithms' })
    ).toBeInTheDocument()
  })

  it('with no lesson link shows only Open in the glossary', () => {
    view({ row: glossaryMlKem as never, lessons: [], onOpenLesson: () => {} })
    expect(screen.queryByRole('button', { name: /^Open the lesson/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Open in the glossary' })).toBeInTheDocument()
  })
})

describe('RecordViewer: any other record', () => {
  it('keeps Open full page', async () => {
    const onOpenPage = vi.fn()
    view({ row: fips203Row as never, onOpenPage })
    await userEvent.click(screen.getByRole('button', { name: 'Open full page' }))
    expect(onOpenPage).toHaveBeenCalledWith(fips203Row)
    expect(screen.queryByRole('button', { name: 'Open in the glossary' })).toBeNull()
  })
})
