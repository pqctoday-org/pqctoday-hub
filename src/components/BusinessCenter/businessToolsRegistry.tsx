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
} from 'lucide-react'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import type { ZoneId } from '@/data/cswp39ZoneData'

// ---------------------------------------------------------------------------
// Business tool registry — non-cryptographic planning & governance tools
// extracted from executive learn modules (zero-prop, standalone components)
// ---------------------------------------------------------------------------

export interface BusinessTool {
  id: string
  name: string
  description: string
  category: string
  icon: React.ElementType
  keywords: string[]
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
}

export const BUSINESS_TOOLS: BusinessTool[] = [
  // ── Risk & Strategy ────────────────────────────────────────────────────────
  {
    id: 'roi-calculator',
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
  },
  {
    id: 'board-pitch',
    name: 'Board Pitch Builder',
    description: 'Build board-ready investment proposals with executive summary and budget request',
    category: 'Risk & Strategy',
    icon: Presentation,
    keywords: ['board', 'pitch', 'executive', 'proposal', 'investment', 'deck'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Business Requirements',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — business case',
  },
  {
    id: 'crqc-scenario',
    name: 'CRQC Scenario Planner',
    description: 'Plan for cryptographically relevant quantum computer threat scenarios',
    category: 'Risk & Strategy',
    icon: AlertTriangle,
    keywords: ['crqc', 'quantum', 'threat', 'scenario', 'risk', 'planning'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Threats',
    cswp39SectionRef: '§6.1',
    cswp39SubSection: 'Resource considerations — threat horizon',
  },
  {
    id: 'risk-register',
    name: 'Risk Register Builder',
    description: 'Build a PQC risk register with impact, likelihood, owners, and mitigations',
    category: 'Risk & Strategy',
    icon: ListChecks,
    keywords: ['risk', 'register', 'inventory', 'mitigation', 'likelihood', 'impact'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'Risk Analysis Engine',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
  },
  {
    id: 'risk-treatment-plan',
    name: 'Risk Heatmap & Treatment Plan',
    description: 'Visualise residual risk and draft treatment strategies per risk category',
    category: 'Risk & Strategy',
    icon: Flame,
    keywords: ['heatmap', 'treatment', 'residual', 'risk', 'mitigation', 'strategy'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'Risk Analysis Engine',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
  },

  // ── Compliance & Audit ─────────────────────────────────────────────────────
  {
    id: 'audit-checklist',
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
  },
  {
    id: 'compliance-timeline',
    name: 'Compliance Timeline Builder',
    description: 'Plot framework milestones, deadlines, and dependencies on a single timeline',
    category: 'Compliance & Audit',
    icon: Calendar,
    keywords: ['compliance', 'timeline', 'deadline', 'framework', 'milestone', 'regulatory'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Regulations/Mandates',
    cswp39SectionRef: '§5.1',
    cswp39SubSection: 'Standards, regulations, mandates',
  },

  // ── Governance & Policy ────────────────────────────────────────────────────
  {
    id: 'raci-builder',
    name: 'RACI Builder',
    description: 'Build RACI matrices for 10 PQC activities across 6 organizational roles',
    category: 'Governance & Policy',
    icon: Users,
    keywords: ['raci', 'governance', 'responsibility', 'roles', 'accountable'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — governance',
  },
  {
    id: 'policy-generator',
    name: 'Policy Template Generator',
    description: 'Generate cryptographic algorithm, key management, vendor, and migration policies',
    category: 'Governance & Policy',
    icon: FileText,
    keywords: ['policy', 'template', 'governance', 'key management', 'algorithm'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5.2',
    cswp39SubSection: 'Crypto security policy enforcement',
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard Builder',
    description: 'Build KPI dashboards for tracking PQC migration metrics and progress',
    category: 'Governance & Policy',
    icon: BarChart3,
    keywords: ['kpi', 'dashboard', 'metrics', 'tracking', 'progress', 'migration'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'KPI Dashboards',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
  },

  // ── Vendor & Supply Chain ──────────────────────────────────────────────────
  {
    id: 'vendor-scorecard',
    name: 'Vendor Scorecard Builder',
    description: 'Create vendor assessment scorecards for PQC readiness evaluation',
    category: 'Vendor & Supply Chain',
    icon: Star,
    keywords: ['vendor', 'scorecard', 'assessment', 'evaluation', 'supply chain'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains',
  },
  {
    id: 'contract-clause',
    name: 'Contract Clause Generator',
    description: 'Generate PQC-ready contract clauses for vendor agreements',
    category: 'Vendor & Supply Chain',
    icon: ScrollText,
    keywords: ['contract', 'clause', 'vendor', 'agreement', 'legal', 'procurement'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains',
  },
  {
    id: 'supply-chain-matrix',
    name: 'Supply Chain Risk Matrix',
    description: 'Assess supply chain risks with dependency mapping and impact analysis',
    category: 'Vendor & Supply Chain',
    icon: Network,
    keywords: ['supply chain', 'risk', 'matrix', 'dependency', 'impact'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Supply Chains',
    cswp39SectionRef: '§5.3',
    cswp39SubSection: 'Technology supply chains',
  },

  // ── Migration Planning ─────────────────────────────────────────────────────
  {
    id: 'roadmap-builder',
    name: 'Roadmap Builder',
    description: 'Create phased migration roadmaps with milestones and dependencies',
    category: 'Migration Planning',
    icon: Map,
    keywords: ['roadmap', 'migration', 'plan', 'milestone', 'phase', 'timeline'],
    cswp39Zone: 'migration',
    cswp39SectionRef: '§3.2',
    cswp39SubSection: 'Algorithm transitions',
  },
  {
    id: 'stakeholder-comms',
    name: 'Stakeholder Comms Planner',
    description: 'Plan stakeholder communication strategies for PQC migration programs',
    category: 'Migration Planning',
    icon: MessageSquare,
    keywords: ['stakeholder', 'communication', 'plan', 'messaging', 'change management'],
    cswp39Zone: 'governance',
    cswp39ZoneSubElement: 'Crypto Policies',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Strategic plan — governance',
  },
  {
    id: 'kpi-tracker',
    name: 'KPI Tracker Template',
    description: 'Track migration KPIs with configurable metrics and reporting templates',
    category: 'Migration Planning',
    icon: Activity,
    keywords: ['kpi', 'tracker', 'metrics', 'reporting', 'migration', 'progress'],
    cswp39Zone: 'risk-management',
    cswp39ZoneSubElement: 'KPI Dashboards',
    cswp39SectionRef: '§6.5',
    cswp39SubSection: 'Maturity assessment',
  },
  {
    id: 'deployment-playbook',
    name: 'Deployment Playbook',
    description: 'Generate deployment playbooks with rollback procedures and validation steps',
    category: 'Migration Planning',
    icon: Rocket,
    keywords: ['deployment', 'playbook', 'rollback', 'validation', 'rollout'],
    cswp39Zone: 'mitigation',
    cswp39SectionRef: '§4',
    cswp39SubSection: 'System implementations',
  },

  // ── Architecture (CSWP.39 §5.4) ────────────────────────────────────────────
  {
    id: 'crypto-architecture-diagram',
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
  },

  // ── Management Tools (CSWP.39 Fig 3 — discovery / assessment / config / enforcement) ──
  {
    id: 'management-tools-audit',
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
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Identify gaps in enterprise management tools',
  },
  {
    id: 'crypto-cbom-builder',
    name: 'Crypto BOM (CBOM) Builder',
    description:
      'Build a CBOM slice from an SBOM, library posture, or HSM inventory; feeds the Assets pipeline',
    category: 'Migration Planning',
    icon: Boxes,
    keywords: ['cbom', 'sbom', 'inventory', 'libraries', 'hsm', 'fips', 'cyclonedx'],
    cswp39Zone: 'assets',
    cswp39ZoneSubElement: 'Libraries',
    cswp39SectionRef: '§5.2',
    cswp39SubSection: 'Crypto security policy enforcement (CBOM ingestion)',
  },
  {
    id: 'crypto-vulnerability-watch',
    name: 'Crypto Vulnerability Watch',
    description:
      'NIST NVD CVE digest for the products on your /migrate selection — Heartbleed, POODLE, BEAST, FREAK, and the rest, joined via CPE',
    category: 'Migration Planning',
    icon: ShieldAlert,
    keywords: ['cve', 'nvd', 'vulnerability', 'cpe', 'heartbleed', 'poodle', 'logjam'],
    cswp39Zone: 'assets',
    cswp39ZoneSubElement: 'Code',
    cswp39SectionRef: '§5',
    cswp39SubSection: 'Vulnerability discovery on the crypto attack surface',
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
  'risk-register': 'risk-register',
  'risk-treatment-plan': 'risk-treatment-plan',
  'audit-checklist': 'audit-checklist',
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
