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
  'algorithms-detailed': '/algorithms?tab=detailed',
  'algorithms-catalog': '/algorithms',
  timeline: '/timeline',
  report: '/report',
  // Deep-link (not embedded) to the Migration Verification Business-Center tool —
  // it embodies the 5-point evidence standard + the program-closure record.
  'migration-verification': '/business/tools/migration-verification',
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
  'migration-verification': 'migration-verification',
}
const L = (moduleId, label) => ({ kind: 'learn', label, to: `/learn/${moduleId}`, moduleId })
const A = (artifactType, label) => {
  const tool = ART_TOOL[artifactType]
  if (!tool) throw new Error(`no tool for artifact ${artifactType}`)
  return { kind: 'activity', label, to: `/business/tools/${tool}`, artifactType }
}
const R = (refId, label, toOverride) => {
  const to = toOverride ?? REF_URL[refId]
  if (!to) throw new Error(`no url for ref ${refId}`)
  // A toOverride must still resolve as a deep-link (deepLinks.ts) — e.g. the
  // /threats?view=horizon tab. The refId stays the same for embed + completion.
  return { kind: 'reference', label, to, refId }
}
// W() — a hands-on workshop practice leaf that EMBEDS in the sim (C2). The
// embed contract (embedContract.test.ts) asserts every workshopId resolves to a
// mounted Playground component, so a typo here fails the build.
const W = (workshopId, label) => {
  if (!WORKSHOP_TOOLS.has(workshopId)) throw new Error(`unknown workshop ${workshopId}`)
  return { kind: 'workshop', label, to: `/playground/${workshopId}`, workshopId }
}
// C() — a product-catalog step that EMBEDS the Migrate workbench in the sim (C7).
// `catalogId` is the stable per-task id; completion is per-task and earned when
// the embed is opened (reviewed-on-open). Only ids with a real matching workbench
// view are used: 'discovery' (the Discovery & validation tooling domain) and
// 'pilots' (the asset picker). The catalogId drives the focus the embed opens on.
const C = (label, catalogId) => ({ kind: 'catalog', label, to: '/migrate', catalogId })
// S() — a live sandbox-lab step that EMBEDS a sandbox scenario in the sim (C3).
// The embed is AVAILABILITY-GATED in the app: the step only opens/completes when a
// sandbox session is reachable (else it shows locked, never auto-completes, and
// never blocks the maturity band). `to` is the standalone /playground fallback
// (SANDBOX_TOOL_PREFIX 'sbx-'); the sim mounts the embed headless. The embed
// contract (embedContract.test.ts) validates every scenarioId against the real
// SANDBOX_SCENARIOS registry, so a typo fails the build.
const SANDBOX_IDS = new Set(['migration-impact', 'cloud-kms', 'pki', 'ab-handshake-bench'])
const S = (scenarioId, label) => {
  if (!SANDBOX_IDS.has(scenarioId)) throw new Error(`unknown sandbox scenario ${scenarioId}`)
  return { kind: 'scenario', label, to: `/playground/sbx-${scenarioId}`, scenarioId }
}

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
    4: 'Roadmap is a living instrument with quarterly updates; contingency triggers defined and tested; leading indicators monitored; program transitioning from migration execution to ongoing posture management',
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
    4: 'All strategic vendors PQC-committed with verified delivery; bridging patterns eliminated as vendor support matures; open-source dependency tracking operational; vendor governance is permanent BAU function',
  },
  foundations: {
    1: 'Cross-cutting capabilities recognized; ad hoc maturity awareness; no KPIs',
    2: 'Maturity self-assessment run; KPI baseline set; crypto-agility plan and skills plan drafted',
    3: 'KPIs reported to the board; regulatory/standards alignment maintained; crypto-agility OKRs tracked; evidence dossier kept',
    4: 'Foundations run as BAU; migration verification & program-closure standard applied; algorithm changes are routine',
  },
  'verify-close': {
    1: 'Closure discussed on milestones; no evidence standard applied; "done" is declared, not proven',
    2: 'Migration verified against the 5-point evidence standard; classical key material decommissioning logged (SP 800-88); program closure record produced',
    3: 'Independent verification of Tier-1 systems; crypto-agility/rollback drill evidenced; executive-sponsor sign-off; BAU handover funded',
    4: 'Verification & closure run as BAU; evidence dossier continuously maintained; decommissioning and attestations folded into posture monitoring',
  },
}

