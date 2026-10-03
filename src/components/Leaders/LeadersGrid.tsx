// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import {
  Search,
  Briefcase,
  Building2,
  School,
  Users,
  Award,
  ShieldX,
  Info,
  X,
  BookOpen,
} from 'lucide-react'

import { usePersonaStore } from '@/store/usePersonaStore'
import { leadersData, leadersMetadata, deprecatedLeaderSuccessors } from '../../data/leadersData'
import type { Leader } from '../../data/leadersData'
import { logEvent, personaLabel } from '../../utils/analytics'
import { FilterDropdown } from '../common/FilterDropdown'
import { EmptyState } from '../ui/empty-state'
import { CountryFlag } from '../common/CountryFlag'
import { LeaderCard } from './LeaderCard'
import { LeadersTable } from './LeadersTable'
import { LeaderCategorySidebar, LEADER_CATEGORIES } from './LeaderCategorySidebar'
import { PERSONA_LEADER_GUIDANCE } from './leadersConstants'
import { PERSONAS } from '@/data/learningPersonas'
import { LeadersExecutivePanel } from './LeadersExecutivePanel'
import {
  FLAG_CODE_MAP,
  LEADERS_REGION_COUNTRIES,
  LEADERS_REGION_LABELS,
  leaderMatchesCategory,
} from './leadersConstants'
import { LeadersViewToggle } from './LeadersViewToggle'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileCommunityView } from '@/components/Mobile/screens/MobileCommunityView'
import type { LeadersViewMode } from './LeadersViewToggle'
import { SectorStack } from './SectorStack'
import { SortControl } from '../Library/SortControl'
import { PageHeader } from '../common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LEADERS_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { LeaderConsentModal } from './LeaderConsentModal'
import { LeaderRemovalModal } from './LeaderRemovalModal'
import { Button } from '../ui/button'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import { findLeaderByParam, leaderForwardedMessage, planLeaderDeepLink } from './leaderDeepLink'
import { readLeadersTableSort, writeLeadersTableSort } from './leadersTableSort'
import type { LeadersTableSort } from './leadersTableSort'

type FilterKey = 'region' | 'country' | 'sector' | 'category' | 'layer'

interface FilterSpec {
  defaultValue: string
  urlParam: string // '' = not URL-synced
}

const LEADER_FILTERS: Record<FilterKey, FilterSpec> = {
  region: { defaultValue: 'All', urlParam: 'region' },
  country: { defaultValue: 'All', urlParam: 'country' },
  sector: { defaultValue: 'All', urlParam: 'sector' },
  category: { defaultValue: 'All', urlParam: 'cat' },
  // Stack-view sector layer (Leader.type). Written with replace like the others;
  // unknown values render as 'All' (see activeLayer).
  layer: { defaultValue: 'All', urlParam: 'layer' },
}

const FILTER_KEYS = Object.keys(LEADER_FILTERS) as FilterKey[]
const STACK_LAYERS = new Set<string>(['Public', 'Private', 'Academic'])
type FilterValues = Record<FilterKey, string>
type SetSearchParams = ReturnType<typeof useSearchParams>[1]

