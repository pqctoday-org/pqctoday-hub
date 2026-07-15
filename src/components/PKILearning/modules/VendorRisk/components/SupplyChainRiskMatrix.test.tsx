// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SupplyChainRiskMatrix } from './SupplyChainRiskMatrix'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { ThreatData } from '@/data/threatsData'

function makeProduct(over: Partial<SoftwareItem>): SoftwareItem {
  return {
    productId: over.productId ?? 'p1',
    softwareName: over.softwareName ?? 'Test Product',
    categoryId: 'c',
    categoryName: 'Test Category',
    infrastructureLayer: '',
    cisaCategory: '',
    pqcSupport: 'Yes',
    pqcCapabilityDescription: '',
    licenseType: '',
    license: '',
    latestVersion: '',
    releaseDate: '',
    fipsValidated: 'No',
    pqcMigrationPriority: 'Low',
    primaryPlatforms: '',
    targetIndustries: '',
    authoritativeSource: '',
    repositoryUrl: '',
    productBrief: '',
    sourceType: '',
    verificationStatus: '',
    lastVerifiedDate: '',
    migrationPhases: '',
    learningModules: '',
    ...over,
  }
}

function makeThreat(over: Partial<ThreatData>): ThreatData {
  return {
    industry: 'Finance',
    threatId: 'T-1',
    description: '',
    criticality: 'High',
    cryptoAtRisk: '',
    pqcReplacement: '',
    mainSource: '',
    sourceUrl: '',
    relatedModules: [],
    ...over,
  }
}

// --- Fixture layers ---
// Database: 1/2 not PQC-ready (Migration Gap > 0), 1/2 Critical priority,
// 1 matching threat.
const dbReady = makeProduct({ productId: 'db-1', softwareName: 'ReadyDB', pqcSupport: 'Yes' })
const dbGap = makeProduct({
  productId: 'db-2',
  softwareName: 'GapDB',
  pqcSupport: 'No',
  pqcMigrationPriority: 'Critical',
})

// Cloud: same 1/2 Critical-priority ratio as Database, but 3 matching
// threats instead of 1 — proves Impact no longer tracks pqcMigrationPriority.
const cloudReady = makeProduct({
  productId: 'cloud-1',
  softwareName: 'ReadyCloudKMS',
  pqcSupport: 'Yes',
})
const cloudGap = makeProduct({
  productId: 'cloud-2',
  softwareName: 'GapCloudVault',
  pqcSupport: 'No',
  pqcMigrationPriority: 'Critical',
  pqcCapabilityDescription: 'Hybrid ML-KEM + X25519 key exchange',
})

// OS: fully PQC-ready, no Critical priority, zero matching threats —
// both axes should be exactly 0 ("no risk", not floored to 1).
const osReady1 = makeProduct({ productId: 'os-1', softwareName: 'ReadyOS-A', pqcSupport: 'Yes' })
const osReady2 = makeProduct({ productId: 'os-2', softwareName: 'ReadyOS-B', pqcSupport: 'Yes' })

// Libraries: dependency provider, referenced by name in an AppServers consumer.
const opensslProvider = makeProduct({
  productId: 'lib-1',
  softwareName: 'OpenSSL',
  pqcSupport: 'Yes',
})
const appServerConsumer = makeProduct({
  productId: 'app-1',
  softwareName: 'Consumer App Server',
  pqcSupport: 'Yes',
  pqcCapabilityDescription: 'Built on OpenSSL for TLS termination',
})

const vendorsByLayer = new Map<string, SoftwareItem[]>([
  ['Database', [dbReady, dbGap]],
  ['Cloud', [cloudReady, cloudGap]],
  ['OS', [osReady1, osReady2]],
  ['Libraries', [opensslProvider]],
  ['AppServers', [appServerConsumer]],
])

const threats: ThreatData[] = [
  makeThreat({ threatId: 'T-DB-1', description: 'Attackers exploit weak Database records.' }),
  makeThreat({ threatId: 'T-CLOUD-1', description: 'Cloud KMS misconfiguration exposes keys.' }),
  makeThreat({ threatId: 'T-CLOUD-2', description: 'Cloud tenant isolation failure.' }),
  makeThreat({ threatId: 'T-CLOUD-3', description: 'Cloud IAM privilege escalation.' }),
]

function baseData(overrides: Partial<ExecutiveModuleData> = {}): ExecutiveModuleData {
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: 0,
    totalThreatCount: threats.length,
    industryThreats: threats,
    vendorsByLayer,
    fipsValidatedCount: 0,
    pqcReadyCount: 4,
    vendorReadinessWeighted: 0,
    vendorReadinessByLayer: new Map(),
    totalProducts: 7,
    frameworks: [],
    frameworksByIndustry: [],
    countryDeadlines: [],
    userCountryData: null,
    assessmentResult: null,
    riskScore: null,
    industry: 'Finance',
    country: '',
    complianceSelections: [],
    preBoostScore: null,
    boosts: [],
    hndlRiskWindow: null,
    tnflRiskWindow: null,
    categoryScores: null,
    categoryDrivers: null,
    migrationEffort: [],
    algorithmMigrations: [],
    keyFindings: [],
    assessmentProfile: null,
    myFrameworks: [],
    myProductIds: [],
    myProducts: [],
    myThreatIds: [],
    myThreats: [],
    myTimelineCountries: [],
    myTimelineCountryData: [],
    isAssessmentComplete: false,
    migrationDeadlineYear: null,
    ...overrides,
  }
}