const GATES = {
  p0: { id: 'G0', criterion: 'Charter, budget & QRPM approved' },
  p1: {
    id: 'G1',
    criterion:
      'Scoping doc done; Priority-A inventory ≥90%; classical findings reported; continuous discovery live',
  },
  p2: {
    id: 'G2',
    criterion:
      'CBOM live for Layers 1–2; freshness governance enforced; protection controls applied',
  },
  p3: { id: 'G3', criterion: 'Risk scoring complete; QRA with prioritized backlog delivered' },
  p4: { id: 'G4', criterion: 'Multi-year roadmap approved; Year 1 plan resourced' },
  p5: { id: 'G5', criterion: 'Pilots validated; wave migration underway' },
  p6: { id: 'G6', criterion: 'Infrastructure PQC-ready; performance validated' },
  // p7 (Vendor & Supply Chain) is a CONTINUOUS phase in the framework
  // (frameworkPhases.ts: cadence 'continuous', no gate) — it has no one-time gate.
  // The earlier invented 'G7' contradicted the framework (audit fidelity gap, Q3);
  // p7 clears via its maturity level, not a gate certificate.
  // foundations (Program Foundations) is a SPANNING cross-cutting band, not a
  // gated phase — frameworkPhases.ts gives it no gate, so neither does the tree.
  // (The earlier invented 'GF' had no basis in the framework or the hub model.)
  // verify-close (Verification & Closure) is the terminal SEQUENTIAL phase with a
  // real one-time gate (frameworkPhases.ts G8) — unlike continuous p7.
  'verify-close': {
    id: 'G8',
    criterion: 'Verification complete; classical material decommissioned; closed to BAU',
  },
}

