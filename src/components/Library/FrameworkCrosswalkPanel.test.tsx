// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { FrameworkCrosswalkPanel, isAppliedQuantumFramework } from './FrameworkCrosswalkPanel'
import type { LibraryItem } from '../../data/libraryData'

function makeItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    referenceId: 'AQ-PQC-Migration-Framework-v2.1-2026',
    documentTitle: 'The Applied Quantum PQC Migration Framework (v2.1)',
    downloadUrl: '',
    initialPublicationDate: '2025-06-01',
    lastUpdateDate: '2026-06-01',
    documentStatus: 'Published',
    documentStatusBucket: 'Published',
    shortDescription: '',
    documentType: 'Research/Report',
    applicableIndustries: [],
    authorsOrOrganization: 'Marin Ivezic; Applied Quantum',
    dependencies: '',
    regionScope: 'PQC-REGION-GLOBAL',
    algorithmFamily: '',
    securityLevels: '',
    protocolOrToolImpact: '',
    toolchainSupport: '',
    migrationUrgency: 'High',
    manualCategory: 'applied-quantum',
    categories: ['Migration Guidance'],
    ...overrides,
  }
}

function renderPanel(item: LibraryItem) {
  return render(
    <MemoryRouter>
      <FrameworkCrosswalkPanel item={item} />
    </MemoryRouter>
  )
}

describe('isAppliedQuantumFramework', () => {
  it('detects the AQ entry by manualCategory', () => {
    expect(isAppliedQuantumFramework(makeItem())).toBe(true)
  })

  it('returns false for any other library item', () => {
    expect(isAppliedQuantumFramework(makeItem({ manualCategory: 'nist' }))).toBe(false)
    expect(isAppliedQuantumFramework(makeItem({ manualCategory: undefined }))).toBe(false)
  })
})

describe('FrameworkCrosswalkPanel', () => {
  it('renders nothing for a non-AQ item (additive — page unchanged elsewhere)', () => {
    const { container } = renderPanel(makeItem({ manualCategory: 'nist' }))
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the App. G crosswalk and App. H coverage panels for the AQ entry', () => {
    renderPanel(makeItem())
    expect(screen.getByText(/Framework Crosswalk \(App\. G\)/)).toBeInTheDocument()
    expect(screen.getByText(/Protocol Coverage \(App\. H\)/)).toBeInTheDocument()
  })

  it('expands the crosswalk to show the four source frameworks and phase rows', () => {
    renderPanel(makeItem())
    fireEvent.click(screen.getByRole('button', { name: /Framework Crosswalk/ }))
    // Source-framework legend chip (unique to the legend)
    expect(screen.getByText('PQCC Roadmap')).toBeInTheDocument()
    expect(screen.getByText('Dutch PQC Migration Handbook')).toBeInTheDocument()
    // ETSI label appears in both the legend chip and the per-phase column header
    expect(screen.getAllByText('ETSI TR 103 619').length).toBeGreaterThan(0)
    // A real NIST CSF 2.0 subcategory code from the phase data
    expect(screen.getByText('GV.OC-01')).toBeInTheDocument()
  })

  it('flags the App. H long-tail families when the coverage panel is expanded', () => {
    renderPanel(makeItem())
    fireEvent.click(screen.getByRole('button', { name: /Protocol Coverage/ }))
    expect(screen.getByText(/App\. H long-tail/)).toBeInTheDocument()
    expect(screen.getByText('DKIM')).toBeInTheDocument()
    expect(screen.getByText('WPA3')).toBeInTheDocument()
    expect(screen.getByText('Bluetooth')).toBeInTheDocument()
  })

  it('cross-links to the Algorithms protocol-support matrix', () => {
    renderPanel(makeItem())
    fireEvent.click(screen.getByRole('button', { name: /Protocol Coverage/ }))
    expect(screen.getByRole('button', { name: /Open Protocol Support matrix/ })).toBeInTheDocument()
  })
})
