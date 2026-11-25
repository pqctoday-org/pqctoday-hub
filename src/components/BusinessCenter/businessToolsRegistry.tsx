// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import {
  Calculator,
  Presentation,
  AlertTriangle,
  ClipboardCheck,
  Users,
  FileText,
  BarChart3,
  Star,
  ScrollText,
  Network,
  Map,
  MessageSquare,
  Activity,
  Rocket,
  ListChecks,
  Flame,
  Calendar,
  Workflow,
  Wrench,
  Boxes,
  ShieldAlert,
  GitBranch,
  Scale,
  Code2,
  Cloud,
  ClipboardList,
  Server,
  CalendarClock,
  Zap,
  Database,
} from 'lucide-react'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import type { ZoneId } from '@/data/cswp39ZoneData'
import type { PhaseId } from '@/data/frameworkPhases'
import { BUSINESS_TOOL_RECORDS, type BusinessToolRecord } from '@/data/generated/tools.generated'

// ---------------------------------------------------------------------------
// Business tool registry — non-cryptographic planning & governance tools
// extracted from executive learn modules (zero-prop, standalone components)
// ---------------------------------------------------------------------------

/** Intended primary reader. Defaults to 'business' (the general business reader —
 *  Executive or GRC) when unset; only the handful of protocol/implementation
 *  tools carry a technical audience so a non-coder can tell at a glance which
 *  tools are meant for them. Distinct from `PersonaId`: this facet predates
 *  the 2026-09-07 Executive/GRC split and is not re-partitioned by it — both
 *  personas share the 'business' audience. */
export type BusinessToolAudience = 'business' | 'architect' | 'developer'

export interface BusinessTool {
  id: string
  name: string
  description: string
  category: string
  icon: React.ElementType
  keywords: string[]
  /** Intended reader; omit for the default business audience (Executive or GRC). */
  audience?: BusinessToolAudience
  /** CSWP.39 Fig 3 zone (Crypto Agility Strategic Plan). Drives which Command
   *  Center panel surfaces this tool. Required. */
  cswp39Zone: ZoneId
  /** Sub-element label inside the zone — must match a string from
   *  `CSWP39_ZONE_DETAILS[zone].contains` so panels can sub-group artifacts. */
  cswp39ZoneSubElement?: string
  /** CSWP.39 §-reference, e.g. "§3.2.4" or "§6.5". Drives the small provenance
   *  chip on each tool card. */
  cswp39SectionRef: string
  /** Optional sub-section human label, e.g. "Hybrid Cryptographic Algorithms". */
  cswp39SubSection?: string
  /** Applied Quantum migration phase this tool produces an artifact for. Must
   *  stay consistent with `FRAMEWORK_PHASES[phase].produce` (drift-guarded). */
  frameworkPhase: PhaseId
  /**
   * What a GOOD answer out of this tool looks like — B+ remediation 4.6
   * (2026-08-10). `description` already says what the tool is for; nothing said
   * how to tell whether what you produced was any good. "A generated document
   * the user cannot defend is worse than no document" — this is the line that
   * makes the difference between an export and an understanding.
   *
   * Required, so a new tool cannot ship without one. Rendered above the tool
   * itself by BusinessToolRoute.
   */
  goodAnswer: string
  /**
   * B+ round 8, Wave C (2026-09-18). One concrete run of the tool, written from
   * its real inputs (the field labels and options it actually has), so a first-time
   * user sees what "using it" looks like before the form. Optional: a tool without
   * one renders only the two lines above.
   */
  workedExample?: string
}

/**
 * What an entry below declares: the tool's content (description, keywords, the
 * good-answer line, the worked example, icon). Its organising fields — name,
 * category, audience, CSWP.39 placement, framework phase and position — live
 * once in the tools data file (`src/data/tools_*.csv`, read through
 * `tools.generated.ts`) and are joined in below. Any note left beside an entry
 * about why a CSWP.39 placement was chosen explains that file's row.
 */
export type BusinessToolContent = Omit<
  BusinessTool,
  | 'name'
  | 'category'
  | 'audience'
  | 'cswp39Zone'
  | 'cswp39ZoneSubElement'
  | 'cswp39SectionRef'
  | 'cswp39SubSection'
  | 'frameworkPhase'
>

