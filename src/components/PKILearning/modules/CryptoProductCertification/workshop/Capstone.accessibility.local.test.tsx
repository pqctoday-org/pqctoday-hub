// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Capstone } from './Capstone'
import { RELEASE_SCHEMES } from '../data/sharedData'
describe('Certification capstone release-route label targets', () => {
  it('focuses the intended uniquely named route field for every scheme', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Capstone config={{ path: 'fips', focus: 'release' }} />
      </MemoryRouter>
    )
    const targets = []
    for (const scheme of RELEASE_SCHEMES) {
      const name = `Planned route and timing — ${scheme.label} (against the deadlines above)`
      const field = screen.getByRole('textbox', { name })
      targets.push(field.id)
      await user.click(screen.getByText(name, { exact: true }))
      expect(field).toHaveFocus()
      await user.type(field, `Sample ${scheme.label} route`)
      expect(field).toHaveValue(`Sample ${scheme.label} route`)
    }
    expect(new Set(targets).size).toBe(RELEASE_SCHEMES.length)
  })
})
