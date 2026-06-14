// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArchitecturePanel } from './ArchitecturePanel'

describe('ArchitecturePanel (interactive)', () => {
  it('migrating links raises readiness; "Migrate all" fills to the ceiling', () => {
    render(<ArchitecturePanel size="small" country="US" />)
    expect(screen.getByText(/0\/6 links migrated · ceiling 3 migratable/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Migrate all eligible/i }))
    expect(screen.getByText(/3\/6 links migrated/)).toBeInTheDocument()
  })

  it('blocks migration when the strategy is non-compliant for the jurisdiction', () => {
    // Germany (BSI) requires hybrid → choosing "pure" must disable migration.
    render(<ArchitecturePanel size="small" country="DE" />)
    fireEvent.click(screen.getByRole('button', { name: /^pure$/i }))
    expect(screen.getByText(/requires hybrid/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migrate all eligible/i })).toBeDisabled()
    // every per-link Migrate button is disabled too
    const migrateButtons = screen.getAllByRole('button', { name: /^Migrate$/i })
    migrateButtons.forEach((b) => expect(b).toBeDisabled())
  })
})