// The tab order of the Command Center and the order inside each category are the
// `order` column of the tools data file, not the order of the entries below.
const BUSINESS_TOOL_CONTENT: BusinessToolContent[] = [
  // ── Risk & Strategy ────────────────────────────────────────────────────────
  {
    id: 'roi-calculator',
    goodAnswer:
      'A payback period you would defend under questioning — which means the breach-avoidance input is a number you can source, not the one that makes the case work.',
    workedExample:
      "Pick the 'Average org' tier, enter your products to migrate and planning horizon, then halve the breach-probability input: if the payback period still lands inside the horizon, the case does not depend on the scary number.",
    description:
      'Calculate migration ROI with breach avoidance, compliance savings, and payback period',
    icon: Calculator,
    keywords: ['roi', 'cost', 'benefit', 'investment', 'budget', 'breach', 'payback'],
  },
  {
    id: 'board-pitch',
    goodAnswer:
      'One ask, one date, one consequence of missing it. If the deck needs a second slide to explain the ask, the ask is not clear enough yet.',
    workedExample:
      'Run the ROI Calculator first, then open the pitch: the Budget Request field pre-fills with that investment, the Cost-Benefit section quotes the payback in months, and the export is a numbered proposal with a Basis of figures footer.',
    description: 'Build board-ready investment proposals with executive summary and budget request',
    icon: Presentation,
    keywords: ['board', 'pitch', 'executive', 'proposal', 'investment', 'deck'],
  },
  {
    id: 'breach-simulator',
    goodAnswer:
      'A scenario your own incident team recognises. If nobody in the room says "that is roughly what would happen", the inputs are wrong, not the model.',
    workedExample:
      'Your industry, data retained for 10 years and a migration that takes 3 years: the classical and quantum-enabled breach costs update together, and the Mosca verdict says whether migration is already late.',
    description:
      'Compare classical vs quantum-enabled breach cost (per-event and annual expected loss) with HNDL exposure',
    icon: ShieldAlert,
    keywords: ['breach', 'cost', 'quantum', 'hndl', 'exposure', 'ale', 'risk'],
  },
  {
    id: 'cost-of-inaction',
    goodAnswer:
      'A figure that changes a decision. If waiting and acting come out within rounding of each other, say so plainly rather than tuning the inputs until they diverge.',
    workedExample:
      'Keep the 10-year horizon fixed and compare start now with a 3-year delay: the cumulative-NPV table shows when waiting becomes more expensive, while the assumption panel shows what drives the result.',
    description:
      'Compare the discounted cost of starting now with delaying PQC migration, with assumptions and uncertainty visible',
    icon: CalendarClock,
    keywords: ['delay', 'inaction', 'cost', 'npv', 'penalty', 'hndl', 'breach'],
  },
  {
    id: 'cost-model-explorer',
    goodAnswer:
      'A range, not a point. The honest output of this tool is the spread between your best and worst assumptions, and which assumption drives it.',
    workedExample:
      'Enter the systems in scope and the annual IT budget, then compare the parametric, bottom-up and Monte Carlo estimates: the spread between them is your honest range, and the driver that moves it most is the assumption to defend.',
    description:
      'Compare the six PQC costing-model families on one scenario, with a live Monte Carlo run',
    icon: BarChart3,
    keywords: ['cost', 'model', 'estimate', 'monte carlo', 'parametric', 'scenario', 'compare'],
  },
  {
    id: 'crqc-scenario',
    goodAnswer:
      'A plan that survives the machine arriving early. If your roadmap only works at the median estimate, it is a forecast, not a plan.',
    workedExample:
      'Set the CRQC arrival year to 2030 and untick any compliance deadline that does not apply to your systems: the tool lists RSA-2048, ECDSA P-256 and the others broken by a CRQC, counts the ticked deadlines that fall before that year, and shows the HNDL exposure window for data you keep past it.',
    description: 'Plan for cryptographically relevant quantum computer threat scenarios',
    icon: AlertTriangle,
    keywords: ['crqc', 'quantum', 'threat', 'scenario', 'risk', 'planning'],
  },
  {
    id: 'risk-register',
    goodAnswer:
      "Each entry names an owner role and a next review date. An entry without them is a note, not a risk: no one is answerable for treating it. Use roles, not people's names; recording a role is not a sign-off.",
    workedExample:
      "Add a risk entry for 'TLS Certificates (Public Web)' on RSA-2048 with Shor's Algorithm as the threat vector, Likelihood 4 — Likely, Impact 5 — Catastrophic, Owner role 'PKI lead' and a Next review date: the card shows Score: 20 (Critical), the 'Note, not a risk yet' badge clears, and the Risk Summary counts it as Critical.",
    description:
      'Build a sample risk worksheet with current algorithm, threat vector, likelihood, impact, proposed mitigation, owner role and review date',
    icon: ListChecks,
    keywords: ['risk', 'register', 'inventory', 'mitigation', 'likelihood', 'impact'],
  },
  {
    id: 'risk-treatment-plan',
    goodAnswer:
      'Each high risk maps to a treatment someone has actually agreed to fund. Accepting a risk is a valid answer — leaving it blank is not.',
    workedExample:
      'Load sample entries, click the Likelihood 4 / Impact 5 cell, choose Mitigate and write the rationale: it appears in the Treatment Summary and in the Migration Priority Order, where you can move it up or down and say why.',
    description: 'Visualise residual risk and draft treatment strategies per risk category',
    icon: Flame,
    keywords: ['heatmap', 'treatment', 'residual', 'risk', 'mitigation', 'strategy'],
  },

  // ── Compliance & Audit ─────────────────────────────────────────────────────
  {
    id: 'compliance-checklist',
    goodAnswer:
      'Every "yes" points at evidence that exists today. A checklist of intentions passes no audit.',
    workedExample:
      "Under 'Add frameworks to this checklist', pick an industry and a primary jurisdiction (or Load sample frameworks) and add the frameworks in scope: each one gets its own checklist with a deadline, a compliance owner and controls such as 'Crypto inventory mapped to this framework'. Frameworks starred on /compliance are added automatically.",
    description:
      'Per-framework PQC compliance checklist seeded from your starred frameworks and assessment',
    icon: ClipboardCheck,
    keywords: ['compliance', 'checklist', 'framework', 'controls', 'pqc'],
  },
  {
    id: 'audit-checklist',
    goodAnswer:
      'Explain which fictional planning topics you selected, what information is missing and how the related reading applies. Selections and notes do not establish audit readiness.',
    workedExample:
      'Select two review topics, leave another unanswered and add a fictional reference note. The saved plan preserves those choices; topic counts describe selections, not an audit finding or validated evidence.',
    description:
      'Explore a Hub planning template for inventory, policy, controls and documentation; selections do not assess readiness',
    icon: ClipboardCheck,
    keywords: ['audit', 'checklist', 'readiness', 'compliance', 'inventory', 'controls'],
  },
  {
    id: 'compliance-timeline',
    goodAnswer:
      'Dates you did not choose, next to dates you did. The gap between the two is the plan.',
    workedExample:
      "Select jurisdictions, add a fictional milestone such as 'Complete crypto inventory' with a year, and tick the obligations it works toward in the Add Milestone form. The Obligation Review then compares only those linked deadlines (e.g. 'Planned by reference year'); obligation satisfaction stays not assessed.",
    description: 'Plot framework milestones, deadlines, and dependencies on a single timeline',
    icon: Calendar,
    keywords: ['compliance', 'timeline', 'deadline', 'framework', 'milestone', 'regulatory'],
  },

  // ── Governance & Policy ────────────────────────────────────────────────────
  {
    id: 'raci-builder',
    goodAnswer:
      'Exactly one Accountable per row. Two means nobody, and that is the failure this tool exists to prevent.',
    workedExample:
      'Set Enterprise Architect as Accountable for Crypto Inventory and the CISO as Consulted, then try a second Accountable on the same row: the row is flagged, because two Accountables means nobody.',
    description: 'Build RACI matrices for 10 PQC activities across 6 organizational roles',
    icon: Users,
    keywords: ['raci', 'governance', 'responsibility', 'roles', 'accountable'],
  },
  {
    id: 'policy-generator',
    goodAnswer:
      'A policy someone can be non-compliant with. If no realistic action would breach it, it is a statement of values, not a policy.',
    workedExample:
      'Approve ML-KEM (FIPS 203) and ML-DSA (FIPS 204), list RSA, ECDSA and ECDH as classical algorithms to retire, allow a 2-year exception window and set an annual review: the generated policy names each of them.',
    description: 'Generate cryptographic algorithm, key management, vendor, and migration policies',
    icon: FileText,
    keywords: ['policy', 'template', 'governance', 'key management', 'algorithm'],
  },
  {
    id: 'kpi-dashboard',
    goodAnswer:
      'Three to five measures that would move if the programme stalled. Anything that stays flat either way is reporting, not measurement.',
    workedExample:
      'On a new worksheet, click Load sample baseline: the KPIs you normally type in get fictional values labelled Hub sample baseline, so the Overall Score appears (48/100 under the Executive lens). Switch to the Architect lens and the same values re-weight to 37/100. Move a slider to replace a sample value with your own; Clear sample baseline removes only the sample values. Catalogue calculations use only products you selected in Migrate, and the combined score still needs 70% scored-value coverage, which is not verified evidence.',
    description: 'Build KPI dashboards for tracking PQC migration metrics and progress',
    icon: BarChart3,
    keywords: ['kpi', 'dashboard', 'metrics', 'tracking', 'progress', 'migration'],
  },

  // ── Vendor & Supply Chain ──────────────────────────────────────────────────
  {
    id: 'vendor-scorecard',
    goodAnswer:
      'Scores backed by something the vendor published, not by what they said on a call. The migrate catalog carries the proof and its date.',
    workedExample:
      'Score two HSM vendors on the same six criteria — PQC Algorithm Support, FIPS 140-3 Validation, Hybrid Mode Support, Crypto Agility, Published PQC Roadmap, SBOM/CBOM Delivery — and compare the totals, with the migrate catalog as the evidence for each score.',
    description: 'Create vendor assessment scorecards for PQC readiness evaluation',
    icon: Star,
    keywords: ['vendor', 'scorecard', 'assessment', 'evaluation', 'supply chain'],
  },
  {
    id: 'contract-clause',
    goodAnswer:
      'Language your procurement team will actually accept. A clause nobody will sign protects nothing.',
    workedExample:
      "Require ML-KEM (FIPS 203) and ML-DSA (FIPS 204), a CMVP certificate number as evidence, CycloneDX 1.7 CBOM delivery and 90 days' notice of cryptographic changes: the generated clause carries each obligation.",
    description: 'Generate PQC-ready contract clauses for vendor agreements',
    icon: ScrollText,
    keywords: ['contract', 'clause', 'vendor', 'agreement', 'legal', 'procurement'],
  },
  {
    id: 'supply-chain-matrix',
    goodAnswer:
      'The suppliers you cannot replace inside your own deadline are visible at a glance. Those are the programme, the rest are logistics.',
    workedExample:
      "Pick your products on Migrate and set your industry: a domain such as 'HSM-protected keys' gets PQC Ready, FIPS Validated, Hybrid Support and Known CVEs counts and a Migration Gap × Impact score, and one click downloads a CycloneDX CBOM.",
    description: 'Assess supply chain risks with dependency mapping and impact analysis',
    icon: Network,
    keywords: ['supply chain', 'risk', 'matrix', 'dependency', 'impact'],
  },

  // ── Migration Planning ─────────────────────────────────────────────────────
  {
    id: 'roadmap-builder',
    goodAnswer:
      'Each phase has an exit test, not just an end date. "Done" has to be checkable by someone who was not in the room.',
    workedExample:
      "Tick your country's deadline chips, keep the defaults — 'Pilot ML-KEM hybrid in TLS' (2027, Track A), 'Re-issue root / intermediate CAs (PQC)' (2030, Track B) — and add a mitigation with a sunset date: the export shows the critical path.",
    description:
      'Build a two-track migration roadmap (key-exchange/HNDL ∥ signatures-PKI/TNFL) on the 8-phase spine, with gates G0–G6 (+ G8 at closure) and milestone dependencies',
    icon: Map,
    keywords: [
      'roadmap',
      'migration',
      'plan',
      'milestone',
      'phase',
      'timeline',
      'two-track',
      'track',
      'gate',
      'dependency',
      'hndl',
      'tnfl',
    ],
    // Best-effort assignment (2026-08-02) — this tool orchestrates the whole
    // zone's activity, not one narrow contains[] item; 'Library upgrades' is
    // the most representative single workstream it sequences.
  },
  {
    id: 'stakeholder-comms',
    goodAnswer:
      'Each audience gets the one thing they need to decide. If two audiences get the same message, one of them is being ignored.',
    workedExample:
      "Put the board in 'Manage closely' with a quarterly cadence and a dashboard status report, write the Board / C-Suite message, then give development teams their own message on a weekly cadence.",
    description: 'Plan stakeholder communication strategies for PQC migration programs',
    icon: MessageSquare,
    keywords: ['stakeholder', 'communication', 'plan', 'messaging', 'change management'],
  },
  {
    id: 'kpi-tracker',
    goodAnswer:
      'A trend, not a snapshot. Two data points is a line; the value starts at the third.',
    workedExample:
      'Choose the Executive lens and click Load sample baseline: fictional values labelled Hub sample baseline fill the KPIs you normally enter, and the Overall Score appears. Switch to the Ops lens to see the same values re-weighted, then replace sample values with hypothetical progress of your own. Missing or unconfirmed saved values stay unassessed; the combined score requires 70% scored-value coverage. Sample notes and review labels do not verify evidence or establish readiness.',
    description: 'Track migration KPIs with configurable metrics and reporting templates',
    icon: Activity,
    keywords: ['kpi', 'tracker', 'metrics', 'reporting', 'migration', 'progress'],
  },
  {
    id: 'deployment-playbook',
    goodAnswer:
      'A colleague could run it at 3am without calling you. That is the only real test of a playbook.',
    workedExample:
      "Tick 'Configure hybrid classical+PQC mode' and 'Prepare rollback automation scripts' under Pre-Deployment Preparation: the counter reads 2/38, the outlined critical items cannot be skipped, and the saved playbook keeps the checkmarks.",
    description: 'Generate deployment playbooks with rollback procedures and validation steps',
    icon: Rocket,
    keywords: ['deployment', 'playbook', 'rollback', 'validation', 'rollout'],
  },
  {
    id: 'hybrid-transition-planner',
    goodAnswer:
      'A stated target, its assumptions and review triggers. For a hybrid example, explain when to review continued use or a later transition. Pure-PQC and gateway choices need their own delivery plans; this worksheet does not generate those sequences.',
    workedExample:
      'Leave the defaults — TLS 1.3 on X25519, key exchange only, data lifetime 5 - 15 years, deadline 2030: the preview recommends Hybrid (Traditional + PQC) with X25519MLKEM768, a hybrid target of Q4 2028 and a pure-PQC sunset of Q4 2030.',
    description:
      'Explore a Hub worksheet with CSWP.39 references and illustrative traditional-plus-PQC, PQC-plus-PQC, pure-PQC or crypto-gateway suggestions',
    icon: GitBranch,
    keywords: [
      'hybrid',
      'transition',
      'composite',
      'pqc',
      'kem',
      'signature',
      'ml-kem',
      'ml-dsa',
      'architect',
    ],
  },
  {
    id: 'mti-negotiator',
    goodAnswer:
      'Compare the exact TLS 1.3 groups both peers enable and identify which remain eligible under the worksheet policy. Confirm the result with a real handshake before deploying.',
    workedExample:
      'Select X25519MLKEM768 for both sample peers. Preview the common group, then remove it from the server and review the blocked result. If both peers also support X25519, change the local rule to see when that classical group becomes eligible.',
    description:
      'Protocol-designer + architect decision tool from CSWP.39 §3.1.1 - picks Mandatory-to-Implement signature / KEM / hash plus alternates from audience, deadline, and constraint inputs',
    icon: Scale,
    keywords: [
      'mti',
      'mandatory-to-implement',
      'cipher-suite',
      'negotiation',
      'protocol',
      'tls',
      'ikev2',
      'ml-kem',
      'ml-dsa',
      'slh-dsa',
      'cnsa',
    ],
  },
  {
    id: 'crypto-api-refactor-audit',
    goodAnswer:
      'A list of call sites, not a list of libraries. The refactor happens where the API is called, and that is where the estimate has to come from.',
    workedExample:
      "Choose Go, OpenSSL (libcrypto / EVP), '10 - 50 call sites' and 'Partially hardcoded': the audit grades it 'Phase 2 - Complete the facade', and the checklist names the Go imports to grep for outside the facade and a lint rule to ban them.",
    description:
      'Architect + senior-developer audit from CSWP.39 §4.1 - grades current crypto-agility state and emits a phased refactor checklist with language-specific call-site guidance (Go / Java / .NET / Node / Python / Rust / C / C++ / JS)',
    icon: Code2,
    keywords: [
      'api',
      'refactor',
      'audit',
      'agility',
      'facade',
      'evp',
      'openssl',
      'bouncycastle',
      'pkcs11',
      'call-sites',
      'developer',
      'architect',
    ],
  },
  {
    id: 'cloud-responsibility-matrix',
    goodAnswer:
      'No cell reads "shared" without saying who acts first. Shared responsibility is where migrations stall.',
    workedExample:
      "Keep the defaults — AWS, IaaS + PaaS, TLS termination and KMS-backed keys in scope: the matrix has four rows, each naming Customer, Provider or Shared as owner with both sides' actions and a PQC availability read from the product catalog.",
    description:
      'Architect + compliance-lead matrix from CSWP.39 §6.4 - per-asset-class shared-responsibility model across IaaS / PaaS / SaaS / FaaS, with PQC availability per cloud and watch-outs for multi-cloud, BYOK, FedRAMP, and sovereign-cloud overlays',
    icon: Cloud,
    keywords: [
      'cloud',
      'iaas',
      'paas',
      'saas',
      'faas',
      'fedramp',
      'sovereign',
      'shared-responsibility',
      'byok',
      'hyok',
      'kms',
      'aws',
      'gcp',
      'azure',
    ],
  },

  // ── Architecture (CSWP.39 §5.4) ────────────────────────────────────────────
  {
    id: 'crypto-architecture-diagram',
    goodAnswer:
      'Every trust boundary shows which algorithm crosses it. A diagram without algorithms on the arrows cannot tell you what breaks.',
    workedExample:
      "Add a customer-facing web app, OpenSSL, a network HSM and an internal root CA with their dependencies: the Mermaid preview draws the chain, and the HSM's detail line says whether it has ML-DSA firmware yet.",
    description:
      'Document apps, libraries, HSMs, protocols, key stores, and CAs with their dependencies; renders as a Mermaid diagram',
    icon: Workflow,
    keywords: [
      'architecture',
      'diagram',
      'topology',
      'dependencies',
      'hsm',
      'library',
      'protocol',
      'mermaid',
    ],
  },

  // ── Management Tools (CSWP.39 Fig 3 — discovery / assessment / config / enforcement) ──
  {
    id: 'management-tools-audit',
    goodAnswer:
      'You know which of your own tools would have to change before a single production key does.',
    workedExample:
      'Set Crypto Scanners to Automated and enter inventory counts. With 31 of 64 systems observed, the category stays below the Hub’s 50% coverage threshold. Change the numerator to 32 and check the gap list and exported audit.',
    description:
      'Audit your discovery, assessment, configuration, and enforcement tooling stack — feeds the Information Repository per CSWP.39 §5',
    icon: Wrench,
    keywords: [
      'tools',
      'audit',
      'scanner',
      'siem',
      'cmdb',
      'sbom',
      'zero-trust',
      'discovery',
      'enforcement',
    ],
  },
  {
    id: 'crypto-cbom-builder',
    goodAnswer:
      'A CBOM you can regenerate repeatably. Its accuracy depends on source coverage, input freshness and reconciliation with the scoped inventory; generation alone does not establish completeness.',
    workedExample:
      'Switch to SBOM → CBOM and pick the payments-service sample: its five components, OpenSSL 1.1.1w and a non-FIPS Bouncy Castle among them, each get an end-of-life, FIPS, ESV, PQC and posture reading (OpenSSL 1.1.1w shows EoL (2023-09-11)), and one click downloads a CycloneDX 1.7 CBOM.',
    description:
      'Build a CBOM slice from an SBOM, library posture, or HSM inventory; feeds the Assets pipeline',
    icon: Boxes,
    keywords: ['cbom', 'sbom', 'inventory', 'libraries', 'hsm', 'fips', 'cyclonedx'],
  },
  {
    id: 'crypto-vulnerability-watch',
    goodAnswer:
      'A short list you will actually read. A watch that surfaces everything gets ignored like everything else.',
    workedExample:
      'Bookmark OpenSSL on Migrate (or click Load sample watchlist) and switch off the MEDIUM and LOW chips: the tiles count products tracked, filtered CVEs, Critical + High and CPE coverage gaps, and expanding OpenSSL lists its top 20 CVEs by ID, score, date and summary.',
    description:
      'NIST NVD CVE digest for the products on your /migrate selection, joined via CPE — the top CVEs per product by severity from the current snapshot',
    icon: ShieldAlert,
    keywords: ['cve', 'nvd', 'vulnerability', 'cpe', 'severity', 'nvd snapshot'],
  },

  // ── Program Establishment (Applied Quantum Phase 0 / Foundations) ───────────
  {
    id: 'program-charter',
    goodAnswer:
      'A named sponsor and a stated scope boundary. The boundary matters more — a charter without one absorbs every adjacent problem.',
    workedExample:
      'Name the sponsor (for example the CISO), write the purpose and the scope boundary, add the Steering Committee seats, enter a budget such as $4.5M over 3 years and tick the workstreams: the export is a one-page charter.',
    description:
      'Phase 0 mandate artifact — sponsor sign-off, Steering Committee, QRPM appointment, governance cadence, and the multi-year budget commitment',
    icon: ScrollText,
    keywords: [
      'charter',
      'mandate',
      'sponsor',
      'steerco',
      'steering committee',
      'qrpm',
      'governance',
      'budget',
      'cadence',
    ],
  },
  {
    id: 'initial-scoping',
    goodAnswer:
      'An honest inventory gap. "We do not know what is in this estate" is a finding, and often the most valuable one.',
    workedExample:
      "List 'Customer-facing TLS gateway' as system 1 with priority A and owner Vendor, enter 2400 as the estate estimate and name OpenSSL, Microsoft and F5 as vendor dependencies: the export is a numbered systems table, the estimate and vendors.",
    description:
      'Phase 0 first-cut scope — top-20 in-scope systems, an estate-size estimate, and the top-10 vendor dependencies; seedable from your /migrate selection',
    icon: ClipboardList,
    keywords: [
      'scoping',
      'scope',
      'estate',
      'systems',
      'vendors',
      'dependencies',
      'inventory',
      'top-20',
    ],
  },
  {
    id: 'skills-team-plan',
    goodAnswer:
      'A plan that works with the people you have. Hiring is a dependency, not a mitigation.',
    workedExample:
      'Enter the instances in scope (for example 2,400): the 1-FTE-per-500-instances heuristic sizes the core roles for years 1–2 and for production rollout, and each role gets build, borrow or buy.',
    description:
      'Foundations staffing plan — core roles + FTE from the framework role model, the 1-FTE-per-500-instances sizing heuristic, and build / borrow / buy per role',
    icon: Users,
    keywords: [
      'skills',
      'team',
      'staffing',
      'fte',
      'roles',
      'build',
      'borrow',
      'buy',
      'hiring',
      'sizing',
    ],
  },
  {
    id: 'infra-modernization-planner',
    goodAnswer:
      'Explore how proposed cryptographic changes align with refresh plans. Costs, compatibility and readiness need separate assessment.',
    workedExample:
      'Enter a fictional HSM/KMS inventory and select protocol planning topics. The export records sample inputs; it does not run handshakes, measure capacity or establish infrastructure readiness.',
    description:
      'Sample infrastructure planning worksheet for PKI, HSM/KMS, network compatibility topics and capacity assumptions; not a readiness assessment',
    icon: Server,
    keywords: [
      'infrastructure',
      'pki',
      'hsm',
      'kms',
      'middlebox',
      'capacity',
      'performance',
      'modernization',
      'mtc',
    ],
    // Weak fit (2026-08-02) — this tool's real content (PKI/HSM/KMS upgrade
    // scheduling) sits closer to the migration zone's "Firmware updates" than
    // anything in mitigation's contains[] list; kept in its existing zone
    // (only the missing sub-element was in scope) but the zone assignment
    // itself is worth a follow-up review.
  },
  {
    id: 'refresh-cycle-alignment',
    goodAnswer:
      'The assets whose refresh lands AFTER your deadline are named. Those need a decision now, not later.',
    workedExample:
      "Keep the 3-year horizon, give 'HSM replacement' a next refresh of 2027 and 'Data center hardware' 2031: the first badge reads Within planning window, the second After horizon, and the banner counts how many of the seven programs refresh after the planning horizon.",
    description:
      'Phase 4 Activity 4.3 — maps PQC migration tasks onto already-funded infrastructure refresh programs (data center, SD-WAN, cloud, PKI, HSM, vendor renewals) so PQC work rides existing budgets',
    icon: CalendarClock,
    keywords: [
      'refresh',
      'cycle',
      'roadmap',
      'budget',
      'cost avoidance',
      'hardware',
      'renewal',
      'alignment',
    ],
  },
  {
    id: 'accelerated-execution-profile',
    goodAnswer:
      'The specific things you would drop to go faster, listed before you need them. Deciding under pressure is how scope gets cut badly.',
    workedExample:
      'Tick a trigger such as a board directive to accelerate, write the compressed sequence, pre-approve a risk acceptance (for example a temporary performance regression on internal APIs), size the surge request and name who can activate it.',
    description:
      'Phase 4 Activity 4.7 — a pre-drafted contingency package (trigger conditions, compressed sequence, pre-approved risk acceptances, emergency resource request, activation authority) activated if the quantum timeline accelerates',
    icon: Zap,
    keywords: [
      'accelerated',
      'contingency',
      'trigger',
      'emergency',
      'tabletop',
      'compressed',
      'profile',
    ],
  },
  {
    id: 'data-at-rest-strategy',
    goodAnswer:
      'Retention drives the order. Data that stays secret for ten years is the harvest-now target; data that expires next quarter is not.',
    workedExample:
      "Keep the four seeded stores, 'Customer PII database' on High with 'Re-encrypt with fresh AES-256 DEK (PQC-wrapped KEK)' and 'Backups & archives' on 'Re-wrap existing DEK under PQC KEK': the export is a store / sensitivity / strategy table.",
    description:
      'Phase 5 Activity 5.6 — per-store data-at-rest decision (re-encrypt under PQC keys, PQC key-wrap, crypto-shred, delete, or accept & monitor), recorded back into the CBOM',
    icon: Database,
    keywords: [
      'data at rest',
      'encryption',
      'key wrap',
      'crypto-shred',
      'aes-256',
      'database',
      'backups',
      'strategy',
    ],
    // No cswp39ZoneSubElement (2026-09-03): the previous anchor,
    // 'Mandatory sunset date', was removed from mitigation's contains[] —
    // it asserted a NIST CSWP 39 §4.6 requirement the published text does
    // not make (fetched the source directly; the word "sunset" does not
    // appear in that section). It was already a weak, forced fit for this
    // tool (see the removed comment); left ungrouped rather than forced
    // onto a different contains[] item that fits no better.
  },
  {
    id: 'migration-verification',
    goodAnswer:
      'Define the checks a workload needs, distinguish recorded references from performed tests, and plan trust retirement and continuing review.',
    workedExample:
      "Fill five sample reference fields in one fictional record and three in another. The first says 'Evidence recorded — review required'; the second remains incomplete. These counts record filled fields, not successful technical verification.",
    description:
      'Explore sample verification references, retirement planning and closure notes; filling this educational checklist does not verify a migration',
    icon: ClipboardCheck,
    keywords: [
      'verification',
      'closure',
      'evidence',
      'decommission',
      'dossier',
      'bau',
      'sign-off',
      'sp 800-88',
      'tnfl',
    ],
    // §5.5 does not exist — §5 runs 5.1–5.4. Verification/closure is the fifth
    // "key activities" bullet of §5 ("Implement the strategy and actions based
    // on the prioritized list of assets"), so the parent section is the honest ref.
  },
]

