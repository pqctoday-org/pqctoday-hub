// SPDX-License-Identifier: GPL-3.0-only
/**
 * Real-tool demo generators — sector-flavored SAMPLE INPUTS fed into each
 * tool's own `buildMarkdown()`, so the simulation's fast-forward path renders
 * exactly what the real tool would produce instead of a hand-typed lookalike
 * in `demoDocs.ts`. A fix to a tool's logic (a citation, a formula, a default)
 * shows up here automatically — there is nothing else to keep in sync.
 *
 * Only the sample inputs are authored here; the document-building logic is
 * imported from each tool, not re-implemented.
 */
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { ORG, CUR, REG, type DemoDoc, type DemoSector } from './demoDocs'
import {
  deriveRoiDoc,
  deriveBreachDoc,
  deriveInactionDoc,
  deriveBoardDeck,
  deriveExplorerDoc,
} from './derivedFinancialDocs'
import {
  buildMarkdown as buildProgramCharter,
  STEERCO_ROLE_IDS,
  WORKSTREAMS,
  type CharterState,
} from '@/components/BusinessCenter/tools/ProgramCharter'
import {
  buildMarkdown as buildInitialScoping,
  type ScopingState,
} from '@/components/BusinessCenter/tools/InitialScopingAssessment'
import {
  buildMarkdown as buildSkillsTeamPlan,
  ROLE_ORDER,
  type PlanState,
} from '@/components/BusinessCenter/tools/SkillsTeamPlan'
import {
  buildMarkdown as buildInfraModernizationPlan,
  PROTOCOL_OPTIONS,
  type InfraModernizationState,
} from '@/components/BusinessCenter/tools/InfraModernizationPlanner'
import {
  buildMarkdown as buildRefreshCycleAlignment,
  SEED_PROGRAM_NAMES,
  type RefreshState,
} from '@/components/BusinessCenter/tools/RefreshCycleAlignment'
import {
  buildMarkdown as buildAcceleratedExecutionProfile,
  type ProfileState,
} from '@/components/BusinessCenter/tools/AcceleratedExecutionProfile'
import {
  buildMarkdown as buildDataAtRestStrategy,
  type DataAtRestState,
} from '@/components/BusinessCenter/tools/DataAtRestStrategy'
import type { FrameworkRoleId } from '@/data/roleCrosswalk'
import { HSM_VENDORS } from '@/components/PKILearning/modules/HsmPqc/data/hsmVendorData'
import {
  renderContractPreview,
  CONTRACT_DEMO_FILL,
} from '@/components/PKILearning/modules/VendorRisk/components/ContractClauseGenerator'
import {
  DIMENSIONS as SCORECARD_DIMENSIONS,
  resolveProductNames,
  computeVendorScorecards,
  buildScorecardMarkdown,
  type ScorecardDimensionRow,
} from '@/components/PKILearning/modules/VendorRisk/components/VendorScorecardBuilder'
import {
  computeDomainStats,
  computeMatrixEntries,
  computeNoRiskDomains,
  buildDependencyRelations,
  buildSupplyChainMarkdown,
  mapToAssetClass,
  type CSWP39AssetClass,
} from '@/components/PKILearning/modules/VendorRisk/components/SupplyChainRiskMatrix'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { classifyProductDomain, type DomainId } from '@/data/migrationAssets'
import { matchesIndustry } from '@/data/industryMatch'
import { threatsData } from '@/data/threatsData'
import { isPqcReady, isFips1403Validated } from '@/data/kpiCatalog'
import {
  buildMarkdown as buildMigrationVerification,
  type VerifyState,
} from '@/components/BusinessCenter/tools/MigrationVerification'
import {
  buildKpiTrackerMarkdown,
  type KpiTrackerMarkdownInput,
} from '@/components/PKILearning/modules/MigrationProgram/components/KPITrackerTemplate'
import { buildDimensions } from '@/data/kpiCatalog'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import {
  ALL_ITEMS as AUDIT_CHECKLIST_ITEMS,
  renderAuditPreview,
  renderExceptionsAndEvidenceMd,
} from '@/components/PKILearning/modules/ComplianceStrategy/components/AuditReadinessChecklist'
import { renderCryptoApiMarkdown } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/CryptoApiRefactorAudit'
import { softwareData } from '@/data/migrateData'
import { buildRiskRegisterMarkdown } from '@/components/PKILearning/modules/PQCRiskManagement/components/RiskRegisterBuilder'
import { buildCrqcScenarioMarkdown } from '@/components/PKILearning/modules/PQCRiskManagement/components/CRQCScenarioPlanner'
import {
  buildRaciMarkdown,
  buildSeededMatrix,
} from '@/components/PKILearning/modules/PQCGovernance/components/RACIBuilder'
import { renderPolicyPreview } from '@/components/PKILearning/modules/PQCGovernance/components/PolicyTemplateGenerator'
import { renderCommsPreview } from '@/components/PKILearning/modules/MigrationProgram/components/StakeholderCommsPlanner'
import {
  DEPLOYMENT_PLAYBOOK_TITLE,
  DEPLOYMENT_PLAYBOOK_DESCRIPTION,
  DEPLOYMENT_PLAYBOOK_SECTIONS,
} from '@/components/PKILearning/modules/MigrationProgram/components/DeploymentPlaybook'
import { buildChecklistMarkdown } from '@/components/PKILearning/common/OpsChecklist'
import { renderMTIMarkdown } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/MTINegotiator'
import { renderHybridTransitionMarkdown } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/HybridTransitionPlanner'
import { renderCloudMatrixMarkdown } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/CloudResponsibilityMatrix'
import { DEFAULT_RISK_ENTRIES } from '@/store/useRiskRegisterStore'
import { buildKpiDashboardMarkdown } from '@/components/PKILearning/modules/PQCGovernance/components/KPIDashboardBuilder'
import {
  buildRoadmapMarkdown,
  DEFAULT_MILESTONES as ROADMAP_DEFAULT_MILESTONES,
} from '@/components/PKILearning/modules/MigrationProgram/components/RoadmapBuilder'
import { TIMELINE_COUNTRY_DEADLINE_YEAR } from '@/data/timelineFacts.generated'
import { CRQC_BAND_STANDARD } from '@/data/narrationFacts'

