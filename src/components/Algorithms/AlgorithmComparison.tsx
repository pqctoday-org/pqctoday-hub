import React from 'react'
import { motion } from 'framer-motion'
import { loadAlgorithmsData, type AlgorithmTransition } from '../../data/algorithmsData'
import {
  Shield,
  Lock,
  FileSignature,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wrench,
} from 'lucide-react'
import clsx from 'clsx'
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { logEvent } from '../../utils/analytics'
import { MobileAlgorithmList } from './MobileAlgorithmList'

// Extract the primary algorithm family from a PQC replacement string for migrate search
function getPrimaryAlgoSearch(pqc: string): string {
  const first = pqc.split(/[,/]/)[0].trim()
  if (first.startsWith('ML-KEM')) return 'ML-KEM'
  if (first.startsWith('ML-DSA')) return 'ML-DSA'
  if (first.startsWith('SLH-DSA') || first.startsWith('SPHINCS')) return 'SLH-DSA'
  if (first.startsWith('FN-DSA') || first.startsWith('Falcon')) return 'Falcon'
  if (first.startsWith('LMS') || first.startsWith('HSS')) return 'LMS'
  return first.split('-')[0]
}

type SortColumn = 'function' | 'classical' | 'pqc' | 'deprecation'
type SortDirection = 'asc' | 'desc' | null

