// SPDX-License-Identifier: GPL-3.0-only
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

// ---------------------------------------------------------------------------
// Business tool registry — non-cryptographic planning & governance tools
// extracted from executive learn modules (zero-prop, standalone components)
// ---------------------------------------------------------------------------

/** Intended primary reader. Defaults to 'business' (Executive / GRC) when unset;
 *  only the handful of protocol/implementation tools carry a technical audience
 *  so a non-coder can tell at a glance which tools are meant for them. */
export type BusinessToolAudience = 'business' | 'architect' | 'developer'

export interface BusinessTool {
  id: string
  name: string
  description: string
  category: string
  icon: React.ElementType
  keywords: string[]
  /** Intended reader; omit for the default Executive / GRC audience. */
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
}

export const BUSINESS_TOOLS: BusinessTool[] = [
  // ── Risk & Strategy ────────────────────────────────────────────────────────
  {
    id: 'roi-calculator',
    goodAnswer:
      'A payback period you would defend under questioning — which means the breach-avoidance input is a number you can source, not the one that makes the case work.',
    name: 'ROI Calculator',
    description:
      'Calculate migration ROI with breach avoidance, compliance savings, and payback period',
    category: 'Risk & Strategy',
    icon: Calculator,
    keywords: ['roi', 'cost', 'benefit', 'investment', 'budget', 'breach', 'payback'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Business Requirements',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — business case',
    frameworkPhase: 'p0',
  },
  {
    id: 'board-pitch',
    goodAnswer:
      'One ask, one date, one consequence of missing it. If the deck needs a second slide to explain the ask, the ask is not clear enough yet.',
    name: 'Board Pitch Builder',
    description: 'Build board-ready investment proposals with executive summary and budget request',
    category: 'Risk & Strategy',
    icon: Presentation,
    keywords: ['board', 'pitch', 'executive', 'proposal', 'investment', 'deck'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Business Requirements',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — business case',
    frameworkPhase: 'p0',
  },
  {
    id: 'breach-simulator',
    goodAnswer:
      'A scenario your own incident team recognises. If nobody in the room says "that is roughly what would happen", the inputs are wrong, not the model.',
    name: 'Breach Scenario Simulator',
    description:
      'Compare classical vs quantum-enabled breach cost (per-event and annual expected loss) with HNDL exposure',
    category: 'Risk & Strategy',
    icon: ShieldAlert,
    keywords: ['breach', 'cost', 'quantum', 'hndl', 'exposure', 'ale', 'risk'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Threats',
    cswp39SectionRef: '§6.1',
    cswp39SubSection: 'Resource considerations — breach exposure',
    frameworkPhase: 'p0',
  },
  {
    id: 'cost-of-inaction',
    goodAnswer:
      'A figure that changes a decision. If waiting and acting come out within rounding of each other, say so plainly rather than tuning the inputs until they diverge.',
    name: 'Cost of Inaction Analyzer',
    description:
      'Model the discounted cost of delaying PQC migration — breach exposure, HNDL residual, and regulatory penalties',
    category: 'Risk & Strategy',
    icon: CalendarClock,
    keywords: ['delay', 'inaction', 'cost', 'npv', 'penalty', 'hndl', 'breach'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Business Requirements',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — business case',
    frameworkPhase: 'p0',
  },
  {
    id: 'cost-model-explorer',
    goodAnswer:
      'A range, not a point. The honest output of this tool is the spread between your best and worst assumptions, and which assumption drives it.',
    name: 'Cost Model Explorer',
    description:
      'Compare the six PQC costing-model families on one scenario, with a live Monte Carlo run',
    category: 'Risk & Strategy',
    icon: BarChart3,
    keywords: ['cost', 'model', 'estimate', 'monte carlo', 'parametric', 'scenario', 'compare'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Business Requirements',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — business case',
    frameworkPhase: 'p0',
  },
  {
    id: 'crqc-scenario',
    goodAnswer:
      'A plan that survives the machine arriving early. If your roadmap only works at the median estimate, it is a forecast, not a plan.',
    name: 'CRQC Scenario Planner',
    description: 'Plan for cryptographically relevant quantum computer threat scenarios',
    category: 'Risk & Strategy',
    icon: AlertTriangle,
    keywords: ['crqc', 'quantum', 'threat', 'scenario', 'risk', 'planning'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Threats',
    cswp39SectionRef: '§6.1',
    cswp39SubSection: 'Resource considerations — threat horizon',
    frameworkPhase: 'p0',
  },
  {
    id: 'risk-register',
    goodAnswer:
      'Every entry has a named owner and a review date. An unowned risk is a note, and notes do not get treated.',
    name: 'Risk Register Builder',
    description: 'Build a PQC risk register with impact, likelihood, owners, and mitigations',
    category: 'Risk & Strategy',
    icon: ListChecks,
    keywords: ['risk', 'register', 'inventory', 'mitigation', 'likelihood', 'impact'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'Risk Analysis Engine',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
    frameworkPhase: 'p3',
  },
  {
    id: 'risk-treatment-plan',
    goodAnswer:
      'Each high risk maps to a treatment someone has actually agreed to fund. Accepting a risk is a valid answer — leaving it blank is not.',
    name: 'Risk Heatmap & Treatment Plan',
    description: 'Visualise residual risk and draft treatment strategies per risk category',
    category: 'Risk & Strategy',
    icon: Flame,
    keywords: ['heatmap', 'treatment', 'residual', 'risk', 'mitigation', 'strategy'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'Risk Analysis Engine',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
    frameworkPhase: 'p3',
  },

  // ── Compliance & Audit ─────────────────────────────────────────────────────
  {
    id: 'compliance-checklist',
    goodAnswer:
      'Every "yes" points at evidence that exists today. A checklist of intentions passes no audit.',
    name: 'Compliance Checklist',
    description:
      'Per-framework PQC compliance checklist seeded from your starred frameworks and assessment',
    category: 'Compliance & Audit',
    icon: ClipboardCheck,
    keywords: ['compliance', 'checklist', 'framework', 'controls', 'pqc'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Standards',
    cswp39SectionRef: '§5.1',
    cswp39SubSection: 'Standards, regulations, mandates',
    frameworkPhase: 'foundations',
  },
  {
    id: 'audit-checklist',
    goodAnswer:
      'You could hand this to an auditor tomorrow. If an item needs a conversation to explain, write the explanation into the item.',
    name: 'Audit Readiness Checklist',
    description:
      'Multi-section audit checklist covering inventory, policy, controls, and documentation',
    category: 'Compliance & Audit',
    icon: ClipboardCheck,
    keywords: ['audit', 'checklist', 'readiness', 'compliance', 'inventory', 'controls'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Standards',
    cswp39SectionRef: '§5.1',
    cswp39SubSection: 'Standards, regulations, mandates',
    frameworkPhase: 'foundations',
  },
  {
    id: 'compliance-timeline',
    goodAnswer:
      'Dates you did not choose, next to dates you did. The gap between the two is the plan.',
    name: 'Compliance Timeline Builder',
    description: 'Plot framework milestones, deadlines, and dependencies on a single timeline',
    category: 'Compliance & Audit',
    icon: Calendar,
    keywords: ['compliance', 'timeline', 'deadline', 'framework', 'milestone', 'regulatory'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Regulations/Mandates',
    cswp39SectionRef: '§5.1',
    cswp39SubSection: 'Standards, regulations, mandates',
    frameworkPhase: 'p4',
  },

  // ── Governance & Policy ────────────────────────────────────────────────────
  {
    id: 'raci-builder',
    goodAnswer:
      'Exactly one Accountable per row. Two means nobody, and that is the failure this tool exists to prevent.',
    name: 'RACI Builder',
    description: 'Build RACI matrices for 10 PQC activities across 6 organizational roles',
    category: 'Governance & Policy',
    icon: Users,
    keywords: ['raci', 'governance', 'responsibility', 'roles', 'accountable'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — governance',
    frameworkPhase: 'p0',
  },
  {
    id: 'policy-generator',
    goodAnswer:
      'A policy someone can be non-compliant with. If no realistic action would breach it, it is a statement of values, not a policy.',
    name: 'Policy Template Generator',
    description: 'Generate cryptographic algorithm, key management, vendor, and migration policies',
    category: 'Governance & Policy',
    icon: FileText,
    keywords: ['policy', 'template', 'governance', 'key management', 'algorithm'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5.2',
    cswp39SubSection: 'Crypto security policy enforcement',
    frameworkPhase: 'p0',
  },
  {
    id: 'kpi-dashboard',
    goodAnswer:
      'Three to five measures that would move if the programme stalled. Anything that stays flat either way is reporting, not measurement.',
    name: 'KPI Dashboard Builder',
    description: 'Build KPI dashboards for tracking PQC migration metrics and progress',
    category: 'Governance & Policy',
    icon: BarChart3,
    keywords: ['kpi', 'dashboard', 'metrics', 'tracking', 'progress', 'migration'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'KPI Dashboards',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
    frameworkPhase: 'foundations',
  },

  // ── Vendor & Supply Chain ──────────────────────────────────────────────────
  {
    id: 'vendor-scorecard',
    goodAnswer:
      'Scores backed by something the vendor published, not by what they said on a call. The migrate catalog carries the proof and its date.',
    name: 'Vendor Scorecard Builder',
    description: 'Create vendor assessment scorecards for PQC readiness evaluation',
    category: 'Vendor & Supply Chain',
    icon: Star,
    keywords: ['vendor', 'scorecard', 'assessment', 'evaluation', 'supply chain'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains',
    frameworkPhase: 'p7',
  },
  {
    id: 'contract-clause',
    goodAnswer:
      'Language your procurement team will actually accept. A clause nobody will sign protects nothing.',
    name: 'Contract Clause Generator',
    description: 'Generate PQC-ready contract clauses for vendor agreements',
    category: 'Vendor & Supply Chain',
    icon: ScrollText,
    keywords: ['contract', 'clause', 'vendor', 'agreement', 'legal', 'procurement'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains',
    frameworkPhase: 'p7',
  },
  {
    id: 'supply-chain-matrix',
    goodAnswer:
      'The suppliers you cannot replace inside your own deadline are visible at a glance. Those are the programme, the rest are logistics.',
    name: 'Supply Chain Risk Matrix',
    description: 'Assess supply chain risks with dependency mapping and impact analysis',
    category: 'Vendor & Supply Chain',
    icon: Network,
    keywords: ['supply chain', 'risk', 'matrix', 'dependency', 'impact'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains',
    frameworkPhase: 'p7',
  },

  // ── Migration Planning ─────────────────────────────────────────────────────
  {
    id: 'roadmap-builder',
    goodAnswer:
      'Each phase has an exit test, not just an end date. "Done" has to be checkable by someone who was not in the room.',
    name: 'Roadmap Builder',
    description:
      'Build a two-track migration roadmap (key-exchange/HNDL ∥ signatures-PKI/TNFL) on the 8-phase spine, with gates G0–G6 (+ G8 at closure) and milestone dependencies',
    category: 'Migration Planning',
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
    cswp39Zone: 'migration',
    // Best-effort assignment (2026-08-02) — this tool orchestrates the whole
    // zone's activity, not one narrow contains[] item; 'Library upgrades' is
    // the most representative single workstream it sequences.
    cswp39ZoneSubElement: 'Library upgrades',
    cswp39SectionRef: '§3.2',
    cswp39SubSection: 'Algorithm transitions',
    frameworkPhase: 'p4',
  },
  {
    id: 'stakeholder-comms',
    goodAnswer:
      'Each audience gets the one thing they need to decide. If two audiences get the same message, one of them is being ignored.',
    name: 'Stakeholder Comms Planner',
    description: 'Plan stakeholder communication strategies for PQC migration programs',
    category: 'Migration Planning',
    icon: MessageSquare,
    keywords: ['stakeholder', 'communication', 'plan', 'messaging', 'change management'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — governance',
    frameworkPhase: 'p4',
  },
  {
    id: 'kpi-tracker',
    goodAnswer:
      'A trend, not a snapshot. Two data points is a line; the value starts at the third.',
    name: 'KPI Tracker Template',
    description: 'Track migration KPIs with configurable metrics and reporting templates',
    category: 'Migration Planning',
    icon: Activity,
    keywords: ['kpi', 'tracker', 'metrics', 'reporting', 'migration', 'progress'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'KPI Dashboards',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
    frameworkPhase: 'foundations',
  },
  {
    id: 'deployment-playbook',
    goodAnswer:
      'A colleague could run it at 3am without calling you. That is the only real test of a playbook.',
    name: 'Deployment Playbook',
    description: 'Generate deployment playbooks with rollback procedures and validation steps',
    category: 'Migration Planning',
    icon: Rocket,
    keywords: ['deployment', 'playbook', 'rollback', 'validation', 'rollout'],
    cswp39Zone: 'mitigation',
    cswp39ZoneSubElement: 'Crypto gateway / bump-in-the-wire',
    cswp39SectionRef: '§4',
    cswp39SubSection: 'System implementations',
    frameworkPhase: 'p5',
  },
  {
    id: 'hybrid-transition-planner',
    goodAnswer:
      'A stated exit from hybrid, with a trigger. Hybrid without an end date is permanent, and permanent hybrid is twice the maintenance forever.',
    name: 'Hybrid Transition Planner',
    audience: 'architect',
    description:
      'Architect-facing decision tree from CSWP.39 §3.2.4 - pick traditional+PQC, PQC+PQC, pure PQC, or crypto-gateway pathway with concrete algorithm pairings',
    category: 'Migration Planning',
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
    cswp39Zone: 'migration',
    cswp39ZoneSubElement: 'Protocol negotiation updates',
    cswp39SectionRef: '§3.2.4',
    cswp39SubSection: 'Hybrid Cryptographic Algorithms',
    frameworkPhase: 'p5',
  },
  {
    id: 'mti-negotiator',
    goodAnswer:
      'A mandatory-to-implement set both ends can actually negotiate today, checked against the protocol matrix rather than assumed.',
    name: 'MTI Negotiator',
    audience: 'architect',
    description:
      'Protocol-designer + architect decision tool from CSWP.39 §3.1.1 - picks Mandatory-to-Implement signature / KEM / hash plus alternates from audience, deadline, and constraint inputs',
    category: 'Migration Planning',
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
    cswp39Zone: 'migration',
    cswp39ZoneSubElement: 'Protocol negotiation updates',
    cswp39SectionRef: '§3.1.1',
    cswp39SubSection: 'Mandatory-to-Implement Algorithms',
    frameworkPhase: 'p5',
  },
  {
    id: 'crypto-api-refactor-audit',
    goodAnswer:
      'A list of call sites, not a list of libraries. The refactor happens where the API is called, and that is where the estimate has to come from.',
    name: 'Crypto API Refactor Audit',
    audience: 'developer',
    description:
      'Architect + senior-developer audit from CSWP.39 §4.1 - grades current crypto-agility state and emits a phased refactor checklist with language-specific call-site guidance (Go / Java / .NET / Node / Python / Rust / C / C++ / JS)',
    category: 'Migration Planning',
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
    cswp39Zone: 'migration',
    cswp39ZoneSubElement: 'Library upgrades',
    cswp39SectionRef: '§4.1',
    cswp39SubSection: 'Using an API in a Crypto Library Application',
    frameworkPhase: 'p5',
  },
  {
    id: 'cloud-responsibility-matrix',
    goodAnswer:
      'No cell reads "shared" without saying who acts first. Shared responsibility is where migrations stall.',
    name: 'Cloud Responsibility Matrix',
    audience: 'architect',
    description:
      'Architect + compliance-lead matrix from CSWP.39 §6.4 - per-asset-class shared-responsibility model across IaaS / PaaS / SaaS / FaaS, with PQC availability per cloud and watch-outs for multi-cloud, BYOK, FedRAMP, and sovereign-cloud overlays',
    category: 'Migration Planning',
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
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§6.4',
    cswp39SubSection: 'Crypto Agility in the Cloud',
    frameworkPhase: 'p7',
  },

  // ── Architecture (CSWP.39 §5.4) ────────────────────────────────────────────
  {
    id: 'crypto-architecture-diagram',
    goodAnswer:
      'Every trust boundary shows which algorithm crosses it. A diagram without algorithms on the arrows cannot tell you what breaks.',
    name: 'Crypto Architecture Diagram',
    description:
      'Document apps, libraries, HSMs, protocols, key stores, and CAs with their dependencies; renders as a Mermaid diagram',
    category: 'Migration Planning',
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
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Architecture',
    cswp39SectionRef: '§5.4',
    cswp39SubSection: 'Cryptographic architecture',
    frameworkPhase: 'p1',
  },

  // ── Management Tools (CSWP.39 Fig 3 — discovery / assessment / config / enforcement) ──
  {
    id: 'management-tools-audit',
    goodAnswer:
      'You know which of your own tools would have to change before a single production key does.',
    name: 'Management Tools Audit',
    description:
      'Audit your discovery, assessment, configuration, and enforcement tooling stack — feeds the Information Repository per CSWP.39 §5',
    category: 'Migration Planning',
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
    cswp39Zone: 'management-tools',
    cswp39ZoneSubElement: 'Log/SIEM',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Identify gaps in enterprise management tools',
    frameworkPhase: 'p1',
  },
  {
    id: 'crypto-cbom-builder',
    goodAnswer:
      'A CBOM you can regenerate. A hand-built one is accurate for a week; a generated one is accurate for as long as you keep generating it.',
    name: 'Crypto BOM (CBOM) Builder',
    description:
      'Build a CBOM slice from an SBOM, library posture, or HSM inventory; feeds the Assets pipeline',
    category: 'Migration Planning',
    icon: Boxes,
    keywords: ['cbom', 'sbom', 'inventory', 'libraries', 'hsm', 'fips', 'cyclonedx'],
    cswp39Zone: 'assets',
    cswp39ZoneSubElement: 'Libraries',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains (CBOM ingestion)',
    frameworkPhase: 'p2',
  },
  {
    id: 'crypto-vulnerability-watch',
    goodAnswer:
      'A short list you will actually read. A watch that surfaces everything gets ignored like everything else.',
    name: 'Crypto Vulnerability Watch',
    description:
      'NIST NVD CVE digest for the products on your /migrate selection, joined via CPE — the top CVEs per product by severity from the current snapshot',
    category: 'Migration Planning',
    icon: ShieldAlert,
    keywords: ['cve', 'nvd', 'vulnerability', 'cpe', 'severity', 'nvd snapshot'],
    cswp39Zone: 'management-tools',
    cswp39ZoneSubElement: 'Vulnerability',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Identify Gaps — vulnerability management (CVE feeds, library EoL tracking)',
    frameworkPhase: 'p1',
  },

  // ── Program Establishment (Applied Quantum Phase 0 / Foundations) ───────────
  {
    id: 'program-charter',
    goodAnswer:
      'A named sponsor and a stated scope boundary. The boundary matters more — a charter without one absorbs every adjacent problem.',
    name: 'Program Charter',
    description:
      'Phase 0 mandate artifact — sponsor sign-off, Steering Committee, QRPM appointment, governance cadence, and the multi-year budget commitment',
    category: 'Governance & Policy',
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
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — governance',
    frameworkPhase: 'p0',
  },
  {
    id: 'initial-scoping',
    goodAnswer:
      'An honest inventory gap. "We do not know what is in this estate" is a finding, and often the most valuable one.',
    name: 'Initial Scoping Assessment',
    description:
      'Phase 0 first-cut scope — top-20 in-scope systems, an estate-size estimate, and the top-10 vendor dependencies; seedable from your /migrate selection',
    category: 'Risk & Strategy',
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
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Business Requirements',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — scope',
    frameworkPhase: 'p0',
  },
  {
    id: 'skills-team-plan',
    goodAnswer:
      'A plan that works with the people you have. Hiring is a dependency, not a mitigation.',
    name: 'Skills & Team Plan',
    description:
      'Foundations staffing plan — core roles + FTE from the framework role model, the 1-FTE-per-500-instances sizing heuristic, and build / borrow / buy per role',
    category: 'Governance & Policy',
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
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'KPI Dashboards',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
    frameworkPhase: 'foundations',
  },
  {
    id: 'infra-modernization-planner',
    goodAnswer:
      'PQC work rides existing refresh cycles wherever it can. Hardware you were replacing anyway is the cheapest migration you will ever do.',
    name: 'Infrastructure Modernization Planner',
    description:
      'Phase 6 deliverable — consolidates the PKI modernization plan, HSM/KMS upgrade schedule, network/middlebox compatibility report, and PQC capacity plan into one infrastructure-readiness artifact',
    category: 'Migration Planning',
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
    cswp39Zone: 'mitigation',
    // Weak fit (2026-08-02) — this tool's real content (PKI/HSM/KMS upgrade
    // scheduling) sits closer to the migration zone's "Firmware updates" than
    // anything in mitigation's contains[] list; kept in its existing zone
    // (only the missing sub-element was in scope) but the zone assignment
    // itself is worth a follow-up review.
    cswp39ZoneSubElement: 'Network-layer re-encryption',
    cswp39SectionRef: '§6',
    cswp39SubSection: 'Infrastructure modernization',
    frameworkPhase: 'p6',
  },
  {
    id: 'refresh-cycle-alignment',
    goodAnswer:
      'The assets whose refresh lands AFTER your deadline are named. Those need a decision now, not later.',
    name: 'Refresh-Cycle Alignment',
    description:
      'Phase 4 Activity 4.3 — maps PQC migration tasks onto already-funded infrastructure refresh programs (data center, SD-WAN, cloud, PKI, HSM, vendor renewals) so PQC work rides existing budgets',
    category: 'Migration Planning',
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
    cswp39Zone: 'migration',
    cswp39ZoneSubElement: 'Firmware updates',
    cswp39SectionRef: '§4',
    cswp39SubSection: 'Roadmap — refresh-cycle alignment',
    frameworkPhase: 'p4',
  },
  {
    id: 'accelerated-execution-profile',
    goodAnswer:
      'The specific things you would drop to go faster, listed before you need them. Deciding under pressure is how scope gets cut badly.',
    name: 'Accelerated Execution Profile',
    description:
      'Phase 4 Activity 4.7 — a pre-drafted contingency package (trigger conditions, compressed sequence, pre-approved risk acceptances, emergency resource request, activation authority) activated if the quantum timeline accelerates',
    category: 'Governance & Policy',
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
    cswp39Zone: 'migration',
    cswp39ZoneSubElement: 'ACME / EST / CMP automation',
    cswp39SectionRef: '§4',
    cswp39SubSection: 'Roadmap — contingency',
    frameworkPhase: 'p4',
  },
  {
    id: 'data-at-rest-strategy',
    goodAnswer:
      'Retention drives the order. Data that stays secret for ten years is the harvest-now target; data that expires next quarter is not.',
    name: 'Data-at-Rest Strategy',
    description:
      'Phase 5 Activity 5.6 — per-store data-at-rest decision (re-encrypt under PQC keys, PQC key-wrap, crypto-shred, delete, or accept & monitor), recorded back into the CBOM',
    category: 'Migration Planning',
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
    cswp39Zone: 'mitigation',
    // No cswp39ZoneSubElement (2026-09-03): the previous anchor,
    // 'Mandatory sunset date', was removed from mitigation's contains[] —
    // it asserted a NIST CSWP 39 §4.6 requirement the published text does
    // not make (fetched the source directly; the word "sunset" does not
    // appear in that section). It was already a weak, forced fit for this
    // tool (see the removed comment); left ungrouped rather than forced
    // onto a different contains[] item that fits no better.
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Data-at-rest strategy',
    frameworkPhase: 'p5',
  },
  {
    id: 'migration-verification',
    goodAnswer:
      'Evidence that the old algorithm is gone, not just that the new one works. Both running is the normal state, and it is not done.',
    name: 'Migration Verification & Closure',
    description:
      "Prove migration with the framework's 5-point evidence standard, log classical-key decommissioning (SP 800-88), and record program closure & BAU handover",
    category: 'Migration Planning',
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
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Processes',
    // §5.5 does not exist — §5 runs 5.1–5.4. Verification/closure is the fifth
    // "key activities" bullet of §5 ("Implement the strategy and actions based
    // on the prioritized list of assets"), so the parent section is the honest ref.
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — migration verification & evidence',
    frameworkPhase: 'verify-close',
  },
]

export const BUSINESS_CATEGORIES = [
  'Risk & Strategy',
  'Compliance & Audit',
  'Governance & Policy',
  'Vendor & Supply Chain',
  'Migration Planning',
]

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