/**
 * Thales Luna is the fleet vendor for this demo org. Derived from `HSM_VENDORS`
 * (itself catalog-derived, see that module's header) rather than re-typed here,
 * so a firmware/support update in the single source of truth doesn't leave this
 * sample input stating a stale fact.
 */
const THALES_LUNA_VENDOR = HSM_VENDORS.find((v) => v.id === 'thales-luna')
const thalesLunaInventoryLine = (): string => {
  const v = THALES_LUNA_VENDOR
  if (!v) return 'Thales Luna Network HSM 7; 4 units across 2 data centers'
  return `${v.product} — full PQC support in firmware ${v.firmwareVersion} (${v.supportedPQCAlgorithms.join(', ')}); 4 units across 2 data centers`
}

const ALL_ROLE_IDS: FrameworkRoleId[] = [
  'qrpm',
  'exec-sponsor',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]

/** "$1.8M" style figure scaled by a sector cost multiplier and stamped with
 *  the sector's own currency symbol, so demo budgets read as sector-plausible
 *  without hand-authoring one string per sector per tool. */
function budget(sector: DemoSector, baseMillions: number): string {
  const scale: Record<DemoSector, number> = {
    financial: 1.3,
    healthcare: 0.9,
    government: 1.6,
    energy: 1.1,
    telecom: 1.4,
    retail: 0.8,
    general: 1,
  }
  const value = Math.round(baseMillions * scale[sector] * 10) / 10
  return `${CUR[sector]}${value}M`
}

function programCharterState(sector: DemoSector): CharterState {
  const sponsorTitle =
    sector === 'government'
      ? 'Chief Information Officer'
      : sector === 'energy'
        ? 'Chief Technology Officer'
        : 'Chief Information Security Officer'
  return {
    programName: 'Post-Quantum Cryptography Migration Program',
    purpose:
      'Migrate the enterprise to NIST-standardized post-quantum cryptography ahead of mandate deadlines — protecting harvest-now-decrypt-later data and long-lived trust anchors — and establish durable crypto-agility.',
    scopeInclude:
      'Internet-exposed key exchange (TLS, VPN), >10-year secrecy data, and signature/PKI trust anchors across Tier-1 systems (Two-Track: HNDL + TNFL).',
    scopeExclude:
      'Systems past their confidentiality horizon or slated for retirement — crypto-shred / decommission rather than migrate.',
    sponsorName: sponsorTitle,
    sponsorTitle,
    qrpmName: 'Head of Cryptographic Engineering',
    cadencePmo: 'Weekly',
    cadenceSteerCo: 'Monthly',
    cadenceBoard: 'Quarterly',
    budgetYear1: `${budget(sector, 1.8)} — discovery, tooling, 2–3 hybrid pilots, training`,
    budgetMultiYear: 'Phased multi-year program aligned to infrastructure refresh cycles',
    budgetHorizonYears: '3',
    steerCo: Object.fromEntries(
      ALL_ROLE_IDS.map((id) => [id, STEERCO_ROLE_IDS.includes(id)])
    ) as Record<FrameworkRoleId, boolean>,
    signOffDate: '_(pending board approval)_',
    workstreams: Object.fromEntries(WORKSTREAMS.map((w, i) => [w.id, i < 3])) as Record<
      string,
      boolean
    >,
    successCriteria:
      'Phase-0 gate passed; board KPI pack baselined (Coverage, Trust, Inventory, Vendors, Agility) with Year-1 targets; CBOM v1 at ≥70% Tier-1 coverage; two hybrid pilots (TLS, VPN) live.',
    riskAppetiteStatement:
      'HNDL: ≤20% of >10-year secrecy data quantum-vulnerable by end of 2027, 0% by end of 2029. ' +
      'TNFL: all production software/firmware signing on NIST-approved quantum-resistant ' +
      'signatures by end of 2027.',
    escalationTriggers:
      'Escalate to SteerCo/Board on: a material change in CRQC timeline estimates; the program running >6 months behind the regulatory buffer; a confirmed vulnerability in a deployed PQC algorithm; a Tier-1 vendor abandoning PQC without an alternative.',
  }
}

function initialScopingState(sector: DemoSector): { state: ScopingState; industry: string } {
  return {
    state: {
      systems: [
        {
          name: 'Customer-facing TLS gateway',
          priority: 'A',
          ownership: 'Vendor',
          notes: 'External TLS; RSA-2048 / ECDHE',
        },
        {
          name: 'Core transaction database',
          priority: 'B',
          ownership: 'Internal',
          notes: 'Long-lived secrecy data (>10yr)',
        },
        {
          name: 'Identity & access management',
          priority: 'A',
          ownership: 'Vendor',
          notes: 'Trust anchor; ECDSA P-256',
        },
      ],
      vendors: ['OpenSSL', 'Microsoft', 'F5'],
      estateInstances: '2400',
      estate: {
        tlsEndpoints: '1200',
        certificates: '800',
        vpnTunnels: '150',
        hsmKeys: '200',
        codeSigningPipelines: '50',
      },
      seeded: false,
    },
    industry: ORG[sector],
  }
}

