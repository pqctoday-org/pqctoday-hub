// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DecommissionChecklist } from './DecommissionChecklist'

describe('Decommissioning worksheet outcome scope', () => {
  it('gates the stage sequence but never turns selections into independent verification', () => {
    render(<DecommissionChecklist />)
    const remove = screen.getAllByRole('button', { name: 'Remove' })[0]
    const review = screen.getAllByRole('button', { name: 'Review sample status' })[0]
    const log = screen.getAllByRole('button', { name: 'Log' })[0]
    expect(remove).toBeDisabled()
    expect(review).toBeDisabled()
    fireEvent.click(screen.getAllByRole('button', { name: 'Deprecate' })[0])
    expect(remove).toBeDisabled()
    fireEvent.click(
      screen.getAllByRole('checkbox', { name: 'Sample dependents marked migrated' })[0]
    )
    fireEvent.click(remove)
    expect(log).toBeDisabled()
    fireEvent.click(review)
    expect(screen.getByText('Worksheet: Remove selected — no independent scan')).toBeInTheDocument()
    fireEvent.click(log)
    expect(screen.getByText(/^1\/\d+ sample stage walkthroughs completed$/)).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(
      'does not scan, delete keys or independently verify removal'
    )
    expect(screen.getByRole('note')).toHaveTextContent('trusted public keys and dependent copies')
    expect(screen.queryByText(/confirmed gone|retired & verified/)).not.toBeInTheDocument()
  })
})
