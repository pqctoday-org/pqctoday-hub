import { motion } from 'framer-motion'
import { algorithmsData } from '../../data/algorithmsData'
import {
  Shield,
  Lock,
  FileSignature,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

type SortColumn = 'function' | 'classical' | 'pqc' | 'deprecation'
type SortDirection = 'asc' | 'desc' | null

export const AlgorithmComparison = () => {
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
  const sortedData = [...algorithmsData].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0

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
        // Extract year for sorting
        aValue = a.deprecationDate.match(/\d{4}/)?.[0] || '0'
        bValue = b.deprecationDate.match(/\d{4}/)?.[0] || '0'
        // Handle special cases like "2030+" and "2030 (Disallowed)"
        if (a.deprecationDate.includes('Disallowed')) aValue = '2030.1'
        if (b.deprecationDate.includes('Disallowed')) bValue = '2030.1'
        if (a.deprecationDate.includes('+')) aValue = '2030.2'
        if (b.deprecationDate.includes('+')) bValue = '2030.2'
        break
    }

    const comparison = aValue.localeCompare(bValue, undefined, { numeric: true })
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Handle sort click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Handle resize start
  const handleResizeStart = (column: SortColumn, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(column)
    setStartX(e.clientX)
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

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse" style={{ tableLayout: 'fixed' }}>
            <caption className="sr-only">
              Algorithm transition from classical to post-quantum cryptography, showing function
              type, classical algorithm, PQC alternative, and transition timeline
            </caption>
            <thead>
              <tr className="bg-white/10 text-muted text-sm uppercase tracking-wider border-b border-white/10">
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
              {sortedData.map((algo, index) => (
                <motion.tr
                  key={`${algo.classical}-${algo.function}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    'transition-colors group',
                    index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-700/50',
                    'hover:bg-primary/10'
                  )}
                >
                  <td className="px-4 py-8" style={{ width: `${columnWidths.function}px` }}>
                    <div className="flex items-center justify-center gap-4 text-primary font-medium text-xl overflow-hidden">
                      {algo.function.includes('Signature') ? (
                        <FileSignature size={24} className="flex-shrink-0" />
                      ) : (
                        <Lock size={24} className="flex-shrink-0" />
                      )}
                      <span className="truncate">{algo.function}</span>
                    </div>
                  </td>
                  <td className="px-4 py-8" style={{ width: `${columnWidths.classical}px` }}>
                    <div className="flex flex-col items-center gap-2 overflow-hidden">
                      <span className="text-white font-bold text-xl truncate w-full text-center">
                        {algo.classical}
                      </span>
                      {algo.keySize && (
                        <span className="text-sm text-muted font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 whitespace-nowrap">
                          {algo.keySize}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-8" style={{ width: `${columnWidths.pqc}px` }}>
                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xl overflow-hidden">
                      <span className="truncate">{algo.pqc}</span>
                    </div>
                  </td>
                  <td className="px-4 py-8" style={{ width: `${columnWidths.deprecation}px` }}>
                    <div className="flex items-center justify-center gap-6 overflow-hidden">
                      <span
                        className={clsx(
                          'text-base px-4 py-2 rounded-full border font-bold shadow-lg whitespace-nowrap flex-shrink-0',
                          algo.deprecationDate.includes('Disallowed')
                            ? 'bg-red-500/20 border-red-500/40 text-red-300 shadow-red-900/20'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-900/20'
                        )}
                      >
                        {algo.deprecationDate}
                      </span>
                      <ArrowRight size={20} className="text-muted opacity-30 flex-shrink-0" />
                      <span className="text-base text-muted font-mono whitespace-nowrap flex-shrink-0">
                        Std: {algo.standardizationDate}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
