// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceFramework } from '@/data/complianceData'
import type { BindingStatus } from './bindingSplit'

/**
 * Non-binding statuses whose fixed date is a publication or adoption date. A draft or an
 * official_target date is a target or a planned date, so it keeps its deadline label.
 */
const PUBLICATION_DATE_STATUSES: ReadonlySet<string> = new Set(['recommendation', 'informational'])

/**
 * How a framework's date reads to a reader.
 *
 * - `deadline`: a date the data marks as a deadline (`deadline_kind` fixed or phased).
 * - `published`: a publication or adoption date on non-binding guidance (`binding_status`
 *   recommendation or informational). Nothing is due on it, so it
 *   reads "Published <year>", not as a deadline (owner decision D7).
 * - `none`: no date the data marks as a deadline (ongoing, none or unknown kinds). The
 *   verbatim text is not shown as a deadline either.
 */
export type FrameworkDateLine =
  | { kind: 'deadline'; text: string }
  | { kind: 'published'; text: string }
  | { kind: 'none'; text: '' }

type DateFields = Pick<ComplianceFramework, 'deadline' | 'deadlineKind' | 'deadlineStart'> & {
  bindingStatus?: BindingStatus
}

export function frameworkDateLine(fw: DateFields): FrameworkDateLine {
  if (
    fw.deadlineKind === 'fixed' &&
    fw.deadlineStart !== undefined &&
    PUBLICATION_DATE_STATUSES.has(fw.bindingStatus ?? '')
  ) {
    return { kind: 'published', text: `Published ${fw.deadlineStart}` }
  }
  if (fw.deadlineKind === 'fixed' || fw.deadlineKind === 'phased') {
    return { kind: 'deadline', text: fw.deadline }
  }
  return { kind: 'none', text: '' }
}