function useLeaderFilters(
  searchParams: URLSearchParams,
  setSearchParams: SetSearchParams
): {
  values: FilterValues
  set: (changes: Partial<FilterValues>) => void
  reset: (opts?: { alsoDelete?: string[] }) => void
} {
  const [values, setValues] = useState<FilterValues>(
    () =>
      Object.fromEntries(
        FILTER_KEYS.map((k) => {
          const { urlParam, defaultValue } = LEADER_FILTERS[k]
          return [k, urlParam ? (searchParams.get(urlParam) ?? defaultValue) : defaultValue]
        })
      ) as FilterValues
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL→state sync is the purpose of this effect
    setValues((prev) => {
      const next = { ...prev }
      let changed = false
      for (const k of FILTER_KEYS) {
        const { urlParam, defaultValue } = LEADER_FILTERS[k]
        if (!urlParam) continue
        const urlVal = searchParams.get(urlParam) ?? defaultValue
        if (prev[k] !== urlVal) {
          next[k] = urlVal
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [searchParams])

  const set = useCallback(
    (changes: Partial<FilterValues>) => {
      setValues((prev) => ({ ...prev, ...changes }))
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes) as [FilterKey, string][]) {
            const { urlParam, defaultValue } = LEADER_FILTERS[k]
            if (!urlParam) continue
            if (v !== defaultValue) next.set(urlParam, v)
            else next.delete(urlParam)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const reset = useCallback(
    ({ alsoDelete = [] }: { alsoDelete?: string[] } = {}) => {
      setValues(
        Object.fromEntries(
          FILTER_KEYS.map((k) => [k, LEADER_FILTERS[k].defaultValue])
        ) as FilterValues
      )
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const k of FILTER_KEYS) {
            const { urlParam } = LEADER_FILTERS[k]
            if (urlParam) next.delete(urlParam)
          }
          for (const p of alsoDelete) next.delete(p)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return { values, set, reset }
}

const REGION_LABELS = LEADERS_REGION_LABELS

type LeaderSortOption = 'name' | 'country' | 'category' | 'relevance'

const LEADER_SORT_OPTIONS: { id: LeaderSortOption; label: string }[] = [
  { id: 'name', label: 'Name A-Z' },
  { id: 'country', label: 'Country' },
  { id: 'category', label: 'Category' },
]

const EXECUTIVE_SORT_OPTION: { id: LeaderSortOption; label: string } = {
  id: 'relevance',
  label: 'By relevance to you',
}

// Executive lens: rank governance-relevant categories (regulators, standards
// authors, suppliers) ahead of pure research contributors when 'relevance' is the
// chosen sort. Lower = higher. Selectable, not a float applied on top of every sort.
const EXEC_CATEGORY_PRIORITY: Record<string, number> = {
  Government: 0,
  Standards: 1,
  'Industry Vendor': 2,
  'Industry Adopter': 3,
  'Algorithm Inventor': 4,
}

export const LeadersGrid = () => {
  // Mobile UX layer (Phase 7).
  const isMobileShell = useIsMobileShell()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useLeaderFilters(searchParams, setSearchParams)
  const selectedRegion = filters.values.region
  const selectedCountry = filters.values.country
  const selectedSector = filters.values.sector
  const activeCategory = filters.values.category
  const activeLayer = STACK_LAYERS.has(filters.values.layer) ? filters.values.layer : 'All'
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [deepLinkNotice, setDeepLinkNotice] = useState<{
    kind: 'widened' | 'not-found' | 'moved'
    message: string
    undoParams?: string
  } | null>(null)
  const [scrollTarget, setScrollTarget] = useState<{ id: string; nonce: number } | null>(null)
  const [viewMode, setViewMode] = useState<LeadersViewMode>(
    () => (searchParams.get('mode') as LeadersViewMode | null) ?? 'cards'
  )
  useEffect(() => {
    if (window.innerWidth < 768 && viewMode === 'stack') {
      setViewMode('cards')
      setSearchParams((prev) => {
        prev.delete('mode')
        return prev
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const { selectedIndustries, selectedPersona, experienceLevel } = usePersonaStore()
  // Executives get "By relevance to you" (governance-relevant categories first) as
  // their default sort — but it's a selectable option like any other, not a float
  // that silently re-applies on top of whatever the user explicitly picks.
  const [sortBy, setSortBy] = useState<LeaderSortOption>(
    () =>
      (searchParams.get('sort') as LeaderSortOption | null) ??
      (selectedPersona === 'executive' ? 'relevance' : 'name')
  )
  // Default view leads with the 208 hand-curated profiles; the 124 single-sentence
  // library-authorship stubs are reachable but opt-in, so they don't dilute browsing.
  const [showAllContributors, setShowAllContributors] = useState<boolean>(
    () => searchParams.get('all') === '1'
  )
  const [expandedLeaderId, setExpandedLeaderId] = useState<string | null>(null)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const activeFilterCount =
    FILTER_KEYS.filter((k) => filters.values[k] !== LEADER_FILTERS[k].defaultValue).length +
    (searchQuery ? 1 : 0)

  // ONE navigation: filters.reset() and a second functional setSearchParams in
  // the same tick would each start from this render's URL, and the second
  // would restore the filter params the first removed.
  const handleClearAll = useCallback(() => {
    filters.reset({ alsoDelete: ['q'] })
    setSearchQuery('')
  }, [filters])

  // Sync non-filter URL params on same-route navigations (e.g. chatbot deep links).
  // Filter params (region/country/sector/cat/layer) are synced by useLeaderFilters internally.
  useEffect(() => {
    const nextQ = searchParams.get('q') ?? ''
    const nextSort =
      (searchParams.get('sort') as LeaderSortOption | null) ??
      (selectedPersona === 'executive' ? 'relevance' : 'name')
    const nextMode = (searchParams.get('mode') as LeadersViewMode | null) ?? 'cards'
    const nextShowAll = searchParams.get('all') === '1'
    const nextLeader = searchParams.get('leader')
    // ?leader=<leader_id> is the shareable "open this leader" deep link; old
    // name links still resolve (tolerantly — case, whitespace, honorifics) so
    // the matching card expands; widening/scroll is handled by the effect below.
    const nextLeaderId = nextLeader
      ? (findLeaderByParam(leadersData, nextLeader, deprecatedLeaderSuccessors)?.id ?? null)
      : null

    setSearchQuery((prev) => (prev !== nextQ ? nextQ : prev))
    setSortBy((prev) => (prev !== nextSort ? nextSort : prev))
    setViewMode((prev) => (prev !== nextMode ? nextMode : prev))
    setShowAllContributors((prev) => (prev !== nextShowAll ? nextShowAll : prev))
    setExpandedLeaderId((prev) => (prev !== nextLeaderId ? nextLeaderId : prev))
  }, [searchParams, selectedPersona])

  // ?leader=<name> deep-link resolution (deep-link remediation PR 1, 2026-09-28).
  // Runs once per arriving leader param. Resolves the name against the FULL
  // dataset, then widens only the filters that hide the person — including the
  // curated-only default (`all=1`) — in ONE replace-navigation, so the URL→state
  // sync above can't revert the reveal. (The old version flipped
  // showAllContributors as local state only; the follow-up filter navigation
  // re-synced it from a URL without `all=1`, so `?leader=Aaron%20Voisine`
  // showed nothing.) Clicks inside the page write ?leader= themselves and are
  // skipped via selfWrittenLeaderRef — the card is already on screen.
  const resolvedLeaderParamRef = useRef<string | null>(null)
  const selfWrittenLeaderRef = useRef<string | null>(null)
  useEffect(() => {
    if (isMobileShell) return // MobileCommunityView resolves ?leader= itself
    const leaderParam = searchParams.get('leader')
    if (leaderParam === resolvedLeaderParamRef.current) return
    resolvedLeaderParamRef.current = leaderParam
    if (!leaderParam) return
    if (leaderParam === selfWrittenLeaderRef.current) {
      selfWrittenLeaderRef.current = null
      return
    }
    const plan = planLeaderDeepLink(leadersData, searchParams, deprecatedLeaderSuccessors)
    if (!plan) return
    if (plan.kind === 'not-found') {
      setDeepLinkNotice({
        kind: 'not-found',
        message: `"${plan.name}" was not found in the Community list.`,
      })
      return
    }
    // Stack view only renders cards inside the selected sector layer, so open
    // the person's layer — in the SAME navigation as any widening (two
    // functional updates in one tick would each start from this render's URL).
    const needsLayer = viewMode === 'stack' && searchParams.get('layer') !== plan.leader.type
    // A link to a merged duplicate's leader_id opens the kept profile — say so.
    const forwarded = plan.forwardedFrom
      ? `${leaderForwardedMessage(plan.forwardedFrom, plan.leader)} `
      : ''
    if (plan.nextParams) {
      setDeepLinkNotice({
        kind: 'widened',
        message: `${forwarded}Filters widened to show ${plan.leader.name} (cleared ${plan.widened.join(', ')}).`,
        undoParams: searchParams.toString(),
      })
    } else if (forwarded) {
      setDeepLinkNotice({ kind: 'moved', message: forwarded.trim() })
    } else {
      setDeepLinkNotice(null)
    }
    if (plan.nextParams || needsLayer) {
      const next = plan.nextParams ?? new URLSearchParams(searchParams)
      if (needsLayer) next.set('layer', plan.leader.type)
      setSearchParams(next, { replace: true })
    }
    setScrollTarget((prev) => ({ id: plan.leader.id, nonce: (prev?.nonce ?? 0) + 1 }))
    // Deliberately keyed on the URL only: viewMode/isMobileShell are read at
    // arrival time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useScrollToDeepLinkTarget(
    scrollTarget ? `${scrollTarget.id}#${scrollTarget.nonce}` : null,
    scrollTarget ? deepLinkSelector(scrollTarget.id) : null
  )

  const handleUndoWiden = useCallback(() => {
    const undo = deepLinkNotice?.undoParams
    setDeepLinkNotice(null)
    if (undo === undefined) return
    // Restore the reader's filters; the person they hid is closed with them.
    const restored = new URLSearchParams(undo)
    restored.delete('leader')
    setSearchParams(restored, { replace: true })
  }, [deepLinkNotice, setSearchParams])

  // Region items
  const regionItems = useMemo(
    () => [
      { id: 'All', label: 'All Regions' },
      ...Object.entries(REGION_LABELS).map(([id, label]) => ({ id, label })),
    ],
    []
  )

  // Country items scoped by selected region
  const countryItems = useMemo(() => {
    const unique = new Set(leadersData.map((l) => l.country))
    let countries = Array.from(unique).sort()

    if (selectedRegion !== 'All') {
      // eslint-disable-next-line security/detect-object-injection
      const regionSet = new Set(LEADERS_REGION_COUNTRIES[selectedRegion] ?? [])
      countries = countries.filter((c) => regionSet.has(c))
    }

    return [
      { id: 'All', label: 'All Countries', icon: null },
      ...countries.map((c) => ({
        id: c,
        label: c,
        // eslint-disable-next-line security/detect-object-injection
        icon: <CountryFlag code={FLAG_CODE_MAP[c] ?? 'un'} width={20} height={12} />,
      })),
    ]
  }, [selectedRegion])

  // Sector items
  const sectorItems = useMemo(() => {
    return [
      { id: 'All', label: 'All Sectors', icon: null },
      {
        id: 'Public',
        label: 'Public',
        icon: <Building2 size={14} className="text-secondary" />,
      },
      {
        id: 'Private',
        label: 'Private',
        icon: <Briefcase size={14} className="text-primary" />,
      },
      {
        id: 'Academic',
        label: 'Academic',
        icon: <School size={14} className="text-secondary" />,
      },
    ]
  }, [])

  // Category tabs for mobile dropdown
  const categoryTabs = useMemo(() => ['All', ...LEADER_CATEGORIES], [])

  // "By relevance to you" is only offered as a sort choice for executives — it's
  // a selectable option, not a float that silently re-applies for everyone.
  const sortOptions = useMemo(
    () =>
      selectedPersona === 'executive'
        ? [EXECUTIVE_SORT_OPTION, ...LEADER_SORT_OPTIONS]
        : LEADER_SORT_OPTIONS,
    [selectedPersona]
  )

  // Curated (hand-written) vs. auto-imported (single-sentence library-authorship
  // stub) profiles. Curated leads by default; the toggle below reveals the rest.
  const curatedCount = useMemo(
    () => leadersData.filter((l) => l.sourceKind === 'curated').length,
    []
  )
  const tierScopedLeaders = useMemo(
    () =>
      showAllContributors ? leadersData : leadersData.filter((l) => l.sourceKind === 'curated'),
    [showAllContributors]
  )

  // Category info for the sidebar pills — scoped to the current curated/all tier
  // so counts always match what's actually browsable.
  const categoryInfo = useMemo(() => {
    return LEADER_CATEGORIES.map((name) => {
      const items = tierScopedLeaders.filter((l) => leaderMatchesCategory(l, name))
      return {
        name,
        count: items.length,
        hasUpdates: items.some((l) => l.status === 'New' || l.status === 'Updated'),
      }
    })
  }, [tierScopedLeaders])

  const totalHasUpdates = tierScopedLeaders.some(
    (l) => l.status === 'New' || l.status === 'Updated'
  )

  // Phase 3 — semantic supplement. Queries like "academic lattice
  // researchers" or "EU regulatory leaders" surface relevant profiles
  // without requiring exact name/org keywords.
  const semantic = useSemanticSearch('leaders', searchQuery, { limit: 30 })
  const semanticNameSet = useMemo(
    () =>
      semantic.mode === 'semantic' ? new Set(semantic.hits.map((h) => h.id.toLowerCase())) : null,
    [semantic.mode, semantic.hits]
  )

  // Filter leaders
  const filteredLeaders = useMemo(() => {
    let result = tierScopedLeaders

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter((l) => leaderMatchesCategory(l, activeCategory))
    }

    // Country / Region filter
    if (selectedCountry !== 'All') {
      result = result.filter((l) => l.country === selectedCountry)
    } else if (selectedRegion !== 'All') {
      // eslint-disable-next-line security/detect-object-injection
      const regionSet = new Set(LEADERS_REGION_COUNTRIES[selectedRegion] ?? [])
      result = result.filter((l) => regionSet.has(l.country))
    }

    // Sector filter
    if (selectedSector !== 'All') {
      result = result.filter((l) => l.type === selectedSector)
    }

    // Search filter — lexical floor + semantic supplement.
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((l) => {
        const lexicalMatch =
          l.name.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.organizations.some((o) => o.toLowerCase().includes(q)) ||
          l.bio.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
        if (lexicalMatch) return true
        // Leaders chunkToResource maps to chunk.title (the leader's name).
        if (semanticNameSet && semanticNameSet.has(l.name.toLowerCase())) return true
        return false
      })
    }

    return result
  }, [
    tierScopedLeaders,
    selectedRegion,
    selectedCountry,
    selectedSector,
    activeCategory,
    searchQuery,
    semanticNameSet,
  ])

  // Industry relevance — leaders whose bio/organizations match selected industries
  const industryRelevant = useMemo(() => {
    const relevant = new Set<string>()
    if (selectedIndustries.length === 0) return relevant
    const keywords = selectedIndustries.map((ind) => ind.toLowerCase().split(/\s*[&/]\s*/)).flat()
    for (const leader of leadersData) {
      const text =
        `${leader.bio} ${leader.organizations.join(' ')} ${leader.category}`.toLowerCase()
      if (keywords.some((kw) => text.includes(kw))) {
        relevant.add(leader.id)
      }
    }
    return relevant
  }, [selectedIndustries])

  // Sort for card view
  const sortedLeaders = useMemo(() => {
    const items = [...filteredLeaders]
    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'country':
        items.sort((a, b) => a.country.localeCompare(b.country))
        break
      case 'category':
        items.sort((a, b) => a.category.localeCompare(b.category))
        break
      case 'relevance': {
        // Executive-only sort option: governance-relevant categories first, then
        // name within each category. Only applies when explicitly chosen — it no
        // longer re-runs on top of every other sort choice.
        const rank = (c: string) =>
          // eslint-disable-next-line security/detect-object-injection -- c is a leader category string
          EXEC_CATEGORY_PRIORITY[c] ?? 99
        items.sort((a, b) => rank(a.category) - rank(b.category) || a.name.localeCompare(b.name))
        break
      }
    }
    // Stable secondary sort: industry-relevant leaders float to top
    if (industryRelevant.size > 0) {
      items.sort((a, b) => {
        const aR = industryRelevant.has(a.id) ? 0 : 1
        const bR = industryRelevant.has(b.id) ? 0 : 1
        return aR - bR
      })
    }
    return items
  }, [filteredLeaders, sortBy, industryRelevant])

  // Table-view column sort lives in the URL: ?sort when it matches a card sort
  // (name / country ascending), otherwise ?tsort (+ tdir) — see leadersTableSort.
  const tableSort = useMemo(() => readLeadersTableSort(searchParams), [searchParams])
  const handleTableSortChange = useCallback(
    (next: LeadersTableSort) => {
      setSearchParams((prev) => writeLeadersTableSort(prev, next), { replace: true })
      logEvent('Leaders', 'Table Sort', `${next.key}:${next.dir}`)
    },
    [setSearchParams]
  )

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(sortedLeaders, LEADERS_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-leaders'))
  }, [sortedLeaders])

  const handleToggleShowAllContributors = useCallback(() => {
    const next = !showAllContributors
    setShowAllContributors(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next) params.set('all', '1')
        else params.delete('all')
        return params
      },
      { replace: true }
    )
    logEvent('Leaders', 'Toggle Show All Contributors', next ? 'all' : 'curated')
  }, [showAllContributors, setSearchParams])

  const handleCategorySelect = (category: string) => {
    filters.set({ category })
    logEvent('Leaders', 'Filter Category', category)
  }

  // Writing ?leader=<leader_id> makes the open card a shareable/bookmarkable
  // deep link (the stable id, not the editable display name). Opening pushes a history entry (so Back closes it); closing strips the
  // param in place. The URL→state effect above reconciles expandedLeaderId.
  const writeLeaderParam = useCallback(
    (leaderId: string | null, { push }: { push: boolean }) => {
      setSearchParams(
        (sp) => {
          const params = new URLSearchParams(sp)
          if (leaderId) {
            selfWrittenLeaderRef.current = leaderId
            params.set('leader', leaderId)
          } else params.delete('leader')
          return params
        },
        { replace: !push }
      )
    },
    [setSearchParams]
  )

  const toggleDetail = (leader: Leader) => {
    const next = expandedLeaderId === leader.id ? null : leader.id
    setExpandedLeaderId(next)
    logEvent('Leaders', next ? 'Card Open' : 'Card Close', personaLabel(leader.id))
    writeLeaderParam(next ? leader.leaderId : null, { push: Boolean(next) })
  }
  const closeDetail = () => {
    setExpandedLeaderId(null)
    writeLeaderParam(null, { push: false })
  }

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/export/endorse/flag render there now, not as
  // a row on the page itself. Mirrors TimelineView.tsx's pattern.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'Community',
      dataSource: leadersMetadata
        ? `${leadersMetadata.filename} • Updated: ${leadersMetadata.lastUpdate.toLocaleDateString()}`
        : undefined,
      onExport: handleExportCsv,
      endorseUrl: buildEndorsementUrl({
        category: 'leader-endorsement',
        title: 'Endorse: PQC Community',
        resourceType: 'Leaders Page',
        resourceId: 'PQC Community',
        resourceDetails:
          '**Page:** PQC Community — People contributing to the advances of post-quantum cryptography.',
        pageUrl: '/leaders',
      }),
      endorseLabel: 'Community Page',
      endorseResourceType: 'Community',
      flagUrl: buildFlagUrl({
        category: 'leader-endorsement',
        title: 'Flag: PQC Community',
        resourceType: 'Leaders Page',
        resourceId: 'PQC Community',
        resourceDetails:
          '**Page:** PQC Community — People contributing to the advances of post-quantum cryptography.',
        pageUrl: '/leaders',
      }),
      flagLabel: 'Community Page',
      flagResourceType: 'Community',
    })
    return () => clearPageActions()
  }, [handleExportCsv])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). LeadersGrid is never
  // embedded in the simulation (no widget imports it), so unlike Threats/
  // Library this needs no simEmbed-equivalent guard.
  if (isMobileShell) {
    return <MobileCommunityView />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Community"
        description="People contributing to the advances of post-quantum cryptography."
      />

      <PersonaPageNote route="/leaders" />

      {/* Executive overview — institutional influence + why each group matters.
          Exec only; other roles see the directory unchanged. */}
      {selectedPersona === 'executive' && <LeadersExecutivePanel leaders={leadersData} />}

      {/* B+ remediation 4.1 (2026-08-10): "who to follow and why", per role.
          The grid was byte-identical for every role that could see it and
          listed people without saying why any of them should matter to the
          reader. Each button applies the category filter this page already
          has, so the guidance is also the shortest route to acting on it —
          the directory becomes a reading list rather than a phone book. */}
      {selectedPersona && (PERSONA_LEADER_GUIDANCE[selectedPersona]?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Where to start as {PERSONAS[selectedPersona].label}
          </p>
          <ul className="space-y-2">
            {PERSONA_LEADER_GUIDANCE[selectedPersona].map((g) => (
              <li key={g.category} className="text-sm leading-snug">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleCategorySelect(g.category)}
                  className="h-auto p-0 text-sm font-semibold text-primary"
                >
                  {g.category}
                </Button>
                <span className="text-muted-foreground"> — {g.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Curious user intro context */}
      {(selectedPersona === 'curious' || experienceLevel === 'curious') && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-secondary/20 bg-secondary/5 text-sm">
          <Info size={16} className="text-secondary mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">Who are these people?</span>
            <p className="text-muted-foreground text-xs">
              These are the researchers, engineers, and policymakers contributing to the advances of
              post-quantum cryptography — authoring algorithms and standards, shipping
              implementations, and shaping government policy. Use the filters above to explore by
              region, sector, or category.
            </p>
          </div>
        </div>
      )}

      {/* Leader consent / removal CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setIsConsentModalOpen(true)
            logEvent('Leaders', 'Open Consent Modal')
          }}
          className="gap-2 text-sm"
        >
          <Award size={16} className="text-primary" />I consent to be listed in the PQC Community
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setIsRemovalModalOpen(true)
            logEvent('Leaders', 'Open Removal Modal')
          }}
          className="gap-2 text-sm text-muted-foreground"
        >
          <ShieldX size={16} />
          Request removal
        </Button>
      </div>

      {/* Category pill tabs (desktop) */}
      <LeaderCategorySidebar
        categories={categoryInfo}
        active={activeCategory}
        onSelect={handleCategorySelect}
        totalCount={tierScopedLeaders.length}
        totalHasUpdates={totalHasUpdates}
      />

      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col md:flex-row items-center gap-3">
        {/* Mobile: Category dropdown (hidden on lg where pills show) */}
        <div className="flex items-center gap-2 w-full lg:hidden text-xs">
          <div className="flex-1 min-w-[150px]">
            <FilterDropdown
              items={categoryTabs}
              selectedId={activeCategory}
              onSelect={handleCategorySelect}
              defaultLabel="Category"
              noContainer
              opaque
              className="mb-0 w-full"
            />
          </div>
        </div>

        {/* Sector + Region + Country + Search + Sort + ViewToggle */}
        <div className="flex flex-wrap items-center gap-2 w-full text-xs">
          <div className="min-w-[100px]">
            <FilterDropdown
              items={sectorItems}
              selectedId={selectedSector}
              onSelect={(id) => {
                filters.set({ sector: id })
                logEvent('Leaders', 'Filter Sector', id)
              }}
              defaultLabel="Sector"
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>

          <div className="min-w-[100px]">
            <FilterDropdown
              items={regionItems}
              selectedId={selectedRegion}
              onSelect={(id) => {
                filters.set({ region: id, country: 'All' })
                logEvent('Leaders', 'Filter Region', id)
              }}
              defaultLabel="Region"
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>

          <div className="min-w-[100px]">
            <FilterDropdown
              items={countryItems}
              selectedId={selectedCountry}
              onSelect={(id) => {
                filters.set({ country: id })
                logEvent('Leaders', 'Filter Country', id)
              }}
              defaultLabel="Country"
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor="leader-search" className="sr-only">
              Search community by name or title
            </label>
            <input
              id="leader-search"
              type="text"
              placeholder="Search community..."
              value={searchQuery}
              onChange={(e) => {
                const q = e.target.value
                setSearchQuery(q)
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    if (q) next.set('q', q)
                    else next.delete('q')
                    return next
                  },
                  { replace: true }
                )
                if (q.length > 2) logEvent('Leaders', 'Search', q)
              }}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {viewMode === 'cards' && (
            <SortControl
              value={sortBy}
              onChange={(s) => {
                setSortBy(s)
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    if (s !== 'name') next.set('sort', s)
                    else next.delete('sort')
                    return next
                  },
                  { replace: true }
                )
              }}
              options={sortOptions}
            />
          )}

          <div className="hidden md:block">
            <LeadersViewToggle
              mode={viewMode}
              onChange={(mode) => {
                setViewMode(mode)
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    if (mode !== 'cards') next.set('mode', mode)
                    else next.delete('mode')
                    // ?layer only means something in stack view.
                    if (mode !== 'stack') next.delete('layer')
                    return next
                  },
                  { replace: true }
                )
              }}
            />
          </div>
        </div>
      </div>

      {/* Results count + active filter badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {filteredLeaders.length} {filteredLeaders.length === 1 ? 'person' : 'people'}
          {activeCategory !== 'All' && ` in ${activeCategory}`}
        </p>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
            {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
          </span>
        )}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X size={12} /> Clear all
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleShowAllContributors}
          className="ml-auto h-auto py-1 px-2.5 text-xs gap-1.5"
          aria-pressed={showAllContributors}
        >
          <BookOpen size={12} aria-hidden="true" />
          {showAllContributors
            ? `Curated profiles only (${curatedCount})`
            : `Show all contributors (${leadersData.length})`}
        </Button>
      </div>
      {!showAllContributors && (
        <p className="text-[11px] text-muted-foreground -mt-4">
          Showing {curatedCount} hand-curated profiles. {leadersData.length - curatedCount} more
          people are listed as document contributors —{' '}
          <Button
            variant="ghost"
            onClick={handleToggleShowAllContributors}
            className="h-auto p-0 inline text-[11px] underline hover:text-foreground text-muted-foreground"
          >
            show all
          </Button>
          .
        </p>
      )}

      {deepLinkNotice && (
        <DeepLinkNotice
          kind={deepLinkNotice.kind}
          message={deepLinkNotice.message}
          onUndo={deepLinkNotice.undoParams !== undefined ? handleUndoWiden : undefined}
          onDismiss={() => setDeepLinkNotice(null)}
        />
      )}

      {/* Empty state */}
      {filteredLeaders.length === 0 && (
        <EmptyState
          icon={<Users size={32} />}
          title="No people found"
          description="Try adjusting the category, sector, region, country, or search query."
        />
      )}

      {/* Content area */}
      {filteredLeaders.length > 0 && viewMode === 'stack' ? (
        <div className="mb-8 hidden md:block">
          <SectorStack
            activeLayer={activeLayer}
            onSelectLayer={(l) => filters.set({ layer: l })}
            items={filteredLeaders}
            expandedContent={
              <div className="p-4 md:p-6 bg-background rounded-lg border border-border mt-4">
                <div
                  ref={gridRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {sortedLeaders
                    .filter((l) => l.type === activeLayer || activeLayer === 'All')
                    .map((leader) => (
                      <div
                        key={leader.id}
                        data-deeplink-id={leader.id}
                        className="rounded-xl transition-shadow"
                      >
                        <LeaderCard
                          leader={leader}
                          onClick={() => toggleDetail(leader)}
                          isIndustryMatch={industryRelevant.has(leader.id)}
                          isExpanded={expandedLeaderId === leader.id}
                          onCloseExpanded={closeDetail}
                        />
                      </div>
                    ))}
                </div>
              </div>
            }
          />
        </div>
      ) : filteredLeaders.length > 0 && viewMode === 'cards' ? (
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {sortedLeaders.map((leader) => (
            <div
              key={leader.id}
              data-deeplink-id={leader.id}
              className="rounded-xl transition-shadow"
            >
              <LeaderCard
                leader={leader}
                onClick={() => toggleDetail(leader)}
                isIndustryMatch={industryRelevant.has(leader.id)}
                isExpanded={expandedLeaderId === leader.id}
                onCloseExpanded={closeDetail}
              />
            </div>
          ))}
        </div>
      ) : filteredLeaders.length > 0 ? (
        <>
          <div className="hidden md:block">
            <LeadersTable
              data={filteredLeaders}
              expandedLeaderId={expandedLeaderId}
              onToggleDetails={toggleDetail}
              onCloseDetails={closeDetail}
              sort={tableSort}
              onSortChange={handleTableSortChange}
            />
          </div>
          {/* Mobile fallback to cards */}
          <div ref={gridRef} className="md:hidden grid grid-cols-1 gap-4">
            {sortedLeaders.map((leader) => (
              <div
                key={leader.id}
                data-deeplink-id={leader.id}
                className="rounded-xl transition-shadow"
              >
                <LeaderCard
                  leader={leader}
                  onClick={() => toggleDetail(leader)}
                  isIndustryMatch={industryRelevant.has(leader.id)}
                  isExpanded={expandedLeaderId === leader.id}
                  onCloseExpanded={closeDetail}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Leader Consent Modal */}
      <LeaderConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
      />

      {/* Leader Removal Modal */}
      <LeaderRemovalModal
        isOpen={isRemovalModalOpen}
        onClose={() => setIsRemovalModalOpen(false)}
      />
    </div>
  )
}
