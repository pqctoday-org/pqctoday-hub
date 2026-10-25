// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ACVP lesson's tables must read on a phone: below 640 px each row is a stacked block with its
 * column headings as labels (so the last column is never cut off), from 640 px up it is a table, and
 * nothing keeps a fixed minimum width. jsdom does not apply Tailwind, so these assertions pin the
 * markup and classes that produce that layout, not the pixels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EVIDENCE_CLASS_IDS } from '@/data/validation/evidenceClasses'
import { AcvpLabIntroduction } from './AcvpLabIntroduction'

const renderLesson = () =>
  render(
    <MemoryRouter>
      <AcvpLabIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )

const TABLES: [string, string[]][] = [
  [
    'Algorithm validation compared with module validation',
    ['Question', 'Algorithm validation (CAVP)', 'Module validation (CMVP)'],
  ],
  [
    'ACVP test types by algorithm',
    ['Algorithm / mode', 'Test type', 'What the implementation must do'],
  ],
  [
    'Where randomness enters each PQC algorithm',
    ['Operation', 'Randomness', 'Consequence for testing'],
  ],
  [
    'How each ACVP test group reaches the HSM: standard PKCS#11, or an optional test input outside it',
    ['ACVP test group', 'Interface path', 'Hub disposition'],
  ],
  [
    'The eight evidence classes and their permitted claims',
    ['Evidence class', 'Meaning', 'Permitted claim'],
  ],
  ['Active validation cases by evidence class', ['Evidence class', 'Active cases']],
]

describe('ACVP lesson tables on a phone', () => {
  it('has no fixed minimum width and no sideways-scrolling box in the lesson', () => {
    renderLesson()
    expect(document.body.innerHTML).not.toMatch(/min-w-\[/)
    screen.getAllByRole('table').forEach((table) => {
      // eslint-disable-next-line testing-library/no-node-access -- the wrapper's classes are what hides the table on a phone
      expect(table.parentElement).toHaveClass('hidden', 'sm:block')
    })
  })

  it.each(TABLES)(
    '"%s" has a table from 640 px up and a stacked twin below it',
    (caption, head) => {
      renderLesson()
      const table = screen.getByRole('table', { name: caption })
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((h) => h.textContent)
      ).toEqual(head)
      const bodyRows = within(table).getAllByRole('row').length - 1
      expect(bodyRows).toBeGreaterThanOrEqual(3)
      const list = screen.getByRole('list', { name: caption })
      expect(list).toHaveClass('sm:hidden')
      const stacked = within(list)
      expect(stacked.getAllByRole('listitem')).toHaveLength(bodyRows)
      // The last column is reachable: every row carries its value under the last column heading.
      const last = head[head.length - 1]
      expect(stacked.getAllByRole('term').filter((t) => t.textContent === last)).toHaveLength(
        bodyRows
      )
    }
  )

  it('shows the Hub disposition of every test group in the stacked rows, text intact', () => {
    renderLesson()
    const caption =
      'How each ACVP test group reaches the HSM: standard PKCS#11, or an optional test input outside it'
    const tableRows = within(screen.getByRole('table', { name: caption }))
      .getAllByRole('row')
      .slice(1)
    const lastCells = tableRows.map((r) => within(r).getAllByRole('cell').at(-1)?.textContent)
    const dispositions = within(screen.getByRole('list', { name: caption }))
      .getAllByRole('definition')
      .filter((_d, i) => i % 2 === 1)
      .map((d) => d.textContent)
    expect(dispositions).toEqual(lastCells)
    expect(dispositions.some((d) => d?.startsWith('Executed'))).toBe(true)
  })

  it('lists every evidence class in the stacked rows', () => {
    renderLesson()
    const list = within(
      screen.getByRole('list', { name: 'The eight evidence classes and their permitted claims' })
    )
    expect(list.getAllByRole('listitem')).toHaveLength(EVIDENCE_CLASS_IDS.length)
    EVIDENCE_CLASS_IDS.forEach((id) => expect(list.getByText(id)).toBeInTheDocument())
  })
})
