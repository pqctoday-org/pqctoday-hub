// SPDX-License-Identifier: AGPL-3.0-only
import { assistantGoLink, type AssistantRow } from '@/services/assistant/contract'

/**
 * The lesson a record belongs to in the Learn tree (its home lesson), as a row that opens the lesson the way a Learn row does
 * ("Go to module"). The engine host reads it from the knowledge file and sends it with the row; it is none for a record with no
 * home lesson, a lesson, or a part of its own lesson.
 */
export function homeLessonRow(row: Pick<AssistantRow, 'homeLesson'>): AssistantRow | null {
  const lesson = row.homeLesson
  if (!lesson) return null
  return {
    kind: 'Module',
    tag: lesson.tag,
    title: lesson.title,
    source: null,
    status: null,
    dims: null,
    extract: '',
    paidReferenceOnly: false,
    action: 'Go to module',
    link: lesson.link,
    goLink: assistantGoLink(lesson.tag),
    group: 'Learn',
  }
}
