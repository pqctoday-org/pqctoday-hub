// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatentsTable } from './PatentsTable'
import type { SortKey, SortDir } from './PatentsTable'
import { PatentsInsights } from './PatentsInsights'
import type { InsightsFilter } from '@/types/PatentTypes'
import { patentsData, patentsMetadata } from '@/data/patentsData'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import type { CsvColumnConfig } from '@/utils/csvExport'
import type { PatentItem } from '@/types/PatentTypes'
import { logPatentExport, logPatentInsightsFilter } from '@/utils/analytics'
import { PatentSearchPanel } from './PatentSearchPanel'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  COLUMN_PRESETS,
  ALL_COLUMN_IDS,
  COLUMNS_LS_KEY,
  type ColumnId,
  type PresetKey,
} from './patentColumns'

const PATENTS_CSV_COLUMNS: CsvColumnConfig<PatentItem>[] = [
  { header: 'Patent Number', accessor: (p) => p.patentNumber },
  { header: 'Title', accessor: (p) => p.title },
  { header: 'Assignee', accessor: (p) => p.assignee },
  { header: 'Inventors', accessor: (p) => p.inventors },
  { header: 'Priority Date', accessor: (p) => p.priorityDate },
  { header: 'Issue Date', accessor: (p) => p.issueDate },
  { header: 'Crypto Agility', accessor: (p) => p.cryptoAgilityMode },
  { header: 'Quantum Relevance', accessor: (p) => p.quantumRelevance },
  { header: 'Impact Level', accessor: (p) => p.impactLevel },
  { header: 'Impact Score', accessor: (p) => String(p.impactScore) },
  { header: 'PQC Algorithms', accessor: (p) => p.pqcAlgorithms.join('; ') },
  { header: 'Classical Algorithms', accessor: (p) => p.classicalAlgorithms.join('; ') },
  { header: 'Quantum Technology', accessor: (p) => p.quantumTechnology.join('; ') },
  { header: 'Application Domain', accessor: (p) => p.applicationDomain.join('; ') },
  { header: 'Threat Model', accessor: (p) => p.threatModel.join('; ') },
  { header: 'Summary', accessor: (p) => p.summary },
]

function readSavedColumns(): { preset: PresetKey | 'custom'; columns: ColumnId[] } {
  try {
    const raw = localStorage.getItem(COLUMNS_LS_KEY)
    if (raw) {
      const { preset, columns } = JSON.parse(raw)
      const validPresets = ['essential', 'algorithms', 'full', 'custom']
      if (validPresets.includes(preset) && Array.isArray(columns)) {
        const safe = columns.filter((c: unknown) => ALL_COLUMN_IDS.includes(c as ColumnId))
        if (safe.length > 0) return { preset, columns: safe }
      }
    }
  } catch {
    // ignore
  }
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const defaultPreset: PresetKey = isMobile ? 'essential' : 'algorithms'
  return { preset: defaultPreset, columns: COLUMN_PRESETS[defaultPreset] }
}

const SORT_LS_KEY = 'pqc-patents-sort'
const VALID_SORT_KEYS: SortKey[] = ['issueDate', 'impactScore', 'title', 'priorityDate']
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc']

function readSavedSort(): { key: SortKey; dir: SortDir } {
  try {
    const raw = localStorage.getItem(SORT_LS_KEY)
    if (raw) {
      const { key, dir } = JSON.parse(raw)
      if (VALID_SORT_KEYS.includes(key) && VALID_SORT_DIRS.includes(dir)) return { key, dir }
    }
  } catch {
    // ignore
  }
  return { key: 'issueDate', dir: 'desc' }
}

