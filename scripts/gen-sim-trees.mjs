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
  // Added 07052026 (P6 deep-dive wave) — deepDive-only, see FRAMEWORK.p6 below.
  'pki-enrollment',
  'hybrid-certs',
  'tpm-playground',
  'cacp-kmip',
  'tee-channel',
  // Added 07062026 (learning-resource-gaps Wave 1) — deepDive-only, pairing
  // already-required Learn modules with practice tools that had no route in.
  // See simulation-learning-resource-gaps-remediation-plan-07052026.md.
  'rng-demo',
  'entropy-test',
  'qrng-demo',
  'source-combining',
  'drbg-demo',
  'vpn-sim',
  'pqc-ssh-sim',
  'hybrid-encrypt',
  'hybrid-sigs',
  'firmware-signing',
  // Added 07062026 (learning-resource-gaps Wave 2) — sector-track tools made
  // universal deep-dive practice; each id's Learn-module half stays
  // sector-conditional (see src/simulation/sectorTrack.ts), only the tool
  // moves here since it isn't actually sector-specific.
  'api-security-jwt',
  'email-signing',
  'token-migration',
  // Added 07062026 (learning-resource-gaps Wave 3) — brand-new verticals with
  // no prior route into the sim; placed as deep-dive-only content in the
  // thinnest bands of P5/Foundations. See the remediation plan's Wave 3 table.
  'mls-group-messaging',
  'slh-dsa',
  'lms-hss',
  'openssl-studio',
  // Added 07082026 (audit remediation) — real, mounted Playground tool
  // (workshopRegistry.tsx), phase-tagged p6 in phaseResourceMap.ts, but never
  // referenced by any tree until now. Distinct from the LEARN module of the
  // same id already required at P6 6.1.
  'pki-workshop',
])
const ART_TOOL = {
  'roi-model': 'roi-calculator',
  'board-deck': 'board-pitch',
  'crqc-scenario': 'crqc-scenario',
  'raci-matrix': 'raci-builder',
  'policy-draft': 'policy-generator',
  // Restored 07062026 — present in the shipped 06302026 P0 snapshot (business-
  // case tools wired in by a158af38/f52cedd4) but missing from this generator
  // source (pre-existing drift, found while auditing for the deep-dive work).
  'cost-model-comparison': 'cost-model-explorer',
  'breach-scenario': 'breach-simulator',
  'cost-of-inaction': 'cost-of-inaction',
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
// E() — an architecture step (WS-04): embeds ArchitecturePanel in-place so the
// player decides real hybrid/pure migration patterns for their unlocked
// connections. Completion is cumulative across the whole run (capped against
// the actual migratable-edge count) — see TreeStep.minDecisions.
const E = (minDecisions, label) => ({
  kind: 'architecture',
  label,
  to: '/simulation',
  minDecisions,
})

// REC() — a RECURRENCE step (W2.4). The framework's higher maturity indicators
// mostly describe an EXISTING activity operated again over time ("QRA updated
// quarterly", "auto-updated on deployment", "reported to board quarterly").
// Those cannot be satisfied by opening a page or filing one document, so this
// step clears only when its prerequisite artifact has been recorded in
// `quarters + 1` DISTINCT reporting periods of the run. `artifactType` is
// deliberately NOT set: this is not an activity step and must not satisfy one.
const REC = (recurrenceOf, quarters, label) => {
  if (!ART_TOOL[recurrenceOf]) throw new Error(`no tool for artifact ${recurrenceOf}`)
  return {
    kind: 'recurrence',
    label,
    to: `/business/tools/${ART_TOOL[recurrenceOf]}`,
    recurrenceOf,
    recurrenceQuarters: quarters,
  }
}

// M() — a MEASURE step (W2.5). Most L2-L4 indicators state an operating
// CONDITION ("Year 1 budget secured", "≥70% Tier-1 coverage", "2+ production
// pilots"), and producing a document about a condition is not reaching it. A
// measure step reads a real run value and clears only at the threshold the
// criterion itself states — so the THRESHOLD lives here, next to the band it
// came from, and a reader can check it against the quoted indicator.
const KNOWN_METRICS = new Set([
  'budget-secured-pct',
  'inventory-coverage-pct',
  'migration-decisions',
  'migration-coverage-pct',
  'evidence-records',
  'learner-evidence-records',
  'reporting-periods-elapsed',
])
const M = (metricId, minValue, label) => {
  if (!KNOWN_METRICS.has(metricId)) throw new Error(`unknown run metric ${metricId}`)
  return { kind: 'measure', label, to: '/simulation', metricId, minValue }
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
    4: 'Real-time cryptographic posture monitoring with tiered alerting; automated drift detection; coverage spans IT, OT, cloud, and third-party; discovery effectiveness metrics tracked and reported; discovery gap register trending toward zero',
  },
  p2: {
    1: 'Partial CBOM in spreadsheet form covering known systems; no standard format',
    2: 'CycloneDX CBOM operational for Layers 1–2; queryable; SBOM linkage established for key applications',
    3: 'CBOM covers Layers 1–3; integrated into CI/CD; freshness governance enforced; change management integration live',
    4: 'CBOM is a real-time operational asset; auto-updated on deployment; Layer 4 gaps systematically managed through vendor governance; CBOM drives automated compliance reporting',
  },
  p3: {
    1: 'Informal awareness of which systems are "probably vulnerable"; no structured scoring',
    2: 'Formal risk scoring model applied to Tier-1 CBOM entries; prioritized migration backlog exists; QRA document produced',
    3: 'QRA updated quarterly; all CBOM entries scored and tiered; migration sequencing drives Phase 5 execution; legal risk dimension assessed',
    4: 'Continuous risk posture management; automated re-scoring when CBOM changes or regulatory deadlines shift; QRA integrated into enterprise risk register and audit cycle',
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
    4: 'Infrastructure fully PQC-capable across IT estate; capacity planning validated at production scale; PKI automated with shortened lifetimes; middlebox monitoring integrated into continuous discovery',
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
    2: 'Migration verified against the 5-point evidence standard; classical key material decommissioning logged; program closure record produced',
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
  p5: {
    id: 'G5',
    criterion: 'Pilots validated; performance baselines established; Tier-1 rollout approved',
  },
  p6: { id: 'G6', criterion: 'Infrastructure upgrades scheduled; vendor commitments tracked' },
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
      decision:
        'Build the business case around HNDL/TNFL exposure and the regulatory clock — not a generic "quantum is coming" pitch.',
      do: 'Structure the executive argument around four concrete, current urgency drivers, not speculative Q-Day predictions: (1) regulatory & compliance deadlines, (2) Harvest-Now-Decrypt-Later (HNDL) exposure, (3) Trust-Now-Forge-Later (TNFL) exposure, (4) client, investor & insurer expectations.',
      output: 'Executive business case',
      steps: [
        L('pqc-business-case', 'Learn: PQC Business Case'),
        L('exec-quantum-impact', 'Learn: Executive Quantum Impact'),
        L('compliance-strategy', 'Learn: Compliance & Regulatory Strategy'),
        R('threats', 'Check the CRQC threat horizon', '/threats?view=horizon'),
        R('compliance', 'Map the binding regulatory deadlines'),
        R(
          'timeline',
          'Reference: the deadline classes driving urgency (EO / OMB / CNSA 2.0) — see the live timeline'
        ),
        // 07082026: was 'Quantify HNDL/TNFL exposure' — the tool this links to
        // (CRQCScenarioPlanner) only builds an HNDL exposure table, no TNFL/
        // signature-forgery content. Reworded rather than promise what it
        // doesn't deliver; a TNFL table is a real build, tracked separately.
        A('crqc-scenario', 'Quantify HNDL exposure with a CRQC scenario'),
      ],
    },
    {
      id: '0.2',
      level: 2,
      title: 'Build the Budget Structure',
      decision:
        'Ask for a phased multi-year budget backed by real cost models — not a single-year, back-of-envelope number.',
      do: 'Structure funding as a phased multi-year program aligned to existing infrastructure refresh cycles, sized from migration cost estimates and ROI.',
      output: 'Multi-year budget commitment',
      // Restored 07062026 — the shipped 06302026 snapshot carries 4 steps here
      // (cost-model-comparison and breach-scenario/cost-of-inaction bracketing
      // roi-model); this generator only had roi-model. Pre-existing drift,
      // unrelated to the deep-dive work, found while auditing for it.
      steps: [
        A('cost-model-comparison', 'Compare the six costing models before trusting a number'),
        A('roi-model', 'Model the multi-year migration budget & ROI'),
        A('breach-scenario', 'Quantify breach exposure (classical vs quantum)'),
        A('cost-of-inaction', 'Model the cost of inaction (delay vs migrate now)'),
      ],
    },
    {
      id: '0.3',
      level: 2,
      title: 'Establish Governance Structure',
      decision:
        'Stand up real governance — Sponsor, SteerCo, QRPM and a RACI — before work starts, not after.',
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
      decision:
        'Get the charter and board mandate signed with a KPI pack attached, so the board can track progress — not just approve a headline.',
      do: 'Produce the one-page charter (purpose, scope, success criteria, cadence, escalation) and secure the board mandate with the KPI pack.',
      output: 'Approved program charter & board mandate',
      steps: [
        A('program-charter', 'Produce the Program Charter'),
        A('board-deck', 'Pitch the board for the mandate'),
        A('kpi-dashboard', 'Set the board KPI pack (Coverage/Trust/Inventory/Vendors/Agility)'),
        M(
          'budget-secured-pct',
          60,
          'Secure Year 1 funding — the criterion is budget SECURED, not a charter written'
        ),
      ],
    },
    {
      id: '0.5',
      level: 3,
      title: 'Conduct Initial Scoping Assessment',
      decision:
        'Scope fast and narrow — the top ~20 critical systems and the vendors that constrain your timeline — rather than wait for a complete inventory.',
      do: 'Run a rapid 2–4 week scoping of the top ~20 critical systems — their cryptography, data sensitivity and confidentiality horizon, and the 5–10 timeline-constraining vendors.',
      output: 'Initial scoping assessment',
      steps: [
        L('data-asset-sensitivity', 'Learn: Data & Asset Sensitivity'),
        R('assess-engine', 'Run the scoping assessment engine'),
        A('initial-scoping', 'Produce the scoping & asset assessment'),
        M(
          'budget-secured-pct',
          90,
          'Commit the multi-year budget — L3 requires committed funding, not a scoping document alone'
        ),
      ],
    },
    {
      level: 4,
      id: '0.3-board-cycle',
      adaptationOf: '0.3',
      title: 'Operate the governance cadence: recurring board reporting',
      decision:
        'Report quantum risk to the board on the same cadence as other strategic risks — a one-off briefing is not governance.',
      do: 'Advance a reporting period and take the board update again, so quantum risk is carried in the enterprise risk register with an owner, a review date and a follow-up rather than being raised once.',
      output: 'Recurring board update + enterprise-risk entry',
      steps: [
        REC('board-deck', 1, 'Report to the board again in a later quarter (recurring cadence)'),
        R(
          'report',
          'Reference: your program report — the record the board decision is minuted against'
        ),
      ],
    },
  ],
  p1: [
    {
      id: '1.0',
      level: 1,
      title: 'Risk-Driven Scoping — Decide What to Inventory First',
      decision:
        'Prioritize discovery by risk — the Tier-1 systems first — instead of scanning everything with equal priority.',
      do: 'Apply 80/20 prioritization to pick the Tier-1 systems and assign discovery priority tiers.',
      output: 'Risk-driven scoping document',
      // A() added (07192026, completeness gap-closing): this band had no
      // artifact-producing step at all, only a reference to the same
      // assess-engine tool 0.5 already produces 'initial-scoping' from. Since
      // this activity is explicitly about REFINING that same scoping with
      // risk-driven prioritization (not a fresh assessment), reusing the
      // artifact — not inventing a second scoping-document tool — is the
      // honest fit; multi-phase reuse of one real artifact is the
      // established pattern here (kpi-dashboard/kpi-tracker/crypto-cbom).
      steps: [
        L('data-asset-sensitivity', 'Learn: Data & Asset Sensitivity'),
        R('assess-engine', 'Run the scoping assessment engine'),
        A('initial-scoping', 'Refine the scoping document with risk-driven prioritization'),
      ],
    },
    {
      id: '1.1',
      level: 2,
      title: 'Establish Three Parallel Inventory Tracks',
      decision:
        'Run crypto-usage, data-classification and systems/assets discovery as three parallel tracks, not one sequential sweep.',
      do: 'Stand up Track A (crypto usage), Track B (data classification), Track C (systems/assets — CMDB, ITAM, BIA cross-reference; detailed methodology in 1.4–1.5).',
      // Track B's own deliverable is a sensitive-data classification map (confidentiality
      // horizons per data category — the input Phase 3 Dimension 1/HNDL scoring consumes).
      // Re-checked (completeness gap-closing pass, 07182026): DataAtRestStrategy.tsx already
      // captures exactly this — a per-data-store table of name/confidentiality-sensitivity/
      // strategy — real, artifact-producing (BusinessCenter tool, ExecutiveDocumentType
      // 'data-at-rest-strategy'). Reusing the same artifactType across phases is an
      // established pattern here (kpi-dashboard/kpi-tracker/crypto-cbom all do this) — P4
      // revisits the SAME map later to decide remediation strategy per store, which is the
      // natural real-world sequence (classify during discovery, act on it during execution),
      // not a duplicate ask.
      output: 'Sensitive-data classification map (Track B)',
      steps: [
        L('crypto-mgmt-modernization', 'Learn: Track A — cryptographic management modernization'),
        L(
          'data-asset-sensitivity',
          'Learn: Track B — data classification & confidentiality horizons'
        ),
        A('data-at-rest-strategy', 'Build the sensitive-data classification map (Track B)'),
      ],
    },
    {
      id: '1.2',
      level: 2,
      title: 'Deploy Cryptographic Discovery — Layered Approach',
      decision:
        'Layer discovery across network, code, config and runtime — a single scan type always misses real crypto usage.',
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
      decision:
        'Record the full field set — algorithm, key size, protocol, owner — for every instance, not just a name and a checkbox.',
      do: 'Document algorithm, key size, protocol, library, cert, owner and vulnerability for each instance.',
      output: 'Cryptographic asset inventory',
      steps: [
        A('crypto-architecture', 'Draw the crypto architecture diagram'),
        L(
          'secrets-management-pqc',
          'Learn: keys, secrets & HSM inventory — crypto you hold, not just crypto you run'
        ),
      ],
    },
    {
      id: '1.4–1.5',
      level: 2,
      title: 'Address Asset Discovery & Integrate Existing Data Sources',
      decision:
        'Cross-reference CMDB, ITAM, cloud and certificate data sources — a single system of record always undercounts the real estate.',
      do: 'Cross-reference CMDB, ITAM, cloud APIs, CT logs, BIA and certificate data for coverage — including OT and embedded systems, which none of those systems of record fully see.',
      output: 'Cross-referenced asset coverage',
      steps: [
        L(
          'crypto-mgmt-modernization',
          'Learn: cross-reference CMDB / ITAM / cloud & certificate data sources'
        ),
        // toOverride: explicit ?topic= scopes the embed to this step's subject
        // (WP5.5) — was previously inferred from the label text via a regex that
        // silently un-scoped the embed on any rewording.
        R(
          'library',
          'Reference: data-source & SBOM / CT-log standards in the Library',
          '/library?topic=SBOM'
        ),
        L('iot-ot-pqc', 'Learn: OT & embedded systems — the hardest assets to discover'),
      ],
    },
    {
      id: '1.6',
      level: 3,
      title: 'Establish Continuous Discovery',
      decision:
        'Wire discovery into CI/CD and passive monitoring so it runs continuously — a one-time inventory goes stale within months.',
      do: 'Wire discovery into CI/CD and passive monitoring with quarterly rescans and tiered alerting.',
      output: 'Continuous discovery operating model',
      steps: [
        A('crypto-vulnerability-watch', 'Set up the Crypto-Vulnerability Watch'),
        L('cbom', 'Learn: CBOM-driven continuous discovery'),
        // Restored 07062026 — present in the shipped 06302026 snapshot but
        // missing from this generator source (pre-existing drift, unrelated to
        // the Wave 1 deep-dive work below; fixed here so regenerating doesn't
        // silently drop it).
        L(
          'entropy-randomness',
          'Learn: what CVE-based vulnerability watch misses (side-channel, quantum progress)'
        ),
      ],
      // Reworked 07082026 (audit remediation): the 5 entropy/RNG practice tools
      // below were topically about randomness-generation mechanics, not
      // discovery — P1 shipped zero deep-dive content actually about finding/
      // scanning crypto, and phaseResourceMap.ts tags entropy-randomness itself
      // as serving 'foundations' only, so it didn't even show in P1's own Learn
      // column. Replaced with content genuinely about code-level discovery.
      // platform-eng-pqc kept (infrastructure-wide crypto visibility is
      // discovery-adjacent); the 5 entropy tools remain registered Playground
      // tools, just no longer referenced from P1.
      deepDive: [
        L(
          'crypto-dev-apis',
          'Deep dive — Learn: finding hardcoded crypto in application code & APIs'
        ),
        L('platform-eng-pqc', 'Deep dive — Learn: Platform Engineering & PQC'),
      ],
    },
    {
      level: 4,
      id: '1.6-drift-cycle',
      adaptationOf: '1.6',
      title: 'Operate continuous discovery: drift detection over time',
      decision:
        'Re-run discovery after the estate changes and measure what moved — coverage you measured once is already out of date.',
      do: 'Advance a reporting period, re-run the vulnerability watch, and account for the drift: what appeared, what changed, and how much of the estate is still unknown.',
      output: 'Drift report + updated coverage and gap register',
      steps: [
        REC(
          'crypto-vulnerability-watch',
          1,
          'Re-run the crypto vulnerability watch in a later quarter (drift detection)'
        ),
        R('migrate', 'Reference: the product estate the re-run inventory is measured against'),
      ],
    },
  ],
  p2: [
    {
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free: this band is a FORMAT DECISION
      // ("which spec do we standardize on"), not a scan/export. 2.2's
      // A('crypto-cbom', ...) is the real scanner; stretching it to cover
      // both would conflate "decide the format" with "run the scan."
      id: '2.1',
      level: 1,
      title: 'Select CBOM Format and Tooling',
      decision:
        'Standardize on CycloneDX rather than a spreadsheet — you need something queryable, diffable and machine-verifiable.',
      do: 'Adopt CycloneDX (1.7, the current spec — cryptoProperties plus the newer Citations/provenance fields) and establish the record structure — at minimum, algorithm, key size, protocol, library and owner per entry — and tooling.',
      output: 'CycloneDX CBOM format spec',
      steps: [
        L('cbom', 'Learn: Cryptography Bill of Materials'),
        L('crypto-mgmt-modernization', 'Learn: CBOM in Cryptographic Management'),
        R(
          'library',
          'Reference: CycloneDX in the Library (1.7, cryptoProperties)',
          '/library?topic=CycloneDX'
        ),
      ],
    },
    {
      id: '2.2',
      level: 2,
      title: 'Populate CBOM from Inventory Data',
      decision:
        'Turn the raw inventory into real CycloneDX records linked to the SBOM — not a static export nobody re-runs.',
      do: 'Transform Phase 1 inventory into enriched CycloneDX records linked to the SBOM.',
      output: 'Populated CycloneDX CBOM',
      steps: [
        L(
          'cbom',
          'Learn: CBOM population — six-step transformation (import → enrich → SBOM link → certs → classify → vendor flags)'
        ),
        A('crypto-cbom', 'Build a CycloneDX CBOM'),
        // Added 07082026 (audit remediation): the real CycloneDX exporter
        // (Migrate workbench) was previously reachable only via a non-gating
        // reference row — a player could clear Gate G2 without ever touching
        // the export surface frameworkPhases.ts advertises as this phase's
        // deliverable. Now required. Upgraded 07182026 (Wave 5, WP5.2) from a
        // bare reference to a catalog embed focused on the Plan tab's real
        // "Export plan + CBOM" button (PlanTab.tsx) — landing on the generic
        // /migrate entry point left the player to find the export themselves.
        C('Export your CBOM as CycloneDX from the Migrate workbench', 'cyclonedx-export'),
      ],
      // Added 07082026 — P2 was the only phase with zero deep-dive content.
      deepDive: [
        L(
          'crypto-dev-apis',
          'Deep dive — Learn: enriching the CBOM from code-level crypto API calls'
        ),
      ],
    },
    {
      id: '2.3',
      level: 3,
      title: 'Integrate CBOM into Operational Processes',
      decision:
        'Embed the CBOM into CI/CD and change management so it updates itself — a manually-maintained CBOM decays fast.',
      do: 'Embed CBOM governance into CI/CD, change management, vendor onboarding and audit.',
      output: null,
      steps: [A('crypto-vulnerability-watch', 'Wire CBOM freshness into CI/CD drift checks')],
    },
    {
      id: '2.4–2.5',
      level: 3,
      title: 'CBOM Freshness Governance & Securing Program Artifacts',
      decision:
        "Treat the CBOM as sensitive — classify it, restrict access, log queries — it's effectively an attacker's shopping list.",
      do: 'Enforce refresh triggers and protect the CBOM with classification and access control; sign/attest the CBOM so "machine-verifiable" includes provenance, not just structure.',
      output: 'CBOM governance & protection policy',
      steps: [
        L('cbom', 'Learn: secure the CBOM & make it machine-verifiable'),
        L(
          'soc-implementation-pqc',
          'Learn: involve the SOC — posture-registry integration and CBOM exfiltration monitoring'
        ),
        REC(
          'crypto-vulnerability-watch',
          1,
          'Re-run the watch in a later quarter — L3 requires freshness governance ENFORCED'
        ),
      ],
    },
    {
      level: 4,
      id: '2.3-cbom-refresh',
      adaptationOf: '2.3',
      title: 'Operate the CBOM: refreshed on deployment',
      decision:
        'A CBOM is a live operational asset — if it is not refreshed when something ships, it is documentation, not inventory.',
      do: 'Advance a reporting period, re-issue the CBOM after a deployment or vendor change, and report its freshness plus any supplier evidence still unresolved.',
      output: 'Refreshed CBOM + freshness and supplier-gap report',
      steps: [
        REC('crypto-cbom', 1, 'Re-issue the CBOM in a later quarter (auto-update on deployment)'),
        R('migrate', 'Reference: the deployment/vendor changes the refresh must account for'),
      ],
    },
  ],
  // Phase 3 tops out at L2 by design, not by omission: Framework 2.1 defines
  // exactly four Phase 3 activities (3.1-3.4; confirmed against the YAML —
  // there is no 3.5/3.6). The framework's own L3 ("QRA updated quarterly...")
  // and L4 ("...automated re-scoring... QRA integrated into enterprise risk
  // register") indicators describe 3.4 maturing operationally over time, not
  // additional named activities — the same pattern already accepted for
  // Phases 0/1/2/6, which also have no activity carrying their L4 (p0/p1/p2)
  // or, for p6, top out at L3. Re-tagging 3.4 across L2-L4 (or splitting it)
  // would be an editorial reinterpretation with no basis in an explicit
  // per-activity level in the source — left for a deliberate product call,
  // not invented here. See simulation-mode-improvement-plan-07042026.md, W3-3.
  p3: [
    {
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free: this band DEFINES the scoring
      // model (a decision, taught via Learn + reference); 3.2's real
      // A('risk-register', ...) is where the model actually gets applied
      // and produces a saved artifact. No separate "model definition" tool
      // exists, and shouldn't — it would just be prose in a different shape.
      id: '3.1',
      level: 1,
      title: 'Define Risk Scoring Model',
      decision:
        'Score risk across all four dimensions — HNDL exposure, trust criticality, feasibility, regulatory pressure — not just severity.',
      do: 'Establish the four-dimension model: (1) HNDL exposure, (2) TNFL/trust-infrastructure criticality, (3) migration feasibility, (4) regulatory & compliance pressure. (Practice note, not a framework requirement: some programs calibrate a fifth dimension — business impact/consequence of a breach — on top of these four; the framework itself defines exactly four.)',
      output: 'Risk scoring model',
      steps: [
        L('pqc-risk-management', 'Learn: PQC Risk Management'),
        L('data-asset-sensitivity', 'Learn: data sensitivity & legal/data-retention horizon'),
        R(
          'threats',
          "Reference: Mosca's inequality — shelf-life + migration time > time to Q-Day means you're already late",
          '/threats?view=horizon'
        ),
        R(
          'algorithms-detailed',
          'Reference: why 256-bit ECC ≈ RSA-2048 under quantum (security levels)'
        ),
        R('algorithms-protocol-matrix', 'Reference: PQC Protocol Matrix'),
        R(
          'timeline',
          'Reference: regulatory deadline clock — calibrate Dimension 4, Regulatory & Compliance Pressure (within 2 years = Critical)'
        ),
      ],
    },
    {
      id: '3.2',
      level: 2,
      title: 'Calculate Priority Scores',
      decision:
        "Compute a composite score and tier the whole CBOM — don't sequence by gut feel or alphabetical order.",
      do: 'Compute composite scores and classify systems into migration tiers.',
      output: 'Scored and tiered CBOM',
      steps: [A('risk-register', 'Produce a Risk Register')],
    },
    {
      id: '3.3',
      level: 2,
      title: 'Apply Migration Sequencing Logic',
      decision:
        'Sequence key-exchange and signature migrations as two separate tracks — they move on different timelines.',
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
      decision:
        'Turn the scoring into a living QRA you update as standards and deadlines shift — not a one-time report you freeze.',
      do: 'Consolidate scoring into a defensible QRA: heatmap, backlog, gap analysis, compliance mapping.',
      output: 'Quantum Readiness Assessment (QRA)',
      steps: [
        R('compliance', 'Map the QRA to NIST / CNSA 2.0 / ETSI / sector rules'),
        // Reworded 07082026: was 'Assemble the QRA on the Report page', written
        // before QRASection.tsx existed. It now auto-builds the QRA (exec
        // summary, heatmap, backlog, gap analysis, compliance mapping) from the
        // player's own assessment data — a visit, not manual assembly.
        R(
          'report',
          'View your auto-assembled QRA — heatmap, backlog, gap analysis, compliance mapping — on the Report page'
        ),
      ],
    },
    {
      level: 3,
      id: '3.4-qra-recurring',
      adaptationOf: '3.4',
      title: 'Operate the QRA: quarterly refresh across the inventory',
      decision:
        'Re-score on a cadence using the expanded inventory and the legal/retention view — a QRA produced once describes an estate you no longer have.',
      do: 'Advance a reporting period and refresh the QRA against the wider inventory, adding the legal/data-retention dimension, then explain which priorities changed and why.',
      output: 'Refreshed QRA with changed priorities explained',
      steps: [
        REC('risk-register', 1, 'Refresh the risk register in a later quarter (quarterly QRA)'),
        L(
          'data-asset-sensitivity',
          'Learn: legal and data-retention horizon — the L3 risk dimension'
        ),
      ],
    },
    {
      level: 4,
      id: '3.2-event-rescore',
      adaptationOf: '3.2',
      title: 'Operate risk posture: event-driven re-scoring',
      decision:
        'Re-score when the world changes — a new deadline or a changed exposure should move the backlog without waiting for the next quarter.',
      do: 'After an event changes exposure or applicability, re-score the affected assets and carry the change into the enterprise risk and review evidence.',
      output: 'Event-driven re-score + enterprise-risk propagation',
      steps: [
        REC(
          'risk-treatment-plan',
          2,
          'Re-issue the risk treatment plan after a later event (event-driven re-scoring)'
        ),
        R('timeline', 'Reference: the regulatory clock whose movement triggers a re-score'),
      ],
    },
  ],
  p4: [
    {
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free: no tool exists for a "90-day
      // starter plan" distinct from 4.2's real A('migration-roadmap', ...)
      // (the multi-YEAR roadmap). Reusing that tool here would conflate two
      // different planning horizons under one artifact.
      id: '4.1',
      level: 1,
      title: 'Define Year-1 Starter Plan (90-Day Governance Sprint)',
      decision:
        'Nail down a concrete 90-day starting plan — leadership, a training cohort, two pilots — not just a vision statement.',
      do: 'Confirm leadership, training cohort, CBOM v1, two pilots, updated policy and baseline KPIs.',
      output: 'Year-1 starter plan',
      steps: [L('migration-program', 'Learn: Migration Program Management')],
    },
    {
      id: '4.2',
      level: 2,
      title: 'Structure the Multi-Year Roadmap',
      decision:
        'Build a phased multi-year roadmap with a real critical path — not a wishlist of dates.',
      do: 'Define a phased 5-year plan with annual milestones and a critical path.',
      output: 'Multi-year roadmap',
      steps: [
        R('timeline', 'See your country on the global PQC roadmap (2026–2030 deadline squeeze)'),
        A('migration-roadmap', 'Build a multi-year Roadmap'),
        A('cost-model-comparison', 'Cost the multi-year ask before the board sees the roadmap'),
        A('stakeholder-comms', 'Plan the roadmap stakeholder communications'),
      ],
    },
    {
      id: '4.3',
      level: 2,
      title: 'Align to Infrastructure Refresh Cycles',
      decision:
        "Piggyback PQC work on refresh cycles that are already funded — don't ask for a separate budget line for everything.",
      do: 'Map PQC tasks onto already-funded refresh programs to embed cost avoidance.',
      output: 'Refresh-cycle alignment table',
      steps: [A('refresh-cycle-alignment', 'Map PQC tasks onto funded refresh cycles')],
    },
    {
      id: '4.4',
      level: 2,
      title: 'Establish PMO Structure for Scale',
      decision:
        'Stand up a real PMO — WBS, dependency map, risk register — before the program outgrows ad hoc tracking.',
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
      decision:
        "Review the roadmap quarterly against leading indicators and formal gate criteria — don't just check it once a year.",
      do: 'Run quarterly reviews with leading indicators and formal G0–G6 gate criteria.',
      output: 'Quarterly review process & gate criteria',
      // A() added (07192026, completeness gap-closing): this L3 band had no
      // artifact-producing step, only references. kpi-tracker ("Track
      // migration KPIs with configurable metrics and reporting templates")
      // is a genuinely strong fit for "run this on a quarterly cadence
      // against criteria" — already reused across Foundations/P6/Verify-Close
      // for exactly this kind of recurring, cross-phase tracking, not
      // invented here.
      steps: [
        R(
          'threats',
          'Monitor the threat horizon — CRQC timeline signals that trigger accelerated execution'
        ),
        R('report', 'Track gates on the Report page'),
        A('kpi-tracker', 'Track the roadmap on a quarterly cadence against gate criteria'),
        REC(
          'kpi-tracker',
          1,
          'Run the quarterly review again — L3 is reviews OPERATIONAL, not scheduled'
        ),
      ],
    },
    {
      id: '4.7',
      level: 4,
      title: 'Pre-Draft the Accelerated Execution Profile',
      decision:
        'Pre-approve an accelerated execution plan now, before you need it — a CRQC-timeline surprise is the wrong moment to start drafting one.',
      do: 'Pre-approve a contingency package with triggers, compressed sequence and activation authority. By Year 4–5, plan the roadmap\'s own transition from a project (with an end date) to ongoing posture management (with no end date) — disbanding the program at "done" orphans the capability the moment the next algorithm break or deadline shift hits.',
      output: 'Accelerated Execution Profile',
      steps: [
        A('accelerated-execution-profile', 'Pre-draft the accelerated execution profile'),
        REC(
          'accelerated-execution-profile',
          1,
          'Re-issue the execution profile in a later quarter — L4 is a LIVING instrument, not a filed plan'
        ),
      ],
    },
  ],
  p5: [
    {
      id: '5.1',
      level: 1,
      title: 'Select Pilot Targets',
      decision:
        'Pilot on Tier-1 systems you fully control and can measure — not the easiest, lowest-stakes systems you can find.',
      do: 'Pick 2–4 Tier-1 pilots with full control, measurable baselines and rollback capability.',
      output: null,
      steps: [
        L('hybrid-crypto', 'Learn: Hybrid Cryptography'),
        C('Pick pilots from the Migrate catalog', 'pilots'),
      ],
      // Deep dive (Wave 1, 07062026): two hands-on companions to the required
      // Hybrid Cryptography lesson above — encryption then signatures.
      deepDive: [
        W('hybrid-encrypt', 'Deep dive — Practice: hybrid KEM + ECDH encryption'),
        W(
          'hybrid-sigs',
          'Deep dive — Practice: hybrid signature spectrums (composite signatures are far less standardized than hybrid KEMs — IETF LAMPS composites are still drafts)'
        ),
      ],
    },
    {
      id: '5.2',
      level: 1,
      title: 'Design Hybrid Deployments',
      decision:
        "Design the hybrid pattern and confirm your libraries actually support it before you pilot — don't discover a gap mid-rollout.",
      do: 'Design hybrid patterns (e.g. X25519+ML-KEM-768) and verify library readiness.',
      output: null,
      steps: [
        R('algorithms-protocol-matrix', 'Reference: which protocols have a PQC path'),
        L(
          'tls-basics',
          'Learn: TLS 1.3 hybrid — the recommended first pilot (X25519+ML-KEM-768, downgrade attack mitigations)'
        ),
        L('vpn-ssh-pqc', 'Learn: VPN/IPsec & SSH PQC patterns'),
        L('code-signing', 'Learn: code & firmware signing (Track B — integrity)'),
        A('hybrid-transition', 'Plan the hybrid transition'),
        // Moved from 5.4 07082026: MTI (minimum-interop) negotiation is
        // protocol-design work — it belongs with the rest of 5.2's hybrid
        // deployment design, not with 5.4's wave-sequencing (which it never
        // actually taught; see 5.4 below).
        A(
          'mti-negotiator',
          'Negotiate the minimum-interop baseline for your hybrid protocol design'
        ),
      ],
      // Deep dive (Wave 1, 07062026): pairs the required vpn-ssh-pqc and
      // code-signing lessons above with practice tools that had no route in.
      deepDive: [
        W('pqc-ssh-sim', 'Deep dive — Practice: PQC SSH simulator'),
        W('firmware-signing', 'Deep dive — Practice: firmware signing'),
      ],
    },
    {
      id: '5.3',
      level: 2,
      title: 'Execute Pilots with Measurement',
      decision:
        "Measure pilots against real SLOs and prove rollback works — a pilot that only checks 'did it not crash' isn't validated.",
      do: 'Run pilots against SLOs (latency p50/p95/p99, CPU, throughput, error/fallback rate), budget for client-compatibility testing alongside server metrics, test rollback and validate compatibility. Canary the rollout at low traffic first — 6.4 covers the baseline/canary methodology in more depth for the phases running in parallel.',
      output: 'Pilot results reports',
      steps: [
        W('tls-simulator', 'Practice: measure the TLS 1.3 hybrid handshake'),
        S(
          'migration-impact',
          'Lab: migration impact — classical vs PQC TLS (latency, cert size, bandwidth)'
        ),
        A('deployment-playbook', 'Draft a Deployment Playbook'),
        R(
          'report',
          'Define pilot exit criteria — what threshold means go — before the rollout decision'
        ),
        E(2, 'Decide the migration pattern (hybrid vs pure) for your first unlocked connections'),
      ],
      // Deep dive (Wave 2, 07062026): 3 tools already used in sector-specific
      // Learn tracks (telecom/retail/generic IAM — see sectorTrack.ts), made
      // available here as universal practice regardless of assessed sector.
      deepDive: [
        W('api-security-jwt', 'Deep dive — Practice: API Security & JWT Workshop'),
        W('email-signing', 'Deep dive — Practice: S/MIME & CMS email signing'),
        W('token-migration', 'Deep dive — Practice: multi-algorithm token/signing migration'),
        // Added 07062026 (Wave 3) — untouched verticals, no required-module anchor.
        L('ai-security-pqc', 'Deep dive — Learn: AI Security & PQC'),
        L('mls-group-messaging', 'Deep dive — Learn: MLS Group Messaging'),
        W('mls-group-messaging', 'Deep dive — Practice: MLS Group Messaging workshop'),
      ],
    },
    {
      id: '5.4',
      level: 3,
      title: 'Scale from Pilot to Production Through Waves',
      // Reworked 07082026: previously delegated entirely to mti-negotiator
      // (moved to 5.2 — it's MTI algorithm selection, not wave sequencing) and
      // an automotive-pqc deep-dive that simRelevance.ts hardcodes as never
      // relevant to any sim sector. Neither taught the wave model this
      // activity is actually about. No dedicated wave-planning tool exists in
      // the hub yet (a real gap — see the remediation plan's Wave 4 items), so
      // the six stages are taught directly here, now that this text renders in
      // the manual-play card, not just the auto-run intro.
      decision:
        'Roll out in controlled waves, each gated on the one before — not a single big-bang cutover to production.',
      do: 'Sequence deployment through six controlled waves, each with a defined scope and an explicit prerequisite gate from the one before: Lab/Staging → Internal Non-Critical → Internal Production → External Controlled (partners) → External Broad (public-facing) → Long Tail (legacy, OT, embedded).',
      output: 'Wave deployment plan',
      steps: [
        // No toOverride: no dedicated staged-rollout/wave-sequencing library topic
        // exists yet, so this intentionally opens the unscoped library (matches
        // its pre-WP5.5 behavior — the old title-regex never matched this label
        // either).
        R('library', 'Reference: staged-rollout & wave-sequencing patterns in the Library'),
        E(4, 'Extend pattern decisions across the wave — cover more of your unlocked connections'),
        M(
          'migration-coverage-pct',
          40,
          'Migrate Tier-1 connections for real — the criterion is systems ON hybrid/PQC, not a rollout plan'
        ),
      ],
    },
    {
      id: '5.5–5.6',
      level: 3,
      title: 'Defense-in-Depth & Data-at-Rest Strategy',
      decision:
        'Decide a defense-in-depth strategy per data store — tokenize, wrap or accept-and-monitor — not one blanket policy for everything.',
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
      decision:
        'Let AI triage and draft, but keep full human review on any AI-modified cryptographic code — that review gate never closes.',
      do: 'Use AI to triage and enrich, but keep full review rigor on AI-modified cryptographic code.',
      output: null,
      steps: [
        A('crypto-api-refactor', 'Audit AI-assisted crypto refactors'),
        M(
          'migration-coverage-pct',
          80,
          'Carry the rollout across the estate — L4 is deployment substantially COMPLETE, not documented'
        ),
      ],
      // Added 07062026 (Wave 3) — untouched verticals, no required-module
      // anchor; placed here since 5.7 is P5's thinnest band (1 required step).
      // NOTE: the plan also proposed the digital-id/bitcoin-flow/solana-flow/
      // hd-wallet *tools* here, but those 4 are registered in workshopRegistry's
      // ONBACK_COMPONENTS (a separate contract for the standalone Playground
      // route, which supplies its own onBack callback) rather than
      // TOOL_COMPONENTS/WORKSHOP_TOOL_COMPONENTS — embedContract.test.ts (C2)
      // correctly rejects a workshop step that can't embed in the sim. Kept
      // only the two Learn halves, which use the separate (and compatible)
      // SIM_LEARN_MODULES registry.
      deepDive: [
        L('digital-id', 'Deep dive — Learn: Digital ID'),
        L('digital-assets', 'Deep dive — Learn: Digital Assets'),
        M(
          'migration-coverage-pct',
          80,
          'Carry the rollout across the estate — L4 is deployment substantially COMPLETE, not documented'
        ),
      ],
    },
  ],
  p6: [
    {
      id: '6.1',
      level: 2,
      title: 'PKI Modernization',
      decision:
        'Shorten cert lifetimes and run a dual-stack CA — test every chain across your actual middleboxes before you rely on it.',
      do: 'Shorten certificate lifetimes, deploy dual-stack CA, and test chains across middleboxes.',
      output: 'PKI modernization plan',
      steps: [
        L('pki-workshop', 'Learn: PKI Workshop'),
        // A9 residual (07192026): the verdict text was already softened to "one
        // leading candidate alongside X.509+ML-DSA" — this label had kept the
        // stronger "the web-PKI path" framing. MTC is an IETF PLANTS WG draft,
        // one candidate, not the settled answer.
        L('merkle-tree-certs', 'Learn: Merkle Tree Certificates (a leading web-PKI candidate)'),
        W('merkle-proof', 'Practice: Merkle Tree Certificates workshop'),
        S('pki', 'Lab: enterprise PQC PKI chain (Root SLH-DSA → Int ML-DSA → Leaf)'),
        A('infra-modernization-plan', 'Draft the infrastructure modernization plan'),
      ],
      // Deep dive (optional, non-gating — added 07052026, P6 depth wave).
      // NOTE: Wave 1 proposed adding the pki-workshop *tool* here too (an
      // accessibility fallback for the sandbox lab above), but 6.1's required
      // Learn step already uses moduleId 'pki-workshop' — the drift guard
      // (trees.test.ts) correctly rejects a deepDive id that duplicates a
      // required id in the same band, even across the learn/workshop
      // namespaces. Skipped rather than weakening that guard.
      deepDive: [
        W('pki-enrollment', 'Deep dive — Practice: PKI enrollment protocols'),
        W('hybrid-certs', 'Deep dive — Practice: hybrid (classical + PQC) certificate chains'),
        // Added 07082026 — the real Playground PKI Workshop tool (distinct from
        // the Learn module of the same id required above) was registered and
        // phase-tagged p6 but never referenced by any tree.
        W('pki-workshop', 'Deep dive — Practice: PKI Workshop (hands-on cert lifecycle)'),
      ],
    },
    {
      id: '6.2',
      level: 2,
      title: 'HSM and KMS Modernization',
      decision:
        "Inventory every HSM's real PQC capability before upgrading — don't assume the vendor spec sheet matches your firmware version.",
      do: "Inventory HSMs by PQC capability, upgrade firmware and configure cloud KMS for PQC. Upgraded firmware re-enters FIPS validation — check the module's certificate status on the live CMVP list, not just the vendor's spec sheet, before treating it as production-ready in a FIPS-required environment.",
      output: 'HSM/KMS upgrade schedule',
      steps: [
        L('hsm-pqc', 'Learn: HSM & PQC Operations'),
        L('kms-pqc', 'Learn: KMS & PQC'),
        W('hsm-capacity', 'Practice: HSM capacity calculator'),
        W('envelope-encrypt', 'Practice: PQC key-wrapping — bridge for HSMs not yet upgradeable'),
      ],
      // secrets-management-pqc moved to 1.3 (Wave 3, P1) — inventorying keys/secrets/HSMs
      // is a discovery-phase concern, not a 6.2 deployment one; kept as one home, not two.
      deepDive: [
        W('tpm-playground', 'Deep dive — Practice: hardware root-of-trust (TPM)'),
        W('cacp-kmip', 'Deep dive — Practice: Crypto-Agility Control Plane (KMIP)'),
      ],
    },
    {
      id: '6.3',
      level: 2,
      title: 'Network Infrastructure Assessment',
      decision:
        'Test PQC handshake sizes against every production middlebox — a firewall with hardcoded buffer limits will silently drop the larger packets.',
      do: 'Test PQC handshake sizes and protocol impacts across all production middleboxes.',
      output: 'Network compatibility report',
      steps: [
        L('network-security-pqc', 'Learn: Network Security & PQC'),
        R('algorithms-protocol-matrix', 'Reference: protocol PQC support'),
        W('cert-capacity', 'Practice: certificate chain / handshake size'),
        S('ab-handshake-bench', 'Lab: A/B TLS handshake throughput (classical vs hybrid)'),
      ],
      deepDive: [
        L('web-gateway-pqc', 'Deep dive — Learn: API Gateways & Reverse Proxies + PQC'),
        // Added 07062026, Wave 1 — pairs the required network-security-pqc
        // lesson above with a practice tool that had no route into the sim.
        W('vpn-sim', 'Deep dive — Practice: PQC VPN simulator'),
      ],
    },
    {
      id: '6.4',
      level: 3,
      title: 'Performance Testing Methodology',
      decision:
        "Baseline performance and canary at low traffic before a full rollout — don't find out about a latency regression at 100% load.",
      do: 'Baseline metrics, run canary at 1–5% traffic and evaluate against SLOs.',
      output: 'Performance baseline and projections',
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free: the only real tools here are
      // Playground WORKSHOP calculators (cert-capacity, tee-channel — kind
      // 'workshop', interactive/ephemeral, not artifact-producing). No hub
      // tool saves a performance-baseline document.
      steps: [
        L('pqc-testing-validation', 'Learn: PQC Testing & Validation'),
        // toOverride: a real ACVP cert (Entrust nShield 5, ML-DSA/ML-KEM/SLH-DSA —
        // matches simArchitecture.ts's mid-size 'Entrust nShield' node) so the step
        // opens on real algorithm/size data, not an empty ?cert= (WP5.5).
        R(
          'compliance-cert-check',
          'Reference: algorithm sizes & FIPS/CC certs',
          '/compliance?cert=A7285'
        ),
      ],
      deepDive: [
        W('tee-channel', 'Deep dive — Practice: TEE↔HSM trusted channel'),
        L('secure-boot-pqc', 'Deep dive — Learn: Secure Boot & PQC'),
      ],
    },
    {
      id: '6.5',
      level: 3,
      title: 'Capacity Planning for PQC at Scale',
      decision:
        "Benchmark PQC's CPU/memory/bandwidth impact on production-class hardware — a laptop benchmark won't catch a capacity cliff at scale.",
      do: 'Estimate CPU, memory, bandwidth and storage impact; benchmark on production hardware.',
      output: 'Capacity plan',
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free, same reasoning as 6.4: the only
      // real tool (hsm-capacity, a Playground WORKSHOP calculator) is
      // interactive/ephemeral, not artifact-producing; no hub tool saves a
      // capacity-plan document.
      steps: [R('algorithms-detailed', 'Reference: detailed algorithm size comparison')],
      deepDive: [L('os-pqc', 'Deep dive — Learn: Operating Systems & PQC')],
      // NOTE 07182026: the framework's own p6 Level-4 maturity indicator
      // ("Infrastructure fully PQC-capable...PKI automated with shortened
      // lifetimes; middlebox monitoring integrated into continuous
      // discovery") has NO corresponding framework activity id (verified
      // against pqc-references/framework-2.1.json — Phase 6 defines only
      // 6.1-6.5, all of which deliver L2/L3). A candidate 6.6 activity was
      // drafted here to close the ladder/mission mismatch the 07182026
      // review flagged, but frameworkFidelity.test.ts correctly rejected it
      // as an invented, non-framework-sourced activity and it was reverted.
      // P6 topping out at L3 in the shipped tree is therefore INTENTIONAL,
      // matching the framework's own structure (same pattern as P3 capping
      // at L2 — see maturityScale.test.ts). The mission CSV's L4 row is left
      // in place (its text is framework-verbatim) as an aspirational/BAU
      // state the framework describes but does not gate via a discrete
      // activity; whether/how a player should be able to reach it in-sim is
      // an open design question for a properly scoped follow-up, not a
      // Wave-0 string fix.
    },
    {
      level: 1,
      id: '6.1-infra-awareness',
      adaptationOf: '6.1',
      title: 'Recognise the infrastructure constraints before planning',
      decision:
        'Understand what PQC does to PKI, HSMs and the network path before committing to any modernization plan.',
      do: 'Identify which PKI, HSM/KMS and network components the migration touches, and explain the constraint each one imposes — larger keys and signatures, hardware support, middlebox behaviour. Awareness only: no plans yet.',
      output: 'Stated infrastructure constraints',
      steps: [
        R(
          'algorithms-transition',
          'Reference: classical → PQC transition — what changes in keys, signatures and certificates'
        ),
        R(
          'algorithms-detailed',
          'Reference: detailed algorithm comparison — the size and performance constraints infrastructure has to absorb'
        ),
      ],
    },
    {
      level: 4,
      id: '6.5-capacity-cycle',
      adaptationOf: '6.5',
      title: 'Operate infrastructure at production scale: capacity and monitoring',
      decision:
        'Validate capacity against real thresholds and keep measuring — a baseline taken once will not catch drift.',
      do: 'Advance a reporting period, re-run the capacity plan against the measured load, and treat any monitoring drift as a corrective action to be re-measured rather than noted.',
      output: 'Re-validated capacity plan + corrective action',
      steps: [
        REC(
          'infra-modernization-plan',
          1,
          'Re-validate the infrastructure plan in a later quarter (production-scale capacity)'
        ),
        W('hsm-capacity', 'Practice: HSM capacity — measure headroom against the threshold'),
      ],
    },
  ],
  p7: [
    {
      id: '7.1',
      level: 1,
      title: 'Classify Vendor Portfolio by PQC Impact',
      decision:
        "Classify every vendor as Blocking, Enabling or Non-Critical — treating them all the same wastes effort on vendors that don't matter.",
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
      decision:
        "Formally engage and score strategic vendors with a real questionnaire — a verbal 'they're working on it' isn't a tracked commitment.",
      do: 'Send PQC readiness questionnaires to strategic vendors and track responses.',
      output: 'Vendor questionnaire responses',
      steps: [
        // toOverride: a real ACVP cert (Thales Luna G7, ML-DSA/ML-KEM — matches
        // simArchitecture.ts's large-size 'Thales Luna HSM' node) so the step opens
        // on a real vendor's actual cert status, not an empty ?cert= (WP5.5).
        R(
          'compliance-cert-check',
          'Reference: vendor FIPS/CC cert status',
          '/compliance?cert=A8273'
        ),
        R('algorithms-protocol-matrix', 'Reference: which vendor protocols have a PQC path'),
        A('vendor-scorecard', 'Score vendors (Vendor Scorecard)'),
      ],
    },
    {
      id: '7.3',
      level: 3,
      title: 'Insert PQC Requirements into Procurement',
      decision:
        "Put dated PQC commitments and remedies into the contract language itself — a vendor's roadmap slide isn't binding.",
      do: 'Add PQC clauses to RFP and contract templates with dated commitments and remedies; require a product CBOM (CycloneDX format) plus a dated PQC attestation with every contract, not just a support statement.',
      output: 'Updated procurement templates',
      steps: [A('contract-clause', 'Draft a PQC contract clause')],
    },
    {
      id: '7.4',
      level: 3,
      title: 'Manage Vendor-as-Blocker Scenarios',
      decision:
        "Deploy a bridging pattern or formally accept the residual risk when a vendor blocks you — don't just wait and hope they catch up.",
      do: 'When a critical vendor cannot deliver PQC in time, deploy bridging patterns (gateway, overlay, key-wrap), run champion-challenger, escalate contractually, or accept-and-document the residual risk.',
      output: 'Bridging pattern deployments',
      steps: [
        A('deployment-playbook', 'Deploy bridging patterns for blocked vendors'),
        A(
          'risk-register',
          'Accept-and-document residual vendor risk when no bridge or alternative exists'
        ),
      ],
    },
    {
      id: '7.5',
      level: 3,
      title: 'Establish Ongoing Vendor Governance',
      decision:
        "Run vendor governance as a recurring cadence — this phase never closes, so a one-time review isn't enough.",
      do: 'Run the recurring vendor-governance cadence — track roadmaps, verify GA commitments, update the vendor scorecard, and report to SteerCo.',
      output: 'Vendor governance cadence',
      steps: [A('kpi-dashboard', 'Run the vendor-KPI / SteerCo governance cadence')],
    },
    {
      id: '7.6',
      level: 3,
      title: 'Coordinate Counterparties You Cannot Contractually Compel',
      decision:
        "Coordinate dual-stack windows and deprecation timing with counterparties you can't compel — silently flipping a protocol breaks their integration.",
      do: 'For partners, customers and API consumers with no contractual leverage, run the coordination pattern — readiness discovery, dual-stack windows, deprecation protocol, interop test events, and API versioning.',
      output: 'Counterparty coordination plan',
      steps: [
        A('stakeholder-comms', 'Plan dual-stack windows & deprecation comms for counterparties'),
        A('risk-register', 'Record the counterparty refusal decision in the risk register'),
        REC(
          'kpi-dashboard',
          1,
          'Report to the SteerCo again in a later quarter — L3 is reported, not produced'
        ),
      ],
    },
    {
      id: '7.7',
      level: 4,
      title: 'Cloud Shared Responsibility and the SaaS Class',
      decision:
        "Map exactly where your responsibility ends and the provider's begins — don't assume PQC migration is automatically their problem.",
      do: 'Define the provider/customer migration boundary and govern SaaS by sensitivity.',
      output: 'Cloud responsibility & SaaS governance',
      steps: [A('cloud-responsibility-matrix', 'Map the cloud responsibility split')],
    },
    {
      level: 4,
      id: '7.5-vendor-governance-cycle',
      adaptationOf: '7.5',
      title: 'Operate vendor governance as a permanent function',
      decision:
        'Verify what suppliers actually delivered and keep the review running — a signed commitment is not delivered PQC.',
      do: 'Advance a reporting period and re-score the vendor portfolio: which commitments were met, which bridging patterns can now be retired, what open-source dependencies are tracked, and when the next review falls.',
      output: 'Re-scored vendor portfolio + next governance review',
      steps: [
        REC(
          'vendor-scorecard',
          1,
          'Re-score vendors in a later quarter (permanent BAU governance)'
        ),
        R('compliance', 'Reference: supplier certification evidence behind a delivery claim'),
      ],
    },
  ],
  foundations: [
    {
      id: 'F.1',
      level: 1,
      title: 'Establish GRC & Assess Program Maturity',
      decision:
        'Run the seven-domain maturity self-assessment first — your overall score is only as strong as your weakest domain.',
      do: 'Stand up the risk-appetite statement and KRI cascade; run (or refine) your PQC assessment across the seven domains — Cryptographic Inventory, Governance & Ownership, Pilots & Deployment, Vendor & Supply Chain, Compliance & Standards, Crypto-Agility, Risk & Prioritization. Program maturity is derived from your progress, overall = weakest domain. (Level 0 "Unaware" — no organizational awareness, nothing planned or underway — is where every domain starts; this activity is how you leave it.)',
      output: 'GRC structure & maturity baseline',
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free: unlike P1's scoping document (a
      // saved artifact 1.1 later "refines"), the maturity baseline itself is
      // LIVE-derived via deriveMaturity() from the assess engine's answers,
      // not a document this band produces — R('assess-engine', ...) above is
      // already the real tool. Force-adding an unrelated A() here would be a
      // weaker fit than 1.0's, not a clearly-strong one.
      steps: [
        L('pqc-grc', 'Learn: PQC GRC (risk appetite & KRIs)'),
        R('assess-engine', 'Run / refine your PQC assessment'),
      ],
    },
    {
      id: 'F.2',
      level: 2,
      title: 'Baseline Metrics & the Evidence Dossier',
      decision:
        'Baseline the five board KPIs and start the evidence dossier now — reconstructing history for an auditor later is much harder.',
      do: 'Set the board KPI pack (Coverage/Trust/Inventory/Vendors/Agility) and the operational KPIs, and start the audit/litigation evidence dossier.',
      output: 'KPI baseline & evidence dossier',
      steps: [
        L('pqc-governance', 'Learn: why these five KPIs — what the board actually needs to see'),
        A('kpi-dashboard', 'Baseline the board KPI pack'),
        A('kpi-tracker', 'Track operational KPIs & the evidence dossier'),
      ],
    },
    {
      id: 'F.3',
      level: 2,
      title: 'Build Crypto-Agility & the Team',
      decision:
        'Design for crypto-agility as the end state and staff the core roles now — retrofitting agility after the migration costs far more.',
      do: 'Adopt crypto-agility as the end-state architecture and staff the program with the framework core roles (≈1 FTE per 500 CBOM instances for the first two years, tapering to ≈1 per 1,000 once rollout stabilizes).',
      output: 'Crypto-agility roadmap & skills plan',
      steps: [
        L('crypto-agility', 'Learn: Crypto-Agility as end-state'),
        L('skills-team-structure', 'Learn: skills & team structure (roles, FTE sizing)'),
        A('skills-team-plan', 'Plan skills & team'),
      ],
      // Added 07062026 (Wave 3) — untouched verticals, no required-module anchor.
      deepDive: [
        L('crypto-dev-apis', 'Deep dive — Learn: Cryptographic APIs & Developer Languages'),
        L('slh-dsa', 'Deep dive — Learn: SLH-DSA'),
        W('slh-dsa', 'Deep dive — Practice: SLH-DSA sign & verify'),
        L('stateful-signatures', 'Deep dive — Learn: Stateful Hash Signatures'),
        W('lms-hss', 'Deep dive — Practice: LMS/HSS stateful signatures'),
        W('openssl-studio', 'Deep dive — Practice: OpenSSL Studio'),
      ],
    },
    {
      id: 'F.4',
      level: 3,
      title: 'Maintain Regulatory & Standards Alignment',
      decision:
        'Keep your regulation map current as deadlines and standards shift — a map built once in year one goes stale fast.',
      do: 'Keep the phase-to-regulation map current across the 2026–2035 deadline squeeze and the standards bodies that bind you.',
      output: 'Regulatory & standards alignment map',
      steps: [
        L('standards-bodies', 'Learn: Standards, Certification & Compliance Bodies'),
        R('compliance', 'Maintain the regulatory & standards alignment map'),
      ],
      // Added 07062026 (Wave 3) — untouched vertical, no required-module anchor.
      deepDive: [L('pqc-candidates', 'Deep dive — Learn: PQC Candidates & Lifecycle')],
    },
    {
      id: 'F.5',
      level: 4,
      // Reworked 07082026 (audit finding): this band and 2 of Foundations'
      // 3 pitfalls previously near-duplicated the dedicated Verify & Close
      // phase's own content (verification/decommissioning), even though that
      // ground is already covered better there. The L4 indicator's own text
      // ("algorithm changes are routine") points at crypto-agility maturity,
      // not closure — this band now actually matches its own indicator,
      // grounded in the framework's cross-cutting crypto-agility roadmap
      // (Year 3 Verification: production algorithm-swap drill; OKRs tracked
      // as BAU).
      title: 'Run Crypto-Agility as BAU',
      decision:
        'Fold crypto-agility into standing operations — an annual swap drill and continuous drift monitoring — so the next algorithm change is routine, not a re-run of the whole migration.',
      do: 'Fold the crypto-agility OKRs into standing operations — an annual algorithm-swap drill, continuous drift monitoring, and the Agility KPI tracked alongside Coverage/Trust/Inventory/Vendors — so a new algorithm recommendation becomes a routine change, not a re-run of the whole migration.',
      output: 'Crypto-agility OKR evidence, tracked as BAU',
      steps: [A('kpi-tracker', 'Track the Agility KPI as a standing, recurring metric')],
    },
  ],
  'verify-close': [
    {
      id: 'VC.1',
      level: 1,
      title: 'Set the Verification Standard & Closure Plan',
      decision:
        "Adopt the evidence standard and closure record up front — decide what 'proven' means before you start declaring things done.",
      do: 'Adopt the 5-point migration-verification evidence standard and the program-closure record up front, so "done" means proven, not declared.',
      output: 'Verification standard & closure plan',
      // Investigated for an A() step (07192026, completeness gap-closing) —
      // deliberately left artifact-free: the obvious candidate is the SAME
      // A('migration-verification', ...) that VC.2 already requires below.
      // Completion checks satisfy on the tool's global hasArtifact flag, so
      // adding it here would let players satisfy BOTH bands from one click —
      // collapsing the deliberate "adopt the standard, then execute" arc
      // between VC.1 and VC.2 into a single step. Left as a reference-only
      // decision band.
      steps: [
        L('verification-closure', 'Learn: Decommissioning & Program Closure'),
        R(
          'migration-verification',
          'Reference: the program closure record & 5-point evidence standard'
        ),
        // Executive Report embed (refId 'report' ∈ REFERENCE_EMBED_IDS) — opens
        // the board-facing closure summary INSIDE the sim rather than navigating
        // out to /report. Restored 07032026: the 06302026 tree dropped the only
        // report entry point from Verification & Closure when VC.1's closure-
        // record step was repointed at the migration-verification tool.
        R('report', 'Reference: the Executive Report — board-facing closure summary'),
        R('compliance', 'Reference: closeout attestations & applicable mandates'),
      ],
    },
    {
      id: 'VC.2',
      level: 2,
      title: 'Assemble the Migration Evidence Dossier',
      decision:
        'Assemble real evidence — observed negotiation, negative testing, attestation — for every migrated system, not a checklist of milestones hit.',
      do: 'Prove each migrated system against the evidence standard (observed PQC negotiation, negative testing, configuration attestation) and log classical key-material decommissioning per org key-destruction standard — destruction certificates for HSM-held keys, not a verbal confirmation. Re-encrypt long-lived archives under PQC BEFORE destroying the classical keys that protect them — the sequencing matters, not just the two actions.',
      output: 'Migration-verification evidence dossier',
      steps: [
        L('verification-closure', 'Learn: decommission classical crypto & assemble evidence'),
        A('migration-verification', 'Assemble the migration evidence dossier'),
        // Split out from the step above (completeness gap-closing, 07182026): the
        // real migration-verification tool already has its own decommissions
        // section (signing-key/certificate/kek/other, per-item destruction
        // method) — this was previously bundled into one generic "assemble +
        // log" step; giving destruction-certificate logging its own explicit
        // step makes it a discrete, checkable action rather than prose folded
        // into the dossier step's do-text. Same artifactType, same tool —
        // reusing one artifact across steps is an established pattern here
        // (kpi-dashboard/kpi-tracker/crypto-cbom all do it).
        A(
          'migration-verification',
          'Log classical key-material decommissioning — destruction certificates, not a verbal confirmation'
        ),
        A('audit-checklist', 'Run the closure audit-readiness checklist'),
        A(
          'data-at-rest-strategy',
          'Confirm long-lived archives are re-encrypted under PQC before this system’s classical keys are destroyed'
        ),
      ],
    },
    {
      id: 'VC.3',
      level: 3,
      title: 'Independent Verification & Sign-off',
      decision:
        'Get independent verification and a funded BAU handover signed off — closure needs proof and a receiving team, not just a milestone check.',
      do: 'Independently verify Tier-1 systems, evidence the crypto-agility / rollback drill, and obtain executive-sponsor closure sign-off with a funded BAU handover.',
      output: 'Independent verification & signed closure',
      steps: [
        A('crypto-cbom', 'Export the final CBOM as durable closure evidence'),
        R(
          'library',
          'Reference: decommissioning guidance & evidence standards',
          '/library?topic=800-88'
        ),
      ],
    },
    {
      id: 'VC.4',
      level: 4,
      title: 'Run Verification & Closure as BAU',
      decision:
        'Fold verification and decommissioning into continuous posture monitoring — closure is a permanent operating discipline, not a one-time event.',
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
      why: 'The CMDB is rarely complete; it systematically undercounts cloud resources, shadow IT, OT devices, and vendor-managed systems. Cross-reference the CMDB, ITAM, cloud API, CT-log, BIA and certificate data sources from Activity 1.4–1.5 or the CMDB gap becomes a migration gap.',
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
    {
      title: 'Issue the new PQC root and assume it is usable',
      why: 'A root distributed today still has to propagate through browser/OS/device trust-store update cycles — commonly a year or more, longer for legacy and embedded devices whose trust stores rarely update at all. Start root-distribution ceremonies early; a root sitting in your CA is not a root anything actually trusts yet.',
    },
  ],
  p7: [
    {
      title: 'Start vendor engagement too late',
      why: 'Vendor dependency is the longest critical path; waiting for a complete CBOM loses a year or more.',
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
    {
      title: 'Your top blocked vendors share one upstream crypto library',
      why: 'Vendor-diversity scorecards check for a single VENDOR failure point, not a shared fourth-party one — if five "independent" blocked vendors all depend on the same unpatched crypto library, that\'s one concentration risk wearing five faces, not five separate ones. Map upstream dependencies, not just first-party vendor names.',
    },
  ],
  foundations: [
    // The first two pitfalls here previously duplicated verify-close's own
    // (below) near-verbatim — replaced 07082026 with a genuine Foundations
    // pitfall (grounded in the framework's evidence-dossier/litigation-defense
    // guidance) instead of restating VC.1/VC.2's closure-specific failures.
    {
      title: 'Let the evidence dossier lapse',
      why: "A documented decision to defer is defensible; undocumented inaction is not. Without a maintained record of risk-acceptance decisions, denied budget requests, and annual threat reassessments, there's no negligence defense if a known, unaddressed quantum risk turns into an incident.",
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
      why: "Leaving old classical keys and material live keeps the harvest-now-decrypt-later exposure open even after PQC is deployed — closure requires key-destruction evidence per the org's destruction standard.",
    },
  ],
}

// ---- emit one dated, self-contained TS file per phase -----------------------
mkdirSync(OUT, { recursive: true })
mkdirSync(join(OUT, 'archive'), { recursive: true })

for (const phase of Object.keys(FRAMEWORK)) {
  const acts = FRAMEWORK[phase]
  // Guard (added after the SAME sparse-array bug bit twice): a stray `,,` in a
  // steps array creates a HOLE, which JSON.stringify emits as `null` and which
  // then crashes four unrelated suites with "Cannot read properties of null".
  // Fail here instead, naming the activity, so the next person reads one clear
  // error rather than tracing a null step back to a comma.
  for (const a of acts) {
    if (!a || typeof a !== 'object')
      throw new Error(`${phase}: empty slot in the activity array — check for a stray comma`)
    for (const [i, st] of (a.steps ?? []).entries()) {
      if (!st) throw new Error(`${phase}/${a.id}: steps[${i}] is empty — stray comma in the array`)
      if (!st.kind || !st.to)
        throw new Error(`${phase}/${a.id}: steps[${i}] has no kind/to — ${JSON.stringify(st)}`)
    }
    for (const [i, st] of (a.deepDive ?? []).entries()) {
      if (!st) throw new Error(`${phase}/${a.id}: deepDive[${i}] is empty — stray comma`)
    }
  }
  const levelsPresent = [...new Set(acts.map((a) => a.level))].sort((x, y) => x - y)
  const levels = levelsPresent.map((level) => ({
    level,
    indicator: INDICATORS[phase][level],
    activities: acts
      .filter((a) => a.level === level)
      .map((a) => ({
        id: a.id,
        // Simulator adaptation: names the SOURCE framework activity whose later
        // operating outcome this exercise represents. Never a new activity id.
        adaptationOf: a.adaptationOf ?? undefined,
        title: a.title,
        decision: a.decision ?? undefined,
        do: a.do,
        output: a.output ?? undefined,
        steps: a.steps,
        deepDive: a.deepDive ?? undefined,
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
