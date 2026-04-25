// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoRegretROIBuilder } from './NoRegretROIBuilder'
import type { CbomExportItem } from '../data/workshopTypes'

// At default sub-parameters (calibrated to preserve the prior flat-slider headlines):
//   annual cost     = 6 × 200k + 150k + 120k + 180k + 150k = $1.80M
//   outage          = 11M × 0.86 × 0.69                    = $6.527M
//   clm             = 4.43M × 0.74                         = $3.278M
//   fips            = 10 × 0.18 × 600k + 15 × 0.20 × 40k   = $1.20M
//   cve             = 4 × 240 × 150 + 600k                 = $0.744M
//   ma              = (12M × 0.5 × 0.7) / 3                = $1.40M
//   quantum (raw)   = 30M × 0.4                            = $12.00M
//   pCrqc default   = 1.0 → qDep = 12.00M
//   qIndep          = 6.527 + 3.278 + 1.20 + 0.744 + 1.40  = $13.149M
// 3-year totals (horizon=3):
//   benefitA = 39.45M, totalCost = 5.40M, ROI_A ≈ 631%
//   benefitB = 75.45M,                     ROI_B ≈ 1297%

describe('NoRegretROIBuilder', () => {
  it('renders all six benefit-stream headlines and the program cost', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.getByText('Annual CPM program cost')).toBeInTheDocument()
    expect(screen.getByText('Cert-outage avoidance')).toBeInTheDocument()
    expect(screen.getByText('CLM automation labor savings')).toBeInTheDocument()
    expect(screen.getByText('FIPS 140-3 drift remediation avoided')).toBeInTheDocument()
    expect(screen.getByText('Library-CVE response acceleration')).toBeInTheDocument()
    expect(screen.getByText(/Time-to-market.*M&A readiness/)).toBeInTheDocument()
    expect(screen.getByText('Quantum breach avoidance (Scenario B)')).toBeInTheDocument()
  })

  it('rolls up default sub-parameters to the expected headline numbers', () => {
    render(<NoRegretROIBuilder />)
    // Headline values appear next to each stream label. Match dollar formats.
    // These confirm sub-models compute the same totals as the prior flat sliders.
    expect(screen.getAllByText('$1.80M/yr').length).toBeGreaterThanOrEqual(1) // program cost
    expect(screen.getByText('$6.53M/yr')).toBeInTheDocument() // outage
    expect(screen.getByText('$3.28M/yr')).toBeInTheDocument() // clm
    expect(screen.getByText('$1.20M/yr')).toBeInTheDocument() // fips
    expect(screen.getByText('$744k/yr')).toBeInTheDocument() // cve
    expect(screen.getByText('$1.40M/yr')).toBeInTheDocument() // ma
    // qDep ($12.0M/yr) appears both as the stream headline and in the Scenario B summary
    expect(screen.getAllByText('$12.0M/yr').length).toBeGreaterThanOrEqual(1)
  })

  it('renders both Scenario A and Scenario B output panels', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.getByText(/Scenario A — quantum never arrives/)).toBeInTheDocument()
    expect(screen.getByText(/Scenario B — CRQC arrives within/)).toBeInTheDocument()
  })

  it('shows the sensitivity strip ranking streams by share', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.getByText(/Which stream dominates\?.*Scenario B/)).toBeInTheDocument()
  })

  it('does not show the "Pull from CBOM" button when no CBOM assets are provided', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.queryByRole('button', { name: /Pull from Step 3 CBOM/ })).not.toBeInTheDocument()
  })

  it('shows "Pull from CBOM" with HSM and library counts when assets are provided', () => {
    const cbomAssets: CbomExportItem[] = [
      {
        name: 'Thales Luna 7',
        version: '7.7',
        type: 'hsm',
        fipsStatus: 'active',
        esvStatus: 'active',
        pqcSupport: 'roadmap',
        posture: 'yellow',
        notes: '',
      },
      {
        name: 'OpenSSL',
        version: '3.4.0',
        type: 'library',
        fipsStatus: 'active-pqc',
        esvStatus: 'active',
        pqcSupport: 'ML-KEM, ML-DSA',
        posture: 'green',
        notes: '',
      },
      {
        name: 'BoringSSL',
        version: '0.0.0',
        type: 'library',
        fipsStatus: 'not-validated',
        esvStatus: 'not-validated',
        pqcSupport: 'partial',
        posture: 'yellow',
        notes: '',
      },
    ]
    render(<NoRegretROIBuilder cbomAssets={cbomAssets} />)
    expect(
      screen.getByRole('button', { name: /Pull from Step 3 CBOM \(1 HSM \/ 2 lib\)/ })
    ).toBeInTheDocument()
  })

  it('toggles a sub-model accordion via the Show math button', () => {
    render(<NoRegretROIBuilder />)
    const buttons = screen.getAllByText('Show math')
    expect(buttons.length).toBeGreaterThan(0)
    // Initially the math/explanation should be hidden (the formula text is not visible)
    expect(screen.queryByText(/avg_outage_cost × annual_incidence/)).not.toBeInTheDocument()
    // Open the first one (program cost)
    fireEvent.click(buttons[0])
    // After expand: at least one Hide math should now exist
    expect(screen.getAllByText('Hide math').length).toBeGreaterThan(0)
  })

  it('renders the Reset all button', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.getByText('Reset all')).toBeInTheDocument()
  })
})
