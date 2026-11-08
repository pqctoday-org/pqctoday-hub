// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SecureBootExercises } from './SecureBootExercises'

describe('TPM exercise describes the interim hybrid as an illustrative sketch with limits', () => {
  it('does not say a software co-signature provides quantum safety', () => {
    render(
      <MemoryRouter>
        <SecureBootExercises onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    const observation = screen.getByText(/Expanding the Hybrid Approach section shows/)
    expect(observation).toHaveTextContent('illustrative interim sketch')
    expect(observation).toHaveTextContent('has no hardware root of trust')
    expect(observation).toHaveTextContent('not by itself quantum-safe attestation')
    expect(observation).not.toHaveTextContent('co-signature provides quantum safety')
    expect(observation).not.toHaveTextContent('interim two-signature pattern')
  })
})
