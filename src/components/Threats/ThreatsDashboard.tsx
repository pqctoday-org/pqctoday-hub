// SPDX-License-Identifier: GPL-3.0-only
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  AlertTriangle,
  Info,
  Network,
  AlertOctagon,
  AlertCircle,
  CheckCircle,
  Filter,
  Briefcase,
  BookmarkCheck,
  ShieldHalf,
  FileSignature,
  ShieldAlert,
  Clock,
  List,
  ChevronDown,
} from 'lucide-react'
import { useSearchParams } from 'react-router'
import { evidenceStrength, threatsData, threatsMetadata } from '../../data/threatsData'
import type { ThreatItem } from '../../data/threatsData'
import { AnimatePresence } from 'framer-motion'
import { FilterDropdown } from '../common/FilterDropdown'
import { useTrustTierFilter, matchesTrustTierFilter } from '../common/TrustTierFilter'
import { logEvent, personaLabel } from '../../utils/analytics'
import { usePersonaStore } from '../../store/usePersonaStore'
import type { PersonaId } from '../../data/learningPersonas'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import {
  INDUSTRY_TO_THREATS_MAP,
  PERSONA_THREATS_DEFAULT_INDUSTRIES,
} from '../../data/personaConfig'
import { PersonaDefaultsBanner } from '../common/PersonaDefaultsBanner'
import { PersonaSwitchModal } from '../Persona/PersonaSwitchModal'
import { usePersonaDefaults } from '@/hooks/usePersonaDefaults'
import clsx from 'clsx'
import { PageHeader } from '../common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { Button } from '../ui/button'
import { CollapsibleSection } from '../ui/CollapsibleSection'

// B+ remediation 4.3 (2026-08-10): 'evidence' added. "The researcher corpus
// sorts by recency rather than evidence strength" — and every field the sort
// needs was already on the row (confidenceScore on 114/114, peerReviewed on
// 114/114, a trusted-source id on 107/114, accuracyPct on 93/114). This is a
// new ORDERING over existing data, not new data.
type SortField = 'industry' | 'threatId' | 'criticality' | 'evidence'
type SortDirection = 'asc' | 'desc'

const PERSONA_SHORT_LABELS: Record<PersonaId, string> = {
  executive: 'Executive',
  developer: 'Developer',
  architect: 'Architect',
  ops: 'IT Ops',
  researcher: 'Researcher',
  curious: 'Curious',
}

import { getIndustryIcon } from './threatsHelper'
import { ThreatsViewToggle, type ThreatsViewMode } from './ThreatsViewToggle'
import { LeftNavTOC } from '@/components/common/LeftNavTOC'
import { ThreatsCardGrid } from './ThreatsCardGrid'
import { ThreatsTable } from './ThreatsTable'

// Lazy: keeps the implementation-attack data the dialog pulls in out of the
// Threats route chunk until a user opens a threat detail.
const ThreatDetailDialog = lazy(() =>
  import('./ThreatDetailDialog').then((m) => ({ default: m.ThreatDetailDialog }))
)
import { ThreatEconomicsHeader } from './ThreatEconomicsHeader'
import { CrqcCapabilityStrip } from './CrqcCapabilityStrip'
import { CrqcTrajectoryChart } from './CrqcTrajectoryChart'
import { SectorExposureHero } from './SectorExposureHero'
import { THREAT_CLASS_DEFS, threatMatchesClass, type ThreatClass } from './threatClassification'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileThreatsView } from '@/components/Mobile/screens/MobileThreatsView'
import {
  LENS_PROTOCOLS,
  protocolsForThreat,
  threatTouchesProtocol,
} from '../../data/threatProtocolLens'

// Threat Detail Dialog Component - Moved outside to ./ThreatDetailDialog.tsx

type ThreatsTab = 'list' | 'horizon'