// ---- the framework activities, level-tagged, mapped to real hub leaves ------
// level = the maturity level the activity primarily delivers (from the
// per-phase Maturity Indicators); do/output paraphrased from the framework prose.
const FRAMEWORK = {
  // p0 activity ids + titles are VERBATIM the framework's Phase 0 activities
  // (0.1–0.5; sub-activities 0.2b/0.2c are folded into 0.2's scope). The earlier
  // tree renumbered these onto wrong/invented labels (0.2 "Assess Data…", an
  // invented 0.6, QRA mis-placed into p0) — see frameworkFidelity.test.ts. Every
  // hub resource that was attached is preserved, redistributed onto the real
  // activity it delivers; maturity bands stay L1 (case) → L2 (budget/governance/
  // charter) → L3 (scoping), matching the p0 Maturity Indicators.
  p0: [
    {
      id: '0.1',
      level: 1,
      title: 'Frame the Business Case',
      do: 'Structure the executive argument around the four urgency drivers — regulatory deadlines, HNDL and TNFL exposure, the threat horizon, and client/investor/insurer expectations.',
      output: 'Executive business case',
      steps: [
        L('pqc-business-case', 'Learn: PQC Business Case'),
        L('exec-quantum-impact', 'Learn: Executive Quantum Impact'),
        L('compliance-strategy', 'Learn: Compliance & Regulatory Strategy'),
        R('threats', 'Check the CRQC threat horizon', '/threats?view=horizon'),
        R('compliance', 'Map the binding regulatory deadlines'),
        A('crqc-scenario', 'Quantify HNDL/TNFL exposure with a CRQC scenario'),
      ],
    },
    {
      id: '0.2',
      level: 2,
      title: 'Build the Budget Structure',
      do: 'Structure funding as a phased multi-year program aligned to existing infrastructure refresh cycles, sized from migration cost estimates and ROI.',
      output: 'Multi-year budget commitment',
      steps: [A('roi-model', 'Model the multi-year migration budget & ROI')],
    },
    {
      id: '0.3',
      level: 2,
      title: 'Establish Governance Structure',
      do: 'Stand up the roles (Sponsor, SteerCo, QRPM) and workstreams, the RACI, the decision cadence, and the cryptography policy / risk-appetite framing.',
      output: 'Governance structure',
      steps: [
        L('pqc-governance', 'Learn: PQC Governance & Policy'),
        A('raci-matrix', 'Build the RACI matrix'),
        A('policy-draft', 'Draft the cryptography policy'),
      ],
    },
    {
      id: '0.4',
      level: 2,
      title: 'Draft the Program Charter',
      do: 'Produce the one-page charter (purpose, scope, success criteria, cadence, escalation) and secure the board mandate with the KPI pack.',
      output: 'Approved program charter & board mandate',
      steps: [
        A('program-charter', 'Produce the Program Charter'),
        A('board-deck', 'Pitch the board for the mandate'),
        A('kpi-dashboard', 'Set the board KPI pack (Coverage/Trust/Inventory/Vendors/Agility)'),
      ],
    },
    {
      id: '0.5',
      level: 3,
      title: 'Conduct Initial Scoping Assessment',
      do: 'Run a rapid 2–4 week scoping of the top ~20 critical systems — their cryptography, data sensitivity and confidentiality horizon, and the 5–10 timeline-constraining vendors.',
      output: 'Initial scoping assessment',
      steps: [
        L('data-asset-sensitivity', 'Learn: Data & Asset Sensitivity'),
        R('assess-engine', 'Run the scoping assessment engine'),
        A('initial-scoping', 'Produce the scoping & asset assessment'),
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
      do: 'Stand up Track A (crypto usage), Track B (data classification), Track C (systems/assets — CMDB, ITAM, BIA cross-reference; detailed methodology in 1.4–1.5).',
      output: null,
      steps: [
        L('crypto-mgmt-modernization', 'Learn: Track A — cryptographic management modernization'),
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
        L('cbom', 'Learn: layered cryptographic discovery (CBOM)'),
        C('Browse the Migrate discovery catalog', 'discovery'),
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
        L(
          'crypto-mgmt-modernization',
          'Learn: cross-reference CMDB / ITAM / cloud & certificate data sources'
        ),
        R('library', 'Reference: data-source & SBOM / CT-log standards in the Library'),
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
        L('cbom', 'Learn: CBOM-driven continuous discovery'),
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
        L('cbom', 'Learn: Cryptography Bill of Materials'),
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
      steps: [
        L(
          'cbom',
          'Learn: CBOM population — six-step transformation (import → enrich → SBOM link → certs → classify → vendor flags)'
        ),
        A('crypto-cbom', 'Build a CycloneDX CBOM'),
      ],
    },
    {
      id: '2.3',
      level: 3,
      title: 'Integrate CBOM into Operational Processes',
      do: 'Embed CBOM governance into CI/CD, change management, vendor onboarding and audit.',
      output: null,
      steps: [A('crypto-vulnerability-watch', 'Wire CBOM freshness into CI/CD drift checks')],
    },
    {
      id: '2.4–2.5',
      level: 3,
      title: 'CBOM Freshness Governance & Securing Program Artifacts',
      do: 'Enforce refresh triggers and protect the CBOM with classification and access control.',
      output: 'CBOM governance & protection policy',
      steps: [
        L('cbom', 'Learn: secure the CBOM & make it machine-verifiable'),
        L(
          'soc-implementation-pqc',
          'Learn: involve the SOC — posture-registry integration and CBOM exfiltration monitoring'
        ),
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
        R(
          'algorithms-detailed',
          'Reference: why 256-bit ECC ≈ RSA-2048 under quantum (security levels)'
        ),
        R('algorithms-protocol-matrix', 'Reference: PQC Protocol Matrix'),
        R(
          'timeline',
          'Reference: regulatory deadline clock — calibrate Dimension 4 (within 2 years = Critical)'
        ),
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
        R('algorithms-transition', 'Confirm your classical → PQC replacement mapping'),
        R('algorithms-detailed', 'Compare PQC candidates in detail and confirm your architecture'),
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
        R('timeline', 'See your country on the global PQC roadmap (2026–2030 deadline squeeze)'),
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
      do: 'Run quarterly reviews with leading indicators and formal G0–G6 gate criteria.',
      output: 'Quarterly review process & gate criteria',
      steps: [
        R(
          'threats',
          'Monitor the threat horizon — CRQC timeline signals that trigger accelerated execution'
        ),
        R('report', 'Track gates on the Report page'),
      ],
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
        C('Pick pilots from the Migrate catalog', 'pilots'),
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
        S(
          'migration-impact',
          'Lab: migration impact — classical vs PQC TLS (latency, cert size, bandwidth)'
        ),
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
        S('cloud-kms', 'Lab: ML-KEM key wrapping for cloud KMS (envelope encryption)'),
        A('data-at-rest-strategy', 'Decide the per-store data-at-rest strategy'),
      ],
    },
    {
      id: '5.7',
      level: 4,
      title: 'AI-Assisted Migration: Where It Helps, and the Gate That Stays Closed',
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
        S('pki', 'Lab: enterprise PQC PKI chain (Root SLH-DSA → Int ML-DSA → Leaf)'),
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
        S('ab-handshake-bench', 'Lab: A/B TLS handshake throughput (classical vs hybrid)'),
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
      steps: [R('algorithms-detailed', 'Reference: detailed algorithm size comparison')],
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
      id: '7.4',
      level: 3,
      title: 'Manage Vendor-as-Blocker Scenarios',
      do: 'When a critical vendor cannot deliver PQC in time, deploy bridging patterns (gateway, overlay, key-wrap), run champion-challenger, escalate contractually, or accept-and-document the residual risk.',
      output: 'Bridging pattern deployments',
      steps: [A('deployment-playbook', 'Deploy bridging patterns for blocked vendors')],
    },
    {
      id: '7.5',
      level: 3,
      title: 'Establish Ongoing Vendor Governance',
      do: 'Run the recurring vendor-governance cadence — track roadmaps, verify GA commitments, update the vendor scorecard, and report to SteerCo.',
      output: 'Vendor governance cadence',
      steps: [A('kpi-dashboard', 'Run the vendor-KPI / SteerCo governance cadence')],
    },
    {
      id: '7.6',
      level: 3,
      title: 'Coordinate Counterparties You Cannot Contractually Compel',
      do: 'For partners, customers and API consumers with no contractual leverage, run the coordination pattern — readiness discovery, dual-stack windows, deprecation protocol, interop test events, and API versioning.',
      output: 'Counterparty coordination plan',
      steps: [
        A('stakeholder-comms', 'Plan dual-stack windows & deprecation comms for counterparties'),
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
        L('skills-team-structure', 'Learn: skills & team structure (roles, FTE sizing)'),
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
      // Cross-cutting pointer into the terminal Verification & Closure phase (VC.x)
      // rather than re-running its artifacts here — keeps foundations' L4 band
      // without duplicating the closure flow (the audit-checklist activity lives in VC.2).
      steps: [
        R('report', 'Apply the 5-point verification standard in the Verification & Closure phase'),
      ],
    },
  ],
  'verify-close': [
    {
      id: 'VC.1',
      level: 1,
      title: 'Set the Verification Standard & Closure Plan',
      do: 'Adopt the 5-point migration-verification evidence standard and the program-closure record up front, so "done" means proven, not declared.',
      output: 'Verification standard & closure plan',
      steps: [
        L('verification-closure', 'Learn: Decommissioning & Program Closure'),
        R(
          'migration-verification',
          'Reference: the program closure record & 5-point evidence standard'
        ),
        R('compliance', 'Reference: closeout attestations & applicable mandates'),
      ],
    },
    {
      id: 'VC.2',
      level: 2,
      title: 'Assemble the Migration Evidence Dossier',
      do: 'Prove each migrated system against the evidence standard (observed PQC negotiation, negative testing, configuration attestation) and log classical key-material decommissioning (SP 800-88).',
      output: 'Migration-verification evidence dossier',
      steps: [
        L('verification-closure', 'Learn: decommission classical crypto & assemble evidence'),
        A('migration-verification', 'Assemble the evidence dossier & log decommissioning'),
        A('audit-checklist', 'Run the closure audit-readiness checklist'),
      ],
    },
    {
      id: 'VC.3',
      level: 3,
      title: 'Independent Verification & Sign-off',
      do: 'Independently verify Tier-1 systems, evidence the crypto-agility / rollback drill, and obtain executive-sponsor closure sign-off with a funded BAU handover.',
      output: 'Independent verification & signed closure',
      steps: [
        A('crypto-cbom', 'Export the final CBOM as durable closure evidence'),
        R('library', 'Reference: SP 800-88 decommissioning & evidence standards'),
      ],
    },
    {
      id: 'VC.4',
      level: 4,
      title: 'Run Verification & Closure as BAU',
      do: 'Fold verification, decommissioning and attestations into the continuous posture-monitoring loop so algorithm changes and re-verification are routine.',
      output: 'BAU verification & posture monitoring',
      steps: [
        A('kpi-tracker', 'Track post-closure crypto-posture KPIs as BAU'),
        R('algorithms-transition', 'Reference: monitor the algorithm-transition landscape'),
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
      title: 'Rely on the CMDB alone for asset discovery',
      why: 'The CMDB is rarely complete; it systematically undercounts cloud resources, shadow IT, OT devices, and vendor-managed systems. Integrate the eleven asset-discovery sources in Activity 1.4 or the CMDB gap becomes a migration gap.',
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
  'verify-close': [
    {
      title: 'Declare the migration "done" on milestones',
      why: 'Closing on milestone completion instead of verified posture — without evidence (observed negotiation, negative testing, the dossier) the migration is a belief, not a fact, and an auditor asks for proof, not milestones.',
    },
    {
      title: 'Orphan the capabilities at closure',
      why: 'Treating closure as end-of-funding rather than a funded BAU handover — CBOM, discovery and vendor governance decay within quarters without owners.',
    },
    {
      title: 'Skip classical-key decommissioning',
      why: 'Leaving old classical keys and material live keeps the harvest-now-decrypt-later exposure open even after PQC is deployed — closure requires SP 800-88 decommissioning evidence.',
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
