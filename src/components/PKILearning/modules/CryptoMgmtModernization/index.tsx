// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { useRef, useState } from 'react'
import {
  Gauge,
  Repeat,
  Package,
  DollarSign,
  LineChart,
  Search,
  BarChart3,
  GitFork,
  CheckCircle2,
} from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { InPageToc } from '@/components/PKILearning/common/InPageToc'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import manifest from './manifest'
import { Introduction } from './components/Introduction'
import { CLMVendorEvaluator } from './components/CLMVendorEvaluator'
import { CryptoAgilityProcessDiagram } from './visuals/CryptoAgilityProcessDiagram'
import { MaturityAssessment } from './workshop/MaturityAssessment'
import { InventoryLifecycleSimulator } from './workshop/InventoryLifecycleSimulator'
import { LibraryCBOMBuilder } from './workshop/LibraryCBOMBuilder'
import { NoRegretROIBuilder } from './workshop/NoRegretROIBuilder'
import { PostureKPIDesigner } from './workshop/PostureKPIDesigner'
import { ManagementToolsAudit } from './workshop/ManagementToolsAudit'
import { RiskAnalysisEngine } from './workshop/RiskAnalysisEngine'
import { MitigateMigrateWizard } from './workshop/MitigateMigrateWizard'
import { CryptoMgmtModernizationExercises } from './CryptoMgmtModernizationExercises'
import type { CbomExportItem } from './data/workshopTypes'

const PARTS: WorkshopPart[] = [
  {
    id: 'maturity-assessment',
    title: 'Step 1: CPM Maturity Self-Assessment',
    description:
      'Score your organization across five pillars and four asset classes. Output: radar chart, gap narrative, and your next milestone.',
    icon: Gauge,
    cswp39Step: 'Govern · §5.1 — assess crypto posture baseline',
  },
  {
    id: 'inventory-lifecycle',
    title: 'Step 2: Inventory Lifecycle Simulator',
    description:
      'Walk sample assets through the six-stage operational loop: Discover → Classify → Score → Remediate → Attest → Reassess. Includes canonical CLM scenarios.',
    icon: Repeat,
    cswp39Step: 'Inventory · §5.2 — CLM operational loop',
  },
  {
    id: 'library-cbom-builder',
    title: 'Step 3: Library & Hardware CBOM Builder',
    description:
      'Map SBOMs into crypto-focused CBOMs, track library EoL, and monitor FIPS 140-3 Level 3 validation status for libraries and HSMs. Assets loaded here feed Steps 7 and 8.',
    icon: Package,
    cswp39Step: 'Inventory · §5.2 — asset-centric CBOM',
  },
  {
    id: 'no-regret-roi',
    title: 'Step 4: No-Regret ROI Builder',
    description:
      'Model ROI under quantum-happens and quantum-never-happens scenarios. Outage avoidance, CLM automation, FIPS-drift remediation, library-CVE response.',
    icon: DollarSign,
    cswp39Step: 'Govern · §5.1 — business case for the program',
  },
  {
    id: 'posture-kpi',
    title: 'Step 5: Posture KPI Dashboard Designer',
    description:
      'Pick board-ready KPIs across inventory, lifecycle/CLM, observability, and assurance/FIPS. Preview the stakeholder dashboard.',
    icon: LineChart,
    cswp39Step: 'Prioritise · §5.4 — KPI framework for the Risk Analysis Engine',
  },
  {
    id: 'management-tools-audit',
    title: 'Step 6: Management Tools Coverage Audit',
    description:
      'Rate your tooling coverage across the six CSWP.39 Management Tools categories. Produces a gap heatmap and priority recommendations.',
    icon: Search,
    cswp39Step: 'Identify Gaps · §5.3 — tool coverage audit',
  },
  {
    id: 'risk-analysis-engine',
    title: 'Step 7: Risk Analysis & Prioritisation Engine',
    description:
      'Score CBOM assets from Step 3 on FIPS status, ESV status, PQC readiness, and EoL. Output: prioritised remediation queue (Critical → Low).',
    icon: BarChart3,
    cswp39Step: 'Prioritise · §5.4 — risk-ranked asset queue',
  },
  {
    id: 'mitigate-migrate',
    title: 'Step 8: Implement — Mitigate or Migrate',
    description:
      'CSWP.39 §4.6 decision wizard: answer 5 crypto-agility questions about an asset and receive a Gateway (Mitigate) or Algorithm Replacement (Migrate) recommendation.',
    icon: GitFork,
    cswp39Step: 'Implement · §5.5 + §4.6 — gateway vs. migration decision',
  },
  {
    id: 'clm-vendor-evaluator',
    title: 'Step 9: CLM Vendor Evaluator',
    description:
      'Interactive scorecard for evaluating Venafi, AppViewX, and Keyfactor based on PQC readiness criteria.',
    icon: CheckCircle2,
    cswp39Step: 'Govern · §5.1 — Vendor readiness',
  },
]

export const CryptoMgmtModernizationModule: FC = () => {
  // cbomAssets is shared cross-STEP state: Step 3 (LibraryCBOMBuilder) exports
  // assets that Steps 4, 7 and 8 consume. Held in the module FC so it survives
  // step changes; the original Reset does NOT clear it, so no onReset slot.
  const [cbomAssets, setCbomAssets] = useState<CbomExportItem[]>([])
  // Anchors the in-page ToC (custom two-column Learn layout, hence learnRaw).
  const learnContentRef = useRef<HTMLDivElement>(null)

  return (
    <ModuleShell
      manifest={manifest}
      description="Build a modern cryptographic posture management program across certificates, libraries, software, and keys. Iterative. Measurable. ROI-positive even if quantum never arrives."
      learnRaw={(api) => (
        <>
          <InPageToc containerRef={learnContentRef} mode="mobile" className="xl:hidden mb-3" />
          <div className="flex gap-6">
            <div ref={learnContentRef} className="flex-1 min-w-0">
              <GlossaryAutoWrap>
                <Introduction onNavigateToWorkshop={() => api.goToWorkshop()} />
              </GlossaryAutoWrap>
            </div>
            <InPageToc
              containerRef={learnContentRef}
              mode="desktop"
              className="hidden xl:block w-48 shrink-0"
            />
          </div>
        </>
      )}
      visual={
        <>
          <CryptoAgilityProcessDiagram />
          <ModuleVisualTab moduleId={manifest.id} />
        </>
      }
      exercises={(api) => (
        <CryptoMgmtModernizationExercises
          onNavigateToWorkshop={(step) => api.goToWorkshop(step ?? 0)}
        />
      )}
      workshopParts={PARTS}
      renderWorkshopStep={(index) => {
        switch (index) {
          case 0:
            return <MaturityAssessment />
          case 1:
            return <InventoryLifecycleSimulator />
          case 2:
            return <LibraryCBOMBuilder onCbomExport={setCbomAssets} />
          case 3:
            return <NoRegretROIBuilder cbomAssets={cbomAssets} />
          case 4:
            return <PostureKPIDesigner />
          case 5:
            return <ManagementToolsAudit />
          case 6:
            return <RiskAnalysisEngine cbomAssets={cbomAssets} />
          case 7:
            return <MitigateMigrateWizard cbomAssets={cbomAssets} />
          case 8:
            return <CLMVendorEvaluator />
          default:
            return null
        }
      }}
    />
  )
}