let mockData: ExecutiveModuleData = baseData()

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => mockData,
}))

vi.mock('@/store/useMigrateSelectionStore', () => ({
  useSelectedProductIds: () => [],
}))

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: unknown) => unknown) => {
    const state = { addExecutiveDocument: vi.fn(), artifacts: { executiveDocuments: [] } }
    return selector ? selector(state) : state
  },
}))

describe('SupplyChainRiskMatrix', () => {
  beforeEach(() => {
    mockData = baseData()
  })

  it('renders per-product rows via ProductRow that expand to ProductDetail independently', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    const readyRow = screen.getByRole('button', { name: /expand details for ReadyDB/i })
    const gapRow = screen.getByRole('button', { name: /expand details for GapDB/i })

    fireEvent.click(readyRow)
    expect(screen.getAllByText('Verification status')).toHaveLength(1)

    fireEvent.click(gapRow)
    expect(screen.getAllByText('Verification status')).toHaveLength(2)

    // Collapsing one leaves the other expanded (independent state per row).
    fireEvent.click(readyRow)
    expect(screen.getAllByText('Verification status')).toHaveLength(1)
  })

  it('still renders a Hybrid badge for a hybrid-flagged product after the ProductRow swap', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
  })

  it('expands ProductDetail when a dependency provider or dependent chip is clicked', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    const providerButton = screen.getByRole('button', { name: 'OpenSSL' })
    fireEvent.click(providerButton)
    expect(screen.getAllByText('Verification status')).toHaveLength(1)

    const dependentChip = screen.getByRole('button', { name: 'Consumer App Server' })
    fireEvent.click(dependentChip)
    // Only one entity's detail open per card — clicking the chip swaps it in.
    expect(screen.getAllByText('Verification status')).toHaveLength(1)
  })

  it('renames the Likelihood axis to Migration Gap with no leftover probability language', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    expect(screen.getByText('MIGRATION GAP')).toBeInTheDocument()
    expect(screen.queryByText('LIKELIHOOD')).not.toBeInTheDocument()
    expect(screen.queryByText(/Almost Certain/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Rare$/)).not.toBeInTheDocument()
  })

  it('computes Impact independently of pqcMigrationPriority for layers with the same Critical/High ratio', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    // Database and Cloud both have a 1/2 Critical-priority ratio, but
    // Database matches 1 threat and Cloud matches 3 — Impact must differ.
    const dbBadge = screen.getByTitle(/Migration Gap 3\/5 × Impact 2\/5/)
    const cloudBadge = screen.getByTitle(/Migration Gap 3\/5 × Impact 4\/5/)
    expect(dbBadge).toBeInTheDocument()
    expect(cloudBadge).toBeInTheDocument()
  })

  it('shows a fully-ready, zero-threat-match layer as "No risk" instead of a fabricated nonzero score', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    const osCard = screen.getByTestId('layer-card-OS')
    expect(within(osCard).getByTitle(/Migration Gap 0\/5 × Impact 0\/5/)).toHaveTextContent(
      'No risk'
    )
    // Named as its own chip in the "not plotted" strip, not silently dropped.
    const noRiskStrip = screen.getByTestId('no-risk-strip')
    expect(within(noRiskStrip).getByText(/not plotted above/i)).toBeInTheDocument()
    expect(within(noRiskStrip).getByText('Operating System')).toBeInTheDocument()
  })

  it('shows an explicit not-personalized state instead of silently reusing pqcMigrationPriority when no industry is selected', () => {
    mockData = baseData({ industry: '', industryThreats: [] })
    render(<SupplyChainRiskMatrix variant="flat" />)
    expect(screen.getByText(/Impact requires an industry\/country context/i)).toBeInTheDocument()
    // No grid table rendered in this state.
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // Gap-only badges shown per layer card instead of a fabricated risk score.
    expect(screen.getAllByText('Gap-only (no Impact yet)').length).toBeGreaterThan(0)
  })

  it('shows the CSWP.39 CBOM taxonomy disclaimer', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    expect(screen.getByText(/PQC Today's own simplified grouping/)).toBeInTheDocument()
  })

  it('shows the strengthened dependency-heuristic caveat', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    expect(
      screen.getByText(/detected by matching product names as a substring/i)
    ).toBeInTheDocument()
  })

  it('drill-down: clicking a populated grid cell does not throw', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    const table = screen.getByRole('table')
    const cell = within(table).getAllByRole('cell')[0]
    expect(() => fireEvent.click(cell)).not.toThrow()
  })
})
