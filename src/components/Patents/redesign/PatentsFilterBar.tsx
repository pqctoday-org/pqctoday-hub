// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentsFilterBar — the consolidated Explore filter bar. Search leads; four
 * primary dropdowns (Region / Agility / Impact / Domain); a live "Showing N of M"
 * count; and the Essential/Algorithms/Full column-preset control. A second row
 * holds removable chips for any secondary filters that arrived from the dashboard.
 * Reads/writes the same URL params the pipeline (usePatentResults) reads.
 */
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ColumnPicker } from '@/components/Patents/ColumnPicker'
import { inferRegion, NIST_STATUS_LABELS } from '@/components/Patents/PatentsInsights'
import type { PatentItem } from '@/types/PatentTypes'
import type { ColumnId, PresetKey } from '@/components/Patents/patentColumns'

const PRIMARY = ['region', 'agility', 'impact', 'domain'] as const
const SECONDARY = [
  'assignee',
  'quantumTech',
  'quantumRelevance',
  'protocol',
  'classicalAlgorithm',
  'hardwareComponent',
  'nistStatus',
  'pqc',
  'fips',
  'filingYear',
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
  quantumTech: 'Quantum tech',
  quantumRelevance: 'Q. relevance',
  protocol: 'Protocol',
  classicalAlgorithm: 'Classical',
  hardwareComponent: 'Hardware',
  nistStatus: 'NIST',
  pqc: 'PQC algo',
  fips: 'FIPS',
  filingYear: 'Filed',
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
  const [params, setParams] = useSearchParams()

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'All') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const regionOpts = useMemo(
    () => ['All', ...[...new Set(patents.map((p) => inferRegion(p.assignee)))].sort()],
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

  const activeChips = SECONDARY.map((key) => ({ key, value: params.get(key) ?? '' })).filter(
    (c) => c.value
  )

  const search = params.get('search') ?? ''

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
        <FilterDropdown
          items={regionOpts}
          selectedId={params.get('region') ?? 'All'}
          onSelect={(v) => set('region', v)}
          label="Region"
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
        <span className="ml-auto shrink-0 text-[12.5px] text-muted-foreground tabular-nums">
          Showing <span className="font-semibold text-foreground">{count}</span> of {total}
        </span>
        <ColumnPicker
          preset={columnPreset}
          visibleColumns={visibleColumns}
          onPresetChange={onPresetChange}
          onColumnsChange={onColumnsChange}
        />
      </div>

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
              <span className="font-medium text-foreground">
                {key === 'nistStatus'
                  ? // eslint-disable-next-line security/detect-object-injection
                    (NIST_STATUS_LABELS[value] ?? value)
                  : key === 'fips'
                    ? 'FIPS 203/4/5'
                    : value}
              </span>
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