export function PatentsView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const activeTab = searchParams.get('tab') ?? 'insights'
  const selectedPatent = searchParams.get('patent')

  const [columnPreset, setColumnPreset] = useState<PresetKey | 'custom'>(
    () => readSavedColumns().preset
  )
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(() => readSavedColumns().columns)

  const handlePresetChange = useCallback((preset: PresetKey) => {
    const columns = COLUMN_PRESETS[preset]
    setColumnPreset(preset)
    setVisibleColumns(columns)
    localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify({ preset, columns }))
  }, [])

  const handleColumnsChange = useCallback((columns: ColumnId[]) => {
    setColumnPreset('custom')
    setVisibleColumns(columns)
    localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify({ preset: 'custom', columns }))
  }, [])

  const sortKey = useMemo<SortKey>(() => {
    const s = searchParams.get('sort') as SortKey | null
    if (s && VALID_SORT_KEYS.includes(s)) return s
    // Executive persona defaults to impact-first when no explicit sort preference is saved
    if (!localStorage.getItem(SORT_LS_KEY) && selectedPersona === 'executive') return 'impactScore'
    return readSavedSort().key
  }, [searchParams, selectedPersona])

  const sortDir = useMemo<SortDir>(() => {
    const d = searchParams.get('dir') as SortDir | null
    if (d && VALID_SORT_DIRS.includes(d)) return d
    if (!localStorage.getItem(SORT_LS_KEY) && selectedPersona === 'executive') return 'desc'
    return readSavedSort().dir
  }, [searchParams, selectedPersona])

  const handleSort = useCallback(
    (key: SortKey) => {
      const nextDir: SortDir = sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'
      localStorage.setItem(SORT_LS_KEY, JSON.stringify({ key, dir: nextDir }))
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('sort', key)
          next.set('dir', nextDir)
          return next
        },
        { replace: true }
      )
    },
    [sortKey, sortDir, setSearchParams]
  )

  const handleTabChange = useCallback(
    (tab: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        next.delete('patent')
        return next
      })
    },
    [setSearchParams]
  )

  const handleSelect = useCallback(
    (id: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (id) next.set('patent', id)
        else next.delete('patent')
        return next
      })
    },
    [setSearchParams]
  )

  // From search panel: navigate to Explore tab with the patent selected
  const handleSearchSelect = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', 'explore')
        next.set('patent', id)
        return next
      })
    },
    [setSearchParams]
  )

  const handleExport = useCallback(() => {
    logPatentExport(patentsData.length)
    const csv = generateCsv(patentsData, PATENTS_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-patents'))
  }, [])

  // Sets URL filter params from Insights chart clicks — user navigates to Explore tab manually
  const handleInsightsFilter = useCallback(
    (filter: InsightsFilter) => {
      Object.entries(filter).forEach(([key, val]) => {
        if (val != null && val !== '') logPatentInsightsFilter(key, String(val))
      })
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(filter).forEach(([key, val]) => {
            if (val != null && val !== '') next.set(key, String(val))
            else next.delete(key)
          })
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const dataSource = patentsMetadata
    ? `${patentsData.length} patents · enriched ${patentsMetadata.lastUpdate.toLocaleDateString()}`
    : `${patentsData.length} patents`

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-10rem)]">
      <PageHeader
        icon={ScrollText}
        title="PQC Patents"
        description="Cryptographic patents relevant to post-quantum migration, enriched with 25 technical dimensions. For research purposes only — not legal or IP advice."
        dataSource={dataSource}
        onExport={handleExport}
      />

      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="mb-3 shrink-0">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 overflow-hidden mt-0">
            <div className="glass-panel h-full overflow-hidden rounded-lg p-4">
              <PatentSearchPanel patents={patentsData} onSelectPatent={handleSearchSelect} />
            </div>
          </TabsContent>

          <TabsContent value="explore" className="flex-1 overflow-hidden mt-0">
            <div className="glass-panel h-full overflow-hidden rounded-lg">
              <PatentsTable
                patents={patentsData}
                selectedId={selectedPatent}
                onSelect={handleSelect}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                visibleColumns={visibleColumns}
                columnPreset={columnPreset}
                onPresetChange={handlePresetChange}
                onColumnsChange={handleColumnsChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-auto mt-0">
            <PatentsInsights patents={patentsData} onFilter={handleInsightsFilter} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
