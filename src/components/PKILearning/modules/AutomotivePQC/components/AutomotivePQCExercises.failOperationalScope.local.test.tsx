// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { AutomotivePQCExercises } from './AutomotivePQCExercises'

describe('braking exercise: fail-operational behaviour is an example assumption', () => {
  it('does not say an ASIL letter or safety certification makes a classical backup mandatory', () => {
    render(
      <MemoryRouter>
        <AutomotivePQCExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const observation = screen.getByText(/ML-DSA-44 verification \(~0\.3ms on automotive SoC\)/)
    const text = (observation.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toContain('in this module’s example, braking is assumed to need fail-operational')
    expect(text).toContain('a second verification path that does not depend on the PQC code')
    expect(text).toContain(
      'comes from the function’s hazard analysis and safety goals, not from the ASIL letter'
    )
    expect(text).toContain('the module cites no standard that makes a classical backup mandatory')
    expect(text).not.toMatch(/ASIL-D requires/)
    expect(text).not.toMatch(/mandatory for safety certification/)
    expect(text).not.toMatch(/classical ECDSA backup must maintain braking/)
  })
})
