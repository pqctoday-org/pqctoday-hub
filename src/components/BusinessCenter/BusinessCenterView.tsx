// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useEffect } from 'react'
import { LayoutDashboard, ClipboardCheck, ShieldCheck, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ShareButton } from '@/components/ui/ShareButton'
import { GlossaryButton } from '@/components/ui/GlossaryButton'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'
import { useBusinessMetrics } from './hooks/useBusinessMetrics'
import { RiskManagementSection } from './sections/RiskManagementSection'
import { ComplianceRegulatorySection } from './sections/ComplianceRegulatorySection'
import { GovernancePolicySection } from './sections/GovernancePolicySection'
import { VendorSupplyChainSection } from './sections/VendorSupplyChainSection'
import { ActionItemsSection } from './sections/ActionItemsSection'
import { CompactLearningBar } from './CompactLearningBar'
import { ArtifactDrawer, type DrawerMode } from './ArtifactDrawer'
import type { ExecutiveDocument } from '@/services/storage/types'

function WelcomeState() {
  const navigate = useNavigate()
  return (
    <div className="glass-panel p-8 text-center">
      <LayoutDashboard size={48} className="mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Welcome to your PQC Business Center
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
        This is your command center for PQC readiness. Get started by running a risk assessment,
        exploring compliance frameworks, or beginning the executive learning path.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="gradient" onClick={() => navigate('/assess')}>
          <ClipboardCheck size={16} className="mr-2" />
          Run Risk Assessment
        </Button>
        <Button variant="outline" onClick={() => navigate('/compliance')}>
          <ShieldCheck size={16} className="mr-2" />
          Explore Compliance
        </Button>
        <Button variant="outline" onClick={() => navigate('/learn/exec-quantum-impact')}>
          <BookOpen size={16} className="mr-2" />
          Start Executive Learning
        </Button>
      </div>
    </div>
  )
}

function ContextBanner({
  industry,
  country,
  completedAt,
}: {
  industry: string
  country: string
  completedAt: string | null
}) {
  if (!industry && !country && !completedAt) return null

  const parts: string[] = []
  if (industry) parts.push(industry)
  if (country) parts.push(country)
  if (completedAt) {
    parts.push(
      `Last assessed: ${new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-6">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5">·</span>}
          {p}
        </span>
      ))}
    </div>
  )
}

export function BusinessCenterView() {
  const metrics = useBusinessMetrics()
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)

  // Mark Business Center as origin for ReturnBanner navigation
  useEffect(() => {
    sessionStorage.setItem('pqc-return-to', '/business')
  }, [])

  // Drawer state
  const [drawerDoc, setDrawerDoc] = useState<ExecutiveDocument | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')

  const handleViewArtifact = useCallback((doc: ExecutiveDocument) => {
    setDrawerDoc(doc)
    setDrawerMode('view')
  }, [])

  const handleEditArtifact = useCallback((doc: ExecutiveDocument) => {
    setDrawerDoc(doc)
    setDrawerMode('edit')
  }, [])

  const handleDeleteArtifact = useCallback(
    (doc: ExecutiveDocument) => {
      deleteExecutiveDocument(doc.id)
    },
    [deleteExecutiveDocument]
  )

  const handleCloseDrawer = useCallback(() => {
    setDrawerDoc(null)
  }, [])

  const artifactCallbacks = {
    onViewArtifact: handleViewArtifact,
    onEditArtifact: handleEditArtifact,
    onDeleteArtifact: handleDeleteArtifact,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <LayoutDashboard className="text-primary shrink-0" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gradient">Business Center</h1>
            <p className="text-sm text-muted-foreground">
              Your PQC readiness command center — risk, compliance, governance, and next steps
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <ShareButton title="Business Center" />
          <GlossaryButton />
        </div>
      </div>

      <ContextBanner
        industry={metrics.industry}
        country={metrics.country}
        completedAt={metrics.completedAt}
      />

      {/* Page-level empty state */}
      {metrics.isFullyEmpty ? (
        <WelcomeState />
      ) : (
        <div className="space-y-6">
          {/* Pillar 1: Risk Management — full width */}
          <RiskManagementSection metrics={metrics} {...artifactCallbacks} />

          {/* Pillars 2-3: Compliance & Governance — 2 col */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceRegulatorySection metrics={metrics} {...artifactCallbacks} />
            <GovernancePolicySection metrics={metrics} {...artifactCallbacks} />
          </div>

          {/* Pillar 4: Vendor & Migration — full width */}
          <VendorSupplyChainSection metrics={metrics} {...artifactCallbacks} />

          {/* Compact Executive Learning — full width */}
          <CompactLearningBar modules={metrics.execModuleProgress} />

          {/* Action Items — full width */}
          <ActionItemsSection metrics={metrics} />
        </div>
      )}

      {/* Artifact Drawer */}
      <ArtifactDrawer
        document={drawerDoc}
        mode={drawerMode}
        onClose={handleCloseDrawer}
        onModeChange={setDrawerMode}
      />
    </div>
  )
}
