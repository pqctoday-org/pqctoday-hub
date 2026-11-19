// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MigrationProgramExercises } from './MigrationProgramExercises'

describe('MigrationProgram exercise source accuracy', () => {
  it('separates NIST transition windows from commercial-bank obligations', () => {
    render(<MigrationProgramExercises onNavigateToWorkshop={vi.fn()} />)

    expect(
      screen.getByText(
        /deprecated after 2030 and disallowed under NIST standards and guidelines after 2035/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/not automatically bank-specific legal deadlines/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Treat these as planning references for this commercial bank/i)
    ).toBeInTheDocument()
  })

  it('distinguishes the federal annual inventory from the M-26-15 migration plan', () => {
    render(<MigrationProgramExercises onNavigateToWorkshop={vi.fn()} />)

    expect(
      screen.getByText(
        /annual prioritized inventory.*under M-23-02.*unless superseding guidance changes that cadence/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/PQC Migration Plan under OMB M-26-15/i)).toBeInTheDocument()
    expect(
      screen.getByText(/National security systems are outside these OMB memo requirements/i)
    ).toBeInTheDocument()
  })
})
