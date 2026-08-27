// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  SupplyChainRiskMatrix,
  computeDomainStats,
  matrixRiskLevel,
  threatImpactLevel,
  IMPACT_BANDS,
  DOMAIN_THREAT_KEYWORDS,
} from './SupplyChainRiskMatrix'
import { DOMAINS, type DomainId } from '@/data/migrationAssets'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { ThreatData } from '@/data/threatsData'
import type { CveSnapshot } from '@/types/CveTypes'
import { MemoryRouter } from 'react-router'

const mockCpeMap = vi.hoisted(
  () =>
    new Map<
      string,
      {
        productId: string
        softwareName: string
        cpeUri: string
        cpeVendor: string
        cpeProduct: string
        matchConfidence: 'exact' | 'partial' | 'manual' | ''
        status: 'matched' | 'partial' | 'not_found'
        nvdUrl: string
        lastVerifiedDate: string
      }
    >()
)
const mockSnapshot = vi.hoisted(() => ({ value: null as CveSnapshot | null }))

vi.mock('@/data/cpeXrefData', () => ({
  cpeByProduct: mockCpeMap,
  cpeXrefs: [],
  cpeXrefMetadata: {},
}))

vi.mock('@/data/cveSnapshotData', () => ({
  loadCveSnapshot: () => Promise.resolve(mockSnapshot.value),
  __setCachedSnapshotForTests: () => {},
}))

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

// --- Fixture domains (domain taxonomy since 2026-08-27) ---
// atrest: 1/2 not PQC-ready (Migration Gap > 0), 1/2 Critical priority,
// 1 matching threat (keyword 'database').
const dbReady = makeProduct({ productId: 'db-1', softwareName: 'ReadyDB', pqcSupport: 'Yes' })
const dbGap = makeProduct({
  productId: 'db-2',
  softwareName: 'GapDB',
  pqcSupport: 'No',
  pqcMigrationPriority: 'Critical',
})

// kms: same 1/2 Critical-priority ratio as atrest, but 3 matching threats
// instead of 1 — proves Impact no longer tracks pqcMigrationPriority.
// Descriptions deliberately avoid platform keywords ('cloud' etc.) so the
// fully-ready platform fixture below keeps a genuine 0 Impact.
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

// platform: fully PQC-ready, no Critical priority, zero matching threats —
// both axes should be exactly 0 ("no risk", not floored to 1).
const osReady1 = makeProduct({ productId: 'os-1', softwareName: 'ReadyOS-A', pqcSupport: 'Yes' })
const osReady2 = makeProduct({ productId: 'os-2', softwareName: 'ReadyOS-B', pqcSupport: 'Yes' })

// foundations: dependency provider, referenced by name in a platform consumer.
const opensslProvider = makeProduct({
  productId: 'lib-1',
  softwareName: 'OpenSSL',
  pqcSupport: 'Yes',
})
const appServerConsumer = makeProduct({
  productId: 'app-1',
  softwareName: 'Consumer App Server',
  pqcSupport: 'Yes',
  pqcCapabilityDescription: 'Built on OpenSSL for termination',
})

const vendorsByDomain = new Map<DomainId, SoftwareItem[]>([
  ['atrest', [dbReady, dbGap]],
  ['kms', [cloudReady, cloudGap]],
  ['platform', [osReady1, osReady2, appServerConsumer]],
  ['foundations', [opensslProvider]],
])

const threats: ThreatData[] = [
  makeThreat({ threatId: 'T-DB-1', description: 'Attackers exploit weak Database records.' }),
  makeThreat({ threatId: 'T-KMS-1', description: 'KMS misconfiguration exposes keys.' }),
  makeThreat({ threatId: 'T-KMS-2', description: 'KMS tenant isolation failure.' }),
  makeThreat({ threatId: 'T-KMS-3', description: 'KMS privilege escalation.' }),
]

// Expected Impact levels, computed through the exported helpers so the test
// keeps working when the corpus-derived IMPACT_BANDS shift: 1 High threat
// (weight 3) for atrest, 3 High threats (weight 9) for kms.
const atrestImpact = threatImpactLevel(3)
const kmsImpact = threatImpactLevel(9)

