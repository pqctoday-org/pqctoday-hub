// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import clsx from 'clsx'
import type { LibraryItem } from '../../data/libraryData'
import {
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Sparkles,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import type { SortOption } from './SortControl'
import { StatusBadge } from '../common/StatusBadge'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { LIFECYCLE_STYLES } from '../../utils/libraryLifecycle'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildLibraryEndorsementUrl, buildLibraryFlagUrl } from './libraryEndorsement'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { libraryEnrichments } from '../../data/libraryEnrichmentData'
import { Button } from '@/components/ui/button'
import { resolveLibrarySourceAction } from './librarySourceAction'

interface LibraryTreeTableProps {
  /** Rows in the page pipeline's order (`?sort`); kept as-is unless a header
   *  sort that has no page equivalent (Status) or a reversal is active. */
  data: LibraryItem[]
  /** Opens a document in the page's detail drawer (pushes `?ref`). */
  onOpen: (referenceId: string) => void
  /** The page sort (`?sort`), so the matching header shows as active. */
  sortBy?: SortOption
  /** Header sorts that map to a page sort write it back (`?sort`, replace). */
  onSortChange?: (sort: SortOption) => void
  defaultExpandAll?: boolean
}

type SortDirection = 'asc' | 'desc' | null
type SortKey = keyof LibraryItem

// Table columns ↔ page sort options, and the direction each option sorts in.
const COLUMN_SORT: Partial<Record<SortKey, SortOption>> = {
  referenceId: 'referenceId',
  documentTitle: 'name',
  lastUpdateDate: 'newest',
}
const SORT_DIRECTION: Partial<Record<SortOption, 'asc' | 'desc'>> = {
  referenceId: 'asc',
  name: 'asc',
  newest: 'desc',
}

/**
 * Row identity in the tree is its PATH, not its reference id: a document that
 * builds on two others appears under both, and at the top level too. Keying rows
 * (and expansion) by id alone gave sibling rows the same React key and made
 * expanding one copy expand every copy.
 */
const treePathKey = (parentPath: string, referenceId: string): string =>
  parentPath ? `${parentPath}>${referenceId}` : referenceId

/** Path keys of every row that has in-scope children, i.e. what "Expand All" opens. */
const getAllExpandedIds = (items: LibraryItem[]): Set<string> => {
  const ids = new Set<string>()
  const inScopeIds = new Set(items.map((item) => item.referenceId))

  const traverse = (nodes: LibraryItem[], parentPath: string, ancestors: Set<string>) => {
    nodes.forEach((node) => {
      if (ancestors.has(node.referenceId)) return // cycle
      const children = node.children?.filter((child) => inScopeIds.has(child.referenceId)) ?? []
      if (children.length === 0) return
      const path = treePathKey(parentPath, node.referenceId)
      ids.add(path)
      traverse(children, path, new Set([...ancestors, node.referenceId]))
    })
  }

  traverse(items, '', new Set())
  return ids
}

