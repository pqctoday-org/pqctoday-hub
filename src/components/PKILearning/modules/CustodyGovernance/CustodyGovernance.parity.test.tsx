// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render, Workshop W11 gate, and registration parity checks for CustodyGovernance (LM-086).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { CustodyGovernanceModule } from './index'
import { RegulationControlMapperWorkshop } from './workshop/RegulationControlMapperWorkshop'
import rawManifest from './manifest'
import { content } from './content'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest = resolveManifest(rawManifest)

describe('CustodyGovernance', () => {
  it('renders the module header and standard tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CustodyGovernanceModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Custody Governance & Assurance' })
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track with LM-086 and valid learnSections/workshopSteps', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('custody-governance')
    expect(manifest.lm_id).toBe('LM-086')
    expect(manifest.trackOrder).toBe(14)
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'evaluation-questions',
      'regulatory-requirements',
      'insurance-and-audit',
      'takeaways',
    ])
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual(['regulation-control-mapper'])
    expect(manifest.startHere?.step).toBe('regulation-control-mapper')
  })

  it('omits lastReviewed and declares core custody governance & assurance standards', () => {
    expect(content.lastReviewed).toBeUndefined()
    const ids = content.standards.map((s) => s.id)
    for (const id of [
      'MICA-REG-2023-1114',
      'DORA-REG-2022-2554',
      'DORA-RTS-2024-1774',
      'SFC-Circular-25EC44-Custody-Virtual-Assets',
      'VARA-Company-Rulebook',
      'NYDFS-Custodial-Structures-Guidance-2025',
      'Singapore-Payment-Services-Regulations-2019',
      'IAASB-ISAE-3000-Revised',
      'PCAOB-Investor-Advisory-Proof-of-Reserve-2023',
    ]) {
      expect(ids, id).toContain(id)
    }
  })

  it('renders W11 with applicability gates, no-mapped-control wording, market-practice tags, and separate US context band', () => {
    render(
      <MemoryRouter>
        <RegulationControlMapperWorkshop />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/Applicability Gates \(Evaluate Before Reading Any Control Cell\)/i)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/no mapped control found \(reviewer analysis\)/i).length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Market practice — not a mandate/i).length).toBeGreaterThanOrEqual(2)
    expect(
      screen.getByText(/Excluded from Control Cells by Instrument-Type Gate/i)
    ).toBeInTheDocument()

    // Toggle a third jurisdiction side by side
    fireEvent.click(screen.getByRole('button', { name: 'Dubai (VARA)' }))
    expect(screen.getByText(/VARA-licensed Virtual Asset Service Providers/i)).toBeInTheDocument()
  })

  it('loads the plain-language summary for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="custody-governance" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
    expect(screen.getAllByText('What This Is About').length).toBeGreaterThan(0)
  })
})
