// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useMemo } from 'react'
import { LayoutDashboard, ClipboardCheck, ShieldCheck, BookOpen, Download, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { useBusinessMetrics } from './hooks/useBusinessMetrics'
import { TYPE_LABELS } from './ArtifactCard'
import { RiskManagementSection } from './sections/RiskManagementSection'
import { ComplianceRegulatorySection } from './sections/ComplianceRegulatorySection'
import { GovernancePolicySection } from './sections/GovernancePolicySection'
import { VendorSupplyChainSection } from './sections/VendorSupplyChainSection'
import { ActionItemsSection } from './sections/ActionItemsSection'
import { CompactLearningBar } from './CompactLearningBar'
import { ArtifactDrawer, type DrawerMode } from './ArtifactDrawer'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

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

const TYPE_FILTER_ITEMS = [
  { id: 'all', label: 'All Types' },
  ...Object.entries(TYPE_LABELS).map(([id, label]) => ({ id, label })),
]

export function BusinessCenterView() {
  const metrics = useBusinessMetrics()
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
  const updateExecutiveDocument = useModuleStore((s) => s.updateExecutiveDocument)

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all')

  // Drawer state
  const [drawerDoc, setDrawerDoc] = useState<ExecutiveDocument | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')

  // All artifacts flat list (for ZIP export + filter count)
  const allArtifacts = useMemo(
    () => Object.values(metrics.artifactsByPillar ?? {}).flat(),
    [metrics.artifactsByPillar],
  )
  const filteredArtifacts = useMemo(
    () => (typeFilter === 'all' ? allArtifacts : allArtifacts.filter((d) => d.type === typeFilter)),
    [allArtifacts, typeFilter],
  )

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

  const handleRenameArtifact = useCallback(
    (id: string, newTitle: string) => {
      updateExecutiveDocument(id, { title: newTitle })
    },
    [updateExecutiveDocument],
  )

  const handleExportZip = useCallback(async () => {
    if (filteredArtifacts.length === 0) return
    const zip = new JSZip()
    for (const doc of filteredArtifacts) {
      const safeName = doc.title.replace(/[^a-z0-9_\- ]/gi, '').replace(/\s+/g, '_')
      zip.file(`${safeName}.md`, doc.data)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pqc-artifacts.zip'
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredArtifacts])

  const artifactCallbacks = {
    onViewArtifact: handleViewArtifact,
    onEditArtifact: handleEditArtifact,
    onDeleteArtifact: handleDeleteArtifact,
    onRenameArtifact: handleRenameArtifact,
    typeFilter: typeFilter as ExecutiveDocumentType | 'all',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Business Center"
        description="Your PQC readiness command center — risk, compliance, governance, and next steps."
        shareTitle="PQC Business Center — Quantum Readiness Command Center"
        shareText="Your PQC readiness command center — risk, compliance, governance, and actionable next steps."
      />

      <ContextBanner
        industry={metrics.industry}
        country={metrics.country}
        completedAt={metrics.completedAt}
      />

      {/* Filter + Export bar */}
      {!metrics.isFullyEmpty && allArtifacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <FilterDropdown
            items={TYPE_FILTER_ITEMS}
            selectedId={typeFilter}
            onSelect={setTypeFilter}
            label="Filter by type"
            noContainer
          />
          <span className="text-xs text-muted-foreground">
            {filteredArtifacts.length} artifact{filteredArtifacts.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={handleExportZip}
            disabled={filteredArtifacts.length === 0}
          >
            <Download size={14} />
            Export ZIP
          </Button>
        </div>
      )}

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
