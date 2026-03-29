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
} from 'lucide-react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

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
  'audit-checklist': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/ComplianceStrategy/components/AuditReadinessChecklist').then(
      (m) => ({ default: m.AuditReadinessChecklist })
    )
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
