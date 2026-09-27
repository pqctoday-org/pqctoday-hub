// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity smoke test for the AcvpLabWorkflow module, mirroring the
 * pattern every other ModuleShell-based module uses.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { AcvpLabWorkflowModule } from './index'

describe('AcvpLabWorkflowModule render parity', () => {
  it('renders the header, the draft status chip, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AcvpLabWorkflowModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'ACVP Lab Workflow: From Vector Set to Evidence' })
    ).toBeInTheDocument()
    expect(screen.getByText('Work in progress')).toBeInTheDocument()
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('shows the draft notice and the required validation disclaimer on the Learn tab', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AcvpLabWorkflowModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    const notice = screen.getByTestId('acvp-lab-draft-notice')
    expect(notice).toHaveTextContent('awaiting review by a validation-lab practitioner')
    expect(notice).toHaveTextContent('It is not an ACVTS verdict, a CAVP/CMVP certificate')
  })
})
