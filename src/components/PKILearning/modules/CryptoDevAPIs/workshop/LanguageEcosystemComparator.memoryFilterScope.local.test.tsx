// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { LanguageEcosystemComparator } from './LanguageEcosystemComparator'

const filter = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: /Memory Safety:/ }))
  fireEvent.click(screen.getByRole('option', { name }))
}

describe('Recorded language memory-model filters', () => {
  it('offers only represented categories and keeps Python in its existing GC classification', () => {
    render(
      <MemoryRouter>
        <LanguageEcosystemComparator />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Memory Safety:/ }))
    expect(
      screen.queryByRole('option', { name: /Python|Reference counted/ })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Garbage collected' }))
    expect(screen.getByRole('button', { name: 'Expand Python' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand Rust' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Python' }))
    fireEvent.click(screen.getByRole('button', { name: 'Compare Mode' }))
    filter('Ownership')
    expect(screen.getByRole('button', { name: 'Expand Rust' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compare (0/3)' })).toBeInTheDocument()
    filter('Manual')
    expect(screen.getByRole('button', { name: 'Expand C++' })).toBeInTheDocument()
    filter('Compile-time')
    expect(screen.getByRole('button', { name: 'Expand Zig' })).toBeInTheDocument()
    filter('All')
    expect(screen.getByRole('button', { name: 'Collapse Python' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Rust' })).toBeInTheDocument()
    expect(screen.getByText(/category recorded for each catalogue entry/)).toBeInTheDocument()
  })
})
