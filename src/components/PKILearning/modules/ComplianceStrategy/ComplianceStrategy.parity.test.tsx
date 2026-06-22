// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the ComplianceStrategy ModuleShell conversion
 * (A2 hard tail). Captured against the PRE-conversion module; must stay green
 * after it adopts <ModuleShell> with the onReset slot (the original Reset
 * cleared the FC-held selectedJurisdictions + dismissedFrameworks state).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { ComplianceStrategyModule } from './index'

describe('ComplianceStrategy render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <ComplianceStrategyModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // the &amp; entity renders as a literal &
    expect(
      screen.getByRole('heading', { name: 'Compliance & Regulatory Strategy' })
    ).toBeInTheDocument()
    // in-page <p> DIFFERS from the catalog description ("Map multi-jurisdiction
    // requirements, ...") — matching this proves the override slot.
    expect(
      screen.getByText(/Navigate the complex landscape of PQC compliance requirements/)
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
