// SPDX-License-Identifier: AGPL-3.0-only
/**
 * PatentsFilterBar — the consolidated Explore filter bar. Search leads; four
 * primary dropdowns (Region / Agility / Impact / Domain); a live "Showing N of M"
 * count; and the Essential/Algorithms/Full column-preset control. A second row
 * holds removable chips for any secondary filters that arrived from the dashboard.
 * Reads/writes the same URL params the pipeline (usePatentResults) reads.
 */
import { useMemo, useState } from 'react'
import { useEmbedSearchParams } from '@/hooks/useEmbedSearchParams'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import { FilterDrawer } from '@/components/common/FilterDrawer'
import { ColumnPicker } from '@/components/Patents/ColumnPicker'
import { filingJurisdictionLabel, NIST_STATUS_LABELS } from '@/components/Patents/PatentsInsights'
import {
  PUBLICATION_KIND_LABELS,
  QUANTUM_SAFE_BASIS_LABELS,
  pqcCountingLabel,
  pqcCountingName,
} from '@/data/patentFilters'
import type { PatentItem } from '@/types/PatentTypes'
import type { ColumnId, PresetKey } from '@/components/Patents/patentColumns'

const PRIMARY = ['region', 'agility', 'impact', 'domain'] as const
const SECONDARY = [
  'assignee',
  // Set by Community links (a leader's "View N patents" / inventor search).
  'inventor',
  'patentIds',
  'quantumTech',
  'quantumRelevance',
  'protocol',
  'classicalAlgorithm',
  'hardwareComponent',
  'nistStatus',
  'pqc',
  'fips',
  'filingYear',
  'publication',
  'quantumSafeBasis',
  'threatModel',
  'standard',
  'migrationStrategy',
] as const

const AGILITY_LABELS: Record<string, string> = {
  classical_only: 'Classical only',
  hybrid: 'Hybrid',
  pqc_only: 'PQC only',
  negotiated: 'Negotiated',
  unclear: 'Unclear',
}
const SECONDARY_LABEL: Record<string, string> = {
  assignee: 'Assignee',
  inventor: 'Inventor',
  patentIds: 'Patents',
  quantumTech: 'Quantum tech',
  quantumRelevance: 'Q. relevance',
  protocol: 'Protocol',
  classicalAlgorithm: 'Classical',
  hardwareComponent: 'Hardware',
  nistStatus: 'NIST',
  pqc: 'PQC algo',
  fips: 'FIPS',
  filingYear: 'Filed',
  publication: 'Publication',
  quantumSafeBasis: 'Quantum-safe basis',
  threatModel: 'Threat model',
  standard: 'Standard',
  migrationStrategy: 'Migration',
}

/** Distinct values of a field, most common first, with their counts. */
function optionsByCount(
  values: string[][],
  label: (v: string) => string = (v) => v
): FilterDropdownItem[] {
  const counts = new Map<string, number>()
  for (const list of values)
    for (const v of new Set(list)) if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, n]) => ({ id, label: `${label(id)} (${n})` }))
}

function chipValue(key: string, value: string): string {
  switch (key) {
    case 'nistStatus':
      // eslint-disable-next-line security/detect-object-injection -- label lookup
      return NIST_STATUS_LABELS[value] ?? value
    case 'fips':
      return 'FIPS 203/4/5'
    case 'patentIds':
      return patentIdsLabel(value)
    case 'pqc':
      return pqcCountingLabel(value)
    case 'publication':
      // eslint-disable-next-line security/detect-object-injection -- label lookup
      return PUBLICATION_KIND_LABELS[value] ?? value
    case 'quantumSafeBasis':
      // eslint-disable-next-line security/detect-object-injection -- label lookup
      return QUANTUM_SAFE_BASIS_LABELS[value] ?? value
    case 'quantumRelevance':
    case 'migrationStrategy':
    case 'hardwareComponent':
      return value.replace(/_/g, ' ')
    default:
      return value
  }
}

/** `US1,US2,US3` → "3 selected"; a single id is shown as-is. */
function patentIdsLabel(value: string): string {
  const ids = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return ids.length === 1 ? ids[0] : `${ids.length} selected`
}

interface PatentsFilterBarProps {
  patents: PatentItem[]
  count: number
  total: number
  columnPreset: PresetKey | 'custom'
  visibleColumns: ColumnId[]
  onPresetChange: (preset: PresetKey) => void
  onColumnsChange: (columns: ColumnId[]) => void
}

