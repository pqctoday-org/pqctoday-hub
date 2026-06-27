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
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common/PageHeader'
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

const PQC_ONLY_LS_KEY = 'pqc-patents-pqc-only'
const SORT_LS_KEY = 'pqc-patents-sort'
const VALID_SORT_KEYS: SortKey[] = ['issueDate', 'impactScore', 'title', 'priorityDate']
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc']
const FILTER_PARAMS = [
  'search',
  'assignee',
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
]

function readPqcOnly(): boolean {
  try {
    const saved = localStorage.getItem(PQC_ONLY_LS_KEY)
    return saved === null ? true : saved === 'true'
  } catch {
    return true
  }
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
  const [params, setParams] = useSearchParams()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const activeTab = params.get('tab') ?? 'insights'
  const selectedPatent = params.get('patent')

  const [pqcOnly, setPqcOnly] = useState<boolean>(() => readPqcOnly())
  const [columnPreset, setColumnPreset] = useState<PresetKey | 'custom'>(
    () => readSavedColumns().preset
  )
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(() => readSavedColumns().columns)
  const [searchResults, setSearchResults] = useState<PatentItem[]>([])
  const [drawerFromSearch, setDrawerFromSearch] = useState(false)

  const handlePqcOnlyChange = useCallback((value: boolean) => {
    setPqcOnly(value)
    try {
      localStorage.setItem(PQC_ONLY_LS_KEY, String(value))
    } catch {
      /* ignore */
    }
  }, [])

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

  const handlePresetChange = useCallback((preset: PresetKey) => {
    const columns = COLUMN_PRESETS[preset]
    setColumnPreset(preset)
    setVisibleColumns(columns)
    try {
      localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify({ preset, columns }))
    } catch {
      /* ignore */
    }
  }, [])
  const handleColumnsChange = useCallback((columns: ColumnId[]) => {
    setColumnPreset('custom')
    setVisibleColumns(columns)
    try {
      localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify({ preset: 'custom', columns }))
    } catch {
      /* ignore */
    }
  }, [])

  // Explore row select → open drawer from the Explore list.
  const handleSelect = useCallback(
    (id: string | null) => {
      setDrawerFromSearch(false)
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
      setDrawerFromSearch(true)
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
  const closeDrawer = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('patent')
    setParams(next)
  }, [params, setParams])

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
    next.delete('from')
    setParams(next, { replace: true })
  }, [params, setParams])

  const handleExport = useCallback(() => {
    logPatentExport(displayPatents.length)
    downloadCsv(generateCsv(displayPatents, PATENTS_CSV_COLUMNS), csvFilename('pqc-patents'))
  }, [displayPatents])

  const drawerPatent = useMemo(
    () =>
      selectedPatent
        ? (displayPatents.find((p) => p.patentNumber === selectedPatent) ?? null)
        : null,
    [selectedPatent, displayPatents]
  )
  const drawerList = drawerFromSearch ? searchResults : exploreResults
  const fromDashboard = params.get('from') === 'dashboard'

  const dataSource = patentsMetadata
    ? `${displayPatents.length} patents · enriched ${patentsMetadata.lastUpdate.toLocaleDateString()}`
    : `${displayPatents.length} patents`

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      <PageHeader
        icon={ScrollText}
        title="PQC Patents"
        description="Cryptographic patents relevant to post-quantum migration, enriched across 25 technical dimensions. For research — not legal or IP advice."
        dataSource={dataSource}
        onExport={handleExport}
        endorseUrl={buildEndorsementUrl({
          category: 'patent-endorsement',
          title: 'Endorse: PQC Patents',
          resourceType: 'Patents Page',
          resourceId: 'PQC Patents',
          resourceDetails:
            '**Page:** PQC Patents — cryptographic patents relevant to post-quantum migration.',
          pageUrl: '/patents',
        })}
        endorseLabel="Patents Page"
        endorseResourceType="Patents"
        flagUrl={buildFlagUrl({
          category: 'patent-endorsement',
          title: 'Flag: PQC Patents',
          resourceType: 'Patents Page',
          resourceId: 'PQC Patents',
          resourceDetails:
            '**Page:** PQC Patents — cryptographic patents relevant to post-quantum migration.',
          pageUrl: '/patents',
        })}
        flagLabel="Patents Page"
        flagResourceType="Patents"
      />

      {/* Control deck */}
      <div className="glass-panel space-y-3 rounded-2xl p-3 sm:p-4">
        <PatentsScopeControl pqcOnly={pqcOnly} onChange={handlePqcOnlyChange} />
        <PatentsKpiStrip kpis={kpis} onDrill={handleKpiDrill} />
      </div>

      {selectedPersona === 'curious' && (
        <PreviewBanner pageContext="Researcher, Architect, Developer" />
      )}

      <Tabs value={activeTab} onValueChange={(t) => setTab(t)}>
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="explore">Explore ({exploreResults.length})</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <PatentsInsightsRedesign patents={displayPatents} onFilter={applyDrill} />
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
      />
    </div>
  )
}

export default PatentsViewRedesign
