// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render and registration parity checks for CustodyPqcMigration (LM-085).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { CustodyPqcMigrationModule } from './index'
import manifest from './manifest'
import { content } from './content'

describe('CustodyPqcMigration', () => {
  it('renders the module header and standard tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CustodyPqcMigrationModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'Custody PQC Migration' })).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track with LM-085 and valid learnSections/workshopSteps', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('custody-pqc-migration')
    expect(manifest.lm_id).toBe('LM-085')
    expect(manifest.trackOrder).toBe(13)
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'quantum-limits',
      'evolution',
      'pq-mpc-research',
      'shamir-seeds',
      'pq-hardware-wallets',
      'pq-smart-accounts',
      'custody-migration-path',
      'quantum-views-of-module-A',
      'takeaways',
    ])
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'quantum-limits-check',
      'custody-migration-planner',
      'shamir-seed-backup',
      'hw-wallet-claim-reader',
    ])
    expect(manifest.startHere?.step).toBe('quantum-limits-check')
  })

  it('omits lastReviewed and declares core custody PQC standards', () => {
    expect(content.lastReviewed).toBeUndefined()
    const ids = content.standards.map((s) => s.id)
    for (const id of [
      'PKCS11-V32-OS-OASIS',
      'RFC-10024',
      'NIST-IR-8214C-NIST-First-Call-for-Multi-Party-Threshold-Sche',
      'SLIP-0039',
      'Ethereum-EIP4337-AA',
      'Ethereum-EIP7702',
    ]) {
      expect(ids, id).toContain(id)
    }
  })

  it('loads the plain-language summary for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="custody-pqc-migration" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
    expect(screen.getAllByText('What This Is About').length).toBeGreaterThan(0)
  })
})
