// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { HealthcarePQCExercises } from './HealthcarePQCExercises'

describe('biometric exercise wording', () => {
  it('says neither template can be reissued and names what decides whether exposure enables impersonation', () => {
    render(
      <MemoryRouter>
        <HealthcarePQCExercises onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    const observation = screen.getByText(/DNA SNP profiles are 5 MB vs 512 bytes/)
    expect(observation).toHaveTextContent('neither can be reissued')
    expect(observation).toHaveTextContent(
      'depends on template protection, presentation attack detection and a second factor'
    )
    expect(observation).not.toHaveTextContent('permanently compromised')
  })
})