function skillsTeamPlanState(sector: DemoSector): PlanState {
  const sourcing = Object.fromEntries(ALL_ROLE_IDS.map((id) => [id, 'build'])) as Record<
    FrameworkRoleId,
    'build' | 'borrow' | 'buy'
  >
  sourcing['security-eng'] = 'borrow'
  sourcing['ot-specialist'] = 'borrow'
  void sector
  void ROLE_ORDER
  return {
    estateInstances: '2400',
    sizingPhase: 'early',
    sourcing,
  }
}

function infraModernizationPlanState(sector: DemoSector): InfraModernizationState {
  return {
    rootCaYears: '10',
    intermediateCaYears: '5',
    endEntityDays: '90',
    dualStackCa: true,
    trackingMtc: sector === 'telecom' || sector === 'financial',
    hsmInventory: thalesLunaInventoryLine(),
    firmwareUpgradeScheduled: true,
    hardwareReplacementPlanned: false,
    cloudKmsConfigured: sector !== 'government',
    protocols: Object.fromEntries(PROTOCOL_OPTIONS.map((p) => [p, p !== 'QUIC'])) as Record<
      (typeof PROTOCOL_OPTIONS)[number],
      boolean
    >,
    cpuImpactPct: '15',
    bandwidthImpact: 'Negligible (<2%) for TLS; +5-10% for IPsec under load',
    certStorageMultiplier: '2.5',
  }
}

function refreshCycleAlignmentState(sector: DemoSector): {
  state: RefreshState
  horizonEndYear: number
} {
  void sector
  const thisYear = new Date().getFullYear()
  const years = [thisYear + 1, thisYear + 2, thisYear + 1, thisYear + 3, thisYear + 2]
  return {
    state: {
      planningHorizonYears: '4',
      rows: SEED_PROGRAM_NAMES.slice(0, 5).map((name, i) => ({
        id: `demo-${i}`,
        programName: name,
        nextRefreshYear: String(years[i % years.length]),
        pqcTaskToEmbed: 'Include hybrid PQC support in the refresh RFP/spec',
      })),
    },
    horizonEndYear: thisYear + 4,
  }
}

function acceleratedExecutionProfileState(sector: DemoSector): ProfileState {
  void sector
  return {
    triggers: {
      'CRQC milestone announced': true,
      'Regulatory deadline pulled forward': true,
      'Cryptanalytic event against a deployed algorithm': false,
      'Active HNDL campaign detected': true,
      'Vendor critical-path slip': false,
    },
    otherTrigger: '',
    compressedSequence:
      'Collapse Phases 4–6: run discovery, risk scoring and Tier-1 pilots in parallel; ' +
      'pre-approve hybrid (X25519+ML-KEM-768) for all internet-facing TLS; defer long-tail / OT ' +
      'to a contained track.',
    riskAcceptances:
      'Pre-approved: temporary classical fallback for non-Tier-1 systems during transition; ' +
      'vendor roadmap commitments accepted for up to two quarters; residual risk re-reviewed quarterly.',
    resourceRequest:
      'Emergency budget uplift (~30% of Year 1) for surge cryptographic-engineering contractors ' +
      'and expedited HSM firmware procurement.',
    activationAuthority: 'Executive Sponsor (CISO), on SteerCo recommendation.',
  }
}

function dataAtRestStrategyState(sector: DemoSector): DataAtRestState {
  const primary = sector === 'healthcare' ? 'Patient records database' : 'Customer PII database'
  return {
    stores: [
      {
        id: 'demo-1',
        name: primary,
        strategy: 'Re-encrypt with fresh AES-256 DEK (PQC-wrapped KEK)',
        sensitivity: 'High',
        note: `Subject to ${REG[sector]}`,
      },
      {
        id: 'demo-2',
        name: 'Backups & archives',
        strategy: 'Re-wrap existing DEK under PQC KEK',
        sensitivity: 'High',
        note: '',
      },
      {
        id: 'demo-3',
        name: 'Document store',
        strategy: 'Re-wrap existing DEK under PQC KEK',
        sensitivity: 'Medium',
        note: '',
      },
      {
        id: 'demo-4',
        name: 'Analytics warehouse',
        strategy: 'Accept & monitor',
        sensitivity: 'Low',
        note: '',
      },
    ],
  }
}

/**
 * Sample vendor scorecard (Wave 5, WP5.3) — two REAL, verified catalog
 * products from distinct vendors (AWS-LC / Amazon Web Services, Bouncy Castle
 * Java / Legion of the Bouncy Castle Inc.), both real "Yes... FIPS 140-3"
 * rows in pqc_product_catalog — not fabricated vendor names. Auto-detected
 * dimensions run the SAME `Dimension.autoDetect` predicates the live tool
 * uses; the three dimensions with no auto-detect (roadmap/agility/SBOM-CBOM)
 * get a plausible manual read since no catalog field encodes them.
 */
function vendorScorecardSample() {
  const items = resolveProductNames(['aws-lc', 'bouncy-castle-java'])
  const checkedProducts: Record<string, Set<string>> = {}
  for (const d of SCORECARD_DIMENSIONS) {
    if (d.autoDetect) {
      checkedProducts[d.id] = new Set(items.filter((i) => d.autoDetect!(i)).map((i) => i.productId))
    } else {
      // Manual dimensions: both vendors have public roadmaps and SBOM/CBOM delivery;
      // only one (AWS-LC) is documented as supporting runtime algorithm swapping.
      checkedProducts[d.id] =
        d.id === 'crypto-agility' ? new Set(['aws-lc']) : new Set(items.map((i) => i.productId))
    }
  }
  const weightOf = (dimId: string) => SCORECARD_DIMENSIONS.find((d) => d.id === dimId)?.weight ?? 0
  const rows = computeVendorScorecards(items, checkedProducts, weightOf, {
    useSlider: {},
    sliderScores: {},
  })
  const totalProducts = rows.reduce((sum, r) => sum + r.productCount, 0)
  const portfolioAverage =
    totalProducts > 0
      ? Math.round(rows.reduce((sum, r) => sum + r.overall * r.productCount, 0) / totalProducts)
      : 0
  const dimensionRows: ScorecardDimensionRow[] = SCORECARD_DIMENSIONS.map((d) => {
    const checked = checkedProducts[d.id]?.size ?? 0
    return {
      id: d.id,
      label: d.label,
      score: items.length > 0 ? Math.round((checked / items.length) * 100) : 0,
      weightPct: Math.round(d.weight * 100),
      method: `${checked}/${items.length} products`,
    }
  })
  return { rows, portfolioAverage, dimensionRows, productCount: items.length }
}

