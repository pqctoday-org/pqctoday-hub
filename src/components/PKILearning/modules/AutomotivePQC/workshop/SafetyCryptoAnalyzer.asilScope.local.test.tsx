// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SafetyCryptoAnalyzer } from './SafetyCryptoAnalyzer'

vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

describe('ASIL crypto table is framed as example design assumptions', () => {
  it('does not present the table as ISO 26262 requirements', () => {
    render(
      <MemoryRouter>
        <SafetyCryptoAnalyzer />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('heading', {
        name: 'Example crypto design assumptions by ASIL (not ISO 26262 requirements)',
      })
    ).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Crypto Design Assumption' })).toBeVisible()
    expect(screen.queryByText('ISO 26262 ASIL Crypto Requirements')).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Crypto Requirement' })).toBeNull()
    expect(screen.queryByText(/Map ISO 26262 ASIL levels to cryptographic verification/)).toBeNull()
    expect(screen.getByText(/Map ASIL levels to example crypto design assumptions/)).toBeVisible()
  })
})
