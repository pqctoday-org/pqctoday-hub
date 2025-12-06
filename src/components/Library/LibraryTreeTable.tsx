import React, { useState } from 'react'
import type { LibraryItem } from '../../data/libraryData'
import {
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react'
import { LibraryDetailPopover } from './LibraryDetailPopover'

interface LibraryTreeTableProps {
  data: LibraryItem[]
  defaultSort?: { key: SortKey; direction: SortDirection }
}

type SortDirection = 'asc' | 'desc' | null
type SortKey = keyof LibraryItem

export const LibraryTreeTable: React.FC<LibraryTreeTableProps> = ({ data, defaultSort }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>(
    defaultSort || { key: 'referenceId', direction: 'asc' }
  )
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)

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
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
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

  // Recursive render function
  const renderRows = (items: LibraryItem[], level = 0) => {
    const sortedItems = sortItems(items)

    return sortedItems.flatMap((item) => {
      const isExpanded = expandedIds.has(item.referenceId)
      const hasChildren = item.children && item.children.length > 0

      const rows = [
        <tr
          key={item.referenceId}
          className="border-b border-white/5 hover:bg-white/5 transition-colors group"
        >
          <td
            className="p-4 whitespace-nowrap text-sm font-medium text-foreground"
            style={{ paddingLeft: `${level * 20 + 16}px` }}
          >
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.referenceId)}
                  className="p-1 hover:bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                title="View Details"
                aria-label={`View details for ${item.documentTitle}`}
              >
                <Info size={16} aria-hidden="true" />
              </button>
            </div>
          </td>
        </tr>,
      ]

      if (isExpanded && hasChildren) {
        rows.push(...renderRows(item.children!, level + 1))
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
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
            <tbody>{renderRows(data)}</tbody>
          </table>
        </div>
      </div>

      <LibraryDetailPopover
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        position={popoverPosition}
      />
    </>
  )
}
