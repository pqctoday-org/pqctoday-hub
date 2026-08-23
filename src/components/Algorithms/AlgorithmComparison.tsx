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
} from 'lucide-react'
import { Button } from '../ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import clsx from 'clsx'
import { useState, useEffect, useMemo } from 'react'
import { logEvent } from '../../utils/analytics'
import { MobileAlgorithmList } from './MobileAlgorithmList'
import { MobileTransitionWizard } from './MobileTransitionWizard'
import { AlgoCtaStrip } from './AlgoCtaStrip'
import { AlgorithmCheckButton } from './AlgorithmCheckButton'
import { jurisdictionStanceForRegion, type JurisdictionStance } from './cnsa20'
import { isCertifiedTier } from '../../data/algorithmStatusTier'
import { transitionConsequence } from '@/data/algorithmConsequence'

type SortColumn = 'function' | 'classical' | 'pqc' | 'deprecation' | 'region' | 'status'
type SortDirection = 'asc' | 'desc' | null

/** Short label for a jurisdiction's hybrid/composite stance chip. */
function jurisdictionStanceLabel(stance: JurisdictionStance): string {
  switch (stance) {
    case 'require':
      return 'Hybrid required'
    case 'prefer-pure':
      return 'Prefers pure'
    case 'interim':
      return 'Hybrid (interim)'
    case 'permit':
      return 'Hybrid permitted'
  }
}

/** Tailwind classes for a jurisdiction stance chip. */
function jurisdictionStanceChip(stance: JurisdictionStance): string {
  switch (stance) {
    case 'require':
      return 'bg-status-warning/10 text-status-warning border-status-warning/30'
    case 'prefer-pure':
      return 'bg-status-success/10 text-status-success border-status-success/30'
    default:
      return 'bg-status-info/10 text-status-info border-status-info/30'
  }
}