/**
 * Sample supply-chain risk matrix (Wave 5, WP5.3) — 3 real, verified catalog
 * products spanning 3 distinct migration domains with mixed PQC status
 * (aws-lc/foundations: available; Entrust nShield/hsm: available —
 * also the ArchitecturePanel mid-size node and compliance-cert-check's A7285
 * cert, for continuity across the tour; Microsoft Entra ID/identity:
 * roadmap — so the matrix shows a real migration gap, not an all-green
 * demo). Industry threats are joined through matchesIndustry (the sector-key
 * join the live hook uses since 2026-08-27), so 'Financial Services /
 * Banking' and the assessment-side 'Finance & Banking' resolve to the same
 * sector and Impact is computed from real threatsData either way.
 *
 * `vendorsByDomain` is built here with the same classifyProductDomain
 * grouping useExecutiveModuleData uses — that hook itself is a wide,
 * cross-page aggregator (assessment + compliance + timeline + more) not
 * worth pulling into a synchronous sample-doc generator; this reproduces
 * only the few lines of domain-grouping it shares with the matrix, not the
 * rest of the hook.
 */
function supplyChainMatrixSample() {
  const industry = 'Financial Services / Banking'
  const items = resolveProductNames(['aws-lc', 'entrust-nshield', 'microsoft-entra-id'])

  const vendorsByDomain = new Map<DomainId, SoftwareItem[]>()
  for (const item of items) {
    const domain = classifyProductDomain(item.categoryName, item.infrastructureLayer)
    if (!domain) continue
    const existing = vendorsByDomain.get(domain)
    if (existing) existing.push(item)
    else vendorsByDomain.set(domain, [item])
  }

  const industryThreats = threatsData.filter((t) => matchesIndustry(t.industry, industry))

  const domainStats = computeDomainStats(vendorsByDomain, industryThreats, true, null)
  const matrixEntries = computeMatrixEntries(domainStats)
  const noRiskDomains = computeNoRiskDomains(domainStats)

  const dependencyRelations = buildDependencyRelations(
    [
      ...(vendorsByDomain.get('foundations') ?? []),
      ...(vendorsByDomain.get('hardware') ?? []),
      ...(vendorsByDomain.get('hsm') ?? []),
    ],
    items
  )

  const cbomBuckets: Record<CSWP39AssetClass, SoftwareItem[]> = {
    Code: [],
    Library: [],
    Application: [],
    File: [],
    Protocol: [],
    System: [],
  }
  for (const item of items) cbomBuckets[mapToAssetClass(item)].push(item)

  const totalProducts = items.length
  const pqcReadyCount = items.filter((i) => isPqcReady(i.pqcSupport)).length
  const fipsValidatedCount = items.filter((i) => isFips1403Validated(i.fipsValidated)).length

  return buildSupplyChainMarkdown({
    industry,
    country: 'United States',
    totalProducts,
    overallPqcPct: totalProducts > 0 ? Math.round((pqcReadyCount / totalProducts) * 100) : 0,
    pqcReadyCount,
    overallFipsPct: totalProducts > 0 ? Math.round((fipsValidatedCount / totalProducts) * 100) : 0,
    fipsValidatedCount,
    domainStats,
    matrixEntries,
    noRiskDomains,
    hasIndustryContext: true,
    industryContextHint: 'Step 1',
    dependencyRelations,
    cbomBuckets,
    pipelineSources: '',
    refreshCadence: '',
    cmdbMapping: '',
  })
}

/** Sector-flavored sample input for the real MigrationVerification tool
 *  (H2 round 2, 07192026 — first conversion of the demoDocs-shrink wave).
 *  Shows a program at the closure gate: both Tier-1 systems fully verified
 *  against the 5-point evidence standard, the legacy signing key retired AND
 *  confirmed (an unconfirmed one is a standing TNFL liability — the tool's
 *  own isTnflLiability logic renders that warning), closure signed off,
 *  BAU owners named. */
