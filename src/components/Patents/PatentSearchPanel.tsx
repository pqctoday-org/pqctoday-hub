// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useRef, useState } from 'react'
import MiniSearch from 'minisearch'
import { Search, X, ExternalLink, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { PatentItem } from '@/types/PatentTypes'
import { logPatentSearch, logPatentView } from '@/utils/analytics'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchDoc {
  patentNumber: string
  title: string
  assignee: string
  summary: string
  claim: string
  algos: string
  domain: string
  protocols: string
  qtechnology: string
  threatModel: string
  standards: string
}

interface PatentSearchResult {
  patent: PatentItem
  score: number
  matchedFields: string[]
}

interface PatentSearchPanelProps {
  patents: PatentItem[]
  onSelectPatent: (id: string) => void
}

// ── MiniSearch index (built once per patent array reference) ──────────────────

const FIELDS: (keyof SearchDoc)[] = [
  'title',
  'assignee',
  'summary',
  'claim',
  'algos',
  'domain',
  'protocols',
  'qtechnology',
  'threatModel',
  'standards',
]

const FIELD_BOOSTS: Partial<Record<keyof SearchDoc, number>> = {
  title: 4,
  assignee: 3,
  algos: 2.5,
  summary: 2,
  claim: 2,
  domain: 1.5,
  protocols: 1.5,
  qtechnology: 1.5,
  standards: 1.2,
  threatModel: 1,
}

function buildIndex(patents: PatentItem[]): MiniSearch<SearchDoc> {
  const idx = new MiniSearch<SearchDoc>({
    idField: 'patentNumber',
    fields: FIELDS,
    storeFields: ['patentNumber'],
    searchOptions: {
      boost: FIELD_BOOSTS,
      fuzzy: 0.2,
      prefix: true,
    },
  })
  const docs: SearchDoc[] = patents.map((p) => ({
    patentNumber: p.patentNumber,
    title: p.title,
    assignee: p.assignee,
    summary: p.summary,
    claim: p.primaryInventiveClaim,
    algos: [...p.pqcAlgorithms, ...p.classicalAlgorithms].join(' '),
    domain: p.applicationDomain.join(' '),
    protocols: p.protocols.join(' '),
    qtechnology: p.quantumTechnology.join(' '),
    threatModel: p.threatModel.join(' '),
    standards: p.standardsReferenced.join(' '),
  }))
  idx.addAll(docs)
  return idx
}

// ── Example queries ───────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  'ML-KEM key encapsulation',
  'IBM lattice hybrid TLS',
  'TPM hardware migration',
  'SPHINCS hash-based signature',
  'QuSecure quantum PKI',
  'ECDSA secp256k1 replacement',
]