export function PatentsFilterBar({
  patents,
  count,
  total,
  columnPreset,
  visibleColumns,
  onPresetChange,
  onColumnsChange,
}: PatentsFilterBarProps) {
  const [params, setParams] = useEmbedSearchParams()

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'All') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const regionOpts = useMemo(
    () => ['All', ...[...new Set(patents.map((p) => filingJurisdictionLabel(p)))].sort()],
    [patents]
  )
  const domainOpts = useMemo(
    () => [
      'All',
      ...[...new Set(patents.flatMap((p) => p.applicationDomain).filter(Boolean))].sort(),
    ],
    [patents]
  )
  const agilityOpts = useMemo(
    () =>
      ['All', ...Object.keys(AGILITY_LABELS)].map((id) => ({
        id,
        label: AGILITY_LABELS[id] ?? 'All',
      })),
    []
  )
  const impactOpts = ['All', 'High', 'Medium', 'Low']

  // "More filters": every other field the Explore pipeline filters on, so a
  // reader on this tab need not go hunting for a chart bar to click.
  const [moreOpen, setMoreOpen] = useState(false)
  const moreFilters = useMemo(() => {
    const list: {
      key: string
      label: string
      items: FilterDropdownItem[]
      searchable?: boolean
    }[] = [
      {
        key: 'assignee',
        label: 'Assignee',
        items: optionsByCount(patents.map((p) => (p.assignee ? [p.assignee] : []))),
        searchable: true,
      },
      {
        key: 'pqc',
        label: 'PQC algorithm',
        items: optionsByCount(
          patents.map((p) => p.pqcAlgorithms.map(pqcCountingName)),
          pqcCountingLabel
        ),
        searchable: true,
      },
      {
        key: 'protocol',
        label: 'Protocol',
        items: optionsByCount(patents.map((p) => p.protocols)),
        searchable: true,
      },
      {
        key: 'classicalAlgorithm',
        label: 'Classical algorithm',
        items: optionsByCount(patents.map((p) => p.classicalAlgorithms)),
        searchable: true,
      },
      {
        key: 'hardwareComponent',
        label: 'Hardware',
        items: optionsByCount(
          patents.map((p) => p.hardwareComponents),
          (v) => v.replace(/_/g, ' ')
        ),
        searchable: true,
      },
      {
        key: 'nistStatus',
        label: 'NIST status',
        items: optionsByCount(
          patents.map((p) => p.nistRoundStatus.map((n) => n.status)),
          // eslint-disable-next-line security/detect-object-injection -- label lookup
          (v) => NIST_STATUS_LABELS[v] ?? v
        ),
      },
      {
        key: 'publication',
        label: 'Publication',
        // eslint-disable-next-line security/detect-object-injection -- label lookup
        items: optionsByCount(
          patents.map((p) => [p.publicationKind]),
          (v) => PUBLICATION_KIND_LABELS[v] ?? v
        ),
      },
    ]
    // Only the full corpus holds records that are quantum-safe without a PQC
    // algorithm, so the basis filter appears when there is something to pick.
    const bases = optionsByCount(
      patents.map((p) => (p.quantumSafeBasis ? [p.quantumSafeBasis] : [])),
      // eslint-disable-next-line security/detect-object-injection -- label lookup
      (v) => QUANTUM_SAFE_BASIS_LABELS[v] ?? v
    )
    if (bases.length > 1)
      list.push({ key: 'quantumSafeBasis', label: 'Quantum-safe basis', items: bases })
    return list
  }, [patents])
  const moreActive = moreFilters.filter((f) => params.get(f.key)).length

  const activeChips = SECONDARY.map((key) => ({ key, value: params.get(key) ?? '' })).filter(
    (c) => c.value
  )

  const search = params.get('search') ?? ''

  // Primary (Region/Agility/Impact/Domain) active count — drives the mobile
  // "Filters" drawer trigger badge and its own Clear All (search + column
  // preset + secondary chips stay outside the drawer, so they're untouched).
  const primaryActiveCount = PRIMARY.filter((key) => {
    const v = params.get(key)
    return Boolean(v) && v !== 'All'
  }).length
  const clearPrimaryFilters = () => {
    const next = new URLSearchParams(params)
    PRIMARY.forEach((k) => next.delete(k))
    setParams(next, { replace: true })
  }

  return (
    <div className="glass-panel rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search patents — title, assignee, number…"
            aria-label="Search patents"
            className="pl-9"
          />
        </div>
        {/* Desktop (lg+): Region/Agility/Impact/Domain render inline, unchanged. */}
        <div className="hidden lg:contents">
          <FilterDropdown
            items={regionOpts}
            selectedId={params.get('region') ?? 'All'}
            onSelect={(v) => set('region', v)}
            label="Filing office"
            defaultLabel="All regions"
          />
          <FilterDropdown
            items={agilityOpts}
            selectedId={params.get('agility') ?? 'All'}
            onSelect={(v) => set('agility', v)}
            label="Agility"
            defaultLabel="All agility"
          />
          <FilterDropdown
            items={impactOpts}
            selectedId={params.get('impact') ?? 'All'}
            onSelect={(v) => set('impact', v)}
            label="Impact"
            defaultLabel="All impact"
          />
          <FilterDropdown
            items={domainOpts}
            selectedId={params.get('domain') ?? 'All'}
            onSelect={(v) => set('domain', v)}
            label="Domain"
            defaultLabel="All domains"
          />
        </div>

        {/* Mobile (below lg): collapse the 4 dropdowns into a single Filters drawer. */}
        <div className="lg:hidden">
          <FilterDrawer
            label="Filters"
            activeFilterCount={primaryActiveCount}
            onClearAll={clearPrimaryFilters}
            filterContent={
              <>
                <FilterDropdown
                  items={regionOpts}
                  selectedId={params.get('region') ?? 'All'}
                  onSelect={(v) => set('region', v)}
                  label="Filing office"
                  defaultLabel="All regions"
                />
                <FilterDropdown
                  items={agilityOpts}
                  selectedId={params.get('agility') ?? 'All'}
                  onSelect={(v) => set('agility', v)}
                  label="Agility"
                  defaultLabel="All agility"
                />
                <FilterDropdown
                  items={impactOpts}
                  selectedId={params.get('impact') ?? 'All'}
                  onSelect={(v) => set('impact', v)}
                  label="Impact"
                  defaultLabel="All impact"
                />
                <FilterDropdown
                  items={domainOpts}
                  selectedId={params.get('domain') ?? 'All'}
                  onSelect={(v) => set('domain', v)}
                  label="Domain"
                  defaultLabel="All domains"
                />
              </>
            }
          />
        </div>
        <span className="ml-auto shrink-0 text-[12.5px] text-muted-foreground tabular-nums">
          Showing <span className="font-semibold text-foreground">{count}</span> of {total}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
          className="h-8 px-2 text-[12.5px]"
        >
          {moreOpen ? 'Fewer filters' : 'More filters'}
          {moreActive > 0 && ` (${moreActive})`}
        </Button>
        <ColumnPicker
          preset={columnPreset}
          visibleColumns={visibleColumns}
          onPresetChange={onPresetChange}
          onColumnsChange={onColumnsChange}
        />
      </div>

      {moreOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
          {moreFilters.map((f) => (
            <FilterDropdown
              key={f.key}
              items={['All', ...f.items]}
              selectedId={params.get(f.key) ?? 'All'}
              onSelect={(v) => set(f.key, v)}
              label={f.label}
              defaultLabel={`Any ${f.label.toLowerCase()}`}
              searchable={f.searchable}
              size="sm"
            />
          ))}
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
          {activeChips.map(({ key, value }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11.5px]"
            >
              <span className="text-muted-foreground">
                {/* eslint-disable-next-line security/detect-object-injection */}
                {SECONDARY_LABEL[key]}:
              </span>
              <span className="font-medium text-foreground">{chipValue(key, value)}</span>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove ${SECONDARY_LABEL[key]} filter`}
                onClick={() => set(key, '')}
                className="h-auto p-0 text-muted-foreground hover:bg-transparent"
              >
                <X size={12} aria-hidden="true" />
              </Button>
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const next = new URLSearchParams(params)
              ;[...PRIMARY, ...SECONDARY, 'search'].forEach((k) => next.delete(k))
              setParams(next, { replace: true })
            }}
            className="h-auto px-2 py-0.5 text-[11.5px] text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
