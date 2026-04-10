// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useSearchParams, Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ComplianceTable, type SortColumn, type SortDirection } from './ComplianceTable'
import { ComplianceLandscape, type FrameworkSortOption } from './ComplianceLandscape'
import { useComplianceRefresh } from './services'
import {
  ShieldCheck,
  GlobeLock,
  Info,
  BookOpen,
  Award,
  Scale,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { logComplianceFilter } from '../../utils/analytics'
import { PageHeader } from '../common/PageHeader'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { COMPLIANCE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { complianceFrameworks, complianceMetadata } from '@/data/complianceData'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { type ViewMode } from '@/components/Library/ViewToggle'
import debounce from 'lodash/debounce'

// Maps industry → recommended top-level section + sub-hint
const INDUSTRY_COMPLIANCE_HINT: Record<
  string,
  { section: string; sectionLabel: string; rationale: string }
> = {
  'Finance & Banking': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'FIPS 140-3 validated modules are mandatory for US federal financial systems and broadly adopted in banking for encryption compliance.',
  },
  'Government & Defense': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'FIPS 140-3 is required for federal information systems. Common Criteria EAL4+ applies to high-assurance defense products.',
  },
  Healthcare: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'HIPAA requires FIPS-validated encryption for ePHI. FIPS 140-3 validated modules satisfy this requirement.',
  },
  Telecommunications: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → ACVP',
    rationale:
      'Algorithm-level ACVP validation is key for telecom protocol stacks. Common Criteria applies to network infrastructure products.',
  },
  Technology: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → ACVP',
    rationale:
      'ACVP validates algorithm implementations directly. FIPS 140-3 applies if building products for federal customers.',
  },
  'Energy & Utilities': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'NERC-CIP and federal energy regulations increasingly require FIPS-validated cryptographic modules for critical infrastructure.',
  },
  Automotive: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → Common Criteria',
    rationale:
      'Common Criteria (ISO/IEC 15408) is used for automotive V2X and ECU security evaluations under UN R155.',
  },
  Aerospace: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'DO-326A and federal programs require FIPS-validated modules. Common Criteria applies to avionics security products.',
  },
  'Retail & E-Commerce': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'PCI-DSS aligns with FIPS 140-3 for payment cryptography. FIPS validation is the baseline for payment processors.',
  },
}

// EU region pushes Common Criteria/EUCC tab
const REGION_COMPLIANCE_HINT: Record<
  string,
  { section: string; sectionLabel: string; rationale: string } | undefined
> = {
  eu: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → Common Criteria',
    rationale:
      'EU Cybersecurity Act (EUCC scheme) mandates Common Criteria evaluations for products sold in the EU market.',
  },
}

// ── Section header strip ───────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
  learnLabel: string
  learnTo: string
}

function SectionHeader({ icon, title, description, learnLabel, learnTo }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4 p-4 rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-2 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Link
        to={learnTo}
        className="print:hidden inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium shrink-0"
      >
        <ExternalLink size={12} />
        {learnLabel}
      </Link>
    </div>
  )
}

// ── Mobile toggle ──────────────────────────────────────────────────────

type MobileSection = 'standards' | 'technical' | 'certification' | 'compliance' | 'records'

