// SPDX-License-Identifier: GPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EstimateNote } from './EstimateNote'

describe('EstimateNote', () => {
  it('names what is modelled and says the figures are the site’s own', () => {
    render(<EstimateNote what="the migration cost bands by organisation size." />)
    const note = screen.getByTestId('estimate-note')
    expect(note).toHaveTextContent('Our estimate')
    expect(note).toHaveTextContent('the migration cost bands by organisation size.')
    expect(note).toHaveTextContent('not a value quoted from a standard or report')
  })

  it('appends the basis sentence when given', () => {
    render(
      <EstimateNote
        what="the HSM load per preset."
        basis="Derived from users × requests × the resumption ratio."
      />
    )
    expect(screen.getByTestId('estimate-note')).toHaveTextContent('Derived from users × requests')
  })
})
