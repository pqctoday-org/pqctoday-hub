// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactElement } from 'react'
import {
  formatDate,
  formatDateTitle,
  type DateGranularity,
  type DateInput,
  type FormatDateOptions,
} from './date'

interface FormattedDateProps extends FormatDateOptions {
  value: DateInput | null | undefined
  granularity?: DateGranularity
  className?: string
}

/**
 * A date for a reader: "26 Nov 2026", or "3 days ago" with the full date on hover.
 * Renders a `<time>` element carrying the machine-readable date for assistive tools.
 */
export function FormattedDate({
  value,
  granularity = 'day',
  className,
  ...options
}: FormattedDateProps): ReactElement {
  const text = formatDate(value, granularity, options)
  if (value === null || value === undefined) return <span className={className}>{text}</span>
  const d = value instanceof Date ? value : new Date(value)
  const machine = Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  return (
    <time dateTime={machine} title={formatDateTitle(value)} className={className}>
      {text}
    </time>
  )
}