export const ThreatsDashboard: React.FC<{
  simEmbed?: boolean
  /** Which tab to open on mount. The real page also seeds this from ?view=. */
  initialTab?: ThreatsTab
}> = ({ simEmbed = false, initialTab = 'list' }) => {
  // Mobile UX layer (Phase 7). `!simEmbed` matters here specifically —
  // ThreatsEmbed.tsx renders this same component inside the simulation at
  // whatever viewport the player is on, and O-3 (IMPLEMENTATION-PLAN.md)
  // keeps /simulation entirely outside the mobile shell (its own separate
  // phone handling). Without this guard a narrow-viewport sim player would
  // get the distilled mobile screen instead of the sim-embedded dashboard,
  // which has no simEmbed support of its own.
  const isMobileShell = useIsMobileShell() && !simEmbed
  // When embedded in the sim, the dashboard must NOT read/write the page URL (it
  // would corrupt /simulation's route) and can't nest its own <Router>. So its
  // filter URL state is backed by local state, kept API-compatible with
  // useSearchParams. (Same pattern as MigrateView / LibraryView.)
  const [realSearchParams, realSetSearchParams] = useSearchParams()
  const [embedSearchParams, setEmbedSearchParamsState] = useState(() => new URLSearchParams())
  const searchParams = simEmbed ? embedSearchParams : realSearchParams
  const setSearchParams: typeof realSetSearchParams = simEmbed
    ? (nextInit) =>
        setEmbedSearchParamsState((prev) => {
          const next = new URLSearchParams(
            typeof nextInit === 'function'
              ? (nextInit(prev) as URLSearchParams)
              : (nextInit as URLSearchParams)
          )
          return next.toString() === prev.toString() ? prev : next
        })
    : realSetSearchParams
  // The Threat Catalog and the CRQC Threat Horizon used to be two separate tabs;
  // they're now one continuous page (the horizon content — the deadline math —
  // is the single most decision-forcing thing here, so it shouldn't require a
  // click to discover). `initialTab` is kept only so existing embed call sites
  // (ThreatsEmbed / SimulationView's CRQC-horizon step) can still ask the page
  // to open scrolled to the Horizon section instead of at the top.
  useEffect(() => {
    if (initialTab !== 'horizon') return
    document.getElementById('crqc-threat-horizon')?.scrollIntoView({ block: 'start' })
    // Intentionally runs once on mount only — this is an initial scroll position,
    // not a state to keep syncing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { selectedIndustries: storeIndustries, selectedPersona } = usePersonaStore()

  const initialIndustries = useMemo(() => {
    const param = searchParams.get('industry')
    // URL param takes precedence — supports comma-separated multi-industry
    if (param) {
      return param.split(',').flatMap((p) => {
        const match = threatsData.find((d) => d.industry.toLowerCase() === p.trim().toLowerCase())
        return match ? [match.industry] : []
      })
    }
    // Map all home-page selected industries through the threats name mapping
    return (
      storeIndustries
        // eslint-disable-next-line security/detect-object-injection
        .flatMap((ind) => INDUSTRY_TO_THREATS_MAP[ind] ?? [])
        .filter((mapped) => threatsData.some((d) => d.industry === mapped))
    )
  }, [searchParams, storeIndustries])

  const { myThreats, showOnlyThreats, setShowOnlyThreats } = useBookmarkStore()

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(initialIndustries)
  const [selectedCriticality, setSelectedCriticality] = useState<string>(
    () => searchParams.get('criticality') ?? 'All'
  )
  const [selectedClass, setSelectedClass] = useState<string>(
    () => searchParams.get('class') ?? 'All'
  )
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [sortField, setSortField] = useState<SortField>(
    () => (searchParams.get('sort') as SortField | null) ?? 'industry'
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => (searchParams.get('dir') as SortDirection | null) ?? 'asc'
  )
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      return threatsData.find((t) => t.threatId === idParam) ?? null
    }
    return null
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [personaModalOpen, setPersonaModalOpen] = useState(false)
  const tierFilter = useTrustTierFilter()
  const [viewMode, setViewMode] = useState<ThreatsViewMode>(() => {
    const param = searchParams.get('mode')
    // A bookmarked/shared `?mode=stack` link (the removed Industry Stack view)
    // falls back to Table rather than rendering nothing.
    return param === 'cards' || param === 'table' ? param : 'table'
  })
  const [activeNavIndustry, setActiveNavIndustry] = useState<string | null>(null)
  // Below `lg` the Industries TOC stacks full-width above the content instead
  // of sitting in the sticky side rail, so it collapses behind a toggle there
  // (mirrors the `showMobileFilters` disclosure above); `lg:block` keeps it
  // always-visible at `lg+` regardless of this state, matching prior desktop
  // behavior exactly.
  const [tocMobileOpen, setTocMobileOpen] = useState(false)
  // CRQC Threat Horizon detail toggle (2026-pages Phase 7 item 2): the headline
  // Z-estimate stays always-visible, but the per-source estimate list, the
  // hardware-trajectory chart, and the technology-track breakdown all sit
  // behind this single "Full detail" collapse instead of loading open.
  const [detailOpen, setDetailOpen] = useState(false)

  // Sync all filter params on same-route navigations (e.g. chatbot deep links).
  // Functional setters prevent infinite loops when syncFiltersToUrl triggers a searchParams update.
  useEffect(() => {
    const indParam = searchParams.get('industry')
    const idParam = searchParams.get('id')
    const nextCrit = searchParams.get('criticality') ?? 'All'
    const nextClass = searchParams.get('class') ?? 'All'
    const nextQ = searchParams.get('q') ?? ''
    const nextSort = (searchParams.get('sort') as SortField | null) ?? 'industry'
    const nextDir = (searchParams.get('dir') as SortDirection | null) ?? 'asc'
    const modeParam = searchParams.get('mode')
    const nextMode: ThreatsViewMode =
      modeParam === 'cards' || modeParam === 'table' ? modeParam : 'table'

    if (indParam) {
      const matches = indParam.split(',').flatMap((p) => {
        const m = threatsData.find((d) => d.industry.toLowerCase() === p.trim().toLowerCase())
        return m ? [m.industry] : []
      })
      if (matches.length > 0)
        setSelectedIndustries((prev) =>
          JSON.stringify(prev) !== JSON.stringify(matches) ? matches : prev
        )
    }
    if (idParam) {
      const found = threatsData.find((t) => t.threatId === idParam)
      if (found) setSelectedThreat(found)
    }
    setSelectedCriticality((prev) => (prev !== nextCrit ? nextCrit : prev))
    setSelectedClass((prev) => (prev !== nextClass ? nextClass : prev))
    setSearchQuery((prev) => (prev !== nextQ ? nextQ : prev))
    setSortField((prev) => (prev !== nextSort ? nextSort : prev))
    setSortDirection((prev) => (prev !== nextDir ? nextDir : prev))
    setViewMode((prev) => (prev !== nextMode ? nextMode : prev))
  }, [searchParams])

  /** Write all current filter state back to URL. Call with overrides for the value that just
   *  changed so the URL reflects it immediately. Uses replace:true to avoid history spam. */
  const syncFiltersToUrl = useCallback(
    (overrides: {
      industry?: string[]
      criticality?: string
      threatClass?: string
      q?: string
      sort?: SortField
      dir?: SortDirection
      id?: string | null
      mode?: ThreatsViewMode
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const inds = overrides.industry ?? selectedIndustries
          const crit = overrides.criticality ?? selectedCriticality
          const cls = overrides.threatClass ?? selectedClass
          const q = overrides.q ?? searchQuery
          const sort = overrides.sort ?? sortField
          const dir = overrides.dir ?? sortDirection
          const id = overrides.id !== undefined ? overrides.id : (selectedThreat?.threatId ?? null)
          const mode = overrides.mode ?? viewMode

          if (inds.length > 0) next.set('industry', inds.join(','))
          else next.delete('industry')
          if (crit !== 'All') next.set('criticality', crit)
          else next.delete('criticality')
          if (cls !== 'All') next.set('class', cls)
          else next.delete('class')
          if (q) next.set('q', q)
          else next.delete('q')
          if (sort !== 'industry') next.set('sort', sort)
          else next.delete('sort')
          if (dir !== 'asc') next.set('dir', dir)
          else next.delete('dir')
          if (id) next.set('id', id)
          else next.delete('id')
          if (mode !== 'table') next.set('mode', mode)
          else next.delete('mode')
          return next
        },
        { replace: true }
      )
    },
    [
      selectedIndustries,
      selectedCriticality,
      selectedClass,
      searchQuery,
      sortField,
      sortDirection,
      selectedThreat,
      viewMode,
      setSearchParams,
    ]
  )

  // Extract unique industries for filter
  const industryItems = useMemo(() => {
    const unique = new Set(threatsData.map((d) => d.industry))
    return Array.from(unique)
      .sort()
      .map((ind) => {
        return { id: ind, label: ind, icon: getIndustryIcon(ind, 16) }
      })
  }, [])

  // Criticality items
  const criticalityItems = useMemo(() => {
    return [
      { id: 'All', label: 'All Levels', icon: null },
      {
        id: 'Critical',
        label: 'Critical',
        icon: <AlertOctagon size={16} className="text-status-error" />,
      },
      {
        id: 'High',
        label: 'High',
        icon: <AlertTriangle size={16} className="text-status-error" />,
      },
      {
        id: 'Medium-High',
        label: 'Medium-High',
        icon: <AlertCircle size={16} className="text-status-warning" />,
      },
      { id: 'Medium', label: 'Medium', icon: <Info size={16} className="text-primary" /> },
      { id: 'Low', label: 'Low', icon: <CheckCircle size={16} className="text-status-success" /> },
    ]
  }, [])

  // Threat-class items (HNDL decrypt-later vs HNFL/TNFL forge-later) — Threats #2
  const threatClassItems = useMemo(() => {
    return [
      { id: 'All', label: 'All Classes', icon: null },
      {
        id: 'hndl',
        label: THREAT_CLASS_DEFS.hndl.label,
        icon: <ShieldHalf size={16} className="text-secondary" />,
      },
      {
        id: 'hnfl',
        label: THREAT_CLASS_DEFS.hnfl.label,
        icon: <FileSignature size={16} className="text-status-warning" />,
      },
    ]
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      const newDir: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDir)
      syncFiltersToUrl({ dir: newDir })
    } else {
      setSortField(field)
      setSortDirection('asc')
      syncFiltersToUrl({ sort: field, dir: 'asc' })
    }
  }

  // Phase 3 — semantic supplement. Queries like "email tampering risk"
  // surface relevant threats regardless of source vocabulary.
  const semantic = useSemanticSearch('threats', searchQuery, { limit: 30 })
  const semanticIdSet = useMemo(
    () =>
      semantic.mode === 'semantic' ? new Set(semantic.hits.map((h) => h.id.toLowerCase())) : null,
    [semantic.mode, semantic.hits]
  )

  // Persona-aware default industries — applies when the user has a persona
  // set but no explicit industry picked, and hasn't opted out via ?prefs=off.
  // The persona's PERSONA_THREATS_DEFAULT_INDUSTRIES list (e.g. executive →
  // ['Finance & Banking', 'Government & Defense']) is mapped through
  // INDUSTRY_TO_THREATS_MAP to threat-industry strings, which then act as
  // a filter on the threats corpus. Researcher + curious have empty default
  // sets → no narrowing.
  // B+ remediation 4.3 (2026-08-10): the developer protocol lens. Null = off.
  const [protocolLens, setProtocolLens] = useState<string | null>(null)

  /**
   * How the active lens's matches were arrived at. Shown as a count rather than
   * a per-row badge because the mix is what a reader needs in order to judge
   * the list: "9 of these say TLS themselves, 14 are inferred from RSA" is a
   * different list from "23 threats to your TLS", and only one of those is true.
   */
  const lensBasisSplit = useMemo(() => {
    if (!protocolLens) return null
    let stated = 0
    let inferred = 0
    for (const t of threatsData) {
      const hit = protocolsForThreat(t).find((m) => m.protocol === protocolLens)
      if (!hit) continue
      if (hit.basis === 'stated') stated += 1
      else inferred += 1
    }
    return { stated, inferred }
  }, [protocolLens])

  const personaDefaults = usePersonaDefaults()
  const personaDefaultThreatIndustries = useMemo<string[]>(() => {
    if (personaDefaults.prefsOff) return []
    if (!selectedPersona) return []
    if (selectedIndustries.length > 0) return []
    if (storeIndustries.length > 0) return []
    const personaIndustryKeys = PERSONA_THREATS_DEFAULT_INDUSTRIES[selectedPersona] ?? [] // eslint-disable-line security/detect-object-injection
    return personaIndustryKeys
      .flatMap((key) => INDUSTRY_TO_THREATS_MAP[key] ?? []) // eslint-disable-line security/detect-object-injection
      .filter((ind) => threatsData.some((d) => d.industry === ind))
  }, [selectedPersona, selectedIndustries, storeIndustries, personaDefaults.prefsOff])
  const personaDefaultActive = personaDefaultThreatIndustries.length > 0

  const filteredAndSortedData = useMemo(() => {
    let data = [...threatsData]

    // Filter by Industry (multi-select: empty = all)
    if (selectedIndustries.length > 0) {
      data = data.filter((item) => selectedIndustries.includes(item.industry))
    } else if (personaDefaultActive) {
      // Persona-default narrowing — applies only when no explicit industry is
      // picked (above branch) and the user hasn't opted out via ?prefs=off.
      data = data.filter((item) => personaDefaultThreatIndustries.includes(item.industry))
    }

    // Protocol lens (developer) — applied like any other filter so the count
    // the page reports stays true.
    if (protocolLens) {
      data = data.filter((item) => threatTouchesProtocol(item, protocolLens))
    }

    // Filter by Criticality
    if (selectedCriticality !== 'All') {
      data = data.filter((item) => item.criticality === selectedCriticality)
    }

    // Filter by Threat Class (HNDL / HNFL-TNFL) — derived dimension, Threats #2
    if (selectedClass !== 'All') {
      data = data.filter((item) => threatMatchesClass(item, selectedClass as ThreatClass))
    }

    // Filter by Search Query — lexical floor + semantic supplement
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter((item) => {
        const lexicalMatch =
          item.threatId.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.industry.toLowerCase().includes(query) ||
          item.cryptoAtRisk.toLowerCase().includes(query) ||
          item.pqcReplacement.toLowerCase().includes(query)
        if (lexicalMatch) return true
        if (semanticIdSet && semanticIdSet.has(item.threatId.toLowerCase())) return true
        return false
      })
    }

    // Sort
    data.sort((a, b) => {
      // Helper for criticality value
      const criticalityOrder: Record<string, number> = {
        Critical: 3,
        High: 2,
        'Medium-High': 1.5,
        Medium: 1,
        Low: 0,
      }
      // eslint-disable-next-line security/detect-object-injection
      const getCriticalityVal = (c: string) => criticalityOrder[c] ?? 0

      if (sortField === 'industry') {
        if (a.industry !== b.industry) {
          return sortDirection === 'asc'
            ? a.industry.localeCompare(b.industry)
            : b.industry.localeCompare(a.industry)
        }
        // Secondary Sort: Criticality (Highest First -> Descending)
        return getCriticalityVal(b.criticality) - getCriticalityVal(a.criticality)
      }

      let valA: string | number = ''
      let valB: string | number = ''

      if (sortField === 'threatId') {
        valA = a.threatId
        valB = b.threatId
      } else if (sortField === 'criticality') {
        valA = getCriticalityVal(a.criticality)
        valB = getCriticalityVal(b.criticality)
      } else if (sortField === 'evidence') {
        valA = evidenceStrength(a)
        valB = evidenceStrength(b)
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    // My Threats filter
    if (showOnlyThreats) {
      data = data.filter((item) => myThreats.includes(item.threatId))
    }

    // Trust tier filter (multi-select, URL param: tier)
    if (tierFilter.length > 0) {
      data = data.filter((item) => matchesTrustTierFilter(tierFilter, 'threats', item.threatId))
    }

    return data
  }, [
    selectedIndustries,
    selectedCriticality,
    selectedClass,
    searchQuery,
    semanticIdSet,
    sortField,
    sortDirection,
    showOnlyThreats,
    myThreats,
    tierFilter,
    personaDefaultActive,
    personaDefaultThreatIndustries,
    protocolLens,
  ])

  // When a persona is set but no explicit industry filter is active, compute the persona's
  // relevant industries to drive card dimming — irrelevant threats remain visible but faded.
  const personaRelevantIndustries = useMemo<Set<string> | undefined>(() => {
    if (!selectedPersona || selectedIndustries.length > 0 || storeIndustries.length === 0)
      return undefined
    const mapped = storeIndustries
      .flatMap((ind) => INDUSTRY_TO_THREATS_MAP[ind] ?? []) // eslint-disable-line security/detect-object-injection
      .filter((ind) => threatsData.some((d) => d.industry === ind))
    return mapped.length > 0 ? new Set(mapped) : undefined
  }, [selectedPersona, selectedIndustries, storeIndustries])

  // Curious gets a plain-language intro card regardless of industry selection —
  // the only persona with no PersonaDefaultsBanner (its default industry set is
  // empty by design), so this is its sole in-page framing. Other personas'
  // equivalent framing now comes from PersonaDefaultsBanner alone (previously
  // duplicated here via a separate criticality-count sentence).
  const personaSummary = useMemo(() => {
    if (selectedPersona !== 'curious') return null
    return `${threatsData.length} known quantum-era threats — each one is a place where today's encryption could be broken once a large quantum computer exists. Pick an industry below to see the ones closest to you.`
  }, [selectedPersona])

  // Effective industries the page is scoped to (explicit selection, else persona default).
  const heroScopedIndustries = useMemo<string[]>(
    () =>
      selectedIndustries.length > 0
        ? selectedIndustries
        : personaDefaultActive
          ? personaDefaultThreatIndustries
          : [],
    [selectedIndustries, personaDefaultActive, personaDefaultThreatIndustries]
  )
  // Threats applicable to the scoped sector(s) — the hero's exposure set (sector
  // scope only; criticality/class/search filters don't shrink "your exposure").
  const heroApplicable = useMemo<ThreatItem[]>(
    () =>
      heroScopedIndustries.length > 0
        ? threatsData.filter((t) => heroScopedIndustries.includes(t.industry))
        : threatsData,
    [heroScopedIndustries]
  )

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/endorse/flag render there now, not as a row
  // on the page itself. Mirrors TimelineView.tsx's pattern. Gated on
  // `!simEmbed`, same as the PageHeader render below. No onExport here —
  // Threats genuinely has no export button today, unlike its sibling pages.
  useEffect(() => {
    if (simEmbed) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'Quantum Threats',
      dataSource: `${threatsMetadata?.filename ?? 'quantum_threats_hsm_industries.csv'} • Updated: ${threatsMetadata?.lastUpdate?.toLocaleDateString() ?? 'Unknown'}`,
      endorseUrl: buildEndorsementUrl({
        category: 'threat-endorsement',
        title: 'Endorse: Quantum Threats Dashboard',
        resourceType: 'Threats Page',
        resourceId: 'Quantum Threats Dashboard',
        resourceDetails:
          '**Page:** Quantum Threats — Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements.',
        pageUrl: '/threats',
      }),
      endorseLabel: 'Threats Page',
      endorseResourceType: 'Threats',
      flagUrl: buildFlagUrl({
        category: 'threat-endorsement',
        title: 'Flag: Quantum Threats Dashboard',
        resourceType: 'Threats Page',
        resourceId: 'Quantum Threats Dashboard',
        resourceDetails:
          '**Page:** Quantum Threats — Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements.',
        pageUrl: '/threats',
      }),
      flagLabel: 'Threats Page',
      flagResourceType: 'Threats',
    })
    return () => clearPageActions()
  }, [simEmbed])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off/simEmbed path (Rule 1).
  if (isMobileShell) {
    return <MobileThreatsView />
  }

  return (
    <div>
      {!simEmbed && (
        <PageHeader
          icon={AlertTriangle}
          title="Quantum Threats"
          description="Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements."
        />
      )}

      <>
        {/* Persona-forward exposure hero — your scoped sector's applicable threats
        AND the CRQC consensus window + your per-sector Mosca deadline, together,
        always, above the fold. Splitting these across two tabs used to leave the
        single most decision-forcing number on the page (your migration deadline)
        undiscovered behind a click most users never made. Section itself defaults
        open so that number stays visible on load; collapsible only so users who
        don't need it can reclaim the space. */}
        <CollapsibleSection
          title="Your Exposure"
          icon={<ShieldAlert size={16} className="text-primary" aria-hidden="true" />}
          defaultOpen
          className="mb-4"
        >
          <SectorExposureHero applicable={heroApplicable} scopedIndustries={heroScopedIndustries} />
        </CollapsibleSection>

        {/* CRQC Threat Horizon — defaults open, not a click away. Detail tiers (per-source
        list, Mosca calculator, per-machine list) keep their own internal collapse —
        that progressive-disclosure design was already good, it just no longer sits
        behind an entire tab first. */}
        <CollapsibleSection
          id="crqc-threat-horizon"
          title="CRQC Threat Horizon"
          icon={<Clock size={16} className="text-status-warning" aria-hidden="true" />}
          defaultOpen
          className="scroll-mt-20 mb-4"
        >
          <div className="space-y-4">
            <ThreatEconomicsHeader defaultExpanded />
            <CrqcCapabilityStrip expanded={detailOpen} onExpandedChange={setDetailOpen} />
            {detailOpen && <CrqcTrajectoryChart />}
          </div>
        </CollapsibleSection>

        {/* Persona summary card */}
        {personaSummary && (
          <div className="glass-panel p-3 mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Info size={14} className="text-primary flex-shrink-0" />
            <span>{personaSummary}</span>
          </div>
        )}

        {/* B+ remediation 4.3 (2026-08-10): the developer protocol lens.
            Offered to developers, whose complaint it answers — "developers meet
            threats through protocols and are given sectors".

            The disclosure below the chips is load-bearing, not decoration. The
            corpus has NO protocol column: some rows name a protocol in their
            own text, and some name only an algorithm, from which we infer. Both
            are shown, and which is which is stated — a lens that silently mixed
            quotation with inference would hand a developer a confident list
            partly assembled from records that never mentioned their protocol. */}
        {selectedPersona === 'developer' && (
          <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Network size={14} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="mr-1 text-xs font-semibold text-foreground">By protocol:</span>
              {LENS_PROTOCOLS.map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={() => setProtocolLens(protocolLens === p ? null : p)}
                  aria-pressed={protocolLens === p}
                  className={`h-auto rounded-full border px-2 py-0.5 text-[11px] ${
                    protocolLens === p
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
                </Button>
              ))}
              {protocolLens && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProtocolLens(null)}
                  className="h-auto px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  clear
                </Button>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              This corpus records the cryptography at risk, not the protocol. Some records name a
              protocol themselves — those are marked{' '}
              <span className="font-semibold text-foreground">stated</span>. The rest name only an
              algorithm, and we infer the protocols that algorithm commonly secures — marked{' '}
              <span className="font-semibold text-foreground">inferred</span>. Treat an inferred
              match as a lead, not a finding.
            </p>
            {lensBasisSplit && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/90">
                <span className="font-semibold">{protocolLens}:</span> {lensBasisSplit.stated}{' '}
                record{lensBasisSplit.stated === 1 ? '' : 's'} name it directly,{' '}
                {lensBasisSplit.inferred} inferred from the algorithms they list.
              </p>
            )}
          </div>
        )}

        {/* Persona-aware default-filter banner — appears when persona has
          a default-industries set, the user hasn't picked an explicit
          industry, and hasn't opted out via ?prefs=off. */}
        {personaDefaultActive && (
          <div className="mb-4">
            <PersonaDefaultsBanner
              matchedCount={filteredAndSortedData.length}
              totalCount={threatsData.length}
              noun="threat"
              onReset={() => {
                personaDefaults.resetToFullSet()
                logEvent('Threats', 'Persona Prefs Off', personaLabel())
              }}
            />
          </div>
        )}

        {/* Threat Catalog — filters + industry-grouped list, one collapsible section
          so the whole browsing area can be tucked away once you've found what
          you need. */}
        <CollapsibleSection
          title="Threat Catalog"
          icon={<List size={16} className="text-primary" aria-hidden="true" />}
          defaultOpen
        >
          {/* Control deck — consolidated filters in the redesign language: sector + search
          (row 1); role lens + severity/class chips + trust + my + view (row 2). */}
          <div className="mb-8 space-y-3" data-testid="threats-control-deck">
            {/* Mobile: search + a filters toggle for the rest of the deck */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search threats..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    syncFiltersToUrl({ q: e.target.value })
                  }}
                  className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:bg-muted/50 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-[44px] w-[44px] shrink-0"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                aria-label="Toggle filters"
              >
                <Filter size={18} />
              </Button>
            </div>

            <div className={clsx('space-y-3', showMobileFilters ? 'block' : 'hidden md:block')}>
              {/* Row 1 — your sector + search */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Your sector
                </span>
                <div className="min-w-[180px] max-w-xs flex-1 sm:flex-none">
                  <FilterDropdown
                    items={industryItems}
                    selectedId="All"
                    onSelect={() => {}}
                    multiSelectedIds={selectedIndustries}
                    onMultiSelect={(ids) => {
                      setSelectedIndustries(ids)
                      syncFiltersToUrl({ industry: ids })
                      logEvent('Threats', 'Filter Industry', ids.join(','))
                    }}
                    defaultLabel="Industry"
                    defaultIcon={<Briefcase size={14} className="text-primary" />}
                    opaque
                    className="mb-0 w-full"
                    noContainer
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{heroApplicable.length}</span> in
                  scope
                </span>
                <div className="relative ml-auto hidden min-w-[200px] max-w-xs flex-1 md:flex">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder='Search — try "HNDL settlement data"'
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      syncFiltersToUrl({ q: e.target.value })
                    }}
                    className="w-full rounded-lg border border-border bg-muted/30 py-1.5 pl-9 pr-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:bg-muted/50 focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2 — persona switch + severity + class + trust + my + view + count.
              Persona is a global identity setting (usePersonaStore) — this is a single
              entry point into the real switcher (PersonaSwitchModal, same one the nav's
              PersonaChip uses), not a page-local filter that mutates global state. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPersonaModalOpen(true)}
                  className="h-auto rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  {selectedPersona
                    ? `Viewing as: ${PERSONA_SHORT_LABELS[selectedPersona]} · change` // eslint-disable-line security/detect-object-injection
                    : 'Set your role'}
                </Button>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Severity
                  </span>
                  {criticalityItems.map((c) => {
                    const active = selectedCriticality === c.id
                    return (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCriticality(c.id)
                          syncFiltersToUrl({ criticality: c.id })
                          logEvent('Threats', 'Filter Criticality', c.id)
                        }}
                        aria-pressed={active}
                        className={clsx(
                          'h-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                          active
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {c.id === 'All' ? 'All' : c.label}
                      </Button>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Class
                  </span>
                  {threatClassItems.map((c) => {
                    const active = selectedClass === c.id
                    return (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClass(c.id)
                          syncFiltersToUrl({ threatClass: c.id })
                          logEvent('Threats', 'Filter Class', c.id)
                        }}
                        aria-pressed={active}
                        className={clsx(
                          'h-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                          active
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {c.id === 'All' ? 'All' : c.id.toUpperCase()}
                      </Button>
                    )
                  })}
                </div>

                {/* REMOVED 2026-08-11: the trust-tier control is gone from all
                    five pages that carried one. It was a filter area competing
                    with the top-bar scope for the reader's attention, and on
                    /compliance it was one of three. `?tier=` still filters —
                    useTrustTierFilter reads the URL below — so shared links and
                    the E2E tier specs are unaffected; what went is the second
                    on-screen place to set it. */}

                {myThreats.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOnlyThreats(!showOnlyThreats)}
                    aria-pressed={showOnlyThreats}
                    className={clsx(
                      'inline-flex h-auto items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      showOnlyThreats
                        ? 'border-status-warning/50 bg-status-warning/10 text-status-warning'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <BookmarkCheck size={12} />
                    My ({myThreats.length})
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-3">
                  <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    Showing{' '}
                    <span className="font-semibold text-foreground">
                      {filteredAndSortedData.length}
                    </span>{' '}
                    of {heroApplicable.length}
                  </span>
                  <ThreatsViewToggle
                    mode={viewMode}
                    onChange={(mode) => {
                      setViewMode(mode)
                      syncFiltersToUrl({ mode })
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* View Rendering — left-rail TOC of filtered threats + main view */}
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              {/* Below `lg` this rail would otherwise stack full-width above the
              content; collapse it behind a toggle there instead. `lg:hidden` /
              `lg:block` below keep `lg+` rendering exactly as before. */}
              <Button
                variant="outline"
                className="mb-3 flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2.5 lg:hidden"
                onClick={() => setTocMobileOpen((v) => !v)}
                aria-expanded={tocMobileOpen}
                aria-controls="threats-toc-mobile-panel"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <List size={16} className="text-primary" aria-hidden="true" />
                  Industries
                </span>
                <ChevronDown
                  size={16}
                  className={clsx(
                    'text-muted-foreground transition-transform duration-200',
                    tocMobileOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </Button>
              <div
                id="threats-toc-mobile-panel"
                className={clsx(tocMobileOpen ? 'block' : 'hidden', 'lg:block')}
              >
                <LeftNavTOC
                  title="Industries"
                  ariaLabel="Industries"
                  targetPrefix="threats-toc"
                  activeItemId={activeNavIndustry}
                  onSelect={(slug) => {
                    setActiveNavIndustry(slug)
                    setTocMobileOpen(false)
                    document
                      .getElementById(`industry-${slug}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  groups={[
                    {
                      id: 'industries',
                      label: 'Industries',
                      items: Array.from(
                        new Map(
                          filteredAndSortedData.map((t) => [
                            t.industry,
                            {
                              id: t.industry.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                              label: t.industry,
                              hint: `${filteredAndSortedData.filter((x) => x.industry === t.industry).length} threats`,
                            },
                          ])
                        ).values()
                      ),
                    },
                  ]}
                  emptyMessage="No threats match the current filters."
                />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {viewMode === 'cards' && (
                <div className="mb-8">
                  <ThreatsCardGrid
                    items={filteredAndSortedData}
                    onItemClick={(item) => {
                      setSelectedThreat(item)
                      syncFiltersToUrl({ id: item.threatId })
                    }}
                    relevantIndustries={personaRelevantIndustries}
                    personaLabel={
                      selectedPersona ? PERSONA_SHORT_LABELS[selectedPersona] : undefined // eslint-disable-line security/detect-object-injection
                    }
                  />
                </div>
              )}
              {viewMode === 'table' && (
                <>
                  {/* Table doesn't work below md — reuse the same responsive ThreatCard
                  grid as the Cards view instead of a separate, hand-duplicated mobile
                  list (which had drifted out of sync with the desktop card's features). */}
                  <div className="hidden md:block">
                    <ThreatsTable
                      items={filteredAndSortedData}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      showEvidence={selectedPersona === 'researcher'}
                      onSort={handleSort}
                      onItemClick={(item) => {
                        setSelectedThreat(item)
                        syncFiltersToUrl({ id: item.threatId })
                      }}
                    />
                  </div>
                  <div className="mb-8 md:hidden">
                    <ThreatsCardGrid
                      items={filteredAndSortedData}
                      onItemClick={(item) => {
                        setSelectedThreat(item)
                        syncFiltersToUrl({ id: item.threatId })
                      }}
                      relevantIndustries={personaRelevantIndustries}
                      personaLabel={
                        selectedPersona ? PERSONA_SHORT_LABELS[selectedPersona] : undefined // eslint-disable-line security/detect-object-injection
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CollapsibleSection>
      </>
      {/* Detail dialog — kept at the top level (not nested under any conditional)
          so it survives filter/view changes while open. */}
      <AnimatePresence>
        {selectedThreat && (
          <Suspense fallback={null}>
            <ThreatDetailDialog
              threat={selectedThreat}
              onClose={() => {
                setSelectedThreat(null)
                syncFiltersToUrl({ id: null })
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
      {personaModalOpen && <PersonaSwitchModal onClose={() => setPersonaModalOpen(false)} />}
    </div>
  )
}
