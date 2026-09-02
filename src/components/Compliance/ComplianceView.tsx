// SPDX-License-Identifier: GPL-3.0-only
import { lazy, Suspense, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useSearchParams } from 'react-router'
import { ComplianceTable } from './ComplianceTable'
import { type FrameworkSortOption } from './ComplianceLandscape'
import { useComplianceRefresh } from './services'
import {
  ShieldCheck,
  BookOpen,
  CalendarClock,
  PackageSearch,
  GlobeLock,
  Info,
  Workflow,
  ArrowLeft,
  Sparkles,
  X,
} from 'lucide-react'
import { STABLE_TABS, type StableTab } from '@/data/complianceStableTabs'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileComplianceView } from '@/components/Mobile/screens/MobileComplianceView'
// TrustTierFilter (the control) is no longer rendered here — see the note at
// its old render site. The hook and matcher stay: `?tier=` deep links still
// filter the page, they just have no second on-screen control.
import { useTrustTierFilter, matchesTrustTierFilter } from '../common/TrustTierFilter'
import { ApplicabilityPanel } from '../applicability/ApplicabilityPanel'
import { ExecutiveTimelineView } from './views/ExecutiveTimelineView'
import { ArchitectStandardsView } from './views/ArchitectStandardsView'
import { ResearcherEvidenceView } from './views/ResearcherEvidenceView'
import { DeveloperImplementationView } from './views/DeveloperImplementationView'
import { OpsRotationView } from './views/OpsRotationView'
import { CuriousOrientationView } from './views/CuriousOrientationView'
import { LibraryDetailPopover } from '@/components/Library/LibraryDetailPopover'
// Lazy: keeps the dialog's implementation-attack data out of the Compliance
// route chunk until a user opens a threat detail.
const ThreatDetailDialog = lazy(() =>
  import('@/components/Threats/ThreatDetailDialog').then((m) => ({
    default: m.ThreatDetailDialog,
  }))
)
import {
  TimelineDocumentDetailPopover,
  type TimelineDocumentRow,
} from '@/components/Timeline/TimelineDocumentDetailPopover'
import { FrameworkDetailPopover } from '@/components/Compliance/FrameworkDetailPopover'
import type { LibraryItem } from '@/data/libraryData'
import type { ThreatData } from '@/data/threatsData'
import type { TimelineEvent } from '@/types/timeline'
import type { ComplianceFramework } from '@/data/complianceData'
import { useApplicability } from '@/hooks/useApplicability'
import { logComplianceFilter } from '../../utils/analytics'
import { PageHeader } from '../common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { COMPLIANCE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { complianceFrameworks, complianceMetadata } from '@/data/complianceData'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { normalizeCountry } from '@/utils/applicabilityEngine'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useComplianceUrlState, isLandscapeTab, type MobileSection } from './useComplianceUrlState'
// ── Redesign components ────────────────────────────────────────────────────
import { PillarPipeline } from './redesign/PillarPipeline'
import { ComplianceDetailDrawer } from './redesign/ComplianceDetailDrawer'
import { CSWP39AgilityExplorer } from './redesign/CSWP39AgilityExplorer'
import { RecordsGlossaryStrip } from './redesign/RecordsGlossaryStrip'
import { PqcCertificationTrendChart } from './PqcCertificationTrendChart'
import { type PillarId, pillarForBodyType } from './redesign/pillarModel'
import { ObligationsTab } from './obligations/ObligationsTab'
import { ProgressTab } from './progress/ProgressTab'
import { RequirementsTab } from './requirements/RequirementsTab'
import { ProductsTab } from './products/ProductsTab'
import { ScrollFadeContainer } from '../ui/ScrollFadeContainer'

// ── Stable tab model ───────────────────────────────────────────────────────
// Four tabs, same order for every persona. Persona is a LENS (it tunes content
// in place via the shared control deck) — it never reorders the bar.
// StableTab / STABLE_TABS moved to '@/data/complianceStableTabs' (pure-move
// extraction E-2, IMPLEMENTATION-PLAN.md §5.4) so the mobile layer can read
// the same 8 views this page reads.

