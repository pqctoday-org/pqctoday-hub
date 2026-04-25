// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { PatentDetail } from './PatentDetail'
import type { PatentItem, ImpactLevel, CryptoAgilityMode } from '@/types/PatentTypes'
import { inferRegion, NIST_STATUS_LABELS } from './PatentsInsights'

type SortKey = 'issueDate' | 'impactScore' | 'title' | 'priorityDate'
type SortDir = 'asc' | 'desc'

const AGILITY_LABELS: Record<CryptoAgilityMode, string> = {
  classical_only: 'Classical only',
  hybrid: 'Hybrid',
  pqc_only: 'PQC only',
  negotiated: 'Negotiated',
  unclear: 'Unclear',
}

const AGILITY_BADGE: Record<CryptoAgilityMode, string> = {
  classical_only: 'border-status-error/40 text-status-error bg-status-error/10',
  hybrid: 'border-status-warning/40 text-status-warning bg-status-warning/10',
  pqc_only: 'border-status-success/40 text-status-success bg-status-success/10',
  negotiated: 'border-primary/40 text-primary bg-primary/10',
  unclear: 'border-border text-muted-foreground bg-muted',
}

const IMPACT_BADGE: Record<ImpactLevel, string> = {
  High: 'border-status-error/40 text-status-error bg-status-error/10',
  Medium: 'border-status-warning/40 text-status-warning bg-status-warning/10',
  Low: 'border-status-success/40 text-status-success bg-status-success/10',
}

const RELEVANCE_LABELS: Record<string, string> = {
  core_invention: 'Core invention',
  dependent_claim_only: 'Dependent claim only',
  background_only: 'Background only',
  none: 'None',
}

const FILTER_KEYS = [
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
] as const
type FilterKey = (typeof FILTER_KEYS)[number]

function getValueLabel(key: FilterKey, value: string): string {
  if (key === 'agility') return AGILITY_LABELS[value as CryptoAgilityMode] ?? value
  if (key === 'quantumRelevance') return RELEVANCE_LABELS[value] ?? value
  if (key === 'nistStatus') return NIST_STATUS_LABELS[value] ?? value
  if (key === 'hardwareComponent' || key === 'quantumTech') return value.replace(/_/g, ' ')
  return value
}

const FILTER_DEFS: {
  key: FilterKey
  label: string
  getValues: (patents: PatentItem[]) => { id: string; label: string }[]
}[] = [
  {
    key: 'assignee',
    label: 'Assignee',
    getValues: (p) =>
      [...new Set(p.map((x) => x.assignee).filter(Boolean))]
        .sort()
        .map((v) => ({ id: v, label: v })),
  },
  {
    key: 'agility',
    label: 'Crypto Agility',
    getValues: () => Object.entries(AGILITY_LABELS).map(([id, label]) => ({ id, label })),
  },
  {
    key: 'domain',
    label: 'Domain',
    getValues: (p) =>
      [...new Set(p.flatMap((x) => x.applicationDomain))].sort().map((v) => ({ id: v, label: v })),
  },
  {
    key: 'impact',
    label: 'Impact',
    getValues: () => ['High', 'Medium', 'Low'].map((v) => ({ id: v, label: v })),
  },
  {
    key: 'quantumTech',
    label: 'Quantum Tech',
    getValues: (p) =>
      [...new Set(p.flatMap((x) => x.quantumTechnology).filter((v) => v && v !== 'none'))]
        .sort()
        .map((v) => ({ id: v, label: v.replace(/_/g, ' ') })),
  },
  {
    key: 'quantumRelevance',
    label: 'Q. Relevance',
    getValues: () => Object.entries(RELEVANCE_LABELS).map(([id, label]) => ({ id, label })),
  },
  {
    key: 'region',
    label: 'Region',
    getValues: (p) =>
      [...new Set(p.map((x) => inferRegion(x.assignee)))].sort().map((v) => ({ id: v, label: v })),
  },
  {
    key: 'protocol',
    label: 'Protocol',
    getValues: (p) =>
      [...new Set(p.flatMap((x) => x.protocols).filter(Boolean))]
        .sort()
        .map((v) => ({ id: v, label: v })),
  },
  {
    key: 'classicalAlgorithm',
    label: 'Classical Algo',
    getValues: (p) =>
      [...new Set(p.flatMap((x) => x.classicalAlgorithms).filter(Boolean))]
        .sort()
        .map((v) => ({ id: v, label: v })),
  },
  {
    key: 'hardwareComponent',
    label: 'Hardware',
    getValues: (p) =>
      [...new Set(p.flatMap((x) => x.hardwareComponents).filter(Boolean))]
        .sort()
        .map((v) => ({ id: v, label: v.replace(/_/g, ' ') })),
  },
  {
    key: 'nistStatus',
    label: 'NIST Status',
    getValues: (p) =>
      [...new Set(p.flatMap((x) => x.nistRoundStatus.map((n) => n.status)).filter(Boolean))]
        .sort()
        .map((v) => ({ id: v, label: NIST_STATUS_LABELS[v] ?? v })),
  },
]

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (active !== col) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
  return dir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="h-3 w-3 text-primary" />
  )
}