function migrationVerificationState(sector: DemoSector): VerifyState {
  const orgLabel = ORG[sector]
  const primarySystem =
    sector === 'healthcare'
      ? 'Patient-portal TLS (edge)'
      : sector === 'financial'
        ? 'Payment-gateway TLS (edge)'
        : 'Public web TLS (edge)'
  return {
    records: [
      {
        id: 'mv-demo-1',
        system: primarySystem,
        evidence: {
          observedNegotiation: 'pcap 04-12: X25519MLKEM768 negotiated on prod edge',
          negativeTest: 'classical-only client correctly refused (policy: no downgrade)',
          certChainUnderPqc: 'chain re-issued, validated under hybrid trust anchors',
          downgradeDocumented: 'fallback matrix v1.2 filed; break-glass path documented',
          dossierLink: 'evidence/tls-edge/2026-Q2/',
        },
      },
      {
        id: 'mv-demo-2',
        system: 'Internal mTLS service mesh',
        evidence: {
          observedNegotiation: 'mesh telemetry: 100% of handshakes on ML-KEM-768 (7 days)',
          negativeTest: 'legacy sidecar image rejected at admission controller',
          certChainUnderPqc: 'SPIFFE chain rotated to ML-DSA-65 intermediates',
          downgradeDocumented: 'rollback runbook RB-114 (tested in staging)',
          dossierLink: 'evidence/mesh/2026-Q2/',
        },
      },
    ],
    decommissions: [
      {
        id: 'mv-demo-3',
        material: 'Legacy root CA signing key (RSA-4096)',
        kind: 'signing-key',
        retiredDate: '2026-05-30',
        owner: `PKI team (${orgLabel})`,
        // Deliberately NOT "SP 800-88 purge" (the tool's seed vocabulary):
        // 800-88 is media-sanitization guidance, not a key-destruction
        // standard (see the tool's own header comment + the provenance
        // guard), and a witnessed HSM zeroization is the actually-correct
        // practice for a root signing key.
        method: 'Witnessed HSM zeroization ceremony (logged)',
        confirmed: true,
      },
    ],
    closure: {
      decision: 'Program closed; posture management transitions to BAU',
      signOffBy: 'Executive Sponsor (CISO)',
      signOffDate: '2026-06-15',
      bauOwners: {
        Discovery: 'Security Engineering',
        CBOM: 'Platform Engineering',
        Risk: 'GRC',
        'Vendor governance': 'Procurement + GRC',
      },
    },
  }
}

/** Demo ExecutiveModuleData for the KPI tracker sample (Batch 1, 07192026).
 *  Aggregates derived from REAL data (full catalog + real threats), exactly
 *  the way useExecutiveModuleData computes them — so the auto-scored KPI rows
 *  in the sample carry live numbers that move when the catalog moves.
 *  Assessment-dependent fields are honestly empty (no fake assessment): the
 *  rows they gate render as the tool's real "locked — no data" state, and the
 *  sample supplies manual scores for the rest, an exemplary mid-flight fill. */
function demoKpiExecData(sector: DemoSector): ExecutiveModuleData {
  const industry = sector === 'financial' ? 'Financial Services / Banking' : 'Healthcare'
  const industryThreats = threatsData.filter((t) => t.industry === industry)
  const pqcReadyCount = softwareData.filter((i) => isPqcReady(i.pqcSupport)).length
  const fipsValidatedCount = softwareData.filter((i) => isFips1403Validated(i.fipsValidated)).length
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: threatsData.filter((t) => t.criticality === 'Critical').length,
    totalThreatCount: threatsData.length,
    industryThreats,
    vendorsByDomain: new Map(),
    fipsValidatedCount,
    pqcReadyCount,
    vendorReadinessWeighted: softwareData.length > 0 ? pqcReadyCount / softwareData.length : 0,
    vendorReadinessByDomain: new Map(),
    totalProducts: softwareData.length,
    frameworks: [],
    frameworksByIndustry: [],
    countryDeadlines: [],
    userCountryData: null,
    assessmentResult: null,
    riskScore: null,
    industry,
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
    migrationStartYear: 2026,
  }
}

function kpiTrackerSample(sector: DemoSector): KpiTrackerMarkdownInput {
  const dimensions = buildDimensions('executive', 'migration', demoKpiExecData(sector), null)
  // Manual scores for the non-auto dimensions — a believable mid-flight fill,
  // touched so the tool's own "not yet scored" logic treats them as real input.
  const userScores: Record<string, number> = {}
  const touchedIds = new Set<string>()
  const MANUAL_FILL: Record<string, number> = {}
  let seed = 0
  for (const d of dimensions) {
    if (d.disabled) continue
    if (d.autoScore === null || d.autoScore === undefined || d.notYetScored) {
      // Deterministic spread (55/65/75 cycling) — varied but reproducible.
      MANUAL_FILL[d.id] = 55 + (seed++ % 3) * 10
    }
  }
  for (const [id, score] of Object.entries(MANUAL_FILL)) {
    userScores[id] = score
    touchedIds.add(id)
  }
  return {
    dimensions,
    activePersona: 'executive',
    riskHistory: [],
    userScores,
    userWeights: {},
    touchedIds,
  }
}

/** Audit-readiness sample: checked items derived from the REAL checklist item
 *  lists (an item rename/addition upstream propagates here), filled to an
 *  "Established"-tier mid-flight state — strong on inventory/policy (the
 *  early-phase work), partial on technical/vendor, thin on evidence (the
 *  closing-phase work). */
function auditChecklistSample(): string {
  const take = (sectionId: string, n: number): string[] =>
    (AUDIT_CHECKLIST_ITEMS[sectionId] ?? []).slice(0, n).map((i) => i.value)
  const data: Record<string, Record<string, string | string[]>> = {
    'crypto-inventory': { items: take('crypto-inventory', 5) },
    'policy-governance': { items: take('policy-governance', 4) },
    'risk-assessment': { items: take('risk-assessment', 3) },
    'technical-controls': { items: take('technical-controls', 2) },
    'vendor-management': { items: take('vendor-management', 2) },
    'evidence-documentation': { items: take('evidence-documentation', 1) },
  }
  return (
    renderAuditPreview(data, 'Healthcare', 'Germany') +
    renderExceptionsAndEvidenceMd(
      [
        {
          scope: 'Legacy MRI fleet (vendor-locked firmware, RSA-2048)',
          compensatingControl: 'Network segmentation + monitored TLS gateway in front',
          owner: 'Clinical Engineering',
          sunset: '2029 hardware refresh',
        },
      ],
      [
        {
          productOrAsset: 'Edge TLS termination',
          cmvpCertNumber: 'pending — module on the CMVP MIP list',
          acvpRunId: 'ACVP-demo-2026-Q2',
          esvStatus: 'n/a',
          cveScanDate: '2026-06-01',
        },
      ]
    )
  )
}

