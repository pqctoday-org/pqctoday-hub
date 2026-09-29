// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentsViewRedesign — the rebuilt /patents page (handoff: design_handoff_patents_redesign).
 *
 * Composition: header → control deck (scope segmented control + KPI strip) → tab
 * bar (Insights default / Explore w/ count / Search) → active body → detail drawer.
 * Reuses every sub-component; the Explore filter/sort runs through usePatentResults
 * (also the orchestrator's count + drawer prev/next source). Keeps every piece of
 * the live PatentsView state: pqcOnly (LS), columns (LS), sort (LS + executive
 * default), tab/patent/filter URL params, CSV export, persona.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ScrollText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { PreviewBanner } from '@/components/common/PreviewBanner'
import { patentsData, patentsMetadata } from '@/data/patentsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { logPatentExport, logPatentInsightsFilter } from '@/utils/analytics'
import { PatentSearchPanel } from '@/components/Patents/PatentSearchPanel'
import { PatentsTable, type SortKey, type SortDir } from '@/components/Patents/PatentsTable'
import { usePatentResults } from '@/components/Patents/usePatentResults'
import { isPqcPatent, PATENTS_CSV_COLUMNS } from '@/components/Patents/patentColumns'
import {
  COLUMN_PRESETS,
  COLUMNS_LS_KEY,
  ALL_COLUMN_IDS,
  type ColumnId,
  type PresetKey,
} from '@/components/Patents/patentColumns'
import type { InsightsFilter, PatentItem } from '@/types/PatentTypes'
import { PatentsScopeControl } from './PatentsScopeControl'
import { PatentsKpiStrip, type KpiDrill } from './PatentsKpiStrip'
import { usePatentKpis } from './usePatentKpis'
import { PatentsInsightsRedesign } from './PatentsInsightsRedesign'
import { PatentsFilterBar } from './PatentsFilterBar'
import { PatentsDrillBanner } from './PatentsDrillBanner'
import { PatentDetailDrawer } from './PatentDetailDrawer'
import { PatentsRecentlyAdded } from './PatentsRecentlyAdded'
import { PatentsRoleLens } from '../PatentsRoleLens'
import {
  PQC_ONLY_LS_KEY,
  SCOPE_PARAM,
  findPatentByNumber,
  readPqcOnly,
  readScopeParam,
} from '@/data/patentsScope'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobilePatentsView } from '@/components/Mobile/screens/MobilePatentsView'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import { resolvePatentTab } from '@/components/Patents/patentDeepLink'

const SORT_LS_KEY = 'pqc-patents-sort'
const VALID_SORT_KEYS: SortKey[] = ['issueDate', 'impactScore', 'title', 'priorityDate']
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc']
// URL params that carry scope/columns explicitly — when present (e.g. from a
// shared link) they win over the recipient's own saved localStorage state, so
// a shared link shows what the sender configured, not the recipient's prior
// preferences. Set alongside localStorage on every user-initiated change,
// mirroring the existing sort/dir params below.
// PQC_ONLY_LS_KEY / SCOPE_PARAM moved to '@/data/patentsScope' (pure-move
// extraction E-4, IMPLEMENTATION-PLAN.md §5.4) so the mobile Patents screen
// reads/writes the same scope state this page does.
const COLUMNS_PARAM = 'columns'
const SEARCH_QUERY_PARAM = 'sq'
const PRESET_PARAM = 'preset'
const FILTER_PARAMS = [
  'search',
  'assignee',
  'inventor',
  'patentIds',
  'agility',
  'domain',
  'impact',
  'quantumTech',
  'quantumRelevance',
  'region',
  'protocol',
  'classicalAlgorithm',
  'hardwareComponent',
  'nistStatus',
  'pqc',
  'fips',
  'filingYear',
]

/** Explicit columns/preset from a shared-link URL, if present. */
function readColumnsParam(
  params: URLSearchParams
): { preset: PresetKey | 'custom'; columns: ColumnId[] } | null {
  const columnsRaw = params.get(COLUMNS_PARAM)
  if (!columnsRaw) return null
  const columns = columnsRaw
    .split(',')
    .filter((c): c is ColumnId => ALL_COLUMN_IDS.includes(c as ColumnId))
  if (columns.length === 0) return null
  const presetRaw = params.get(PRESET_PARAM)
  const preset: PresetKey | 'custom' =
    presetRaw && (['essential', 'algorithms', 'full'] as string[]).includes(presetRaw)
      ? (presetRaw as PresetKey)
      : 'custom'
  return { preset, columns }
}