export type BusinessToolCategory =
  | 'Risk & Strategy'
  | 'Compliance & Audit'
  | 'Governance & Policy'
  | 'Vendor & Supply Chain'
  | 'Migration Planning'

export const BUSINESS_CATEGORIES: BusinessToolCategory[] = [
  'Risk & Strategy',
  'Compliance & Audit',
  'Governance & Policy',
  'Vendor & Supply Chain',
  'Migration Planning',
]

// `Map` is the lucide icon in this file, so the lookup is a plain record.
const CONTENT_BY_ID: Record<string, BusinessToolContent> = Object.fromEntries(
  BUSINESS_TOOL_CONTENT.map((content) => [content.id, content])
)

function businessTool(record: BusinessToolRecord): BusinessTool {
  const content = CONTENT_BY_ID[record.toolId]
  if (!content) {
    throw new Error(
      `tools data file lists "${record.toolId}" but businessToolsRegistry has no entry`
    )
  }
  return {
    ...content,
    name: record.name,
    category: record.category,
    ...(record.audience ? { audience: record.audience } : {}),
    cswp39Zone: record.cswp39Zone,
    ...(record.cswp39ZoneSubElement ? { cswp39ZoneSubElement: record.cswp39ZoneSubElement } : {}),
    cswp39SectionRef: record.cswp39SectionRef,
    ...(record.cswp39SubSection ? { cswp39SubSection: record.cswp39SubSection } : {}),
    frameworkPhase: record.frameworkPhase,
  }
}

