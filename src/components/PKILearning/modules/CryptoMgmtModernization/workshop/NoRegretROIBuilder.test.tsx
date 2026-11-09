// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoRegretROIBuilder } from './NoRegretROIBuilder'
import type { CbomExportItem } from '../data/workshopTypes'

// Defaults use a scoped annual labour benchmark and one stock benefit at horizon end.
// Independent cashflow boundary cases are covered in roiCashflows.local.test.ts.

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
    expect(screen.getAllByText('$1.80M/yr').length).toBeGreaterThanOrEqual(1) // program cost
    expect(screen.getByText('$6.53M/yr')).toBeInTheDocument() // outage
    expect(screen.getByText('$1.95M/yr')).toBeInTheDocument() // clm
    expect(screen.getByText('$1.20M/yr')).toBeInTheDocument() // fips
    expect(screen.getByText('$744k/yr')).toBeInTheDocument() // cve
    expect(screen.getByText('$1.40M/yr')).toBeInTheDocument() // ma
    // The fixed stock contributes once, including the Scenario B summary.
    expect(screen.getAllByText('$12.0M once').length).toBeGreaterThanOrEqual(1)
  })

  it('renders both Scenario A and Scenario B output panels', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.getByText(/Scenario A — quantum never arrives/)).toBeInTheDocument()
    expect(screen.getByText(/Scenario B — assumed P\(CRQC within/)).toBeInTheDocument()
  })

  it('shows the sensitivity strip ranking streams by share', () => {
    render(<NoRegretROIBuilder />)
    expect(screen.getByText(/Which stream dominates\?.*Scenario B/)).toBeInTheDocument()
  })

  it('does not show the "Pull from CBOM" button when no CBOM assets are provided', () => {
    render(<NoRegretROIBuilder />)
    expect(
      screen.queryByRole('button', { name: /Pull last valid Step 3 sample/ })
    ).not.toBeInTheDocument()
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
      screen.getByRole('button', { name: /Pull last valid Step 3 sample \(1 HSM \/ 2 lib\)/ })
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
  it('imports zero HSMs from a library-only CBOM instead of retaining ten default HSMs', () => {
    const cbomAssets: CbomExportItem[] = [
      {
        name: 'Sample library',
        version: '1',
        type: 'library',
        fipsStatus: 'not-validated',
        esvStatus: 'not-validated',
        pqcSupport: 'unknown',
        posture: 'yellow',
        notes: '',
      },
    ]
    render(<NoRegretROIBuilder cbomAssets={cbomAssets} />)
    fireEvent.click(screen.getByRole('button', { name: /Pull last valid Step 3 sample/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Show math' })[3])
    expect(screen.getByRole('slider', { name: 'HSM count' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: 'Library count' })).toHaveValue('1')
    expect(screen.getByRole('status')).toHaveTextContent(
      'partial inventory does not establish whole-organisation counts'
    )
  })
})
