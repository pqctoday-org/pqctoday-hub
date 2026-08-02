// SPDX-License-Identifier: GPL-3.0-only
import { lazy, Suspense, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useSearchParams } from 'react-router'
import { ComplianceTable } from './ComplianceTable'
import { type FrameworkSortOption } from './ComplianceLandscape'
import { DeadlineTimelineGate } from './DeadlineTimelineGate'
import { AboutThisPageStrip } from './AboutThisPageStrip'
import { PersonaHintCta } from './PersonaHintCta'
import { useComplianceRefresh } from './services'
import {
  ShieldCheck,
  GlobeLock,
  Info,
  Workflow,
  ArrowLeft,
  Sparkles,
  X,
  Layers,
} from 'lucide-react'
import {
  TrustTierFilter,
  useTrustTierFilter,
  matchesTrustTierFilter,
} from '../common/TrustTierFilter'
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
import { RoleFilter } from '../common/RoleFilter'
import { normalizeCountry } from '@/utils/applicabilityEngine'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useComplianceUrlState, isLandscapeTab, type MobileSection } from './useComplianceUrlState'
import { PreviewBanner } from '../common/PreviewBanner'
import { INDUSTRY_COMPLIANCE_HINT, REGION_COMPLIANCE_HINT } from '@/data/compliancePersonaHints'
// ── Redesign components ────────────────────────────────────────────────────
import { ControlDeck } from './redesign/ControlDeck'
import { PillarPipeline } from './redesign/PillarPipeline'
import { ComplianceDetailDrawer } from './redesign/ComplianceDetailDrawer'
import { CSWP39AgilityExplorer } from './redesign/CSWP39AgilityExplorer'
import { RecordsGlossaryStrip } from './redesign/RecordsGlossaryStrip'
import { type PillarId, pillarForBodyType } from './redesign/pillarModel'
import { ScrollFadeContainer } from '../ui/ScrollFadeContainer'

// ── Stable tab model ───────────────────────────────────────────────────────
// Four tabs, same order for every persona. Persona is a LENS (it tunes content
// in place via the shared control deck) — it never reorders the bar.

type StableTab = 'landscape' | 'records' | 'foryou' | 'cswp39'

const STABLE_TABS: { id: StableTab; label: string; icon: typeof Layers }[] = [
  { id: 'landscape', label: 'Landscape', icon: Layers },
  { id: 'records', label: 'Product Records', icon: GlobeLock },
  { id: 'foryou', label: 'For You', icon: Sparkles },
  { id: 'cswp39', label: 'CSWP.39 Agility', icon: Workflow },
]

