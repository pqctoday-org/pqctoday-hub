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
} from 'lucide-react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import type { ExecutiveDocumentType } from '@/services/storage/types'

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
  },
  {
    id: 'board-pitch',
    name: 'Board Pitch Builder',
    description: 'Build board-ready investment proposals with executive summary and budget request',
    category: 'Risk & Strategy',
    icon: Presentation,
    keywords: ['board', 'pitch', 'executive', 'proposal', 'investment', 'deck'],
  },
  {
    id: 'crqc-scenario',
    name: 'CRQC Scenario Planner',
    description: 'Plan for cryptographically relevant quantum computer threat scenarios',
    category: 'Risk & Strategy',
    icon: AlertTriangle,
    keywords: ['crqc', 'quantum', 'threat', 'scenario', 'risk', 'planning'],
  },
  {
    id: 'risk-register',
    name: 'Risk Register Builder',
    description: 'Build a PQC risk register with impact, likelihood, owners, and mitigations',
    category: 'Risk & Strategy',
    icon: ListChecks,
    keywords: ['risk', 'register', 'inventory', 'mitigation', 'likelihood', 'impact'],
  },
  {
    id: 'risk-treatment-plan',
    name: 'Risk Heatmap & Treatment Plan',
    description: 'Visualise residual risk and draft treatment strategies per risk category',
    category: 'Risk & Strategy',
    icon: Flame,
    keywords: ['heatmap', 'treatment', 'residual', 'risk', 'mitigation', 'strategy'],
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
  },
  {
    id: 'compliance-timeline',
    name: 'Compliance Timeline Builder',
    description: 'Plot framework milestones, deadlines, and dependencies on a single timeline',
    category: 'Compliance & Audit',
    icon: Calendar,
    keywords: ['compliance', 'timeline', 'deadline', 'framework', 'milestone', 'regulatory'],
  },

  // ── Governance & Policy ────────────────────────────────────────────────────
  {
    id: 'raci-builder',
    name: 'RACI Builder',
    description: 'Build RACI matrices for 10 PQC activities across 6 organizational roles',
    category: 'Governance & Policy',
    icon: Users,
    keywords: ['raci', 'governance', 'responsibility', 'roles', 'accountable'],
  },
  {
    id: 'policy-generator',
    name: 'Policy Template Generator',
    description: 'Generate cryptographic algorithm, key management, vendor, and migration policies',
    category: 'Governance & Policy',
    icon: FileText,
    keywords: ['policy', 'template', 'governance', 'key management', 'algorithm'],
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard Builder',
    description: 'Build KPI dashboards for tracking PQC migration metrics and progress',
    category: 'Governance & Policy',
    icon: BarChart3,
    keywords: ['kpi', 'dashboard', 'metrics', 'tracking', 'progress', 'migration'],
  },

  // ── Vendor & Supply Chain ──────────────────────────────────────────────────
  {
    id: 'vendor-scorecard',
    name: 'Vendor Scorecard Builder',
    description: 'Create vendor assessment scorecards for PQC readiness evaluation',
    category: 'Vendor & Supply Chain',
    icon: Star,
    keywords: ['vendor', 'scorecard', 'assessment', 'evaluation', 'supply chain'],
  },
  {
    id: 'contract-clause',
    name: 'Contract Clause Generator',
    description: 'Generate PQC-ready contract clauses for vendor agreements',
    category: 'Vendor & Supply Chain',
    icon: ScrollText,
    keywords: ['contract', 'clause', 'vendor', 'agreement', 'legal', 'procurement'],
  },
  {
    id: 'supply-chain-matrix',
    name: 'Supply Chain Risk Matrix',
    description: 'Assess supply chain risks with dependency mapping and impact analysis',
    category: 'Vendor & Supply Chain',
    icon: Network,
    keywords: ['supply chain', 'risk', 'matrix', 'dependency', 'impact'],
  },

  // ── Migration Planning ─────────────────────────────────────────────────────
  {
    id: 'roadmap-builder',
    name: 'Roadmap Builder',
    description: 'Create phased migration roadmaps with milestones and dependencies',
    category: 'Migration Planning',
    icon: Map,
    keywords: ['roadmap', 'migration', 'plan', 'milestone', 'phase', 'timeline'],
  },
  {
    id: 'stakeholder-comms',
    name: 'Stakeholder Comms Planner',
    description: 'Plan stakeholder communication strategies for PQC migration programs',
    category: 'Migration Planning',
    icon: MessageSquare,
    keywords: ['stakeholder', 'communication', 'plan', 'messaging', 'change management'],
  },
  {
    id: 'kpi-tracker',
    name: 'KPI Tracker Template',
    description: 'Track migration KPIs with configurable metrics and reporting templates',
    category: 'Migration Planning',
    icon: Activity,
    keywords: ['kpi', 'tracker', 'metrics', 'reporting', 'migration', 'progress'],
  },
  {
    id: 'deployment-playbook',
    name: 'Deployment Playbook',
    description: 'Generate deployment playbooks with rollback procedures and validation steps',
    category: 'Migration Planning',
    icon: Rocket,
    keywords: ['deployment', 'playbook', 'rollback', 'validation', 'rollout'],
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
// Lazy-loaded components — each wraps named exports from PKILearning modules
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>

export const BUSINESS_TOOL_COMPONENTS: Record<string, LazyComp> = {
  'roi-calculator': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PQCBusinessCase/components/ROICalculator').then(
      (m) => ({ default: m.ROICalculator })
    )
  ),
  'board-pitch': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PQCBusinessCase/components/BoardPitchBuilder').then(
      (m) => ({ default: m.BoardPitchBuilder })
    )
  ),
  'crqc-scenario': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PQCRiskManagement/components/CRQCScenarioPlanner').then(
      (m) => ({ default: m.CRQCScenarioPlanner })
    )
  ),
  'risk-register': lazyWithRetry(() =>
    import('./adapters/RiskRegisterBuilderStandalone').then((m) => ({
      default: m.RiskRegisterBuilderStandalone,
    }))
  ),
  'risk-treatment-plan': lazyWithRetry(() =>
    import('./adapters/RiskHeatmapGeneratorStandalone').then((m) => ({
      default: m.RiskHeatmapGeneratorStandalone,
    }))
  ),
  'audit-checklist': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/ComplianceStrategy/components/AuditReadinessChecklist').then(
      (m) => ({ default: m.AuditReadinessChecklist })
    )
  ),
  'compliance-timeline': lazyWithRetry(() =>
    import('./adapters/ComplianceTimelineBuilderStandalone').then((m) => ({
      default: m.ComplianceTimelineBuilderStandalone,
    }))
  ),
  'raci-builder': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PQCGovernance/components/RACIBuilder').then((m) => ({
      default: m.RACIBuilder,
    }))
  ),
  'policy-generator': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PQCGovernance/components/PolicyTemplateGenerator').then(
      (m) => ({ default: m.PolicyTemplateGenerator })
    )
  ),
  'kpi-dashboard': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PQCGovernance/components/KPIDashboardBuilder').then(
      (m) => ({ default: m.KPIDashboardBuilder })
    )
  ),
  'vendor-scorecard': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/VendorRisk/components/VendorScorecardBuilder').then(
      (m) => ({ default: m.VendorScorecardBuilder })
    )
  ),
  'contract-clause': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/VendorRisk/components/ContractClauseGenerator').then(
      (m) => ({ default: m.ContractClauseGenerator })
    )
  ),
  'supply-chain-matrix': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/VendorRisk/components/SupplyChainRiskMatrix').then(
      (m) => ({ default: m.SupplyChainRiskMatrix })
    )
  ),
  'roadmap-builder': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MigrationProgram/components/RoadmapBuilder').then(
      (m) => ({ default: m.RoadmapBuilder })
    )
  ),
  'stakeholder-comms': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MigrationProgram/components/StakeholderCommsPlanner').then(
      (m) => ({ default: m.StakeholderCommsPlanner })
    )
  ),
  'kpi-tracker': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MigrationProgram/components/KPITrackerTemplate').then(
      (m) => ({ default: m.KPITrackerTemplate })
    )
  ),
  'deployment-playbook': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MigrationProgram/components/DeploymentPlaybook').then(
      (m) => ({ default: m.DeploymentPlaybook })
    )
  ),
}

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
}

/** Look up the lazy-loaded builder component for a given artifact type. */
export function getBuilderForArtifactType(type: ExecutiveDocumentType): LazyComp | undefined {
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
  // eslint-disable-next-line security/detect-object-injection
  return toolId ? BUSINESS_TOOL_COMPONENTS[toolId] : undefined
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
