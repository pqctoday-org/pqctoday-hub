import React, { useState, useRef, useEffect } from 'react'
import { Key as KeyIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import clsx from 'clsx'
import type { Key } from '../../../types'

interface KeyTableProps {
  keyStore: Key[]
  selectedKeyId: string | null
  setSelectedKeyId: (id: string | null) => void
}

type SortColumn = 'name' | 'type' | 'algorithm' | 'id' | 'timestamp'
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
          // eslint-disable-next-line security/detect-object-injection
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

    // eslint-disable-next-line security/detect-object-injection
    const aValue = String(a[sortColumn]).toLowerCase()
    // eslint-disable-next-line security/detect-object-injection
    const bValue = String(b[sortColumn]).toLowerCase()

    const comparison = aValue.localeCompare(bValue)
    return sortDirection === 'asc' ? comparison : -comparison
  })

  return (
    <div className="flex-1 min-h-[300px] overflow-hidden rounded-xl border border-white/10 bg-black/20 flex flex-col">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table
          className="w-full text-left text-sm border-collapse"
          style={{ tableLayout: 'fixed' }}
        >
          <thead className="bg-white/5 text-muted uppercase text-xs sticky top-0 backdrop-blur-md z-10">
            <tr>
              {(['name', 'type', 'algorithm', 'id', 'timestamp'] as SortColumn[]).map((col) => (
                <th
                  key={col}
                  className="p-0 relative select-none group"
                  // eslint-disable-next-line security/detect-object-injection
                  style={{ width: columnWidths[col] }}
                >
                  <button
                    onClick={() => handleSort(col)}
                    className="w-full h-full p-4 flex items-center gap-2 hover:bg-white/5 transition-colors text-left font-bold"
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    {renderSortIcon(col)}
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Resize ${col} column`}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors focus:bg-primary"
                    onMouseDown={(e) => startResize(e, col)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={() => {
                      // Keyboard resize logic could be added here
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-white/30 italic">
                  <div className="flex flex-col items-center gap-3">
                    <KeyIcon size={32} className="opacity-20" />
                    No keys generated yet. Go to Settings to generate keys.
                  </div>
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
                      : 'hover:bg-white/5 border-transparent'
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
                  <td className="p-4 font-medium text-white truncate">{key.name}</td>
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
                  <td className="p-4 text-muted truncate">{key.algorithm}</td>
                  <td className="p-4 font-mono text-xs text-muted truncate">{key.id}</td>
                  <td className="p-4 text-xs text-muted truncate font-mono">
                    {key.timestamp ? new Date(key.timestamp).toLocaleString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
