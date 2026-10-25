// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every table in the Common Criteria lesson must read on a phone, including the worked-example tables
 * of "PQC under EUCC today (ACM v2)": below 640 px each row is a stacked block with its column
 * headings as labels, from 640 px up it is a table, and nothing keeps a fixed minimum width. jsdom
 * does not apply Tailwind, so these assertions pin the markup and classes that produce that layout.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import {
  CcContinuity,
  CcEalDecoding,
  CcLifecycle,
  CcModel,
  CcRegionalReference,
  CcRegionalSchemes,
  EidasChain,
  EuccPqcToday,
  EuccScheme,
  NiapPqcRoute,
  PpEn4192215,
  PpSecurityIc,
} from './CcEuSections'

const renderSection = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

const WORKED_EXAMPLE_TABLES: [string, string[]][] = [
  [
    'Dependencies of the three iterations after errata version 1.2, and how the example meets them',
    ['Iteration', 'Dependencies after errata v1.2', 'How the example meets them'],
  ],
  [
    'The three attack-potential tables: the CEM example table and the two EUCC domain documents',
    ['Where', 'Document and version', 'Top row, as the table words it', 'Origin'],
  ],
]

describe('Common Criteria lesson tables on a phone', () => {
  it.each([
    ['CcModel', <CcModel key="1" />],
    ['CcEalDecoding', <CcEalDecoding key="2" />],
    ['CcLifecycle', <CcLifecycle key="3" />],
    ['CcContinuity', <CcContinuity key="4" />],
    ['EuccScheme', <EuccScheme key="5" />],
    ['EidasChain', <EidasChain key="6" />],
    ['PpEn4192215', <PpEn4192215 key="7" />],
    ['PpSecurityIc', <PpSecurityIc key="8" />],
    ['EuccPqcToday', <EuccPqcToday key="9" />],
    ['CcRegionalSchemes', <CcRegionalSchemes key="10" />],
    ['CcRegionalReference', <CcRegionalReference key="11" />],
    ['NiapPqcRoute', <NiapPqcRoute key="12" />],
  ])(
    '%s: every table is displayed only from 640 px up and none has a fixed minimum width',
    (_n, ui) => {
      renderSection(ui)
      expect(document.body.innerHTML).not.toMatch(/min-w-\[/)
      const tables = screen.queryAllByRole('table')
      tables.forEach((table) => {
        // eslint-disable-next-line testing-library/no-node-access -- the wrapper's classes are what hides the table on a phone
        expect(table.parentElement).toHaveClass('hidden', 'sm:block')
      })
      // Each table has a stacked twin with one block per row.
      expect(screen.queryAllByRole('list', { name: /./ }).length).toBeGreaterThanOrEqual(
        tables.length
      )
    }
  )

  it.each(WORKED_EXAMPLE_TABLES)(
    'worked example: "%s" stacks one block per row',
    (caption, head) => {
      renderSection(<EuccPqcToday />)
      const table = screen.getByRole('table', { name: caption })
      const bodyRows = within(table).getAllByRole('row').length - 1
      expect(bodyRows).toBeGreaterThanOrEqual(3)
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((h) => h.textContent)
      ).toEqual(head)
      const stacked = within(screen.getByRole('list', { name: caption }))
      expect(stacked.getAllByRole('listitem')).toHaveLength(bodyRows)
      // Every value but the first is labelled with its column heading, in order.
      const labels = stacked.getAllByRole('term').map((t) => t.textContent)
      expect(labels).toEqual(Array.from({ length: bodyRows }, () => head.slice(1)).flat())
    }
  )

  it('the stacked block of the third column keeps the whole cell text', () => {
    renderSection(<EuccPqcToday />)
    const caption =
      'Dependencies of the three iterations after errata version 1.2, and how the example meets them'
    const lastCells = within(screen.getByRole('table', { name: caption }))
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell').at(-1)?.textContent)
    const stackedValues = within(screen.getByRole('list', { name: caption }))
      .getAllByRole('definition')
      .filter((_d, i) => i % 2 === 1)
      .map((d) => d.textContent)
    expect(stackedValues).toEqual(lastCells)
  })
})
