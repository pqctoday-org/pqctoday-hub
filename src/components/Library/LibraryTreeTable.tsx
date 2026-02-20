import React, { useState } from 'react'
import clsx from 'clsx'
import type { LibraryItem } from '../../data/libraryData'
import {
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Info,
} from 'lucide-react'
import { LibraryDetailPopover } from './LibraryDetailPopover'
import { StatusBadge } from '../common/StatusBadge'

interface LibraryTreeTableProps {
  data: LibraryItem[]
  defaultSort?: { key: SortKey; direction: SortDirection }
  defaultExpandAll?: boolean
}

type SortDirection = 'asc' | 'desc' | null
type SortKey = keyof LibraryItem

const getAllExpandedIds = (items: LibraryItem[]): Set<string> => {
  const ids = new Set<string>()
  const visited = new Set<string>()

  const traverse = (nodes: LibraryItem[]) => {
    nodes.forEach((node) => {
      if (visited.has(node.referenceId)) return
      visited.add(node.referenceId)

      if (node.children && node.children.length > 0) {
        ids.add(node.referenceId)
        traverse(node.children)
      }
    })
  }

  traverse(items)
  return ids
}

export const LibraryTreeTable: React.FC<LibraryTreeTableProps> = ({
  data,
  defaultSort,
  defaultExpandAll = false,
}) => {
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

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>(
    defaultSort || { key: 'referenceId', direction: 'asc' }
  )
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)

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
    let direction: SortDirection = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDetailsClick = (item: LibraryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedItem(item)
  }

  const sortItems = (items: LibraryItem[]): LibraryItem[] => {
    if (!sortConfig.direction) return items

    const sorted = [...items].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === undefined || bValue === undefined) return 0

      // Handle arrays (like applicableIndustries)
      const aString = Array.isArray(aValue) ? aValue.join(', ') : String(aValue)
      const bString = Array.isArray(bValue) ? bValue.join(', ') : String(bValue)

      return aString.localeCompare(bString, undefined, { numeric: true })
    })

    return sortConfig.direction === 'asc' ? sorted : sorted.reverse()
  }

  // R-003: Memoize sorted data to prevent unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedData = React.useMemo(() => sortItems(data), [data, sortConfig])

  // Recursive render function - uses sortedData at root level
  const renderRows = (
    items: LibraryItem[],
    level = 0,
    visited = new Set<string>(),
    isRoot = false
  ) => {
    const itemsToRender = isRoot ? sortedData : sortItems(items)

    return itemsToRender.flatMap((item) => {
      // Basic cycle detection for rendering
      if (visited.has(item.referenceId)) return []

      const newVisited = new Set(visited)
      newVisited.add(item.referenceId)

      const isExpanded = expandedIds.has(item.referenceId)
      const hasChildren = item.children && item.children.length > 0

      const rows = [
        <tr
          key={`${item.referenceId}-${level}`} // Unique key for duplicates in tree
          className="border-b border-border hover:bg-muted/50 transition-colors group"
        >
          <td
            className="p-4 whitespace-nowrap text-sm font-medium text-foreground"
            style={{ paddingLeft: `${level * 20 + 16}px` }}
          >
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.referenceId)}
                  className="p-1 hover:bg-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                </button>
              ) : (
                <span className="w-6" /> // Spacer
              )}
              <span className="font-mono text-primary/80">{item.referenceId}</span>
            </div>
          </td>
          <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              {item.documentTitle}
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  aria-label={`Open ${item.documentTitle} in new tab`}
                >
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              <StatusBadge status={item.status} size="sm" />
            </div>
          </td>
          <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {item.documentStatus}
          </td>
          <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {item.lastUpdateDate}
          </td>
          <td className="p-4 text-sm">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleDetailsClick(item, e)}
                className={clsx(
                  'p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                  item.localFile
                    ? 'text-primary hover:text-primary/80 hover:bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                )}
                title={
                  item.localFile ? 'View details (summary + preview available)' : 'View details'
                }
                aria-label={`View details for ${item.documentTitle}`}
              >
                {item.localFile ? (
                  <Eye size={16} aria-hidden="true" />
                ) : (
                  <Info size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </td>
        </tr>,
      ]

      if (isExpanded && hasChildren) {
        rows.push(...renderRows(item.children!, level + 1, newVisited))
      }

      return rows
    })
  }

  const headers: { key: SortKey | 'actions'; label: string }[] = [
    { key: 'referenceId', label: 'Reference ID' },
    { key: 'documentTitle', label: 'Title' },
    { key: 'documentStatus', label: 'Status' },
    { key: 'lastUpdateDate', label: 'Last Update' },
    { key: 'actions', label: '' },
  ]

  return (
    <>
      <div className="glass-panel overflow-hidden">
        {/* A-003: Added aria-controls for expand/collapse buttons */}
        <div className="p-2 border-b border-border flex justify-end gap-2 bg-muted/10">
          <button
            onClick={() => {
              const ids = getAllExpandedIds(data)
              setExpandedIds(ids)
            }}
            aria-controls="library-table"
            className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
          >
            <ChevronDown size={14} aria-hidden="true" /> Expand All
          </button>
          <button
            onClick={() => setExpandedIds(new Set())}
            aria-controls="library-table"
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronRight size={14} aria-hidden="true" /> Collapse All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table id="library-table" className="w-full text-left border-collapse">
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
                    className="p-4 font-semibold text-sm"
                  >
                    {header.key !== 'actions' ? (
                      <button
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 -ml-1"
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
                      </button>
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

      <LibraryDetailPopover
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </>
  )
}
