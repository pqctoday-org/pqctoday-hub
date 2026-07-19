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
  computeLayerStats,
  computeMatrixEntries,
  computeNoRiskLayers,
  buildDependencyRelations,
  buildSupplyChainMarkdown,
  mapToAssetClass,
  type CSWP39AssetClass,
} from '@/components/PKILearning/modules/VendorRisk/components/SupplyChainRiskMatrix'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { threatsData } from '@/data/threatsData'
import { isPqcReady, isFips1403Validated } from '@/data/kpiCatalog'
import {
  buildMarkdown as buildMigrationVerification,
  type VerifyState,
} from '@/components/BusinessCenter/tools/MigrationVerification'

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
 * products spanning 3 distinct infrastructure layers with mixed PQC status
 * (aws-lc/Libraries: available; Entrust nShield/Hardware: available —
 * also the ArchitecturePanel mid-size node and compliance-cert-check's A7285
 * cert, for continuity across the tour; Microsoft Entra ID/Cloud: roadmap —
 * so the matrix shows a real migration gap, not an all-green demo). Industry
 * uses threatsData's OWN taxonomy string, 'Financial Services / Banking' —
 * verified directly against the data, not assumed: the assessment-side label
 * seedDemoOrg uses ('Finance & Banking') doesn't match threatsData's
 * industry field at all, which would have silently produced zero threat
 * matches and an empty Impact column. So Impact is computed from real
 * threatsData, not left "not personalized".
 *
 * `vendorsByLayer` is built here with the same split-comma-layers logic
 * useExecutiveModuleData uses — that hook itself is a wide, cross-page
 * aggregator (assessment + compliance + timeline + more) not worth pulling
 * into a synchronous sample-doc generator; this reproduces only the ~8 lines
 * of layer-grouping it shares with the matrix, not the rest of the hook.
 */
function supplyChainMatrixSample() {
  const industry = 'Financial Services / Banking'
  const items = resolveProductNames(['aws-lc', 'entrust-nshield', 'microsoft-entra-id'])

  const vendorsByLayer = new Map<string, SoftwareItem[]>()
  for (const item of items) {
    for (const layer of (item.infrastructureLayer || 'Other').split(',').map((l) => l.trim())) {
      const existing = vendorsByLayer.get(layer)
      if (existing) existing.push(item)
      else vendorsByLayer.set(layer, [item])
    }
  }

  const industryThreats = threatsData.filter((t) =>
    t.industry.toLowerCase().includes(industry.toLowerCase())
  )

  const layerStats = computeLayerStats(vendorsByLayer, industryThreats, true, null)
  const matrixEntries = computeMatrixEntries(layerStats)
  const noRiskLayers = computeNoRiskLayers(layerStats)

  const dependencyRelations = buildDependencyRelations(
    [...(vendorsByLayer.get('Libraries') ?? []), ...(vendorsByLayer.get('Hardware') ?? [])],
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
    layerStats,
    matrixEntries,
    noRiskLayers,
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
}
