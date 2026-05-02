// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { computeAssessment } from '@/hooks/assessmentUtils'
import type { AssessmentResult, CategoryScores } from '@/hooks/assessmentTypes'
import type {
  ExecutiveDocument,
  ExecutiveDocumentType,
  LearningProgress,
} from '@/services/storage/types'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { softwareData } from '@/data/migrateData'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { MODULE_STEP_COUNTS, MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { PILLAR_FOR_TYPE, type PillarKey } from '../lib/cswp39StepMapping'
import type { LucideIcon } from 'lucide-react'
import {
  ClipboardCheck,
  ShieldCheck,
  ArrowRightLeft,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Layers,
} from 'lucide-react'

// ── Executive-relevant module IDs ─────────────────────────────────────────

const GOVERNANCE_MODULES = ['pqc-governance', 'compliance-strategy', 'pqc-risk-management'] as const

const EXECUTIVE_MODULES = [
  'exec-quantum-impact',
  'pqc-business-case',
  'pqc-governance',
  'pqc-risk-management',
  'compliance-strategy',
  'vendor-risk',
] as const

// ── Pillar → Artifact type mapping ────────────────────────────────────────

/** Re-export the pillar key from the canonical source (`cswp39StepMapping.ts`)
 *  so existing callers that import from this module keep working. */
export type { PillarKey }

/** Derived from PILLAR_FOR_TYPE — single source of truth lives in
 *  `cswp39StepMapping.ts`. Computed once at module load. */
export const PILLAR_ARTIFACT_TYPES: Record<PillarKey, ExecutiveDocumentType[]> = (() => {
  const buckets: Record<PillarKey, ExecutiveDocumentType[]> = {
    risk: [],
    compliance: [],
    governance: [],
    vendor: [],
    inventory: [],
    architecture: [],
  }
  for (const [type, pillar] of Object.entries(PILLAR_FOR_TYPE) as Array<
    [ExecutiveDocumentType, PillarKey]
  >) {
    buckets[pillar].push(type)
  }
  return buckets
})()

/** Module IDs that produce artifacts for each pillar (for "Build in…" placeholder links) */
export const PILLAR_SOURCE_MODULES: Record<string, Record<ExecutiveDocumentType, string>> = {
  risk: {
    'risk-register': 'pqc-risk-management',
    'risk-treatment-plan': 'pqc-risk-management',
    'roi-model': 'pqc-business-case',
    'board-deck': 'pqc-business-case',
    'crqc-scenario': 'pqc-risk-management',
  } as Record<ExecutiveDocumentType, string>,
  compliance: {
    'audit-checklist': 'compliance-strategy',
    'compliance-timeline': 'compliance-strategy',
  } as Record<ExecutiveDocumentType, string>,
  governance: {
    'raci-matrix': 'pqc-governance',
    'policy-draft': 'pqc-governance',
    'kpi-dashboard': 'pqc-governance',
    'stakeholder-comms': 'migration-program',
    'kpi-tracker': 'migration-program',
  } as Record<ExecutiveDocumentType, string>,
  vendor: {
    'vendor-scorecard': 'vendor-risk',
    'contract-clause': 'vendor-risk',
    'supply-chain-matrix': 'vendor-risk',
  } as Record<ExecutiveDocumentType, string>,
  architecture: {
    'migration-roadmap': 'migration-program',
    'deployment-playbook': 'migration-program',
  } as Record<ExecutiveDocumentType, string>,
}

export interface ArtifactsByPillar {
  risk: ExecutiveDocument[]
  compliance: ExecutiveDocument[]
  governance: ExecutiveDocument[]
  vendor: ExecutiveDocument[]
  inventory: ExecutiveDocument[]
  architecture: ExecutiveDocument[]
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface ActionItem {
  /** Base priority tier (1 = urgent, 2 = important, 3 = nice-to-have).
   *  `adjustPriority` may nudge this by fractions so profile-aware sequencing
   *  can re-order within or across tiers — so the stored value is any number,
   *  not just the base tier constant. */
  priority: number
  icon: LucideIcon
  title: string
  description: string
  action: { label: string; path: string }
  /** Human-readable reasons this action is being suggested at the user's
   *  current priority. Computed alongside `adjustPriority` from the user's
   *  industry / persona / vendor / agility profile. Surfaced as small chips
   *  in ActionRow so the user understands why an item is in their top-5. */
  drivers?: string[]
}

export interface ModuleProgressInfo {
  id: string
  title: string
  status: 'not-started' | 'in-progress' | 'completed'
  completedSteps: number
  totalSteps: number
}

export interface TrackedFramework extends ComplianceFramework {
  daysUntilDeadline: number | null
  urgency: 'critical' | 'warning' | 'safe' | 'unknown'
  /** Where the framework came from: starred on /compliance, captured by /assess,
   *  or both. Used to disambiguate provenance in the GovernanceWire UI. */
  source: 'compliance' | 'assess' | 'both'
}

export interface InfraLayerCoverage {
  layer: string
  assessed: boolean
  productCount: number
  status: 'covered' | 'gap' | 'not-assessed'
}

export interface BusinessMetrics {
  // Risk overview
  riskScore: number | null
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | null
  categoryScores: CategoryScores | null
  previousCategoryScores: CategoryScores | null
  assessmentStatus: 'not-started' | 'in-progress' | 'complete'
  assessmentHistory: { completedAt: string; riskScore: number }[]
  previousRiskScore: number | null
  completedAt: string | null

  // Compliance
  trackedFrameworks: TrackedFramework[]
  complianceGapCount: number

  // Governance
  governanceModules: ModuleProgressInfo[]
  cryptoAgility: string
  migrationStatus: string

  // Vendor
  vendorDependency: string
  vendorUnknown: boolean
  vendorModuleProgress: ModuleProgressInfo
  uniqueVendorCount: number

  // Migration pipeline
  bookmarkedProducts: SoftwareItem[]
  infraLayerCoverage: InfraLayerCoverage[]
  fipsBreakdown: { validated: number; partial: number; none: number }

  // Workflow
  workflowActive: boolean
  completedPhases: string[]

  // Action items
  actionItems: ActionItem[]

  // Executive learning
  execModuleProgress: ModuleProgressInfo[]

  // Artifacts (grouped by GRC pillar)
  artifactsByPillar: ArtifactsByPillar

  // Full assessment result (for HNDL/HNFL + ROI widgets)
  assessmentResult: AssessmentResult | null

  // Context
  industry: string
  country: string
  persona: string | null

  // Page-level empty check
  isFullyEmpty: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────

export const INFRA_LAYERS = [
  'Hardware',
  'Cloud',
  'Network',
  'Security Stack',
  'Database',
  'AppServers',
  'Libraries',
  'SecSoftware',
  'OS',
] as const

function getModuleProgress(moduleStore: LearningProgress, moduleId: string): ModuleProgressInfo {
  const progress = moduleStore.modules[moduleId] // eslint-disable-line security/detect-object-injection
  return {
    id: moduleId,
    title: MODULE_CATALOG[moduleId]?.title ?? moduleId, // eslint-disable-line security/detect-object-injection
    status: progress?.status ?? 'not-started',
    completedSteps: progress?.completedSteps?.length ?? 0,
    totalSteps: MODULE_STEP_COUNTS[moduleId] ?? 0, // eslint-disable-line security/detect-object-injection
  }
}

function parseFipsStatus(fips: string | undefined): 'validated' | 'partial' | 'none' {
  if (!fips) return 'none'
  const lower = fips.toLowerCase()
  if (lower.startsWith('yes') && !lower.includes('mode')) return 'validated'
  if (lower.includes('partial') || lower.includes('mode') || lower.includes('fips'))
    return 'partial'
  return 'none'
}

function parseDeadlineYear(deadline: string): number | null {
  if (!deadline || deadline === 'Ongoing' || deadline === 'N/A') return null
  const match = deadline.match(/(\d{4})/)
  return match ? parseInt(match[1], 10) : null
}

// Industries where breach cost dominates board conversation — bump breach-cost
// and ROI-framed actions.
const HIGH_BREACH_INDUSTRIES = new Set<string>([
  'Healthcare',
  'Finance & Banking',
  'Retail & E-Commerce',
])

// Industries where compliance deadlines dominate — bump framework-tracking and
// roadmap actions over generic governance.
const HIGH_COMPLIANCE_INDUSTRIES = new Set<string>([
  'Government & Defense',
  'Finance & Banking',
  'Healthcare',
  'Energy & Utilities',
  'Telecommunications',
  'Aerospace',
])

interface ActionProfile {
  industry: string
  persona: string | null
  vendorDependency: string
  cryptoAgility: string
}

function computeActionItems(
  assessmentStatus: string,
  riskScore: number | null,
  completedAt: string | null,
  complianceCount: number,
  productCount: number,
  governanceStarted: boolean,
  execLearningStarted: boolean,
  workflowActive: boolean,
  profile: ActionProfile = {
    industry: '',
    persona: null,
    vendorDependency: '',
    cryptoAgility: '',
  }
): ActionItem[] {
  const items: ActionItem[] = []

  if (assessmentStatus === 'not-started') {
    items.push({
      priority: 1,
      icon: ClipboardCheck,
      title: 'Complete your PQC risk assessment',
      description:
        'Understand your quantum risk exposure with a comprehensive organizational assessment.',
      action: { label: 'Start Assessment', path: '/assess' },
    })
  }

  if (assessmentStatus === 'in-progress') {
    items.push({
      priority: 1,
      icon: ClipboardCheck,
      title: 'Finish your risk assessment',
      description: 'Your assessment is in progress. Complete it to unlock your full risk report.',
      action: { label: 'Continue Assessment', path: '/assess' },
    })
  }

  if (riskScore !== null && riskScore >= 70) {
    items.push({
      priority: 1,
      icon: AlertTriangle,
      title: 'Review your detailed risk report',
      description: 'Your risk score is high. Review recommendations and next steps.',
      action: { label: 'View Report', path: '/report' },
    })
  }

  if (complianceCount === 0 && assessmentStatus !== 'not-started') {
    items.push({
      priority: 2,
      icon: ShieldCheck,
      title: 'Select compliance frameworks',
      description: 'Track regulatory deadlines relevant to your industry and geography.',
      action: { label: 'Explore Frameworks', path: '/compliance' },
    })
  }

  if (productCount === 0 && assessmentStatus !== 'not-started') {
    items.push({
      priority: 2,
      icon: ArrowRightLeft,
      title: 'Bookmark migration products',
      description: 'Build your migration pipeline by selecting PQC-ready products.',
      action: { label: 'Browse Catalog', path: '/migrate' },
    })
  }

  if (!governanceStarted && assessmentStatus !== 'not-started') {
    items.push({
      priority: 2,
      icon: BookOpen,
      title: 'Start governance modules',
      description: 'Build RACI matrices, policies, and risk registers for your PQC program.',
      action: { label: 'Start Learning', path: '/learn/pqc-governance' },
    })
  }

  if (!execLearningStarted) {
    items.push({
      priority: 2,
      icon: BookOpen,
      title: 'Begin your executive learning path',
      description: 'Build PQC knowledge with business-focused modules.',
      action: { label: 'Start Learning', path: '/learn/exec-quantum-impact' },
    })
  }

  if (completedAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince > 30) {
      items.push({
        priority: 3,
        icon: RefreshCw,
        title: 'Re-assess your risk posture',
        description: `Your last assessment was ${daysSince} days ago. Consider re-assessing to track progress.`,
        action: { label: 'Re-Assess', path: '/assess' },
      })
    }
  }

  if (!workflowActive && assessmentStatus === 'complete') {
    items.push({
      priority: 3,
      icon: Layers,
      title: 'Start the guided migration workflow',
      description: 'Follow the structured 4-step workflow: Assess → Comply → Migrate → Timeline.',
      action: { label: 'Start Workflow', path: '/assess' },
    })
  }

  // ── Profile-aware priority nudges ──────────────────────────────────────
  // Shift priority by industry / persona / risk-profile so the top-of-list
  // matches the user's highest-leverage next step rather than a generic order.
  // Also collect human-readable drivers so the UI can show "why" each item is
  // in the user's top-5.
  const adjustedItems = items.map((item) => ({
    ...item,
    priority: adjustPriority(item, profile),
    drivers: computeDrivers(item, profile, riskScore),
  }))

  return adjustedItems.sort((a, b) => a.priority - b.priority).slice(0, 5)
}

/** Mirror of the conditions in `adjustPriority` plus broader profile signals,
 *  emitted as short labels for the UI. Each label answers "why is this here?"
 *  in a glanceable way (industry, persona, framework count, risk score). */
function computeDrivers(
  item: ActionItem,
  profile: ActionProfile,
  riskScore: number | null
): string[] {
  const drivers: string[] = []
  const title = item.title.toLowerCase()

  if (HIGH_BREACH_INDUSTRIES.has(profile.industry) && title.includes('risk report')) {
    drivers.push(`${profile.industry} breach exposure`)
  }
  if (HIGH_COMPLIANCE_INDUSTRIES.has(profile.industry) && title.includes('compliance framework')) {
    drivers.push(`${profile.industry} regulator pressure`)
  }
  if (
    profile.vendorDependency === 'heavy-vendor' &&
    profile.cryptoAgility === 'hardcoded' &&
    title.includes('governance')
  ) {
    drivers.push('Heavy vendors + hardcoded crypto')
  }
  if (profile.persona === 'executive' && title.includes('learning path')) {
    drivers.push('Executive persona — delegated execution')
  }
  if (profile.persona === 'ops' && title.includes('migration products')) {
    drivers.push('Ops persona — migration first')
  }
  if (riskScore !== null && riskScore >= 70 && title.includes('risk')) {
    drivers.push(`Risk score ${riskScore} (high)`)
  }
  if (
    profile.vendorDependency === 'heavy-vendor' &&
    (title.includes('vendor') || title.includes('product'))
  ) {
    drivers.push('Heavy vendor dependency')
  }
  if (profile.cryptoAgility === 'hardcoded' && title.includes('roadmap')) {
    drivers.push('Hardcoded crypto')
  }
  return drivers
}

/** Heuristic: shift priority up (lower number) for actions most relevant to the
 *  user's industry + persona + risk-profile. */
function adjustPriority(item: ActionItem, profile: ActionProfile): number {
  let p = item.priority
  const title = item.title.toLowerCase()

  // Finance / Healthcare / Retail → breach-cost framing bumps risk-report action.
  if (HIGH_BREACH_INDUSTRIES.has(profile.industry) && title.includes('risk report')) {
    p -= 0.3
  }

  // Highly-regulated industries → compliance framework tracking jumps up.
  if (HIGH_COMPLIANCE_INDUSTRIES.has(profile.industry) && title.includes('compliance framework')) {
    p -= 0.4
  }

  // Heavy-vendor + hardcoded crypto → contract / governance tooling matters most.
  if (
    profile.vendorDependency === 'heavy-vendor' &&
    profile.cryptoAgility === 'hardcoded' &&
    title.includes('governance')
  ) {
    p -= 0.5
  }

  // Executive persona → learning path less urgent (they delegate execution).
  if (profile.persona === 'executive' && title.includes('learning path')) {
    p += 0.5
  }

  // Ops persona → migration / product tracking comes first.
  if (profile.persona === 'ops' && title.includes('migration products')) {
    p -= 0.3
  }

  return p
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useBusinessMetrics(): BusinessMetrics {
  const assessmentStore = useAssessmentStore()
  const moduleStore = useModuleStore()
  const complianceStore = useComplianceSelectionStore()
  const migrateStore = useMigrateSelectionStore()
  const workflowStore = useMigrationWorkflowStore()
  const personaStore = usePersonaStore()

  return useMemo(() => {
    // ── Risk overview ───────────────────────────────────────────
    const input = assessmentStore.getInput()
    const result = input ? computeAssessment(input) : null

    const history = assessmentStore.assessmentHistory
    const prevSnapshot = history.length >= 2 ? history[history.length - 2] : null
    const previousCategoryScores: CategoryScores | null = prevSnapshot?.categoryScores ?? null

    // ── Compliance tracking ─────────────────────────────────────
    const fromCompliancePage = new Set(complianceStore.myFrameworks)
    const fromAssessment = new Set(assessmentStore.complianceRequirements)
    const trackedIds = new Set([...fromCompliancePage, ...fromAssessment])
    const now = new Date()
    const currentYear = now.getFullYear()

    const trackedFrameworks: TrackedFramework[] = complianceFrameworks
      .filter((f) => trackedIds.has(f.id))
      .map((f) => {
        const deadlineYear = parseDeadlineYear(f.deadline)
        const daysUntilDeadline = deadlineYear
          ? Math.floor(
              (new Date(deadlineYear, 0, 1).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null

        let urgency: TrackedFramework['urgency'] = 'unknown'
        if (deadlineYear) {
          const yearsLeft = deadlineYear - currentYear
          if (yearsLeft <= 1) urgency = 'critical'
          else if (yearsLeft <= 3) urgency = 'warning'
          else urgency = 'safe'
        }

        const inCompliance = fromCompliancePage.has(f.id)
        const inAssess = fromAssessment.has(f.id)
        const source: TrackedFramework['source'] =
          inCompliance && inAssess ? 'both' : inCompliance ? 'compliance' : 'assess'

        return { ...f, daysUntilDeadline, urgency, source }
      })
      .sort((a, b) => (a.daysUntilDeadline ?? Infinity) - (b.daysUntilDeadline ?? Infinity))

    const complianceGapCount = trackedFrameworks.filter(
      (f) => f.requiresPQC && assessmentStore.migrationStatus !== 'started'
    ).length

    // ── Governance modules ──────────────────────────────────────
    const governanceModules = GOVERNANCE_MODULES.map((id) => getModuleProgress(moduleStore, id))
    const governanceStarted = governanceModules.some((m) => m.status !== 'not-started')

    // ── Vendor & supply chain ───────────────────────────────────
    const vendorModuleProgress = getModuleProgress(moduleStore, 'vendor-risk')

    const resolvedProducts: SoftwareItem[] = migrateStore.myProducts
      .map((key) => {
        return softwareData.find((s) => s.productId === key)
      })
      .filter((s): s is SoftwareItem => s !== undefined)

    const uniqueVendors = new Set(
      resolvedProducts.map((p) => p.softwareName.split(' ')[0]).filter(Boolean)
    )

    // ── Migration pipeline ──────────────────────────────────────
    const assessedLayers = new Set(assessmentStore.infrastructure)
    const productsByLayer = new Map<string, SoftwareItem[]>()
    for (const p of resolvedProducts) {
      const layer = p.infrastructureLayer ?? ''
      const existing = productsByLayer.get(layer) ?? []
      existing.push(p)
      productsByLayer.set(layer, existing)
    }

    const infraLayerCoverage: InfraLayerCoverage[] = INFRA_LAYERS.map((layer) => {
      const assessed = assessedLayers.has(layer)
      const products = productsByLayer.get(layer) ?? []
      return {
        layer,
        assessed,
        productCount: products.length,
        status: assessed ? (products.length > 0 ? 'covered' : 'gap') : ('not-assessed' as const),
      }
    })

    const fipsBreakdown = { validated: 0, partial: 0, none: 0 }
    for (const p of resolvedProducts) {
      const status = parseFipsStatus(p.fipsValidated)
      fipsBreakdown[status]++ // eslint-disable-line security/detect-object-injection
    }

    // ── Executive learning ──────────────────────────────────────
    const execModuleProgress = EXECUTIVE_MODULES.map((id) => getModuleProgress(moduleStore, id))
    const execLearningStarted = execModuleProgress.some((m) => m.status !== 'not-started')

    // ── Action items ────────────────────────────────────────────
    const actionItems = computeActionItems(
      assessmentStore.assessmentStatus,
      result?.riskScore ?? null,
      assessmentStore.completedAt,
      trackedFrameworks.length,
      resolvedProducts.length,
      governanceStarted,
      execLearningStarted,
      workflowStore.workflowActive,
      {
        industry: assessmentStore.industry,
        persona: personaStore.selectedPersona,
        vendorDependency: assessmentStore.vendorDependency,
        cryptoAgility: assessmentStore.cryptoAgility,
      }
    )

    // ── Artifacts by pillar (deduplicated — keep latest per moduleId+type) ──
    const rawDocs = moduleStore.artifacts.executiveDocuments ?? []
    const dedupMap = new Map<string, ExecutiveDocument>()
    for (const d of rawDocs) {
      const key = `${d.moduleId}::${d.type}`
      const existing = dedupMap.get(key)
      if (!existing || d.createdAt > existing.createdAt) {
        dedupMap.set(key, d)
      }
    }
    const allDocs = Array.from(dedupMap.values())
    const artifactsByPillar: ArtifactsByPillar = {
      risk: [],
      compliance: [],
      governance: [],
      vendor: [],
      inventory: [],
      architecture: [],
    }
    for (const d of allDocs) {
      const pillar = PILLAR_FOR_TYPE[d.type]
      if (pillar) artifactsByPillar[pillar].push(d)
    }

    // ── Page-level empty check ──────────────────────────────────
    const isFullyEmpty =
      assessmentStore.assessmentStatus === 'not-started' &&
      trackedFrameworks.length === 0 &&
      resolvedProducts.length === 0 &&
      !execLearningStarted &&
      !governanceStarted

    return {
      riskScore: result?.riskScore ?? null,
      riskLevel: result?.riskLevel ?? null,
      categoryScores: result?.categoryScores ?? null,
      previousCategoryScores,
      assessmentStatus: assessmentStore.assessmentStatus,
      assessmentHistory: assessmentStore.assessmentHistory,
      previousRiskScore: assessmentStore.previousRiskScore,
      completedAt: assessmentStore.completedAt,

      trackedFrameworks,
      complianceGapCount,

      governanceModules,
      cryptoAgility: assessmentStore.cryptoAgility || 'Not assessed',
      migrationStatus: assessmentStore.migrationStatus || 'Not assessed',

      vendorDependency: assessmentStore.vendorDependency || '',
      vendorUnknown: assessmentStore.vendorUnknown,
      vendorModuleProgress,
      uniqueVendorCount: uniqueVendors.size,

      bookmarkedProducts: resolvedProducts,
      infraLayerCoverage,
      fipsBreakdown,

      workflowActive: workflowStore.workflowActive,
      completedPhases: workflowStore.completedPhases,

      actionItems,

      execModuleProgress,

      artifactsByPillar,

      assessmentResult: result ?? null,

      industry: assessmentStore.industry,
      country: assessmentStore.country,
      persona: personaStore.selectedPersona,

      isFullyEmpty,
    }
  }, [assessmentStore, moduleStore, complianceStore, migrateStore, workflowStore, personaStore])
}
