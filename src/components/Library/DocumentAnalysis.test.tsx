// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DocumentAnalysis } from './DocumentAnalysis'
import type { LibraryEnrichment } from '../../data/libraryEnrichmentData'

const RICH_ENRICHMENT: LibraryEnrichment = {
  mainTopic: 'Guidance for integrating PQC into TLS and 5G infrastructure.',
  pqcAlgorithms: ['ML-KEM', 'ML-DSA'],
  quantumThreats: ['HNDL', 'Post-Quantum'],
  migrationTimeline: ['Deprecation of RSA by 2030', 'PQC mandate by 2035'],
  regionsAndBodies: { regions: ['United States', 'EU'], bodies: ['NIST', 'ANSSI'] },
  leadersContributions: ['Dustin Moody'],
  pqcProducts: ['OpenSSL', 'Signal'],
  protocols: ['TLS', 'IPsec'],
  infrastructureLayers: ['PKI', '5G'],
  standardizationBodies: ['IETF', 'ETSI'],
  complianceFrameworks: ['CNSA 2.0', 'GSMA NG.116'],
}

const MINIMAL_ENRICHMENT: LibraryEnrichment = {
  mainTopic: 'A basic document topic.',
  pqcAlgorithms: [],
  quantumThreats: [],
  migrationTimeline: null,
  regionsAndBodies: null,
  leadersContributions: [],
  pqcProducts: [],
  protocols: [],
  infrastructureLayers: [],
  standardizationBodies: [],
  complianceFrameworks: [],
}

describe('DocumentAnalysis', () => {
  it('renders the toggle button', () => {
    render(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    expect(screen.getByRole('button', { name: /document analysis/i })).toBeInTheDocument()
  })

  it('is collapsed by default — dimension content not visible', () => {
    render(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    expect(screen.queryByText('ML-KEM')).not.toBeInTheDocument()
    expect(screen.queryByText('HNDL')).not.toBeInTheDocument()
  })

  it('expands when toggle is clicked and shows all populated dimensions', () => {
    render(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    fireEvent.click(screen.getByRole('button', { name: /document analysis/i }))

    // Main topic
    expect(
      screen.getByText('Guidance for integrating PQC into TLS and 5G infrastructure.')
    ).toBeInTheDocument()

    // PQC Algorithms
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA')).toBeInTheDocument()

    // Quantum Threats
    expect(screen.getByText('HNDL')).toBeInTheDocument()
    expect(screen.getByText('Post-Quantum')).toBeInTheDocument()

    // Migration Timeline
    expect(screen.getByText('Deprecation of RSA by 2030')).toBeInTheDocument()
    expect(screen.getByText('PQC mandate by 2035')).toBeInTheDocument()

    // Regions & Bodies
    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText('EU')).toBeInTheDocument()
    expect(screen.getByText('NIST')).toBeInTheDocument()
    expect(screen.getByText('ANSSI')).toBeInTheDocument()

    // Leaders
    expect(screen.getByText('Dustin Moody')).toBeInTheDocument()

    // Products
    expect(screen.getByText('OpenSSL')).toBeInTheDocument()
    expect(screen.getByText('Signal')).toBeInTheDocument()

    // Protocols
    expect(screen.getByText('TLS')).toBeInTheDocument()
    expect(screen.getByText('IPsec')).toBeInTheDocument()

    // Infrastructure
    expect(screen.getByText('PKI')).toBeInTheDocument()
    expect(screen.getByText('5G')).toBeInTheDocument()

    // Standardization Bodies
    expect(screen.getByText('IETF')).toBeInTheDocument()
    expect(screen.getByText('ETSI')).toBeInTheDocument()

    // Compliance
    expect(screen.getByText('CNSA 2.0')).toBeInTheDocument()
    expect(screen.getByText('GSMA NG.116')).toBeInTheDocument()
  })

  it('omits empty dimensions when expanded', () => {
    render(<DocumentAnalysis enrichment={MINIMAL_ENRICHMENT} />)
    fireEvent.click(screen.getByRole('button', { name: /document analysis/i }))

    // Main topic should be shown
    expect(screen.getByText('A basic document topic.')).toBeInTheDocument()

    // These dimension labels should NOT be rendered
    expect(screen.queryByText('PQC Algorithms')).not.toBeInTheDocument()
    expect(screen.queryByText('Quantum Threats')).not.toBeInTheDocument()
    expect(screen.queryByText('Migration Timeline')).not.toBeInTheDocument()
    expect(screen.queryByText('Regions & Bodies')).not.toBeInTheDocument()
    expect(screen.queryByText('Leaders Mentioned')).not.toBeInTheDocument()
    expect(screen.queryByText('PQC Products')).not.toBeInTheDocument()
    expect(screen.queryByText('Protocols')).not.toBeInTheDocument()
    expect(screen.queryByText('Infrastructure Layers')).not.toBeInTheDocument()
    expect(screen.queryByText('Standardization Bodies')).not.toBeInTheDocument()
    expect(screen.queryByText('Compliance Frameworks')).not.toBeInTheDocument()
  })

  it('collapses when toggle is clicked again', () => {
    render(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    const toggle = screen.getByRole('button', { name: /document analysis/i })

    // Expand
    fireEvent.click(toggle)
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()

    // Collapse
    fireEvent.click(toggle)
    expect(screen.queryByText('ML-KEM')).not.toBeInTheDocument()
  })

  it('sets aria-expanded correctly', () => {
    render(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    const toggle = screen.getByRole('button', { name: /document analysis/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