interface AlgorithmComparisonProps {
  highlightAlgorithms?: Set<string>
  filteredData: AlgorithmTransition[]
  compareSet: Set<string>
  compareType: 'KEM' | 'Signature' | null
  maxCompareReached: boolean
  onToggleTransitionRow: (t: AlgorithmTransition) => void
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  highlightAlgorithms,
  filteredData,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleTransitionRow,
}) => {
  const [pqcDetailMap, setPqcDetailMap] = useState<Map<string, AlgorithmDetail>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [showFullTable, setShowFullTable] = useState(false)

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
            {showFullTable ? (
              <>
                <div className="bg-muted/30 p-3 rounded-lg border border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground mr-2 shrink-0">
                    Sort by:
                  </span>
                  <FilterDropdown
                    items={[
                      { id: 'none-none', label: 'Default' },
                      { id: 'deprecation-asc', label: 'Urgency (Earliest first)' },
                      { id: 'deprecation-desc', label: 'Urgency (Latest first)' },
                      { id: 'function-asc', label: 'Function (A-Z)' },
                      { id: 'classical-asc', label: 'Classical Algorithm (A-Z)' },
                      { id: 'pqc-asc', label: 'PQC Alternative (A-Z)' },
                    ]}
                    selectedId={`${sortColumn || 'none'}-${sortDirection || 'none'}`}
                    onSelect={(value) => {
                      const [col, dir] = value.split('-')
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
                    ariaLabel="Sort by"
                    hideDefaultOption
                    noContainer
                    className="flex-1 min-w-0"
                  />
                </div>
                <MobileAlgorithmList
                  data={sortedData}
                  pqcDetailMap={pqcDetailMap}
                  onBackToWizard={() => setShowFullTable(false)}
                />
              </>
            ) : (
              <MobileTransitionWizard
                data={sortedData}
                pqcDetailMap={pqcDetailMap}
                onShowFullTable={() => setShowFullTable(true)}
              />
            )}
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
                    const pqcName = algo.pqc.split(/\s*\(/)[0].trim()
                    // Highlight sets are a mix of classical names (architect/
                    // developer pick RSA/ECDH to anchor "what replaces this")
                    // and PQC names (executive/curious pick ML-KEM-768 etc. —
                    // see ALGORITHM_PERSONA_DEFAULTS in personaConfig.ts) —
                    // check both columns, not just classical.
                    const isHighlighted =
                      highlightAlgorithms &&
                      Array.from(highlightAlgorithms).some(
                        (h) =>
                          algo.classical.toLowerCase().includes(h.toLowerCase()) ||
                          h.toLowerCase().includes(algo.classical.toLowerCase()) ||
                          pqcName.toLowerCase() === h.toLowerCase()
                      )
                    const pqcDetail = pqcDetailMap.get(pqcName.toLowerCase())
                    const isCompared = compareSet.has(pqcName)
                    const isSignatureType =
                      algo.function === 'Signature' || algo.function === 'Composite Signature'
                    const canCompare =
                      isCompared ||
                      (!maxCompareReached &&
                        (compareType === null ||
                          compareType === (isSignatureType ? 'Signature' : 'KEM')))
                    const isComparableFunction =
                      algo.function === 'Signature' ||
                      algo.function === 'Composite Signature' ||
                      algo.function === 'Encryption/KEM' ||
                      algo.function === 'Composite KEM' ||
                      algo.function === 'Hybrid KEM' ||
                      algo.function === 'Hybrid KEM (HPKE)' ||
                      algo.function === 'Hybrid KEM with Access Control'
                    return (
                      <motion.tr
                        key={`${algo.classical}-${algo.function}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        // Cap the stagger so a ~40-row table doesn't animate for
                        // ~2s or re-stagger fully on every sort/filter change.
                        transition={{ delay: Math.min(index, 8) * 0.04 }}
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
                            {isComparableFunction ? (
                              <input
                                type="checkbox"
                                checked={isCompared}
                                disabled={!canCompare && !isCompared}
                                onChange={() => onToggleTransitionRow(algo)}
                                title={
                                  isCompared
                                    ? 'Remove from comparison'
                                    : !canCompare
                                      ? maxCompareReached
                                        ? 'Maximum reached'
                                        : 'Clear to switch type'
                                      : 'Compare classical + PQC'
                                }
                                aria-label={`Compare ${algo.classical} → ${algo.pqc}`}
                                className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                              />
                            ) : (
                              <div className="shrink-0 w-6" />
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
                            {/* B+ remediation 3.2 (2026-08-10): the consequence
                                line. Without it this table is a list of names —
                                an executive learns THAT RSA becomes ML-DSA and
                                never why it costs anything. Derived from
                                ALGORITHM_REGISTRY at render time
                                (algorithmConsequence.ts), so it cannot drift
                                from the sizes the rest of the page quotes;
                                renders nothing at all when either side of the
                                transition is absent from the registry, rather
                                than guessing. */}
                            {(() => {
                              const consequence = transitionConsequence(algo.classical, pqcName)
                              return consequence ? (
                                <p className="text-[11px] leading-snug text-muted-foreground whitespace-normal">
                                  {consequence.sentence}
                                </p>
                              ) : null
                            })()}
                            {pqcDetail && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {pqcDetail.securityLevel !== null && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">
                                    L{pqcDetail.securityLevel}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-muted border-border text-muted-foreground">
                                  {pqcDetail.sizesUnknown
                                    ? 'pk: Research needed'
                                    : `${pqcDetail.publicKeySize.toLocaleString()}B pk`}
                                </span>
                              </div>
                            )}
                            {/* "Ask about this" and "Implementations" are deliberately not in
                                this tab — they added a second CTA row per record. The live-check
                                play button rides in the strip's trailing slot for the same
                                reason: one CTA row per record, not three. */}
                            <AlgoCtaStrip
                              algoName={pqcName}
                              trailing={
                                pqcDetail ? <AlgorithmCheckButton algorithm={pqcDetail} /> : null
                              }
                            />
                            {/* Revision provenance (ReviewedBadge / drilldown) and the trust
                                score are deliberately NOT rendered here — their text is
                                unbounded and wrapped across the row, breaking the table
                                layout. Both live on the Detailed Comparison tab (trust score
                                also in the global revisions feed / trust surfaces). */}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ width: `${columnWidths.region}px` }}>
                          {algo.region && (
                            <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 border border-border">
                              {algo.region}
                            </span>
                          )}
                          {/* Jurisdictional mandate status — surfaced on hybrid/composite
                              rows, derived from the row's own Region field (no invented facts). */}
                          {(algo.function === 'Hybrid KEM' ||
                            algo.function === 'Hybrid KEM (HPKE)' ||
                            algo.function === 'Hybrid KEM with Access Control' ||
                            algo.function === 'Composite KEM' ||
                            algo.function === 'Composite Signature') &&
                            (() => {
                              const j = jurisdictionStanceForRegion(algo.region)
                              if (!j) return null
                              return (
                                <span
                                  className={clsx(
                                    'mt-1 block w-fit text-[10px] px-1.5 py-0.5 rounded border font-medium',
                                    jurisdictionStanceChip(j.stance)
                                  )}
                                  title={j.note}
                                >
                                  {jurisdictionStanceLabel(j.stance)}
                                </span>
                              )
                            })()}
                        </td>
                        <td className="px-4 py-3" style={{ width: `${columnWidths.status}px` }}>
                          {algo.status &&
                            (isCertifiedTier(algo.statusTier) ? (
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
    </div>
  )
}