function readSavedColumns(): { preset: PresetKey | 'custom'; columns: ColumnId[] } {
  try {
    const raw = localStorage.getItem(COLUMNS_LS_KEY)
    if (raw) {
      const { preset, columns } = JSON.parse(raw)
      if (
        ['essential', 'algorithms', 'full', 'custom'].includes(preset) &&
        Array.isArray(columns)
      ) {
        const safe = columns.filter((c: unknown) => ALL_COLUMN_IDS.includes(c as ColumnId))
        if (safe.length > 0) return { preset, columns: safe }
      }
    }
  } catch {
    /* ignore */
  }
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const preset: PresetKey = isMobile ? 'essential' : 'algorithms'
  return { preset, columns: COLUMN_PRESETS[preset] }
}

function readSavedSort(): { key: SortKey; dir: SortDir } {
  try {
    const raw = localStorage.getItem(SORT_LS_KEY)
    if (raw) {
      const { key, dir } = JSON.parse(raw)
      if (VALID_SORT_KEYS.includes(key) && VALID_SORT_DIRS.includes(dir)) return { key, dir }
    }
  } catch {
    /* ignore */
  }
  return { key: 'issueDate', dir: 'desc' }
}

export function PatentsViewRedesign() {
  // Mobile UX layer (Phase 7).
  const isMobileShell = useIsMobileShell()
  const [params, setParams] = useSearchParams()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const activeTab = resolvePatentTab(params, FILTER_PARAMS)
  const selectedPatent = params.get('patent')

  const [pqcOnly, setPqcOnly] = useState<boolean>(() => readScopeParam(params) ?? readPqcOnly())
  const [columnPreset, setColumnPreset] = useState<PresetKey | 'custom'>(
    () => readColumnsParam(params)?.preset ?? readSavedColumns().preset
  )
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(
    () => readColumnsParam(params)?.columns ?? readSavedColumns().columns
  )
  const [searchResults, setSearchResults] = useState<PatentItem[]>([])
  // Search-tab query (?sq). The drawer's prev/next list follows the active tab,
  // so a reload of a Search-tab link steps through the same hits.
  const searchQuery = params.get(SEARCH_QUERY_PARAM) ?? ''

  const handlePqcOnlyChange = useCallback(
    (value: boolean) => {
      setPqcOnly(value)
      try {
        localStorage.setItem(PQC_ONLY_LS_KEY, String(value))
      } catch {
        /* ignore */
      }
      const next = new URLSearchParams(params)
      next.set(SCOPE_PARAM, value ? 'pqc' : 'all')
      setParams(next, { replace: true })
    },
    [params, setParams]
  )

  // Patents that are quantum-safe on a basis other than a NIST PQC algorithm
  // — AES-256 or SHA-2/3 strength, lattice FHE, QKD — and therefore fall
  // outside `isPqcPatent`. Counted so the scope control can say they exist
  // instead of hiding them silently.
  const quantumSafeOutsideScope = useMemo(
    () => patentsData.filter((p) => !isPqcPatent(p) && p.quantumSafeBasis !== '').length,
    []
  )

  const displayPatents = useMemo(
    () => (pqcOnly ? patentsData.filter(isPqcPatent) : patentsData),
    [pqcOnly]
  )
  const inCorpusIds = useMemo(
    () => new Set(displayPatents.map((p) => p.patentNumber)),
    [displayPatents]
  )

  const sortKey = useMemo<SortKey>(() => {
    const s = params.get('sort') as SortKey | null
    if (s && VALID_SORT_KEYS.includes(s)) return s
    if (!localStorage.getItem(SORT_LS_KEY) && selectedPersona === 'executive') return 'impactScore'
    return readSavedSort().key
  }, [params, selectedPersona])
  const sortDir = useMemo<SortDir>(() => {
    const d = params.get('dir') as SortDir | null
    if (d && VALID_SORT_DIRS.includes(d)) return d
    if (!localStorage.getItem(SORT_LS_KEY) && selectedPersona === 'executive') return 'desc'
    return readSavedSort().dir
  }, [params, selectedPersona])

  const exploreResults = usePatentResults(displayPatents, params, sortKey, sortDir)
  const kpis = usePatentKpis(displayPatents)
  const recentlyAdded = useMemo(
    () =>
      displayPatents
        .filter((p) => p.status === 'New')
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()),
    [displayPatents]
  )

  const setTab = useCallback(
    (tab: string, opts?: { keepPatent?: boolean }) => {
      const next = new URLSearchParams(params)
      next.set('tab', tab)
      if (!opts?.keepPatent) next.delete('patent')
      setParams(next)
    },
    [params, setParams]
  )

  const handleSort = useCallback(
    (key: SortKey) => {
      const nextDir: SortDir = sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'
      try {
        localStorage.setItem(SORT_LS_KEY, JSON.stringify({ key, dir: nextDir }))
      } catch {
        /* ignore */
      }
      const next = new URLSearchParams(params)
      next.set('sort', key)
      next.set('dir', nextDir)
      setParams(next, { replace: true })
    },
    [sortKey, sortDir, params, setParams]
  )

  const handlePresetChange = useCallback(
    (preset: PresetKey) => {
      const columns = COLUMN_PRESETS[preset]
      setColumnPreset(preset)
      setVisibleColumns(columns)
      try {
        localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify({ preset, columns }))
      } catch {
        /* ignore */
      }
      const next = new URLSearchParams(params)
      next.set(PRESET_PARAM, preset)
      next.set(COLUMNS_PARAM, columns.join(','))
      setParams(next, { replace: true })
    },
    [params, setParams]
  )
  const handleColumnsChange = useCallback(
    (columns: ColumnId[]) => {
      setColumnPreset('custom')
      setVisibleColumns(columns)
      try {
        localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify({ preset: 'custom', columns }))
      } catch {
        /* ignore */
      }
      const next = new URLSearchParams(params)
      next.set(PRESET_PARAM, 'custom')
      next.set(COLUMNS_PARAM, columns.join(','))
      setParams(next, { replace: true })
    },
    [params, setParams]
  )

  // Explore row select → open drawer from the Explore list.
  const handleSelect = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params)
      if (id) next.set('patent', id)
      else next.delete('patent')
      setParams(next)
    },
    [params, setParams]
  )

  // Search result select → open drawer from the Search list (stay on Search tab).
  const handleSearchSelect = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set('tab', 'search')
      next.set('patent', id)
      setParams(next)
    },
    [params, setParams]
  )

  // Settled Search-tab query → ?sq (replace); an empty query clears it.
  const handleSearchQueryChange = useCallback(
    (q: string) => {
      const value = q.trim()
      if ((params.get(SEARCH_QUERY_PARAM) ?? '') === value) return
      const next = new URLSearchParams(params)
      if (value) next.set(SEARCH_QUERY_PARAM, value)
      else next.delete(SEARCH_QUERY_PARAM)
      setParams(next, { replace: true })
    },
    [params, setParams]
  )

  // Prior-art citation → another patent: push, so Back returns to the citing one.
  const handleOpenCitation = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set('patent', id)
      setParams(next)
    },
    [params, setParams]
  )

  // Drawer prev/next → just move ?patent within the active source list.
  const handleDrawerNavigate = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set('patent', id)
      setParams(next, { replace: true })
    },
    [params, setParams]
  )
  // Deep-link arrival state: a notice when the link's patent had to be
  // widened into scope (with Undo) or could not be found, and a scroll/ring
  // target for its Explore row.
  const [deepLinkNotice, setDeepLinkNotice] = useState<{
    kind: 'widened' | 'not-found'
    message: string
    /** Scope param value before widening (null = absent), restored by Undo. */
    priorScopeParam?: string | null
  } | null>(null)
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)
  const handledPatentRef = useRef<string | null>(null)
  const arrivalPatentRef = useRef<string | null>(null)

  // Resolve ?patent (US-prefixed or bare) against the FULL corpus: canonicalise
  // the param, widen the scope if the patent is hidden by it, or say it is not
  // found. Runs once per distinct ?patent value. The mobile screen does its own
  // handling, so this is desktop-only.
  useEffect(() => {
    if (isMobileShell) return
    if (!selectedPatent) {
      handledPatentRef.current = null
      return
    }
    if (handledPatentRef.current === selectedPatent) return
    handledPatentRef.current = selectedPatent
    const match = findPatentByNumber(selectedPatent)
    const next = new URLSearchParams(params)
    if (!match) {
      setDeepLinkNotice({
        kind: 'not-found',
        message: `Patent ${selectedPatent} isn't in the catalog — it may have been retired or the link is mistyped.`,
      })
      next.delete('patent')
      setParams(next, { replace: true })
      return
    }
    let changed = false
    if (match.patentNumber !== selectedPatent) {
      next.set('patent', match.patentNumber)
      changed = true
    }
    if (pqcOnly && !isPqcPatent(match)) {
      setDeepLinkNotice({
        kind: 'widened',
        message: `Showing all patents to include ${match.patentNumber}.`,
        priorScopeParam: params.get(SCOPE_PARAM),
      })
      setPqcOnly(false)
      next.set(SCOPE_PARAM, 'all')
      changed = true
    }
    if (arrivalPatentRef.current === null) {
      arrivalPatentRef.current = match.patentNumber
      setScrollTarget(`${match.patentNumber}#arrive`)
    }
    if (changed) setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per ?patent value
  }, [selectedPatent, isMobileShell])

  useScrollToDeepLinkTarget(
    scrollTarget,
    scrollTarget ? deepLinkSelector(scrollTarget.split('#')[0]) : null
  )

  const undoWiden = useCallback(() => {
    const prior = deepLinkNotice?.priorScopeParam
    setPqcOnly(true)
    const next = new URLSearchParams(params)
    if (prior) next.set(SCOPE_PARAM, prior)
    else next.delete(SCOPE_PARAM)
    // The linked patent is outside the restored scope, so close it too.
    next.delete('patent')
    setParams(next, { replace: true })
    setDeepLinkNotice(null)
  }, [deepLinkNotice, params, setParams])

  // Close replaces history (house rule) so Back doesn't reopen the drawer.
  const closeDrawer = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('patent')
    setParams(next, { replace: true })
    // Closing the patent a link opened: bring its Explore row back into view.
    if (selectedPatent && selectedPatent === arrivalPatentRef.current) {
      setScrollTarget(`${selectedPatent}#close`)
    }
  }, [params, setParams, selectedPatent])

  // Dashboard drill-down: apply the filter AND switch to Explore (no tab-hunting).
  const applyDrill = useCallback(
    (filter: InsightsFilter) => {
      Object.entries(filter).forEach(([k, v]) => {
        if (v != null && v !== '') logPatentInsightsFilter(k, String(v))
      })
      const next = new URLSearchParams(params)
      Object.entries(filter).forEach(([k, v]) => {
        if (v != null && v !== '') next.set(k, String(v))
        else next.delete(k)
      })
      next.set('tab', 'explore')
      next.set('from', 'dashboard')
      next.delete('patent')
      setParams(next)
    },
    [params, setParams]
  )
  const handleKpiDrill = useCallback(
    (drill: KpiDrill) => {
      if (drill === 'clear') {
        const next = new URLSearchParams(params)
        FILTER_PARAMS.forEach((k) => next.delete(k))
        next.set('tab', 'explore')
        next.delete('from')
        next.delete('patent')
        setParams(next)
      } else {
        applyDrill(drill)
      }
    },
    [params, setParams, applyDrill]
  )
  const clearDrill = useCallback(() => {
    const next = new URLSearchParams(params)
    FILTER_PARAMS.forEach((k) => next.delete(k))
    next.delete('from')
    setParams(next, { replace: true })
  }, [params, setParams])

  const handleExport = useCallback(() => {
    logPatentExport(displayPatents.length)
    downloadCsv(generateCsv(displayPatents, PATENTS_CSV_COLUMNS), csvFilename('pqc-patents'))
  }, [displayPatents])

  // Resolved against the full corpus (either ID form), not the scoped list —
  // an out-of-scope link is widened into scope by the effect above.
  const drawerPatent = useMemo(() => findPatentByNumber(selectedPatent), [selectedPatent])
  const drawerList = activeTab === 'search' ? searchResults : exploreResults
  const fromDashboard = params.get('from') === 'dashboard'

  const dataSource = patentsMetadata
    ? `${displayPatents.length} patents · enriched ${patentsMetadata.lastUpdate.toLocaleDateString()}`
    : `${displayPatents.length} patents`

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/export/endorse/flag render there now, not as
  // a row on the page itself. Mirrors TimelineView.tsx's pattern.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'PQC Patents',
      dataSource,
      onExport: handleExport,
      endorseUrl: buildEndorsementUrl({
        category: 'patent-endorsement',
        title: 'Endorse: PQC Patents',
        resourceType: 'Patents Page',
        resourceId: 'PQC Patents',
        resourceDetails:
          '**Page:** PQC Patents — cryptographic patents relevant to post-quantum migration.',
        pageUrl: '/patents',
      }),
      endorseLabel: 'Patents Page',
      endorseResourceType: 'Patents',
      flagUrl: buildFlagUrl({
        category: 'patent-endorsement',
        title: 'Flag: PQC Patents',
        resourceType: 'Patents Page',
        resourceId: 'PQC Patents',
        resourceDetails:
          '**Page:** PQC Patents — cryptographic patents relevant to post-quantum migration.',
        pageUrl: '/patents',
      }),
      flagLabel: 'Patents Page',
      flagResourceType: 'Patents',
    })
    return () => clearPageActions()
  }, [dataSource, handleExport])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). PatentsViewRedesign takes
  // no props and is never embedded in the simulation, so unlike Threats/
  // Library this needs no simEmbed-equivalent guard.
  if (isMobileShell) {
    return <MobilePatentsView />
  }

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      <PageHeader
        icon={ScrollText}
        title="PQC Patents"
        description="Cryptographic patents relevant to post-quantum migration, enriched across 25 technical dimensions. For research — not legal or IP advice."
      />

      <PersonaPageNote route="/patents" />

      {deepLinkNotice && (
        <DeepLinkNotice
          kind={deepLinkNotice.kind}
          message={deepLinkNotice.message}
          onUndo={deepLinkNotice.kind === 'widened' ? undoWiden : undefined}
          onDismiss={() => setDeepLinkNotice(null)}
        />
      )}

      {/* Control deck */}
      <div className="glass-panel space-y-3 rounded-2xl p-3 sm:p-4">
        <PatentsScopeControl
          pqcOnly={pqcOnly}
          onChange={handlePqcOnlyChange}
          quantumSafeOutsideScope={quantumSafeOutsideScope}
        />
        <PatentsKpiStrip kpis={kpis} onDrill={handleKpiDrill} />
      </div>

      {selectedPersona === 'curious' && (
        <PreviewBanner pageContext="Researcher, Architect, Developer" variant="suggestion" />
      )}

      {/* B+ remediation 4.1 (2026-08-10): the page was raw IP data with no
          framing for anybody. This says how much of it touches the algorithms
          the reader's own path uses, who holds that, and — explicitly — what
          the catalog cannot tell them about enforceability. */}
      <PatentsRoleLens patents={displayPatents} persona={selectedPersona} />

      <PatentsRecentlyAdded items={recentlyAdded} onOpen={handleSelect} />

      <Tabs value={activeTab} onValueChange={(t) => setTab(t)}>
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="explore">Explore ({exploreResults.length})</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <PatentsInsightsRedesign
            patents={displayPatents}
            onFilter={applyDrill}
            selectedYear={params.get('filingYear') ? Number(params.get('filingYear')) : null}
          />
        </TabsContent>

        <TabsContent value="explore" className="mt-4 space-y-3">
          {fromDashboard && <PatentsDrillBanner onClear={clearDrill} />}
          <PatentsFilterBar
            patents={displayPatents}
            count={exploreResults.length}
            total={displayPatents.length}
            columnPreset={columnPreset}
            visibleColumns={visibleColumns}
            onPresetChange={handlePresetChange}
            onColumnsChange={handleColumnsChange}
          />
          <div className="glass-panel h-[60dvh] overflow-hidden rounded-2xl">
            <PatentsTable
              patents={displayPatents}
              selectedId={selectedPatent}
              onSelect={handleSelect}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              visibleColumns={visibleColumns}
              columnPreset={columnPreset}
              onPresetChange={handlePresetChange}
              onColumnsChange={handleColumnsChange}
              chrome={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <div className="glass-panel rounded-2xl p-4">
            <PatentSearchPanel
              patents={displayPatents}
              onSelectPatent={handleSearchSelect}
              onResults={setSearchResults}
              urlQuery={searchQuery}
              onQueryChange={handleSearchQueryChange}
            />
          </div>
        </TabsContent>
      </Tabs>

      <PatentDetailDrawer
        patent={drawerPatent}
        resultList={drawerList}
        inCorpusIds={inCorpusIds}
        onClose={closeDrawer}
        onNavigate={handleDrawerNavigate}
        onOpenCitation={handleOpenCitation}
      />
    </div>
  )
}

export default PatentsViewRedesign
