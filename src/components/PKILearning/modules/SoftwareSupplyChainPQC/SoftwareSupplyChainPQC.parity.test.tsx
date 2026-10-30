// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render and registration checks for the Software Supply Chain PQC module.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- checks one fixed repo path */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { SoftwareSupplyChainPQCModule } from './index'
import manifest from './manifest'
import { content } from './content'

describe('SoftwareSupplyChainPQC', () => {
  it('renders the module header and the standard tab set', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SoftwareSupplyChainPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'Software Supply Chain PQC' })).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track after the existing modules', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('software-supply-chain-pqc')
    expect(manifest.lm_id).toBe('LM-078')
    expect(manifest.trackOrder).toBe(9)
  })

  it('declares one Learn section per section id and three workshop steps', () => {
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'chain',
      'status',
      'updates',
      'provenance',
      'transition',
    ])
    expect(manifest.workshopSteps?.length).toBe(3)
    expect(manifest.startHere?.step).toBe('roles-and-thresholds')
  })

  it('cites the Library documents the lesson reads', () => {
    const ids = content.standards.map((s) => s.id)
    for (const id of [
      'NIST SP 800-218',
      'NIST-SP-800-204D',
      'TUF-Specification-v1-0-37',
      'Uptane-Standard-2-1-0',
      'SLSA-v1-2-Build-Provenance',
      'in-toto-Attestation-Statement-v1',
      'RFC 9019',
    ]) {
      expect(ids, id).toContain(id)
    }
  })

  it('loads the plain-language summary for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="software-supply-chain-pqc" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
    expect(screen.getAllByText('What This Is About').length).toBeGreaterThan(0)
  })

  it('ships its infographic for the Visual tab', () => {
    expect(
      existsSync(
        resolve(process.cwd(), 'public/images/infographics/pqcstd_software-supply-chain-pqc.png')
      )
    ).toBe(true)
  })
})
