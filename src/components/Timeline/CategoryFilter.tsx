// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Building2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FilterDropdown } from '../common/FilterDropdown'
import type { FilterDropdownItem } from '../common/FilterDropdown'
import { timelineData } from '../../data/timelineData'
import type { EntityType } from '../../types/timeline'

// Org-category filter (FR-T-06). Default view = government + standards; vendor
// (commercial products, hardware, blockchain) is hidden until the user opts in.
const CATEGORY_LABELS: Record<EntityType, string> = {
  government: 'Government',
  standards: 'Standards & Consortia',
  vendor: 'Vendors & Ecosystem',
}
export const CATEGORY_DEFAULT: EntityType[] = ['government', 'standards']
const VALID = new Set<EntityType>(['government', 'standards', 'vendor'])

function isEntityType(v: string): v is EntityType {
  return VALID.has(v as EntityType)
}

/** Per-category active-event counts, for the dropdown labels. */
function useCategoryCounts(): Record<EntityType, number> {
  return useMemo(() => {
    const counts: Record<EntityType, number> = { government: 0, standards: 0, vendor: 0 }
    for (const country of timelineData) {
      for (const body of country.bodies) {
        // entityType is a typed union key — safe Record access.

        for (const event of body.events) counts[event.entityType] += 1
      }
    }
    return counts
  }, [])
}

/**
 * Read the category filter from the URL. Absent `?cat=` ⇒ default
 * (government + standards). Present ⇒ exactly the listed categories.
 */
export function useCategoryFilter(): EntityType[] {
  const [searchParams] = useSearchParams()
  if (!searchParams.has('cat')) return CATEGORY_DEFAULT
  return searchParams.getAll('cat').filter(isEntityType)
}

interface CategoryFilterProps {
  className?: string
}

export function CategoryFilter({ className }: CategoryFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const counts = useCategoryCounts()
  const selected = searchParams.has('cat')
    ? searchParams.getAll('cat').filter(isEntityType)
    : CATEGORY_DEFAULT

  const options: FilterDropdownItem[] = (['government', 'standards', 'vendor'] as EntityType[]).map(
    (id) => ({ id, label: `${CATEGORY_LABELS[id]} (${counts[id]})` })
  )

  function handleChange(next: string[]) {
    const cats = next.filter(isEntityType)
    const isDefault =
      cats.length === CATEGORY_DEFAULT.length && CATEGORY_DEFAULT.every((c) => cats.includes(c))
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.delete('cat')
        if (!isDefault) for (const c of cats) p.append('cat', c)
        return p
      },
      { replace: true }
    )
  }

  return (
    <FilterDropdown
      items={options}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="Category"
      defaultIcon={<Building2 size={14} className="text-primary" />}
      className={className}
    />
  )
}

/** True if the event's org category is in the selected set. */
export function matchesCategoryFilter(selected: EntityType[], entityType: EntityType): boolean {
  return selected.includes(entityType)
}