// ── Highlight helper ──────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(text: string, query: string): string {
  if (!query.trim() || !text) return escapeHtml(text)
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (words.length === 0) return escapeHtml(text)
  const pattern = new RegExp(`(${words.join('|')})`, 'gi')
  return escapeHtml(text).replace(
    new RegExp(pattern.source, 'gi'),
    '<mark class="bg-primary/20 text-primary rounded px-0.5">$1</mark>'
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PatentSearchPanel({ patents, onSelectPatent }: PatentSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isBuilding, setIsBuilding] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const analyticsRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build index from patents (memoized by patents reference)
  const index = useMemo(() => buildIndex(patents), [patents])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: clear loading state after the (heavy) index rebuild settles
    setIsBuilding(false)
  }, [index])

  // Lookup map
  const patentMap = useMemo(() => {
    const m = new Map<string, PatentItem>()
    patents.forEach((p) => m.set(p.patentNumber, p))
    return m
  }, [patents])

  // Debounce query → debouncedQuery
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Analytics: fire 600ms after last keystroke (same cadence as PatentsTable)
  useEffect(() => {
    if (analyticsRef.current) clearTimeout(analyticsRef.current)
    if (debouncedQuery.trim().length >= 3) {
      analyticsRef.current = setTimeout(() => logPatentSearch(debouncedQuery), 600)
    }
    return () => {
      if (analyticsRef.current) clearTimeout(analyticsRef.current)
    }
  }, [debouncedQuery])

  // Search
  const results = useMemo<PatentSearchResult[]>(() => {
    const q = debouncedQuery.trim()
    if (!q || q.length < 2) return []
    const raw = index.search(q).slice(0, 30)
    return raw
      .map((r) => {
        const patent = patentMap.get(r.id as string)
        if (!patent) return null
        return {
          patent,
          score: r.score,
          matchedFields: Object.keys(r.match),
        } satisfies PatentSearchResult
      })
      .filter(Boolean) as PatentSearchResult[]
  }, [debouncedQuery, index, patentMap])

  const showEmpty = debouncedQuery.trim().length >= 2 && results.length === 0 && !isBuilding
  const showResults = results.length > 0

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'Search patents — e.g. “ML-KEM key management” or “IBM lattice hybrid”'}
          className="pl-9 pr-9"
          aria-label="Patent natural-language search"
          disabled={isBuilding}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- search panel auto-focus is intentional UX
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* Loading skeleton */}
      {isBuilding && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Example chips (shown when query is empty) */}
      {!isBuilding && !query && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Zap size={12} className="text-primary" aria-hidden="true" />
            Try a query or click an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <Button
                key={q}
                variant="ghost"
                size="sm"
                onClick={() => setQuery(q)}
                className="text-xs h-auto px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors"
              >
                {q}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Searches across{' '}
            <span className="text-foreground font-medium">{patents.length.toLocaleString()}</span>{' '}
            patents — title, assignee, summary, claims, algorithms, protocols, and standards. Index
            is built locally; no data leaves your browser.
          </p>
        </div>
      )}

      {/* Result count */}
      {showResults && (
        <p className="text-xs text-muted-foreground shrink-0">
          <span className="text-foreground font-medium">{results.length}</span> result
          {results.length !== 1 ? 's' : ''} for{' '}
          <span className="text-primary font-medium">&ldquo;{debouncedQuery}&rdquo;</span>
          {results.length === 30 ? ' — showing top 30' : ''}
        </p>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Search size={28} className="text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No patents matched{' '}
            <span className="text-foreground">&ldquo;{debouncedQuery}&rdquo;</span>
          </p>
          <p className="text-xs text-muted-foreground/70">
            Try broader terms — algorithm name, assignee, or protocol
          </p>
        </div>
      )}

      {/* Results list */}
      {showResults && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {results.map(({ patent, score, matchedFields }) => (
            <PatentResultCard
              key={patent.patentNumber}
              patent={patent}
              score={score}
              matchedFields={matchedFields}
              query={debouncedQuery}
              onSelect={(id) => {
                logPatentView(id)
                onSelectPatent(id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────

interface PatentResultCardProps {
  patent: PatentItem
  score: number
  matchedFields: string[]
  query: string
  onSelect: (id: string) => void
}

const FIELD_LABEL: Partial<Record<string, string>> = {
  title: 'title',
  assignee: 'assignee',
  algos: 'algorithms',
  summary: 'summary',
  claim: 'claim',
  domain: 'domain',
  protocols: 'protocols',
  qtechnology: 'technology',
  standards: 'standards',
  threatModel: 'threat model',
}

function PatentResultCard({
  patent,
  score,
  matchedFields,
  query,
  onSelect,
}: PatentResultCardProps) {
  const summarySnippet = useMemo(() => {
    const text = patent.summary || patent.primaryInventiveClaim || ''
    return text.length > 220 ? text.slice(0, 220) + '…' : text
  }, [patent])

  const highlightedTitle = useMemo(() => highlight(patent.title, query), [patent.title, query])
  const highlightedSummary = useMemo(
    () => highlight(summarySnippet, query),
    [summarySnippet, query]
  )

  const matchLabels = matchedFields
    .map((f) => FIELD_LABEL[f])
    .filter(Boolean)
    .slice(0, 4)

  const topAlgos = patent.pqcAlgorithms.slice(0, 4)
  const scoreBar = Math.min(100, Math.round((score / 20) * 100))

  return (
    <div
      className="glass-panel p-3.5 flex flex-col gap-2 hover:border-primary/40 transition-colors cursor-pointer group"
      onClick={() => onSelect(patent.patentNumber)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(patent.patentNumber)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Number + assignee */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              US {patent.patentNumber}
            </span>
            {patent.assignee && (
              <span className="text-[10px] font-medium text-secondary truncate max-w-[200px]">
                {patent.assignee}
              </span>
            )}
            {patent.issueDate && (
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                {patent.issueDate.slice(0, 7)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-sm font-medium text-foreground leading-snug line-clamp-2"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
        </div>

        {/* Score + impact */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              patent.impactLevel === 'High'
                ? 'bg-status-error/15 text-status-error'
                : patent.impactLevel === 'Medium'
                  ? 'bg-status-warning/15 text-status-warning'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {patent.impactLevel}
          </span>
          <div
            className="h-1 w-12 rounded-full bg-muted overflow-hidden"
            title={`Relevance score: ${score.toFixed(1)}`}
          >
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${scoreBar}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {summarySnippet && (
        <p
          className="text-xs text-muted-foreground leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: highlightedSummary }}
        />
      )}

      {/* Footer: algorithms + matched fields + actions */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {topAlgos.map((a) => (
            <span
              key={a}
              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
            >
              {a}
            </span>
          ))}
          {matchLabels.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60">
              matched: {matchLabels.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`https://patents.google.com/patent/US${patent.patentNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-muted-foreground hover:text-foreground"
            title="Open on Google Patents"
            aria-label="Open on Google Patents"
          >
            <ExternalLink size={12} />
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-0.5"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(patent.patentNumber)
            }}
            aria-label={`View details for patent ${patent.patentNumber}`}
          >
            Details
            <ChevronRight size={11} />
          </Button>
        </div>
      </div>
    </div>
  )
}