function stableTabFor(activeTab: MobileSection): StableTab {
  if (isLandscapeTab(activeTab)) return 'landscape'
  if (activeTab === 'obligations') return 'obligations'
  if (activeTab === 'requirements') return 'requirements'
  if (activeTab === 'progress') return 'progress'
  if (activeTab === 'products') return 'products'
  if (activeTab === 'records') return 'records'
  if (activeTab === 'cswp39') return 'cswp39'
  if (activeTab === 'foryou') return 'foryou'
  return 'landscape'
}

// pillar ↔ legacy landscape-tab mappings (keeps deep links / CSWP.39 crosswalk
// working against the existing URL-state hook).
function tabToPillar(tab: MobileSection): PillarId {
  if (tab === 'certification') return 'certify'
  if (tab === 'compliance') return 'comply'
  return 'standardize'
}
function pillarToTab(pillar: PillarId): MobileSection {
  if (pillar === 'certify') return 'certification'
  if (pillar === 'comply') return 'compliance'
  return 'standards'
}

// ── Section header strip ───────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex shrink-0 items-center gap-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function timelineEventToRow(ev: TimelineEvent): TimelineDocumentRow {
  return {
    countryName: ev.countryName,
    org: ev.orgName,
    phase: ev.phase,
    type: ev.type,
    title: ev.title,
    startYear: ev.startYear,
    endYear: ev.endYear,
    description: ev.description,
    sourceUrl: ev.sourceUrl,
    sourceDate: ev.sourceDate,
    status: ev.status,
  }
}

/**
 * Resolves the For-You tab content per persona. The persona is the shared lens
 * (driven by the control deck); each branch consumes the same `useApplicability`
 * output and only the rendering differs.
 */
function ForYouSection({ onExportCsv }: { onExportCsv?: () => void }) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const selectedIndustries = usePersonaStore((s) => s.selectedIndustries)
  const storeCountry = useAssessmentFormStore((s) => s.country)
  const storeIndustry = useAssessmentFormStore((s) => s.industry)
  const setCountry = useAssessmentFormStore((s) => s.setCountry)
  const setIndustry = useAssessmentFormStore((s) => s.setIndustry)
  const [searchParams] = useSearchParams()

  // Backwards compat for workshop / Landscape deep-links: on first mount, mirror
  // them into the assessment store if it's empty.
  const didSyncRef = useRef(false)
  useEffect(() => {
    if (didSyncRef.current) return
    didSyncRef.current = true
    if (!storeCountry) {
      const urlCountry = searchParams.get('country') ?? searchParams.get('geo')
      const country = urlCountry ? normalizeCountry(urlCountry)[0] : null
      if (country && country !== 'All') setCountry(country)
    }
    if (!storeIndustry) {
      const urlIndustry =
        searchParams.get('industry') ?? searchParams.get('ind') ?? searchParams.get('sector')
      if (urlIndustry && urlIndustry !== 'All') {
        setIndustry(urlIndustry)
      } else if (selectedIndustries.length === 1) {
        setIndustry(selectedIndustries[0])
      }
    }
  }, [storeCountry, storeIndustry, searchParams, selectedIndustries, setCountry, setIndustry])

  const [selectedLibrary, setSelectedLibrary] = useState<LibraryItem | null>(null)
  const [selectedThreat, setSelectedThreat] = useState<ThreatData | null>(null)
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineDocumentRow | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null)

  const callbacks = {
    onSelectLibrary: setSelectedLibrary,
    onSelectThreat: setSelectedThreat,
    onSelectTimeline: (ev: TimelineEvent) => setSelectedTimeline(timelineEventToRow(ev)),
    onSelectFramework: setSelectedFramework,
  }

  return (
    <>
      {persona === 'executive' ? (
        <ExecutiveTimelineView {...callbacks} onExportCsv={onExportCsv} />
      ) : persona === 'architect' ? (
        <ArchitectStandardsView {...callbacks} />
      ) : persona === 'researcher' ? (
        <ResearcherEvidenceView {...callbacks} />
      ) : persona === 'developer' ? (
        <DeveloperImplementationView {...callbacks} />
      ) : persona === 'ops' ? (
        <OpsRotationView {...callbacks} />
      ) : persona === 'curious' ? (
        <CuriousOrientationView {...callbacks} />
      ) : (
        <ApplicabilityPanel variant="tab" {...callbacks} />
      )}
      <LibraryDetailPopover
        isOpen={!!selectedLibrary}
        onClose={() => setSelectedLibrary(null)}
        item={selectedLibrary}
      />
      {selectedThreat && (
        <Suspense fallback={null}>
          <ThreatDetailDialog threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
        </Suspense>
      )}
      <TimelineDocumentDetailPopover
        isOpen={!!selectedTimeline}
        onClose={() => setSelectedTimeline(null)}
        row={selectedTimeline}
      />
      <FrameworkDetailPopover
        isOpen={!!selectedFramework}
        onClose={() => setSelectedFramework(null)}
        framework={selectedFramework}
        onSelectLibrary={(doc) => {
          setSelectedFramework(null)
          setSelectedLibrary(doc)
        }}
        onSelectTimeline={(ev) => {
          setSelectedFramework(null)
          setSelectedTimeline(timelineEventToRow(ev))
        }}
      />
    </>
  )
}