interface ThColProps {
  label: string
  sortable?: SortKey
  className?: string
  sortKey: SortKey
  sortDir: SortDir
  onSort: (col: SortKey) => void
}

function ThCol({ label, sortable, className = '', sortKey, sortDir, onSort }: ThColProps) {
  return (
    <th
      className={`px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap ${sortable ? 'cursor-pointer select-none hover:text-foreground' : ''} ${className}`}
      onClick={sortable ? () => onSort(sortable) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable && <SortIcon col={sortable} active={sortKey} dir={sortDir} />}
      </span>
    </th>
  )
}

function FilterChip({
  dimLabel,
  value,
  onRemove,
}: {
  dimLabel: string
  value: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs">
      <span className="text-muted-foreground">{dimLabel}:</span>
      <span className="font-medium text-foreground">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-auto p-0 ml-0.5 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
        aria-label={`Remove ${dimLabel} filter`}
      >
        <X className="h-3 w-3" />
      </Button>
    </span>
  )
}

function AddFilterPopover({
  patents,
  activeKeys,
  onAdd,
}: {
  patents: PatentItem[]
  activeKeys: Set<FilterKey>
  onAdd: (key: FilterKey, value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<FilterKey | null>(null)
  const [catSearch, setCatSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveCat(null)
        setCatSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const availableDefs = FILTER_DEFS.filter((d) => !activeKeys.has(d.key))
  const selectedDef = activeCat ? FILTER_DEFS.find((d) => d.key === activeCat) : null
  const allValues = useMemo(
    () => selectedDef?.getValues(patents) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCat, patents]
  )
  const values = catSearch
    ? allValues.filter((v) => v.label.toLowerCase().includes(catSearch.toLowerCase()))
    : allValues

  function close() {
    setOpen(false)
    setActiveCat(null)
    setCatSearch('')
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen((o) => !o)
          setActiveCat(null)
          setCatSearch('')
        }}
        className="h-7 inline-flex items-center gap-1 rounded border border-dashed border-border px-2 text-xs text-muted-foreground hover:text-foreground hover:border-input hover:bg-transparent transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add filter
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {!activeCat ? (
            <div className="py-1 max-h-72 overflow-auto">
              {availableDefs.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">All filters active</p>
              ) : (
                availableDefs.map((def) => (
                  <Button
                    key={def.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCat(def.key)}
                    className="h-auto py-2 flex w-full items-center justify-between px-3 text-left text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    {def.label}
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </Button>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveCat(null)
                  setCatSearch('')
                }}
                className="h-auto py-2 flex items-center justify-start gap-1.5 border-b border-border rounded-none px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-3 w-3 shrink-0" />
                <span className="font-medium">{selectedDef?.label}</span>
              </Button>
              <div className="border-b border-border">
                <input
                  type="text"
                  placeholder="Search…"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full bg-background px-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="max-h-52 overflow-auto py-1">
                {values.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                ) : (
                  values.map((v) => (
                    <Button
                      key={v.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onAdd(activeCat, v.id)
                        close()
                      }}
                      className="h-auto py-2 flex w-full items-center justify-start px-3 text-left text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      {v.label}
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  patents: PatentItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function PatentsTable({ patents, selectedId, onSelect }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortKey, setSortKey] = useState<SortKey>('issueDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const search = searchParams.get('search') ?? ''

  const activeFilters = useMemo(
    () =>
      FILTER_KEYS.flatMap((key) => {
        const val = searchParams.get(key)
        return val ? [{ key, value: val }] : []
      }),
    [searchParams]
  )

  const activeKeys = useMemo(() => new Set(activeFilters.map((f) => f.key)), [activeFilters])

  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        FILTER_KEYS.forEach((k) => next.delete(k))
        next.delete('search')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const inCorpusIds = useMemo(() => new Set(patents.map((p) => p.patentNumber)), [patents])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const assigneeF = searchParams.get('assignee') ?? ''
    const agilityF = searchParams.get('agility') ?? ''
    const domainF = searchParams.get('domain') ?? ''
    const impactF = searchParams.get('impact') ?? ''
    const quantumTechF = searchParams.get('quantumTech') ?? ''
    const quantumRelevanceF = searchParams.get('quantumRelevance') ?? ''
    const regionF = searchParams.get('region') ?? ''
    const protocolF = searchParams.get('protocol') ?? ''
    const classicalAlgorithmF = searchParams.get('classicalAlgorithm') ?? ''
    const hardwareComponentF = searchParams.get('hardwareComponent') ?? ''
    const nistStatusF = searchParams.get('nistStatus') ?? ''

    return patents.filter((p) => {
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.summary.toLowerCase().includes(q) &&
        !p.primaryInventiveClaim.toLowerCase().includes(q) &&
        !p.assignee.toLowerCase().includes(q) &&
        !p.patentNumber.toLowerCase().includes(q)
      )
        return false
      if (assigneeF && p.assignee !== assigneeF) return false
      if (agilityF && p.cryptoAgilityMode !== agilityF) return false
      if (domainF && !p.applicationDomain.includes(domainF)) return false
      if (impactF && p.impactLevel !== impactF) return false
      if (quantumTechF && !p.quantumTechnology.includes(quantumTechF)) return false
      if (quantumRelevanceF && p.quantumRelevance !== quantumRelevanceF) return false
      if (regionF && inferRegion(p.assignee) !== regionF) return false
      if (protocolF && !p.protocols.includes(protocolF)) return false
      if (classicalAlgorithmF && !p.classicalAlgorithms.includes(classicalAlgorithmF)) return false
      if (hardwareComponentF && !p.hardwareComponents.includes(hardwareComponentF)) return false
      if (nistStatusF && !p.nistRoundStatus.some((n) => n.status === nistStatusF)) return false
      return true
    })
  }, [patents, search, searchParams])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'issueDate') cmp = a.issueDate.localeCompare(b.issueDate)
      else if (sortKey === 'priorityDate') cmp = a.priorityDate.localeCompare(b.priorityDate)
      else if (sortKey === 'impactScore') cmp = a.impactScore - b.impactScore
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      else {
        setSortKey(key)
        setSortDir('desc')
      }
    },
    [sortKey]
  )

  const selectedPatent = useMemo(
    () => (selectedId ? (patents.find((p) => p.patentNumber === selectedId) ?? null) : null),
    [selectedId, patents]
  )

  const handleNavigate = useCallback((num: string) => onSelect(num), [onSelect])

  const hasFilters = activeFilters.length > 0 || search !== ''

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Main panel */}
      <div
        className={`flex flex-col min-w-0 ${selectedPatent ? 'w-1/2' : 'w-full'} transition-all duration-200`}
      >
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <input
            type="search"
            placeholder="Search patents…"
            value={search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="h-7 rounded border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44"
          />

          {activeFilters.map(({ key, value }) => (
            <FilterChip
              key={key}
              dimLabel={FILTER_DEFS.find((d) => d.key === key)?.label ?? key}
              value={getValueLabel(key, value)}
              onRemove={() => setFilter(key, '')}
            />
          ))}

          <AddFilterPopover
            patents={patents}
            activeKeys={activeKeys}
            onAdd={(key, value) => setFilter(key, value)}
          />

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
            >
              Clear all
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {filtered.length} of {patents.length}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {sorted.length === 0 ? (
            <EmptyState
              title="No patents match"
              description="Try adjusting your filters or search."
            />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-card border-b border-border">
                <tr>
                  <ThCol
                    label="#"
                    className="w-10"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <ThCol
                    label="Title"
                    sortable="title"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  {!selectedPatent && (
                    <ThCol
                      label="Assignee"
                      className="hidden lg:table-cell"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  )}
                  <ThCol label="Agility" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <ThCol
                    label="Impact"
                    sortable="impactScore"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <ThCol
                    label="Issued"
                    sortable="issueDate"
                    className="hidden md:table-cell"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const isSelected = p.patentNumber === selectedId
                  return (
                    <tr
                      key={p.patentNumber}
                      onClick={() => onSelect(isSelected ? null : p.patentNumber)}
                      className={`cursor-pointer border-b border-border transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5 max-w-0">
                        <div className="font-medium text-foreground truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {p.patentNumber}
                        </div>
                      </td>
                      {!selectedPatent && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell max-w-[180px] truncate">
                          {p.assignee}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${AGILITY_BADGE[p.cryptoAgilityMode]}`}
                        >
                          {AGILITY_LABELS[p.cryptoAgilityMode]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${IMPACT_BADGE[p.impactLevel]}`}
                        >
                          {p.impactLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {p.issueDate}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedPatent && (
        <div className="w-1/2 border-l border-border overflow-hidden flex flex-col">
          <PatentDetail
            patent={selectedPatent}
            inCorpusIds={inCorpusIds}
            onClose={() => onSelect(null)}
            onNavigate={handleNavigate}
          />
        </div>
      )}
    </div>
  )
}
