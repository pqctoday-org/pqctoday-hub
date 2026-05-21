// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Link, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ComplianceTable } from './ComplianceTable'
import {
  ComplianceLandscape,
  DeadlineTimeline,
  type FrameworkSortOption,
} from './ComplianceLandscape'
import { CrossTabSearchHint, type LandscapeTab } from './CrossTabSearchHint'
import { useComplianceRefresh } from './services'
import {
  ShieldCheck,
  GlobeLock,
  Info,
  ExternalLink,
  Workflow,
  ArrowLeft,
  Sparkles,
  X,
  Layers,
} from 'lucide-react'
import { CSWP39Explorer } from './CSWP39Explorer'
import {
  TrustTierFilter,
  useTrustTierFilter,
  matchesTrustTierFilter,
} from '../common/TrustTierFilter'
import { MoreTabsMenu } from './MoreTabsMenu'
import { ApplicabilityPanel } from '../applicability/ApplicabilityPanel'
import { LearningFrameBanner } from './LearningFrameBanner'
import { GlossaryStrip } from './GlossaryStrip'
import { LandscapeTab as LandscapeTabBody } from './LandscapeTab'
import { LandscapeTypeFacet, type LandscapeType } from './LandscapeTypeFacet'
import { ExecutiveTimelineView } from './views/ExecutiveTimelineView'
import { ArchitectStandardsView } from './views/ArchitectStandardsView'
import { ResearcherEvidenceView } from './views/ResearcherEvidenceView'
import { DeveloperImplementationView } from './views/DeveloperImplementationView'
import { LibraryDetailPopover } from '@/components/Library/LibraryDetailPopover'
import { ThreatDetailDialog } from '@/components/Threats/ThreatDetailDialog'
import {
  TimelineDocumentDetailPopover,
  type TimelineDocumentRow,
} from '@/components/Timeline/TimelineDocumentDetailPopover'
import { FrameworkDetailPopover } from '@/components/Compliance/FrameworkDetailPopover'
import type { LibraryItem } from '@/data/libraryData'
import type { ThreatData } from '@/data/threatsData'
import type { TimelineEvent } from '@/types/timeline'
import type { ComplianceFramework, RegionBloc, DeadlinePhase } from '@/data/complianceData'
import { useApplicability } from '@/hooks/useApplicability'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import { logComplianceFilter } from '../../utils/analytics'
import { PageHeader } from '../common/PageHeader'
import { ContentUpdatesFeed } from '@/components/ui/ContentUpdatesFeed'
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
import { useComplianceUrlState, type MobileSection } from './useComplianceUrlState'
import type { ViewMode } from '@/components/Library/ViewToggle'
import { INDUSTRY_COMPLIANCE_HINT, REGION_COMPLIANCE_HINT } from '@/data/compliancePersonaHints'

// ── Section header strip ───────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
  learnLabel: string
  learnTo: string
  /**
   * Optional glossary of acronyms/schemes shown inside the header as an expandable
   * row. Used on the Certification Schemes tab to distinguish FIPS 140-3 from ACVP,
   * Common Criteria, EUCC, CNSA 2.0, etc.
   */
  glossary?: { term: string; definition: string }[]
}