function stableTabFor(activeTab: MobileSection): StableTab {
  if (isLandscapeTab(activeTab)) return 'landscape'
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
  const { selectedIndustries, selectedRegion } = usePersonaStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
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

  const primaryIndustry = selectedIndustries[0] ?? null
  // eslint-disable-next-line security/detect-object-injection
  const industryHint = primaryIndustry ? INDUSTRY_COMPLIANCE_HINT[primaryIndustry] : undefined
  // eslint-disable-next-line security/detect-object-injection
  const regionHint = selectedRegion ? REGION_COMPLIANCE_HINT[selectedRegion] : undefined
  const complianceHint = industryHint ?? regionHint
  const complianceHintLabel = primaryIndustry
    ? `${primaryIndustry} focus`
    : selectedRegion === 'eu'
      ? 'EU region'
      : null

  // Per-industry/region dismissal.
  const personaHintDismissKey = primaryIndustry
    ? `compliance-persona-hint-dismissed-industry:${primaryIndustry}`
    : selectedRegion === 'eu'
      ? 'compliance-persona-hint-dismissed-region:eu'
      : null
  const [personaHintDismissTick, setPersonaHintDismissTick] = useState(0)
  const personaHintDismissed = useMemo(() => {
    if (!personaHintDismissKey || typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(personaHintDismissKey) === '1'
    } catch {
      return false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaHintDismissKey, personaHintDismissTick])
  const personaHintIdentity = primaryIndustry
    ? `industry:${primaryIndustry}`
    : selectedRegion === 'eu'
      ? 'region:eu'
      : 'unknown'

  const dismissPersonaHint = useCallback(() => {
    if (!personaHintDismissKey) return
    try {
      window.localStorage.setItem(personaHintDismissKey, '1')
    } catch {
      /* private browsing / quota */
    }
    setPersonaHintDismissTick((t) => t + 1)
    logComplianceFilter('PersonaHintDismiss', personaHintIdentity)
  }, [personaHintDismissKey, personaHintIdentity])

  const [exportError, setExportError] = useState<string | null>(null)

  // Returning-visitor signal — true once this browser has loaded /compliance
  // before. Drives auto-collapse of the first-visit onboarding stack (intro
  // banner, full deadline timeline) so repeat visits reach the tab bar in
  // roughly one screen instead of re-showing first-visit chrome every time.
  const VISITED_KEY = 'compliance-visited-v1'
  const isReturningVisitor = useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(VISITED_KEY) === '1'
    } catch {
      return false
    }
  }, [])
  useEffect(() => {
    try {
      window.localStorage.setItem(VISITED_KEY, '1')
    } catch {
      /* private browsing / quota */
    }
  }, [])

  // Intro banner dismissal.
  const INTRO_DISMISS_KEY = 'compliance-intro-dismissed-v1'
  const [introDismissed, setIntroDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      if (window.localStorage.getItem(INTRO_DISMISS_KEY) === '1') return true
      // A returning visitor implicitly counts as having seen the intro, even
      // if they never explicitly dismissed it — first-time visitors are the
      // only ones who should see the full onboarding stack.
      return window.localStorage.getItem(VISITED_KEY) === '1'
    } catch {
      return false
    }
  })
  const dismissIntro = useCallback(() => {
    setIntroDismissed(true)
    try {
      window.localStorage.setItem(INTRO_DISMISS_KEY, '1')
    } catch {
      /* private browsing / quota */
    }
  }, [])

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
  useEffect(() => {
    if (isLandscapeTab(activeTab)) setPillar(tabToPillar(activeTab))
  }, [activeTab])

  // CSWP.39 jump-back marker + query (ephemeral UI state).
  const [cswp39JumpActive, setCswp39JumpActive] = useState(false)
  const [cswp39JumpQuery, setCswp39JumpQuery] = useState('')

  // Tier-filtered framework universe for the pillar pipeline.
  const tierFilteredFrameworks = useMemo(
    () =>
      tierFilter.length === 0
        ? complianceFrameworks
        : complianceFrameworks.filter((f) =>
            matchesTrustTierFilter(tierFilter, 'compliance', f.id)
          ),
    [tierFilter]
  )

  // For-You DeadlineTimeline.
  const forYouProfileOverride = useMemo(
    () => ({
      country: lsCountry !== 'All' ? lsCountry : undefined,
      industry: lsIndustry !== 'All' ? lsIndustry : undefined,
    }),
    [lsCountry, lsIndustry]
  )
  const { profile: forYouProfile } = useApplicability(forYouProfileOverride)

  const deadlineTimelineFrameworks = useMemo(() => {
    if (activeTab !== 'foryou' || !forYouProfile.country) return complianceFrameworks
    const filtered = complianceFrameworks.filter((f) =>
      f.countries.includes(forYouProfile.country!)
    )
    return filtered.length > 0 ? filtered : complianceFrameworks
  }, [activeTab, forYouProfile.country])

  const deadlineTimelineLabel =
    activeTab === 'foryou' && forYouProfile.country
      ? `${forYouProfile.country} deadlines`
      : undefined

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

  const handlePersonaHintNavigate = useCallback(
    (
      section: MobileSection,
      subFacet?: import('@/data/compliancePersonaHints').ComplianceHintSubFacet
    ) => {
      setActiveTab(section)
      const urlOverrides: Parameters<typeof syncFiltersToUrl>[0] = { tab: section }
      if (subFacet?.rtab) urlOverrides.rtab = subFacet.rtab
      syncFiltersToUrl(urlOverrides)
      logComplianceFilter('PersonaHint', section)
      logComplianceFilter('PersonaHintCtaClick', `${personaHintIdentity}→${section}`)
      setCswp39JumpActive(false)
      requestAnimationFrame(() => {
        document
          .getElementById('compliance-tabs')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [setActiveTab, syncFiltersToUrl, personaHintIdentity]
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

  return (
    <div className="animate-fade-in space-y-6">
      {!simEmbed && (
        <PageHeader
          icon={ShieldCheck}
          title="Standardization, Certification & Compliance"
          description="Who defines the algorithms, who validates the products, who mandates adoption — across standardization bodies, certification schemes, and compliance frameworks."
        />
      )}

      {selectedPersona === 'curious' && <PreviewBanner pageContext="GRC, Executive, Architect" />}

      <AboutThisPageStrip
        headerSlot={
          <span className="md:hidden" data-testid="about-strip-trust-tier-slot">
            {/* tier filter writes ?tier= — hidden in the sim embed (URL-safe) */}
            {!simEmbed && <TrustTierFilter />}
          </span>
        }
      />

      {/* Consolidated control deck — shared persona lens drives every tab. */}
      <ControlDeck />

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

      {/* New-to-compliance intro — suppressed when a persona hint will render. */}
      {!introDismissed && !(complianceHint && complianceHintLabel && !personaHintDismissed) && (
        <div className="space-y-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info size={15} className="shrink-0 text-secondary" />
              <span className="text-sm font-semibold text-foreground">New to PQC compliance?</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissIntro}
              className="h-auto shrink-0 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Dismiss compliance intro"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="space-y-1">
              <span className="font-medium text-foreground">Standardization Bodies</span>
              <p className="text-muted-foreground">
                NIST, ENISA, ISO, BSI — define the algorithms and publish the technical standards
                that everything else references.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dismissIntro()
                  handlePillarChange('standardize')
                }}
                className="h-auto px-0 py-0 text-xs font-medium text-primary hover:text-primary/80"
              >
                Browse bodies →
              </Button>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-foreground">Certification Schemes</span>
              <p className="text-muted-foreground">
                FIPS 140-3, Common Criteria, EUCC — independently test that products implement the
                algorithms correctly. Required for procurement.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dismissIntro()
                  handlePillarChange('certify')
                }}
                className="h-auto px-0 py-0 text-xs font-medium text-primary hover:text-primary/80"
              >
                Browse schemes →
              </Button>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-foreground">Compliance Frameworks</span>
              <p className="text-muted-foreground">
                CNSA 2.0, NIS2, DORA, national PQC mandates — the laws and regulations that require
                organizations to adopt PQC by specific deadlines.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dismissIntro()
                  handlePillarChange('comply')
                }}
                className="h-auto px-0 py-0 text-xs font-medium text-primary hover:text-primary/80"
              >
                Browse frameworks →
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-secondary/20 pt-1 text-xs text-muted-foreground">
            <span>Or jump straight to</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                dismissIntro()
                handleTabChange('records')
              }}
              className="h-auto px-0 py-0 text-xs font-medium text-primary hover:text-primary/80"
            >
              live product certifications →
            </Button>
          </div>
        </div>
      )}

      {/* Persona/industry context hint. */}
      {complianceHint && complianceHintLabel && !personaHintDismissed && (
        <PersonaHintCta
          label={complianceHintLabel}
          hint={complianceHint}
          onNavigate={handlePersonaHintNavigate}
          onDismiss={dismissPersonaHint}
        />
      )}

      {/* PQC deadline timeline — persona-gated. */}
      <DeadlineTimelineGate
        persona={selectedPersona}
        frameworks={deadlineTimelineFrameworks}
        label={deadlineTimelineLabel}
        returningVisitor={isReturningVisitor}
      />

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
              description="Standards, threats, library docs, and timeline milestones that apply to your industry, country, and region — tuned by the lens above and your assessment profile."
            />
            <div className="flex flex-wrap gap-2">
              <RoleFilter syncWithPersona />
            </div>
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
