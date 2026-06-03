// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import type { WorkshopTool } from '../workshopRegistry'
import { DifficultyBadge, WipBadge } from './ToolCard'

type SortKey = 'name' | 'category' | 'difficulty'
type SortDir = 'asc' | 'desc'

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

interface ToolTableProps {
  tools: WorkshopTool[]
}

const SortHeader: React.FC<{
  label: string
  sk: SortKey
  sortKey: SortKey
  onSort: (k: SortKey) => void
  className?: string
}> = ({ label, sk, sortKey, onSort, className }) => (
  <th className={clsx('text-left', className)}>
    <Button
      variant="ghost"
      onClick={() => onSort(sk)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-3 px-4 w-full"
    >
      {label}
      <ArrowUpDown
        size={11}
        aria-hidden="true"
        className={clsx(
          'transition-colors',
          sortKey === sk ? 'text-primary' : 'text-muted-foreground/40'
        )}
      />
    </Button>
  </th>
)

export const ToolTable: React.FC<ToolTableProps> = ({ tools }) => {
  const navigate = useNavigate()
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)
  const toggleMyPlaygroundTool = useBookmarkStore((s) => s.toggleMyPlaygroundTool)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...tools].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'category':
        cmp = a.category.localeCompare(b.category)
        break
      case 'difficulty':
        cmp = (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99)
        break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            <th className="w-8 py-3 px-4" />
            <SortHeader label="Tool" sk="name" sortKey={sortKey} onSort={handleSort} />
            <SortHeader
              label="Category"
              sk="category"
              sortKey={sortKey}
              onSort={handleSort}
              className="hidden md:table-cell"
            />
            <SortHeader
              label="Difficulty"
              sk="difficulty"
              sortKey={sortKey}
              onSort={handleSort}
              className="hidden md:table-cell"
            />
            <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left hidden lg:table-cell">
              Algorithms
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tool) => {
            const Icon = tool.icon
            const isExpanded = expandedIds.has(tool.id)
            const isBookmarked = myPlaygroundTools.includes(tool.id)
            return (
              <React.Fragment key={tool.id}>
                <tr
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleExpand(tool.id)}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown size={14} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} aria-hidden="true" />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span className="font-semibold text-foreground">{tool.name}</span>
                      {tool.wip && <WipBadge />}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {tool.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <DifficultyBadge level={tool.difficulty} />
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {tool.algorithms.slice(0, 3).map((algo) => (
                        <span
                          key={algo}
                          className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {algo}
                        </span>
                      ))}
                      {tool.algorithms.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{tool.algorithms.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMyPlaygroundTool(tool.id)
                        }}
                        className={clsx(
                          'p-1.5 rounded',
                          isBookmarked
                            ? 'text-primary hover:text-primary/80'
                            : 'text-muted-foreground/40 hover:text-primary'
                        )}
                        aria-label={isBookmarked ? 'Remove from My Tools' : 'Add to My Tools'}
                        aria-pressed={isBookmarked}
                      >
                        {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </Button>
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/playground/${tool.id}`)
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-border last:border-0 bg-muted/10">
                    <td />
                    <td colSpan={5} className="py-4 px-4">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {tool.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2 md:hidden">
                        {tool.algorithms.map((algo) => (
                          <span
                            key={algo}
                            className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {algo}
                          </span>
                        ))}
                      </div>
                      {tool.opensourceTool && (
                        <a
                          href={tool.opensourceTool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                          {tool.opensourceTool.name}
                        </a>
                      )}
                      <div className="mt-3">
                        <Link
                          to={`/playground/${tool.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Open {tool.name} →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