function SectionHeader({
  icon,
  title,
  description,
  learnLabel,
  learnTo,
  glossary,
}: SectionHeaderProps) {
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const hasGlossary = !!glossary && glossary.length > 0

  return (
    <div className="flex flex-col gap-3 mb-4 p-4 rounded-lg border border-border bg-muted/20">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex items-center gap-2 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasGlossary && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setGlossaryOpen((v) => !v)}
              className="h-auto text-xs px-3 py-1.5 border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30 font-medium"
              aria-expanded={glossaryOpen}
              aria-controls="section-header-glossary"
            >
              <Info size={12} />
              {glossaryOpen ? 'Hide glossary' : 'Glossary'}
            </Button>
          )}
          <Link
            to={learnTo}
            className="print:hidden inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium"
          >
            <ExternalLink size={12} />
            {learnLabel}
          </Link>
        </div>
      </div>
      {hasGlossary && glossaryOpen && (
        <dl
          id="section-header-glossary"
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs bg-card rounded-md border border-border p-3"
        >
          {glossary!.map((g) => (
            <div key={g.term} className="flex flex-col">
              <dt className="font-semibold text-foreground">{g.term}</dt>
              <dd className="text-muted-foreground mt-0.5">{g.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

// ── Mobile toggle ──────────────────────────────────────────────────────

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
 * Resolves the For-You tab content per persona:
 *   executive  → ExecutiveTimelineView (regulatory clock + framework cards + milestones)
 *   architect  → ArchitectStandardsView (standards landscape + crypto-agility focus)
 *   researcher → ResearcherEvidenceView (full evidence browser + citation depth)
 *   developer  → DeveloperImplementationView (algorithm coverage + tool jumps + standards→impl)
 *   ops / curious / no persona → ApplicabilityPanel (generic recommendation surface)
 *
 * All branches consume the same `useApplicability` engine output; only the rendering
 * differs. Profile override is plumbed identically so the workshop deep-link
 * `?country=Australia&ind=Government & Defense` works regardless of persona.
 */
function ForYouSection() {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const selectedIndustries = usePersonaStore((s) => s.selectedIndustries)
  const storeCountry = useAssessmentFormStore((s) => s.country)
  const storeIndustry = useAssessmentFormStore((s) => s.industry)
  const setCountry = useAssessmentFormStore((s) => s.setCountry)
  const setIndustry = useAssessmentFormStore((s) => s.setIndustry)
  const [searchParams] = useSearchParams()

  // Backwards compat for workshop / Landscape deep-links (`?country=…&industry=…`,
  // `?ind=…`, `?geo=…`, `?sector=…`): on first mount, mirror them into the
  // assessment store if it's empty. From there, the editable ProfileSummary in
  // ApplicabilityPanel is the single source of truth, so user edits are no
  // longer shadowed by a stale URL override.
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
        <ExecutiveTimelineView {...callbacks} />
      ) : persona === 'architect' ? (
        <ArchitectStandardsView {...callbacks} />
      ) : persona === 'researcher' ? (
        <ResearcherEvidenceView {...callbacks} />
      ) : persona === 'developer' ? (
        <DeveloperImplementationView {...callbacks} />
      ) : (
        <ApplicabilityPanel variant="tab" {...callbacks} />
      )}
      <LibraryDetailPopover
        isOpen={!!selectedLibrary}
        onClose={() => setSelectedLibrary(null)}
        item={selectedLibrary}
      />
      {selectedThreat && (
        <ThreatDetailDialog threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
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

// ── Explore section helpers ────────────────────────────────────────────

function isExploreSection(
  s: MobileSection
): s is 'standards' | 'technical' | 'certification' | 'compliance' {
  return s === 'standards' || s === 'technical' || s === 'certification' || s === 'compliance'
}

function mobileSectionToLandscapeType(s: MobileSection): LandscapeType {
  if (s === 'technical') return 'standards'
  if (s === 'certification') return 'certifications'
  if (s === 'compliance') return 'regulations'
  return 'bodies'
}

function landscapeTypeToMobileSection(t: LandscapeType): MobileSection {
  if (t === 'standards') return 'technical'
  if (t === 'certifications') return 'certification'
  if (t === 'regulations') return 'compliance'
  return 'standards'
}

function MobileViewToggle({
  activeSection,
  onSectionChange,
  onCswp39Jump,
  evref,
  onClearEvref,
  onNavigateToCswp39,
  landscapeProps,
  tableProps,
}: {
  activeSection: MobileSection
  onSectionChange: (section: MobileSection) => void
  onCswp39Jump: (targetTab: MobileSection, searchQuery: string) => void
  evref?: string
  onClearEvref?: () => void
  onNavigateToCswp39?: (refId: string) => void
  landscapeProps: {
    orgFilter: string
    industryFilter: string
    regionFilter: RegionBloc | 'All'
    countryFilter: string
    deadlineFilter: 'All' | DeadlinePhase
    searchText: string
    searchInputValue: string
    sortBy: FrameworkSortOption
    viewMode: ViewMode
    onOrgFilterChange: (org: string) => void
    onIndustryFilterChange: (ind: string) => void
    onRegionFilterChange: (region: RegionBloc | 'All') => void
    onCountryFilterChange: (country: string) => void
    onDeadlineFilterChange: (phase: 'All' | DeadlinePhase) => void
    onSearchTextChange: (text: string) => void
    onSortByChange: (sort: FrameworkSortOption) => void
    onViewModeChange: (mode: ViewMode) => void
    highlightFrameworkId?: string | null
    onSelectFramework?: (fw: import('@/data/complianceData').ComplianceFramework) => void
  }
  tableProps: React.ComponentProps<typeof ComplianceTable>
}) {
  const section = activeSection
  const setSection = onSectionChange

  // Industry alliances (PQC-COALITION, PQCA, QED-C) are surfaced alongside
  // standardization bodies — they're standardization-adjacent organisations that
  // produce reference implementations, policy guidance, and migration tooling.
  const tierFilter = useTrustTierFilter()
  const tierFilteredFrameworks = useMemo(
    () =>
      tierFilter.length === 0
        ? complianceFrameworks
        : complianceFrameworks.filter((f) =>
            matchesTrustTierFilter(tierFilter, 'compliance', f.id)
          ),
    [tierFilter]
  )
  const standardsFrameworks = useMemo(
    () =>
      tierFilteredFrameworks.filter(
        (f) => f.bodyType === 'standardization_body' || f.bodyType === 'industry_alliance'
      ),
    [tierFilteredFrameworks]
  )
  const technicalStandards = useMemo(
    () => tierFilteredFrameworks.filter((f) => f.bodyType === 'technical_standard'),
    [tierFilteredFrameworks]
  )
  const certificationFrameworks = useMemo(
    () => tierFilteredFrameworks.filter((f) => f.bodyType === 'certification_body'),
    [tierFilteredFrameworks]
  )
  const complianceOnlyFrameworks = useMemo(
    () => tierFilteredFrameworks.filter((f) => f.bodyType === 'compliance_framework'),
    [tierFilteredFrameworks]
  )

  const landscapeTabFrameworks = useMemo(
    () => ({
      standards: standardsFrameworks,
      technical: technicalStandards,
      certification: certificationFrameworks,
      compliance: complianceOnlyFrameworks,
    }),
    [standardsFrameworks, technicalStandards, certificationFrameworks, complianceOnlyFrameworks]
  )

  const typeCounts = useMemo(
    () => ({
      regulations: complianceOnlyFrameworks.length,
      standards: technicalStandards.length,
      certifications: certificationFrameworks.length,
      bodies: standardsFrameworks.length,
    }),
    [complianceOnlyFrameworks, technicalStandards, certificationFrameworks, standardsFrameworks]
  )

  const switchLandscapeTab = useCallback(
    (tab: LandscapeTab) => setSection(tab as MobileSection),
    [setSection]
  )

  const btnClass = (active: boolean) =>
    `flex-none px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
    }`

  return (
    <div className="space-y-4" id="compliance-tabs-mobile">
      {/* Navigation strip — primary tabs + explore sub-type row */}
      <div className="bg-card border border-border rounded-xl p-1.5 space-y-1.5">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            <Button
              variant="ghost"
              data-workshop-target="compliance-tab-foryou"
              className={btnClass(section === 'foryou')}
              onClick={() => setSection('foryou')}
            >
              For You
            </Button>
            <Button
              variant="ghost"
              className={btnClass(isExploreSection(section))}
              onClick={() => {
                if (!isExploreSection(section)) setSection('standards')
              }}
            >
              Explore
            </Button>
            <Button
              variant="ghost"
              className={btnClass(section === 'records')}
              onClick={() => setSection('records')}
            >
              Records
            </Button>
            <Button
              variant="ghost"
              className={btnClass(section === 'cswp39')}
              onClick={() => setSection('cswp39')}
            >
              CSWP.39
            </Button>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent"
          />
        </div>
        {/* Type facet sub-row — only when Explore is active */}
        {isExploreSection(section) && (
          <div className="border-t border-border/50 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <LandscapeTypeFacet
              value={mobileSectionToLandscapeType(section)}
              counts={typeCounts}
              onChange={(type) => setSection(landscapeTypeToMobileSection(type))}
            />
          </div>
        )}
      </div>
      {section === 'foryou' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <RoleFilter syncWithPersona />
          </div>
          <ForYouSection />
        </div>
      )}
      {isExploreSection(section) && (
        <div className="space-y-3">
          <CrossTabSearchHint
            searchText={landscapeProps.searchText}
            currentTab={section as LandscapeTab}
            tabFrameworks={landscapeTabFrameworks}
            onSwitchTab={switchLandscapeTab}
          />
          <ComplianceLandscape
            frameworks={
              section === 'technical'
                ? technicalStandards
                : section === 'certification'
                  ? certificationFrameworks
                  : section === 'compliance'
                    ? complianceOnlyFrameworks
                    : standardsFrameworks
            }
            showDeadlineTimeline={false}
            maturityByRefId={section === 'compliance' ? maturityByRefId : undefined}
            onNavigateToCswp39={section === 'compliance' ? onNavigateToCswp39 : undefined}
            {...landscapeProps}
          />
        </div>
      )}
      {section === 'records' && (
        <div className="mt-2">
          <ComplianceTable {...tableProps} />
        </div>
      )}
      {section === 'cswp39' && (
        <CSWP39Explorer
          onNavigateToFramework={onCswp39Jump}
          evref={evref}
          onClearEvref={onClearEvref}
        />
      )}
    </div>
  )
}

// ── Main view ──────────────────────────────────────────────────────────

export const ComplianceView = () => {
  useWorkflowPhaseTracker('comply')
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null)
  // Trust-tier filter (URL ?tier=) — feeds both the Landscape memos via
  // MobileViewToggle props AND the Records ComplianceTable directly.
  const tierFilter = useTrustTierFilter()
  const { data, loading, refresh, lastUpdated, enrichRecord } = useComplianceRefresh()
  const { selectedIndustries, selectedRegion } = usePersonaStore()
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const addHistoryEvent = useHistoryStore((s) => s.addEvent)

  // Fire history event on selection change (debounced 1.5s) — mirrors MigrateView pattern
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

  const [exportError, setExportError] = useState<string | null>(null)

  // Intro banner dismissal — persists across sessions. Bump the version suffix
  // if the copy changes substantively so returning users see the new wording.
  const INTRO_DISMISS_KEY = 'compliance-intro-dismissed-v1'
  const [introDismissed, setIntroDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(INTRO_DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const dismissIntro = useCallback(() => {
    setIntroDismissed(true)
    try {
      window.localStorage.setItem(INTRO_DISMISS_KEY, '1')
    } catch {
      /* private browsing / quota — banner just won't persist this session */
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

  // ── URL-synced filter state (owned by useComplianceUrlState) ──────────

  const {
    setSearchParams,
    certParam,
    evref,
    activeTab,
    setActiveTab,
    landscapeType,
    setLandscapeType,
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
  } = useComplianceUrlState()

  // CSWP.39 jump-back marker + query (ephemeral UI state, not URL-bound).
  const [cswp39JumpActive, setCswp39JumpActive] = useState(false)
  const [cswp39JumpQuery, setCswp39JumpQuery] = useState('')

  // Resolve effective For-You profile for the country-specific DeadlineTimeline.
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

  const handleCswp39Jump = useCallback(
    (targetTab: MobileSection, searchQuery: string) => {
      // Bypass the debounced search path — its stale closure of syncFiltersToUrl
      // (captured while activeTab was 'cswp39') would overwrite the tab param
      // 200ms later and snap the user back to the CSWP.39 tab.
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
        document
          .getElementById('compliance-tabs-mobile')
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={ShieldCheck}
        pageId="compliance"
        title="Standardization, Compliance and Certification"
        description="Explore the three pillars of PQC compliance: standardization bodies that define the algorithms, certification bodies that validate implementations, and compliance frameworks that mandate adoption."
        dataSource={
          complianceMetadata
            ? `${complianceMetadata.filename} • Updated: ${complianceMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Compliance"
        suppressSources
        shareTitle="PQC Compliance Tracker — Standards, Certifications, Frameworks"
        shareText="Explore PQC compliance: standardization bodies, certification programs (FIPS 140-3, ACVP, Common Criteria), and regulatory frameworks."
        onExport={handleExportCsv}
      />

      <LearningFrameBanner />
      <GlossaryStrip />

      <ContentUpdatesFeed domain="compliance" limit={5} title="Recent Compliance Revisions" />

      {exportError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-3 rounded-lg border border-status-error/40 bg-status-error/5 text-sm"
        >
          <Info size={16} className="text-status-error mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-status-error">CSV export failed</p>
            <p className="text-muted-foreground text-xs mt-0.5">{exportError}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExportError(null)}
            className="h-auto text-xs px-2 py-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss export error"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* New-to-compliance intro — 3-column structured brief with direct CTAs. */}
      {!introDismissed && (
        <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info size={15} className="text-secondary shrink-0" />
              <span className="text-sm font-semibold text-foreground">New to PQC compliance?</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissIntro}
              className="h-auto text-xs px-2 py-1 text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss compliance intro"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                  handleTabChange('standards')
                }}
                className="h-auto text-xs px-0 py-0 text-primary hover:text-primary/80 font-medium"
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
                  handleTabChange('certification')
                }}
                className="h-auto text-xs px-0 py-0 text-primary hover:text-primary/80 font-medium"
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
                  handleTabChange('compliance')
                }}
                className="h-auto text-xs px-0 py-0 text-primary hover:text-primary/80 font-medium"
              >
                Browse frameworks →
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-secondary/20 text-xs text-muted-foreground">
            <span>Or jump straight to</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                dismissIntro()
                handleTabChange('records')
              }}
              className="h-auto text-xs px-0 py-0 text-primary hover:text-primary/80 font-medium"
            >
              live product certifications →
            </Button>
          </div>
        </div>
      )}

      {/* Persona/industry context hint */}
      {complianceHint && complianceHintLabel && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">
              {complianceHintLabel}:{' '}
              <span className="text-primary">{complianceHint.sectionLabel}</span>
            </span>
            <p className="text-muted-foreground text-xs">{complianceHint.rationale}</p>
          </div>
        </div>
      )}

      {/* PQC deadline timeline — horizontally scrollable on mobile, full stacked view on desktop. */}
      <DeadlineTimeline frameworks={deadlineTimelineFrameworks} label={deadlineTimelineLabel} />

      {/* Jump-back banner — visible after CSWP.39 cross-walk navigation */}
      {cswp39JumpActive && activeTab !== 'cswp39' && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 text-sm">
          <Workflow size={16} className="text-primary shrink-0" />
          <span className="text-foreground/80 text-xs flex-1 min-w-0 truncate">
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
            className="h-auto px-2 py-1 text-xs text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-1 shrink-0"
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
            className="h-auto px-1.5 py-1 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dismiss cross-walk banner"
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Mobile: 3-section toggle */}
      <div className="md:hidden">
        <MobileViewToggle
          activeSection={activeTab}
          onSectionChange={handleTabChange}
          onCswp39Jump={handleCswp39Jump}
          evref={evref}
          onClearEvref={handleClearEvref}
          onNavigateToCswp39={handleNavigateToCswp39}
          landscapeProps={{
            orgFilter: lsOrg,
            industryFilter: lsIndustry,
            regionFilter: lsRegion,
            countryFilter: lsCountry,
            deadlineFilter: lsDeadline,
            searchText: lsSearch,
            searchInputValue: lsSearchInput,
            sortBy: lsSort,
            viewMode: lsView,
            onOrgFilterChange: handleLsOrgChange,
            onIndustryFilterChange: handleLsIndustryChange,
            onRegionFilterChange: handleLsRegionChange,
            onCountryFilterChange: handleLsCountryChange,
            onDeadlineFilterChange: handleLsDeadlineChange,
            onSearchTextChange: handleLsSearchChange,
            onSortByChange: handleLsSortChange,
            onViewModeChange: handleLsViewChange,
            highlightFrameworkId,
            onSelectFramework: setSelectedFramework,
          }}
          tableProps={{
            data: data,
            onRefresh: refresh,
            isRefreshing: loading,
            lastUpdated: lastUpdated,
            onEnrich: enrichRecord,
            certType: rtab,
            onCertTypeChange: handleRtabChange,
            filterText: recSearchInput,
            pqcFilters: recPqc,
            categoryFilters: recCat,
            sourceFilters: recSrc,
            vendorFilters: recVendor,
            sortColumn: recSortCol,
            sortDirection: recSortDir,
            currentPage: recPage,
            selectedRecordId: certParam,
            onFilterTextChange: handleRecSearchChange,
            onPqcFiltersChange: handleRecPqcChange,
            onCategoryFiltersChange: handleRecCatChange,
            onSourceFiltersChange: handleRecSrcChange,
            onVendorFiltersChange: handleRecVendorChange,
            migrateCatFilters: recMcat,
            onMigrateCatFiltersChange: handleRecMcatChange,
            onSortColumnChange: handleRecSortColChange,
            onSortDirectionChange: handleRecSortDirChange,
            onCurrentPageChange: handleRecPageChange,
          }}
        />
      </div>

      {/* Desktop: 3-tab layout — refactored from 7 tabs.
          For You · Landscape (with type facet) · Records.
          CSWP.39 still reachable via the More menu and via deep links. */}
      <div id="compliance-tabs" className="hidden md:block">
        <Tabs
          value={
            // Map any legacy landscape tab value into the unified 'landscape' surface.
            activeTab === 'standards' ||
            activeTab === 'technical' ||
            activeTab === 'certification' ||
            activeTab === 'compliance'
              ? 'landscape'
              : activeTab
          }
          className="w-full"
          onValueChange={(tab) => {
            if (tab === 'landscape') {
              // Land on whichever facet the user last had selected.
              const map: Record<LandscapeType, MobileSection> = {
                regulations: 'compliance',
                standards: 'technical',
                certifications: 'certification',
                bodies: 'standards',
              }
              // eslint-disable-next-line security/detect-object-injection
              handleTabChange(map[landscapeType])
            } else {
              handleTabChange(tab as MobileSection)
            }
          }}
        >
          <TabsList className="mb-4 bg-muted/50 border border-border h-auto flex items-center gap-1">
            {/* For You */}
            <TabsTrigger
              value="foryou"
              data-workshop-target="compliance-tab-foryou"
              className="flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              For You
            </TabsTrigger>
            {/* Landscape — combined surface (was 4 tabs) with a type facet inside */}
            <TabsTrigger value="landscape" className="flex items-center gap-1.5">
              <Layers size={14} />
              Landscape
            </TabsTrigger>
            {/* Records */}
            <TabsTrigger value="records" className="flex items-center gap-1.5">
              <GlobeLock size={14} />
              Records
            </TabsTrigger>
            {/* CSWP.39 — always visible; was previously hidden in MoreMenu */}
            <TabsTrigger value="cswp39" className="flex items-center gap-1.5">
              <Workflow size={14} />
              CSWP.39
            </TabsTrigger>
            {/* More menu — Standardization Bodies + Certification Schemes shortcuts
                that deep-link into the Landscape facet. */}
            <MoreTabsMenu activeTab={activeTab} onSelect={(tab) => handleTabChange(tab)} />
            <div className="ml-auto pr-2">
              <TrustTierFilter />
            </div>
          </TabsList>

          {/* ── Tab: For You — applies user profile across all content ── */}
          <TabsContent value="foryou" className="mt-0 space-y-4">
            <SectionHeader
              icon={<Sparkles size={20} className="text-primary" />}
              title="For You"
              description="Standards, threats, library docs, and timeline milestones that apply to your industry, country, and region. Powered by your assessment profile (or set inline below)."
              learnLabel="Take the full assessment"
              learnTo="/assess"
            />
            <div className="flex flex-wrap gap-2">
              <RoleFilter syncWithPersona />
            </div>
            <ForYouSection />
          </TabsContent>

          {/* ── Landscape — unified surface with a type facet ── */}
          <TabsContent value="landscape" className="mt-0 space-y-4">
            <LandscapeTabBody
              type={landscapeType}
              onTypeChange={(next) => {
                setLandscapeType(next)
                // Mirror the facet change into the legacy ?tab= param so
                // CSWP.39 cross-walk + share links still work.
                const map: Record<LandscapeType, MobileSection> = {
                  regulations: 'compliance',
                  standards: 'technical',
                  certifications: 'certification',
                  bodies: 'standards',
                }
                // eslint-disable-next-line security/detect-object-injection
                const targetTab = map[next]
                setActiveTab(targetTab)
                syncFiltersToUrl({ tab: targetTab })
              }}
              orgFilter={lsOrg}
              industryFilter={lsIndustry}
              regionFilter={lsRegion}
              countryFilter={lsCountry}
              deadlineFilter={lsDeadline}
              searchText={lsSearch}
              searchInputValue={lsSearchInput}
              sortBy={lsSort}
              viewMode={lsView}
              onOrgFilterChange={handleLsOrgChange}
              onIndustryFilterChange={handleLsIndustryChange}
              onRegionFilterChange={handleLsRegionChange}
              onCountryFilterChange={handleLsCountryChange}
              onDeadlineFilterChange={handleLsDeadlineChange}
              onSearchTextChange={handleLsSearchChange}
              onSortByChange={handleLsSortChange}
              onViewModeChange={handleLsViewChange}
              onNavigateToCswp39={handleNavigateToCswp39}
              highlightFrameworkId={highlightFrameworkId}
              onSelectFramework={setSelectedFramework}
            />
          </TabsContent>

          {/* ── Tab 5: Cert Records ── */}
          <TabsContent value="records" className="mt-0 space-y-4">
            <SectionHeader
              icon={<GlobeLock size={20} className="text-primary" />}
              title="Product Certification Records"
              description="Live certification records from NIST CMVP, NIST CAVP, and Common Criteria Portal — searchable product validations for FIPS 140-3, ACVP algorithm testing, and CC evaluations."
              learnLabel="Understand the cert chain"
              learnTo="/learn/standards-bodies?step=2"
              glossary={[
                {
                  term: 'FIPS 140-3',
                  definition:
                    'NIST cryptographic module validation standard (supersedes FIPS 140-2). CMVP-issued certificate covers the entire module — software, firmware, hardware. Required for US federal procurement.',
                },
                {
                  term: 'ACVP',
                  definition:
                    "Automated Cryptographic Validation Protocol — NIST CAVP's algorithm-level testing. ACVP certs validate individual primitives (e.g. ML-DSA-65) and are a prerequisite for FIPS 140-3 module certs.",
                },
                {
                  term: 'Common Criteria',
                  definition:
                    'ISO/IEC 15408 product-evaluation framework. Evaluations are issued under national schemes (BSI, ANSSI, NIAP, CCN, etc.) and mutually recognised under CCRA up to EAL2/EAL4.',
                },
                {
                  term: 'EUCC',
                  definition:
                    'European Union Common Criteria scheme — operative since 2024 under the EU Cybersecurity Act. Co-managed by ENISA and ECCG; supersedes SOG-IS MRA inside the EU.',
                },
                {
                  term: 'CNSA 2.0',
                  definition:
                    'NSA Commercial National Security Algorithm suite v2.0 (2022) — binding PQC algorithm requirements for US National Security Systems. Mandates ML-KEM, ML-DSA, SLH-DSA, AES-256, SHA-384/512 with full transition by 2035.',
                },
                {
                  term: 'HNDL',
                  definition:
                    'Harvest-Now-Decrypt-Later — the threat model that motivates near-term PQC migration. Adversaries collect encrypted traffic today and decrypt it once a cryptographically relevant quantum computer exists. Drives urgency for long-lived data (health, finance, state secrets).',
                },
                {
                  term: 'NIS2 / DORA',
                  definition:
                    'NIS2 Directive (EU) 2022/2555 — cybersecurity baseline for essential and important entities, effective Oct 2024. DORA (EU) 2022/2554 — financial-sector digital operational resilience, effective Jan 2025. Both invoke "state of the art" cryptography, which ENISA interprets as covering PQC readiness.',
                },
              ]}
            />
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
          </TabsContent>

          {/* ── Tab 6: CSWP.39 Framework ── */}
          <TabsContent value="cswp39" className="mt-0 space-y-4">
            <CSWP39Explorer
              onNavigateToFramework={(targetTab, searchQuery) =>
                handleCswp39Jump(targetTab as MobileSection, searchQuery)
              }
              evref={evref}
              onClearEvref={handleClearEvref}
            />
          </TabsContent>
        </Tabs>
      </div>
      <FrameworkDetailPopover
        isOpen={!!selectedFramework}
        onClose={() => setSelectedFramework(null)}
        framework={selectedFramework}
      />
    </div>
  )
}