function baseData(overrides: Partial<ExecutiveModuleData> = {}): ExecutiveModuleData {
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: 0,
    totalThreatCount: threats.length,
    industryThreats: threats,
    vendorsByLayer: new Map(),
    vendorsByDomain,
    fipsValidatedCount: 0,
    pqcReadyCount: 5,
    vendorReadinessWeighted: 0,
    vendorReadinessByLayer: new Map(),
    totalProducts: 8,
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
    mockCpeMap.clear()
    mockSnapshot.value = null
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

  it('computes Impact independently of pqcMigrationPriority for domains with the same Critical/High ratio', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    // atrest and kms both have a 1/2 Critical-priority ratio, but atrest
    // matches 1 threat and kms matches 3 — Impact must differ.
    expect(kmsImpact).toBeGreaterThan(atrestImpact)
    const dbBadge = screen.getByTitle(new RegExp(`Migration Gap 3/5 × Impact ${atrestImpact}/5`))
    const kmsBadge = screen.getByTitle(new RegExp(`Migration Gap 3/5 × Impact ${kmsImpact}/5`))
    expect(dbBadge).toBeInTheDocument()
    expect(kmsBadge).toBeInTheDocument()
  })

  it('shows a fully-ready, zero-threat-match domain as "No risk" instead of a fabricated nonzero score', () => {
    render(<SupplyChainRiskMatrix variant="flat" />)
    const platformCard = screen.getByTestId('layer-card-platform')
    expect(within(platformCard).getByTitle(/Migration Gap 0\/5 × Impact 0\/5/)).toHaveTextContent(
      'No risk'
    )
    // Named as its own chip in the "not plotted" strip, not silently dropped.
    const noRiskStrip = screen.getByTestId('no-risk-strip')
    expect(within(noRiskStrip).getByText(/not plotted above/i)).toBeInTheDocument()
    expect(within(noRiskStrip).getByText(DOMAINS.platform.label)).toBeInTheDocument()
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

  // Regression: migrate-process remediation Phase 5/6 (U6, harder half) — a
  // layer card's readiness stats had no visibility into known CVE exposure
  // at all, even though the same CPE xref + NVD snapshot join already powers
  // CryptoVulnerabilityWatch.tsx elsewhere in the app.
  describe('CVE exposure badge (U6)', () => {
    it('shows "None" before the snapshot has loaded and when no product in the layer has a CPE match', async () => {
      render(<SupplyChainRiskMatrix variant="flat" />)
      const dbCard = screen.getByTestId('layer-card-atrest')
      await waitFor(() => {
        expect(within(dbCard).getByText('Known CVEs')).toBeInTheDocument()
      })
      expect(within(dbCard).getByText('None')).toBeInTheDocument()
    })

    it('sums known CVEs across a layer’s matched products once the snapshot resolves', async () => {
      const cpeUri = 'cpe:2.3:a:acme:gapdb:1.0:*:*:*:*:*:*:*'
      mockCpeMap.set('GapDB', {
        productId: 'db-2',
        softwareName: 'GapDB',
        cpeUri,
        cpeVendor: 'acme',
        cpeProduct: 'gapdb',
        matchConfidence: 'exact',
        status: 'matched',
        nvdUrl: '',
        lastVerifiedDate: '',
      })
      mockSnapshot.value = {
        generatedAt: '2026-07-16T00:00:00Z',
        sourceCsv: 'migrate_cpe_xref_07162026.csv',
        byCpe: {
          [cpeUri]: [
            {
              cveId: 'CVE-2026-0001',
              summary: 'Test CVE',
              severity: 'HIGH',
              cvssScore: 7.5,
              published: '2026-01-01',
              lastModified: '2026-01-01',
              refUrl: '',
            },
            {
              cveId: 'CVE-2026-0002',
              summary: 'Test CVE 2',
              severity: 'MEDIUM',
              cvssScore: 5.5,
              published: '2026-02-01',
              lastModified: '2026-02-01',
              refUrl: '',
            },
          ],
        },
      }
      render(<SupplyChainRiskMatrix variant="flat" />)
      const dbCard = screen.getByTestId('layer-card-atrest')
      await waitFor(() => {
        expect(within(dbCard).getByText('2')).toBeInTheDocument()
      })
      // The ready product in the same layer has no CPE match, so the count
      // is exactly GapDB's 2 CVEs, not inflated by an unmatched sibling.
      expect(within(dbCard).queryByText('None')).not.toBeInTheDocument()
    })

    it('does not count CVEs for a product whose CPE xref status is not_found', async () => {
      const cpeUri = 'cpe:2.3:a:acme:gapdb:1.0:*:*:*:*:*:*:*'
      mockCpeMap.set('GapDB', {
        productId: 'db-2',
        softwareName: 'GapDB',
        cpeUri,
        cpeVendor: 'acme',
        cpeProduct: 'gapdb',
        matchConfidence: '',
        status: 'not_found',
        nvdUrl: '',
        lastVerifiedDate: '',
      })
      mockSnapshot.value = {
        generatedAt: '2026-07-16T00:00:00Z',
        sourceCsv: 'migrate_cpe_xref_07162026.csv',
        byCpe: {
          [cpeUri]: [
            {
              cveId: 'CVE-2026-0001',
              summary: 'Test CVE',
              severity: 'HIGH',
              cvssScore: 7.5,
              published: '2026-01-01',
              lastModified: '2026-01-01',
              refUrl: '',
            },
          ],
        },
      }
      render(<SupplyChainRiskMatrix variant="flat" />)
      const dbCard = screen.getByTestId('layer-card-atrest')
      await waitFor(() => {
        expect(within(dbCard).getByText('Known CVEs')).toBeInTheDocument()
      })
      expect(within(dbCard).getByText('None')).toBeInTheDocument()
    })
  })
})

