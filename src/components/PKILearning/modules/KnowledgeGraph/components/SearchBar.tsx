// SPDX-License-Identifier: GPL-3.0-only

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ENTITY_CONFIG } from './nodes/EntityNode'
import type { SearchResult } from '../data/searchIndex'
import type { SuggestedQuery } from '../data/suggestedQueries'
import type { EntityType } from '../data/graphTypes'

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  results: SearchResult[]
  onSelectResult: (resultId: string) => void
  suggestedQueries: SuggestedQuery[]
  centered?: boolean
}

export function SearchBar({
  query,
  onQueryChange,
  results,
  onSelectResult,
  suggestedQueries,
  centered = false,
}: SearchBarProps) {
  // dismissed tracks whether the user explicitly closed the dropdown (click-outside or result-select)
  // It's reset whenever the query changes so new results re-open the dropdown.
  const [dismissed, setDismissed] = useState(false)
  const showResults = results.length > 0 && query.length > 0 && !dismissed
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        setDismissed(true)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQueryChange = useCallback(
    (value: string) => {
      setDismissed(false)
      onQueryChange(value)
    },
    [onQueryChange]
  )

  return (
    <div ref={containerRef} className={`relative ${centered ? 'max-w-lg mx-auto' : 'w-full'}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setDismissed(false)}
          placeholder="Search standards, algorithms, modules, threats..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => handleQueryChange('')}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Suggested queries (shown when no query) */}
      {!query && suggestedQueries.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {suggestedQueries.map((sq) => (
            <Button
              key={sq.query}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQueryChange(sq.query)}
              title={sq.description}
            >
              {sq.label}
            </Button>
          ))}
        </div>
      )}

      {/* Search results dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((result) => {
            const config = ENTITY_CONFIG[result.entityType as EntityType]
            const Icon = config?.icon ?? Search
            const textColor = config?.text ?? 'text-muted-foreground'

            return (
              <Button
                variant="ghost"
                key={result.id}
                className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                onClick={() => {
                  onSelectResult(result.id)
                  setDismissed(true)
                }}
              >
                <Icon className={`w-4 h-4 shrink-0 ${textColor}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{result.label}</div>
                  {result.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {result.description}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] ${textColor} shrink-0`}>{result.entityType}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {result.connectionCount} links
                </span>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
