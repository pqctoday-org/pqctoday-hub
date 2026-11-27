// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { compareMissingLast, isMissingDataLabel, MISSING_DATA_LABELS } from './missingData'
import { MissingAwareText } from './NeedsDataCue'

describe('missing data in a number field (rule D15)', () => {
  it('keeps the four labels the site shows today', () => {
    expect([...MISSING_DATA_LABELS]).toEqual([
      'Research needed',
      'Not specified by the source',
      'Not measured',
      'Not applicable',
    ])
  })

  it('knows the four labels, and nothing else: a number, a blank and "Not recorded" are not among them', () => {
    for (const label of MISSING_DATA_LABELS) expect(isMissingDataLabel(label)).toBe(true)
    for (const other of ['1,184 B', '', 'Not recorded', 'Level 3', null, undefined]) {
      expect(isMissingDataLabel(other)).toBe(false)
    }
  })

  describe('compareMissingLast', () => {
    const numbers = (values: Array<number | null>, dir: 1 | -1) =>
      [...values].sort((a, b) => compareMissingLast(a, b, dir, (x, y) => x - y))

    it('sorts a missing value after every value, ascending', () => {
      expect(numbers([null, 30, 10, null, 20], 1)).toEqual([10, 20, 30, null, null])
    })

    it('sorts a missing value after every value, descending too, and never as zero', () => {
      expect(numbers([null, 0, 30, 10], -1)).toEqual([30, 10, 0, null])
    })
  })

  describe('the Needs-data cue', () => {
    it.each(MISSING_DATA_LABELS)('follows "%s"', (label) => {
      render(<MissingAwareText text={label} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByTestId('needs-data-cue')).toHaveTextContent('Needs data')
    })

    it('is not shown beside a real value or a plain blank', () => {
      const { rerender } = render(<MissingAwareText text="1,184 B" />)
      expect(screen.queryByTestId('needs-data-cue')).toBeNull()
      rerender(<MissingAwareText text="Not recorded" />)
      expect(screen.queryByTestId('needs-data-cue')).toBeNull()
    })
  })
})