function MobileViewToggle({
  activeSection,
  onSectionChange,
  landscapeProps,
  tableProps,
}: {
  activeSection: MobileSection
  onSectionChange: (section: MobileSection) => void
  landscapeProps: {
    orgFilter: string
    industryFilter: string
    searchText: string
    searchInputValue: string
    sortBy: FrameworkSortOption
    viewMode: ViewMode
    onOrgFilterChange: (org: string) => void
    onIndustryFilterChange: (ind: string) => void
    onSearchTextChange: (text: string) => void
    onSortByChange: (sort: FrameworkSortOption) => void
    onViewModeChange: (mode: ViewMode) => void
  }
  tableProps: React.ComponentProps<typeof ComplianceTable>
}) {
  const section = activeSection
  const setSection = onSectionChange

  const standardsFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'standardization_body'),
    []
  )
  const technicalStandards = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'technical_standard'),
    []
  )
  const certificationFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'certification_body'),
    []
  )
  const complianceOnlyFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'compliance_framework'),
    []
  )

  const btnClass = (active: boolean) =>
    `flex-none px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
    }`

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <Button
          variant="ghost"
          className={btnClass(section === 'standards')}
          onClick={() => setSection('standards')}
        >
          Bodies
        </Button>
        <Button
          variant="ghost"
          className={btnClass(section === 'technical')}
          onClick={() => setSection('technical')}
        >
          Tech Stds
        </Button>
        <Button
          variant="ghost"
          className={btnClass(section === 'certification')}
          onClick={() => setSection('certification')}
        >
          Cert Schemes
        </Button>
        <Button
          variant="ghost"
          className={btnClass(section === 'compliance')}
          onClick={() => setSection('compliance')}
        >
          Frameworks
        </Button>
        <Button
          variant="ghost"
          className={btnClass(section === 'records')}
          onClick={() => setSection('records')}
        >
          Records
        </Button>
      </div>
      {section === 'standards' && (
        <ComplianceLandscape
          frameworks={standardsFrameworks}
          showDeadlineTimeline={false}
          {...landscapeProps}
        />
      )}
      {section === 'technical' && (
        <ComplianceLandscape
          frameworks={technicalStandards}
          showDeadlineTimeline={false}
          {...landscapeProps}
        />
      )}
      {section === 'certification' && (
        <ComplianceLandscape
          frameworks={certificationFrameworks}
          showDeadlineTimeline={false}
          {...landscapeProps}
        />
      )}
      {section === 'compliance' && (
        <ComplianceLandscape
          frameworks={complianceOnlyFrameworks}
          showDeadlineTimeline={true}
          {...landscapeProps}
        />
      )}
      {section === 'records' && (
        <div className="mt-2">
          <ComplianceTable {...tableProps} />
        </div>
      )}
    </div>
  )
}

// ── Main view ──────────────────────────────────────────────────────────

