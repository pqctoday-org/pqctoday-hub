// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TransparencySection } from './TransparencySection'

describe('TransparencySection', () => {
  // Owner decision 2026-11-14 (Leaders A-1): many Community profiles are
  // compiled from public sources, so "included only with their written
  // consent" was not true.
  it('says how Community profiles are compiled and links the removal request', () => {
    render(
      <MemoryRouter>
        <TransparencySection />
      </MemoryRouter>
    )
    expect(screen.queryByText(/written consent/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Profiles in the Community directory are compiled/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'ask for a correction or removal' }).getAttribute('href')
    ).toContain('category=i-consent-to-be-added-as-a-pqc-leader')
  })
})
