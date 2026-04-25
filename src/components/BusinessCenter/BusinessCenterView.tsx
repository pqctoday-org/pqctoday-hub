// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useMemo } from 'react'
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  Download,
  Filter,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { PageHeader } from '@/components/common/PageHeader'
import { WorkflowBreadcrumb } from '@/components/shared/WorkflowBreadcrumb'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getBusinessCenterStepEmphasis } from '@/data/personaConfig'
import { useSeedFrameworksFromCountry } from '@/hooks/assessment/useSeedFrameworksFromCountry'
import { CSWP39_STEPS } from '@/components/Compliance/cswp39Data'
import { useBusinessMetrics } from './hooks/useBusinessMetrics'
import { TYPE_LABELS } from './ArtifactCard'
import { CSWP39StepSection } from './sections/CSWP39StepSection'
import { ActionItemsSection } from './sections/ActionItemsSection'
import { CyberInsuranceLensSection } from './sections/CyberInsuranceLensSection'
import { CompactLearningBar } from './CompactLearningBar'
import { ArtifactDrawer, type DrawerMode } from './ArtifactDrawer'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

function WelcomeState() {
  const navigate = useNavigate()
  return (
    <div className="glass-panel p-8 text-center">
      <LayoutDashboard size={48} className="mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Welcome to your PQC Command Center
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
  useSeedFrameworksFromCountry()
  const navigate = useNavigate()
  const metrics = useBusinessMetrics()
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
  const updateExecutiveDocument = useModuleStore((s) => s.updateExecutiveDocument)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const stepEmphasis = useMemo(
    () => getBusinessCenterStepEmphasis(selectedPersona),
    [selectedPersona]
  )

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all')

  // Cyber Insurance side panel toggle (default per persona).
  const [insuranceOpen, setInsuranceOpen] = useState<boolean>(
    stepEmphasis.insurancePanelDefaultOpen ?? false
  )

  // Drawer state. Create mode uses `drawerCreateType` with a null document; view/edit
  // use `drawerDoc` with createType cleared. The drawer itself handles the transition
  // from create → view once a new document of the given type is persisted.
  const [drawerDoc, setDrawerDoc] = useState<ExecutiveDocument | null>(null)
  const [drawerCreateType, setDrawerCreateType] = useState<ExecutiveDocumentType | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')

  // All artifacts flat list (for ZIP export + filter count)
  const allArtifacts = useMemo(
    () => Object.values(metrics.artifactsByPillar ?? {}).flat(),
    [metrics.artifactsByPillar]
  )
  const filteredArtifacts = useMemo(
    () => (typeFilter === 'all' ? allArtifacts : allArtifacts.filter((d) => d.type === typeFilter)),
    [allArtifacts, typeFilter]
  )

  const handleViewArtifact = useCallback((doc: ExecutiveDocument) => {
    setDrawerDoc(doc)
    setDrawerCreateType(null)
    setDrawerMode('view')
  }, [])

  const handleEditArtifact = useCallback((doc: ExecutiveDocument) => {
    setDrawerDoc(doc)
    setDrawerCreateType(null)
    setDrawerMode('edit')
  }, [])

  const handleCreateArtifact = useCallback((type: ExecutiveDocumentType) => {
    setDrawerDoc(null)
    setDrawerCreateType(type)
    setDrawerMode('create')
  }, [])

  const handleDeleteArtifact = useCallback(
    (doc: ExecutiveDocument) => {
      deleteExecutiveDocument(doc.id)
    },
    [deleteExecutiveDocument]
  )

  const handleCloseDrawer = useCallback(() => {
    setDrawerDoc(null)
    setDrawerCreateType(null)
  }, [])

  // Drawer signals that a new artifact was persisted while in create mode —
  // transition to view the freshly-saved document.
  const handleArtifactCreated = useCallback((doc: ExecutiveDocument) => {
    setDrawerDoc(doc)
    setDrawerCreateType(null)
    setDrawerMode('view')
  }, [])

  const handleRenameArtifact = useCallback(
    (id: string, newTitle: string) => {
      updateExecutiveDocument(id, { title: newTitle })
    },
    [updateExecutiveDocument]
  )

  const handleNavigateToFramework = useCallback(
    (
      targetTab: 'standards' | 'technical' | 'certification' | 'compliance',
      searchQuery: string
    ) => {
      const params = new URLSearchParams({ tab: targetTab, q: searchQuery })
      navigate(`/compliance?${params.toString()}`)
    },
    [navigate]
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

  const stepCallbacks = {
    onViewArtifact: handleViewArtifact,
    onEditArtifact: handleEditArtifact,
    onDeleteArtifact: handleDeleteArtifact,
    onRenameArtifact: handleRenameArtifact,
    onCreateArtifact: handleCreateArtifact,
    onNavigateToFramework: handleNavigateToFramework,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" data-testid="bc-dashboard-ready">
      <WorkflowBreadcrumb current="business" />
      <PageHeader
        icon={LayoutDashboard}
        pageId="business-center"
        title="Command Center"
        description="Your PQC readiness command center, organised around the NIST CSWP.39 5-step migration process."
        shareTitle="PQC Command Center — Quantum Readiness Workspace"
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
          {/* Top cross-cut: Action Items strip */}
          <ActionItemsSection metrics={metrics} />

          {/* 5-step CSWP.39 stack — fixed sequence */}
          <div className="space-y-3">
            {CSWP39_STEPS.map((step) => (
              <CSWP39StepSection
                key={step.id}
                step={step}
                metrics={metrics}
                defaultOpen={step.id === stepEmphasis.defaultExpandedStep}
                featuredArtifacts={stepEmphasis.featuredArtifacts[step.id]}
                {...stepCallbacks}
              />
            ))}
          </div>

          {/* Cyber Insurance side panel — togglable, persona-default open */}
          <div className="glass-panel p-0 overflow-hidden">
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-3 rounded-none"
              onClick={() => setInsuranceOpen((v) => !v)}
              aria-expanded={insuranceOpen}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldAlert size={16} className="text-primary" />
                Cyber Insurance Lens
              </span>
              {insuranceOpen ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </Button>
            {insuranceOpen && (
              <div className="border-t border-border">
                <CyberInsuranceLensSection />
              </div>
            )}
          </div>

          {/* Bottom cross-cut: learning bar */}
          <CompactLearningBar modules={metrics.execModuleProgress} />
        </div>
      )}

      {/* Artifact Drawer — handles view, edit, and create modes for every artifact
          type. Builder components are sourced from the shared businessToolsRegistry
          so the /business/tools/:id route and this drawer stay in lockstep. */}
      {(drawerDoc || drawerCreateType) && (
        <ArtifactDrawer
          document={drawerDoc}
          createType={drawerCreateType}
          mode={drawerMode}
          onClose={handleCloseDrawer}
          onModeChange={setDrawerMode}
          onCreated={handleArtifactCreated}
        />
      )}
    </div>
  )
}
