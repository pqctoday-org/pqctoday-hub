// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Capstone } from './Capstone'
import { MANDATE_SCOPE_NOTE } from '../data/sharedData'

describe('capstone market-deadline list carries the scope note', () => {
  it('shows what a binding label does not say beside the list of deadlines', () => {
    render(
      <MemoryRouter>
        <Capstone config={{ path: 'fips' }} />
      </MemoryRouter>
    )
    const note = screen.getByTestId('mandate-scope-note')
    expect(note).toHaveTextContent(MANDATE_SCOPE_NOTE)
    expect(note).toHaveTextContent('assumption of this scenario')
  })
})
