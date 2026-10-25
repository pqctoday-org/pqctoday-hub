// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* eslint-disable security/detect-object-injection -- indices into the caller's own head and row arrays, and the typed size union */

export interface ResponsiveTableProps {
  /** Names the table for assistive technology (a screen-reader-only caption, and the list's label). */
  caption: string
  /** One heading per column. Each is the column heading in the table and the label of its value in a stacked row. */
  head: ReactNode[]
  /** One array of cells per row, in the same order as `head`. */
  rows: ReactNode[][]
  /** Text size of the table and of the stacked rows. Defaults to `xs`. */
  size?: 'xs' | 'sm'
  /** Table only: set the first column in the foreground colour and a medium weight. */
  strongFirstColumn?: boolean
  /** Table only: centre every column after the first. */
  centerValues?: boolean
  /** Extra classes for both layouts' outer element, e.g. a text colour. */
  className?: string
  /** Prefix of the test ids `<testId>-stacked` and `<testId>-table`. Defaults to `responsive-table`. */
  testId?: string
}

const SIZE = { xs: 'text-xs', sm: 'text-sm' } as const

/**
 * A data table that stays readable on a phone. From 640 px up it is a real table. Below 640 px every
 * row becomes a stacked block instead: the first cell as its heading, then each other cell under its
 * column heading, so no column is cut off and nothing scrolls sideways inside the page.
 *
 * Only one of the two layouts is displayed at a time (`sm:hidden` / `hidden sm:block`), so assistive
 * technology never reads the rows twice. The cells are rendered in both, so pass cell content that is
 * safe to render twice (text and links, not controls that hold state). Same approach as the PCI
 * scheme-clocks stack in PciSections.tsx, which keeps its own copy because it shows no column labels.
 */
export function ResponsiveTable({
  caption,
  head,
  rows,
  size = 'xs',
  strongFirstColumn = false,
  centerValues = false,
  className,
  testId = 'responsive-table',
}: ResponsiveTableProps) {
  const last = head.length - 1
  return (
    <>
      <ul
        aria-label={caption}
        className={cn('space-y-3 sm:hidden', SIZE[size], className)}
        data-testid={`${testId}-stacked`}
      >
        {rows.map((row, i) => (
          <li key={i} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
            <div className="font-bold text-foreground">{row[0]}</div>
            <dl className="mt-1.5 space-y-1.5">
              {row.slice(1).map((cell, j) => (
                <div key={j}>
                  <dt className="text-[11px] font-semibold text-muted-foreground">{head[j + 1]}</dt>
                  <dd>{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div
        className={cn('hidden overflow-x-auto sm:block', className)}
        data-testid={`${testId}-table`}
      >
        <table className={cn('w-full border-collapse text-left', SIZE[size])}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {head.map((h, j) => (
                <th
                  key={j}
                  scope="col"
                  className={cn(
                    'py-2 font-semibold',
                    j === last ? '' : 'pr-3',
                    centerValues && j > 0 && 'px-3 text-center'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 align-top last:border-b-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      'py-2',
                      j === last ? '' : 'pr-3',
                      j === 0 && strongFirstColumn && 'font-medium text-foreground',
                      centerValues && j > 0 && 'px-3 text-center'
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
