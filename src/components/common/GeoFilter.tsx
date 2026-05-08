// SPDX-License-Identifier: GPL-3.0-only
import { Globe } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownItem } from './FilterDropdown'

export interface GeoOption {
  code: string
  label: string
  group?: string
}

interface GeoFilterProps {
  options: GeoOption[]
  className?: string
}

// PQC overlay geography codes always shown at top
const OVERLAY_OPTIONS: FilterDropdownItem[] = [
  { id: 'PQC-REGION-GLOBAL', label: 'Global / International' },
  { id: 'PQC-REGION-FIVEEYES', label: 'Five Eyes Alliance' },
  { id: 'PQC-REGION-EU', label: 'European Union' },
]

export function GeoFilter({ options, className }: GeoFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.getAll('geo')

  function handleChange(codes: string[]) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('geo')
        for (const c of codes) next.append('geo', c)
        return next
      },
      { replace: true }
    )
  }

  const items: FilterDropdownItem[] = [
    ...OVERLAY_OPTIONS,
    ...options
      .filter((o) => !OVERLAY_OPTIONS.some((oo) => oo.id === o.code))
      .map((o) => ({ id: o.code, label: o.label })),
  ]

  return (
    <FilterDropdown
      items={items}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="All Regions"
      defaultIcon={<Globe size={14} className="text-primary" />}
      searchable={items.length > 8}
      className={className}
    />
  )
}

/** Read geo filter state from URL — returns empty array when unset */
export function useGeoFilter(): string[] {
  const [searchParams] = useSearchParams()
  return searchParams.getAll('geo')
}

/** Returns true when value matches any selected geo code (or no geos selected) */
export function matchesGeoFilter(geoFilter: string[], values: string | string[]): boolean {
  if (geoFilter.length === 0) return true
  const arr = Array.isArray(values) ? values : [values]
  return geoFilter.some((code) => {
    if (code === 'PQC-REGION-GLOBAL')
      return arr.some((v) => /global|international|worldwide/i.test(v))
    if (code === 'PQC-REGION-EU')
      return arr.some((v) => /european union|EU|europe/i.test(v) || v === 'EU')
    if (code === 'PQC-REGION-FIVEEYES')
      return arr.some((v) =>
        [
          'US',
          'GB',
          'AU',
          'CA',
          'NZ',
          'United States',
          'United Kingdom',
          'Australia',
          'Canada',
          'New Zealand',
        ].includes(v)
      )
    return arr.some((v) => v === code || v.toLowerCase() === code.toLowerCase())
  })
}
