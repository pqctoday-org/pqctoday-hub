// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { APIArchitectureExplorer } from './APIArchitectureExplorer'
import { CRYPTO_APIS } from '../data/apiData'

const RATING_LABELS = ['Maturity', 'PQC Ready', 'HSM', 'Community']

describe('API comparison carries no 0-10 rating bars', () => {
  it('shows no rating labels or scores on the API cards', () => {
    render(
      <MemoryRouter>
        <APIArchitectureExplorer />
      </MemoryRouter>
    )
    for (const label of RATING_LABELS) expect(screen.queryByText(label)).toBeNull()
    expect(screen.queryByText(/^\d+\/10$/)).toBeNull()
    expect(screen.getAllByText(CRYPTO_APIS[0].name).length).toBeGreaterThan(0)
  })

  it('keeps the comparison table but drops the rating rows', () => {
    render(
      <MemoryRouter>
        <APIArchitectureExplorer />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Compare Mode' }))
    const pick = screen.getAllByTitle('Add to comparison')
    fireEvent.click(pick[0])
    fireEvent.click(pick[1])
    expect(screen.getByRole('row', { name: /Session Model/ })).toBeVisible()
    expect(screen.getByRole('row', { name: /PQC Status/ })).toBeVisible()
    for (const label of RATING_LABELS) expect(screen.queryByText(label)).toBeNull()
    expect(screen.queryByText(/\d+\/10$/)).toBeNull()
  })
})