/** Every business tool in the order of the tools data file (`order` column). */
export const BUSINESS_TOOLS: BusinessTool[] = BUSINESS_TOOL_RECORDS.map(businessTool)

if (
  Object.keys(CONTENT_BY_ID).length !== BUSINESS_TOOL_CONTENT.length ||
  BUSINESS_TOOLS.length !== BUSINESS_TOOL_CONTENT.length
) {
  throw new Error('tools data file and business tool registry list different tools')
}

// ---------------------------------------------------------------------------
// Lazy-loaded builder components live in `./businessToolComponents.tsx` to
// keep this registry's chunk free of dynamic-import / TLA dependencies. See
// that file's header for the cycle-break rationale.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Artifact-type ↔ tool-id mapping — single source of truth for the drawer and
// the /business/tools/:id route. Artifact placeholders in the Command Center
// resolve to a builder component through this table; no parallel registry.
// ---------------------------------------------------------------------------

export const ARTIFACT_TYPE_TO_TOOL_ID: Partial<Record<ExecutiveDocumentType, string>> = {
  'roi-model': 'roi-calculator',
  'board-deck': 'board-pitch',
  'crqc-scenario': 'crqc-scenario',
  'breach-scenario': 'breach-simulator',
  'cost-of-inaction': 'cost-of-inaction',
  'cost-model-comparison': 'cost-model-explorer',
  'risk-register': 'risk-register',
  'risk-treatment-plan': 'risk-treatment-plan',
  'audit-checklist': 'audit-checklist',
  'compliance-checklist': 'compliance-checklist',
  'compliance-timeline': 'compliance-timeline',
  'raci-matrix': 'raci-builder',
  'policy-draft': 'policy-generator',
  'kpi-dashboard': 'kpi-dashboard',
  'stakeholder-comms': 'stakeholder-comms',
  'vendor-scorecard': 'vendor-scorecard',
  'contract-clause': 'contract-clause',
  'migration-roadmap': 'roadmap-builder',
  'kpi-tracker': 'kpi-tracker',
  'supply-chain-matrix': 'supply-chain-matrix',
  'deployment-playbook': 'deployment-playbook',
  'crypto-architecture': 'crypto-architecture-diagram',
  'management-tools-audit': 'management-tools-audit',
  'crypto-cbom': 'crypto-cbom-builder',
  'crypto-vulnerability-watch': 'crypto-vulnerability-watch',
  'hybrid-transition': 'hybrid-transition-planner',
  'mti-negotiator': 'mti-negotiator',
  'crypto-api-refactor': 'crypto-api-refactor-audit',
  'cloud-responsibility-matrix': 'cloud-responsibility-matrix',
  'program-charter': 'program-charter',
  'initial-scoping': 'initial-scoping',
  'skills-team-plan': 'skills-team-plan',
  'infra-modernization-plan': 'infra-modernization-planner',
  'refresh-cycle-alignment': 'refresh-cycle-alignment',
  'accelerated-execution-profile': 'accelerated-execution-profile',
  'data-at-rest-strategy': 'data-at-rest-strategy',
  'migration-verification': 'migration-verification',
}

