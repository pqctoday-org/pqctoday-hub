// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryControlDeck — the consolidated control row for the redesign. Search
 * leads; sort, view toggle and an Advanced disclosure sit to its right. Advanced
 * expands the org dropdown, an "authoritative only" toggle, the geo/sector/trust
 * multiselects (passed in), and a reset link. Replaces the live page's sprawling
 * control row + 5-control filter drawer.
 */
import { useState, type ReactNode } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SortControl, type SortOption } from '@/components/Library/SortControl'
import { ViewToggle, type ViewMode } from '@/components/Library/ViewToggle'
import { SemanticSearchHint } from '@/components/common/SemanticSearchHint'
import type { SemanticSearchMode } from '@/services/search/useSemanticSearch'

interface LibraryControlDeckProps {
  search: string
  onSearch: (q: string) => void
  semanticMode: SemanticSearchMode
  semanticLoading: boolean
  semanticHitCount: number
  sortBy: SortOption
  onSort: (s: SortOption) => void
  view: ViewMode
  onView: (v: ViewMode) => void
  orgs: string[]
  activeOrg: string
  onOrg: (o: string) => void
  authOnly: boolean
  onAuthOnly: (v: boolean) => void
  onReset: () => void
  /** geo / sector / trust-tier multiselects, rendered inside the Advanced row. */
  advancedExtra?: ReactNode
}

export function LibraryControlDeck({
  search,
  onSearch,
  semanticMode,
  semanticLoading,
  semanticHitCount,
  sortBy,
  onSort,
  view,
  onView,
  orgs,
  activeOrg,
  onOrg,
  authOnly,
  onAuthOnly,
  onReset,
  advancedExtra,
}: LibraryControlDeckProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={'Search — try "ML-KEM", "FIPS 203", or "hybrid TLS"'}
            aria-label="Search the library"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SortControl value={sortBy} onChange={onSort} />
          <ViewToggle mode={view} onChange={onView} />
          <Button
            type="button"
            variant={advancedOpen ? 'secondary' : 'outline'}
            onClick={() => setAdvancedOpen((o) => !o)}
            aria-expanded={advancedOpen}
            className="h-auto gap-1.5 px-3 py-2 text-[13px]"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Advanced
          </Button>
        </div>
      </div>

      <SemanticSearchHint
        mode={semanticMode}
        loading={semanticLoading}
        query={search}
        semanticHitCount={semanticHitCount}
      />

      {advancedOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <FilterDropdown
            items={['All', ...orgs]}
            selectedId={activeOrg}
            onSelect={onOrg}
            label="Organization"
            defaultLabel="All organizations"
          />
          <Button
            type="button"
            variant={authOnly ? 'secondary' : 'outline'}
            onClick={() => onAuthOnly(!authOnly)}
            aria-pressed={authOnly}
            className="h-auto px-3 py-2 text-[13px]"
          >
            Authoritative sources only
          </Button>
          {advancedExtra}
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="ml-auto h-auto gap-1 px-2 py-2 text-[12.5px] text-muted-foreground"
          >
            <X size={13} aria-hidden="true" />
            Reset filters
          </Button>
        </div>
      )}
    </div>
  )
}
