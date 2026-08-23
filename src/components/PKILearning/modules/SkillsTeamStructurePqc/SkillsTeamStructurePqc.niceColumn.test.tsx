// SPDX-License-Identifier: GPL-3.0-only
/**
 * The role table must show the official NICE v2.2.0 work role for every core role.
 *
 * ADDED 2026-08-22. `roleCrosswalk.ts` has carried `niceRoles` per framework role and
 * `ROLE_SOURCES` has named NICE Components v2.2.0 since 2026-08-09, but the table
 * rendered neither — the anchoring existed in data and in a footnote, and the reader
 * was asked to take it on trust. A type-check cannot tell you a column reached the
 * screen, so this renders it and reads the codes back out of the DOM.
 *
 * Derived from the data, never hardcoded: the expected codes are looked up through the
 * same crosswalk the component uses, so re-vendoring a NICE components version that
 * renames a role fails here rather than silently drifting.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SkillsTeamStructureModule } from './index'
import { ROLE_CROSSWALK, CORE_ROLE_ORDER } from './data/teamModel'
import { NICE_WORK_ROLES } from '@/data/niceFramework'

describe('role table cites NICE v2.2.0', () => {
  it('renders the official work-role code for every core role', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SkillsTeamStructureModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    const header = screen.getByRole('columnheader', { name: /NICE work role/i })
    const table = header.closest('table')
    expect(table).not.toBeNull()

    const expected = [
      ...new Set(
        CORE_ROLE_ORDER.flatMap((r) => ROLE_CROSSWALK[r].niceRoles).map(
          (nr) => NICE_WORK_ROLES[nr].niceCode
        )
      ),
    ]
    // Guard the guard: an empty expectation would make the loop below vacuous.
    expect(expected.length).toBeGreaterThan(0)
    for (const code of expected) {
      expect(within(table!).getAllByText(code).length).toBeGreaterThan(0)
    }
    // Every code rendered must be a real v2.2.0 identifier, not a 2017-era one.
    const official = new Set(Object.values(NICE_WORK_ROLES).map((r) => r.niceCode))
    for (const code of expected) expect(official).toContain(code)
  })
})
