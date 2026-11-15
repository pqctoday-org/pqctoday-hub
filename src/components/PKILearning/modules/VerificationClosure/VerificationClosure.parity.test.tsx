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

  it('establishes ACVP KAT vector mathematical conformance vs FIPS 140-3 / CC module boundary validation and 5 certificate cross-check fields', () => {
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('IUT')
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('SP 800-90B')
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.productionCertificateCrossCheckFields).toEqual([
      'Operational Environment (OE)',
      'CAVP Algorithm Cert #',
      'CMVP Module Cert #',
      'Tested Version/Commit',
      'Security Target SHA-256',
    ])
    for (const field of CLOSURE_EVIDENCE_CHAIN_GUIDANCE.productionCertificateCrossCheckFields) {
      expect(curiousSummary).toContain(field)
      expect(ragSummary).toContain(field)
    }
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.nonEquivalenceRule).toContain(
      'never certification evidence'
    )
  })
})
