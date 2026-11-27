// SPDX-License-Identifier: AGPL-3.0-only
import { GraduationCap } from 'lucide-react'
import { StoryButton } from '@/components/storybook'
import type { AssistantRow } from '@/services/assistant/contract'
import { COPY } from './copy'
import { homeLessonRow } from './homeLesson'

/**
 * "Lesson: <title>" under a record that has a home lesson: a link to that lesson, opened the way a Learn row opens (the page, with the
 * way back to the answer). Nothing is shown for a record with no home lesson, or that is a lesson.
 */
export function HomeLessonLink({
  row,
  onOpen,
  hideLesson,
  oneLine,
  className,
}: {
  row: Pick<AssistantRow, 'homeLesson'>
  onOpen: (lesson: AssistantRow) => void
  /** A lesson tag that is already offered elsewhere on the card: not shown a second time. */
  hideLesson?: string
  /** One short line, cut with an ellipsis, for the card whose height is fixed. The full title is its tooltip and its name. */
  oneLine?: boolean
  className?: string
}) {
  const lesson = homeLessonRow(row)
  if (!lesson || lesson.tag === hideLesson) return null
  return (
    <StoryButton
      variant="quiet"
      onClick={() => onOpen(lesson)}
      data-home-lesson={lesson.tag}
      title={oneLine ? `${COPY.homeLesson}: ${lesson.title}` : undefined}
      className={
        className ??
        (oneLine
          ? 'h-auto min-h-[28px] max-w-full justify-start gap-1 whitespace-nowrap px-1 py-0.5 text-left text-xs'
          : 'h-auto min-h-[36px] max-w-full justify-start gap-1 whitespace-normal px-1 py-1 text-left text-xs')
      }
    >
      <GraduationCap size={14} aria-hidden="true" className="shrink-0" />
      <span className={oneLine ? 'min-w-0 truncate' : undefined}>
        {COPY.homeLesson}: {lesson.title}
      </span>
    </StoryButton>
  )
}
