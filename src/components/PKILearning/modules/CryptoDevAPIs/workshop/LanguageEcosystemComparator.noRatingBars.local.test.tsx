// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { LanguageEcosystemComparator } from './LanguageEcosystemComparator'
import { DEV_LANGUAGES } from '../data/languageData'

const RATING_LABELS = [
  'Crypto Ecosystem',
  'FFI Capability',
  'Build Tooling',
  'Compile-Time',
  'Audit History',
]

describe('language comparison carries no 0-10 rating bars', () => {
  it('shows no rating labels or scores on the language cards', () => {
    render(
      <MemoryRouter>
        <LanguageEcosystemComparator />
      </MemoryRouter>
    )
    for (const label of RATING_LABELS) expect(screen.queryByText(label)).toBeNull()
    expect(screen.queryByText(/^\d+\/10$/)).toBeNull()
    // The written comparison is still there.
    expect(screen.getByText(DEV_LANGUAGES[0].name)).toBeVisible()
  })

  it('keeps the comparison table but drops the rating rows', () => {
    render(
      <MemoryRouter>
        <LanguageEcosystemComparator />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Compare Mode' }))
    // The select control has no accessible name; the card's other buttons are named.
    const pick = screen.getAllByRole('button', { name: '' })
    expect(pick.length).toBeGreaterThanOrEqual(2)
    fireEvent.click(pick[0])
    fireEvent.click(pick[1])
    expect(screen.getByRole('row', { name: /Paradigm/ })).toBeVisible()
    expect(screen.getByRole('row', { name: /PQC Bindings/ })).toBeVisible()
    for (const label of RATING_LABELS) expect(screen.queryByText(label)).toBeNull()
    expect(screen.queryByText(/\d+\/10$/)).toBeNull()
  })
})
