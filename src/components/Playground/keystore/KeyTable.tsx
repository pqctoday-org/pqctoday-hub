// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef, useEffect } from 'react'
import { Key as KeyIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import clsx from 'clsx'
import type { Key } from '../../../types'
import { getKeySize, formatBytes } from './keySizeUtils'
import { Button } from '@/components/ui/button'

interface KeyTableProps {
  keyStore: Key[]
  selectedKeyId: string | null
  setSelectedKeyId: (id: string | null) => void
}

type SortColumn = 'name' | 'type' | 'algorithm' | 'size' | 'id' | 'timestamp'
type SortDirection = 'asc' | 'desc'

export const KeyTable: React.FC<KeyTableProps> = ({
  keyStore,
  selectedKeyId,
  setSelectedKeyId,
}) => {
  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState({
    name: 250,
    type: 100,
    algorithm: 150,
    size: 100,
    id: 300,
    timestamp: 180,
  })
  const [resizingColumn, setResizingColumn] = useState<SortColumn | null>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)

  // Handlers
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const startResize = (e: React.MouseEvent, column: SortColumn) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(column)
    resizeStartX.current = e.clientX
    // eslint-disable-next-line security/detect-object-injection
    resizeStartWidth.current = columnWidths[column]
    document.body.style.cursor = 'col-resize'
  }

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="opacity-30" />
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    )
  }

  // Resize Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - resizeStartX.current
        const newWidth = Math.max(50, resizeStartWidth.current + diff)
        setColumnWidths((prev) => ({
          ...prev,
          [resizingColumn]: newWidth,
        }))
      }
    }

    const handleMouseUp = () => {
      if (resizingColumn) {
        setResizingColumn(null)
        document.body.style.cursor = 'default'
      }
    }

    if (resizingColumn) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn])

  // Sorting Logic
  const sortedKeys = [...keyStore].sort((a, b) => {
    if (sortColumn === 'timestamp') {
      const aTime = a.timestamp || 0
      const bTime = b.timestamp || 0
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime
    }

    if (sortColumn === 'size') {
      const aSize = getKeySize(a) ?? -1
      const bSize = getKeySize(b) ?? -1
      return sortDirection === 'asc' ? aSize - bSize : bSize - aSize
    }

    // eslint-disable-next-line security/detect-object-injection
    const aValue = String(a[sortColumn]).toLowerCase()
    // eslint-disable-next-line security/detect-object-injection
    const bValue = String(b[sortColumn]).toLowerCase()

    const comparison = aValue.localeCompare(bValue)
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const emptyState = (
    <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
      <KeyIcon size={32} className="opacity-20" />
      <p className="text-sm italic">No keys generated yet. Go to Settings to generate keys.</p>
    </div>
  )

  return (
    <>
      {/* Desktop: table layout */}
      <div className="hidden md:flex flex-1 min-h-[300px] overflow-hidden rounded-xl border border-border bg-card flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse table-fixed">
            <thead className="bg-muted text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md z-10">
              <tr>
                {(['name', 'type', 'algorithm', 'size', 'id', 'timestamp'] as SortColumn[]).map(
                  (col) => (
                    <th
                      key={col}
                      className="p-0 relative select-none group"
                      // eslint-disable-next-line security/detect-object-injection
                      style={{ width: columnWidths[col] }}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(col)}
                        className="w-full h-full p-4 flex items-center gap-2 hover:bg-accent transition-colors text-left font-bold"
                      >
                        {col.charAt(0).toUpperCase() + col.slice(1)}
                        {renderSortIcon(col)}
                      </Button>
                      <div
                        role="none"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => startResize(e, col)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sortedKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-foreground/30 italic">
                    {emptyState}
                  </td>
                </tr>
              ) : (
                sortedKeys.map((key) => (
                  <tr
                    key={key.id}
                    onClick={() => setSelectedKeyId(key.id)}
                    className={clsx(
                      'cursor-pointer transition-colors border-l-2',
                      selectedKeyId === key.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent/50 border-transparent'
                    )}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedKeyId(key.id)
                      }
                    }}
                  >
                    <td className="p-4 font-medium text-foreground truncate">{key.name}</td>
                    <td className="p-4">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] uppercase font-bold',
                          key.type === 'public'
                            ? 'bg-primary/20 text-primary'
                            : key.type === 'private'
                              ? 'bg-secondary/20 text-secondary'
                              : 'bg-accent/20 text-accent'
                        )}
                      >
                        {key.type}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground truncate">{key.algorithm}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground text-right tabular-nums">
                      {(() => {
                        const size = getKeySize(key)
                        return size !== null ? formatBytes(size) : '-'
                      })()}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground truncate">
                      {key.id}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground truncate font-mono">
                      {key.timestamp ? new Date(key.timestamp).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: card layout */}
      <div className="md:hidden flex-1 space-y-2 overflow-y-auto">
        {sortedKeys.length === 0
          ? emptyState
          : sortedKeys.map((key) => (
              <Button
                variant="ghost"
                key={key.id}
                type="button"
                onClick={() => setSelectedKeyId(key.id)}
                className={clsx(
                  'w-full text-left p-3 rounded-xl border transition-colors',
                  selectedKeyId === key.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm text-foreground truncate mr-2">
                    {key.name}
                  </span>
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0',
                      key.type === 'public'
                        ? 'bg-primary/20 text-primary'
                        : key.type === 'private'
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-accent/20 text-accent'
                    )}
                  >
                    {key.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="truncate">{key.algorithm}</span>
                  <span className="font-mono tabular-nums shrink-0">
                    {(() => {
                      const size = getKeySize(key)
                      return size !== null ? formatBytes(size) : '-'
                    })()}
                  </span>
                </div>
              </Button>
            ))}
      </div>
    </>
  )
}
