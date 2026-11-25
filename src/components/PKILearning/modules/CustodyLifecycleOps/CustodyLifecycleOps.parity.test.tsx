// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render and registration parity checks for CustodyLifecycleOps (LM-084).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { CustodyLifecycleOpsModule } from './index'
import rawManifest from './manifest'
import { content } from './content'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest = resolveManifest(rawManifest)

describe('CustodyLifecycleOps', () => {
  it('renders the module header and standard tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CustodyLifecycleOpsModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Custody Key Lifecycle Operations' })
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track with LM-084 and valid learnSections/workshopSteps', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('custody-lifecycle-ops')
    expect(manifest.lm_id).toBe('LM-084')
    expect(manifest.trackOrder).toBe(12)
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'key-lifecycle',
      'rotation-and-revocation',
      'recovery-and-inheritance',
      'key-ceremonies',
      'monitoring-and-alerting',
      'access-control',
      'backup-and-dr',
      'destruction-and-decommissioning',
      'takeaways',
    ])
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'revoke-or-rotate',
      'recovery-and-inheritance-planner',
      'ceremony-script-review',
      'alert-triage',
      'access-matrix-review',
      'dr-drill',
      'decommission-checklist',
    ])
    expect(manifest.startHere?.step).toBe('revoke-or-rotate')
  })

  it('omits lastReviewed and declares core lifecycle standards', () => {
    expect(content.lastReviewed).toBeUndefined()
    const ids = content.standards.map((s) => s.id)
    for (const id of [
      'NIST-IR-8214',
      'PKCS11-V32-OS-OASIS',
      'KMIP-V2-1-OASIS',
      'NIST-SP-800-57-Pt1-R5',
      'NIST SP 800-88',
      'CABF-TLS-BR-v2-2-9',
    ]) {
      expect(ids, id).toContain(id)
    }
  })

  it('loads the plain-language summary for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="custody-lifecycle-ops" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
    expect(screen.getAllByText('What This Is About').length).toBeGreaterThan(0)
  })
})
