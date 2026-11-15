// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render test for the Decommissioning & Program Closure ModuleShell module —
 * asserts the header, the in-page description, and the standard six-tab set.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { VerificationClosureModule } from './index'
import { CLOSURE_EVIDENCE_CHAIN_GUIDANCE } from './workshop/closureHandoverArtifact'
import curiousSummary from './curious-summary.md?raw'
import ragSummary from './rag-summary.md?raw'

describe('Verification & Closure module render', () => {
  it('renders the header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <VerificationClosureModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Decommissioning & Program Closure' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Retire classical cryptography on a defensible schedule/)
    ).toBeInTheDocument()
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

  it('establishes ACVP KAT vector mathematical conformance vs FIPS 140-3 / CC module boundary validation and the five suggested certificate checks', () => {
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('IUT')
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('SP 800-90B')
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.productionCertificateCrossCheckChecklist).toEqual([
      'Certificate or module number and status (active, historical or revoked)',
      'Exact module or product name and version',
      'Tested operational environment or evaluated configuration (CMVP Security Policy; CC certification report)',
      'CAVP algorithm certificate numbers for the algorithms you rely on',
      'CC/EUCC: Security Target and claimed assurance level',
    ])
    for (const summary of [curiousSummary, ragSummary]) {
      expect(summary).toContain('Hub practice guidance, not a certification-scheme requirement')
      expect(summary).toContain('Security Target')
      expect(summary).not.toContain('side-channel protections')
    }
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.nonEquivalenceRule).toContain(
      'never certification evidence'
    )
  })
})
