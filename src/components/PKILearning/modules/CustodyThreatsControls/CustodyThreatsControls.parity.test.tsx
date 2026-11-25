// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render and registration parity checks for CustodyThreatsControls (LM-083).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { CustodyThreatsControlsModule } from './index'
import rawManifest from './manifest'
import { content } from './content'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest = resolveManifest(rawManifest)

describe('CustodyThreatsControls', () => {
  it('renders the module header and standard tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CustodyThreatsControlsModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Custody Key Threats & Controls' })
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track with LM-083 and valid learnSections/workshopSteps', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('custody-threats-controls')
    expect(manifest.lm_id).toBe('LM-083')
    expect(manifest.trackOrder).toBe(11)
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'signing-authority',
      'exfiltration-paths',
      'adversary-model',
      'agent-authority',
      'case-studies',
      'limits-of-the-three',
      'combinations',
      'mpc-plus-hsm',
      'takeaways',
    ])
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'blind-vs-clear',
      'quorum-approvals',
      'threshold-signing',
      'combination-builder',
      'agent-wallet-scope',
    ])
    expect(manifest.startHere?.step).toBe('blind-vs-clear')
  })

  it('omits lastReviewed and declares core custody standards', () => {
    expect(content.lastReviewed).toBeUndefined()
    const ids = content.standards.map((s) => s.id)
    for (const id of [
      'PKCS11-V32-OS-OASIS',
      'RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS',
      'NIST-FIPS140-3-IG-PQC',
      'ERC-7730-Structured-Data-Clear-Signing-Format',
      'ERC-8176-Descriptor-Attestations-for-ERC-7730',
    ]) {
      expect(ids, id).toContain(id)
    }
  })

  it('loads the plain-language summary for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="custody-threats-controls" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
    expect(screen.getAllByText('What This Is About').length).toBeGreaterThan(0)
  })
})
