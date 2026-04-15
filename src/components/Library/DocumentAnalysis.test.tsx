// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { DocumentAnalysis } from './DocumentAnalysis'
import type { LibraryEnrichment } from '../../data/libraryEnrichmentData'

const EMPTY_V2 = {
  classicalAlgorithms: [] as string[],
  keyTakeaways: [] as string[],
  securityLevels: [] as string[],
  hybridApproaches: [] as string[],
  performanceConsiderations: [] as string[],
  targetAudience: [] as string[],
  implementationPrereqs: [] as string[],
  relevantFeatures: [] as string[],
  implementationAttackSurface: [] as string[],
  cryptoDiscovery: [] as string[],
  testingValidation: [] as string[],
  qkdProtocols: [] as string[],
  qrngEntropy: [] as string[],
  constrainedDeviceIoT: [] as string[],
  supplyChainRisk: [] as string[],
  deploymentComplexity: [] as string[],
  financialBusinessImpact: [] as string[],
  organizationalReadiness: [] as string[],
}

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
  classicalAlgorithms: ['RSA', 'ECDSA', 'AES-256'],
  keyTakeaways: [
    'Organizations should begin PQC migration planning immediately',
    'Hybrid deployments reduce risk during transition',
    'Crypto inventory is the essential first step',
  ],
  securityLevels: ['NIST L1', 'NIST L3', 'ML-KEM-768'],
  hybridApproaches: ['Composite certificates', 'X-Wing', 'dual-stack'],
  performanceConsiderations: [
    'ML-KEM-768 ciphertext 1088 bytes',
    '2x bandwidth overhead for hybrid',
  ],
  targetAudience: ['Security Architect', 'Developer'],
  implementationPrereqs: ['OpenSSL 3.5+', 'FIPS 140-3 module'],
  relevantFeatures: ['Compliance', 'tls-basics', '5g-security'],
  implementationAttackSurface: [],
  cryptoDiscovery: [],
  testingValidation: [],
  qkdProtocols: [],
  qrngEntropy: [],
  constrainedDeviceIoT: [],
  supplyChainRisk: [],
  deploymentComplexity: [],
  financialBusinessImpact: [],
  organizationalReadiness: [],
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
  ...EMPTY_V2,
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('DocumentAnalysis', () => {
  it('renders the toggle button', () => {
    renderWithRouter(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    expect(screen.getByRole('button', { name: /document analysis/i })).toBeInTheDocument()
  })

  it('is collapsed by default — dimension content not visible', () => {
    renderWithRouter(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    expect(screen.queryByText('ML-KEM')).not.toBeInTheDocument()
    expect(screen.queryByText('HNDL')).not.toBeInTheDocument()
  })

  it('expands when toggle is clicked and shows all populated dimensions', () => {
    renderWithRouter(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
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

    // v2 dimensions
    // Classical Algorithms
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.getByText('ECDSA')).toBeInTheDocument()

    // Key Takeaways
    expect(
      screen.getByText('Organizations should begin PQC migration planning immediately')
    ).toBeInTheDocument()

    // Security Levels
    expect(screen.getByText('NIST L1')).toBeInTheDocument()
    expect(screen.getByText('ML-KEM-768')).toBeInTheDocument()

    // Hybrid Approaches
    expect(screen.getByText('Composite certificates')).toBeInTheDocument()
    expect(screen.getByText('X-Wing')).toBeInTheDocument()

    // Performance
    expect(screen.getByText('ML-KEM-768 ciphertext 1088 bytes')).toBeInTheDocument()

    // Target Audience
    expect(screen.getByText('Security Architect')).toBeInTheDocument()

    // Prerequisites
    expect(screen.getByText('OpenSSL 3.5+')).toBeInTheDocument()

    // Relevant Features (clickable)
    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('tls-basics')).toBeInTheDocument()
    expect(screen.getByText('5g-security')).toBeInTheDocument()
  })

  it('shows section headers when dimensions are populated', () => {
    renderWithRouter(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    fireEvent.click(screen.getByRole('button', { name: /document analysis/i }))

    expect(screen.getByText('Core Analysis')).toBeInTheDocument()
    expect(screen.getByText('Algorithms & Security')).toBeInTheDocument()
    expect(screen.getByText('Migration & Implementation')).toBeInTheDocument()
    expect(screen.getByText('Ecosystem')).toBeInTheDocument()
    expect(screen.getByText('Explore on PQC Today')).toBeInTheDocument()
  })

  it('omits empty dimensions when expanded', () => {
    renderWithRouter(<DocumentAnalysis enrichment={MINIMAL_ENRICHMENT} />)
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

    // v2 dimension labels should NOT be rendered
    expect(screen.queryByText('Classical Algorithms')).not.toBeInTheDocument()
    expect(screen.queryByText('Key Takeaways')).not.toBeInTheDocument()
    expect(screen.queryByText('Security Levels & Parameters')).not.toBeInTheDocument()
    expect(screen.queryByText('Hybrid & Transition')).not.toBeInTheDocument()
    expect(screen.queryByText('Performance & Size')).not.toBeInTheDocument()
    expect(screen.queryByText('Target Audience')).not.toBeInTheDocument()
    expect(screen.queryByText('Implementation Prerequisites')).not.toBeInTheDocument()
    expect(screen.queryByText('Relevant Features')).not.toBeInTheDocument()

    // Empty sections should not render
    expect(screen.queryByText('Algorithms & Security')).not.toBeInTheDocument()
    expect(screen.queryByText('Migration & Implementation')).not.toBeInTheDocument()
    expect(screen.queryByText('Ecosystem')).not.toBeInTheDocument()
    expect(screen.queryByText('Explore on PQC Today')).not.toBeInTheDocument()
  })

  it('collapses when toggle is clicked again', () => {
    renderWithRouter(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    const toggle = screen.getByRole('button', { name: /document analysis/i })

    // Expand
    fireEvent.click(toggle)
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()

    // Collapse
    fireEvent.click(toggle)
    expect(screen.queryByText('ML-KEM')).not.toBeInTheDocument()
  })

  it('sets aria-expanded correctly', () => {
    renderWithRouter(<DocumentAnalysis enrichment={RICH_ENRICHMENT} />)
    const toggle = screen.getByRole('button', { name: /document analysis/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