// ── Main view ──────────────────────────────────────────────────────────

export const ComplianceView = ({
  simEmbed = false,
  initialTab,
  initialCert,
}: {
  simEmbed?: boolean
  initialTab?: string
  /** Seeds the embed's local `cert` param (WP5.5) — the standalone route's
   *  `?cert=` deep-link, made reachable when simEmbed can't read the page URL. */
  initialCert?: string
}) => {
  // simEmbed: rendered headless inside the simulation — PageHeader + the URL-writing
  // tier filters are hidden, and the URL-synced filter/tab state (useComplianceUrlState)
  // is backed by local state so it never corrupts /simulation's route.
  const isMobileShell = useIsMobileShell()
  useWorkflowPhaseTracker('comply')

  // Drawer state — selected framework + the pillar it was opened from (drives
  // the traceability chain). Replaces FrameworkDetailPopover on Landscape.
  const [drawerFramework, setDrawerFramework] = useState<ComplianceFramework | null>(null)
  const [drawerPillar, setDrawerPillar] = useState<PillarId>('comply')

  const tierFilter = useTrustTierFilter()
  const { data, loading, error, refresh, lastUpdated, enrichRecord } = useComplianceRefresh()
  // Page-wide loading/error state — shared across every tab (Landscape,
  // Product Records, For You, CSWP.39 Agility all read the same `data`), not
  // duplicated per tab. Only the very first load shows the skeleton; a
  // filter-triggered background refresh with data already on screen keeps
  // using ComplianceTable's own spinner overlay, unchanged.
  const showComplianceSkeleton = loading && data.length === 0
  // Role is a reading lens on the register — ordering and annotation only. It
  // never changes which instruments apply.
  const personaForLens = usePersonaStore((s) => s.selectedPersona)
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)
  const addHistoryEvent = useHistoryStore((s) => s.addEvent)

  // Fire history event on selection change (debounced 1.5s).
  const prevCountRef = useRef(myFrameworks.length)
  useEffect(() => {
    const count = myFrameworks.length
    if (count === prevCountRef.current) return
    prevCountRef.current = count
    if (count === 0) return
    const timer = setTimeout(() => {
      addHistoryEvent({
        type: 'compliance_framework_selection',
        timestamp: Date.now(),
        title: 'Updated compliance selection',
        detail: `${count} framework${count === 1 ? '' : 's'} selected`,
        route: '/compliance',
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [myFrameworks.length, addHistoryEvent])

  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportCsv = useCallback(() => {
    try {
      const csv = generateCsv(data, COMPLIANCE_CSV_COLUMNS)
      downloadCsv(csv, csvFilename('pqc-compliance'))
      setExportError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error generating CSV export.'
      console.error('Compliance CSV export failed:', err)
      setExportError(message)
    }
  }, [data])

  // ── URL-synced filter state ──────────────────────────────────────────

  const {
    setSearchParams,
    certParam,
    evref,
    activeTab,
    setActiveTab,
    highlightFrameworkId,
    reqFilter,
    lsOrg,
    lsIndustry,
    lsRegion,
    lsCountry,
    lsDeadline,
    lsSearch,
    setLsSearch,
    lsSearchInput,
    setLsSearchInput,
    lsSort,
    lsView,
    rtab,
    recSearchInput,
    recPqc,
    recCat,
    recSrc,
    recVendor,
    recMcat,
    recSortCol,
    recSortDir,
    recPage,
    syncFiltersToUrl,
    handleLsOrgChange,
    handleLsIndustryChange,
    handleLsRegionChange,
    handleLsCountryChange,
    handleLsDeadlineChange,
    handleLsSearchChange,
    handleLsSortChange,
    handleLsViewChange,
    handleRtabChange,
    handleRecSearchChange,
    handleRecPqcChange,
    handleRecCatChange,
    handleRecSrcChange,
    handleRecVendorChange,
    handleRecMcatChange,
    handleRecSortColChange,
    handleRecSortDirChange,
    handleRecPageChange,
  } = useComplianceUrlState(simEmbed, initialTab, initialCert)

  // Active pillar — derived from the landscape tab, kept in local state so the
  // pipeline can drive it independently.
  const [pillar, setPillar] = useState<PillarId>(() =>
    isLandscapeTab(activeTab) ? tabToPillar(activeTab) : 'standardize'
  )
  // Pre-existing URL→state sync, unchanged by this commit. The compiler-backed
  // lint began reporting it only because removing the onboarding stack made this
  // component analysable; rewriting shared tab/pillar behaviour is out of scope
  // here and wants its own ticket.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLandscapeTab(activeTab)) setPillar(tabToPillar(activeTab))
  }, [activeTab])

  // Deep-link reachability: `?framework=<id>` used to only drive
  // highlightFrameworkId, which scrolls to and rings the card grid's entry
  // for 3s (ComplianceLandscape) — it never actually opened the traceability
  // drawer, so a shared "/compliance?framework=NIST-IR-8547" link landed on a
  // page that visually flashed and then looked like nothing happened,
  // especially in table view where there's no card to ring at all. Opening
  // the drawer here makes the URL a real deep link into the drawer itself,
  // matching what onSelectRelated already does for in-drawer navigation.
  const didOpenDrawerFromUrlRef = useRef<string | null>(null)

  // opening the drawer from `?framework=` is a deliberate deep-link effect that
  // predates this commit.
  useEffect(() => {
    if (!highlightFrameworkId) return
    if (didOpenDrawerFromUrlRef.current === highlightFrameworkId) return
    didOpenDrawerFromUrlRef.current = highlightFrameworkId
    const fw = complianceFrameworks.find((f) => f.id === highlightFrameworkId)
    if (!fw) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setDrawerPillar(pillarForBodyType(fw.bodyType))
    setDrawerFramework(fw)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [highlightFrameworkId])

  // CSWP.39 jump-back marker + query (ephemeral UI state).
  const [cswp39JumpActive, setCswp39JumpActive] = useState(false)
  const [cswp39JumpQuery, setCswp39JumpQuery] = useState('')

  // Tier-filtered framework universe for the pillar pipeline.
  const tierFilteredFrameworks = useMemo(() => {
    const tiered =
      tierFilter.length === 0
        ? complianceFrameworks
        : complianceFrameworks.filter((f) => matchesTrustTierFilter(tierFilter, 'compliance', f.id))
    if (reqFilter.length === 0) return tiered
    return tiered.filter((f) => reqFilter.includes(f.pqcRequirement))
  }, [tierFilter, reqFilter])

  // For-You DeadlineTimeline.
  const forYouProfileOverride = useMemo(
    () => ({
      country: lsCountry !== 'All' ? lsCountry : undefined,
      industry: lsIndustry !== 'All' ? lsIndustry : undefined,
    }),
    [lsCountry, lsIndustry]
  )
  const { profile: forYouProfile } = useApplicability(forYouProfileOverride)

  // ── Tab handlers ─────────────────────────────────────────────────────

  const handleTabChange = useCallback(
    (tab: MobileSection) => {
      setActiveTab(tab)
      syncFiltersToUrl({ tab })
      logComplianceFilter('Tab', tab)
      setCswp39JumpActive(false)
    },
    [setActiveTab, syncFiltersToUrl]
  )

  const handleStableTabSelect = useCallback(
    (id: StableTab) => {
      if (id === 'landscape') handleTabChange(pillarToTab(pillar))
      else handleTabChange(id as MobileSection)
    },
    [handleTabChange, pillar]
  )

  const handlePillarChange = useCallback(
    (next: PillarId) => {
      setPillar(next)
      const tab = pillarToTab(next)
      setActiveTab(tab)
      syncFiltersToUrl({ tab })
      logComplianceFilter('Pillar', next)
    },
    [setActiveTab, syncFiltersToUrl]
  )

  const handleCswp39Jump = useCallback(
    (targetTab: MobileSection, searchQuery: string) => {
      setLsSearchInput(searchQuery)
      setLsSearch(searchQuery)
      setActiveTab(targetTab)
      syncFiltersToUrl({ tab: targetTab, q: searchQuery })
      logComplianceFilter('Tab', targetTab)
      setCswp39JumpActive(true)
      setCswp39JumpQuery(searchQuery)
      requestAnimationFrame(() => {
        document
          .getElementById('compliance-tabs')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [setActiveTab, setLsSearch, setLsSearchInput, syncFiltersToUrl]
  )

  const handleReturnToCswp39 = useCallback(() => {
    setActiveTab('cswp39')
    syncFiltersToUrl({ tab: 'cswp39' })
    logComplianceFilter('Tab', 'cswp39')
    setCswp39JumpActive(false)
    setCswp39JumpQuery('')
    requestAnimationFrame(() => {
      document
        .getElementById('cswp39-cross-walk')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [setActiveTab, syncFiltersToUrl])

  const handleNavigateToCswp39 = useCallback(
    (refId: string) => {
      setActiveTab('cswp39')
      setCswp39JumpActive(false)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', 'cswp39')
          next.set('evref', refId)
          return next
        },
        { replace: false }
      )
    },
    [setActiveTab, setSearchParams]
  )

  const handleClearEvref = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('evref')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  // Landscape filter pass-through bundle for the pillar pipeline.
  const landscapeProps = {
    orgFilter: lsOrg,
    industryFilter: lsIndustry,
    regionFilter: lsRegion,
    countryFilter: lsCountry,
    deadlineFilter: lsDeadline,
    searchText: lsSearch,
    searchInputValue: lsSearchInput,
    sortBy: lsSort as FrameworkSortOption,
    viewMode: lsView,
    onOrgFilterChange: handleLsOrgChange,
    onIndustryFilterChange: handleLsIndustryChange,
    onRegionFilterChange: handleLsRegionChange,
    onCountryFilterChange: handleLsCountryChange,
    onDeadlineFilterChange: handleLsDeadlineChange,
    onSearchTextChange: handleLsSearchChange,
    onSortByChange: handleLsSortChange,
    onViewModeChange: handleLsViewChange,
    onNavigateToCswp39: handleNavigateToCswp39,
    highlightFrameworkId,
    onSelectFramework: (fw: ComplianceFramework) => {
      setDrawerPillar(pillar)
      setDrawerFramework(fw)
    },
  }

  const activeStableTab = stableTabFor(activeTab)

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/export/endorse/flag render there now, not as
  // a row on the page itself. Mirrors TimelineView.tsx's pattern. Gated on
  // `!simEmbed`, same as the PageHeader render below (this page's own
  // separate in-page <ForYouSection onExportCsv={handleExportCsv} /> export
  // button, further down, is untouched — handleExportCsv is still a real,
  // shared function, just no longer ALSO wired to PageHeader's onExport).
  useEffect(() => {
    if (simEmbed) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'Standardization, Certification & Compliance',
      dataSource: complianceMetadata
        ? `${complianceMetadata.filename} • Updated: ${complianceMetadata.lastUpdate.toLocaleDateString()}`
        : undefined,
      onExport: handleExportCsv,
      endorseUrl: buildEndorsementUrl({
        category: 'compliance-endorsement',
        title: 'Endorse: Standardization, Certification & Compliance',
        resourceType: 'Compliance Page',
        resourceId: 'Standardization, Certification & Compliance',
        resourceDetails:
          '**Page:** Standardization, Certification & Compliance — standards bodies, certification schemes, and regulatory frameworks.',
        pageUrl: '/compliance',
      }),
      endorseLabel: 'Compliance Page',
      endorseResourceType: 'Compliance',
      flagUrl: buildFlagUrl({
        category: 'compliance-endorsement',
        title: 'Flag: Standardization, Certification & Compliance',
        resourceType: 'Compliance Page',
        resourceId: 'Standardization, Certification & Compliance',
        resourceDetails:
          '**Page:** Standardization, Certification & Compliance — standards bodies, certification schemes, and regulatory frameworks.',
        pageUrl: '/compliance',
      }),
      flagLabel: 'Compliance Page',
      flagResourceType: 'Compliance',
    })
    return () => clearPageActions()
  }, [simEmbed, handleExportCsv])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). ComplianceEmbed.tsx renders
  // this same component inside the simulation via simEmbed, so simEmbed must
  // win over isMobileShell regardless of viewport width, same as Threats/
  // Library.
  if (isMobileShell && !simEmbed) {
    return <MobileComplianceView />
  }

  return (
    <div className="animate-fade-in space-y-6">
      {!simEmbed && (
        <PageHeader
          icon={ShieldCheck}
          title="Standardization, Certification & Compliance"
          description="Which standards, certification schemes and regulations apply to your context — who defines the algorithms, who validates the products, and who mandates adoption by a date. A reference to find what binds you, not a workspace."
        />
      )}

      {/* The learning frame, glossary strip, revisions feed, persona hint,
          control deck and deadline dot-plot used to stack here — five blocks
          before the visitor reached the tab bar, which is why "which rules bind
          me" cost a scroll and a guess. The register answers that on arrival;
          the glossary lives in the page header, the deadlines now have their own
          tab, and the trust-tier filter used to sit inline below.

          REMOVED 2026-08-11: the trust-tier control was the third filter area on
          this page, floating on its own above the tabs with no visual relation
          to the scope it sat beside. Scope now comes from one place — the top
          bar, plus the single Country picker the tier engine needs and the top
          bar cannot supply. `?tier=` deep links still resolve, because
          useTrustTierFilter reads the URL; what is gone is the second on-screen
          place to change it. The other four pages that use it are untouched. */}

      {exportError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-status-error/40 bg-status-error/5 p-3 text-sm"
        >
          <Info size={16} className="mt-0.5 shrink-0 text-status-error" />
          <div className="flex-1">
            <p className="font-medium text-status-error">CSV export failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{exportError}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExportError(null)}
            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Dismiss export error"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Jump-back banner after a CSWP.39 cross-walk navigation. */}
      {cswp39JumpActive && activeTab !== 'cswp39' && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-sm">
          <Workflow size={16} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">
            {cswp39JumpQuery ? (
              <>
                Cross-walk result for{' '}
                <span className="font-medium text-foreground">&ldquo;{cswp39JumpQuery}&rdquo;</span>
              </>
            ) : (
              'Arrived from the CSWP.39 cross-walk.'
            )}
          </span>
          <Button
            variant="ghost"
            onClick={handleReturnToCswp39}
            className="flex h-auto shrink-0 items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Back to CSWP.39
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCswp39JumpActive(false)
              setCswp39JumpQuery('')
            }}
            className="h-auto shrink-0 px-1.5 py-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss cross-walk banner"
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* ── Stable tab bar — same order for every persona ──
          overflow-x-auto already existed here, but with no fade/hint that
          more tabs (e.g. CSWP.39 Agility) are reachable off-screen on a
          phone — ScrollFadeContainer adds that cue without changing the
          scroll behavior itself. */}
      <div id="compliance-tabs">
        <ScrollFadeContainer
          className="mb-4"
          scrollClassName="flex items-center gap-1 border-b border-border"
          scrollProps={{ role: 'tablist', 'aria-label': 'Compliance views' }}
        >
          {STABLE_TABS.map(({ id, label, icon: Icon }) => {
            const active = activeStableTab === id
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                role="tab"
                aria-selected={active}
                data-workshop-target={id === 'foryou' ? 'compliance-tab-foryou' : undefined}
                onClick={() => handleStableTabSelect(id)}
                className={`h-auto shrink-0 gap-1.5 rounded-none border-b-2 px-4 py-2.5 text-sm font-semibold ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {label}
              </Button>
            )
          })}
        </ScrollFadeContainer>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} onRetry={refresh} />
          </div>
        )}

        {!error && showComplianceSkeleton && (
          <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading compliance data">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-5/6" />
          </div>
        )}

        {/* ── Obligations — the register ── */}
        {activeStableTab === 'obligations' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <SectionHeader
              icon={<ShieldCheck size={20} className="text-primary" />}
              title="Rules & Standards"
              description="The instruments that bind your country and sector, why each one applies, and what it says about post-quantum cryptography. Tiers come from the same applicability engine For You uses."
            />
            <ObligationsTab
              profile={forYouProfile}
              countryValue={lsCountry}
              onCountryChange={handleLsCountryChange}
              sectorValue={lsIndustry}
              persona={personaForLens}
              onOpenDetail={(fw) => {
                setDrawerPillar(pillarForBodyType(fw.bodyType))
                setDrawerFramework(fw)
              }}
            />
          </div>
        )}

        {/* ── Requirements — the reading room ── */}
        {activeStableTab === 'requirements' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <SectionHeader
              icon={<BookOpen size={20} className="text-primary" />}
              title="Requirements"
              description="What each obligation requires, taken from the documents it cites — with the verbatim quote, where it appears, and which model extracted it. A reading list, not a checklist."
            />
            <RequirementsTab profile={forYouProfile} />
          </div>
        )}

        {/* ── Progress — the scoped deadline slice ── */}
        {activeStableTab === 'progress' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <SectionHeader
              icon={<CalendarClock size={20} className="text-primary" />}
              title="Progress"
              description="Every date the instruments in your scope actually state, in one ordered list — replacing the three separate timelines this page used to draw."
            />
            <ProgressTab
              profile={forYouProfile}
              onOpenDetail={(fw) => {
                setDrawerPillar(pillarForBodyType(fw.bodyType))
                setDrawerFramework(fw)
              }}
            />
          </div>
        )}

        {/* ── Products — inventory to certificate ── */}
        {activeStableTab === 'products' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <SectionHeader
              icon={<PackageSearch size={20} className="text-primary" />}
              title="Products"
              description="Which of the things you run hold a certificate, under which scheme, and whether it covers post-quantum algorithms or only classical ones. Inventory comes from the list you keep on Migrate."
            />
            <ProductsTab />
          </div>
        )}

        {/* ── Landscape — three-pillar pipeline ── */}
        {activeStableTab === 'landscape' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <PillarPipeline
              frameworks={tierFilteredFrameworks}
              activePillar={pillar}
              onPillarChange={handlePillarChange}
              {...landscapeProps}
            />
          </div>
        )}

        {/* ── Product Records ── */}
        {activeStableTab === 'records' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <SectionHeader
              icon={<GlobeLock size={20} className="text-primary" />}
              title="Product Certification Records"
              description="Live certification records from NIST CMVP, NIST CAVP, and Common Criteria Portal — searchable product validations for FIPS 140-3, ACVP algorithm testing, and CC evaluations."
            />
            <RecordsGlossaryStrip />
            <PqcCertificationTrendChart data={data} asOf={lastUpdated} />
            <ComplianceTable
              data={data}
              onRefresh={refresh}
              isRefreshing={loading}
              lastUpdated={lastUpdated}
              onEnrich={enrichRecord}
              certType={rtab}
              onCertTypeChange={handleRtabChange}
              filterText={recSearchInput}
              pqcFilters={recPqc}
              categoryFilters={recCat}
              sourceFilters={recSrc}
              tierFilters={tierFilter}
              vendorFilters={recVendor}
              sortColumn={recSortCol}
              sortDirection={recSortDir}
              currentPage={recPage}
              selectedRecordId={certParam}
              onFilterTextChange={handleRecSearchChange}
              onPqcFiltersChange={handleRecPqcChange}
              onCategoryFiltersChange={handleRecCatChange}
              onSourceFiltersChange={handleRecSrcChange}
              onVendorFiltersChange={handleRecVendorChange}
              migrateCatFilters={recMcat}
              onMigrateCatFiltersChange={handleRecMcatChange}
              onSortColumnChange={handleRecSortColChange}
              onSortDirectionChange={handleRecSortDirChange}
              onCurrentPageChange={handleRecPageChange}
            />
          </div>
        )}

        {/* ── For You — stable skeleton, tuned per persona via the shared lens ── */}
        {activeStableTab === 'foryou' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <SectionHeader
              icon={<Sparkles size={20} className="text-primary" />}
              title="For You"
              description="Standards, threats, library docs, and timeline milestones that apply to your industry, country, and region — tuned by your role (top bar) and your assessment profile."
            />
            <ForYouSection onExportCsv={handleExportCsv} />
          </div>
        )}

        {/* ── CSWP.39 Agility ── */}
        {activeStableTab === 'cswp39' && !error && !showComplianceSkeleton && (
          <div className="mt-0 space-y-4">
            <CSWP39AgilityExplorer
              onNavigateToFramework={handleCswp39Jump}
              evref={evref}
              onClearEvref={handleClearEvref}
            />
          </div>
        )}
      </div>

      {/* Drill-down traceability drawer (Landscape rows). */}
      <ComplianceDetailDrawer
        framework={drawerFramework}
        pillar={drawerPillar}
        onClose={() => setDrawerFramework(null)}
        onOpenCswp39={(refId) => {
          setDrawerFramework(null)
          handleNavigateToCswp39(refId)
        }}
        onTrack={(fw) => toggleMyFramework(fw.id)}
        isTracked={drawerFramework ? myFrameworks.includes(drawerFramework.id) : false}
        onSelectRelated={(name) => {
          const lower = name.toLowerCase()
          const match = complianceFrameworks.find(
            (f) =>
              f.label.toLowerCase() === lower ||
              f.label.toLowerCase().includes(lower) ||
              lower.includes(f.label.toLowerCase())
          )
          if (match) {
            setDrawerPillar(pillarForBodyType(match.bodyType))
            setDrawerFramework(match)
          }
        }}
      />
    </div>
  )
}
