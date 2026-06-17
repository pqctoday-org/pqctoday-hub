// SPDX-License-Identifier: GPL-3.0-only
/**
 * gen-sim-trees — emit the Simulation's per-phase activity trees as dated,
 * self-contained TS snapshots under src/simulation/trees/.
 *
 * The framework structure (activities, the maturity level each delivers, the
 * Level 1–4 indicators, and the phase gate) is transcribed from the Applied
 * Quantum PQC Migration Framework v2.1 (Marin Ivezić). Each activity's leaf
 * steps map to REAL hub resources — a Learn module, a Command-Center tool that
 * emits an artifact, or a reference page. src/simulation/trees.test.ts guards
 * every leaf against the live hub registries, so a coverage gap fails CI.
 *
 * Evolve it: when hub coverage or the framework changes, edit FRAMEWORK / the
 * leaf helpers below and re-run with a fresh date stamp:
 *
 *     node scripts/gen-sim-trees.mjs 06142026
 *
 * then move the previous dated files into src/simulation/trees/archive/.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DATE = process.argv[2] || '06142026' // MMDDYYYY
const SOURCE = 'Applied Quantum PQC Migration Framework v2.1 (Marin Ivezić)'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'simulation', 'trees')

// ---- leaf helpers: every leaf points at a real hub resource ----------------
const REF_URL = {
  threats: '/threats',
  'assess-engine': '/assess',
  migrate: '/migrate',
  library: '/library',
  compliance: '/compliance',
  'compliance-cert-check': '/compliance?cert=',
  'algorithms-protocol-matrix': '/algorithms?tab=support',
  'algorithms-transition': '/algorithms?tab=transition',
  'algorithms-catalog': '/algorithms',
  timeline: '/timeline',
  report: '/report',
}
// Hands-on Playground workshops (practice leaves). These EMBED in the sim (C2):
// the id is the Playground tool id (WORKSHOP_TOOL_COMPONENTS key); the `to` is the
// standalone /playground/:toolId page used as the non-embedded fallback.
const WORKSHOP_TOOLS = new Set([
  'tls-simulator',
  'envelope-encrypt',
  'merkle-proof',
  'hsm-capacity',
  'cert-capacity',
])
const ART_TOOL = {
  'roi-model': 'roi-calculator',
  'board-deck': 'board-pitch',
  'crqc-scenario': 'crqc-scenario',
  'raci-matrix': 'raci-builder',
  'policy-draft': 'policy-generator',
  'program-charter': 'program-charter',
  'initial-scoping': 'initial-scoping',
  'management-tools-audit': 'management-tools-audit',
  'crypto-architecture': 'crypto-architecture-diagram',
  'crypto-vulnerability-watch': 'crypto-vulnerability-watch',
  'crypto-cbom': 'crypto-cbom-builder',
  'risk-register': 'risk-register',
  'risk-treatment-plan': 'risk-treatment-plan',
  'migration-roadmap': 'roadmap-builder',
  'compliance-timeline': 'compliance-timeline',
  'stakeholder-comms': 'stakeholder-comms',
  'hybrid-transition': 'hybrid-transition-planner',
  'deployment-playbook': 'deployment-playbook',
  'mti-negotiator': 'mti-negotiator',
  'crypto-api-refactor': 'crypto-api-refactor-audit',
  'vendor-scorecard': 'vendor-scorecard',
  'contract-clause': 'contract-clause',
  'supply-chain-matrix': 'supply-chain-matrix',
  'cloud-responsibility-matrix': 'cloud-responsibility-matrix',
  'kpi-dashboard': 'kpi-dashboard',
  'infra-modernization-plan': 'infra-modernization-planner',
  'refresh-cycle-alignment': 'refresh-cycle-alignment',
  'accelerated-execution-profile': 'accelerated-execution-profile',
  'data-at-rest-strategy': 'data-at-rest-strategy',
  'kpi-tracker': 'kpi-tracker',
  'skills-team-plan': 'skills-team-plan',
  'audit-checklist': 'audit-checklist',
}
const L = (moduleId, label) => ({ kind: 'learn', label, to: `/learn/${moduleId}`, moduleId })
const A = (artifactType, label) => {
  const tool = ART_TOOL[artifactType]
  if (!tool) throw new Error(`no tool for artifact ${artifactType}`)
  return { kind: 'activity', label, to: `/business/tools/${tool}`, artifactType }
}
const R = (refId, label) => {
  const to = REF_URL[refId]
  if (!to) throw new Error(`no url for ref ${refId}`)
  return { kind: 'reference', label, to, refId }
}
// W() — a hands-on workshop practice leaf that EMBEDS in the sim (C2). The
// embed contract (embedContract.test.ts) asserts every workshopId resolves to a
// mounted Playground component, so a typo here fails the build.
const W = (workshopId, label) => {
  if (!WORKSHOP_TOOLS.has(workshopId)) throw new Error(`unknown workshop ${workshopId}`)
  return { kind: 'workshop', label, to: `/playground/${workshopId}`, workshopId }
}
// C() — a product-catalog step that EMBEDS the Migrate catalog in the sim (C7).
// `layer` is the initial layer scope (e.g. 'layer-1'); omit for unscoped.
// Completion: the player has ≥1 product saved to "My Products".
const C = (label, layer) => ({
  kind: 'catalog',
  label,
  to: '/migrate',
  ...(layer ? { catalogLayer: layer } : {}),
})

// ---- per-phase Maturity Indicators (verbatim, Applied Quantum v2.1) ---------
const INDICATORS = {
  p0: {
    1: 'Quantum risk acknowledged; no formal program',
    2: 'Charter approved; QRPM appointed; Year 1 budget secured',
    3: 'Multi-year budget committed; SteerCo operational; scoping assessment complete',
    4: 'Program integrated into enterprise risk register; quantum risk reported to board quarterly alongside other strategic risks',
  },
  p1: {
    1: 'Partial manual inventory of obvious systems (web servers, VPN); CMDB-only asset register; no continuous discovery',
    2: 'Risk-driven scoping complete; automated discovery deployed on Priority A systems; ≥70% Tier-1 coverage; inventory is queryable; classical vulnerabilities being remediated; multiple asset data sources cross-referenced',
    3: '≥90% coverage; continuous discovery in CI/CD and passive monitoring; integrated with CMDB, SBOM, BIA, and certificate management; change management integration live; crypto champions designated; alerting framework operational',
    4: 'Real-time cryptographic posture monitoring with tiered alerting; automated drift detection; coverage spans IT, OT, cloud, and third-party; discovery effectiveness metrics tracked and reported',
  },
  p2: {
    1: 'Partial CBOM in spreadsheet form covering known systems; no standard format',
    2: 'CycloneDX CBOM operational for Layers 1–2; queryable; SBOM linkage established for key applications',
    3: 'CBOM covers Layers 1–3; integrated into CI/CD; freshness governance enforced; change management integration live',
    4: 'CBOM is a real-time operational asset; auto-updated on deployment; Layer 4 gaps systematically managed through vendor governance',
  },
  p3: {
    1: 'Informal awareness of which systems are "probably vulnerable"; no structured scoring',
    2: 'Formal risk scoring model applied to Tier-1 CBOM entries; prioritized migration backlog exists; QRA document produced',
    3: 'QRA updated quarterly; all CBOM entries scored and tiered; migration sequencing drives Phase 5 execution; legal risk dimension assessed',
    4: 'Continuous risk posture management; automated re-scoring when CBOM changes or regulatory deadlines shift; QRA integrated into enterprise risk register',
  },
  p4: {
    1: 'Informal plan exists (spreadsheet, no governance); single-year horizon',
    2: 'Multi-year roadmap approved; Year 1 plan resourced; SteerCo operational; KPI baseline set',
    3: 'Quarterly roadmap reviews operational; dependency mapping maintained; refresh cycle alignment documented; vendor engagement tracked on dashboard',
    4: 'Roadmap is a living instrument with quarterly updates; contingency triggers defined and tested; leading indicators monitored',
  },
  p5: {
    1: 'Lab testing only; no production exposure',
    2: '2+ production pilots running with measured results; rollback procedures tested; validated patterns documented',
    3: 'Tier-1 internet-facing systems on hybrid/PQC; wave rollout underway for Tier-2; defense-in-depth measures (tokenization, AES-256, segmentation) deployed',
    4: 'Estate-wide hybrid/PQC deployment substantially complete; transitioning selected systems from hybrid to PQC-only; crypto-agility demonstrated via algorithm-swap drill',
  },
  p6: {
    1: 'Awareness of PKI/HSM/network challenges; no concrete plans',
    2: 'HSMs inventoried with PQC status; PKI modernization plan drafted; initial middlebox testing underway',
    3: 'HSM upgrades in progress; PKI dual-stack operational; all production middleboxes tested; performance baselines established for Tier-1 systems',
    4: 'Infrastructure fully PQC-capable across IT estate; capacity planning validated at production scale; PKI automated with shortened lifetimes',
  },
  p7: {
    1: 'Ad-hoc inquiries to a few vendors; no structured tracking',
    2: 'Top 10 vendors formally engaged; questionnaires sent; responses tracked; vendor criticality classification complete',
    3: 'PQC in standard procurement language; contracts include dated commitments and remedies; bridging patterns deployed for blocked systems; vendor scorecard reported to SteerCo',
    4: 'All strategic vendors PQC-committed with verified delivery; open-source dependency tracking operational; vendor governance is permanent BAU function',
  },
  foundations: {
    1: 'Cross-cutting capabilities recognized; ad hoc maturity awareness; no KPIs',
    2: 'Maturity self-assessment run; KPI baseline set; crypto-agility plan and skills plan drafted',
    3: 'KPIs reported to the board; regulatory/standards alignment maintained; crypto-agility OKRs tracked; evidence dossier kept',
    4: 'Foundations run as BAU; migration verification & program-closure standard applied; algorithm changes are routine',
  },
}

const GATES = {
  p0: { id: 'G0', criterion: 'Mandate signed' },
  p1: { id: 'G1', criterion: '≥70% Tier-1 systems inventoried' },
  p2: { id: 'G2', criterion: 'Machine-verifiable CBOM published' },
  p3: { id: 'G3', criterion: 'QRA approved' },
  p4: { id: 'G4', criterion: 'Multi-year roadmap & PMO established' },
  p5: { id: 'G5', criterion: 'Pilots validated; wave migration underway' },
  p6: { id: 'G6', criterion: 'Infrastructure PQC-ready; performance validated' },
  p7: { id: 'G7', criterion: 'Continuous vendor governance operating' },
  foundations: { id: 'GF', criterion: 'Foundations sustained as BAU' },
}

// ---- the framework activities, level-tagged, mapped to real hub leaves ------
// level = the maturity level the activity primarily delivers (from the
// per-phase Maturity Indicators); do/output paraphrased from the framework prose.
const FRAMEWORK = {
  p0: [
    {
      id: '0.1',
      level: 1,
      title: 'Frame the Business Case',
      do: 'Structure the executive argument around regulatory deadlines, HNDL and TNFL exposure, and stakeholder expectations.',
      output: 'Executive business case',
      steps: [
        L('pqc-business-case', 'Learn: PQC Business Case'),
        L('exec-quantum-impact', 'Learn: Executive Quantum Impact'),
        R('threats', 'Check the CRQC threat horizon'),
        A('roi-model', 'Model the migration ROI'),
      ],
    },
    {
      id: '0.2',
      level: 1,
      title: 'Assess Data & Asset Sensitivity',
      do: 'Discover the critical assets, classify their sensitivity and confidentiality horizon — the exposure that justifies the budget the board will commit.',
      output: 'Initial scoping & asset-sensitivity assessment',
      steps: [
        L('data-asset-sensitivity', 'Learn: Data & Asset Sensitivity'),
        R('assess-engine', 'Run the assessment engine'),
        A('initial-scoping', 'Produce the scoping & asset assessment'),
      ],
    },
    {
      id: '0.3',
      level: 2,
      title: 'Identify Applicable Standards, Certifications & Compliance',
      do: 'Map the regulations, standards and certifications that bind this org (and their deadlines) into a compliance & regulatory strategy.',
      output: 'Compliance & regulatory strategy',
      steps: [
        L('compliance-strategy', 'Learn: Compliance & Regulatory Strategy'),
        R('compliance', 'Map applicable regs & certifications'),
      ],
    },
    {
      id: '0.4',
      level: 2,
      title: 'Assess the Quantum Risk',
      do: 'Score the quantum risk to the discovered assets (HNDL + TNFL) to size and prioritise the program.',
      output: 'Quantum risk assessment',
      steps: [
        L('pqc-risk-management', 'Learn: PQC Risk Management'),
        A('crqc-scenario', 'Run a CRQC scenario'),
      ],
    },
    {
      id: '0.5',
      level: 2,
      title: 'Establish Governance & Draft the Charter',
      do: 'Define roles (Sponsor, SteerCo, QRPM), the RACI, and the one-page program charter.',
      output: 'Governance structure & approved charter',
      steps: [
        L('pqc-governance', 'Learn: PQC Governance & Policy'),
        A('raci-matrix', 'Build the RACI matrix'),
        A('program-charter', 'Produce the Program Charter'),
      ],
    },
    {
      id: '0.6',
      level: 3,
      title: 'Secure the Board Mandate & Multi-Year Budget',
      do: 'Pitch the board with the exposure-justified ask and secure multi-year funding and cryptography policy.',
      output: 'Signed mandate & multi-year budget',
      steps: [
        A('board-deck', 'Pitch the board for budget'),
        A('kpi-dashboard', 'Set the board KPI pack (Coverage/Trust/Inventory/Vendors/Agility)'),
        A('policy-draft', 'Draft the cryptography policy'),
      ],
    },
  ],
  p1: [
    {
      id: '1.0',
      level: 1,
      title: 'Risk-Driven Scoping — Decide What to Inventory First',
      do: 'Apply 80/20 prioritization to pick the Tier-1 systems and assign discovery priority tiers.',
      output: 'Risk-driven scoping document',
      steps: [
        L('data-asset-sensitivity', 'Learn: Data & Asset Sensitivity'),
        R('assess-engine', 'Run the scoping assessment engine'),
      ],
    },
    {
      id: '1.1',
      level: 2,
      title: 'Establish Three Parallel Inventory Tracks',
      do: 'Stand up Track A (crypto usage), Track B (data classification), Track C (systems/assets).',
      output: null,
      steps: [
        L('crypto-mgmt-modernization', 'Learn: Cryptographic Management Modernization'),
        L(
          'data-asset-sensitivity',
          'Learn: Track B — data classification & confidentiality horizons'
        ),
      ],
    },
    {
      id: '1.2',
      level: 2,
      title: 'Deploy Cryptographic Discovery — Layered Approach',
      do: 'Deploy discovery across network, code, config, runtime, and manual layers.',
      output: 'Layered discovery deployment',
      steps: [
        C('Browse the Migrate discovery catalog'),
        A('management-tools-audit', 'Run the Management-Tools Audit'),
      ],
    },
    {
      id: '1.3',
      level: 2,
      title: 'Map the Cryptographic Estate',
      do: 'Document algorithm, key size, protocol, library, cert, owner and vulnerability for each instance.',
      output: 'Cryptographic asset inventory',
      steps: [A('crypto-architecture', 'Draw the crypto architecture diagram')],
    },
    {
      id: '1.4–1.5',
      level: 2,
      title: 'Address Asset Discovery & Integrate Existing Data Sources',
      do: 'Cross-reference CMDB, ITAM, cloud APIs, CT logs, BIA and certificate data for coverage.',
      output: 'Cross-referenced asset coverage',
      steps: [
        L('platform-eng-pqc', 'Learn: Platform Engineering for PQC'),
        R('library', 'Mine the Library for asset data'),
      ],
    },
    {
      id: '1.6',
      level: 3,
      title: 'Establish Continuous Discovery',
      do: 'Wire discovery into CI/CD and passive monitoring with quarterly rescans and tiered alerting.',
      output: 'Continuous discovery operating model',
      steps: [
        A('crypto-vulnerability-watch', 'Set up the Crypto-Vulnerability Watch'),
        L('pqc-testing-validation', 'Learn: continuous discovery & validation'),
      ],
    },
  ],
  p2: [
    {
      id: '2.1',
      level: 1,
      title: 'Select CBOM Format and Tooling',
      do: 'Adopt CycloneDX and establish the record structure and tooling.',
      output: 'CycloneDX CBOM format spec',
      steps: [
        L('crypto-mgmt-modernization', 'Learn: CBOM in Cryptographic Management'),
        R('library', 'Reference: CycloneDX in the Library'),
      ],
    },
    {
      id: '2.2',
      level: 2,
      title: 'Populate CBOM from Inventory Data',
      do: 'Transform Phase 1 inventory into enriched CycloneDX records linked to the SBOM.',
      output: 'Populated CycloneDX CBOM',
      steps: [A('crypto-cbom', 'Build a CycloneDX CBOM')],
    },
    {
      id: '2.3',
      level: 3,
      title: 'Integrate CBOM into Operational Processes',
      do: 'Embed CBOM governance into CI/CD, change management, vendor onboarding and audit.',
      output: null,
      steps: [
        C('Wire CBOM into the Migrate pipeline'),
        A('crypto-vulnerability-watch', 'Wire CBOM freshness into CI/CD drift checks'),
      ],
    },
    {
      id: '2.4–2.5',
      level: 3,
      title: 'CBOM Freshness Governance & Securing Program Artifacts',
      do: 'Enforce refresh triggers and protect the CBOM with classification and access control.',
      output: 'CBOM governance & protection policy',
      steps: [
        L(
          'soc-implementation-pqc',
          'Learn: protect the CBOM (it is an HNDL shopping list) — SOC monitoring'
        ),
        C('Set CBOM freshness triggers in the Migrate pipeline'),
      ],
    },
  ],
  p3: [
    {
      id: '3.1',
      level: 1,
      title: 'Define Risk Scoring Model',
      do: 'Establish the four-dimension model: HNDL, TNFL, Regulatory, Feasibility.',
      output: 'Risk scoring model',
      steps: [
        L('pqc-risk-management', 'Learn: PQC Risk Management'),
        L('data-asset-sensitivity', 'Learn: data sensitivity & legal/data-retention horizon'),
        R('threats', 'Reference: why 256-bit ECC ≈ RSA-2048 under quantum'),
        R('algorithms-protocol-matrix', 'Reference: PQC Protocol Matrix'),
      ],
    },
    {
      id: '3.2',
      level: 2,
      title: 'Calculate Priority Scores',
      do: 'Compute composite scores and classify systems into migration tiers.',
      output: 'Scored and tiered CBOM',
      steps: [A('risk-register', 'Produce a Risk Register')],
    },
    {
      id: '3.3',
      level: 2,
      title: 'Apply Migration Sequencing Logic',
      do: 'Sequence with the two-track model (key exchange / signatures) by exposure and lead time.',
      output: 'Migration sequencing recommendation',
      steps: [
        L('migration-program', 'Learn: the two-track migration sequencing model'),
        R('algorithms-transition', 'Reference: the algorithm transition map'),
        A('risk-treatment-plan', 'Draft a Risk Treatment Plan'),
      ],
    },
    {
      id: '3.4',
      level: 2,
      title: 'Produce the Quantum Readiness Assessment (QRA)',
      do: 'Consolidate scoring into a defensible QRA: heatmap, backlog, gap analysis, compliance mapping.',
      output: 'Quantum Readiness Assessment (QRA)',
      steps: [
        R('compliance', 'Map the QRA to NIST / CNSA 2.0 / ETSI / sector rules'),
        R('report', 'Assemble the QRA on the Report page'),
      ],
    },
  ],
  p4: [
    {
      id: '4.1',
      level: 1,
      title: 'Define Year-1 Starter Plan (90-Day Governance Sprint)',
      do: 'Confirm leadership, training cohort, CBOM v1, two pilots, updated policy and baseline KPIs.',
      output: 'Year-1 starter plan',
      steps: [L('migration-program', 'Learn: Migration Program Management')],
    },
    {
      id: '4.2',
      level: 2,
      title: 'Structure the Multi-Year Roadmap',
      do: 'Define a phased 5-year plan with annual milestones and a critical path.',
      output: 'Multi-year roadmap',
      steps: [
        R('timeline', 'Reference: the 2026–2030 deadline squeeze'),
        A('migration-roadmap', 'Build a multi-year Roadmap'),
        A('stakeholder-comms', 'Plan the roadmap stakeholder communications'),
      ],
    },
    {
      id: '4.3',
      level: 2,
      title: 'Align to Infrastructure Refresh Cycles',
      do: 'Map PQC tasks onto already-funded refresh programs to embed cost avoidance.',
      output: 'Refresh-cycle alignment table',
      steps: [A('refresh-cycle-alignment', 'Map PQC tasks onto funded refresh cycles')],
    },
    {
      id: '4.4',
      level: 2,
      title: 'Establish PMO Structure for Scale',
      do: 'Define WBS, dependency map, critical path, resource leveling and risk register.',
      output: 'PMO operating model',
      steps: [
        A('raci-matrix', 'Define the 8 workstreams & RACI'),
        A('kpi-dashboard', 'Baseline the program KPI pack'),
      ],
    },
    {
      id: '4.5–4.6',
      level: 3,
      title: 'Manage the Roadmap as a Living Instrument & Define Milestone Gates',
      do: 'Run quarterly reviews with leading indicators and formal G0–G7 gate criteria.',
      output: 'Quarterly review process & gate criteria',
      steps: [R('report', 'Track gates on the Report page')],
    },
    {
      id: '4.7',
      level: 4,
      title: 'Pre-Draft the Accelerated Execution Profile',
      do: 'Pre-approve a contingency package with triggers, compressed sequence and activation authority.',
      output: 'Accelerated Execution Profile',
      steps: [A('accelerated-execution-profile', 'Pre-draft the accelerated execution profile')],
    },
  ],
  p5: [
    {
      id: '5.1',
      level: 1,
      title: 'Select Pilot Targets',
      do: 'Pick 2–4 Tier-1 pilots with full control, measurable baselines and rollback capability.',
      output: null,
      steps: [
        L('hybrid-crypto', 'Learn: Hybrid Cryptography'),
        C('Pick pilots from the Migrate catalog'),
      ],
    },
    {
      id: '5.2',
      level: 1,
      title: 'Design Hybrid Deployments',
      do: 'Design hybrid patterns (e.g. X25519+ML-KEM-768) and verify library readiness.',
      output: null,
      steps: [
        R('algorithms-protocol-matrix', 'Reference: which protocols have a PQC path'),
        L('vpn-ssh-pqc', 'Learn: VPN/IPsec & SSH PQC patterns'),
        L('code-signing', 'Learn: code & firmware signing (Track B — integrity)'),
        A('hybrid-transition', 'Plan the hybrid transition'),
      ],
    },
    {
      id: '5.3',
      level: 2,
      title: 'Execute Pilots with Measurement',
      do: 'Run pilots against SLOs (latency, CPU, throughput), test rollback and validate compatibility.',
      output: 'Pilot results reports',
      steps: [
        W('tls-simulator', 'Practice: measure the TLS 1.3 hybrid handshake'),
        A('deployment-playbook', 'Draft a Deployment Playbook'),
      ],
    },
    {
      id: '5.4',
      level: 3,
      title: 'Scale from Pilot to Production Through Waves',
      do: 'Execute a 6-wave rollout from lab to long tail with success criteria at each stage.',
      output: 'Wave deployment plan',
      steps: [A('mti-negotiator', 'Negotiate the minimum-interop baseline')],
    },
    {
      id: '5.5–5.6',
      level: 3,
      title: 'Defense-in-Depth & Data-at-Rest Strategy',
      do: 'Deploy tokenization, segmentation and AES-256 defaults; decide a per-store data-at-rest strategy.',
      output: 'Defense-in-depth & data-at-rest plan',
      steps: [
        L('confidential-computing', 'Learn: Confidential Computing & defense-in-depth'),
        L('database-encryption-pqc', 'Learn: data-at-rest strategy & DB encryption'),
        W('envelope-encrypt', 'Practice: PQC key-wrapping (envelope encryption)'),
        A('data-at-rest-strategy', 'Decide the per-store data-at-rest strategy'),
      ],
    },
    {
      id: '5.7',
      level: 4,
      title: 'AI-Assisted Migration (the gate that stays closed)',
      do: 'Use AI to triage and enrich, but keep full review rigor on AI-modified cryptographic code.',
      output: null,
      steps: [A('crypto-api-refactor', 'Audit AI-assisted crypto refactors')],
    },
  ],
  p6: [
    {
      id: '6.1',
      level: 2,
      title: 'PKI Modernization',
      do: 'Shorten certificate lifetimes, deploy dual-stack CA, and test chains across middleboxes.',
      output: 'PKI modernization plan',
      steps: [
        L('pki-workshop', 'Learn: PKI Workshop'),
        L('merkle-tree-certs', 'Learn: Merkle Tree Certificates (the web-PKI path)'),
        W('merkle-proof', 'Practice: Merkle Tree Certificates workshop'),
        A('infra-modernization-plan', 'Draft the infrastructure modernization plan'),
      ],
    },
    {
      id: '6.2',
      level: 2,
      title: 'HSM and KMS Modernization',
      do: 'Inventory HSMs by PQC capability, upgrade firmware and configure cloud KMS for PQC.',
      output: 'HSM/KMS upgrade schedule',
      steps: [
        L('hsm-pqc', 'Learn: HSM & PQC Operations'),
        L('kms-pqc', 'Learn: KMS & PQC'),
        W('hsm-capacity', 'Practice: HSM capacity calculator'),
      ],
    },
    {
      id: '6.3',
      level: 2,
      title: 'Network Infrastructure Assessment',
      do: 'Test PQC handshake sizes and protocol impacts across all production middleboxes.',
      output: 'Network compatibility report',
      steps: [
        L('network-security-pqc', 'Learn: Network Security & PQC'),
        R('algorithms-protocol-matrix', 'Reference: protocol PQC support'),
        W('cert-capacity', 'Practice: certificate chain / handshake size'),
      ],
    },
    {
      id: '6.4',
      level: 3,
      title: 'Performance Testing Methodology',
      do: 'Baseline metrics, run canary at 1–5% traffic and evaluate against SLOs.',
      output: 'Performance baseline and projections',
      steps: [
        L('pqc-testing-validation', 'Learn: PQC Testing & Validation'),
        R('compliance-cert-check', 'Reference: algorithm sizes & FIPS/CC certs'),
      ],
    },
    {
      id: '6.5',
      level: 3,
      title: 'Capacity Planning for PQC at Scale',
      do: 'Estimate CPU, memory, bandwidth and storage impact; benchmark on production hardware.',
      output: 'Capacity plan',
      steps: [R('algorithms-catalog', 'Reference: the algorithm size catalog')],
    },
  ],
  p7: [
    {
      id: '7.1',
      level: 1,
      title: 'Classify Vendor Portfolio by PQC Impact',
      do: 'Categorize vendors as Strategic Blocking, Strategic Enabling or Non-Critical.',
      output: 'Vendor classification matrix',
      steps: [
        L('vendor-risk', 'Learn: Vendor & Supply-Chain Risk'),
        A('supply-chain-matrix', 'Build the supply-chain matrix'),
      ],
    },
    {
      id: '7.2',
      level: 2,
      title: 'Execute Vendor Engagement',
      do: 'Send PQC readiness questionnaires to strategic vendors and track responses.',
      output: 'Vendor questionnaire responses',
      steps: [
        R('compliance-cert-check', 'Reference: vendor FIPS/CC cert status'),
        R('algorithms-protocol-matrix', 'Reference: which vendor protocols have a PQC path'),
        A('vendor-scorecard', 'Score vendors (Vendor Scorecard)'),
      ],
    },
    {
      id: '7.3',
      level: 3,
      title: 'Insert PQC Requirements into Procurement',
      do: 'Add PQC clauses to RFP and contract templates with dated commitments and remedies.',
      output: 'Updated procurement templates',
      steps: [A('contract-clause', 'Draft a PQC contract clause')],
    },
    {
      id: '7.4–7.6',
      level: 3,
      title: 'Manage Blockers, Ongoing Governance & Uncompellable Counterparties',
      do: 'Deploy bridging patterns, run a recurring scorecard cadence and coordinate ecosystem partners.',
      output: 'Vendor governance cadence',
      steps: [
        A('kpi-dashboard', 'Run the vendor-KPI / SteerCo governance cadence'),
        A('deployment-playbook', 'Deploy bridging patterns for blocked vendors'),
      ],
    },
    {
      id: '7.7',
      level: 4,
      title: 'Cloud Shared Responsibility and the SaaS Class',
      do: 'Define the provider/customer migration boundary and govern SaaS by sensitivity.',
      output: 'Cloud responsibility & SaaS governance',
      steps: [A('cloud-responsibility-matrix', 'Map the cloud responsibility split')],
    },
  ],
  foundations: [
    {
      id: 'F.1',
      level: 1,
      title: 'Establish GRC & Assess Program Maturity',
      do: 'Stand up the risk-appetite statement and KRI cascade; run (or refine) your PQC assessment — program maturity is derived from your progress, overall = weakest domain.',
      output: 'GRC structure & maturity baseline',
      steps: [
        L('pqc-grc', 'Learn: PQC GRC (risk appetite & KRIs)'),
        R('assess-engine', 'Run / refine your PQC assessment'),
      ],
    },
    {
      id: 'F.2',
      level: 2,
      title: 'Baseline Metrics & the Evidence Dossier',
      do: 'Set the board KPI pack (Coverage/Trust/Inventory/Vendors/Agility) and the operational KPIs, and start the audit/litigation evidence dossier.',
      output: 'KPI baseline & evidence dossier',
      steps: [
        A('kpi-dashboard', 'Baseline the board KPI pack'),
        A('kpi-tracker', 'Track operational KPIs & the evidence dossier'),
      ],
    },
    {
      id: 'F.3',
      level: 2,
      title: 'Build Crypto-Agility & the Team',
      do: 'Adopt crypto-agility as the end-state architecture and staff the program with the framework core roles (≈1 FTE per 500 CBOM instances).',
      output: 'Crypto-agility roadmap & skills plan',
      steps: [
        L('crypto-agility', 'Learn: Crypto-Agility as end-state'),
        A('skills-team-plan', 'Plan skills & team'),
      ],
    },
    {
      id: 'F.4',
      level: 3,
      title: 'Maintain Regulatory & Standards Alignment',
      do: 'Keep the phase-to-regulation map current across the 2026–2035 deadline squeeze and the standards bodies that bind you.',
      output: 'Regulatory & standards alignment map',
      steps: [
        L('standards-bodies', 'Learn: Standards, Certification & Compliance Bodies'),
        R('compliance', 'Maintain the regulatory & standards alignment map'),
      ],
    },
    {
      id: 'F.5',
      level: 4,
      title: 'Migration Verification & Program Closure',
      do: 'Apply the 5-point verification evidence standard, decommission classical material, and hand the capability to funded BAU owners.',
      output: 'Verification record & BAU handover',
      steps: [
        A('audit-checklist', 'Run the verification & audit-readiness checklist'),
        R('report', 'Assemble the evidence dossier & closure record'),
      ],
    },
  ],
}

// ---- per-phase "Common Failures" → the wrong moves (Applied Quantum v2.1) ---
const PITFALLS = {
  p0: [
    {
      title: 'Frame PQC as an innovation project',
      why: 'Treating migration as R&D instead of a governed program gets it deprioritized against operational work.',
    },
    {
      title: 'Commit only a single-year budget',
      why: 'One-year funding prevents realistic planning and talent retention over a 4–15 year program.',
    },
    {
      title: 'Leave business units off the SteerCo',
      why: 'Without business governance representation, workstream leads hit constant political resistance.',
    },
    {
      title: 'Delegate the program to vendors',
      why: 'Vendors execute on their own timelines, leaving you with no control over your migration.',
    },
    {
      title: 'Lock systems down prematurely',
      why: 'Knee-jerk restrictions burn operational goodwill without reducing HNDL risk.',
    },
  ],
  p1: [
    {
      title: 'Run an interview-only inventory',
      why: 'Application owners cannot reliably self-report crypto usage without automated discovery.',
    },
    {
      title: 'Keep the inventory in a spreadsheet',
      why: 'Static spreadsheets go stale within weeks without an automated, queryable refresh.',
    },
    {
      title: 'Wait for 100% completeness',
      why: 'Completeness is asymptotic; 80/20 risk-driven scoping delivers actionable results sooner.',
    },
    {
      title: 'Skip OT and embedded systems',
      why: 'The hardest systems to discover guarantee later surprises when excluded.',
    },
    {
      title: 'Trust a single discovery tool',
      why: 'No one tool covers all five discovery layers; multiple categories are required.',
    },
    {
      title: 'Treat discovery as one-time',
      why: 'Discovery is a permanent capability; disbanding the team stales the CBOM within six months.',
    },
    {
      title: 'Ignore the immediate classical-crypto findings',
      why: 'Discovery surfaces weak/expired classical crypto with near-term value; ignoring it wastes the inventory and leaves the Level-2 "classical vulnerabilities being remediated" bar unmet.',
    },
  ],
  p2: [
    {
      title: 'Insist on 100% CBOM coverage',
      why: 'Layer 4 is never fully visible; perfection blocks progress instead of managing gaps via vendor governance.',
    },
    {
      title: 'Keep the CBOM as a static document',
      why: 'A PDF/spreadsheet CBOM never updated is operationally useless; it must be live and queryable.',
    },
    {
      title: 'Ignore the SBOM↔CBOM linkage',
      why: 'CBOM entries without SBOM context miss dependency chains across shared libraries.',
    },
  ],
  p3: [
    {
      title: 'Give everything equal priority',
      why: 'Treating all vulnerable crypto as equally urgent dilutes resources and stalls the highest-risk systems.',
    },
    {
      title: 'Ignore migration feasibility',
      why: 'Prioritising systems that cannot migrate yet wastes effort on unmigrable targets.',
    },
    {
      title: 'Produce the QRA once and freeze it',
      why: 'Risk scores change as standards mature and deadlines approach; a static QRA goes stale.',
    },
    {
      title: 'Migrate RSA before ECC for "strength"',
      why: '256-bit ECC is at least as exposed to quantum attack as RSA-2048; ordering by classical strength misreads the threat.',
    },
    {
      title: 'Skip the legal / data-retention review',
      why: 'Long-retention data (GDPR, contractual, >10–15y) changes the HNDL exposure window; without legal counsel the QRA under-scores the very data that needs protecting first.',
    },
  ],
  p4: [
    {
      title: 'Plan in isolation from refresh cycles',
      why: 'Ignoring funded hardware/cloud/contract cycles gets budget rejected and misses embedding opportunities.',
    },
    {
      title: 'Defer vendor engagement to Year 2',
      why: 'Vendor dependency is the longest critical path; late engagement makes the timeline vendor-constrained.',
    },
    {
      title: 'Build a roadmap with no contingencies',
      why: 'Assuming every vendor and pilot succeeds leaves no acceleration/deceleration triggers.',
    },
    {
      title: 'Stand up governance without teeth',
      why: 'A SteerCo with no binding decision or funding authority cannot govern the migration.',
    },
    {
      title: 'Treat the roadmap as a project plan, not a program',
      why: 'A project plan ends at a milestone; PQC migration must transition to ongoing posture management by Year 4–5 — disbanding at "done" orphans the capability.',
    },
  ],
  p5: [
    {
      title: 'Pilot the easy systems, not the important ones',
      why: 'Convenience-based pilots prove little about real-world PQC viability on high-risk systems.',
    },
    {
      title: 'Skip rollback planning',
      why: 'Deploying without a tested rollback path leaves you unable to revert when a pilot fails.',
    },
    {
      title: 'Big-bang instead of waves',
      why: 'Migrating all Tier-1 at once prevents each wave validating assumptions for the next.',
    },
    {
      title: 'Measure only latency, not compatibility',
      why: 'Handshake metrics alone miss the downstream compatibility failures that break production.',
    },
    {
      title: 'Treat hybrid as the end state',
      why: 'Deploying hybrid without planning the PQC-only transition forces a second migration later.',
    },
    {
      title: 'Ignore library version as a hard constraint',
      why: 'PQC needs current libraries (OpenSSL 3.5+, BoringSSL, AWS-LC, Bouncy Castle); a lagging library/runtime silently blocks the deployment you designed.',
    },
  ],
  p6: [
    {
      title: 'Treat PQC as a drop-in library swap',
      why: 'PQC changes key/handshake sizes, breaking untested network paths and TLS termination.',
    },
    {
      title: 'Ignore middleboxes on the path',
      why: 'Firewalls, IDS/IPS and WAFs have hardcoded buffers that fail with PQC-sized handshakes.',
    },
    {
      title: 'Defer HSM capability upgrades',
      why: 'Discovering HSM incompatibility late causes 12–18 month procurement delays.',
    },
    {
      title: 'Do all PKI modernization in one event',
      why: 'Changing root, intermediate and end-entity at once risks widespread outages.',
    },
    {
      title: 'Neglect capacity planning for high-volume TLS termination',
      why: 'At CDN edge and load-balancer aggregate scale, PQC handshake/bandwidth growth swamps capacity you never modelled — the outage shows up under peak load.',
    },
  ],
  p7: [
    {
      title: 'Start vendor engagement too late',
      why: 'Vendor dependency is the longest critical path; waiting for a complete CBOM loses 12–24 months.',
    },
    {
      title: 'Accept verbal commitments',
      why: 'Verbal assurances evaporate when priorities shift; written GA dates and remedies are essential.',
    },
    {
      title: 'Treat all vendors equally',
      why: 'Equal intensity wastes resources; focus on the 5–10 Strategic Blocking vendors.',
    },
    {
      title: 'Keep no bridging strategy',
      why: 'When critical vendors miss milestones, undeployable bridging patterns leave you stuck.',
    },
    {
      title: 'Ignore open-source crypto dependencies',
      why: 'OpenSSL/Bouncy Castle and language libraries need the same tracking as commercial vendors.',
    },
    {
      title: 'Delegate the risk, not just the implementation',
      why: 'The vendor owns the product, but you still own the risk to your data, operations and compliance — "the vendor will sort it out" leaves you accountable with no control.',
    },
  ],
  foundations: [
    {
      title: 'Declare the migration "done" on milestones',
      why: 'Closing on milestone completion instead of verified posture — without verification evidence (observed negotiation, negative testing, dossier) the migration is a belief, not a fact.',
    },
    {
      title: 'Orphan the capabilities at closure',
      why: 'Treating closure as end-of-funding rather than handover — CBOM, discovery and vendor governance decay within quarters without funded BAU owners.',
    },
    {
      title: 'Skip the maturity baseline (run no assessment)',
      why: 'Without the weakest-link view you over-report progress and miss the gating domain that actually constrains readiness.',
    },
  ],
}

// ---- emit one dated, self-contained TS file per phase -----------------------
mkdirSync(OUT, { recursive: true })
mkdirSync(join(OUT, 'archive'), { recursive: true })

for (const phase of Object.keys(FRAMEWORK)) {
  const acts = FRAMEWORK[phase]
  const levelsPresent = [...new Set(acts.map((a) => a.level))].sort((x, y) => x - y)
  const levels = levelsPresent.map((level) => ({
    level,
    indicator: INDICATORS[phase][level],
    activities: acts
      .filter((a) => a.level === level)
      .map((a) => ({
        id: a.id,
        title: a.title,
        do: a.do,
        output: a.output ?? undefined,
        steps: a.steps,
      })),
  }))
  const tree = {
    phase,
    gate: GATES[phase],
    generated: DATE,
    source: SOURCE,
    levels,
    pitfalls: PITFALLS[phase],
  }
  const body = `// SPDX-License-Identifier: GPL-3.0-only
// GENERATED by scripts/gen-sim-trees.mjs on ${DATE} — do not edit by hand.
// Source: ${SOURCE}
// Self-contained dated snapshot. Re-run the generator to refresh; archive older dates.
import type { PhaseTree } from '../types'

const TREE: PhaseTree = ${JSON.stringify(tree, null, 2)}

export default TREE
`
  const file = join(OUT, `simTree.${phase}.${DATE}.ts`)
  writeFileSync(file, body)
  console.log(`wrote ${file}  (${acts.length} activities, levels ${levelsPresent.join('/')})`)
}
console.log('done.')
