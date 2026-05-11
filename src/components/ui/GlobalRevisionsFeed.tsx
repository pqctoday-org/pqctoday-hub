// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { GitMerge, Bot, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRevisions, byRecord, type RevisionEntry } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'
import { BypassChip } from '@/components/ui/BypassChip'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { conceptXwalkData } from '@/data/conceptXwalkData'

// Label lookup: pt_id / moduleId / xwalkId → human-readable name. Built lazily to avoid circular dependency crashes.
let entityLabelsCache: Map<string, string> | null = null
function getEntityLabels(): Map<string, string> {
  if (entityLabelsCache) return entityLabelsCache
  const m = new Map<string, string>()
  if (WORKSHOP_TOOLS) for (const t of WORKSHOP_TOOLS) m.set(t.pt_id, t.name)
  if (MODULE_CATALOG) for (const [id, mod] of Object.entries(MODULE_CATALOG)) m.set(id, mod.title)
  if (conceptXwalkData)
    for (const x of conceptXwalkData) m.set(x.xwalkId, `${x.fromConcept} → ${x.toConcept}`)
  entityLabelsCache = m
  return m
}

const ALL_DOMAINS = ['module', 'tool', 'library', 'compliance', 'migrate', 'threats', 'algorithms']

interface GlobalRevisionsFeedProps {
  /** Limit to specific domains; omit for all */
  domains?: string[]
  /** Maximum entries to show before "load more" */
  pageSize?: number
  className?: string
  /** When set, show only revisions for this entity */
  entityFilter?: string
  /** Domain for entityFilter */
  domainFilter?: string
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  } catch {
    return iso.slice(0, 10)
  }
}

function DomainChip({
  domain,
  active,
  onClick,
}: {
  domain: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`px-2 py-0.5 h-auto rounded text-xs capitalize transition-colors ${
        active
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
      }`}
    >
      {domain}
    </Button>
  )
}

const CHIP_COLORS: Record<string, string> = {
  module: 'bg-accent/10 text-accent border-accent/30',
  tool: 'bg-primary/10 text-primary border-primary/30',
  library: 'bg-secondary/10 text-secondary border-secondary/30',
  compliance: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  threats: 'bg-status-error/10 text-status-error border-status-error/30',
}

function EntityChips({ ids, domain }: { ids: string[]; domain: string }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? ids : ids.slice(0, 6)
  const overflow = ids.length - 6
  const cls = CHIP_COLORS[domain] ?? 'bg-muted text-muted-foreground border-border'

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {visible.map((id) => {
        const label = getEntityLabels().get(id)
        return (
          <div key={id} className="relative group">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/revisions?domain=${domain}&entity=${encodeURIComponent(id)}`)
              }}
              className={`h-auto text-[10px] px-1.5 py-0.5 rounded border font-mono hover:opacity-80 transition-opacity ${cls}`}
            >
              {id}
            </Button>
            {label && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-max max-w-[220px] px-2 py-1 rounded bg-card border border-border text-[10px] text-foreground shadow-lg text-center leading-tight">
                  {label}
                </div>
              </div>
            )}
          </div>
        )
      })}
      {!expanded && overflow > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(true)
          }}
          className="h-auto text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground"
        >
          +{overflow} more
        </Button>
      )}
    </div>
  )
}

function FeedEntry({ r }: { r: RevisionEntry }) {
  const offlineSuffix =
    r.approval_method === 'offline' && r.approved_via ? ` · via ${r.approved_via}` : ''

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0">
        {r.authored_by_llm ? (
          <Bot className="w-4 h-4 text-accent" aria-label="LLM-authored" />
        ) : (
          <GitMerge className="w-4 h-4 text-status-success" aria-label="Human-reviewed" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-foreground">{r.reviewer_display}</span>
          <span className="text-xs text-muted-foreground capitalize">{r.domain}</span>
          <span className="text-xs text-muted-foreground">{r.change_type.replace(/_/g, ' ')}</span>
          <BypassChip revision={r} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.scope_summary}</p>
        {r.record_ids && r.record_ids.length > 0 && (
          <EntityChips ids={r.record_ids} domain={r.domain} />
        )}
        <div className="flex items-center gap-2 mt-1">
          {r.pr_number > 0 ? (
            <a
              href={`https://github.com/pqctoday-org/pqctoday-hub/pull/${r.pr_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              PR #{r.pr_number}
            </a>
          ) : r.merge_sha && r.merge_sha !== 'baseline' ? (
            <a
              href={`https://github.com/pqctoday-org/pqctoday-hub/commit/${r.merge_sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-mono"
            >
              {r.merge_sha.slice(0, 7)}
            </a>
          ) : null}
          {offlineSuffix && <span className="text-xs text-muted-foreground">{offlineSuffix}</span>}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatRelative(r.merge_timestamp)}
      </span>
    </div>
  )
}

export function GlobalRevisionsFeed({
  domains,
  pageSize = 20,
  className = '',
  entityFilter,
  domainFilter,
}: GlobalRevisionsFeedProps) {
  const navigate = useNavigate()
  const { revisions, isLoading } = useRevisions()
  const availableDomains = domains ?? ALL_DOMAINS
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set(availableDomains))
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (entityFilter) {
      return byRecord(revisions, domainFilter ?? '', entityFilter).filter(
        (r) => r.merge_sha !== 'baseline'
      )
    }
    return revisions.filter(
      (r) => r.merge_sha !== 'baseline' && (activeDomains.size === 0 || activeDomains.has(r.domain))
    )
  }, [revisions, activeDomains, entityFilter, domainFilter])

  const visible = filtered.slice(0, page * pageSize)
  const hasMore = visible.length < filtered.length

  function toggleDomain(d: string) {
    setActiveDomains((prev) => {
      const next = new Set(prev)
      if (next.has(d)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(d)
      } else {
        next.add(d)
      }
      return next
    })
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {entityFilter ? (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/revisions')}
            className="h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All revisions
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-foreground">{entityFilter}</span>
          {domainFilter && (
            <span className="text-xs text-muted-foreground capitalize">({domainFilter})</span>
          )}
        </div>
      ) : (
        availableDomains.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {availableDomains.map((d) => (
              <DomainChip
                key={d}
                domain={d}
                active={activeDomains.has(d)}
                onClick={() => toggleDomain(d)}
              />
            ))}
          </div>
        )
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No revision records.</p>
      ) : (
        <div>
          {visible.map((r, i) => (
            <FeedEntry key={`${r.pr_number}-${i}`} r={r} />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more ({filtered.length - visible.length} remaining)
        </Button>
      )}

      {!hasMore && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">
          All {filtered.length} revision{filtered.length !== 1 ? 's' : ''} shown
        </p>
      )}
    </div>
  )
}
