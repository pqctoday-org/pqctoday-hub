// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NiceCoveragePanel } from './NiceCoveragePanel'
import { LEARN_MODULES, LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import { NICE_STATEMENT_TEXT } from '@/data/generated/niceStatementText.generated'
import { NICE_WORK_ROLES } from '@/data/niceFramework'

const official = new Map<string, string>(
  (
    JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      readFileSync(
        resolve(process.cwd(), 'pqc-references', 'NICE-Framework-Components-v2.2.0.json'),
        'utf-8'
      )
    ) as { elements: { element_identifier: string; text: string }[] }
  ).elements.map((e) => [e.element_identifier, e.text])
)

const MODULE_ID = 'data-asset-sensitivity'
// eslint-disable-next-line security/detect-object-injection
const lesson = LEARN_MODULE_BY_ID[MODULE_ID]

describe('NiceCoveragePanel', () => {
  it('is closed by default, with the counts and at most three roles on one line', () => {
    render(<NiceCoveragePanel moduleId={MODULE_ID} />)
    const toggle = screen.getByRole('button', { name: /NICE skills/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveTextContent(
      `teaches ${lesson.niceStatementsTaught.length} · practise ${lesson.niceStatementsPractised.length}`
    )
    const roles = lesson.niceWorkRoles.map((id) => NICE_WORK_ROLES[id].title)
    for (const title of roles.slice(0, 3)) expect(toggle).toHaveTextContent(title)
    if (roles.length > 3) {
      expect(toggle).toHaveTextContent(`+${roles.length - 3}`)
      expect(toggle).not.toHaveTextContent(roles[3])
    }
    expect(screen.queryByText('Teaches')).not.toBeInTheDocument()
  })

  it('opens into the Teaches and Practise lists, with the official wording and the areas', async () => {
    const user = userEvent.setup()
    render(<NiceCoveragePanel moduleId={MODULE_ID} />)
    const toggle = screen.getByRole('button', { name: /NICE skills/ })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('heading', { name: 'Teaches' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Practise (in the Workshop)' })).toBeInTheDocument()
    const [teaches, practise] = screen.getAllByRole('list')
    expect(within(teaches).getAllByRole('listitem')).toHaveLength(
      lesson.niceStatementsTaught.length
    )
    expect(within(practise).getAllByRole('listitem')).toHaveLength(
      lesson.niceStatementsPractised.length
    )
    const first = lesson.niceStatementsTaught[0]
    expect(await within(teaches).findByText(official.get(first) as string)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Competency areas' })).toBeInTheDocument()
    await user.click(toggle)
    expect(screen.queryByText('Teaches')).not.toBeInTheDocument()
  })

  it('does not show the statements a lesson only mentions', async () => {
    const user = userEvent.setup()
    render(<NiceCoveragePanel moduleId={MODULE_ID} />)
    await user.click(screen.getByRole('button', { name: /NICE skills/ }))
    await screen.findByText(official.get(lesson.niceStatementsTaught[0]) as string)
    for (const id of lesson.niceStatementsMentioned) {
      expect(screen.queryByText(id)).not.toBeInTheDocument()
    }
  })

  it('renders nothing for a lesson not read against NICE, or an unknown one', () => {
    const notRead = LEARN_MODULES.find((row) => !row.niceRead)
    expect(notRead).toBeDefined()
    const { container: unread } = render(<NiceCoveragePanel moduleId={notRead!.id} />)
    expect(unread).toBeEmptyDOMElement()
    const { container: unknown } = render(<NiceCoveragePanel moduleId="not-a-learn-module" />)
    expect(unknown).toBeEmptyDOMElement()
  })
})

describe('NICE statement coverage in the lessons data', () => {
  it('every taught or practised id has official wording in the lookup', () => {
    for (const row of LEARN_MODULES) {
      for (const id of [...row.niceStatementsTaught, ...row.niceStatementsPractised]) {
        expect(official.has(id), `${row.id}: ${id} is not in NICE v2.2.0`).toBe(true)
        // eslint-disable-next-line security/detect-object-injection
        expect(NICE_STATEMENT_TEXT[id], `${row.id}: no text for ${id}`).toBe(official.get(id))
      }
    }
  })

  it('every listed id is a real NICE v2.2.0 statement and sits under one heading only', () => {
    for (const row of LEARN_MODULES) {
      const all = [
        ...row.niceStatementsTaught,
        ...row.niceStatementsPractised,
        ...row.niceStatementsMentioned,
      ]
      for (const id of all) expect(official.has(id), `${row.id}: ${id}`).toBe(true)
      expect(new Set(all).size, `${row.id} repeats an id`).toBe(all.length)
    }
  })

  it('a lesson that was not read lists no statements', () => {
    for (const row of LEARN_MODULES.filter((r) => !r.niceRead)) {
      expect(row.niceStatementsTaught).toEqual([])
      expect(row.niceStatementsPractised).toEqual([])
      expect(row.niceStatementsMentioned).toEqual([])
    }
  })

  it('the lookup holds only the statements readers see', () => {
    const shown = new Set(
      LEARN_MODULES.flatMap((r) => [...r.niceStatementsTaught, ...r.niceStatementsPractised])
    )
    expect(new Set(Object.keys(NICE_STATEMENT_TEXT))).toEqual(shown)
  })
})
