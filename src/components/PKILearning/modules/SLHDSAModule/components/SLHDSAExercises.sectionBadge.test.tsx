// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Exercise 4 (Pure vs HashSLH-DSA) points at the signing procedures, FIPS 205 section 10.2
 * (10.2.1 Pure SLH-DSA Signature Generation, 10.2.2 HashSLH-DSA Signature Generation), not at
 * section 11, which is the parameter sets.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SLHDSAExercises } from './SLHDSAExercises'

describe('SLH-DSA exercises: FIPS 205 section badges', () => {
  it('Exercise 4 (the last badge) cites section 10.2, the signing procedures', () => {
    render(<SLHDSAExercises onNavigateToWorkshop={vi.fn()} />)
    expect(screen.getByText('4. Pure vs HashSLH-DSA')).toBeInTheDocument()
    const badges = screen.getAllByText(/^FIPS 205 §/).map((b) => b.textContent)
    expect(badges).toEqual(['FIPS 205 §10', 'FIPS 205 §9.2', 'FIPS 205 §10.2'])
  })

  it('no exercise badge points at section 11 for a signing procedure', () => {
    render(<SLHDSAExercises onNavigateToWorkshop={vi.fn()} />)
    expect(screen.queryByText('FIPS 205 §11')).not.toBeInTheDocument()
  })
})
