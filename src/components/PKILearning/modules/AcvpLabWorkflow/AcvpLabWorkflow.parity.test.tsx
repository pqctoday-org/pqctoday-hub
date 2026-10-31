// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity smoke test for the AcvpLabWorkflow module, mirroring the
 * pattern every other ModuleShell-based module uses.
 */
import { describe, it, expect } from 'vitest'
import { NOT_LAB_REVIEWED } from '@/components/PKILearning/common/moduleReviewStatus'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { AcvpLabWorkflowModule } from './index'

describe('AcvpLabWorkflowModule render parity', () => {
  it('renders the header without a generic WIP chip and shows all six tabs', () => {
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
    expect(screen.queryByText('Work in progress')).not.toBeInTheDocument()
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

  it('says on the Tools & Products tab that the listed products were tested, not ACVP test tools', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AcvpLabWorkflowModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    const tab = screen.getByRole('tab', { name: 'Tools & Products' })
    fireEvent.mouseDown(tab)
    fireEvent.click(tab)
    expect(screen.getByTestId('tools-intro')).toHaveTextContent(
      "Many of these products hold NIST CAVP algorithm validation certificates for algorithms such as ML-KEM and ML-DSA; each product's entry says whether a CAVP certificate is linked. They are products that were tested, not tools for running ACVP tests."
    )
    // the shell writes the open tab to the URL; leave a clean address for the next test
    window.history.replaceState(null, '', '/')
  })

  it('shows the review status and the required validation disclaimer on the Learn tab', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AcvpLabWorkflowModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    const notice = screen.getByTestId('acvp-lab-status-notice')
    expect(notice).toHaveTextContent(
      "Corrected since the PQC Today owner's last sign-off; awaiting re-sign-off"
    )
    expect(notice).not.toHaveTextContent(/draft/i)
    // the same lab-review sentence the other four certification modules show
    expect(notice).toHaveTextContent(NOT_LAB_REVIEWED)
    expect(notice).toHaveTextContent('It is not an ACVTS verdict, a CAVP/CMVP certificate')
    const executionPath = screen.getByText('Confirm the execution path.').closest('li')
    expect(executionPath).toHaveTextContent(
      'An “acceleration enabled” setting does not prove that a test used the accelerator.'
    )
    expect(executionPath).toHaveTextContent('an implementation-specific execution trace or counter')
    expect(executionPath).toHaveTextContent('say that the execution path was not confirmed')
    expect(screen.getByText(/We deliberately give the module a bad signature/)).toHaveTextContent(
      'the test passes—the module did its job correctly'
    )
    expect(
      screen.getByText(/A failed internal self-test means something different/)
    ).toHaveTextContent('This does not prove it correctly examined our bad signature')
    expect(
      screen.getByText(/Therefore, our test must check why the operation failed/)
    ).toHaveTextContent('not treat every error as a correct rejection')
    expect(screen.getByText(/so the signatures can differ without/)).toHaveTextContent(
      'different bytes alone do not establish a fault'
    )
    expect(screen.getByText(/In an ACVP signature-generation test, however/)).toHaveTextContent(
      'Successful verification alone is not enough to pass that test'
    )
    expect(screen.getByText(/The expected result is the fallback shared secret/)).toHaveTextContent(
      'A wrong-length ciphertext is a separate input-error case'
    )
    expect(screen.getByRole('link', { name: 'ACVP suite' })).toHaveAttribute(
      'href',
      '/playground/hsm?tab=developer&dtab=acvp'
    )
  })
})
