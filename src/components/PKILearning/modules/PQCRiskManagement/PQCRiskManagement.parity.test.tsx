// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the PQCRiskManagement ModuleShell conversion
 * (A2 hard tail). Captured against the PRE-conversion module; must stay green
 * after it adopts <ModuleShell> with the onReset slot (the original Reset
 * cleared the FC-held riskEntries register), proving behaviour-preservation.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCRiskManagementModule } from './index'

describe('PQCRiskManagement render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCRiskManagementModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'PQC Risk Management' })).toBeInTheDocument()
    // in-page <p> DIFFERS from the catalog description ("Quantify quantum risk,
    // build risk registers, ...") — matching this proves the override slot.
    expect(
      screen.getByText(/Identify, quantify, and prioritize quantum computing risks/)
    ).toBeInTheDocument()
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