export const ComplianceView = () => {
  useWorkflowPhaseTracker('comply')
  const [searchParams, setSearchParams] = useSearchParams()
  const certParam = searchParams.get('cert') ?? undefined
  const { data, loading, refresh, lastUpdated, enrichRecord } = useComplianceRefresh()
  const { selectedIndustries, selectedRegion, selectedPersona, experienceLevel } = usePersonaStore()
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

  // Pre-filtered framework sets for each tab
  const standardsFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'standardization_body'),
    []
  )
  const technicalStandards = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'technical_standard'),
    []
  )
  const certificationFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'certification_body'),
    []
  )
  const complianceOnlyFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'compliance_framework'),
    []
  )

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(data, COMPLIANCE_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-compliance'))
  }, [data])

  // ── URL-synced filter state ──────────────────────────────────────────

  const isLandscapeTab = (tab: MobileSection) =>
    tab === 'standards' || tab === 'technical' || tab === 'certification' || tab === 'compliance'

  // Active tab
  const [activeTab, setActiveTab] = useState<MobileSection>(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    if (tab) return tab
    return (certParam ? 'records' : (complianceHint?.section ?? 'standards')) as MobileSection
  })

  // Landscape filter state
  const [lsOrg, setLsOrg] = useState(() => searchParams.get('org') ?? 'All')
  const [lsIndustry, setLsIndustry] = useState(
    // Only pre-select an industry when exactly one is active (cert restricts to single industry).
    // Multiple industries (including "all allowed") → default to 'All' so nothing is filtered out.
    () =>
      searchParams.get('ind') ?? (selectedIndustries.length === 1 ? selectedIndustries[0] : 'All')
  )
  const [lsSearch, setLsSearch] = useState(() => searchParams.get('q') ?? '')
  const [lsSearchInput, setLsSearchInput] = useState(() => searchParams.get('q') ?? '')
  const [lsSort, setLsSort] = useState<FrameworkSortOption>(
    () => (searchParams.get('sort') as FrameworkSortOption | null) ?? 'deadline'
  )
  const [lsView, setLsView] = useState<ViewMode>(
    () => (searchParams.get('view') as ViewMode | null) ?? 'cards'
  )

  // Records filter state
  const [rtab, setRtab] = useState(() => searchParams.get('rtab') ?? 'all')
  const [recSearch, setRecSearch] = useState(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    return tab === 'records' ? (searchParams.get('q') ?? '') : ''
  })
  const [recSearchInput, setRecSearchInput] = useState(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    return tab === 'records' ? (searchParams.get('q') ?? '') : ''
  })
  const [recPqc, setRecPqc] = useState<string[]>(
    () => searchParams.get('pqc')?.split(',').filter(Boolean) ?? []
  )
  const [recCat, setRecCat] = useState<string[]>(
    () => searchParams.get('cat')?.split(',').filter(Boolean) ?? []
  )
  const [recSrc, setRecSrc] = useState<string[]>(
    () => searchParams.get('src')?.split(',').filter(Boolean) ?? []
  )
  const [recVendor, setRecVendor] = useState<string[]>(
    () => searchParams.get('vendor')?.split(',').filter(Boolean) ?? []
  )
  const [recMcat, setRecMcat] = useState<string[]>(
    () => searchParams.get('mcat')?.split(',').filter(Boolean) ?? []
  )
  const [recSortCol, setRecSortCol] = useState<SortColumn>(
    () => (searchParams.get('sort') as SortColumn | null) ?? 'date'
  )
  const [recSortDir, setRecSortDir] = useState<SortDirection>(
    () => (searchParams.get('dir') as SortDirection | null) ?? 'desc'
  )
  const [recPage, setRecPage] = useState(() => parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const [recCertId, setRecCertId] = useState<string | undefined>(
    () => searchParams.get('cert') ?? undefined
  )

  // ── syncFiltersToUrl — write current state to URL ────────────────────

  const syncFiltersToUrl = useCallback(
    (overrides: {
      tab?: MobileSection
      org?: string
      ind?: string
      q?: string
      sort?: string
      view?: ViewMode
      rtab?: string
      rq?: string
      pqc?: string[]
      cat?: string[]
      src?: string[]
      vendor?: string[]
      mcat?: string[]
      rsort?: string
      dir?: SortDirection
      page?: number
      cert?: string
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const tab = overrides.tab ?? activeTab

          // Tab param
          if (tab !== 'standards') next.set('tab', tab)
          else next.delete('tab')

          // Clear all filter params then set contextual ones
          for (const key of [
            'org',
            'ind',
            'q',
            'sort',
            'view',
            'rtab',
            'pqc',
            'cat',
            'src',
            'vendor',
            'mcat',
            'dir',
            'page',
            'cert',
          ]) {
            next.delete(key)
          }

          if (isLandscapeTab(tab)) {
            const org = overrides.org ?? lsOrg
            const ind = overrides.ind ?? lsIndustry
            const q = overrides.q ?? lsSearch
            const sort = overrides.sort ?? lsSort
            const view = overrides.view ?? lsView

            if (org !== 'All') next.set('org', org)
            if (ind !== 'All') next.set('ind', ind)
            if (q) next.set('q', q)
            if (sort !== 'deadline') next.set('sort', sort)
            if (view !== 'cards') next.set('view', view)
          } else {
            const rt = overrides.rtab ?? rtab
            const q = overrides.rq ?? recSearch
            const pqc = overrides.pqc ?? recPqc
            const cat = overrides.cat ?? recCat
            const src = overrides.src ?? recSrc
            const vendor = overrides.vendor ?? recVendor
            const mcat = overrides.mcat ?? recMcat
            const sort = overrides.rsort ?? recSortCol
            const dir = overrides.dir ?? recSortDir
            const page = overrides.page ?? recPage
            const cert = overrides.cert ?? recCertId

            if (rt !== 'all') next.set('rtab', rt)
            if (q) next.set('q', q)
            if (pqc.length > 0) next.set('pqc', pqc.join(','))
            if (cat.length > 0) next.set('cat', cat.join(','))
            if (src.length > 0) next.set('src', src.join(','))
            if (vendor.length > 0) next.set('vendor', vendor.join(','))
            if (mcat.length > 0) next.set('mcat', mcat.join(','))
            if (sort !== 'date') next.set('sort', sort)
            if (dir !== 'desc') next.set('dir', dir)
            if (page > 1) next.set('page', String(page))
            if (cert) next.set('cert', cert)
          }

          return next
        },
        { replace: true }
      )
    },
    [
      activeTab,
      lsOrg,
      lsIndustry,
      lsSearch,
      lsSort,
      lsView,
      rtab,
      recSearch,
      recPqc,
      recCat,
      recSrc,
      recVendor,
      recMcat,
      recSortCol,
      recSortDir,
      recPage,
      recCertId,
      setSearchParams,
    ]
  )

  // ── URL → state sync (back/forward navigation) ──────────────────────

  useEffect(() => {
    const tab = (searchParams.get('tab') as MobileSection | null) ?? 'standards'
    setActiveTab((prev) => (prev !== tab ? tab : prev))

    if (isLandscapeTab(tab)) {
      const nextOrg = searchParams.get('org') ?? 'All'
      const nextInd =
        searchParams.get('ind') ?? (selectedIndustries.length === 1 ? selectedIndustries[0] : 'All')
      const nextQ = searchParams.get('q') ?? ''
      const nextSort = (searchParams.get('sort') as FrameworkSortOption) ?? 'deadline'
      const nextView = (searchParams.get('view') as ViewMode) ?? 'cards'

      setLsOrg((prev) => (prev !== nextOrg ? nextOrg : prev))
      setLsIndustry((prev) => (prev !== nextInd ? nextInd : prev))
      setLsSearch((prev) => (prev !== nextQ ? nextQ : prev))
      setLsSearchInput((prev) => (prev !== nextQ ? nextQ : prev))
      setLsSort((prev) => (prev !== nextSort ? nextSort : prev))
      setLsView((prev) => (prev !== nextView ? nextView : prev))
    } else {
      const nextRtab = searchParams.get('rtab') ?? 'all'
      const nextQ = searchParams.get('q') ?? ''
      const nextPqc = searchParams.get('pqc')?.split(',').filter(Boolean) ?? []
      const nextCat = searchParams.get('cat')?.split(',').filter(Boolean) ?? []
      const nextSrc = searchParams.get('src')?.split(',').filter(Boolean) ?? []
      const nextVendor = searchParams.get('vendor')?.split(',').filter(Boolean) ?? []
      const nextMcat = searchParams.get('mcat')?.split(',').filter(Boolean) ?? []
      const nextSort = (searchParams.get('sort') as SortColumn) ?? 'date'
      const nextDir = (searchParams.get('dir') as SortDirection) ?? 'desc'
      const nextPage = parseInt(searchParams.get('page') ?? '1', 10) || 1

      setRtab((prev) => (prev !== nextRtab ? nextRtab : prev))
      setRecSearch((prev) => (prev !== nextQ ? nextQ : prev))
      setRecSearchInput((prev) => (prev !== nextQ ? nextQ : prev))
      setRecPqc((prev) => (JSON.stringify(prev) !== JSON.stringify(nextPqc) ? nextPqc : prev))
      setRecCat((prev) => (JSON.stringify(prev) !== JSON.stringify(nextCat) ? nextCat : prev))
      setRecSrc((prev) => (JSON.stringify(prev) !== JSON.stringify(nextSrc) ? nextSrc : prev))
      setRecVendor((prev) =>
        JSON.stringify(prev) !== JSON.stringify(nextVendor) ? nextVendor : prev
      )
      setRecMcat((prev) => (JSON.stringify(prev) !== JSON.stringify(nextMcat) ? nextMcat : prev))
      setRecSortCol((prev) => (prev !== nextSort ? nextSort : prev))
      setRecSortDir((prev) => (prev !== nextDir ? nextDir : prev))
      setRecPage((prev) => (prev !== nextPage ? nextPage : prev))
      const nextCert = searchParams.get('cert') ?? undefined
      setRecCertId((prev) => (prev !== nextCert ? nextCert : prev))
    }
  }, [searchParams, selectedIndustries])

  // ── Debounced search ─────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLsSearch = useCallback(
    debounce((value: string) => {
      setLsSearch(value)
      syncFiltersToUrl({ q: value })
    }, 200),
    [syncFiltersToUrl]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRecSearch = useCallback(
    debounce((value: string) => {
      setRecSearch(value)
      setRecPage(1)
      syncFiltersToUrl({ rq: value, page: 1 })
    }, 200),
    [syncFiltersToUrl]
  )

  // ── Landscape handlers ───────────────────────────────────────────────

  const handleLsOrgChange = useCallback(
    (org: string) => {
      setLsOrg(org)
      syncFiltersToUrl({ org })
    },
    [syncFiltersToUrl]
  )

  const handleLsIndustryChange = useCallback(
    (ind: string) => {
      setLsIndustry(ind)
      syncFiltersToUrl({ ind })
    },
    [syncFiltersToUrl]
  )

  const handleLsSearchChange = useCallback(
    (text: string) => {
      setLsSearchInput(text)
      debouncedLsSearch(text)
    },
    [debouncedLsSearch]
  )

  const handleLsSortChange = useCallback(
    (sort: FrameworkSortOption) => {
      setLsSort(sort)
      syncFiltersToUrl({ sort })
    },
    [syncFiltersToUrl]
  )

  const handleLsViewChange = useCallback(
    (mode: ViewMode) => {
      setLsView(mode)
      syncFiltersToUrl({ view: mode })
    },
    [syncFiltersToUrl]
  )

  // ── Records handlers ─────────────────────────────────────────────────

  const handleRecSearchChange = useCallback(
    (text: string) => {
      setRecSearchInput(text)
      debouncedRecSearch(text)
    },
    [debouncedRecSearch]
  )

  const handleRecPqcChange = useCallback(
    (filters: string[]) => {
      setRecPqc(filters)
      setRecPage(1)
      syncFiltersToUrl({ pqc: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecCatChange = useCallback(
    (filters: string[]) => {
      setRecCat(filters)
      setRecPage(1)
      syncFiltersToUrl({ cat: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecSrcChange = useCallback(
    (filters: string[]) => {
      setRecSrc(filters)
      setRecPage(1)
      syncFiltersToUrl({ src: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecVendorChange = useCallback(
    (filters: string[]) => {
      setRecVendor(filters)
      setRecPage(1)
      syncFiltersToUrl({ vendor: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecMcatChange = useCallback(
    (filters: string[]) => {
      setRecMcat(filters)
      setRecPage(1)
      syncFiltersToUrl({ mcat: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecSortColChange = useCallback(
    (col: SortColumn) => {
      setRecSortCol(col)
      syncFiltersToUrl({ rsort: col })
    },
    [syncFiltersToUrl]
  )

  const handleRecSortDirChange = useCallback(
    (dir: SortDirection) => {
      setRecSortDir(dir)
      syncFiltersToUrl({ dir })
    },
    [syncFiltersToUrl]
  )

  const handleRecPageChange = useCallback(
    (page: number) => {
      setRecPage(page)
      syncFiltersToUrl({ page })
    },
    [syncFiltersToUrl]
  )

  // ── Tab handlers ─────────────────────────────────────────────────────

  const handleTabChange = useCallback(
    (tab: MobileSection) => {
      setActiveTab(tab)
      syncFiltersToUrl({ tab })
      logComplianceFilter('Tab', tab)
    },
    [syncFiltersToUrl]
  )

  const handleRtabChange = useCallback(
    (value: string) => {
      setRtab(value)
      syncFiltersToUrl({ rtab: value })
    },
    [syncFiltersToUrl]
  )

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
        shareTitle="PQC Compliance Tracker — Standards, Certifications, Frameworks"
        shareText="Explore PQC compliance: standardization bodies, certification programs (FIPS 140-3, ACVP, Common Criteria), and regulatory frameworks."
        onExport={handleExportCsv}
      />

      {/* Curious user intro context */}
      {(selectedPersona === 'curious' || experienceLevel === 'curious') && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-secondary/20 bg-secondary/5 text-sm">
          <Info size={16} className="text-secondary mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">New to compliance?</span>
            <p className="text-muted-foreground text-xs">
              This page tracks who sets the rules for quantum-safe cryptography.{' '}
              <span className="font-medium text-foreground">Standardization bodies</span> define the
              algorithms, <span className="font-medium text-foreground">certification schemes</span>{' '}
              test that products implement them correctly, and{' '}
              <span className="font-medium text-foreground">compliance frameworks</span> are the
              laws and regulations that require organizations to adopt them. Start with the
              Standards tab to see the big picture.
            </p>
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

      {/* Mobile: 3-section toggle */}
      <div className="md:hidden">
        <MobileViewToggle
          activeSection={activeTab}
          onSectionChange={handleTabChange}
          landscapeProps={{
            orgFilter: lsOrg,
            industryFilter: lsIndustry,
            searchText: lsSearch,
            searchInputValue: lsSearchInput,
            sortBy: lsSort,
            viewMode: lsView,
            onOrgFilterChange: handleLsOrgChange,
            onIndustryFilterChange: handleLsIndustryChange,
            onSearchTextChange: handleLsSearchChange,
            onSortByChange: handleLsSortChange,
            onViewModeChange: handleLsViewChange,
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

      {/* Desktop: 3-tab layout */}
      <div className="hidden md:block">
        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={(tab) => handleTabChange(tab as MobileSection)}
        >
          <TabsList className="mb-4 bg-muted/50 border border-border flex-wrap md:flex-nowrap h-auto overflow-x-auto scrollbar-none">
            <TabsTrigger value="standards" className="flex items-center gap-1.5">
              <BookOpen size={14} />
              Standardization Bodies
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1.5">
              <FileText size={14} />
              Technical Standards
            </TabsTrigger>
            <TabsTrigger value="certification" className="flex items-center gap-1.5">
              <Award size={14} />
              Certification Schemes
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-1.5">
              <Scale size={14} />
              Compliance Frameworks
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-1.5">
              <GlobeLock size={14} />
              Cert Records
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Standardization Bodies ── */}
          <TabsContent value="standards" className="mt-0 space-y-4">
            <SectionHeader
              icon={<BookOpen size={20} className="text-secondary" />}
              title="Standardization Bodies"
              description={`${standardsFrameworks.length} organizations that define PQC algorithms, protocols, and security requirements — the bodies whose publications the world implements.`}
              learnLabel="Explore in Learn module"
              learnTo="/learn/standards-bodies?step=2"
            />
            <ComplianceLandscape
              frameworks={standardsFrameworks}
              showDeadlineTimeline={false}
              orgFilter={lsOrg}
              industryFilter={lsIndustry}
              searchText={lsSearch}
              searchInputValue={lsSearchInput}
              sortBy={lsSort}
              viewMode={lsView}
              onOrgFilterChange={handleLsOrgChange}
              onIndustryFilterChange={handleLsIndustryChange}
              onSearchTextChange={handleLsSearchChange}
              onSortByChange={handleLsSortChange}
              onViewModeChange={handleLsViewChange}
            />
          </TabsContent>

          {/* ── Tab 2: Technical Standards ── */}
          <TabsContent value="technical" className="mt-0 space-y-4">
            <SectionHeader
              icon={<FileText size={20} className="text-secondary" />}
              title="Technical Standards"
              description={`${technicalStandards.length} published specifications, guidelines, and technical standards — the documents that define cryptographic requirements organizations must implement.`}
              learnLabel="Explore in Learn module"
              learnTo="/learn/standards-bodies?step=2"
            />
            <ComplianceLandscape
              frameworks={technicalStandards}
              showDeadlineTimeline={false}
              orgFilter={lsOrg}
              industryFilter={lsIndustry}
              searchText={lsSearch}
              searchInputValue={lsSearchInput}
              sortBy={lsSort}
              viewMode={lsView}
              onOrgFilterChange={handleLsOrgChange}
              onIndustryFilterChange={handleLsIndustryChange}
              onSearchTextChange={handleLsSearchChange}
              onSortByChange={handleLsSortChange}
              onViewModeChange={handleLsViewChange}
            />
          </TabsContent>

          {/* ── Tab 3: Certification Schemes ── */}
          <TabsContent value="certification" className="mt-0 space-y-4">
            <SectionHeader
              icon={<Award size={20} className="text-status-success" />}
              title="Certification Schemes"
              description={`${certificationFrameworks.length} validation programs and schemes that certify cryptographic products and algorithm implementations against published standards.`}
              learnLabel="Understand the cert chain"
              learnTo="/learn/standards-bodies?step=2"
            />
            <ComplianceLandscape
              frameworks={certificationFrameworks}
              showDeadlineTimeline={false}
              orgFilter={lsOrg}
              industryFilter={lsIndustry}
              searchText={lsSearch}
              searchInputValue={lsSearchInput}
              sortBy={lsSort}
              viewMode={lsView}
              onOrgFilterChange={handleLsOrgChange}
              onIndustryFilterChange={handleLsIndustryChange}
              onSearchTextChange={handleLsSearchChange}
              onSortByChange={handleLsSortChange}
              onViewModeChange={handleLsViewChange}
            />
          </TabsContent>

          {/* ── Tab 4: Compliance Frameworks ── */}
          <TabsContent value="compliance" className="mt-0 space-y-4">
            <SectionHeader
              icon={<Scale size={20} className="text-primary" />}
              title="Compliance Frameworks"
              description={`${complianceOnlyFrameworks.length} regulations, directives, and mandates — the legal and contractual obligations that require organizations to adopt PQC across specific industries and geographies.`}
              learnLabel="Build your strategy"
              learnTo="/learn/compliance-strategy"
            />
            <ComplianceLandscape
              frameworks={complianceOnlyFrameworks}
              showDeadlineTimeline={true}
              orgFilter={lsOrg}
              industryFilter={lsIndustry}
              searchText={lsSearch}
              searchInputValue={lsSearchInput}
              sortBy={lsSort}
              viewMode={lsView}
              onOrgFilterChange={handleLsOrgChange}
              onIndustryFilterChange={handleLsIndustryChange}
              onSearchTextChange={handleLsSearchChange}
              onSortByChange={handleLsSortChange}
              onViewModeChange={handleLsViewChange}
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
        </Tabs>
      </div>
    </div>
  )
}
