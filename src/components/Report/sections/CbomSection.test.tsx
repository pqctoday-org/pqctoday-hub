// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { CbomSection } from './CbomSection'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'
import type { CbomReportSummary } from '@/services/cbom/reportSummary'

function seedDocs(docs: ExecutiveDocument[]) {
  useModuleStore.setState((state) => ({
    artifacts: { ...state.artifacts, executiveDocuments: docs },
  }))
}

const POPULATED_SUMMARY: CbomReportSummary = {
  mode: 'libs',
  generatedAt: 1751328000000,
  componentCount: 10,
  componentsWithCrypto: 8,
  cryptoAssetCount: 4,
  quantumSafeCount: 3,
  quantumVulnerableCount: 1,
  algorithms: [
    {
      name: 'ML-KEM-768',
      family: 'ML-KEM',
      classical: false,
      standard: 'FIPS203',
      standardUrl: 'https://doi.org/10.6028/NIST.FIPS.203',
    },
    {
      name: 'ML-DSA-65',
      family: 'ML-DSA',
      classical: false,
      standard: 'FIPS204',
      standardUrl: 'https://doi.org/10.6028/NIST.FIPS.204',
    },
    { name: 'Falcon', family: 'Falcon', classical: false },
    {
      name: '2048',
      family: 'RSASSA-PKCS1',
      classical: true,
      standard: 'RFC8017',
      standardUrl: 'https://www.rfc-editor.org/rfc/rfc8017',
    },
  ],
  byType: { library: 8, device: 2 },
}

const renderSection = () =>
  render(
    <MemoryRouter>
      <CbomSection defaultOpen />
    </MemoryRouter>
  )

describe('CbomSection', () => {
  afterEach(() => {
    seedDocs([])
  })

  it('empty state: shows a CTA to the CBOM Builder when no CBOM has ever been saved', () => {
    renderSection()
    expect(screen.getByText(/haven.t saved one to your Command Center yet/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Build your CBOM in the CBOM Builder/i })
    ).toHaveAttribute('href', '/learn/crypto-mgmt-modernization')
  })

  it('legacy state: prompts a re-save when a saved CBOM predates the structured summary', () => {
    seedDocs([
      {
        id: 'crypto-cbom-1',
        moduleId: 'crypto-management-modernization',
        type: 'crypto-cbom',
        title: 'CBOM — Jun 1, 2026',
        data: '# CBOM export',
        createdAt: 1748736000000,
        inputs: { mode: 'libs', selectedSbom: 'sample-1' }, // no reportSummary field
      },
    ])
    renderSection()
    expect(screen.getByText(/predates structured reporting/i)).toBeInTheDocument()
    expect(screen.getByText(/CBOM — Jun 1, 2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Re-open the CBOM Builder/i })).toHaveAttribute(
      'href',
      '/learn/crypto-mgmt-modernization'
    )
  })

  it('populated state: renders real component/crypto-asset counts', () => {
    seedDocs([
      {
        id: 'crypto-cbom-2',
        moduleId: 'crypto-management-modernization',
        type: 'crypto-cbom',
        title: 'CBOM — Jul 1, 2026',
        data: '# CBOM export',
        createdAt: 1751328000000,
        inputs: { mode: 'libs', reportSummary: POPULATED_SUMMARY },
      },
    ])
    renderSection()
    // "10 components" also appears in the coverage panel's gap note (2 of 10
    // components had no crypto detected) — match the full intro sentence instead.
    expect(
      screen.getByText(/From your library posture inventory — 10 components/)
    ).toBeInTheDocument()
    expect(screen.getByText(/4 crypto-assets detected/)).toBeInTheDocument()
  })

  it('populated state: compliance split shows correct quantum-safe vs quantum-vulnerable percentages', () => {
    seedDocs([
      {
        id: 'crypto-cbom-3',
        moduleId: 'crypto-management-modernization',
        type: 'crypto-cbom',
        title: 'CBOM — Jul 1, 2026',
        data: '# CBOM export',
        createdAt: 1751328000000,
        inputs: { mode: 'libs', reportSummary: POPULATED_SUMMARY },
      },
    ])
    renderSection()
    // 3 of 4 crypto-assets are PQC (quantum-safe) = 75%; 1 of 4 is classical = 25%.
    expect(screen.getByText('Quantum-safe (PQC)')).toBeInTheDocument()
    expect(screen.getByText('Quantum-vulnerable (classical)')).toBeInTheDocument()
    expect(screen.getByText(/\(75%\)/)).toBeInTheDocument()
    expect(screen.getByText(/\(25%\)/)).toBeInTheDocument()
  })

  it('populated state: shows real standard citations, and honestly labels algorithms with none', () => {
    seedDocs([
      {
        id: 'crypto-cbom-4',
        moduleId: 'crypto-management-modernization',
        type: 'crypto-cbom',
        title: 'CBOM — Jul 1, 2026',
        data: '# CBOM export',
        createdAt: 1751328000000,
        inputs: { mode: 'libs', reportSummary: POPULATED_SUMMARY },
      },
    ])
    renderSection()
    expect(screen.getByRole('link', { name: 'FIPS203' })).toHaveAttribute(
      'href',
      'https://doi.org/10.6028/NIST.FIPS.203'
    )
    expect(screen.getByText(/no published standard yet/i)).toBeInTheDocument()
  })
})
