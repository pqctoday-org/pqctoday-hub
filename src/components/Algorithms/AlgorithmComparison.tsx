// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { motion } from 'framer-motion'
import { type AlgorithmTransition } from '../../data/algorithmsData'
import { loadPQCAlgorithmsData, type AlgorithmDetail } from '../../data/pqcAlgorithmsData'
import {
  Shield,
  Lock,
  FileSignature,
  Hash,
  Key,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Scale,
  Code2,
} from 'lucide-react'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { Button } from '../ui/button'
import clsx from 'clsx'
import { useState, useEffect, useMemo } from 'react'
import { logEvent } from '../../utils/analytics'
import { MobileAlgorithmList } from './MobileAlgorithmList'
import { AlgorithmImplementationsModal } from './AlgorithmImplementationsModal'

type SortColumn = 'function' | 'classical' | 'pqc' | 'deprecation' | 'region' | 'status'
type SortDirection = 'asc' | 'desc' | null

interface AlgorithmComparisonProps {
  highlightAlgorithms?: Set<string>
  filteredData: AlgorithmTransition[]
  compareSet: Set<string>
  compareType: 'KEM' | 'Signature' | null
  maxCompareReached: boolean
  onToggleCompare: (name: string) => void
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  highlightAlgorithms,
  filteredData,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}) => {
  const [pqcDetailMap, setPqcDetailMap] = useState<Map<string, AlgorithmDetail>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [implModalAlgo, setImplModalAlgo] = useState<string | null>(null)

  useEffect(() => {
    loadPQCAlgorithmsData()
      .then((details) => {
        const map = new Map<string, AlgorithmDetail>()
        details.forEach((d) => map.set(d.name.toLowerCase(), d))
        setPqcDetailMap(map)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load PQC details:', error)
        setIsLoading(false)
      })
  }, [])

  // Column widths state (in pixels)
  const [columnWidths, setColumnWidths] = useState({
    function: 180,
    classical: 220,
    pqc: 260,
    region: 130,
    status: 150,
    deprecation: 320,
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
    if (!sortColumn || !sortDirection) return filteredData
    return [...filteredData].sort((a, b) => {
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
        case 'region':
          aValue = a.region
          bValue = b.region
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
      }

      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

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
          <div className="md:hidden flex flex-col gap-4 mb-4">
            <div className="bg-muted/30 p-3 rounded-lg border border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground mr-2 shrink-0">
                Sort by:
              </span>
              <select
                className="bg-background border border-input rounded-md text-sm p-1.5 flex-1 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-foreground"
                value={`${sortColumn || 'none'}-${sortDirection || 'none'}`}
                onChange={(e) => {
                  const [col, dir] = e.target.value.split('-')
                  if (col === 'none') {
                    setSortColumn(null)
                    setSortDirection(null)
                  } else {
                    setSortColumn(col as SortColumn)
                    setSortDirection(dir as SortDirection)
                    if (col) {
                      logEvent('Algorithms', 'Sort Mobile', `${col} (${dir})`)
                    }
                  }
                }}
              >
                <option value="none-none">Default</option>
                <option value="deprecation-asc">Urgency (Earliest first)</option>
                <option value="deprecation-desc">Urgency (Latest first)</option>
                <option value="function-asc">Function (A-Z)</option>
                <option value="classical-asc">Classical Algorithm (A-Z)</option>
                <option value="pqc-asc">PQC Alternative (A-Z)</option>
              </select>
            </div>
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
                  <tr className="bg-muted text-muted-foreground text-sm uppercase tracking-wider border-b border-border">
                    <th
                      scope="col"
                      aria-sort={
                        sortColumn === 'function'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-muted/50 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.function}px` }}
                    >
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSort('function')}
                        aria-label={`Function column, ${sortColumn === 'function' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Function</span>
                        {renderSortIcon('function')}
                      </Button>
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
                      className="font-bold whitespace-nowrap relative hover:bg-muted/50 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.classical}px` }}
                    >
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSort('classical')}
                        aria-label={`Classical Algorithm column, ${sortColumn === 'classical' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Classical Algorithm</span>
                        {renderSortIcon('classical')}
                      </Button>
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
                      className="font-bold whitespace-nowrap relative hover:bg-muted/50 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.pqc}px` }}
                    >
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSort('pqc')}
                        aria-label={`PQC Alternative column, ${sortColumn === 'pqc' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>PQC Alternative</span>
                        {renderSortIcon('pqc')}
                      </Button>
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
                        sortColumn === 'region'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-muted/50 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.region}px` }}
                    >
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSort('region')}
                        aria-label={`Region column, ${sortColumn === 'region' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Region</span>
                        {renderSortIcon('region')}
                      </Button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('region' as SortColumn, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortColumn === 'status'
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="font-bold whitespace-nowrap relative hover:bg-muted/50 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.status}px` }}
                    >
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSort('status')}
                        aria-label={`Status column, ${sortColumn === 'status' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </Button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('status' as SortColumn, e)}
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
                      className="font-bold whitespace-nowrap relative hover:bg-muted/50 transition-colors select-none p-0"
                      style={{ width: `${columnWidths.deprecation}px` }}
                    >
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSort('deprecation')}
                        aria-label={`Transition and Deprecation column, ${sortColumn === 'deprecation' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}, click to sort`}
                        className="w-full h-full py-8 flex items-center justify-center gap-2 px-4 bg-transparent border-none text-inherit font-inherit cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                      >
                        <span>Transition / Deprecation</span>
                        {renderSortIcon('deprecation')}
                      </Button>
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart('deprecation', e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sortedData.map((algo, index) => {
                    const isHighlighted =
                      highlightAlgorithms &&
                      Array.from(highlightAlgorithms).some(
                        (h) =>
                          algo.classical.toLowerCase().includes(h.toLowerCase()) ||
                          h.toLowerCase().includes(algo.classical.toLowerCase())
                      )
                    const pqcName = algo.pqc.split(/\s*\(/)[0].trim()
                    const pqcDetail = pqcDetailMap.get(pqcName.toLowerCase())
                    const isCompared = compareSet.has(pqcName)
                    const canCompare =
                      isCompared ||
                      (!maxCompareReached &&
                        (compareType === null ||
                          compareType === (algo.function === 'Signature' ? 'Signature' : 'KEM')))
                    const isComparableFunction =
                      algo.function === 'Signature' ||
                      algo.function === 'Encryption/KEM' ||
                      algo.function === 'Hybrid KEM'
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
                        <td className="px-4 py-3" style={{ width: `${columnWidths.function}px` }}>
                          <div className="flex items-center gap-2 text-primary font-medium text-sm">
                            {isComparableFunction && (
                              <Button
                                variant="ghost"
                                type="button"
                                onClick={() => onToggleCompare(pqcName)}
                                disabled={!canCompare && !isCompared}
                                title={
                                  isCompared
                                    ? 'Remove from comparison'
                                    : !canCompare
                                      ? maxCompareReached
                                        ? 'Max 3 reached'
                                        : 'Clear to switch type'
                                      : 'Add to comparison'
                                }
                                className={clsx(
                                  'shrink-0 p-1 rounded transition-colors',
                                  isCompared
                                    ? 'text-secondary bg-secondary/10'
                                    : canCompare
                                      ? 'text-muted-foreground hover:text-secondary hover:bg-secondary/10'
                                      : 'text-muted-foreground/30 cursor-not-allowed'
                                )}
                              >
                                <Scale size={14} />
                              </Button>
                            )}
                            {algo.function.includes('Signature') ? (
                              <FileSignature size={24} className="flex-shrink-0" />
                            ) : algo.function === 'Hash' ? (
                              <Hash size={24} className="flex-shrink-0" />
                            ) : algo.function === 'Symmetric' ? (
                              <Key size={24} className="flex-shrink-0" />
                            ) : (
                              <Lock size={24} className="flex-shrink-0" />
                            )}
                            <span className="truncate">{algo.function}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ width: `${columnWidths.classical}px` }}>
                          <div className="flex flex-col gap-1">
                            <span className="text-foreground font-semibold text-sm truncate">
                              {algo.classical}
                            </span>
                            {algo.keySize && (
                              <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded-full bg-muted border border-border w-fit">
                                {algo.keySize}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ width: `${columnWidths.pqc}px` }}>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-status-success font-semibold text-sm truncate">
                              {algo.pqc}
                            </span>
                            {pqcDetail && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {pqcDetail.securityLevel !== null && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">
                                    L{pqcDetail.securityLevel}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-muted border-border text-muted-foreground">
                                  {pqcDetail.publicKeySize.toLocaleString()}B pk
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <AskAssistantButton
                                variant="text"
                                label="Ask about this"
                                question={`How does ${algo.pqc} compare to ${algo.classical} in terms of security and performance, and why should organizations migrate?`}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setImplModalAlgo(algo.pqc)}
                                className="h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                title="View known implementations"
                              >
                                <Code2 size={12} />
                                Implementations
                              </Button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ width: `${columnWidths.region}px` }}>
                          {algo.region && (
                            <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 border border-border">
                              {algo.region}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ width: `${columnWidths.status}px` }}>
                          {algo.status &&
                            (algo.status !== 'Candidate' && algo.status !== 'To Be Checked' ? (
                              algo.statusUrl ? (
                                <a
                                  href={algo.statusUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs px-1.5 py-0.5 rounded border bg-status-success/10 text-status-success border-status-success/30 hover:underline"
                                >
                                  {algo.status}
                                </a>
                              ) : (
                                <span className="text-xs px-1.5 py-0.5 rounded border bg-status-success/10 text-status-success border-status-success/30">
                                  {algo.status}
                                </span>
                              )
                            ) : algo.status === 'Candidate' ? (
                              <span className="text-xs px-1.5 py-0.5 rounded border bg-status-warning/10 text-status-warning border-status-warning/30">
                                {algo.status}
                              </span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 rounded border bg-status-info/10 text-status-info border-status-info/30">
                                {algo.status}
                              </span>
                            ))}
                        </td>
                        <td
                          className="px-4 py-3"
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

      {implModalAlgo && (
        <AlgorithmImplementationsModal
          algorithmName={implModalAlgo}
          isOpen={true}
          onClose={() => setImplModalAlgo(null)}
        />
      )}
    </div>
  )
}
