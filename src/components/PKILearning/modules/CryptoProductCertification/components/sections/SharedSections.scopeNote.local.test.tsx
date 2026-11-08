// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { TransitionDeadlines } from './SharedSections'
import { MANDATE_SCOPE_NOTE } from '../../data/sharedData'

describe('market-deadline table carries the scope note', () => {
  it('shows what a binding label does not say directly under the table', () => {
    render(
      <MemoryRouter>
        <TransitionDeadlines />
      </MemoryRouter>
    )
    const table = screen.getByRole('table', { name: 'Market deadlines' })
    const note = screen.getByTestId('mandate-scope-note')
    expect(note).toHaveTextContent(MANDATE_SCOPE_NOTE)
    expect(table.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(note).toHaveTextContent(
      'applies only to the organisations, systems and functions that instrument covers'
    )
  })
})