export const LibraryTreeTable: React.FC<LibraryTreeTableProps> = ({
  data,
  onOpen,
  sortBy,
  onSortChange,
  defaultExpandAll = false,
}) => {
  const { libraryBookmarks, toggleLibraryBookmark } = useBookmarkStore()
  const libraryBookmarkSet = useMemo(() => new Set(libraryBookmarks), [libraryBookmarks])
  // The page's flat selected list also drives its count/export. Global child
  // references may describe dependencies that did not pass those filters.
  const inScopeIds = useMemo(() => new Set(data.map((item) => item.referenceId)), [data])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpandAll) {
      return getAllExpandedIds(data)
    }
    return new Set()
  })

  // Update expansion when defaultExpandAll or data changes
  React.useEffect(() => {
    if (defaultExpandAll) {
      setExpandedIds((prev) => {
        // Merge with existing expanded state to not lose user interactions if any,
        // or just replace? The prompt implied "default" ensures full expansion.
        // But if data updates, we likely want to re-expand everything.
        // To be safe and respect "defaultExpandAll" intent (force open), we replace or union.
        // Replacing ensures verification of "Expand All" behavior.
        const allIds = getAllExpandedIds(data)
        const next = new Set([...prev, ...allIds])
        return next
      })
    }
  }, [defaultExpandAll, data])

  // Local-only header sort: a column with no page sort option (Status), or a
  // reversal of the active page sort. null = the pipeline's own order.
  const [localSort, setLocalSort] = useState<{ key: SortKey; direction: SortDirection } | null>(
    null
  )
  // A new page sort (sort control, Back/Forward) replaces any local override.
  const [prevSortBy, setPrevSortBy] = useState(sortBy)
  if (prevSortBy !== sortBy) {
    setPrevSortBy(sortBy)
    setLocalSort(null)
  }
  const pageSortKey = (Object.keys(COLUMN_SORT) as SortKey[]).find(
    // eslint-disable-next-line security/detect-object-injection
    (k) => COLUMN_SORT[k] === sortBy
  )
  // The header shown as active: a local sort wins, else the page sort's column.
  const sortConfig: { key: SortKey | null; direction: SortDirection } = localSort ?? {
    key: pageSortKey ?? null,
    // eslint-disable-next-line security/detect-object-injection
    direction: sortBy ? (SORT_DIRECTION[sortBy] ?? null) : null,
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleSort = (key: SortKey) => {
    // eslint-disable-next-line security/detect-object-injection
    const option = COLUMN_SORT[key]
    if (option && onSortChange && sortConfig.key !== key) {
      // A column the page can sort by: write `?sort` and show the pipeline order.
      setLocalSort(null)
      onSortChange(option)
      return
    }
    let direction: SortDirection = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setLocalSort({ key, direction })
  }

  const handleDetailsClick = (item: LibraryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    onOpen(item.referenceId)
  }

  const sortItems = (items: LibraryItem[]): LibraryItem[] => {
    const key = sortConfig.key
    if (!sortConfig.direction || !key) return items

    const sorted = [...items].sort((a, b) => {
      // The date column shows the update date, else the publication date: sort by that.
      if (key === 'lastUpdateDate') {
        const ad = a.lastUpdateDate || a.initialPublicationDate || ''
        const bd = b.lastUpdateDate || b.initialPublicationDate || ''
        return ad.localeCompare(bd)
      }
      // eslint-disable-next-line security/detect-object-injection
      const aValue = a[key]
      // eslint-disable-next-line security/detect-object-injection
      const bValue = b[key]

      if (aValue === undefined || bValue === undefined) return 0

      // Handle arrays (like applicableIndustries)
      const aString = Array.isArray(aValue) ? aValue.join(', ') : String(aValue)
      const bString = Array.isArray(bValue) ? bValue.join(', ') : String(bValue)

      return aString.localeCompare(bString, undefined, { numeric: true })
    })

    return sortConfig.direction === 'asc' ? sorted : sorted.reverse()
  }

  // Root rows keep the pipeline order (`?sort`) unless a local header sort is
  // active; the pipeline's own sort already matches the page sort's column.
  // R-003: Memoize sorted data to prevent unnecessary re-renders
  const sortedData = React.useMemo(
    () => (localSort ? sortItems(data) : data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, localSort]
  )

  // Recursive render function - uses sortedData at root level
  const renderRows = (
    items: LibraryItem[],
    level = 0,
    visited = new Set<string>(),
    isRoot = false,
    parentPath = ''
  ) => {
    const itemsToRender = isRoot ? sortedData : sortItems(items)

    return itemsToRender.flatMap((item) => {
      // Basic cycle detection for rendering
      if (visited.has(item.referenceId)) return []

      const newVisited = new Set(visited)
      newVisited.add(item.referenceId)

      const pathKey = treePathKey(parentPath, item.referenceId)
      const isExpanded = expandedIds.has(pathKey)
      const children = item.children?.filter((child) => inScopeIds.has(child.referenceId)) ?? []
      const hasChildren = children.length > 0
      const sourceAction = resolveLibrarySourceAction(item)

      const rows = [
        <tr
          key={pathKey}
          data-deeplink-id={item.referenceId}
          className="border-b border-border hover:bg-muted/50 transition-colors group cursor-pointer"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(item.referenceId)
            }
          }}
          onClick={() => onOpen(item.referenceId)}
        >
          <td
            className="p-4 text-sm font-medium text-foreground max-w-0"
            style={{ paddingLeft: `${level * 20 + 16}px` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(pathKey)
                  }}
                  className="shrink-0 p-1 hover:bg-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? `Collapse ${item.documentTitle}` : `Expand ${item.documentTitle}`
                  }
                >
                  {isExpanded ? (
                    <ChevronDown size={16} aria-hidden="true" className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />
                  )}
                </Button>
              ) : (
                <span className="w-6 shrink-0" /> // Spacer
              )}
              <span className="font-mono text-primary/80 truncate block" title={item.referenceId}>
                {item.referenceId}
              </span>
            </div>
          </td>
          <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              {item.documentTitle}
              {sourceAction.href && (
                <a
                  href={sourceAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={sourceAction.description}
                  className="text-primary/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  aria-label={`${sourceAction.label}: ${item.documentTitle}`}
                >
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              <StatusBadge status={item.status} size="sm" />
              <TrustScoreBadge resourceType="library" resourceId={item.referenceId} size="sm" />
            </div>
          </td>
          <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <span
              className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider',
                LIFECYCLE_STYLES[item.lifecycleLabel].badge
              )}
              title={item.documentStatus}
            >
              {LIFECYCLE_STYLES[item.lifecycleLabel].label}
            </span>
          </td>
          <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {/* The date "Newest first" sorts by: the catalogue update, else the
                document's publication date (labelled), else a dash. */}
            {item.lastUpdateDate ? (
              item.lastUpdateDate
            ) : item.initialPublicationDate ? (
              <span title="No catalogue update recorded; this is the document's publication date">
                Published {item.initialPublicationDate}
              </span>
            ) : (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">No date recorded</span>
              </>
            )}
          </td>
          <td className="p-4 text-sm">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const enriched = !!libraryEnrichments[item.referenceId]
                return (
                  <Button
                    variant="ghost"
                    onClick={(e) => handleDetailsClick(item, e)}
                    className={clsx(
                      'p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                      enriched
                        ? 'text-primary hover:text-primary/80 hover:bg-primary/10'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                    )}
                    title={enriched ? 'View details (document analysis available)' : 'View details'}
                    aria-label={`View details for ${item.documentTitle}`}
                  >
                    {enriched ? (
                      <Sparkles size={16} aria-hidden="true" />
                    ) : (
                      <Info size={16} aria-hidden="true" />
                    )}
                  </Button>
                )
              })()}
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLibraryBookmark(item.referenceId)
                }}
                className="p-1 rounded hover:bg-muted/50 transition-colors"
                aria-label={
                  libraryBookmarkSet.has(item.referenceId)
                    ? `Remove ${item.referenceId} bookmark`
                    : `Bookmark ${item.referenceId}`
                }
                title={libraryBookmarkSet.has(item.referenceId) ? 'Remove bookmark' : 'Bookmark'}
              >
                {libraryBookmarkSet.has(item.referenceId) ? (
                  <BookmarkCheck size={16} className="text-primary" />
                ) : (
                  <Bookmark size={16} className="text-muted-foreground" />
                )}
              </Button>
              <EndorseButton
                endorseUrl={buildLibraryEndorsementUrl(item)}
                resourceLabel={item.referenceId}
                resourceType="Library"
              />
              <FlagButton
                flagUrl={buildLibraryFlagUrl(item)}
                resourceLabel={item.referenceId}
                resourceType="Library"
              />
            </div>
          </td>
        </tr>,
      ]

      if (isExpanded && hasChildren) {
        rows.push(...renderRows(children, level + 1, newVisited, false, pathKey))
      }

      return rows
    })
  }

  const headers: { key: SortKey | 'actions'; label: string; width?: string }[] = [
    { key: 'referenceId', label: 'Reference ID', width: 'w-56 xl:w-64' },
    { key: 'documentTitle', label: 'Title', width: 'w-auto' },
    // Sorts by the lifecycle label the column shows, not the raw publisher status.
    { key: 'lifecycleLabel', label: 'Status', width: 'w-36' },
    { key: 'lastUpdateDate', label: 'Catalog update', width: 'w-36' },
    { key: 'actions', label: '', width: 'w-28' },
  ]

  return (
    <>
      <div className="glass-panel bg-card backdrop-blur-none border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] overflow-hidden">
        {/* A-003: Added aria-controls for expand/collapse buttons */}
        <div className="px-4 py-2 flex items-center justify-between bg-muted/20 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Document Tree
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                const ids = getAllExpandedIds(data)
                setExpandedIds(ids)
              }}
              aria-controls="library-table"
              className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
            >
              <ChevronDown size={14} aria-hidden="true" /> Expand All
            </Button>
            <Button
              variant="ghost"
              onClick={() => setExpandedIds(new Set())}
              aria-controls="library-table"
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight size={14} aria-hidden="true" /> Collapse All
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table id="library-table" className="w-full text-left border-collapse table-fixed">
            <caption className="sr-only">
              Library of standards and specifications organized hierarchically by reference ID.
              Sortable columns: Title, Status, Catalog update.
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {headers.map((header) => (
                  <th
                    key={header.key as string}
                    scope="col"
                    aria-sort={
                      sortConfig.key === header.key
                        ? sortConfig.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className={clsx('p-4 font-semibold text-sm', header.width)}
                  >
                    {header.key !== 'actions' ? (
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 -ml-1 text-left"
                        onClick={() => handleSort(header.key as SortKey)}
                      >
                        {header.label}
                        {sortConfig.key === header.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={14} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={14} aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown
                            size={14}
                            className="text-muted-foreground/50 group-hover:text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    ) : (
                      header.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderRows(data, 0, new Set(), true)}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}
