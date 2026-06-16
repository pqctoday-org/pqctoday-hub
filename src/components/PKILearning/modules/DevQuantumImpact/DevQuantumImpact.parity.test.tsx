// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the DevQuantumImpact ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * DevQuantumImpact adopts <ModuleShell>, proving behaviour preservation.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { DevQuantumImpactModule } from './index'

describe('DevQuantumImpact render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <DevQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches the manifest title)
    expect(screen.getByRole('heading', { name: 'Developer Quantum Impact' })).toBeInTheDocument()
    // in-page description (the &mdash; entity renders as an em dash)
    expect(
      screen.getByText(
        /Understand how the quantum threat impacts your code, libraries, and protocols/
      )
    ).toBeInTheDocument()
    // the standard six-tab set (triggers render as buttons)
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