/** Crypto-API refactor sample: a Java/BouncyCastle service — the classic
 *  enterprise shape — mid-size call-site count, partially hardcoded today,
 *  target ML-KEM-768 + ML-DSA-65. All field values are the tool's own select
 *  options; the recommendation/checklist/watch-outs come from the real
 *  auditCryptoApi logic, not authored text. */
function cryptoApiRefactorSample(): string {
  return renderCryptoApiMarkdown({
    stackInventory: {
      applicationType: 'server-side service',
      language: 'Java',
      currentCryptoApi: ['jce-provider', 'bouncycastle'],
      provider: ['software', 'hsm'],
    },
    refactorScope: {
      targetAlgorithms: ['ML-KEM-768', 'ML-DSA-65'],
      callSiteCount: 'medium',
      cryptoAgilityNow: 'partially-hardcoded',
      runtimeFallback: 'must-support',
    },
    plan: {
      refactorPlan:
        'Introduce a signing/KEM facade over the JCE provider seam first; migrate the 30-odd direct BouncyCastle call sites behind it service by service, TLS termination before data-at-rest; wire algorithm selection to configuration so the ML-DSA-87 upgrade is a config change, not a refactor.',
    },
  })
}

/** Real-tool generators for the Command Center tools that have no other
 *  presence in Learn/Simulation (no shared component to reuse), keyed by
 *  the `ExecutiveDocumentType` the tool saves as. Checked first by
 *  `demoDocFor` before falling back to the hand-authored `DEMO_DOCS_BY_SECTOR`. */
export const REAL_DOC_GENERATORS: Partial<
  Record<ExecutiveDocumentType, (sector: DemoSector) => DemoDoc>