interface AlgorithmComparisonProps {
  /** Set of classical algorithm names to visually highlight (from assess cross-link) */
  highlightAlgorithms?: Set<string>
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  highlightAlgorithms,
}) => {
  // Data loading state
  const [algorithmsData, setAlgorithmsData] = useState<AlgorithmTransition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    loadAlgorithmsData()
      .then((data) => {
        setAlgorithmsData(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load algorithms data:', error)
        setIsLoading(false)
      })
  }, [])

  // Column widths state (in pixels)
  const [columnWidths, setColumnWidths] = useState({
    function: 250,
    classical: 300,
    pqc: 300,
    deprecation: 450,
  })

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Resize state
  const [resizingColumn, setResizingColumn] = useState<SortColumn | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Sort the data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return algorithmsData
    return [...algorithmsData].sort((a, b) => {
      let aValue: string = ''
      let bValue: string = ''

      switch (sortColumn) {
        case 'function':
          aValue = a.function
          bValue = b.function
          break
        case 'classical':
          aValue = a.classical
          bValue = b.classical
          break
        case 'pqc':
          aValue = a.pqc
          bValue = b.pqc
          break
        case 'deprecation':
          // Extract first year for sorting
          aValue = a.deprecationDate.match(/\d{4}/)?.[0] || '9999'
          bValue = b.deprecationDate.match(/\d{4}/)?.[0] || '9999'
          // Entries with "Deprecated" phase sort before "Disallowed"-only (more urgent)
          if (a.deprecationDate.includes('Deprecated')) aValue = (parseInt(aValue) - 0.5).toString()
          if (b.deprecationDate.includes('Deprecated')) bValue = (parseInt(bValue) - 0.5).toString()
          break
      }

      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [algorithmsData, sortColumn, sortDirection])

  // Handle sort click
  const handleSort = (column: SortColumn) => {
    let newDirection: SortDirection = 'asc'
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        newDirection = 'desc'
      } else if (sortDirection === 'desc') {
        newDirection = null
      }
    }

    setSortColumn(newDirection ? column : null)
    setSortDirection(newDirection)

    if (newDirection) {
      logEvent('Algorithms', 'Sort', `${column} (${newDirection})`)
    }
  }

  // Handle resize start
  const handleResizeStart = (column: SortColumn, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(column)
    setStartX(e.clientX)
    // eslint-disable-next-line security/detect-object-injection
    setStartWidth(columnWidths[column])
  }

  // Handle resize move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - startX
        const newWidth = Math.max(150, startWidth + diff) // Min width 150px
        setColumnWidths((prev) => ({
          ...prev,
          [resizingColumn]: newWidth,
        }))
      }
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, startX, startWidth])

  // Render sort icon
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={16} className="opacity-40" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={16} className="text-primary" />
    }
    return <ArrowDown size={16} className="text-primary" />
  }

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="text-primary" />
        Algorithm Transition
      </h3>

      {isLoading ? (
        <div className="glass-panel p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading algorithms data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden">
            <MobileAlgorithmList data={sortedData} />
          </div>

          {/* Desktop View */}
          <div className="hidden md:block glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <caption className="sr-only">
                  Algorithm transition from classical to post-quantum cryptography, showing function
                  type, classical algorithm, PQC alternative, and transition timeline
                </caption>
                <thead>
                  <tr className="bg-white/10 text-muted-foreground text-sm uppercase tracking-wider border-b border-white/10">
                    <th
                      scope="col"
                      aria-sort={
                        sortColumn === 'function'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-white/5 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.function}px` }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('function')}
                        aria-label={`Function column, ${sortColumn === 'function' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Function</span>
                        {renderSortIcon('function')}
                      </button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('function', e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortColumn === 'classical'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-white/5 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.classical}px` }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('classical')}
                        aria-label={`Classical Algorithm column, ${sortColumn === 'classical' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Classical Algorithm</span>
                        {renderSortIcon('classical')}
                      </button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('classical', e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortColumn === 'pqc'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-white/5 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.pqc}px` }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('pqc')}
                        aria-label={`PQC Alternative column, ${sortColumn === 'pqc' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>PQC Alternative</span>
                        {renderSortIcon('pqc')}
                      </button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('pqc', e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortColumn === 'deprecation'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-white/5 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.deprecation}px` }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('deprecation')}
                        aria-label={`Transition and Deprecation column, ${sortColumn === 'deprecation' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Transition / Deprecation</span>
                        {renderSortIcon('deprecation')}
                      </button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('deprecation', e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedData.map((algo, index) => {
                    const isHighlighted =
                      highlightAlgorithms &&
                      Array.from(highlightAlgorithms).some(
                        (h) =>
                          algo.classical.toLowerCase().includes(h.toLowerCase()) ||
                          h.toLowerCase().includes(algo.classical.toLowerCase())
                      )
                    return (
                      <motion.tr
                        key={`${algo.classical}-${algo.function}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={clsx(
                          'transition-colors group',
                          isHighlighted
                            ? 'bg-primary/15 ring-1 ring-inset ring-primary/30'
                            : index % 2 === 0
                              ? 'bg-card/50'
                              : 'bg-muted/20',
                          'hover:bg-primary/10'
                        )}
                      >
                        <td className="px-4 py-4" style={{ width: `${columnWidths.function}px` }}>
                          <div className="flex items-center gap-2 text-primary font-medium text-sm">
                            {algo.function.includes('Signature') ? (
                              <FileSignature size={24} className="flex-shrink-0" />
                            ) : (
                              <Lock size={24} className="flex-shrink-0" />
                            )}
                            <span className="truncate">{algo.function}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4" style={{ width: `${columnWidths.classical}px` }}>
                          <div className="flex flex-col gap-1">
                            <span className="text-foreground font-semibold text-sm truncate">
                              {algo.classical}
                            </span>
                            {algo.keySize && (
                              <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 w-fit">
                                {algo.keySize}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4" style={{ width: `${columnWidths.pqc}px` }}>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-status-success font-semibold text-sm truncate">
                              {algo.pqc}
                            </span>
                            <Link
                              to={`/migrate?q=${encodeURIComponent(getPrimaryAlgoSearch(algo.pqc))}`}
                              onClick={() => logEvent('Algorithms', 'Find Tools', algo.pqc)}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors w-fit"
                            >
                              <Wrench size={11} />
                              Find tools
                            </Link>
                          </div>
                        </td>
                        <td
                          className="px-4 py-4"
                          style={{ width: `${columnWidths.deprecation}px` }}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={clsx(
                                'text-xs px-2 py-1 rounded border font-medium shadow-sm whitespace-normal text-center',
                                algo.deprecationDate.includes('Deprecated')
                                  ? 'bg-status-warning border-status-warning text-status-warning'
                                  : algo.deprecationDate.includes('Disallowed')
                                    ? 'bg-status-error border-status-error text-status-error'
                                    : 'bg-muted border-border text-muted-foreground'
                              )}
                            >
                              {algo.deprecationDate}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <ArrowRight size={14} className="opacity-50" />
                              <span className="font-mono">Std: {algo.standardizationDate}</span>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
