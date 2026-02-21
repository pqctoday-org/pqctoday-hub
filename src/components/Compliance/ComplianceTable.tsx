import React, { useState, useMemo } from 'react'
import {
  ArrowUpDown,
  Search,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Database,
  Download,
  Filter,
  Check,
  LockKeyhole,
  Info,
} from 'lucide-react'
import type { ComplianceRecord } from './types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import clsx from 'clsx'
import Papa from 'papaparse'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'

interface ComplianceTableProps {
  data: ComplianceRecord[]
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: Date | null
  onEnrich?: (r: ComplianceRecord) => void
}

type SortDirection = 'asc' | 'desc'
type SortColumn = keyof ComplianceRecord

const PQC_ALGOS = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS', 'XMSS', 'HSS', 'FN-DSA', 'Falcon']

const ComplianceRow = ({
  record,
  index,
  onEnrich,
}: {
  record: ComplianceRecord
  index: number
  onEnrich?: (record: ComplianceRecord) => void
}) => {
  const rowRef = React.useRef<HTMLTableRowElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // If this record needs detailed PQC info (Pending), trigger enrich
          if (
            onEnrich &&
            (record.pqcCoverage === 'Pending Check...' || record.pqcCoverage === 'Potentially PQC')
          ) {
            onEnrich(record)
            observer.disconnect() // Only trigger once per view
          }
        }
      },
      { threshold: 0.1 } // 10% visible
    )

    if (rowRef.current) {
      observer.observe(rowRef.current)
    }

    return () => observer.disconnect()
  }, [record, onEnrich])

  const [showDetailsPopup, setShowDetailsPopup] = useState(false)
  const [showPqcTooltip, setShowPqcTooltip] = useState(false)
  const [showClassicalTooltip, setShowClassicalTooltip] = useState(false)

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      {/* Source Column */}
      <td
        className="px-4 py-3 font-medium flex items-center gap-2 w-24 truncate"
        title={record.source}
      >
        <Database size={12} className="text-muted-foreground shrink-0" />
        <span className="truncate">{record.source}</span>
      </td>

      {/* Certification # Column */}
      <td className="px-4 py-3 font-mono text-xs w-32 truncate" title={record.id}>
        {record.id.length > 20 ? record.id.substring(0, 20) + '...' : record.id}
      </td>

      {/* Date Column */}
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap w-32">
        {record.date}
      </td>

      {/* Product Name Column */}
      <td className="px-4 py-3 font-medium text-foreground whitespace-normal break-words w-80">
        <div className="line-clamp-2" title={record.productName}>
          {record.productName}
        </div>
        <div className="text-xs text-muted-foreground truncate w-full">
          {record.productCategory}
        </div>
      </td>

      {/* Vendor Column */}
      <td className="px-4 py-3 w-48">
        <div className="truncate" title={record.vendor}>
          {record.vendor}
        </div>
      </td>

      {/* PQC Coverage Column */}
      <td className="px-4 py-3 relative group">
        {record.pqcCoverage && record.pqcCoverage !== 'No PQC Mechanisms Detected' ? (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowPqcTooltip((v) => !v)}
              className={clsx(
                'cursor-help p-1 rounded-full transition-colors',
                record.pqcCoverage === 'Pending Check...'
                  ? 'bg-warning/10 text-warning animate-pulse'
                  : 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20'
              )}
              aria-label="View PQC mechanisms"
            >
              {record.pqcCoverage === 'Pending Check...' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={18} />
              )}
            </button>

            <div
              className={clsx(
                'absolute left-1/2 -translate-x-1/2 max-w-[min(256px,calc(100vw-32px))] w-64 p-2 bg-popover border border-border rounded shadow-xl text-xs text-center z-[100] transition-opacity whitespace-normal',
                index < 2 ? 'top-full mt-2' : 'bottom-full mb-2',
                showPqcTooltip
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none group-hover:opacity-100'
              )}
            >
              <div className="font-semibold text-tertiary mb-1">PQC Mechanisms</div>
              <div className="text-popover-foreground flex flex-wrap gap-1">
                {typeof record.pqcCoverage === 'boolean'
                  ? 'PQC Support Detected'
                  : (record.pqcCoverage as string).split(', ').map((algo, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        {algo}
                        {algo.includes('LMS') && (
                          <span className="text-[9px] bg-warning/20 text-warning px-1 rounded border border-warning/30">
                            Stateful
                          </span>
                        )}
                        {(algo.includes('XMSS') || algo.includes('HSS')) && (
                          <span className="text-[9px] bg-muted text-muted-foreground px-1 rounded border border-border">
                            Legacy
                          </span>
                        )}
                        {i < (record.pqcCoverage as string).split(', ').length - 1 && (
                          <span>, </span>
                        )}
                      </span>
                    ))}
              </div>
              <div
                className={clsx(
                  'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
                  index < 2 ? 'bottom-full border-b-popover' : 'top-full border-t-popover'
                )}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>

      {/* Classical Algorithms Column */}
      <td className="px-4 py-3 relative group">
        {record.classicalAlgorithms ? (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowClassicalTooltip((v) => !v)}
              className="cursor-help p-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="View classical algorithms"
            >
              <LockKeyhole size={14} />
            </button>
            <div
              className={clsx(
                'absolute left-1/2 -translate-x-1/2 max-w-[min(256px,calc(100vw-32px))] w-64 p-2 bg-popover border border-border rounded shadow-xl text-xs text-center z-[100] transition-opacity whitespace-normal',
                index < 2 ? 'top-full mt-2' : 'bottom-full mb-2',
                showClassicalTooltip
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none group-hover:opacity-100'
              )}
            >
              <div className="font-semibold text-muted-foreground mb-1">Classical Algorithms</div>
              <div className="text-popover-foreground">{record.classicalAlgorithms}</div>
              <div
                className={clsx(
                  'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
                  index < 2 ? 'bottom-full border-b-popover' : 'top-full border-t-popover'
                )}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>

      {/* Details Column */}
      <td className="px-4 py-3">
        <button
          onClick={() => setShowDetailsPopup(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title="View Details"
        >
          <Info size={16} />
        </button>
        <ComplianceDetailPopover
          isOpen={showDetailsPopup}
          onClose={() => setShowDetailsPopup(false)}
          record={record}
        />
      </td>
    </tr>
  )
}

export const ComplianceTable: React.FC<ComplianceTableProps> = ({
  data,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onEnrich,
}) => {
  const [filterText, setFilterText] = useState('')
  const [pqcFilters, setPqcFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [sourceFilters, setSourceFilters] = useState<string[]>([])
  const [vendorFilters, setVendorFilters] = useState<string[]>([])

  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showSourceMenu, setShowSourceMenu] = useState(false)
  const [showVendorMenu, setShowVendorMenu] = useState(false)
  const [vendorSearch, setVendorSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Reset to page 1 when filters change
  const [isFiltering, setIsFiltering] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    text: '',
    pqc: [] as string[],
    category: [] as string[],
    source: [] as string[],
    vendor: [] as string[],
    vendorSearch: '',
  })

  // Sync external state to internal activeFilters with a small delay to show loader
  React.useEffect(() => {
    setIsFiltering(true)
    const timer = setTimeout(() => {
      setActiveFilters({
        text: filterText,
        pqc: pqcFilters,
        category: categoryFilters,
        source: sourceFilters,
        vendor: vendorFilters,
        vendorSearch: vendorSearch,
      })
      setCurrentPage(1)
      setIsFiltering(false)
    }, 400) // 400ms delay for visual feedback
    return () => clearTimeout(timer)
  }, [filterText, pqcFilters, categoryFilters, sourceFilters, vendorFilters, vendorSearch])

  const handleTogglePqcFilter = (filter: string) => {
    setPqcFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
    setCurrentPage(1)
  }

  const handleToggleCategoryFilter = (category: string) => {
    setCategoryFilters((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
    setCurrentPage(1)
  }

  const handleToggleSourceFilter = (src: string) => {
    setSourceFilters((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    )
    setCurrentPage(1)
  }

  const handleToggleVendorFilter = (vendor: string) => {
    setVendorFilters((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    )
    setCurrentPage(1)
  }

  const uniqueCategories = useMemo(() => {
    const cats = new Set(data.map((d) => d.productCategory).filter(Boolean))
    return Array.from(cats).sort()
  }, [data])

  const uniqueSources = useMemo(() => {
    const sources = new Set(data.map((d) => d.source).filter(Boolean))
    return Array.from(sources).sort()
  }, [data])

  const uniqueVendors = useMemo(() => {
    const vendors = new Set(data.map((d) => d.vendor).filter(Boolean))
    return Array.from(vendors).sort()
  }, [data])

  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return uniqueVendors
    return uniqueVendors.filter((v) => v.toLowerCase().includes(vendorSearch.toLowerCase()))
  }, [uniqueVendors, vendorSearch])

  const filteredAndSortedData = useMemo(() => {
    // Filter
    const processed = data.filter((record) => {
      const searchStr = activeFilters.text.toLowerCase()
      const matchesText =
        record.productName.toLowerCase().includes(searchStr) ||
        record.vendor.toLowerCase().includes(searchStr) ||
        record.source.toLowerCase().includes(searchStr) ||
        record.id.toLowerCase().includes(searchStr)

      // PQC Filter Logic
      const matchesPQC =
        activeFilters.pqc.length === 0 ||
        (typeof record.pqcCoverage === 'string' &&
          activeFilters.pqc.some((filter) => record.pqcCoverage.toString().includes(filter)))

      // Category Filter Logic
      const matchesCategory =
        activeFilters.category.length === 0 ||
        activeFilters.category.includes(record.productCategory)

      // Source Filter Logic
      const matchesSource =
        activeFilters.source.length === 0 || activeFilters.source.includes(record.source)

      // Vendor Filter Logic
      const matchesVendor =
        activeFilters.vendor.length === 0 ||
        activeFilters.vendor.some((v) => record.vendor.includes(v))

      const matchesVendorSearch =
        !activeFilters.vendorSearch ||
        record.vendor.toLowerCase().includes(activeFilters.vendorSearch.toLowerCase())

      return (
        matchesText &&
        matchesPQC &&
        matchesCategory &&
        matchesSource &&
        matchesVendor &&
        matchesVendorSearch
      )
    })

    // Sort
    processed.sort((a, b) => {
      // eslint-disable-next-line security/detect-object-injection
      const aVal = a[sortColumn]
      // eslint-disable-next-line security/detect-object-injection
      const bVal = b[sortColumn]

      if (aVal === bVal) return 0

      // Handle boolean for PQC coverage
      if (typeof aVal === 'boolean') {
        return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
      }

      // Handle Date sorting specifically
      if (sortColumn === 'date') {
        const dateA = new Date(String(aVal))
        const dateB = new Date(String(bVal))
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime()
      }

      const compareResult = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? compareResult : -compareResult
    })

    return processed
  }, [data, activeFilters, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)

  const handleExport = () => {
    if (filteredAndSortedData.length === 0) return

    const csv = Papa.unparse(filteredAndSortedData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `compliance_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Header: Search + Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, vendors, types..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar size={14} />
              Last Updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredAndSortedData.length === 0}
            className="gap-2"
          >
            <Download size={14} />
            Export CSV
          </Button>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw size={14} className={clsx(isRefreshing && 'animate-spin')} />
              Refresh Data
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-border overflow-hidden bg-card/50 relative min-h-[400px]">
        {/* Loading Overlay */}
        {(isFiltering || isRefreshing) && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center flex-col gap-3">
            <RefreshCw size={32} className="animate-spin text-primary" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium text-white">
                {isRefreshing ? 'Refreshing Data...' : 'Filtering Records...'}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.length.toLocaleString()} total verified
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                {/* Source Column with Filter */}
                <th scope="col" className="px-4 py-3 w-24 relative">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('source')}
                    >
                      <span>Source</span>
                      <ArrowUpDown
                        size={12}
                        className={clsx(sortColumn === 'source' ? 'text-primary' : 'opacity-30')}
                      />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowSourceMenu(!showSourceMenu)
                        }}
                        className={clsx(
                          'p-0.5 rounded hover:bg-muted',
                          sourceFilters.length > 0 && 'text-primary'
                        )}
                      >
                        <Filter size={12} />
                        {sourceFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                            {sourceFilters.length}
                          </span>
                        )}
                      </button>
                      {showSourceMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowSourceMenu(false)}
                            aria-hidden="true"
                          />
                          <div className="absolute left-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                              Select Source
                            </div>
                            {uniqueSources.map((src) => (
                              <button
                                type="button"
                                key={src}
                                onClick={() => handleToggleSourceFilter(src)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors text-left',
                                  sourceFilters.includes(src)
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              >
                                <div
                                  className={clsx(
                                    'w-3 h-3 rounded-[3px] border flex items-center justify-center',
                                    sourceFilters.includes(src)
                                      ? 'border-primary bg-primary'
                                      : 'border-border'
                                  )}
                                >
                                  {sourceFilters.includes(src) && (
                                    <Check size={10} className="text-primary-foreground" />
                                  )}
                                </div>
                                <span className="truncate">{src}</span>
                              </button>
                            ))}
                            {sourceFilters.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSourceFilters([])}
                                className="w-full text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Certification # Column */}
                <th
                  scope="col"
                  className="px-4 py-3 w-32 cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>Certification #</span>
                    <ArrowUpDown
                      size={12}
                      className={clsx(sortColumn === 'id' ? 'text-primary' : 'opacity-30')}
                    />
                  </div>
                </th>

                {/* Date Column */}
                <th
                  scope="col"
                  className="px-4 py-3 w-32 cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown
                      size={12}
                      className={clsx(sortColumn === 'date' ? 'text-primary' : 'opacity-30')}
                    />
                  </div>
                </th>

                {/* Product Name Column with Category Filter */}
                <th scope="col" className="px-4 py-3 w-80 relative">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('productName')}
                    >
                      <span>Product Name</span>
                      <ArrowUpDown
                        size={12}
                        className={clsx(
                          sortColumn === 'productName' ? 'text-primary' : 'opacity-30'
                        )}
                      />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowCategoryMenu(!showCategoryMenu)
                        }}
                        className={clsx(
                          'p-0.5 rounded hover:bg-muted',
                          categoryFilters.length > 0 && 'text-primary'
                        )}
                        title="Filter by Product Category"
                      >
                        <Filter size={12} />
                        {categoryFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                            {categoryFilters.length}
                          </span>
                        )}
                      </button>
                      {showCategoryMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowCategoryMenu(false)}
                            aria-hidden="true"
                          />
                          <div className="absolute left-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                              Product Categories
                            </div>
                            {uniqueCategories.map((cat) => (
                              <button
                                type="button"
                                key={cat}
                                onClick={() => handleToggleCategoryFilter(cat)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors text-left',
                                  categoryFilters.includes(cat)
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              >
                                <div
                                  className={clsx(
                                    'w-3 h-3 rounded-[3px] border flex items-center justify-center',
                                    categoryFilters.includes(cat)
                                      ? 'border-primary bg-primary'
                                      : 'border-border'
                                  )}
                                >
                                  {categoryFilters.includes(cat) && (
                                    <Check size={10} className="text-primary-foreground" />
                                  )}
                                </div>
                                <span className="truncate">{cat}</span>
                              </button>
                            ))}
                            {categoryFilters.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setCategoryFilters([])}
                                className="w-full text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Vendor Column with Filter */}
                <th scope="col" className="px-4 py-3 w-48 relative">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('vendor')}
                    >
                      <span>Vendor</span>
                      <ArrowUpDown
                        size={12}
                        className={clsx(sortColumn === 'vendor' ? 'text-primary' : 'opacity-30')}
                      />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowVendorMenu(!showVendorMenu)
                        }}
                        className={clsx(
                          'p-0.5 rounded hover:bg-muted',
                          vendorFilters.length > 0 && 'text-primary'
                        )}
                      >
                        <Filter size={12} />
                        {vendorFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                            {vendorFilters.length}
                          </span>
                        )}
                      </button>
                      {showVendorMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowVendorMenu(false)}
                            aria-hidden="true"
                          />
                          <div className="absolute left-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto flex flex-col">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                              Select Vendor
                            </div>
                            <Input
                              placeholder="Search vendors..."
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              className="h-8 text-xs mb-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 overflow-y-auto space-y-1">
                              {filteredVendors.map((v) => (
                                <button
                                  type="button"
                                  key={v}
                                  onClick={() => handleToggleVendorFilter(v)}
                                  className={clsx(
                                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors text-left',
                                    vendorFilters.includes(v)
                                      ? 'text-primary'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  <div
                                    className={clsx(
                                      'w-3 h-3 rounded-[3px] border flex items-center justify-center',
                                      vendorFilters.includes(v)
                                        ? 'border-primary bg-primary'
                                        : 'border-border'
                                    )}
                                  >
                                    {vendorFilters.includes(v) && (
                                      <Check size={10} className="text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="truncate">{v}</span>
                                </button>
                              ))}
                              {filteredVendors.length === 0 && (
                                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                                  No vendors found.
                                </div>
                              )}
                            </div>
                            {vendorFilters.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVendorFilters([])
                                  setVendorSearch('')
                                }}
                                className="w-full text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* PQC Column with Filter */}
                <th scope="col" className="px-4 py-3 w-20 relative">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>PQC</span>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowFilterMenu(!showFilterMenu)
                        }}
                        className={clsx(
                          'p-0.5 rounded hover:bg-muted',
                          pqcFilters.length > 0 && 'text-primary'
                        )}
                      >
                        <Filter size={12} />
                        {pqcFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                            {pqcFilters.length}
                          </span>
                        )}
                      </button>
                      {showFilterMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowFilterMenu(false)}
                            aria-hidden="true"
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                              PQC Algorithms
                            </div>
                            {PQC_ALGOS.map((algo) => (
                              <button
                                type="button"
                                key={algo}
                                onClick={() => handleTogglePqcFilter(algo)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors text-left',
                                  pqcFilters.includes(algo)
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              >
                                <div
                                  className={clsx(
                                    'w-3 h-3 rounded-[3px] border flex items-center justify-center',
                                    pqcFilters.includes(algo)
                                      ? 'border-primary bg-primary'
                                      : 'border-border'
                                  )}
                                >
                                  {pqcFilters.includes(algo) && (
                                    <Check size={10} className="text-primary-foreground" />
                                  )}
                                </div>
                                <span className="truncate">{algo}</span>
                              </button>
                            ))}
                            {pqcFilters.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setPqcFilters([])}
                                className="w-full text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Classical Algorithms Column */}
                <th scope="col" className="px-4 py-3 w-20">
                  <span>Classic</span>
                </th>

                {/* Details Column */}
                <th scope="col" className="px-4 py-3 w-10">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record, index) => (
                <ComplianceRow key={record.id} record={record} index={index} onEnrich={onEnrich} />
              ))}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No compliance records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination Controls */}
      {filteredAndSortedData.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} records
            {filteredAndSortedData.length !== data.length && (
              <span className="ml-1 text-muted-foreground">(filtered from {data.length})</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-card/50 border-input"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 text-xs font-mono bg-card/50 px-3 rounded border border-border">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-card/50 border-input"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
