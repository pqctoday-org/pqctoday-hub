// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  Download,
  Filter,
  Wrench,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import JSZip from 'jszip'
import { PageHeader } from '@/components/common/PageHeader'
import { WorkflowBreadcrumb } from '@/components/shared/WorkflowBreadcrumb'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useWorkshopStore, isWorkshopActive } from '@/store/useWorkshopStore'
import { getBusinessCenterZoneEmphasis } from '@/data/personaConfig'
import { useSeedFrameworksFromCountry } from '@/hooks/assessment/useSeedFrameworksFromCountry'
import { CSWP39_ZONE_ORDER, legacyToZoneId, type ZoneId } from '@/data/cswp39ZoneData'
import { useBusinessMetrics } from './hooks/useBusinessMetrics'
import { TYPE_LABELS } from './ArtifactCard'
import { CommandCenterStrategicPlan } from './sections/CommandCenterStrategicPlan'
import { CSWP39SectionsNav } from './sections/CSWP39SectionsNav'
import { CSWP39ZonePanel } from './sections/CSWP39ZonePanel'
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
  const metrics = useBusinessMetrics()
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
  const updateExecutiveDocument = useModuleStore((s) => s.updateExecutiveDocument)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const workshopActive = useWorkshopStore((s) => isWorkshopActive(s.mode))
  const zoneEmphasis = useMemo(
    () => getBusinessCenterZoneEmphasis(selectedPersona),
    [selectedPersona]
  )

  // Active zone — drives both the diagram highlight and which panel is opened
  // by default. Falls back to the persona-derived default below.
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null)
  const [searchParams] = useSearchParams()

  // ?zone=<id> deep-link (used by the Workshop Video Mode and external links).
  // Only valid CSWP-39 zone ids are honoured; anything else is ignored.
  // Resolved synchronously during render so we avoid set-state-in-effect.
  const zoneFromQuery = useMemo<ZoneId | null>(() => {
    const requested = searchParams.get('zone')
    if (!requested) return null
    return CSWP39_ZONE_ORDER.includes(requested as ZoneId) ? (requested as ZoneId) : null
  }, [searchParams])

  useEffect(() => {
    if (!zoneFromQuery) return
    const target = document.getElementById(`zone-${zoneFromQuery}`)
    if (target) {
      window.history.replaceState(null, '', `#zone-${zoneFromQuery}`)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [zoneFromQuery])

  // Legacy hash redirects. Keeps old inbound URLs from CSWP39StepBadge / Report
  // nav (#step-govern), and from the previous §3-§6 iteration (#section-strategic),
  // working after this Fig 3 rebuild. Maps any legacy id to its zone via
  // `legacyToZoneId`.
  useEffect(() => {
    const remapHash = () => {
      const hash = window.location.hash
      const match = hash.match(/^#(?:step|section|zone)-([a-z-]+)$/)
      if (!match) return
      const zoneId = legacyToZoneId(match[1])
      const target = document.getElementById(`zone-${zoneId}`)
      if (target) {
        window.history.replaceState(null, '', `#zone-${zoneId}`)
        setActiveZone(zoneId)
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    remapHash()
    window.addEventListener('hashchange', remapHash)
    return () => window.removeEventListener('hashchange', remapHash)
  }, [])

  const handleZoneSelect = useCallback((zone: ZoneId) => {
    setActiveZone(zone)
    const target = document.getElementById(`zone-${zone}`)
    if (target) {
      window.history.replaceState(null, '', `#zone-${zone}`)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all')

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

  const zoneCallbacks = {
    onViewArtifact: handleViewArtifact,
    onEditArtifact: handleEditArtifact,
    onDeleteArtifact: handleDeleteArtifact,
    onRenameArtifact: handleRenameArtifact,
    onCreateArtifact: handleCreateArtifact,
  }

  // Native zone-keyed persona emphasis (BC_ZONE_EMPHASIS_BY_PERSONA).
  const allFeaturedArtifacts: ExecutiveDocumentType[] = Object.values(
    zoneEmphasis.featuredArtifacts
  ).flatMap((arr) => arr ?? [])
  // Default the diagram + first-open panel to the persona's preferred zone.
  // ?zone=<id> wins over user click (which wins over persona default).
  const effectiveActiveZone = zoneFromQuery ?? activeZone ?? zoneEmphasis.defaultActiveZone

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" data-testid="bc-dashboard-ready">
      <WorkflowBreadcrumb current="business" />
      <PageHeader
        icon={LayoutDashboard}
        pageId="business-center"
        title={zoneEmphasis.headline ?? 'Command Center'}
        description={
          zoneEmphasis.tagline ??
          'Your PQC readiness command center, organised around the NIST CSWP.39 Fig 3 Crypto Agility Strategic Plan (Considerations for Achieving Crypto Agility, Dec 2025).'
        }
        shareTitle="PQC Command Center — Quantum Readiness Workspace"
        shareText="Your PQC readiness command center — risk, compliance, governance, and actionable next steps."
      />

      {/* WIP banner — Command Center is under active development */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm mb-4">
        <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Work in progress.</span> The Command Center is under
          active development — zone panels, artifact tracking, and wire data are being expanded.
        </span>
      </div>

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

      {/* Page-level empty state — bypassed when a workshop is active so the
           cue tour can target zone panels + artifact placeholders even when
           the user hasn't yet completed an assessment. */}
      {metrics.isFullyEmpty && !workshopActive ? (
        <WelcomeState />
      ) : (
        <div className="space-y-6">
          {/* Top cross-cut: Action Items strip */}
          <ActionItemsSection metrics={metrics} />

          {/* NIST CSWP.39 — by document section (§3 / §4 / §5 / §6) */}
          <CSWP39SectionsNav onZoneSelect={handleZoneSelect} />

          {/* CSWP.39 Fig 3 — Crypto Agility Strategic Plan (primary nav) */}
          <CommandCenterStrategicPlan
            metrics={metrics}
            activeZone={effectiveActiveZone}
            onZoneSelect={handleZoneSelect}
          />

          {/* Per-zone artifact panels — fixed Fig 3 order */}
          <div className="space-y-3">
            {CSWP39_ZONE_ORDER.map((zone) => (
              <CSWP39ZonePanel
                key={zone}
                zone={zone}
                metrics={metrics}
                defaultOpen={zone === effectiveActiveZone}
                featuredArtifacts={allFeaturedArtifacts}
                {...zoneCallbacks}
              />
            ))}
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