// ── W1-4 regression guards (audit 2026-08-10) ────────────────────────────────
// Impact used to be `threatMatches / totalThreatMatches` — a share of the
// displayed estate. On the canonical grouping that pinned every group to
// impact 1 and the whole matrix to "Low", and adding a group silently
// downgraded every other one.
describe('computeDomainStats — absolute impact (W1-4)', () => {
  const ALL_DOMAINS = Object.keys(DOMAINS) as DomainId[]
  const gapProduct = (id: string) =>
    makeProduct({ productId: id, softwareName: id, pqcSupport: 'No' })

  // Threats built from each domain's own first matching keyword, at whatever
  // count pushes the severity-weighted score past the top corpus-derived
  // band — so every domain lands at Impact 5 regardless of where the bands
  // currently sit.
  const level5Count = Math.ceil((IMPACT_BANDS[3] + 1) / 4)
  const criticalThreats = (n: number, term: string) =>
    Array.from({ length: n }, (_, i) =>
      makeThreat({
        threatId: `T-${i}`,
        description: `${term} compromise scenario ${i}`,
        criticality: 'Critical',
      })
    )

  it('an estate where EVERY domain is heavily threatened reads Critical, not Low', () => {
    // This is the shape that broke: threats spread across all domains gave
    // each a small share, so every domain scored impact 1 and the whole
    // matrix capped at "Low" — the more thoroughly exposed the estate, the
    // safer it looked. A single-hot-domain fixture would NOT catch it.
    const byDomain = new Map<DomainId, SoftwareItem[]>(
      ALL_DOMAINS.map((d) => [d, [gapProduct(`${d}-a`)]])
    )
    const threats = ALL_DOMAINS.flatMap((d) =>
      criticalThreats(level5Count, DOMAIN_THREAT_KEYWORDS[d][0])
    )
    const stats = computeDomainStats(byDomain, threats, true, null)

    expect(stats.length).toBe(ALL_DOMAINS.length)
    for (const s of stats) {
      expect(s.likelihood, `${s.domainId} likelihood`).toBe(5) // every product has a gap
      expect(s.impact, `${s.domainId} impact`).toBe(5)
      expect(matrixRiskLevel(s.riskScore ?? 0), `${s.domainId} verdict`).toBe('Critical')
    }
  })

  it("a domain's impact does not change when unrelated domains are added or removed", () => {
    const threats = criticalThreats(6, 'database')
    const small = new Map<DomainId, SoftwareItem[]>([['atrest', [gapProduct('db-a')]]])
    const large = new Map<DomainId, SoftwareItem[]>(
      ALL_DOMAINS.map((d) => [d, [gapProduct(`${d}-a`)]])
    )
    const dbSmall = computeDomainStats(small, threats, true, null).find(
      (s) => s.domainId === 'atrest'
    )
    const dbLarge = computeDomainStats(large, threats, true, null).find(
      (s) => s.domainId === 'atrest'
    )
    expect(dbLarge!.impact).toBe(dbSmall!.impact)
    expect(dbLarge!.riskScore).toBe(dbSmall!.riskScore)
  })

  it('weights impact by threat severity, not raw match count', () => {
    // level5Count Critical threats clear the top band by construction, while
    // the same COUNT of Low threats scores a quarter of that — below the top
    // band — so the two impacts must differ whatever the derived bands are.
    const byDomain = new Map<DomainId, SoftwareItem[]>([['atrest', [gapProduct('db-a')]]])
    const critical = computeDomainStats(
      byDomain,
      criticalThreats(level5Count, 'database'),
      true,
      null
    )
    const low = computeDomainStats(
      byDomain,
      Array.from({ length: level5Count }, (_, i) =>
        makeThreat({
          threatId: `T-low-${i}`,
          description: `database issue ${i}`,
          criticality: 'Low',
        })
      ),
      true,
      null
    )
    expect(critical[0].threatMatches).toBe(low[0].threatMatches) // same count
    expect(critical[0].impact!).toBeGreaterThan(low[0].impact!) // different severity
  })

  it('still refuses to score impact with no industry context', () => {
    const byDomain = new Map<DomainId, SoftwareItem[]>([['atrest', [gapProduct('db-a')]]])
    const stats = computeDomainStats(byDomain, criticalThreats(6, 'database'), false, null)
    expect(stats[0].impact).toBeNull()
    expect(stats[0].riskScore).toBeNull()
  })
})

