// SPDX-License-Identifier: GPL-3.0-only
import { Building2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownItem } from './FilterDropdown'

export interface SectorOption {
  code: string
  label: string
}

interface SectorFilterProps {
  options?: SectorOption[]
  className?: string
}

// NAICS 2-digit group labels relevant to PQC — used when no custom options provided
export const NAICS_LABELS: Record<string, string> = {
  '22': 'Energy & Utilities',
  '44': 'Retail Trade',
  '45': 'Retail Trade',
  '48': 'Transportation',
  '49': 'Transportation',
  '51': 'Information Technology',
  '52': 'Finance & Insurance',
  '54': 'Professional & Technical Services',
  '56': 'Administrative & Support Services',
  '61': 'Educational Services',
  '62': 'Healthcare & Life Sciences',
  '91': 'Government & Defense',
  '92': 'Public Administration',
}

const DEFAULT_SECTOR_OPTIONS: FilterDropdownItem[] = [
  { id: '52', label: 'Finance & Insurance' },
  { id: '92', label: 'Public Administration' },
  { id: '54', label: 'Professional & Technical Services' },
  { id: '51', label: 'Information Technology' },
  { id: '62', label: 'Healthcare & Life Sciences' },
  { id: '22', label: 'Energy & Utilities' },
  { id: '48', label: 'Transportation' },
  { id: '56', label: 'Administrative & Support Services' },
  { id: '91', label: 'Government & Defense' },
  { id: 'PQC-SECTOR-HSM-VENDOR', label: 'HSM / Crypto Hardware' },
  { id: 'PQC-SECTOR-CLOUD-KMS', label: 'Cloud Key Management' },
  { id: 'PQC-SECTOR-PQCLIB-VENDOR', label: 'PQC Library / SDK Vendor' },
]

// Freeform industry strings that map to NAICS 2-digit groups
export const INDUSTRY_TO_NAICS: Record<string, string[]> = {
  '52': ['Finance & Banking', 'Finance & Insurance', 'Banking', 'financial'],
  '92': ['Government & Defense', 'Government', 'Defense', 'Public Administration', 'Federal'],
  '54': ['Technology', 'Professional Services', 'Consulting', 'Legal'],
  '51': ['Technology', 'Information Technology', 'Software', 'IT'],
  '62': ['Healthcare', 'Life Sciences', 'Medical', 'Health'],
  '22': ['Energy & Utilities', 'Energy', 'Utilities', 'Oil & Gas'],
  '48': ['Transportation', 'Logistics', 'Aviation', 'Maritime'],
  '56': ['Administrative', 'Support Services'],
  '91': ['Government & Defense', 'Defense', 'Military', 'National Security'],
}

export function SectorFilter({ options, className }: SectorFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.getAll('sector')

  function handleChange(codes: string[]) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('sector')
        for (const c of codes) next.append('sector', c)
        return next
      },
      { replace: true }
    )
  }

  const items: FilterDropdownItem[] = options
    ? options.map((o) => ({ id: o.code, label: o.label }))
    : DEFAULT_SECTOR_OPTIONS

  return (
    <FilterDropdown
      items={items}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="All Sectors"
      defaultIcon={<Building2 size={14} className="text-primary" />}
      className={className}
    />
  )
}

/**
 * Resolve a freeform industry string (e.g. "Finance & Banking", from a URL
 * param or persona store using a non-NAICS taxonomy) to a NAICS 2-digit code
 * if a known alias exists. Returns the input unchanged when it's already a
 * NAICS code or has no alias mapping.
 */
export function resolveToNaics(value: string): string {
  if (!value || value === 'All') return value
  // Already a NAICS code present in our label table
  if (Object.prototype.hasOwnProperty.call(NAICS_LABELS, value)) return value
  const lower = value.toLowerCase()
  for (const [code, aliases] of Object.entries(INDUSTRY_TO_NAICS)) {
    if (aliases.some((alias) => alias.toLowerCase() === lower)) return code
  }
  return value
}

/** Read sector filter state from URL — returns empty array when unset */
export function useSectorFilter(): string[] {
  const [searchParams] = useSearchParams()
  return searchParams.getAll('sector')
}

/** Returns true when value matches any selected sector code (or no sectors selected) */
export function matchesSectorFilter(sectorFilter: string[], values: string | string[]): boolean {
  if (sectorFilter.length === 0) return true
  const arr = Array.isArray(values) ? values : [values]
  return sectorFilter.some((code) => {
    if (code.startsWith('PQC-')) {
      return arr.some((v) => v.toLowerCase().includes(code.toLowerCase()))
    }
    // Match NAICS 2-digit code against freeform industry strings
    const aliases = INDUSTRY_TO_NAICS[code] ?? []
    return arr.some(
      (v) => v === code || aliases.some((alias) => v.toLowerCase().includes(alias.toLowerCase()))
    )
  })
}