> = {
  // Financial artifacts derived from the shared Business Case math so the tour
  // can never drift from the real ROI / Breach / Cost-of-Inaction tools.
  'roi-model': (sector) => deriveRoiDoc(sector),
  'breach-scenario': (sector) => deriveBreachDoc(sector),
  'cost-of-inaction': (sector) => deriveInactionDoc(sector),
  'cost-model-comparison': (sector) => deriveExplorerDoc(sector),
  'board-deck': (sector) => deriveBoardDeck(sector),
  'program-charter': (sector) => ({
    title: 'Program Charter',
    data: buildProgramCharter(programCharterState(sector)),
  }),
  'initial-scoping': (sector) => {
    const { state, industry } = initialScopingState(sector)
    return { title: 'Initial Scoping Assessment', data: buildInitialScoping(state, industry) }
  },
  'skills-team-plan': (sector) => ({
    title: 'Skills & Team Plan',
    data: buildSkillsTeamPlan(skillsTeamPlanState(sector)),
  }),
  'infra-modernization-plan': (sector) => ({
    title: 'Infrastructure Modernization Plan',
    data: buildInfraModernizationPlan(infraModernizationPlanState(sector)),
  }),
  'refresh-cycle-alignment': (sector) => {
    const { state, horizonEndYear } = refreshCycleAlignmentState(sector)
    return {
      title: 'Refresh-Cycle Alignment',
      data: buildRefreshCycleAlignment(state, horizonEndYear),
    }
  },
  'accelerated-execution-profile': (sector) => ({
    title: 'Accelerated Execution Profile',
    data: buildAcceleratedExecutionProfile(acceleratedExecutionProfileState(sector)),
  }),
  'data-at-rest-strategy': (sector) => ({
    title: 'Data-at-Rest Strategy',
    data: buildDataAtRestStrategy(dataAtRestStrategyState(sector)),
  }),
  // Wave 5 (WP5.3) — same sample fill the real tool's own auto-run demo uses
  // (CONTRACT_DEMO_FILL), rendered through the real renderContractPreview().
  // Sector-independent by design: contract clause language doesn't meaningfully
  // vary by industry the way cost/roadmap numbers do.
  'contract-clause': () => ({
    title: 'PQC Vendor Contract Requirements',
    data: renderContractPreview(CONTRACT_DEMO_FILL),
  }),
  // Wave 5 (WP5.3) — sector-independent: the sample is 2 real, verified
  // catalog vendors, not sector-flavored narrative.
  'vendor-scorecard': () => {
    const { rows, portfolioAverage, dimensionRows, productCount } = vendorScorecardSample()
    return {
      title: `Vendor PQC Readiness Scorecard (${portfolioAverage}/100)`,
      data: buildScorecardMarkdown(portfolioAverage, productCount, dimensionRows, rows, {
        scannerNotes: 'Keyfactor AgileSec — code + traffic scanning across the vendor fleet',
        cveNotes: 'NVD subscription + CISA KEV alerts; library-EoL tracker via Snyk',
        siemNotes: 'Splunk rule alerting on TLS handshakes negotiating non-CNSA suites',
        ztNotes: 'Cloudflare Zero Trust policy denying RSA-PKCS#1 v1.5 inbound',
      }),
    }
  },
  // Wave 5 (WP5.3, completed 07182026) — sector-independent: 3 real catalog
  // products across 3 layers with a genuine migration gap (see
  // supplyChainMatrixSample's own comment). Was deliberately deferred when
  // contract-clause/vendor-scorecard shipped, given SupplyChainRiskMatrix's
  // materially larger derived-state surface; closed out once that surface was
  // cleanly extractable into computeLayerStats/buildSupplyChainMarkdown
  // without touching the wide, cross-page useExecutiveModuleData hook.
  'supply-chain-matrix': () => {
    const md = supplyChainMatrixSample()
    return { title: 'Supply Chain PQC Risk Matrix', data: md }
  },
  // H2 round 2 (07192026) — the Verify-Close closure artifact, rendered by the
  // real tool's own buildMarkdown (5-point evidence table, TNFL-aware
  // decommissioning log, closure record). Was hand-typed in demoDocs before.
  'migration-verification': (sector) => ({
    title: 'Migration Verification & Program Closure',
    data: buildMigrationVerification(migrationVerificationState(sector)),
  }),
  // Batch 1 (07192026) — the three types that previously fell all the way
  // through to the typed PLACEHOLDER stub (no authored demo content existed).
  'kpi-tracker': (sector) => ({
    title: 'PQC Migration KPI Tracker',
    data: buildKpiTrackerMarkdown(kpiTrackerSample(sector)),
  }),
  // Sector-independent: the checklist items are framework-fixed; sector only
  // flavors the header (sample pins the demo org's Healthcare/DE profile).
  'audit-checklist': () => ({
    title: 'PQC Audit Readiness Checklist',
    data: auditChecklistSample(),
  }),
  // Sector-independent: a Java/JCE enterprise service reads the same in any
  // industry — the content is language/provider-driven, not sector-driven.
  'crypto-api-refactor': () => ({
    title: 'Crypto API Refactor Audit — Java',
    data: cryptoApiRefactorSample(),
  }),
  // Batch 2 (07192026) — the exec tour's reveal artifacts, the documents the
  // guided walkthrough opens on screen.
  //
  // risk-register: the sample IS the tool's own illustrative default entries
  // (DEFAULT_RISK_ENTRIES, shared single source with the store) — zero
  // invented data, rendered by the tool's own builder.
  'risk-register': () => ({
    title: 'Quantum Risk Register',
    data: buildRiskRegisterMarkdown(DEFAULT_RISK_ENTRIES),
  }),
  // kpi-dashboard: real buildDimensions pipeline over the same demo exec-data
  // as kpi-tracker (catalog/threat aggregates live; assessment-gated rows
  // honestly render locked), governance surface, executive lens.
  'kpi-dashboard': (sector) => {
    const dimensions = buildDimensions('executive', 'governance', demoKpiExecData(sector), null)
    const scores: Record<string, number> = {}
    let seed = 0
    for (const d of dimensions) {
      if (d.disabled) continue
      scores[d.id] = d.autoScore && d.autoScore > 0 ? d.autoScore : 55 + (seed++ % 3) * 10
    }
    return {
      title: 'PQC Governance KPI Dashboard',
      data: buildKpiDashboardMarkdown(dimensions, 'executive', scores, {}),
    }
  },
  // migration-roadmap: the tool's own teaching-default milestone set (the
  // framework's governance-spine + two-track shape), with the external
  // deadline rows sourced from the timeline-generated facts — the same single
  // source Assess/Report/Sim already read — so a CSV deadline change
  // propagates here without a code edit.
  'migration-roadmap': () => ({
    title: 'PQC Migration Roadmap (Two-Track)',
    data: buildRoadmapMarkdown(
      [
        {
          label: 'US key-establishment migration deadline (EO, June 2026)',
          year: TIMELINE_COUNTRY_DEADLINE_YEAR.US,
          source: 'United States',
        },
        {
          label: 'EU full PQC transition',
          year: TIMELINE_COUNTRY_DEADLINE_YEAR.EU,
          source: 'European Union',
        },
      ],
      ROADMAP_DEFAULT_MILESTONES,
      []
    ),
  }),
  // Batch 3 (07192026) — remaining risk/vendor/strategy docs.
  //
  // crqc-scenario: the tool's own algorithm tables and compliance-deadline
  // rows (module constants) via its real builder. crqcYear is the midpoint of
  // the sim's derived aggressive planning band (narrationFacts, anchored on
  // QC_FIRST_YEAR) so it can never drift outside the band the narration
  // states; the urgency label mirrors the tool's own thresholds.
  'crqc-scenario': (sector) => {
    const currentYear = new Date().getFullYear()
    const crqcYear = CRQC_BAND_STANDARD.startYear + 2
    const yearsRemaining = crqcYear - currentYear
    const urgencyLevel = yearsRemaining <= 3 ? 'critical' : yearsRemaining <= 6 ? 'high' : 'medium'
    return {
      title: 'CRQC Scenario Analysis',
      data: buildCrqcScenarioMarkdown({
        crqcYear,
        currentYear,
        urgencyLevel,
        industry: sector === 'financial' ? 'Financial Services / Banking' : 'Healthcare',
      }),
    }
  },
  // raci-matrix: the sample IS the tool's own seeded default matrix — zero
  // invented data.
  'raci-matrix': () => ({
    title: 'PQC Migration RACI Matrix',
    data: buildRaciMarkdown(buildSeededMatrix()),
  }),
  // policy-draft: the crypto-algorithm policy type through the tool's own
  // renderer; the body text is the tool's template, only the org fields are
  // sample inputs.
  'policy-draft': (sector) => ({
    title: 'Cryptographic Algorithm Policy',
    data: renderPolicyPreview('crypto-algorithm', {
      general: {
        'org-name': ORG[sector],
        jurisdiction: sector === 'healthcare' ? 'Germany / EU' : 'United States',
        industry: sector,
        'policy-owner': 'Head of Cryptographic Engineering',
        'policy-version': '1.0',
        'effective-date': '2026-07-01',
        'review-cadence': 'Annually',
        approver: 'CISO',
        frameworks: [],
      },
    }),
  }),
  // stakeholder-comms: sample fill through the tool's own renderer.
  'stakeholder-comms': () => ({
    title: 'Stakeholder Communications Plan',
    data: renderCommsPreview({
      'stakeholder-map': {
        'key-stakeholders':
          'Board risk committee; CIO/CTO; platform engineering; procurement; external auditors',
        'stakeholder-concerns':
          'Cost and timing of migration; service stability during cutover; audit evidence',
        'influence-level':
          'Board: high influence, low detail. Engineering: high detail, execution-critical.',
      },
      'message-framework': {
        'board-message':
          'Quantum risk is a dated, budgetable program — here is the roadmap, the gates, and the quarterly KPI pack.',
        'technical-leadership-message':
          'Two-track migration: confidentiality (KEM) first for HNDL exposure, signatures on the PKI refresh cycle.',
        'dev-teams-message':
          'Crypto goes behind the facade — algorithm choice becomes configuration, not code change.',
        'external-partners-message':
          'Dated PQC commitments enter contracts at renewal; interop testing windows published per wave.',
      },
      'communication-cadence': {
        'reporting-frequency': 'monthly',
        'status-report-format': 'KPI pack + exceptions',
      },
      'escalation-criteria': {
        'escalation-triggers':
          'Slip > 1 quarter against a regulatory buffer; a Tier-1 vendor dropping PQC support; a deployed-algorithm vulnerability.',
      },
    }),
  }),
  // deployment-playbook: the tool's own real checklist content through the
  // shared OpsChecklist builder — first section complete, second mid-flight
  // (checked ids derive from the real section items, so a rename propagates).
  'deployment-playbook': () => {
    const checked = new Set<string>()
    DEPLOYMENT_PLAYBOOK_SECTIONS[0]?.items.forEach((i) => checked.add(i.id))
    DEPLOYMENT_PLAYBOOK_SECTIONS[1]?.items.slice(0, 2).forEach((i) => checked.add(i.id))
    return {
      title: DEPLOYMENT_PLAYBOOK_TITLE,
      data: buildChecklistMarkdown(
        DEPLOYMENT_PLAYBOOK_TITLE,
        DEPLOYMENT_PLAYBOOK_DESCRIPTION,
        DEPLOYMENT_PLAYBOOK_SECTIONS,
        checked
      ),
    }
  },
  // mti-negotiator: TLS 1.3 for a global-commercial audience with non-PQC and
  // hybrid peers — the recommendation comes from the real recommendMTI logic.
  'mti-negotiator': () => ({
    title: 'Mandatory-to-Implement Negotiation — TLS 1.3',
    data: renderMTIMarkdown({
      protocolAudience: {
        protocol: 'TLS 1.3',
        audience: 'global-commercial',
        interopProfile: ['non-pqc-peers', 'hybrid-peers'],
        complianceDeadline: String(TIMELINE_COUNTRY_DEADLINE_YEAR.US),
      },
      standardsConstraints: {
        standardsPosture: 'nist-pqc-only',
        hardwareConstraints: [],
        signatureSizePreference: 'no-preference',
      },
      plan: {
        summary:
          'Hybrid KEM now, classical fallback until the long tail clears, revisit MTI at the 2028 interop checkpoint.',
      },
    }),
  }),
  // Batch 4 (07192026) — technical docs with clean, already-exported renderers.
  //
  // hybrid-transition: production TLS edge with long-lived data and mixed
  // peers — the pathway recommendation comes from the real
  // recommendTransitionPathway logic.
  'hybrid-transition': () => ({
    title: 'Hybrid Transition Pathway — TLS 1.3',
    data: renderHybridTransitionMarkdown({
      inventory: {
        protocol: 'TLS 1.3',
        currentAlgorithm: 'X25519',
        function: 'kem',
        dataLifetime: '5-15y',
        deploymentMaturity: 'in-production-with-agility',
      },
      constraints: {
        interoperabilityRequirement: ['classical-peers', 'fips-validated'],
        bandwidthBudget: 'moderate',
        cryptoAgility: 'medium',
        complianceDeadline: String(TIMELINE_COUNTRY_DEADLINE_YEAR.US),
      },
      plan: {},
    }),
  }),
  // cloud-responsibility-matrix: multi-cloud IaaS+SaaS estate with
  // customer-managed keys — matrix/watch-outs from the real
  // buildCloudResponsibilityMatrix logic (its §6.4 quote is the tool's own
  // citation, verified against the upd1 PDF p.33 "Crypto Agility in the
  // Cloud").
  'cloud-responsibility-matrix': () => ({
    title: 'Cloud Shared-Responsibility Crypto Matrix',
    data: renderCloudMatrixMarkdown({
      cloudPosture: {
        cloudProviders: ['aws', 'azure'],
        serviceModelMix: ['iaas', 'saas'],
        regulatoryOverlay: [],
      },
      cryptoInventory: {
        assetClasses: [],
        customerKeyControl: 'customer-managed',
        dataResidency: 'multi-region',
        crqcExposureHorizon: '5-15y',
      },
      plan: {},
    }),
  }),
  // DOCUMENTED EXCEPTIONS (Batch 4, 07192026) — deliberately NOT converted,
  // per the plan's no-force-fit rule; the authored demoDocs content stays as
  // the honest fallback for these five (30 of the 35 tree-gated types now
  // render via a real tool):
  // - crypto-vulnerability-watch: the tool's whole value is the LIVE async
  //   CVE snapshot (public/data/cve-snapshot.json); a synchronous sample
  //   would render an empty per-product "no CVEs in snapshot" shell — worse
  //   than the authored content.
  // - crypto-cbom (LibraryCBOMBuilder) + management-tools-audit: export
  //   memos entangled with multi-step workshop state; extraction deserves
  //   its own careful pass, not a rushed one.
  // - crypto-architecture: the markdown derives from an interactive diagram
  //   component-state graph; same reasoning.
  // - risk-treatment-plan (RiskHeatmapGenerator): export memo depends on
  //   three other component memos (residual entries, priority order,
  //   deltas); same reasoning.
}