/**
 * Render-budget guard for the unselected state.
 *
 * The 2026-08-11 re-audit found this tool rendering 448,555 characters and
 * 15,343 DOM nodes — a ~19-second first paint against 0.8s for the ROI
 * Calculator — because with nothing selected it listed all 912 catalog
 * products, each with icons. Every existing test missed it, and would still
 * miss it, because they all mount fixture-sized layers of 1-2 products. The
 * defect only exists at catalog scale.
 *
 * This pins the rule directly: past UNSELECTED_LAYER_ROW_CAP products in a
 * layer, an unselected view shows a count and a Migrate link instead of a row
 * each. Small layers keep rendering rows, which is what the tests above rely
 * on and what a user with a real selection should see.
 */
describe('SupplyChainRiskMatrix render budget', () => {
  beforeEach(() => {
    const many = Array.from({ length: 60 }, (_, i) =>
      makeProduct({ productId: `bulk-${i}`, softwareName: `BulkProduct${i}`, pqcSupport: 'No' })
    )
    mockData = baseData({
      vendorsByDomain: new Map<DomainId, SoftwareItem[]>([['atrest', many]]),
      totalProducts: many.length,
    })
  })

  it('does not list every product of a large layer when nothing is selected', () => {
    // MemoryRouter: this is the only path in the file that renders a <Link>,
    // which is why the 13 tests above never needed one.
    render(
      <MemoryRouter>
        <SupplyChainRiskMatrix variant="flat" />
      </MemoryRouter>
    )
    // The 60th product must not be on screen...
    expect(screen.queryByText('BulkProduct59')).not.toBeInTheDocument()
    // ...and the user must be told why, with a way forward.
    expect(screen.getByText(/Pick your infrastructure on Migrate/i)).toBeInTheDocument()
  })

  it('still names the domain and its product count', () => {
    render(
      <MemoryRouter>
        <SupplyChainRiskMatrix variant="flat" />
      </MemoryRouter>
    )
    expect(screen.getByText(/60 catalog products sit in this domain/i)).toBeInTheDocument()
  })
})
