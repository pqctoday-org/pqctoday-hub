// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import FocusLock from 'react-focus-lock'
import { Search, Clock, X, ArrowRight, CornerDownLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { search as searchIndex, getSearchIndex } from '@/services/search/SearchIndex'
import type { SearchResult } from '@/services/search/SearchIndex'
import { chunkToRoute, SOURCE_LABELS, ADVANCED_SOURCES } from '@/data/searchRoutes'
import { useSearchHistoryStore } from '@/store/useSearchHistoryStore'
import { usePersonaStore } from '@/store/usePersonaStore'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const EXAMPLE_QUERIES = [
  'ML-DSA',
  'NIST SP 800-208',
  'ANSSI',
  'certificate lifetime',
  'quantum threat',
]

type GroupedResults = { source: string; label: string; items: SearchResult[] }[]

function groupResults(results: SearchResult[]): GroupedResults {
  const map = new Map<string, SearchResult[]>()
  for (const r of results) {
    const label = SOURCE_LABELS[r.source] ?? r.source
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(r)
  }
  return Array.from(map.entries()).map(([label, items]) => ({
    source: items[0].source,
    label,
    items,
  }))
}

/** React-safe highlighter: splits text around case-insensitive query matches
 * and returns a JSX fragment with <mark> nodes, so React's own escaping
 * handles the text (no dangerouslySetInnerHTML, no HTML-string concat). */
function renderHighlighted(text: string, query: string): React.ReactNode {
  const q = query.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i}>{part}</mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { recentQueries, pushQuery } = useSearchHistoryStore()
  const { selectedPersona, viewAccess } = usePersonaStore()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)

  const curiousLocked = selectedPersona === 'curious' && viewAccess === 'gated'

  // Pre-warm index on mount so it's ready when the user types
  useEffect(() => {
    getSearchIndex().catch(() => undefined)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setError(null)
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Search on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      setActiveIdx(0)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    searchIndex(query, { limit: 60 })
      .then((raw) => {
        if (cancelled) return
        const filtered =
          curiousLocked && !showAdvanced ? raw.filter((r) => !ADVANCED_SOURCES.has(r.source)) : raw
        setResults(filtered)
        setActiveIdx(0)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Search failed', err)
        setResults([])
        setError(err instanceof Error ? err.message : 'Search index failed to load')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query, curiousLocked, showAdvanced])

  // Flat list of all result items for keyboard nav
  const flatItems = useMemo(() => results, [results])

  const navigateTo = useCallback(
    (result: SearchResult, newTab = false) => {
      const route = chunkToRoute(result)
      pushQuery(query)
      onClose()
      if (newTab) {
        window.open(window.location.origin + route, '_blank', 'noopener,noreferrer')
      } else {
        navigate(route)
      }
    },
    [query, navigate, onClose, pushQuery]
  )

  const runRecentQuery = useCallback((q: string) => {
    setQuery(q)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = flatItems[activeIdx]
        if (item) navigateTo(item, e.metaKey || e.ctrlKey)
      }
    },
    [onClose, flatItems, activeIdx, navigateTo]
  )

  // Scroll active item into view
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const grouped = useMemo(() => groupResults(results), [results])

  // Map flat index → result for highlighting
  let flatCounter = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Palette */}
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <FocusLock returnFocus>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ duration: 0.15 }}
                className="glass-panel w-full max-w-2xl max-h-[70dvh] flex flex-col overflow-hidden pointer-events-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Search PQC Today"
                onKeyDown={handleKeyDown}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                  <Search size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={results.length > 0}
                    aria-controls="command-palette-listbox"
                    aria-autocomplete="list"
                    aria-label="Search"
                    placeholder="Search algorithms, standards, timelines…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
                  />
                  {loading && (
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {query && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuery('')}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>

                {/* Results / Recent / Empty */}
                <div
                  id="command-palette-listbox"
                  className="flex-1 overflow-y-auto min-h-0"
                  role="listbox"
                  aria-label="Search results"
                >
                  {!query.trim() ? (
                    /* Recent queries + example queries */
                    <div className="p-3 space-y-4">
                      {recentQueries.length > 0 && (
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 mb-2">
                            Recent
                          </p>
                          {recentQueries.map((q) => (
                            <Button
                              key={q}
                              variant="ghost"
                              onClick={() => runRecentQuery(q)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-left justify-start h-auto"
                            >
                              <Clock size={13} aria-hidden="true" />
                              {q}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 mb-2">
                          Try
                        </p>
                        <div className="flex flex-wrap gap-2 px-2">
                          {EXAMPLE_QUERIES.map((eq) => (
                            <Button
                              key={eq}
                              variant="outline"
                              onClick={() => runRecentQuery(eq)}
                              className="text-xs px-2.5 py-1 rounded-full border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-primary/40 h-auto"
                            >
                              {eq}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : error && !loading ? (
                    /* Error state */
                    <div className="flex flex-col items-center gap-2 py-12 text-center px-6">
                      <Search size={28} className="text-status-error" aria-hidden="true" />
                      <p className="text-sm text-status-error font-medium">Search unavailable</p>
                      <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        Try reloading the page. If the problem persists the search index may need to
                        be regenerated.
                      </p>
                    </div>
                  ) : results.length === 0 && !loading ? (
                    /* No results */
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <Search size={28} className="text-muted-foreground/30" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">
                        No results for{' '}
                        <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
                      </p>
                    </div>
                  ) : (
                    /* Grouped results */
                    <div className="p-2">
                      {grouped.map(({ label, items }) => (
                        <div key={label} className="mb-3">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-3 py-1">
                            {label} ({items.length})
                          </p>
                          {items.map((item) => {
                            const idx = flatCounter++
                            const isActive = idx === activeIdx
                            const snippet = item.content.slice(0, 120).replace(/\n/g, ' ')
                            return (
                              <Button
                                key={item.id}
                                variant="ghost"
                                ref={
                                  isActive
                                    ? (activeItemRef as React.RefObject<HTMLButtonElement>)
                                    : undefined
                                }
                                role="option"
                                aria-selected={isActive}
                                onClick={() => navigateTo(item)}
                                onMouseEnter={() => setActiveIdx(idx)}
                                className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-lg text-left h-auto justify-start transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-muted/30 border border-transparent'
                                }`}
                              >
                                <ArrowRight
                                  size={13}
                                  className={`mt-0.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}
                                  aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {renderHighlighted(item.title, query)}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {snippet}
                                  </p>
                                </div>
                              </Button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border shrink-0 text-[10px] text-muted-foreground gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <ChevronUp size={11} aria-hidden="true" />
                      <ChevronDown size={11} aria-hidden="true" />
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <CornerDownLeft size={11} aria-hidden="true" />
                      open
                    </span>
                    <span>⌘↵ new tab</span>
                  </div>
                  {curiousLocked && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="text-primary h-auto p-0"
                    >
                      {showAdvanced ? 'Hide advanced' : 'Include advanced'}
                    </Button>
                  )}
                  {results.length > 0 && (
                    <span className="ml-auto">
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            </FocusLock>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