/** Look up the CSWP.39 §-reference (and optional sub-section label) for an
 *  artifact type. Used by `<ArtifactCard>` / `<ArtifactPlaceholder>` to render
 *  a small chip anchoring each tool to its source-document phase. */
export function getCswp39RefForArtifactType(
  type: ExecutiveDocumentType
): { sectionRef: string; subSection?: string } | undefined {
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
  if (!toolId) return undefined
  const tool = BUSINESS_TOOLS.find((t) => t.id === toolId)
  if (!tool) return undefined
  return { sectionRef: tool.cswp39SectionRef, subSection: tool.cswp39SubSection }
}

/** Human-readable tool name + description, keyed by artifact type.
 *  Drawer uses this for headers, hero copy, and empty-state messages so it
 *  stays in sync with the /business/tools/:id page without re-authoring. */
export const TOOL_LABELS_BY_ARTIFACT_TYPE: Partial<
  Record<ExecutiveDocumentType, { name: string; description: string }>
> = Object.fromEntries(
  (Object.entries(ARTIFACT_TYPE_TO_TOOL_ID) as [ExecutiveDocumentType, string][])
    .map(([type, toolId]) => {
      const tool = BUSINESS_TOOLS.find((t) => t.id === toolId)
      return tool ? [type, { name: tool.name, description: tool.description }] : null
    })
    .filter((e): e is [ExecutiveDocumentType, { name: string; description: string }] => e !== null)
)
