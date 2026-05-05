// SPDX-License-Identifier: GPL-3.0-only
/**
 * Lazy-loaded builder component map — one entry per business-tool id.
 *
 * Split out of `businessToolsRegistry.tsx` so the dynamic-import graph (which
 * Vite's TLA polyfill marks as having top-level-await dependencies) doesn't
 * pull `useBusinessMetrics` / `cswp39StepMapping` into a circular module-init
 * sequence on the Command Center page.
 *
 * Importers: `ArtifactDrawer.tsx`, `BusinessToolRoute.tsx`. Anything that only
 * needs static metadata (zone mapping, pillar mapping, tool labels) must keep
 * importing from `businessToolsRegistry.tsx`.
 */
import React from 'react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { ARTIFACT_TYPE_TO_TOOL_ID } from './businessToolsRegistry'

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
  'compliance-checklist': lazyWithRetry(() =>
    import('./adapters/ComplianceChecklistBuilderStandalone').then((m) => ({
      default: m.ComplianceChecklistBuilderStandalone,
    }))
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
  'crypto-architecture-diagram': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/CryptoMgmtModernization/components/CryptoArchitectureDiagram').then(
      (m) => ({ default: m.CryptoArchitectureDiagram })
    )
  ),
  'management-tools-audit': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/CryptoMgmtModernization/workshop/ManagementToolsAudit').then(
      (m) => ({ default: m.ManagementToolsAudit })
    )
  ),
  'crypto-cbom-builder': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/CryptoMgmtModernization/workshop/LibraryCBOMBuilder').then(
      (m) => ({ default: m.LibraryCBOMBuilder })
    )
  ),
  'crypto-vulnerability-watch': lazyWithRetry(() =>
    import('./tools/CryptoVulnerabilityWatch').then((m) => ({
      default: m.CryptoVulnerabilityWatch,
    }))
  ),
}

/** Look up the lazy-loaded builder component for a given artifact type. */
export function getBuilderForArtifactType(type: ExecutiveDocumentType): LazyComp | undefined {
  // eslint-disable-next-line security/detect-object-injection
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
  // eslint-disable-next-line security/detect-object-injection
  return toolId ? BUSINESS_TOOL_COMPONENTS[toolId] : undefined
}
